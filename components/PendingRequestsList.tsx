import React, { useState } from 'react';
import type { Equipment, Workshop, RepairRequest } from '../types';
import { JobCard } from './JobCard';
import { PrinterIcon, WhatsappIcon, CheckBadgeIcon, EyeIcon, XMarkIcon, TrashIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { CompletionFormModal } from './CompletionFormModal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate } from '../utils/formatters';

interface PendingRequestsListProps {
  repairRequests: RepairRequest[];
  onUpdateRequest: (request: RepairRequest) => Promise<void>;
  equipments: Equipment[];
  workshops: Workshop[];
  title?: string;
}

export const PendingRequestsList: React.FC<PendingRequestsListProps> = ({ repairRequests, onUpdateRequest, equipments, workshops, title }) => {
  const [requestToPrint, setRequestToPrint] = useState<RepairRequest | null>(null);
  const [requestToShare, setRequestToShare] = useState<RepairRequest | null>(null);
  const [requestToComplete, setRequestToComplete] = useState<RepairRequest | null>(null);
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { updateData, deleteData } = useData();

  const handleShare = (request: RepairRequest) => {
    setRequestToShare(request);
  };

  const getEquipmentInfo = (equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment ? `${t(equipment.equipmentType)} ${equipment.equipmentNumber} (${equipment.serialNumber})` : t('unknownEquipment');
  };
  
  const handleSaveCompletion = async (completedRequest: RepairRequest) => {
    await onUpdateRequest(completedRequest);
    setRequestToComplete(null);
  };

  const handleAccept = async (request: RepairRequest) => {
    try {
      const confirmMsg = language === 'ar' ? 'هل أنت متأكد من قبول هذا الطلب؟' : 'Are you sure you want to accept this request?';
      if (window.confirm(confirmMsg)) {
        const updatedRequest: RepairRequest = { 
          ...request, 
          applicationStatus: 'Accepted', 
          acceptedBy: currentUser?.id || 'Unknown',
          approvalDate: new Date().toISOString()
        };
        await onUpdateRequest(updatedRequest);
        alert(language === 'ar' ? 'تم قبول الطلب بنجاح.' : 'Request accepted successfully.');
      }
    } catch (error: any) {
      console.error('Accept error:', error);
      alert('Error accepting request: ' + (error.message || 'Unknown error'));
    }
  };

  const handleReject = async (request: RepairRequest) => {
    try {
      const promptMsg = t('enterRejectionReason') || 'Enter rejection reason:';
      const reason = window.prompt(promptMsg);
      
      if (reason === null) return; // User cancelled
      
      if (reason.trim()) {
        const updatedRequest: RepairRequest = { 
          ...request, 
          applicationStatus: 'Rejected', 
          status: 'Completed', // Move out of pending
          rejectionReason: reason.trim(), 
          acceptedBy: currentUser?.id || 'Unknown',
          approvalDate: new Date().toISOString()
        };
        await onUpdateRequest(updatedRequest);
        alert(t('alert_requestRejected'));
      } else {
        alert(t('alert_reasonRequired'));
      }
    } catch (error: any) {
      console.error('Reject error:', error);
      alert('Error rejecting request: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCancel = async (request: RepairRequest) => {
    try {
      const promptMsg = t('enterCancellationReason') || 'Please enter the reason for cancellation:';
      const reason = window.prompt(promptMsg);
      
      if (reason === null) return; // User cancelled
      
      if (reason.trim()) {
        const updatedRequest: RepairRequest = { 
          ...request, 
          applicationStatus: 'Cancelled', 
          status: 'Completed', // Move out of pending
          rejectionReason: reason.trim(), 
          acceptedBy: currentUser?.id || 'Unknown',
          approvalDate: new Date().toISOString()
        };
        await onUpdateRequest(updatedRequest);
        alert(t('alert_requestCancelled') || 'Request has been cancelled.');
      } else {
        alert(t('cancellationReasonRequired') || 'Cancellation reason is required.');
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      alert('Error cancelling request: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (request: RepairRequest) => {
    try {
      if (window.confirm(t('actionCannotBeUndone'))) {
        await deleteData('RepairRequests', request.id);
        alert(t('alert_requestDeleted') || 'Request deleted successfully.');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Error deleting request: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">{title || t('pendingRequests')}</h1>

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

      {requestToComplete && (
        <CompletionFormModal
            request={requestToComplete}
            onClose={() => setRequestToComplete(null)}
            onSave={handleSaveCompletion}
        />
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobCardNo')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dateIn')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('applicationStatus')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobStatus')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {repairRequests.length > 0 ? (
              repairRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getEquipmentInfo(request.equipmentId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(request.dateIn)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.applicationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        request.applicationStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                        request.applicationStatus === 'Rejected' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                      {t(request.applicationStatus?.toLowerCase() as any || 'pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {t(request.status.toLowerCase() as any)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button onClick={() => setRequestToPrint(request)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full" title={t('showCard')}>
                        <EyeIcon className="h-5 w-5"/>
                    </button>
                    
                    {/* Accept/Reject option for the destination location user (Branch B) */}
                    {(String(currentUser?.location || '').trim().toLowerCase() === String(request.toLocation || '').trim().toLowerCase() || currentUser?.role === 'admin') && 
                     (String(request.applicationStatus || 'Pending').toLowerCase() === 'pending') && (
                        <>
                            <button onClick={() => handleAccept(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('accept')}>
                                <CheckBadgeIcon className="h-5 w-5"/>
                            </button>
                            <button onClick={() => handleReject(request)} className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-100 rounded-full" title={t('reject')}>
                                <XMarkIcon className="h-5 w-5"/>
                            </button>
                        </>
                    )}

                    {/* Cancel option for the creator or requester (Branch A) */}
                    {(String(currentUser?.id || '').toLowerCase() === String(request.createdBy || '').toLowerCase() || String(currentUser?.location || '').trim().toLowerCase() === String(request.fromLocation || '').trim().toLowerCase() || currentUser?.role === 'admin') && 
                     (String(request.applicationStatus || 'Pending').toLowerCase() === 'pending' || String(request.applicationStatus || '').toLowerCase() === 'accepted') && (
                        <button onClick={() => handleCancel(request)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('cancel')}>
                            <XMarkIcon className="h-5 w-5"/>
                        </button>
                    )}

                    {/* Delete option for admin or creator (only if pending) */}
                    {(currentUser?.role === 'admin' || String(currentUser?.id || '').toLowerCase() === String(request.createdBy || '').toLowerCase()) && 
                     (String(request.applicationStatus || 'Pending').toLowerCase() === 'pending') && (
                        <button onClick={() => handleDelete(request)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('delete')}>
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                    )}

                    {/* Mark as Completed option for either Branch A or Branch B (only if Accepted) */}
                    {(String(currentUser?.location || '').trim().toLowerCase() === String(request.toLocation || '').trim().toLowerCase() || String(currentUser?.location || '').trim().toLowerCase() === String(request.fromLocation || '').trim().toLowerCase() || currentUser?.role === 'admin') && 
                     (String(request.applicationStatus || '').toLowerCase() === 'accepted') && 
                     (String(request.status || '').toLowerCase() === 'pending') && (
                        <button onClick={() => setRequestToComplete(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('markAsCompleted')}>
                            <CheckBadgeIcon className="h-5 w-5"/>
                        </button>
                    )}
                    
                    <button onClick={() => handleShare(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('shareViaWhatsApp')}>
                        <WhatsappIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={() => setRequestToPrint(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('printJobCard')}>
                        <PrinterIcon className="h-5 w-5"/>
                    </button>
                   </div>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">{t('noPendingRequests')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};