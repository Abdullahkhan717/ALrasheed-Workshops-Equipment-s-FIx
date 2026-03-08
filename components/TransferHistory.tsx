import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { ArrowsRightLeftIcon, DocumentTextIcon } from './Icons';

export const TransferHistory: React.FC = () => {
  const { t } = useTranslation();
  const { transferRequests, equipments } = useData();

  const completedTransfers = transferRequests.filter(req => 
    req.status.toLowerCase() === 'accepted' || req.status.toLowerCase() === 'rejected'
  ).sort((a, b) => new Date(b.approvalDate || '').getTime() - new Date(a.approvalDate || '').getTime());

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('equipment')}</th>
            <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('transferDetails')}</th>
            <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requester')}</th>
            <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('approver')}</th>
            <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {completedTransfers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                {t('noTransferHistoryFound')}
              </td>
            </tr>
          ) : (
            completedTransfers.map((req) => {
              const equipment = equipments.find(e => e.id === req.equipmentId);
              return (
                <tr key={req.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ms-4">
                        <div className="text-sm font-bold text-gray-900">
                          {equipment?.equipmentNumber || req.equipmentId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {equipment?.serialNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <span>{req.fromLocation}</span>
                      <ArrowsRightLeftIcon className="h-3 w-3 mx-2 text-gray-400" />
                      <span className="text-blue-600">{req.toLocation}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                      {req.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{req.requesterName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(req.requestDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{req.approvedBy || '-'}</div>
                    <div className="text-xs text-gray-500">
                      {req.approvalDate ? new Date(req.approvalDate).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      req.status.toLowerCase() === 'accepted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t(req.status.toLowerCase())}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
