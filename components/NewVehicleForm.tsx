import React, { useState, useEffect } from 'react';
import type { Equipment, Location } from '../types';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { NewLocationForm } from './NewLocationForm';

interface NewEquipmentFormProps {
  onClose: () => void;
  onAddEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
  equipmentToEdit: Equipment | null;
}

const PRESET_TYPES = ['Shovel', 'Loader', 'Excavator', 'Generator', 'Dump Truck', 'Forklift', 'Poclain'];

export const NewEquipmentForm: React.FC<NewEquipmentFormProps> = ({ onClose, onAddEquipment, onUpdateEquipment, equipmentToEdit }) => {
  const isEditMode = equipmentToEdit !== null;
  const { t } = useTranslation();
  const { locations, createData } = useData();

  const [equipmentType, setEquipmentType] = useState(PRESET_TYPES[0]);
  const [customEquipmentType, setCustomEquipmentType] = useState('');
  const [equipmentNumber, setEquipmentNumber] = useState('');
  const [make, setMake] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [power, setPower] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [condition, setCondition] = useState<Equipment['condition']>('Working');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  useEffect(() => {
    if (isEditMode) {
        setEquipmentNumber(equipmentToEdit.equipmentNumber);
        setMake(equipmentToEdit.make);
        setModelNumber(equipmentToEdit.modelNumber);
        setSerialNumber(equipmentToEdit.serialNumber);
        setBranchLocation(equipmentToEdit.branchLocation);
        setPower(equipmentToEdit.power || '');
        setArabicName(equipmentToEdit.arabicName || '');
        setCondition(equipmentToEdit.condition || 'Working');
        
        if (PRESET_TYPES.includes(equipmentToEdit.equipmentType)) {
            setEquipmentType(equipmentToEdit.equipmentType);
            setCustomEquipmentType('');
        } else {
            setEquipmentType('AddNew');
            setCustomEquipmentType(equipmentToEdit.equipmentType);
        }
    }
  }, [equipmentToEdit, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentNumber || !serialNumber) {
        alert(t('alert_fillRequiredFields'));
        return;
    }

    let finalType = equipmentType;
    if (equipmentType === 'AddNew') {
        if (!customEquipmentType.trim()) {
            alert(t('alert_specifyNewEquipmentType'));
            return;
        }
        finalType = customEquipmentType.trim();
    }

    const equipmentData = { 
        equipmentType: finalType, 
        equipmentNumber, 
        make, 
        modelNumber, 
        serialNumber, 
        branchLocation,
        power,
        arabicName: arabicName.trim(),
        condition
    };

    if (isEditMode) {
      onUpdateEquipment({ ...equipmentData, id: equipmentToEdit.id });
    } else {
      onAddEquipment(equipmentData);
    }
  };

  const handleAddLocation = async (locationData: Omit<Location, 'id'>) => {
    try {
      const newLoc = { ...locationData, id: crypto.randomUUID() };
      await createData('Locations', newLoc);
      setBranchLocation(newLoc.name);
      setIsAddingLocation(false);
    } catch (error) {
      console.error('Failed to add location:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? t('editEquipment') : t('addNewEquipment')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="equipmentType" className="block text-sm font-medium text-gray-700">{t('equipmentType')}</label>
            <select
              id="equipmentType"
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {PRESET_TYPES.map(type => <option key={type} value={type}>{t(type)}</option>)}
              <option value="AddNew">{t('addNew')}</option>
            </select>
          </div>
           {equipmentType === 'AddNew' && (
            <div>
              <label htmlFor="customEquipmentType" className="block text-sm font-medium text-gray-700">{t('newEquipmentType')}</label>
              <input
                type="text"
                id="customEquipmentType"
                value={customEquipmentType}
                onChange={(e) => setCustomEquipmentType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                placeholder={t('newEquipmentTypePlaceholder')}
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="equipmentNumber" className="block text-sm font-medium text-gray-700">{t('equipmentNumber')}</label>
            <input
              type="text"
              id="equipmentNumber"
              value={equipmentNumber}
              onChange={(e) => setEquipmentNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="arabicName" className="block text-sm font-medium text-gray-700">{t('arabicName')}</label>
            <input
              type="text"
              id="arabicName"
              value={arabicName}
              onChange={(e) => setArabicName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-right"
              placeholder="اسم المعدة بالعربي"
              dir="rtl"
            />
          </div>
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700">{t('make')}</label>
            <input
              type="text"
              id="make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            />
          </div>
           <div>
            <label htmlFor="modelNumber" className="block text-sm font-medium text-gray-700">{t('modelNumber')}</label>
            <input
              type="text"
              id="modelNumber"
              value={modelNumber}
              onChange={(e) => setModelNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            />
          </div>
           <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">{t('serialNumber')}</label>
            <input
              type="text"
              id="serialNumber"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="power" className="block text-sm font-medium text-gray-700">{t('power')}</label>
            <input
              type="text"
              id="power"
              value={power}
              onChange={(e) => setPower(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            />
          </div>
           <div>
            <label htmlFor="branchLocation" className="block text-sm font-medium text-gray-700">{t('branchLocation')}</label>
            <select
              id="branchLocation"
              value={branchLocation}
              onChange={(e) => {
                if (e.target.value === 'AddNew') {
                    setIsAddingLocation(true);
                } else {
                    setBranchLocation(e.target.value);
                }
              }}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">{t('location')}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
              <option value="AddNew">{t('addNew')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700">{t('condition')}</label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as Equipment['condition'])}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Working">{t('working')}</option>
              <option value="Ready for work">{t('readyForWork')}</option>
              <option value="Damage">{t('damage')}</option>
              <option value="Other">{t('other')}</option>
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg me-2 hover:bg-gray-300">{t('cancel')}</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{isEditMode ? t('updateEquipment') : t('addEquipment')}</button>
          </div>
        </form>
      </div>
      {isAddingLocation && (
        <NewLocationForm
            onClose={() => setIsAddingLocation(false)}
            onAddLocation={handleAddLocation}
            onUpdateLocation={() => {}}
            locationToEdit={null}
        />
      )}
    </div>
  );
};
