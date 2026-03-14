import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Equipment, Workshop, RepairRequest, OilLog, User, Settings, Location, TransferRequest } from '../types';
import { getAllData, createRecord, updateRecord, deleteRecord } from '../services/googleSheetService';

interface DataContextType {
  equipments: Equipment[];
  workshops: Workshop[];
  repairRequests: RepairRequest[];
  transferRequests: TransferRequest[];
  oilLogs: OilLog[];
  users: User[];
  locations: Location[];
  settings: Settings | null;
  loading: boolean;
  error: Error | null;
  refetchData: () => Promise<void>;
  createData: (sheetName: string, payload: any) => Promise<any>;
  updateData: (sheetName: string, payload: any) => Promise<any>;
  deleteData: (sheetName: string, id: string) => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [oilLogs, setOilLogs] = useState<OilLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllData();
      
      const findKey = (search: string) => {
        const keys = Object.keys(data);
        const exact = keys.find(k => k === search);
        if (exact) return exact;
        const caseInsensitive = keys.find(k => k.toLowerCase() === search.toLowerCase());
        if (caseInsensitive) return caseInsensitive;
        const singularPlural = keys.find(k => k.toLowerCase().replace(/s$/, '') === search.toLowerCase().replace(/s$/, ''));
        if (singularPlural) return singularPlural;
        return null;
      };

      const eqKey = findKey('Equipments') || 'Equipments';
      const wsKey = findKey('Workshops') || 'Workshops';
      const rrKey = findKey('RepairRequests') || 'RepairRequests';
      const olKey = findKey('OilLogs') || 'OilLogs';
      const trKey = findKey('TransferRequests') || 'TransferRequests';
      const usKey = findKey('Users') || 'Users';
      const locKey = findKey('Locations') || 'Locations';
      const stKey = findKey('Settings') || 'Settings';

      console.log('Detected Keys:', { eqKey, wsKey, rrKey, olKey, usKey, locKey, stKey });
      console.log('Available Sheets in Data:', Object.keys(data));

      setEquipments(data[eqKey] || []);
      setWorkshops(data[wsKey] || []);
      
      const rawRequests = data[rrKey] || [];
      const parsedRequests = rawRequests.map((req: any) => {
          try {
            let faults = [];
            const rawFaults = req.faults;
            if (typeof rawFaults === 'string') {
                const trimmed = rawFaults.trim();
                if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                    faults = JSON.parse(trimmed);
                } else if (trimmed) {
                    // If it's a plain string, treat it as a single fault description
                    faults = [{ id: crypto.randomUUID(), description: trimmed, workshopId: req.workshopId || '' }];
                }
            } else if (Array.isArray(rawFaults)) {
                faults = rawFaults;
            }
            
            // Ensure faults is an array
            const finalFaults = Array.isArray(faults) ? faults : [faults];
            return { ...req, faults: finalFaults } as RepairRequest;
          } catch (e) {
            console.error(`Failed to parse faults for request ${req.id}:`, req.faults);
            return { ...req, faults: [] } as RepairRequest; 
          }
        });
      setRepairRequests(parsedRequests);
      setTransferRequests(data[trKey] || []);
      
      const rawOilLogs = data[olKey] || [];
      const parsedOilLogs = rawOilLogs.map((log: any) => {
          try {
              let oilTypes = [];
              if (typeof log.oilTypes === 'string') {
                  const trimmed = log.oilTypes.trim();
                  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                      oilTypes = JSON.parse(trimmed);
                  } else if (trimmed) {
                      oilTypes = [trimmed];
                  }
              } else if (Array.isArray(log.oilTypes)) {
                  oilTypes = log.oilTypes;
              }

              let filters = [];
              if (typeof log.filters === 'string') {
                  const trimmed = log.filters.trim();
                  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                      filters = JSON.parse(trimmed);
                  } else if (trimmed) {
                      filters = [trimmed];
                  }
              } else if (Array.isArray(log.filters)) {
                  filters = log.filters;
              }

              return {
                  ...log,
                  oilTypes: Array.isArray(oilTypes) ? oilTypes : [oilTypes],
                  filters: Array.isArray(filters) ? filters : [filters]
              } as OilLog;
          } catch (e) {
              console.error(`Failed to parse oil log ${log.id}:`, e);
              return { ...log, oilTypes: [], filters: [] } as OilLog;
          }
      });
      setOilLogs(parsedOilLogs);
      
      const rawUsers = data[usKey] || [];
      const parsedUsers = rawUsers.map((u: any) => {
        // Map common header variations to expected keys
        const id = String(u.id || u.userId || u['User ID'] || u.name || '').trim();
        const password = String(u.password || u.Password || u.pass || '').trim();
        const role = String(u.role || u.Role || 'user').trim();
        const status = String(u.status || u.Status || 'pending').trim();
        const location = u.location || u.Location || '';
        return { id, password, role, status: status.toLowerCase(), location };
      });
      setUsers(parsedUsers);
      
      const rawLocations = data[locKey] || [];
      const parsedLocations = rawLocations.map((loc: any) => ({
          ...loc,
          hasWorkshop: String(loc.hasWorkshop).toUpperCase() === 'TRUE' || loc.hasWorkshop === true || loc.hasWorkshop === 1 || loc.hasWorkshop === '1'
      }));
      setLocations(parsedLocations);
      
      setSettings(data[stKey] || null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createData = async (sheetName: string, payload: any) => {
    const result = await createRecord(payload, sheetName);
    await fetchData(); // Refetch all data to stay in sync
    return result;
  };

  const updateData = async (sheetName: string, payload: any) => {
    const result = await updateRecord(payload, sheetName);
    await fetchData();
    return result;
  };

  const deleteData = async (sheetName: string, id: string) => {
    const result = await deleteRecord(id, sheetName);
    await fetchData();
    return result;
  };

  const value = {
    equipments,
    workshops,
    repairRequests,
    transferRequests,
    oilLogs,
    users,
    locations,
    settings,
    loading,
    error,
    refetchData: fetchData,
    createData,
    updateData,
    deleteData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
