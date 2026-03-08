import React, { useState } from 'react';
import type { Equipment, OilLog } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { TruckIcon } from './Icons';

export const OilLogView: React.FC = () => {
  const { t } = useTranslation();
  const { equipments, locations: dbLocations, createData } = useData();
  
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [mileage, setMileage] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [oilTypes, setOilTypes] = useState<string[]>([]);
  const [customOil, setCustomOil] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [customFilter, setCustomFilter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleLocationChange = (val: string) => {
    if (val === 'addNew') {
      setShowCustomLocation(true);
      setLocation('');
    } else {
      setShowCustomLocation(false);
      setLocation(val);
    }
  };

  const oilTypeOptions = [
    { id: 'engineOil', label: t('oilLog_engineOil') },
    { id: 'gearOil', label: t('oilLog_gearOil') },
    { id: 'deffranceOil', label: t('oilLog_deffranceOil') },
    { id: 'greasing', label: t('oilLog_greasing') },
    { id: 'other', label: t('oilLog_addNew') }
  ];

  const filterOptions = [
    { id: 'airFilter', label: t('oilLog_airFilter') },
    { id: 'dieselFilter', label: t('oilLog_dieselFilter') },
    { id: 'oilFilter', label: t('oilLog_oilFilter') },
    { id: 'gearOilFilter', label: t('oilLog_gearOilFilter') },
    { id: 'hydraulicFilter', label: t('oilLog_hydraulicFilter') },
    { id: 'other', label: t('oilLog_addNew') }
  ];

  const handleToggleOilType = (id: string) => {
    setOilTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleToggleFilter = (id: string) => {
    setFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = showCustomLocation ? customLocation : location;
    if (!selectedEquipmentId || !driverName || !mileage || !finalLocation) {
      alert(t('alert_fillAllFields'));
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const finalOilTypes = oilTypes.map(t => t === 'other' ? customOil : t).filter(Boolean);
      const finalFilters = filters.map(f => f === 'other' ? customFilter : f).filter(Boolean);
      
      const newLog: OilLog = {
        id: crypto.randomUUID(),
        equipmentId: selectedEquipmentId,
        driverName,
        mileage,
        location: finalLocation,
        oilTypes: finalOilTypes,
        filters: finalFilters,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString()
      };

      // We need to stringify arrays for Google Sheets
      const payload = {
        ...newLog,
        oilTypes: JSON.stringify(newLog.oilTypes),
        filters: JSON.stringify(newLog.filters)
      };

      await createData('OilLogs', payload);
      alert(t('oilLog_success'));
      
      // Reset form
      setSelectedEquipmentId('');
      setDriverName('');
      setMileage('');
      setLocation('');
      setCustomLocation('');
      setShowCustomLocation(false);
      setOilTypes([]);
      setCustomOil('');
      setFilters([]);
      setCustomFilter('');
    } catch (error) {
      console.error('Failed to save oil log:', error);
      alert('Failed to save oil log.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">{t('oilLog_title')}</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-xl shadow-md space-y-8 max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('oilLog_selectEquipment')}</label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">{t('oilLog_selectEquipment')}</option>
              {equipments.map(e => (
                <option key={e.id} value={e.id}>
                  {useTranslation().language === 'ar' && e.arabicName ? e.arabicName : `${t(e.equipmentType)} - ${e.companyNumber || e.equipmentNumber}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('oilLog_driverName')}</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder={t('complainerOperatorName')}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('oilLog_mileage')}</label>
            <input
              type="text"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder={t('mileagePlaceholder')}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('oilLog_location')}</label>
            <select
              value={showCustomLocation ? 'addNew' : location}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">{t('oilLog_location')}</option>
              {dbLocations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
              <option value="addNew">{t('addNew')}</option>
            </select>
            {showCustomLocation && (
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder={t('enterCustomLocation') || 'Enter Location'}
                className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                required
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
          <div>
            <h3 className="font-semibold text-gray-700 mb-4">{t('oilLog_oilTypes')}</h3>
            <div className="space-y-2">
              {oilTypeOptions.map(option => (
                <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={oilTypes.includes(option.id)}
                    onChange={() => handleToggleOilType(option.id)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
              {oilTypes.includes('other') && (
                <input
                  type="text"
                  value={customOil}
                  onChange={(e) => setCustomOil(e.target.value)}
                  placeholder={t('oilLog_addNew') || 'Add New Oil Type'}
                  className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-4">{t('oilLog_filters')}</h3>
            <div className="space-y-2">
              {filterOptions.map(option => (
                <label key={option.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={filters.includes(option.id)}
                    onChange={() => handleToggleFilter(option.id)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
              {filters.includes('other') && (
                <input
                  type="text"
                  value={customFilter}
                  onChange={(e) => setCustomFilter(e.target.value)}
                  placeholder={t('oilLog_addNew') || 'Add New Filter Type'}
                  className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {isSaving ? 'Saving...' : t('oilLog_save')}
          </button>
        </div>
      </form>
    </div>
  );
};
