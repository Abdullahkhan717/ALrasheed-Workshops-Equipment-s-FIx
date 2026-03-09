import React, { useState, useEffect } from 'react';
import type { Equipment } from '../types';
import { NewEquipmentForm } from './NewVehicleForm';
import { PlusIcon, PencilIcon, TrashIcon, WhatsappIcon, ArrowsRightLeftIcon, EyeIcon, TruckIcon, WrenchScrewdriverIcon, CheckIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { EquipmentDetailsView } from './EquipmentDetailsView';

interface EquipmentListProps {
  equipments: Equipment[];
  addEquipment: (equipment: Omit<Equipment, 'id'>) => Promise<Equipment | void>;
  deleteEquipment: (equipmentId: string) => void;
  updateEquipment: (equipment: Equipment) => Promise<void>;
  onTransfer?: (equipment: Equipment) => void;
  initialSearchQuery?: string;
  initialLocationFilter?: string;
  onNewRepairRequest?: (equipmentId: string) => void;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({ 
  equipments, 
  addEquipment, 
  deleteEquipment, 
  updateEquipment, 
  onTransfer, 
  initialSearchQuery = '',
  initialLocationFilter = '',
  onNewRepairRequest
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState(String(initialSearchQuery || ''));
  const [locationFilter, setLocationFilter] = useState(initialLocationFilter);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { repairRequests, oilLogs } = useData();

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const isHomeBranch = (branchLocation: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (branchLocation === 'To Be Determined/يُحدد لاحقاً') return true;
    
    // Merged branches logic: Marhaba and Al Hasa
    const mergedBranches = ['Marhaba/المرحبہ', 'Al hasa/الاحساء'];
    if (mergedBranches.includes(currentUser.location) && mergedBranches.includes(branchLocation)) {
      return true;
    }
    
    return currentUser.location === branchLocation;
  };

  const handleAddEquipment = async (equipment: Omit<Equipment, 'id'>) => {
    try {
      await addEquipment(equipment);
      handleCloseModal();
      alert(t('alert_equipmentAdded'));
    } catch (error) {
      console.error(error);
      alert(t('alert_equipmentAddFailed') || 'Failed to add equipment. Please check your connection and Google Sheet setup.');
    }
  };
  
  const handleUpdateEquipment = async (updatedEquipment: Equipment) => {
    try {
      await updateEquipment(updatedEquipment);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to update equipment:', error);
      alert(t('alert_equipmentUpdateFailed'));
    }
  };

  const handleEditClick = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEquipment(null);
  };
  
  const handleShareEquipment = (equipment: Equipment) => {
    const details = [
      `*${t('equipmentDetails')}*`,
      `${t('type')}: ${t(equipment.equipmentType)}`,
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

  const filteredEquipments = equipments.filter(eq => {
    // Location filter
    if (locationFilter && eq.branchLocation !== locationFilter) return false;

    const query = String(searchQuery || '').toLowerCase();
    if (!query) return true;
    
    const eqNum = String(eq.equipmentNumber || '').toLowerCase();
    const serial = String(eq.serialNumber || '').toLowerCase();
    const arabicName = String(eq.arabicName || '').toLowerCase();
    const type = t(eq.equipmentType).toLowerCase();
    
    // Check if any equipment has an EXACT match for equipment number or serial
    const hasExactMatch = equipments.some(e => 
        String(e.equipmentNumber || '').toLowerCase() === query || 
        String(e.serialNumber || '').toLowerCase() === query
    );
    
    if (hasExactMatch) {
        return eqNum === query || serial === query;
    }

    return eqNum.includes(query) ||
           type.includes(query) ||
           serial.includes(query) ||
           arabicName.includes(query);
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('equipmentList')}</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="">{t('allLocations') || 'All Locations'}</option>
            {Array.from(new Set(equipments.map(e => e.branchLocation))).filter(Boolean).sort().map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder={t('searchByEquipmentOrSerial')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full p-2 border border-gray-300 rounded-md ps-10"
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full start-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto min-w-[250px]">
                {equipments
                  .filter(eq => 
                    String(eq.equipmentNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
                    String(eq.serialNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase())
                  )
                  .sort((a, b) => {
                    const aEq = String(a.equipmentNumber || '').toLowerCase();
                    const bEq = String(b.equipmentNumber || '').toLowerCase();
                    const query = String(searchQuery || '').toLowerCase();
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
                      onClick={() => {
                        setSelectedEquipmentId(eq.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="p-3 border-b hover:bg-green-50 cursor-pointer"
                    >
                      <p className="font-semibold">
                        {useTranslation().language === 'ar' && eq.arabicName ? eq.arabicName : (useTranslation().language === 'ar' ? `${t(eq.equipmentType)} ${eq.equipmentNumber}` : eq.equipmentNumber)} {useTranslation().language !== 'ar' && `(${t(eq.equipmentType)})`}
                      </p>
                      <p className="text-sm text-gray-500">{eq.serialNumber}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 me-2" />
            {t('addNewEquipment')}
          </button>
        </div>
      </div>

      {selectedEquipmentId && equipments.find(e => e.id === selectedEquipmentId) && (
        <div className="mb-8">
          <EquipmentDetailsView
            equipment={equipments.find(e => e.id === selectedEquipmentId)!}
            repairRequests={repairRequests}
            oilLogs={oilLogs}
            onBack={() => setSelectedEquipmentId(null)}
            onEdit={handleEditClick}
            onTransfer={onTransfer || (() => {})}
            onDelete={deleteEquipment}
            onWhatsAppShare={handleShareEquipment}
            onNewRepairRequest={(id) => onNewRepairRequest?.(id)}
          />
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipmentNumber')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('make')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('model')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('location')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {filteredEquipments.length > 0 ? (
                    filteredEquipments.map((equipment, index) => (
                    <tr key={`${equipment.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t(equipment.equipmentType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {useTranslation().language === 'ar' && equipment.arabicName ? equipment.arabicName : (useTranslation().language === 'ar' ? `${t(equipment.equipmentType)} ${equipment.equipmentNumber}` : equipment.equipmentNumber)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{equipment.make}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{equipment.modelNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{equipment.branchLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setSelectedEquipmentId(equipment.id)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('details')}>
                                <EyeIcon className="h-5 w-5"/>
                            </button>
                            <button onClick={() => onNewRepairRequest?.(equipment.id)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('select')}>
                                <CheckIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(equipment.branchLocation) && (
                                <button onClick={() => handleEditClick(equipment)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('editEquipment')}>
                                    <PencilIcon className="h-5 w-5"/>
                                </button>
                            )}
                            <button onClick={() => handleShareEquipment(equipment)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('shareViaWhatsApp')}>
                                <WhatsappIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(equipment.branchLocation) && (
                                <>
                                    <button onClick={() => onTransfer?.(equipment)} className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-100 rounded-full" title={t('branchTransfer')}>
                                        <ArrowsRightLeftIcon className="h-5 w-5"/>
                                    </button>
                                    <button onClick={() => deleteEquipment(equipment.id)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('deleteEquipment')}>
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                    </tr>
                ))
                ) : (
                    <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-500">{t('noEquipmentFound')}</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredEquipments.length > 0 ? (
            filteredEquipments.map(equipment => (
                <div key={equipment.id} className="bg-white rounded-xl shadow-md p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{t(equipment.equipmentType)}</span>
                            <h3 className="text-lg font-bold text-gray-900">
                                {useTranslation().language === 'ar' && equipment.arabicName ? equipment.arabicName : equipment.equipmentNumber}
                            </h3>
                        </div>
                        <div className="flex space-x-1">
                            <button onClick={() => setSelectedEquipmentId(equipment.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full" title={t('viewDetails')}>
                                <EyeIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(equipment.branchLocation) && (
                                <button onClick={() => handleEditClick(equipment)} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                                    <PencilIcon className="h-5 w-5"/>
                                </button>
                            )}
                            <button onClick={() => handleShareEquipment(equipment)} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                                <WhatsappIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(equipment.branchLocation) && (
                                <>
                                    <button onClick={() => onTransfer?.(equipment)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-full">
                                        <ArrowsRightLeftIcon className="h-5 w-5"/>
                                    </button>
                                    <button onClick={() => deleteEquipment(equipment.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-gray-500">{t('make')}</p>
                            <p className="font-medium">{equipment.make}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">{t('model')}</p>
                            <p className="font-medium">{equipment.modelNumber}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">{t('serialNumber')}</p>
                            <p className="font-medium">{equipment.serialNumber}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">{t('power')}</p>
                            <p className="font-medium">{equipment.power || '-'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-500">{t('location')}</p>
                            <p className="font-medium">{equipment.branchLocation}</p>
                        </div>
                    </div>
                    {isHomeBranch(equipment.branchLocation) && (
                        <div className="pt-2 border-t border-gray-100">
                            <button 
                                onClick={() => onNewRepairRequest?.(equipment.id)}
                                className="w-full bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center"
                            >
                                <WrenchScrewdriverIcon className="h-4 w-4 me-2" />
                                {t('newRepairRequest')}
                            </button>
                        </div>
                    )}
                </div>
            ))
        ) : (
            <div className="text-center py-10 bg-white rounded-xl shadow-md text-gray-500">
                {t('noEquipmentFound')}
            </div>
        )}
      </div>

      {isModalOpen && (
        <NewEquipmentForm
          onClose={handleCloseModal}
          onAddEquipment={handleAddEquipment}
          onUpdateEquipment={handleUpdateEquipment}
          equipmentToEdit={editingEquipment}
        />
      )}
    </div>
  );
};
