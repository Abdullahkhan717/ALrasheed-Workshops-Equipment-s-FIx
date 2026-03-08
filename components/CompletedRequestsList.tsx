import React, { useState } from 'react';
import type { Equipment, Workshop, RepairRequest } from '../types';
import { JobCard } from './JobCard';
import { PrinterIcon, WhatsappIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface CompletedRequestsListProps {
  repairRequests: RepairRequest[];
  equipments: Equipment[];
  workshops: Workshop[];
}

export const CompletedRequestsList: React.FC<CompletedRequestsListProps> = ({ repairRequests, equipments, workshops }) => {
  const [requestToPrint, setRequestToPrint] = useState<RepairRequest | null>(null);
  const [requestToShare, setRequestToShare] = useState<RepairRequest | null>(null);
  const { t } = useTranslation();

  const handleShare = (request: RepairRequest) => {
    setRequestToShare(request);
  };

  const getEquipmentInfo = (equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment ? `${equipment.equipmentNumber} (${equipment.serialNumber})` : t('unknownEquipment');
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">{t('completedRequests')}</h1>

      {requestToPrint && (
        <JobCard 
            request={requestToPrint} 
            equipment={equipments.find(e => e.id === requestToPrint.equipmentId)!}
            workshops={workshops}
            onClose={() => setRequestToPrint(null)}
        />
      )}

      {requestToShare && (
        <JobCard 
            request={requestToShare} 
            equipment={equipments.find(e => e.id === requestToShare.equipmentId)!}
            workshops={workshops}
            onClose={() => setRequestToShare(null)}
            onShare={() => {}} 
        />
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobCardNo')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('driver')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dateIn')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dateOut')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('resolvedFaults')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {repairRequests.length > 0 ? (
              repairRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEquipmentInfo(request.equipmentId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.driverName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.dateIn}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.dateOut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      {request.faults.map(f => <li key={f.id}>{f.description}</li>)}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleShare(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('shareViaWhatsApp')}>
                        <WhatsappIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={() => setRequestToPrint(request)} className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-full" title={t('printJobCard')}>
                        <PrinterIcon className="h-5 w-5"/>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">{t('noCompletedRequests')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
