import React, { useState } from 'react';
import { RepairRequest, Workshop } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';

interface UpdateStatusModalProps {
    request: RepairRequest;
    workshops: Workshop[];
    onClose: () => void;
    onSave: (updatedRequest: RepairRequest) => Promise<void>;
}

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({ request, workshops, onClose, onSave }) => {
    const { t } = useTranslation();
    const [currentJobStatus, setCurrentJobStatus] = useState<'Under process' | 'Hold' | 'Refer to another workshop'>(request.currentJobStatus || 'Under process');
    const [statusReason, setStatusReason] = useState(request.statusReason || '');
    const [referredWorkshopId, setReferredWorkshopId] = useState(request.referredWorkshopId || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (currentJobStatus === 'Hold' && !statusReason.trim()) {
            alert('Please enter a reason for holding the job.');
            return;
        }
        
        if (currentJobStatus === 'Refer to another workshop' && (!referredWorkshopId || !statusReason.trim())) {
            alert('Please select a workshop and enter a reason for referral.');
            return;
        }

        const updatedRequest = {
            ...request,
            currentJobStatus,
            statusReason: currentJobStatus === 'Under process' ? '' : statusReason,
            referredWorkshopId: currentJobStatus === 'Refer to another workshop' ? referredWorkshopId : ''
        };

        await onSave(updatedRequest);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Update Job Status</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            value={currentJobStatus}
                            onChange={(e) => setCurrentJobStatus(e.target.value as any)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="Under process">Under process</option>
                            <option value="Hold">Hold</option>
                            <option value="Refer to another workshop">Refer to another workshop</option>
                        </select>
                    </div>

                    {(currentJobStatus === 'Hold' || currentJobStatus === 'Refer to another workshop') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                            <textarea
                                value={statusReason}
                                onChange={(e) => setStatusReason(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                    )}

                    {currentJobStatus === 'Refer to another workshop' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Workshop</label>
                            <select
                                value={referredWorkshopId}
                                onChange={(e) => setReferredWorkshopId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            >
                                <option value="">Select Workshop</option>
                                {workshops.map(w => (
                                    <option key={w.id} value={w.id}>{w.subName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Update</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
