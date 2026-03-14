import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getAllData, createRecord, updateRecord, deleteRecord } from '../services/googleSheetService';
import type { Equipment, Workshop, RepairRequest, User } from '../types';

interface DataContextType {
  equipments: Equipment[];
  workshops: Workshop[];
  repairRequests: RepairRequest[];
  transferRequests: any[];
  oilLogs: any[];
  locations: any[];
  users: User[];
  settings: any;
  loading: boolean;
  error: Error | null;
  refetchData: () => Promise<void>;
  createData: (sheetName: string, data: any) => Promise<void>;
  updateData: (sheetName: string, data: any) => Promise<void>;
  deleteData: (sheetName: string, id: string) => Promise<void>;
  lastJobCardNumber: number;
  setLastJobCardNumber: React.Dispatch<React.SetStateAction<number>>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [transferRequests, setTransferRequests] = useState<any[]>([]);
  const [oilLogs, setOilLogs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [lastJobCardNumber, setLastJobCardNumber] = useState<number>(262000);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const rawData = await getAllData();
      console.log('Raw data keys received:', Object.keys(rawData));
      
      // Helper to get data regardless of case
      const getSheetData = (name: string) => {
        const key = Object.keys(rawData).find(k => k.toLowerCase() === name.toLowerCase());
        return key ? rawData[key] : [];
      };

      const normalizeData = (data: any[]) => {
        if (!Array.isArray(data)) return [];
        return data.map(item => {
          const normalized: any = {};
          Object.keys(item).forEach(key => {
            // Map common variations to expected keys
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'id' || lowerKey === 'username' || lowerKey === 'userid') normalized.id = String(item[key]);
            else if (lowerKey === 'password' || lowerKey === 'pass') normalized.password = String(item[key]);
            else if (lowerKey === 'role') normalized.role = String(item[key]).toLowerCase();
            else if (lowerKey === 'status') normalized.status = String(item[key]).toLowerCase();
            else if (lowerKey === 'location' || lowerKey === 'branch') normalized.location = String(item[key]);
            else if (lowerKey === 'fullname' || lowerKey === 'name') normalized.fullName = String(item[key]);
            else normalized[key] = item[key];
          });
          return normalized;
        });
      };

      const equipmentsData = getSheetData('Equipments');
      const workshopsData = getSheetData('Workshops');
      const repairRequestsData = getSheetData('RepairRequests');
      const transferRequestsData = getSheetData('TransferRequests');
      const oilLogsData = getSheetData('OilLogs');
      const locationsData = getSheetData('Locations');
      const usersData = normalizeData(getSheetData('Users'));
      const settingsData = getSheetData('Settings');

      setEquipments(equipmentsData);
      setWorkshops(workshopsData);
      
      // De-duplicate repair requests by ID (preferring the last one in the list)
      const deDupedRepairRequests = (repairRequestsData || []).reduce((acc: RepairRequest[], curr: RepairRequest) => {
        const index = acc.findIndex(r => r.id === curr.id);
        if (index > -1) {
          acc[index] = curr;
        } else {
          acc.push(curr);
        }
        return acc;
      }, []);
      setRepairRequests(deDupedRepairRequests);
      
      setTransferRequests(transferRequestsData);
      setOilLogs(oilLogsData);
      setLocations(locationsData);
      setUsers(usersData);
      
      if (settingsData && Array.isArray(settingsData)) {
        const settingsObj: any = {};
        settingsData.forEach((s: any) => {
          if (s.Key) settingsObj[s.Key] = s.Value;
        });
        setSettings(settingsObj);

        // Calculate lastJobCardNumber from settings
        let maxId = 262000;
        const val = parseInt(settingsObj.lastJobCardNumber);
        if (!isNaN(val)) maxId = val;

        // Also check repair requests
        if (deDupedRepairRequests.length > 0) {
          const ids = deDupedRepairRequests.map(r => parseInt(r.id)).filter(id => !isNaN(id));
          if (ids.length > 0) {
            const currentMax = Math.max(...ids);
            if (currentMax > maxId) maxId = currentMax;
          }
        }
        setLastJobCardNumber(maxId);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Fetch Data Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createData = async (sheetName: string, data: any) => {
    await createRecord(data, sheetName);
    await fetchData();
  };

  const updateData = async (sheetName: string, data: any) => {
    await updateRecord(data, sheetName);
    await fetchData();
  };

  const deleteData = async (sheetName: string, id: string) => {
    await deleteRecord(id, sheetName);
    await fetchData();
  };

  return (
    <DataContext.Provider value={{
      equipments,
      workshops,
      repairRequests,
      transferRequests,
      oilLogs,
      locations,
      users,
      settings,
      loading,
      error,
      refetchData: fetchData,
      createData,
      updateData,
      deleteData,
      lastJobCardNumber,
      setLastJobCardNumber,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
