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
      setEquipmentToDelete(null); // Close modal
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
    // Construct payload with explicit key order to match sheet headers
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
      case 'myEquipments':
        return <EquipmentList 
            equipments={equipments} 
            addEquipment={handleCreateEquipment} 
            deleteEquipment={requestDeleteEquipment} 
            updateEquipment={(equipment) => updateData('Equipments', equipment)} 
            onTransfer={(eq) => setTransferEquipment(eq)}
            initialSearchQuery={searchEquipmentQuery}
            initialLocationFilter={currentUser?.location || ''}
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
      case 'history':
        return (
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">{t('history')}</h1>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex border-b">
                <button 
                  className={`px-6 py-3 text-sm font-medium ${historyTab === 'repair' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHistoryTab('repair')}
                >
                  {t('repairHistory')}
                </button>
                <button 
                  className={`px-6 py-3 text-sm font-medium ${historyTab === 'transfer' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHistoryTab('transfer')}
                >
                  {t('transferHistory')}
                </button>
                <button 
                  className={`px-6 py-3 text-sm font-medium ${historyTab === 'oil' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHistoryTab('oil')}
                >
                  {t('oilLogHistory')}
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectEquipmentToFilter')}</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder={t('searchByEquipmentOrSerial')}
                      value={searchHistoryEquipmentQuery}
                      onChange={(e) => setSearchHistoryEquipmentQuery(e.target.value)}
                      onFocus={() => setIsHistorySearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsHistorySearchFocused(false), 200)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                    {isHistorySearchFocused && searchHistoryEquipmentQuery.trim() && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                        <div 
                          className="p-3 border-b hover:bg-green-50 cursor-pointer text-gray-500 italic"
                          onClick={() => {
                            setSelectedHistoryEquipmentId('');
                            setSearchHistoryEquipmentQuery('');
                          }}
                        >
                          {t('allEquipment')}
                        </div>
                        {equipments
                          .filter(eq => 
                            String(eq.equipmentNumber || '').toLowerCase().includes(searchHistoryEquipmentQuery.toLowerCase()) ||
                            String(eq.serialNumber || '').toLowerCase().includes(searchHistoryEquipmentQuery.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((eq, index) => (
                            <div 
                              key={`${eq.id}-${index}`} 
                              onClick={() => {
                                setSelectedHistoryEquipmentId(eq.id);
                                setSearchHistoryEquipmentQuery(language === 'ar' ? (eq.arabicName ? `${eq.arabicName} ${eq.equipmentNumber}` : `${t(eq.equipmentType)} ${eq.equipmentNumber}`) : `${eq.equipmentNumber} (${t(eq.equipmentType)})`);
                              }}
                              className="p-3 border-b hover:bg-green-50 cursor-pointer"
                            >
                              <p className="font-semibold">
                                {language === 'ar' ? (eq.arabicName ? `${eq.arabicName} ${eq.equipmentNumber}` : `${t(eq.equipmentType)} ${eq.equipmentNumber}`) : `${eq.equipmentNumber} (${t(eq.equipmentType)})`}
                              </p>
                              <p className="text-sm text-gray-500">{eq.serialNumber}</p>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
                {historyTab === 'repair' && <HistoryView equipments={equipments} workshops={workshops} repairRequests={repairRequests} onUpdateRequest={handleUpdateRequest} selectedEquipmentId={selectedHistoryEquipmentId} />}
                {historyTab === 'transfer' && <TransferHistory selectedEquipmentId={selectedHistoryEquipmentId} />}
                {historyTab === 'oil' && <OilLogHistoryView selectedEquipmentId={selectedHistoryEquipmentId} />}
              </div>
            </div>
          </div>
        );
      case 'pending':
        return <PendingRequestsList repairRequests={repairRequests.filter(r => r.status === 'Pending' || r.status === 'Accepted')} onUpdateRequest={handleUpdateRequest} equipments={equipments} workshops={workshops} />;
      case 'completed':
        return <CompletedRequestsList repairRequests={repairRequests.filter(r => r.status === 'Completed')} equipments={equipments} workshops={workshops} />;
      case 'workshops':
        return <WorkshopList workshops={workshops} locations={locations} onAddWorkshop={handleCreateWorkshop} repairRequests={repairRequests} equipments={equipments} onUpdateWorkshop={(workshop) => updateData('Workshops', workshop)} onDeleteWorkshop={(id) => deleteData('Workshops', id)} />;
      case 'admin':
        return <AdminPanel users={users} />;
      case 'oilLog':
        return <OilLogView />;
      case 'locations':
        return <LocationList onSelectLocation={(locName) => {
            setInitialLocationFilter(locName);
            setSearchEquipmentQuery('');
            setActiveView('fleet');
        }} />;
      case 'transfers':
        return <TransferList />;
      case 'outsourcedLog':
        return <PendingRequestsList 
            repairRequests={repairRequests.filter(r => 
                r.applicationType === 'Outsourced / External Service' && 
                r.fromLocation === currentUser?.location &&
                r.fromLocation !== r.toLocation &&
                (r.status === 'Pending' || r.status === 'Accepted')
            )} 
            onUpdateRequest={handleUpdateRequest} 
            equipments={equipments} 
            workshops={workshops} 
            title={t('outsourcedRepairLog')}
        />;
      case 'dashboard':
      default:
        const pendingRequests = repairRequests.filter(r => r.status === 'Pending' || r.status === 'Accepted').length;
        const completedRequests = repairRequests.filter(r => r.status === 'Completed').length;

        const handleSelectEquipment = (eq: Equipment) => {
            setSelectedEquipment(eq);
            setSearchEquipmentQuery('');
            setIsSearchFocused(false);
        };

        const handleWhatsAppShare = (equipment: Equipment) => {
            const details = [
              `*Equipment Details*`,
              `${t('type')}: ${language === 'ar' && equipment.arabicName ? equipment.arabicName : t(equipment.equipmentType)}`,
              `${t('equipmentNumber')}: ${equipment.equipmentNumber}`,
              `${t('make')}: ${equipment.make}`,
              `${t('model')}: ${equipment.modelNumber}`,
              `${t('serialNumber')}: ${equipment.serialNumber}`,
              `${t('power')}: ${equipment.power || '-'}`,
              `${t('location')}: ${equipment.branchLocation}`
            ].join('\n');
        
            const encodedMessage = encodeURIComponent(details);
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        };

        const isHomeBranch = (branchLocation: string) => {
            if (!currentUser) return false;
            if (currentUser.role === 'admin') return true;
            // Allow all users to edit/transfer if branch is "To Be Determined/يُحدد لاحقاً"
            if (branchLocation === 'To Be Determined/يُحدد لاحقاً') return true;
            return currentUser.location === branchLocation;
        };

        const receivedRepairRequests = repairRequests.filter(r => 
            (r.status === 'Pending' || r.status === 'Accepted') && 
            r.toLocation === currentUser?.location && 
            r.fromLocation !== currentUser?.location &&
            r.applicationType === 'Outsourced / External Service'
        );

        const outsourcedRepairRequests = repairRequests.filter(r =>
            r.fromLocation === currentUser?.location &&
            r.fromLocation !== r.toLocation &&
            r.status !== 'Completed'
        );

        const receivedTransferRequests = transferRequests.filter(r => 
            r.status === 'Pending' && 
            r.toLocation === currentUser?.location
        );

        return (
            <div className="p-4 md:p-8">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">{t('dashboard_title')}</h1>

                {/* Notifications for received requests */}
                {(receivedRepairRequests.length > 0 || receivedTransferRequests.length > 0) && (
                    <div className="mb-6 space-y-2">
                        {receivedRepairRequests.length > 0 && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm animate-fade-in-up">
                                <div className="flex items-center">
                                    <WrenchScrewdriverIcon className="h-5 w-5 text-green-500 me-3" />
                                    <p className="text-green-700 font-bold">
                                        {language === 'ar' 
                                            ? `لديك ${receivedRepairRequests.length} طلبات إصلاح واردة جديدة!` 
                                            : `You have ${receivedRepairRequests.length} new incoming repair requests!`}
                                    </p>
                                </div>
                            </div>
                        )}
                        {receivedTransferRequests.length > 0 && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm animate-fade-in-up">
                                <div className="flex items-center">
                                    <TruckIcon className="h-5 w-5 text-green-500 me-3" />
                                    <p className="text-green-700 font-bold">
                                        {language === 'ar' 
                                            ? `لديك ${receivedTransferRequests.length} طلبات تحويل واردة جديدة!` 
                                            : `You have ${receivedTransferRequests.length} new incoming transfer requests!`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
                    {!selectedEquipment ? (
                        <>
                            <h2 className="text-xl font-bold text-green-600 mb-1">{t('dashboard_findJobCard')}</h2>
                            <p className="text-gray-500 mb-4 text-sm font-medium">Search by Equipment number or Serial Number</p>
                            <form onSubmit={handleEquipmentSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 relative">
                            <div className="relative w-full">
                              <input 
                                  type="search" 
                                  placeholder="Search by Equipment or Serial Number"
                                  value={searchEquipmentQuery} 
                                  onChange={(e) => setSearchEquipmentQuery(e.target.value)}
                                  onFocus={() => setIsSearchFocused(true)}
                                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              />
                              {isSearchFocused && searchEquipmentQuery.trim() && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                  {equipments
                                    .filter(eq => 
                                      String(eq.equipmentNumber || '').toLowerCase().includes(searchEquipmentQuery.toLowerCase()) ||
                                      String(eq.serialNumber || '').toLowerCase().includes(searchEquipmentQuery.toLowerCase())
                                    )
                                    .sort((a, b) => {
                                      const aEq = String(a.equipmentNumber || '').toLowerCase();
                                      const bEq = String(b.equipmentNumber || '').toLowerCase();
                                      const query = String(searchEquipmentQuery || '').toLowerCase();
                                      if (aEq === query && bEq !== query) return -1;
                                      if (bEq === query && aEq !== query) return 1;
                                      if (aEq.startsWith(query) && !bEq.startsWith(query)) return -1;
                                      if (bEq.startsWith(query) && !aEq.startsWith(query)) return 1;
                                      return 0;
                                    })
                                    .slice(0, 10)
                                    .map((eq, index) => (
                                      <div 
                                        key={`${eq.id}-${index}`} 
                                        onClick={() => handleSelectEquipment(eq)}
                                        className="p-3 border-b hover:bg-green-50 cursor-pointer"
                                      >
                                        <p className="font-semibold">
                                          {language === 'ar' ? (eq.arabicName ? `${eq.arabicName} ${eq.equipmentNumber}` : `${t(eq.equipmentType)} ${eq.equipmentNumber}`) : `${eq.equipmentNumber} (${t(eq.equipmentType)})`}
                                        </p>
                                        <p className="text-sm text-gray-500">{eq.serialNumber}</p>
                                      </div>
                                    ))
                                  }
                                  {equipments.filter(eq => 
                                      String(eq.equipmentNumber || '').toLowerCase().includes(searchEquipmentQuery.toLowerCase()) ||
                                      String(eq.serialNumber || '').toLowerCase().includes(searchEquipmentQuery.toLowerCase())
                                    ).length === 0 && (
                                    <div className="p-3 text-center text-gray-500">
                                      {t('noEquipmentFound')}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center shrink-0 font-bold">
                                <SearchIcon className="h-5 w-5 me-2" />
                                {t('search')}
                            </button>
                            </form>
                        </>
                    ) : (
                        <EquipmentDetailsView
                            equipment={selectedEquipment}
                            repairRequests={repairRequests}
                            oilLogs={oilLogs}
                            onBack={() => setSelectedEquipment(null)}
                            onEdit={(eq) => {
                                setSearchEquipmentQuery(eq.equipmentNumber);
                                setActiveView('fleet');
                            }}
                            onTransfer={(eq) => setTransferEquipment(eq)}
                            onDelete={(id) => requestDeleteEquipment(id)}
                            onWhatsAppShare={handleWhatsAppShare}
                            onNewRepairRequest={() => setActiveView('request')}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    <button onClick={() => setActiveView('pending')} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-green-600 mb-2">{t('receivedRepairRequest')}</h3>
                        <p className="text-3xl font-black text-gray-800">{receivedRepairRequests.length}</p>
                    </button>
                    <button onClick={() => setActiveView('outsourcedLog')} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-orange-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-orange-600 mb-2">{t('outsourcedRepairLog')}</h3>
                        <p className="text-3xl font-black text-gray-800">{outsourcedRepairRequests.length}</p>
                    </button>
                    <button onClick={() => setActiveView('transfers')} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-green-600 mb-2">{t('receivedTransferRequests')}</h3>
                        <p className="text-3xl font-black text-gray-800">{receivedTransferRequests.length}</p>
                    </button>
                    <button onClick={() => {
                        setHistoryTab('oil');
                        setActiveView('history');
                    }} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-teal-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-teal-600 mb-2">{t('oilLogHistory')}</h3>
                        <p className="text-3xl font-black text-gray-800">{oilLogs.length}</p>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    <button onClick={() => setActiveView('fleet')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-green-100 p-3 rounded-full">
                            <TruckIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_totalEquipment')}</p>
                            <p className="text-2xl font-bold text-gray-800">{equipments.length}</p>
                        </div>
                    </button>
                    <button onClick={() => setActiveView('pending')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_pendingRequests')}</p>
                            <p className="text-2xl font-bold text-gray-800">{pendingRequests}</p>
                        </div>
                    </button>
                     <button onClick={() => setActiveView('completed')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-green-100 p-3 rounded-full">
                            <WrenchScrewdriverIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_completedRequests')}</p>
                            <p className="text-2xl font-bold text-gray-800">{completedRequests}</p>
                        </div>
                    </button>
                    <button onClick={() => setActiveView('workshops')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-green-100 p-3 rounded-full">
                            <BuildingStorefrontIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_totalWorkshops')}</p>
                            <p className="text-2xl font-bold text-gray-800">{workshops.length}</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading Data...</h1>
                <p className="text-gray-600">Please wait while we fetch the latest information from your workshop records.</p>
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 text-center bg-white rounded-xl shadow-lg max-w-lg mx-4">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
                <p className="mb-6 text-gray-700">{error.message}</p>
                <button 
                    onClick={() => refetchData()} 
                    className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
                >
                    Try Again
                </button>
                <div className="mt-8 text-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-mono text-xs text-gray-500">
                        Please check your Google Sheet URL and ensure the following tabs exist: 
                        Equipments, RepairRequests, Workshops, OilLogs, Users, Locations
                    </p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={(view) => {
          if (view !== 'fleet') {
            setInitialLocationFilter('');
          }
          setActiveView(view);
          setIsSidebarOpen(false);
        }} 
        onChangePasswordClick={() => {
          setIsChangePasswordModalOpen(true);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm h-16 flex items-center px-4 shrink-0 z-20">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 ms-4">{t('repairSystem')}</h1>
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          {renderView()}
        </main>
      </div>
      {foundRequest && (
        <JobCard 
            request={foundRequest}
            equipment={equipments.find(v => v.id === foundRequest.equipmentId)!}
            workshops={workshops}
            onClose={() => setFoundRequest(null)}
        />
      )}
      {equipmentToDelete && (
        <DeleteConfirmationModal
          equipment={equipmentToDelete}
          onConfirm={confirmDeleteEquipment}
          onCancel={cancelDeleteEquipment}
          associatedRequestsCount={repairRequests.filter(r => r.equipmentId === equipmentToDelete.id).length}
        />
      )}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordModalOpen(false)} />
      )}
      
      {transferEquipment && (
        <TransferFormModal 
          equipment={transferEquipment} 
          onClose={() => setTransferEquipment(null)} 
          onSave={handleTransferRequest} 
        />
      )}
    </div>
  );
};




const App: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <AppContent />;
};

export default App;
