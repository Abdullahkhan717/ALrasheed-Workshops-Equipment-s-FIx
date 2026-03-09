import React, { useState } from 'react';
import type { Equipment, Workshop, RepairRequest, Fault } from '../types';
import { NewEquipmentForm } from './NewVehicleForm';
import { NewWorkshopForm } from './NewWorkshopForm';
import { NewLocationForm } from './NewLocationForm';
import { JobCard } from './JobCard';
import { DuplicateRequestModal } from './DuplicateRequestModal';
import { PlusIcon, TrashIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

interface RepairRequestViewProps {
  equipments: Equipment[];
  workshops: Workshop[];
  repairRequests: RepairRequest[];
  lastJobCardNumber: number;
  setLastJobCardNumber: React.Dispatch<React.SetStateAction<number>>;
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => Promise<Equipment | void>;
  onAddWorkshop: (workshop: Omit<Workshop, 'id'>) => Promise<void>;
}

export const RepairRequestView: React.FC<RepairRequestViewProps> = ({ equipments, workshops, repairRequests, lastJobCardNumber, setLastJobCardNumber, onAddEquipment, onAddWorkshop }) => {
  const { createData, updateData, locations } = useData();
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [mileage, setMileage] = useState('');
  const [purpose, setPurpose] = useState<'Repairing' | 'preparing for work' | 'General Checking' | 'Other' | 'Oil Change' | 'Tyre Change'>('Repairing');
  const [requestType, setRequestType] = useState<'repair' | 'oil' | 'tyre'>('repair');
  const [fromLocation, setFromLocation] = useState(currentUser?.location || '');
  const [toLocation, setToLocation] = useState(currentUser?.location || '');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [faults, setFaults] = useState<Fault[]>([{ id: crypto.randomUUID(), description: '', workshopId: '', mechanicName: '' }]);
  
  const [selectedOils, setSelectedOils] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [customOil, setCustomOil] = useState('');
  const [customFilter, setCustomFilter] = useState('');
  
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [jobCardRequest, setJobCardRequest] = useState<RepairRequest | null>(null);
  const [jobCardEquipment, setJobCardEquipment] = useState<Equipment | null>(null);

  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [pendingRequestForDupCheck, setPendingRequestForDupCheck] = useState<RepairRequest | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  const handleAddFault = () => {
    if (faults.length < 10) {
      setFaults([...faults, { id: crypto.randomUUID(), description: '', workshopId: '', mechanicName: '' }]);
    }
  };

  const handleRemoveFault = (id: string) => {
    if (faults.length > 1) {
      setFaults(faults.filter(fault => fault.id !== id));
    }
  };

  const handleFaultFieldChange = (id: string, field: 'description' | 'workshopId' | 'mechanicName', value: string) => {
    if (field === 'workshopId' && value === 'addNew') {
        setShowWorkshopModal(true);
        return;
    }
    setFaults(faults.map(fault => fault.id === id ? { ...fault, [field]: value } : fault));
  };
  
  const handleAddEquipment = async (equipment: Omit<Equipment, 'id'>) => {
    try {
      const newEquipment = await onAddEquipment(equipment);
      if (newEquipment) {
        setSelectedEquipmentId(newEquipment.id);
        setShowEquipmentModal(false);
        alert(t('alert_newEquipmentAdded'));
      }
    } catch (error) {
      // Error is already alerted in the parent component
      console.error(error);
    }
  };
  
  const handleAddWorkshop = async (workshop: Omit<Workshop, 'id'>) => {
    try {
      await onAddWorkshop(workshop);
      setShowWorkshopModal(false);
      alert(t('alert_workshopAdded'));
    } catch (error) {
      console.error(error);
    }
  };
  
  const resetForm = () => {
    setSelectedEquipmentId('');
    setSearchQuery('');
    setDriverName('');
    setMileage('');
    setPurpose('Repairing');
    setFaults([{ id: crypto.randomUUID(), description: '', workshopId: '', mechanicName: '' }]);
    setSelectedOils([]);
    setSelectedFilters([]);
    setCustomOil('');
    setCustomFilter('');
    setEditingRequestId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipmentId) {
      alert(t('alert_selectEquipment'));
      return;
    }
    if (!driverName.trim()) {
      alert(t('alert_enterDriverName'));
      return;
    }

    let finalFaults: Fault[] = [];
    let finalPurpose = purpose;

    if (requestType === 'oil') {
      const oilList = selectedOils.map(o => o === 'Other' ? customOil : o).filter(Boolean);
      const filterList = selectedFilters.map(f => f === 'Other' ? customFilter : f).filter(Boolean);
      
      const now = new Date();
      const oilLogPayload = {
        id: crypto.randomUUID(),
        equipmentId: selectedEquipmentId,
        driverName,
        mileage,
        location: fromLocation || currentUser?.location || '',
        oilTypes: JSON.stringify(oilList),
        filters: JSON.stringify(filterList),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString()
      };

      createData('OilLogs', oilLogPayload)
        .then(() => {
          alert(t('oilLog_success') || 'Oil change record saved successfully.');
          resetForm();
        })
        .catch(error => {
          console.error("Failed to save oil log:", error);
          alert('Failed to save oil log to Google Sheet.');
        });
      return;
    }

    const faultsWithDescription = faults.filter(f => f.description.trim());
    if (faultsWithDescription.length === 0) {
      alert(t('alert_addFault'));
      return;
    }
    const hasMissingWorkshop = faultsWithDescription.some(f => !f.workshopId);
    if (hasMissingWorkshop) {
      alert(t('alert_selectWorkshopForEachFault'));
      return;
    }
    finalFaults = faultsWithDescription;

    if (editingRequestId) {
        const updatedRequestData = {
            driverName,
            purpose: finalPurpose,
            mileage,
            faults: finalFaults,
        };
        const originalRequest = repairRequests.find(r => r.id === editingRequestId);
        if (originalRequest) {
            const updatedRequest = { ...originalRequest, ...updatedRequestData, workshopId: updatedRequestData.faults[0]?.workshopId || originalRequest.workshopId };
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
              applicationStatus: updatedRequest.applicationStatus || 'Pending',
              workshopId: updatedRequest.workshopId || '',
              createdBy: updatedRequest.createdBy || currentUser?.id || '',
              fromLocation: updatedRequest.fromLocation || '',
              toLocation: updatedRequest.toLocation || '',
              rejectionReason: updatedRequest.rejectionReason || '',
              dateOut: updatedRequest.dateOut || '',
              timeOut: updatedRequest.timeOut || '',
              workDone: updatedRequest.faults.map(f => f.workDone || '').filter(Boolean).join('; '),
              partsUsed: updatedRequest.faults.flatMap(f => f.partsUsed || []).map(p => `${p.name} (${p.quantity})`).join(', ')
            };
            updateData('RepairRequests', payload)
                .then(() => {
                    alert(t('alert_jobCardUpdated', { jobCardId: editingRequestId }));
                    setJobCardEquipment(equipments.find(e => e.id === updatedRequest.equipmentId) || null);
                    setJobCardRequest(updatedRequest);
                    resetForm();
                })
                .catch(error => {
                    console.error("Failed to update repair request:", error);
                    alert('Failed to save the updated request to Google Sheet.');
                });
        }
    } else {
        const newJobCardNumber = lastJobCardNumber + 1;
        setLastJobCardNumber(newJobCardNumber);

        const now = new Date();
        const appType = fromLocation === toLocation ? 'Internal Repair Order (IRO)' : 'Outsourced / External Service';
        const newRequest: RepairRequest = {
          id: String(newJobCardNumber),
          equipmentId: selectedEquipmentId,
          driverName,
          mileage,
          purpose: finalPurpose,
          faults: finalFaults,
          dateIn: now.toLocaleDateString(),
          timeIn: now.toLocaleTimeString(),
          status: 'Pending',
          applicationStatus: 'Pending',
          workshopId: finalFaults[0]?.workshopId || '',
          createdBy: currentUser?.id || '',
          fromLocation: fromLocation || currentUser?.location || '',
          toLocation: toLocation || '',
          applicationType: appType,
        };
        
        const payload = {
          id: String(newJobCardNumber),
          equipmentId: selectedEquipmentId,
          driverName,
          mileage: mileage || '',
          purpose: finalPurpose,
          faults: JSON.stringify(finalFaults),
          dateIn: now.toLocaleDateString(),
          timeIn: now.toLocaleTimeString(),
          status: 'Pending',
          applicationStatus: 'Pending',
          workshopId: finalFaults[0]?.workshopId || '',
          createdBy: currentUser?.id || '',
          fromLocation: fromLocation || currentUser?.location || '',
          toLocation: toLocation || '',
          applicationType: appType,
          rejectionReason: '',
          dateOut: '',
          timeOut: '',
          workDone: '',
          partsUsed: ''
        };
        createData('RepairRequests', payload)
          .then(() => {
            alert(t('alert_jobCardCreated', { jobCardId: newJobCardNumber }));
            setJobCardEquipment(equipments.find(e => e.id === newRequest.equipmentId) || null);
            setJobCardRequest(newRequest);
            resetForm();
          })
          .catch(error => {
            console.error("Failed to create repair request:", error);
            alert('Failed to save the new request to Google Sheet.');
            // Rollback the job card number if the save fails
            setLastJobCardNumber(prev => prev - 1);
          });
    }
  };
  
  const searchResults = equipments
    .filter(e => {
        // Restriction: User can only request for their own branch equipment
        if (currentUser?.role !== 'admin') {
            const mergedBranches = ['Marhaba/المرحبہ', 'Al hasa/الاحساء'];
            const userLoc = currentUser?.location || '';
            const eqLoc = e.branchLocation || '';
            
            const isMerged = mergedBranches.includes(userLoc) && mergedBranches.includes(eqLoc);
            const isSame = userLoc === eqLoc;
            const isTBD = eqLoc === 'To Be Determined/يُحدد لاحقاً';

            if (!isMerged && !isSame && !isTBD) return false;
        }

        return String(e.equipmentNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
               String(e.serialNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
               String(e.arabicName || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
    })
    .sort((a, b) => {
      const aEq = String(a.equipmentNumber || '').toLowerCase();
      const bEq = String(b.equipmentNumber || '').toLowerCase();
      const query = String(searchQuery || '').toLowerCase();
      
      if (aEq === query && bEq !== query) return -1;
      if (bEq === query && aEq !== query) return 1;
      if (aEq.startsWith(query) && !bEq.startsWith(query)) return -1;
      if (bEq.startsWith(query) && !aEq.startsWith(query)) return 1;
      return 0;
    });

  const handleSelectEquipment = (equipmentId: string) => {
    const pendingRequests = repairRequests.filter(r => r.equipmentId === equipmentId && r.status === 'Pending');
    if (pendingRequests.length > 0) {
        setPendingRequestForDupCheck(pendingRequests[0]);
        setShowDuplicateModal(true);
    } else {
        setSelectedEquipmentId(equipmentId);
        setSearchQuery('');
    }
    setIsSearchFocused(false);
  };

  const handleCreateNewRequest = () => {
    if (pendingRequestForDupCheck) {
        setSelectedEquipmentId(pendingRequestForDupCheck.equipmentId);
    }
    setShowDuplicateModal(false);
    setPendingRequestForDupCheck(null);
    setSearchQuery('');
  };

  const handleAddFaultToExisting = () => {
    if (pendingRequestForDupCheck) {
        setEditingRequestId(pendingRequestForDupCheck.id);
        setSelectedEquipmentId(pendingRequestForDupCheck.equipmentId);
        setDriverName(pendingRequestForDupCheck.driverName);
        setPurpose(pendingRequestForDupCheck.purpose);
        setFaults(pendingRequestForDupCheck.faults);
        setMileage(pendingRequestForDupCheck.mileage || '');
        setFromLocation(pendingRequestForDupCheck.fromLocation || '');
        setToLocation(pendingRequestForDupCheck.toLocation || '');
    }
    setShowDuplicateModal(false);
    setPendingRequestForDupCheck(null);
    setSearchQuery('');
  };

  const selectedEquipment = equipments.find(e => e.id === selectedEquipmentId);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">{t('newRepairRequest')}</h1>

      {jobCardRequest && jobCardEquipment && (
        <JobCard 
            request={jobCardRequest} 
            equipment={jobCardEquipment}
            workshops={workshops}
            onClose={() => {
                setJobCardRequest(null);
                setJobCardEquipment(null);
            }}
        />
      )}

      {showDuplicateModal && pendingRequestForDupCheck && (
        <DuplicateRequestModal
            request={pendingRequestForDupCheck}
            equipment={equipments.find(e => e.id === pendingRequestForDupCheck.equipmentId)!}
            onClose={() => setShowDuplicateModal(false)}
            onCreateNew={handleCreateNewRequest}
            onAddFault={handleAddFaultToExisting}
        />
       )}


      <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-xl shadow-md space-y-8">
        
        <div className="border-b pb-8">
            {!selectedEquipment ? (
                <div>
                    <h2 className="text-xl font-bold text-green-600 mb-1">1. Find Equipment</h2>
                    <p className="text-gray-500 mb-4 text-sm font-medium">Search by Equipment number or Serial Number</p>
                    <div className="relative">
                        <div className="relative">
                          <input
                              type="text"
                              id="equipmentSearch"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onFocus={() => setIsSearchFocused(true)}
                              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                              placeholder="Search by Equipment or Serial Number"
                              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                            <PlusIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        {isSearchFocused && searchQuery.trim() && (
                             <div className="absolute top-full start-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    searchResults.map((equipment, index) => (
                                        <div 
                                            key={`${equipment.id}-${index}`} 
                                            onClick={() => handleSelectEquipment(equipment.id)}
                                            className="p-3 border-b hover:bg-green-50 cursor-pointer"
                                        >
                                            <p className="font-semibold">
                                                {language === 'ar' && equipment.arabicName ? equipment.arabicName : (language === 'ar' ? `${t(equipment.equipmentType)} ${equipment.equipmentNumber}` : `${t(equipment.equipmentType)} ${equipment.equipmentNumber}`)} ({equipment.serialNumber})
                                            </p>
                                            <p className="text-sm text-gray-500">{equipment.serialNumber}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-gray-500">
                                        {t('noEquipmentFound')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                     <div className="text-center mt-4">
                        <button type="button" onClick={() => setShowEquipmentModal(true)} className="text-sm text-green-600 hover:underline font-semibold flex items-center justify-center mx-auto">
                            <PlusIcon className="h-4 w-4 me-1" />
                            {t('cantFindEquipmentLink')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-green-100 rounded-xl p-6 bg-green-50">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-bold text-xl text-green-600 mb-1">{t('step1_selectedEquipment')}</h3>
                          <p className="text-2xl font-black text-green-900 uppercase">
                            {language === 'ar' && selectedEquipment.arabicName ? selectedEquipment.arabicName : (language === 'ar' ? `${t(selectedEquipment.equipmentType)} ${selectedEquipment.equipmentNumber}` : `${t(selectedEquipment.equipmentType)} ${selectedEquipment.equipmentNumber}`)} ({selectedEquipment.serialNumber})
                          </p>
                        </div>
                        <button type="button" onClick={resetForm} className="bg-white text-green-600 px-4 py-2 rounded-lg border border-green-200 shadow-sm hover:bg-green-100 transition font-bold text-sm">{t('changeEquipment')}</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('type')}</span>
                            <span className="font-bold text-gray-800">{t(selectedEquipment.equipmentType)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('make')}</span>
                            <span className="font-bold text-gray-800">{selectedEquipment.make}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('model')}</span>
                            <span className="font-bold text-gray-800">{selectedEquipment.modelNumber}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('serialNumber')}</span>
                            <span className="font-bold text-gray-800">{selectedEquipment.serialNumber}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('power')}</span>
                            <span className="font-bold text-gray-800">{selectedEquipment.power || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('location')}</span>
                            <span className="font-bold text-gray-800">{selectedEquipment.branchLocation}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {selectedEquipment && (
            <div className="pt-6">
                <h2 className="text-xl font-bold text-green-600 mb-4">{t('step2_requestType')}</h2>
                <div className="flex space-x-4 rtl:space-x-reverse">
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition ${requestType === 'repair' ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="requestType" value="repair" checked={requestType === 'repair'} onChange={() => setRequestType('repair')} className="hidden" />
                        <div className="text-center">
                            <p className="font-bold text-gray-800">{t('repairRequest')}</p>
                        </div>
                    </label>
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition ${requestType === 'oil' ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="requestType" value="oil" checked={requestType === 'oil'} onChange={() => setRequestType('oil')} className="hidden" />
                        <div className="text-center">
                            <p className="font-bold text-gray-800">{t('oilChangeRequest')}</p>
                        </div>
                    </label>
                </div>
            </div>
        )}

        {selectedEquipment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fromLocation')}</label>
                    <select
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        disabled={currentUser?.role !== 'admin'}
                        className={`w-full p-2 border border-gray-300 rounded-md ${currentUser?.role !== 'admin' ? 'bg-gray-100' : 'bg-white'}`}
                    >
                        <option value="">{t('selectLocation')}</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('toLocation')}</label>
                    <select
                        value={toLocation}
                        onChange={(e) => {
                            if (e.target.value === 'addNew') {
                                setShowLocationModal(true);
                            } else {
                                setToLocation(e.target.value);
                            }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    >
                        <option value="">{t('selectLocation')}</option>
                        {locations
                            .filter(l => l.hasWorkshop)
                            .map(l => (
                                <option key={l.id} value={l.name}>{l.name}</option>
                            ))
                        }
                        <option value="addNew" className="text-green-600 font-bold">+ {t('addNewLocation')}</option>
                    </select>
                </div>
            </div>
        )}
        {selectedEquipment && requestType === 'repair' && (
            <div className="space-y-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="driverName" className="block text-sm font-medium text-gray-700">{t('driverName')}</label>
                        <input
                            type="text"
                            id="driverName"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">{t('mileage')}</label>
                        <input
                            type="number"
                            id="mileage"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">{t('purpose')}</label>
                    <select
                        id="purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value as any)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="Repairing">{t('purpose_repairing')}</option>
                        <option value="preparing for work">{t('purpose_preparing_for_work')}</option>
                        <option value="General Checking">{t('purpose_general_checking')}</option>
                        <option value="Other">{t('purpose_other')}</option>
                    </select>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-green-600">{t('step3_faultsReported')}</h3>
                        <button
                            type="button"
                            onClick={handleAddFault}
                            className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-100 transition flex items-center"
                        >
                            <PlusIcon className="h-4 w-4 me-1" />
                            {t('addFault')}
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        {faults.map((fault, index) => (
                            <div key={fault.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                                <div className="flex items-center mb-4">
                                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold me-3">{index + 1}</span>
                                    <h4 className="font-bold text-gray-700">{t('faultDetails')}</h4>
                                    {faults.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFault(fault.id)}
                                            className="ms-auto text-red-500 hover:text-red-700"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('workshop')}</label>
                                        <select
                                            value={fault.workshopId}
                                            onChange={(e) => handleFaultFieldChange(fault.id, 'workshopId', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                                            required
                                        >
                                            <option value="">{t('selectWorkshop')}</option>
                                            {workshops
                                                .filter(w => !toLocation || w.location === toLocation)
                                                .map(w => (
                                                    <option key={w.id} value={w.id}>{language === 'ar' && w.arabicName ? w.arabicName : w.subName}</option>
                                                ))
                                            }
                                            <option value="addNew" className="text-green-600 font-bold">+ {t('addNewWorkshop')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('mechanicName')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('mechanicName')}
                                            value={fault.mechanicName || ''}
                                            onChange={(e) => handleFaultFieldChange(fault.id, 'mechanicName', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('complaintDescription')}</label>
                                    <textarea
                                        placeholder={t('faultDescriptionPlaceholder')}
                                        value={fault.description}
                                        onChange={(e) => handleFaultFieldChange(fault.id, 'description', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        rows={2}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {selectedEquipment && requestType === 'oil' && (
            <div className="pt-6 border-t space-y-8">
                <div>
                    <h3 className="text-xl font-bold text-green-600 mb-4">{t('oilLog_oilTypes')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { id: 'engineOil', label: t('oilLog_engineOil') },
                            { id: 'gearOil', label: t('oilLog_gearOil') },
                            { id: 'deffranceOil', label: t('oilLog_deffranceOil') },
                            { id: 'other', label: t('oilLog_other') }
                        ].map(oil => (
                            <label key={oil.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    checked={selectedOils.includes(oil.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedOils([...selectedOils, oil.id]);
                                        else setSelectedOils(selectedOils.filter(o => o !== oil.id));
                                    }}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="ms-3 font-medium text-gray-700">{oil.label}</span>
                            </label>
                        ))}
                    </div>
                    {selectedOils.includes('other') && (
                        <input
                            type="text"
                            placeholder={t('oilLog_addNew')}
                            value={customOil}
                            onChange={(e) => setCustomOil(e.target.value)}
                            className="mt-3 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold text-green-600 mb-4">{t('oilLog_filters')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { id: 'oilFilter', label: t('oilLog_oilFilter') },
                            { id: 'gearOilFilter', label: t('oilLog_gearOilFilter') },
                            { id: 'airFilter', label: t('oilLog_airFilter') },
                            { id: 'dieselFilter', label: t('oilLog_dieselFilter') },
                            { id: 'hydraulicFilter', label: t('oilLog_hydraulicFilter') },
                            { id: 'other', label: t('oilLog_other') }
                        ].map(filter => (
                            <label key={filter.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    checked={selectedFilters.includes(filter.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedFilters([...selectedFilters, filter.id]);
                                        else setSelectedFilters(selectedFilters.filter(f => f !== filter.id));
                                    }}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="ms-3 font-medium text-gray-700">{filter.label}</span>
                            </label>
                        ))}
                    </div>
                    {selectedFilters.includes('other') && (
                        <input
                            type="text"
                            placeholder={t('oilLog_addNew')}
                            value={customFilter}
                            onChange={(e) => setCustomFilter(e.target.value)}
                            className="mt-3 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="oilDriverName" className="block text-sm font-medium text-gray-700">{t('driverName')}</label>
                        <input
                            type="text"
                            id="oilDriverName"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="oilMileage" className="block text-sm font-medium text-gray-700">{t('mileage')}</label>
                        <input
                            type="number"
                            id="oilMileage"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                </div>
            </div>
        )}

        {selectedEquipment && requestType === 'tyre' && (
            <div className="pt-6 border-t">
                <p className="text-gray-600 mb-4">{t('tyreChange_description')}</p>
                <div className="p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
                    <p className="text-gray-500 italic">Tyre Change Request form integration coming soon...</p>
                </div>
            </div>
        )}

        {selectedEquipment && (
            <div className="pt-8 flex justify-end">
                <button
                    type="submit"
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition"
                >
                    {editingRequestId ? t('updateJobCard') : t('createJobCard')}
                </button>
            </div>
        )}
      </form>
      
      {showEquipmentModal && <NewEquipmentForm onClose={() => setShowEquipmentModal(false)} onAddEquipment={handleAddEquipment} onUpdateEquipment={() => {}} equipmentToEdit={null} />}
      {showWorkshopModal && <NewWorkshopForm onClose={() => setShowWorkshopModal(false)} onAddWorkshop={handleAddWorkshop} onUpdateWorkshop={() => {}} workshopToEdit={null} initialLocation={toLocation} />}
      {showLocationModal && (
        <NewLocationForm 
            onClose={() => setShowLocationModal(false)} 
            onAddLocation={async (loc) => {
                await createData('Locations', { ...loc, hasWorkshop: true });
                setShowLocationModal(false);
                setToLocation(loc.name);
            }} 
            onUpdateLocation={async () => {}} 
            locationToEdit={null} 
        />
      )}
    </div>
  );
};
