import React, { useState } from 'react';
import type { RepairRequest, Workshop } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface UpdateSituationModalProps {
  request: RepairRequest;
  workshops: Workshop[];
  onClose: () => void;
  onUpdate: (request: RepairRequest) => Promise<void>;
}

export const UpdateSituationModal: React.FC<UpdateSituationModalProps> = ({ request, workshops, onClose, onUpdate }) => {
  const { t, language } = useTranslation();
  const [jobSituation, setJobSituation] = useState<'Under process' | 'Hold' | 'Referred to another workshop'>(request.jobSituation || 'Under process');
  const [situationReason, setSituationReason] = useState(request.situationReason || '');
  const [referredWorkshopName, setReferredWorkshopName] = useState(request.referredWorkshopName || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jobSituation === 'Hold' && !situationReason.trim()) {
      alert(t('reasonRequiredForSituation') || 'Reason is required.');
      return;
    }
    if (jobSituation === 'Referred to another workshop' && (!situationReason.trim() || !referredWorkshopName.trim())) {
      alert(t('reasonAndWorkshopNameRequired') || 'Reason and workshop name are required.');
      return;
    }
    await onUpdate({ ...request, jobSituation, situationReason, referredWorkshopName });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('updateJobSituation')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('repairRequest_jobSituation')}</label>
            <select
              value={jobSituation}
              onChange={(e) => setJobSituation(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="Under process">{t('jobSituation_underProcess')}</option>
              <option value="Hold">{t('jobSituation_hold')}</option>
              <option value="Referred to another workshop">{t('jobSituation_referredToAnotherWorkshop')}</option>
            </select>
          </div>
          {(jobSituation === 'Hold' || jobSituation === 'Referred to another workshop') && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('situationReason')}</label>
              <textarea
                value={situationReason}
                onChange={(e) => setSituationReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}
          {jobSituation === 'Referred to another workshop' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('workshopName')}</label>
              <input
                type="text"
                value={referredWorkshopName}
                onChange={(e) => setReferredWorkshopName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">{t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
