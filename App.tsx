import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EquipmentList } from './components/FleetList';
import { RepairRequestView } from './components/RepairRequestView';
import { HistoryView } from './components/HistoryView';

import type { Equipment, Workshop, RepairRequest, User } from './types';
import { WrenchScrewdriverIcon, TruckIcon, BuildingStorefrontIcon, SearchIcon, Bars3Icon } from './components/Icons';
import { PendingRequestsList } from './components/PendingRequestsList';
import { WorkshopList } from './components/WorkshopList';
import { CompletedRequestsList } from './components/CompletedRequestsList';
import { JobCard } from './components/JobCard';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

import { useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { useTranslation } from './hooks/useTranslation';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { OilLogView } from './components/OilLogView';
import { OilLogHistoryView } from './components/OilLogHistoryView';
import { EquipmentDetailsView } from './components/EquipmentDetailsView';
import { LocationList } from './components/LocationList';
import { TransferFormModal } from './components/TransferFormModal';
import { TransferList } from './components/TransferList';
import { TransferHistory } from './components/TransferHistory';
import { getAllData, createRecord, updateRecord, deleteRecord } from './services/googleSheetService';

type View = 'dashboard' | 'fleet' | 'request' | 'history' | 'pending' | 'workshops' | 'completed' | 'admin' | 'oilLog' | 'locations' | 'transfers' | 'outsourcedLog';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Default value
  const [lastJobCardNumber, setLastJobCardNumber] = useState<number>(262000);

  const [searchEquipmentQuery, setSearchEquipmentQuery] = useState('');
  const [initialLocationFilter, setInitialLocationFilter] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'details' | 'repair' | 'oil'>('details');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [foundRequest, setFoundRequest] = useState<RepairRequest | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [transferEquipment, setTransferEquipment] = useState<Equipment | null>(null);
  const [historyTab, setHistoryTab] = useState<'repair' | 'transfer' | 'oil'>('repair');
  const [selectedHistoryEquipmentId, setSelectedHistoryEquipmentId] = useState('');
  const [searchHistoryEquipmentQuery, setSearchHistoryEquipmentQuery] = useState('');
  const [isHistorySearchFocused, setIsHistorySearchFocused] = useState(false);


  const { language } = useLanguage();
  const { t } = useTranslation();
  const { users, setUsers, currentUser } = useAuth();
  
  const {
    equipments,
    workshops,
    repairRequests,
    transferRequests,
    oilLogs,
    locations,
    loading,
    error,
    refetchData,
    createData,
    updateData,
    deleteData,
  } = useData();

  // Job Card Number Sync karne ka logic
  useEffect(() => {
    if (repairRequests && repairRequests.length > 0) {
      const allNumbers = repairRequests.map(req => {
          const num = Number(req.jobCardNumber);
          return isNaN(num) ? 0 : num;
      });
      const maxNumber = Math.max(...allNumbers);
      
      if (maxNumber > 0) {
        setLastJobCardNumber(maxNumber);
      }
    }
  }, [repairRequests]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const handleEquipmentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEquipmentQuery.trim()) return;

    const found = equipments.some(eq => 
      String(eq.equipmentNumber || '').toLowerCase().includes(String(searchEquipmentQuery || '').toLowerCase()) ||
      String(eq.serialNumber || '').toLowerCase().includes(String(searchEquipmentQuery || '').toLowerCase())
    );

    if (found) {
        setActiveView('fleet');
    } else {
        alert(t('alert_equipmentNotFound', { query: searchEquipmentQuery }));
        setSearchEquipmentQuery('');
    }
  };

  const requestDeleteEquipment = (equipmentId: string) => {
    const equipment = equipments.find(v => v.id === equipmentId);
    if (equipment) {
      setEquipmentToDelete(equipment);
    }
  };

  const confirmDeleteEquipment = async () => {
    if (!equipmentToDelete) return;
    try {
      await deleteData('Equipments', equipmentToDelete.id);
      alert(t('alert_equipmentDeleted', { equipmentNumber: equipmentToDelete.equipmentNumber }));
      setEquipmentToDelete(null); 
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      alert('Failed to delete equipment.');
    }
  };

  const cancelDeleteEquipment = () => {
    setEquipmentToDelete(null);
  };

  const handleCreateWorkshop = async (workshop: Omit<Workshop, 'id'>) => {
    const newWorkshop = { ...workshop, id: crypto.randomUUID() };
    await createData('Workshops', newWorkshop);
  };

  const handleCreateEquipment = async (equipment: Omit<Equipment, 'id'>) => {
    if (equipments.some(e => e.serialNumber === equipment.serialNumber)) {
       alert(t('alert_serialExists'));
       throw new Error('Serial number exists');
    }
    const newEquipment: Equipment = { ...equipment, id: crypto.randomUUID() };
    return await createData('Equipments', newEquipment);
  };

  const handleTransferRequest = async (request: any) => {
    await createData('TransferRequests', {
      ...request,
      id: crypto.randomUUID(),
      status: 'Pending',
      requestDate: new Date().toISOString()
    });
  };

  const handleUpdateRequest = async (updatedRequest: RepairRequest) => {
    const payload = {
      id: updatedRequest.id,
      equipmentId: updatedRequest.equipmentId,
      driverName: updatedRequest.driverName,
      mileage: updatedRequest.mileage || '',
      purpose: updatedRequest.purpose,
      faults: JSON.stringify(updatedRequest.faults),
      dateIn: updatedRequest.dateIn,
      timeIn: updatedRequest.timeIn,
      status: updatedRequest.status,
      workshopId: updatedRequest.workshopId || '',
      dateOut: updatedRequest.dateOut || '',
      timeOut: updatedRequest.timeOut || '',
      workDone: updatedRequest.faults.map(f => f.workDone || '').filter(Boolean).join('; '),
      partsUsed: updatedRequest.faults.flatMap(f => f.partsUsed || []).map(p => `${p.name} (${p.quantity})`).join(', ')
    };
    await updateData('RepairRequests', payload);
  };


  const renderView = () => {
    switch (activeView) {
      case 'fleet':
        return <EquipmentList 
            equipments={equipments} 
            addEquipment={handleCreateEquipment} 
            deleteEquipment={requestDeleteEquipment} 
            updateEquipment={(equipment) => updateData('Equipments', equipment)} 
            onTransfer={(eq) => setTransferEquipment(eq)}
            initialSearchQuery={searchEquipmentQuery}
            initialLocationFilter={initialLocationFilter}
            onNewRepairRequest={(id) => setActiveView('request')}
        />;
      case 'request':
        return <RepairRequestView 
            equipments={equipments} 
            workshops={workshops} 
            repairRequests={repairRequests}
            lastJobCardNumber={lastJobCardNumber}
            setLastJobCardNumber={setLastJobCardNumber}
            onAddEquipment={handleCreateEquipment}
            onAddWorkshop={handleCreateWorkshop}
        />;
      default:
        return <div className="p-8">Select a view from the sidebar.</div>;
    }
  };

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
      <main className="flex-1 overflow-y-auto relative">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
           <button onClick={() => setIsSidebarOpen(true)} className="md:hidden">
              <Bars3Icon className="h-6 w-6" />
           </button>
           <div className="flex-1 max-w-xl mx-4">
              <form onSubmit={handleEquipmentSearch} className="relative">
                <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={searchEquipmentQuery}
                  onChange={(e) => setSearchEquipmentQuery(e.target.value)}
                />
              </form>
           </div>
        </header>
        {renderView()}
      </main>
      
      {equipmentToDelete && (
        <DeleteConfirmationModal 
          onConfirm={confirmDeleteEquipment} 
          onCancel={cancelDeleteEquipment} 
          itemName={equipmentToDelete.equipmentNumber}
        />
      )}
    </div>
  );
};


export default App;
