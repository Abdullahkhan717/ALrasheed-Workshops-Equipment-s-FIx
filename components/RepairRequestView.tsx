import React, { useState, useEffect } from 'react';
import type { Equipment, Workshop, RepairRequest, Fault } from '../types';
import { PlusIcon, TrashIcon, WrenchScrewdriverIcon, TruckIcon, BuildingStorefrontIcon, XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { NewEquipmentForm } from './NewVehicleForm';
import { NewWorkshopForm } from './NewWorkshopForm';

interface RepairRequestViewProps {
  equipments: Equipment[];
  workshops: Workshop[];
  repairRequests: RepairRequest[];
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => Promise<Equipment | void>;
  onAddWorkshop: (workshop: Omit<Workshop, 'id'>) => Promise<void>;
}

export const RepairRequestView: React.FC<RepairRequestViewProps> = ({ 
  equipments, 
  workshops, 
  repairRequests, 
  onAddEquipment,
  onAddWorkshop
}) => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { createData, updateData, locations, lastJobCardNumber, setLastJobCardNumber } = useData();

  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [mileage, setMileage] = useState('');
  const [purpose, setPurpose] = useState<'Breakdown' | 'Accident' | 'Maintenance' | 'Other'>('Breakdown');
  const [workshopId, setWorkshopId] = useState('');
  const [faults, setFaults] = useState<Omit<Fault, 'id'>[]>([{ description: '', status: 'Pending' }]);
  const [applicationType, setApplicationType] = useState<'Internal Workshop' | 'Outsourced / External Service'>('Internal Workshop');
  const [toLocation, setToLocation] = useState(currentUser?.location || '');
  
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [showNewWorkshopModal, setShowNewWorkshopModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredEquipments = equipments.filter(eq => 
    String(eq.equipmentNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(eq.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFault = () => {
    setFaults([...faults, { description: '', status: 'Pending' }]);
  };

  const handleRemoveFault = (index: number) => {
    if (faults.length > 1) {
      const newFaults = [...faults];
      newFaults.splice(index, 1);
      setFaults(newFaults);
    }
  };

  const handleFaultChange = (index: number, value: string) => {
    const newFaults = [...faults];
    newFaults[index].description = value;
    setFaults(newFaults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedEquipmentId) {
      alert(t('alert_selectEquipment'));
      return;
    }

    if (!driverName.trim()) {
      alert(t('alert_enterDriverName'));
      return;
    }

    if (faults.some(f => !f.description.trim())) {
      alert(t('alert_enterFaultDescription'));
      return;
    }

    if (!workshopId && applicationType === 'Internal Workshop') {
      alert(t('alert_selectWorkshop'));
      return;
    }

    try {
      setIsSubmitting(true);
      
      const nextJobNumber = lastJobCardNumber + 1;
      
      const newRequest: Omit<RepairRequest, 'id'> & { id: string } = {
        id: String(nextJobNumber),
        equipmentId: selectedEquipmentId,
        driverName: driverName.trim(),
        mileage: mileage.trim(),
        purpose,
        faults: faults.map(f => ({ ...f, id: crypto.randomUUID() })),
        dateIn: new Date().toISOString(),
        timeIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: 'Pending',
        applicationStatus: 'Pending',
        workshopId,
        createdBy: currentUser?.id || 'Unknown',
        fromLocation: currentUser?.location || '',
        toLocation: applicationType === 'Internal Workshop' ? (workshops.find(w => w.id === workshopId)?.location || currentUser?.location || '') : toLocation,
        applicationType,
        rejectionReason: '',
        acceptedBy: '',
        approvalDate: '',
        dateOut: '',
        timeOut: '',
        workDone: '',
        partsUsed: ''
      };

      await createData('RepairRequests', newRequest);
      
      // Update the settings tab to persist the last job card number
      try {
        await updateData('Settings', { Key: 'lastJobCardNumber', Value: String(nextJobNumber) });
      } catch (settingsError) {
        console.error('Failed to update settings:', settingsError);
        // Don't fail the whole request if settings update fails, 
        // as the repair request itself was created successfully.
      }

      setLastJobCardNumber(nextJobNumber);
      
      alert(t('alert_requestCreated', { id: nextJobNumber }));
      
      // Reset form
      setSelectedEquipmentId('');
      setDriverName('');
      setMileage('');
      setPurpose('Breakdown');
      setWorkshopId('');
      setFaults([{ description: '', status: 'Pending' }]);
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('Error creating request: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-8 flex items-center">
        <WrenchScrewdriverIcon className="h-8 w-8 md:h-10 md:w-10 text-green-600 me-4" />
        {t('newRepairRequest')}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-8 animate-fade-in">
        {/* Equipment Selection */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-700 flex items-center">
              <TruckIcon className="h-6 w-6 text-green-500 me-2" />
              {t('equipmentSelection')}
            </h2>
            <button 
              type="button" 
              onClick={() => setShowNewEquipmentModal(true)}
              className="text-sm text-green-600 font-bold hover:underline"
            >
              + {t('addNewEquipment')}
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text"
              placeholder={t('searchByEquipmentOrSerial')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-xl shadow-2xl z-20 max-h-60 overflow-y-auto">
                {filteredEquipments.length > 0 ? (
                  filteredEquipments.map(eq => (
                    <div 
                      key={eq.id} 
                      onClick={() => {
                        setSelectedEquipmentId(eq.id);
                        setSearchQuery(language === 'ar' && eq.arabicName ? `${eq.arabicName} ${eq.equipmentNumber}` : `${t(eq.equipmentType)} ${eq.equipmentNumber}`);
                        setIsSearchFocused(false);
                      }}
                      className="p-4 border-b hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <p className="font-bold text-gray-800">
                        {language === 'ar' && eq.arabicName ? `${eq.arabicName} ${eq.equipmentNumber}` : `${t(eq.equipmentType)} ${eq.equipmentNumber}`}
                      </p>
                      <p className="text-sm text-gray-500">{eq.serialNumber} • {eq.branchLocation}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">{t('noEquipmentFound')}</div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Request Details */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('driverName')}</label>
            <input 
              type="text" 
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={t('enterDriverName')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('mileageHours')}</label>
            <input 
              type="text" 
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder={t('enterMileage')}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('purpose')}</label>
            <select 
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="Breakdown">{t('purpose_breakdown')}</option>
              <option value="Maintenance">{t('purpose_maintenance')}</option>
              <option value="Accident">{t('purpose_accident')}</option>
              <option value="Other">{t('purpose_other')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t('applicationType')}</label>
            <select 
              value={applicationType}
              onChange={(e) => setApplicationType(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="Internal Workshop">{t('internalWorkshop')}</option>
              <option value="Outsourced / External Service">{t('outsourcedService')}</option>
            </select>
          </div>
        </section>

        {/* Workshop / Location Selection */}
        <section className="space-y-4">
          {applicationType === 'Internal Workshop' ? (
            <>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-700">{t('selectWorkshop')}</label>
                <button 
                  type="button" 
                  onClick={() => setShowNewWorkshopModal(true)}
                  className="text-xs text-green-600 font-bold hover:underline"
                >
                  + {t('addNewWorkshop')}
                </button>
              </div>
              <select 
                value={workshopId}
                onChange={(e) => setWorkshopId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                required
              >
                <option value="">{t('selectWorkshop')}</option>
                {workshops.map(w => (
                  <option key={w.id} value={w.id}>
                    {language === 'ar' && w.arabicName ? w.arabicName : w.subName} ({w.location})
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('destinationLocation')}</label>
              <select 
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                required
              >
                <option value="">{t('selectLocation')}</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </>
          )}
        </section>

        {/* Faults List */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-700 flex items-center">
            <WrenchScrewdriverIcon className="h-6 w-6 text-green-500 me-2" />
            {t('faults')}
          </h2>
          <div className="space-y-3">
            {faults.map((fault, index) => (
              <div key={index} className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={fault.description}
                    onChange={(e) => handleFaultChange(index, e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder={`${t('fault')} ${index + 1}`}
                    required
                  />
                </div>
                {faults.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveFault(index)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <TrashIcon className="h-6 w-6" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={handleAddFault}
            className="flex items-center text-green-600 font-bold hover:text-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 me-1" />
            {t('addAnotherFault')}
          </button>
        </section>

        {/* Submit Button */}
        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-4 rounded-xl font-black text-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSubmitting ? t('submitting') : t('createRepairRequest')}
          </button>
        </div>
      </form>

      {/* Modals */}
      {showNewEquipmentModal && (
        <NewEquipmentForm 
          onClose={() => setShowNewEquipmentModal(false)} 
          onAddEquipment={onAddEquipment} 
          onUpdateEquipment={async () => {}} 
          equipmentToEdit={null} 
        />
      )}
      {showNewWorkshopModal && (
        <NewWorkshopForm 
          onClose={() => setShowNewWorkshopModal(false)} 
          onAddWorkshop={onAddWorkshop} 
          onUpdateWorkshop={async () => {}} 
          workshopToEdit={null} 
        />
      )}
    </div>
  );
};
