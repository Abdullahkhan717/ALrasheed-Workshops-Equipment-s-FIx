import React, { useState, useEffect } from 'react';
import type { RepairRequest, Fault } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon, PlusIcon, TrashIcon } from './Icons';

interface CompletionFormModalProps {
  request: RepairRequest;
  onClose: () => void;
  onSave: (completedRequest: RepairRequest) => void;
}

type EditableFault = Omit<Fault, 'partsUsed'> & {
    partsUsed: { id: string; name: string; quantity: string }[];
};

export const CompletionFormModal: React.FC<CompletionFormModalProps> = ({ request, onClose, onSave }) => {
  const { t } = useTranslation();
  const [faults, setFaults] = useState<EditableFault[]>([]);
  const [dateOut, setDateOut] = useState('');
  const [timeOut, setTimeOut] = useState('');

  useEffect(() => {
    // Initialize form state from request prop
    setFaults(request.faults.map(f => ({
      ...f,
      workDone: f.workDone || '',
      partsUsed: f.partsUsed?.map(p => ({...p})) || []
    })));
    const now = new Date();
    setDateOut(request.dateOut || now.toISOString().split('T')[0]);
    setTimeOut(request.timeOut || now.toTimeString().slice(0, 5));
  }, [request]);

  const handleFaultChange = (faultId: string, field: 'workDone', value: string) => {
    setFaults(currentFaults => 
        currentFaults.map(f => f.id === faultId ? { ...f, [field]: value } : f)
    );
  };
  
  const handlePartChange = (faultId: string, partId: string, field: 'name' | 'quantity', value: string) => {
    setFaults(currentFaults => 
        currentFaults.map(f => {
            if (f.id === faultId) {
                return {
                    ...f,
                    partsUsed: f.partsUsed.map(p => p.id === partId ? { ...p, [field]: value } : p)
                };
            }
            return f;
        })
    );
  };

  const handleAddPart = (faultId: string) => {
    setFaults(currentFaults =>
      currentFaults.map(f => 
        f.id === faultId 
          ? { ...f, partsUsed: [...f.partsUsed, { id: crypto.randomUUID(), name: '', quantity: '1' }] }
          : f
      )
    );
  };
  
  const handleRemovePart = (faultId: string, partId: string) => {
     setFaults(currentFaults =>
      currentFaults.map(f => 
        f.id === faultId 
          ? { ...f, partsUsed: f.partsUsed.filter(p => p.id !== partId) }
          : f
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOut || !timeOut) {
        alert(t('alert_enterDateAndTimeOut'));
        return;
    }

    if (faults.some(f => !f.workDone?.trim())) {
        alert(t('alert_addWorkDone'));
        return;
    }
    
    const cleanedFaults = faults.map(f => ({
        ...f,
        partsUsed: f.partsUsed.filter(p => p.name.trim() && p.quantity.trim())
    }));

    const completedRequest: RepairRequest = {
        ...request,
        faults: cleanedFaults,
        dateOut,
        timeOut,
        status: 'Completed',
    };
    onSave(completedRequest);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-up">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">{t('workDone')}</h2>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
            {faults.map((fault, index) => (
                <div key={fault.id} className="p-4 border rounded-lg bg-gray-50">
                    <p className="font-semibold text-gray-800 mb-2">{index + 1}. {t('fault_colon')} <span className="font-normal text-gray-600">{fault.description}</span></p>
                    
                    <div>
                        <label htmlFor={`workDone-${fault.id}`} className="block text-sm font-medium text-gray-700">{t('workDone')}</label>
                        <textarea
                            id={`workDone-${fault.id}`}
                            value={fault.workDone}
                            onChange={(e) => handleFaultChange(fault.id, 'workDone', e.target.value)}
                            rows={3}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            placeholder="..."
                        />
                    </div>

                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('partsUsed')}</h4>
                        <div className="space-y-2">
                            {fault.partsUsed.map(part => (
                                <div key={part.id} className="grid grid-cols-[1fr_100px_auto] gap-2 items-center">
                                    <input type="text" value={part.name} onChange={(e) => handlePartChange(fault.id, part.id, 'name', e.target.value)} placeholder={t('partName')} className="p-2 border border-gray-300 rounded-md text-sm"/>
                                    <input type="text" value={part.quantity} onChange={(e) => handlePartChange(fault.id, part.id, 'quantity', e.target.value)} placeholder={t('quantity')} className="p-2 border border-gray-300 rounded-md text-sm"/>
                                    <button type="button" onClick={() => handleRemovePart(fault.id, part.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
                                        <TrashIcon className="h-4 w-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => handleAddPart(fault.id)} className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800">
                           <PlusIcon className="h-4 w-4 me-1" /> {t('addPart')}
                        </button>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="p-6 border-t mt-auto bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-end space-x-4">
                <div>
                    <label className="block text-xs font-medium text-gray-600">{t('dateOut')}</label>
                    <input type="date" value={dateOut} onChange={e => setDateOut(e.target.value)} className="p-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600">{t('timeOut')}</label>
                    <input type="time" value={timeOut} onChange={e => setTimeOut(e.target.value)} className="p-2 border border-gray-300 rounded-md"/>
                </div>
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                  {t('cancel')}
                </button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  {t('saveCompletion')}
                </button>
            </div>
        </div>
      </form>
    </div>
  );
};
