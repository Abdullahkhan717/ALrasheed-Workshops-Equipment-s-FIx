import React, { useRef, useEffect } from 'react';
import type { RepairRequest, Equipment, Workshop } from '../types';
import { XMarkIcon, PrinterIcon, DownloadIcon, ShareIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

import { useData } from '../context/DataContext';

declare const jspdf: any;
declare const html2canvas: any;

interface JobCardProps {
  request: RepairRequest;
  equipment: Equipment;
  workshops: Workshop[];
  onClose: () => void;
  onShare?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ request, equipment, workshops, onClose, onShare }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { t, language } = useTranslation();
  const { locations: allLocations } = useData();
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const { jsPDF } = jspdf;
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`JobCard-${request.id}.pdf`);
    } catch (error) {
        console.error("Error generating PDF", error);
        alert(t('alert_pdfError'));
    }
  };

  const handleGeneratePdfForShare = async () => {
    if (!printRef.current) return;
    try {
      const { jsPDF } = jspdf;
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`JobCard-${request.id}.pdf`);
      
      const equipmentInfo = language === 'ar' && equipment?.arabicName ? `${equipment.arabicName} (${equipment?.serialNumber})` : `${equipment?.equipmentNumber} (${equipment?.serialNumber})`;
      const message = `${t('shareMessage')} ${equipmentInfo}. \n${t('jobCardNo')}: ${request.id}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      
      onClose();
    } catch (error) {
        console.error("Error generating PDF for sharing", error);
        alert(t('alert_pdfShareError'));
    }
  };

  useEffect(() => {
    if (onShare) {
        handleGeneratePdfForShare();
    }
  }, [onShare]);

  const toLocationData = allLocations.find(l => l.name === request.toLocation);
  const primaryForeman = toLocationData?.workshopManager || 'Waseem khan';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg w-full max-w-4xl max-h-full overflow-y-auto">
        <div className="p-4 bg-white sticky top-0 z-10 flex justify-between items-center print:hidden border-b">
            <h2 className="text-lg font-bold">{t('jobCardPreview')}</h2>
            <div>
                 <button onClick={handleDownloadPdf} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg me-2 hover:bg-green-700">
                    <DownloadIcon className="h-5 w-5 me-2" />
                    {t('downloadPDF')}
                </button>
                <button onClick={handleGeneratePdfForShare} className="flex items-center bg-teal-600 text-white px-4 py-2 rounded-lg me-2 hover:bg-teal-700">
                    <ShareIcon className="h-5 w-5 me-2" />
                    {t('shareOnWhatsApp')}
                </button>
                <button onClick={handlePrint} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg me-2 hover:bg-green-700">
                    <PrinterIcon className="h-5 w-5 me-2" />
                    {t('print')}
                </button>
                <button onClick={onClose} className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
        
        <div id="print-section" className="p-8 bg-white" ref={printRef} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <div className="border-b-2 border-black pb-4 mb-4">
            <h1 className="text-4xl font-bold text-center">WORKSHOP JOB CARD</h1>
            <h2 className="text-xl font-semibold text-center mt-1 uppercase">AL rasheed Co workshop</h2>
            <p className="text-center text-gray-600 font-bold mt-2">Repair Request</p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6 text-start">
            <div className="text-sm">
                <p><strong className="w-28 inline-block">{t('jobCardNo')}:</strong> {request.id}</p>
                <p><strong className="w-28 inline-block">{t('dateIn')}:</strong> {request.dateIn}</p>
                <p><strong className="w-28 inline-block">{t('timeIn')}:</strong> {request.timeIn}</p>
                <p><strong className="w-28 inline-block">Request From:</strong> {request.fromLocation || '-'}</p>
                <p><strong className="w-28 inline-block">To:</strong> {request.toLocation || '-'}</p>
            </div>
            <div className="text-sm">
                <p><strong className="w-28 inline-block">{t('status')}:</strong> {t(request.status.toLowerCase() as 'pending' | 'completed')}</p>
                <p><strong className="w-28 inline-block">{t('purpose')}:</strong> {t(`purpose_${request.purpose.toLowerCase().replace(/ /g, '_')}`)}</p>
                <p><strong className="w-28 inline-block">{t('complainerOperatorName')}:</strong> {request.driverName}</p>
                <p><strong className="w-28 inline-block">{t('mileage')}:</strong> {request.mileage || 'N/A'}</p>
            </div>
          </div>

          {(request.status === 'Rejected' || request.status === 'Cancelled') && request.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-start">
                <p className="text-red-700 font-bold mb-1">
                    {request.status === 'Rejected' ? t('rejectionReason') : t('cancellationReason')}:
                </p>
                <p className="text-red-600">{request.rejectionReason}</p>
                {request.acceptedBy && (
                    <p className="text-xs text-red-500 mt-2">
                        {t('actionBy')}: {request.acceptedBy} {request.approvalDate ? `on ${new Date(request.approvalDate).toLocaleString()}` : ''}
                    </p>
                )}
            </div>
          )}

          {request.status === 'Accepted' && request.acceptedBy && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-start">
                <p className="text-green-700 font-bold">
                    {t('acceptedBy')}: <span className="font-normal text-green-600">{request.acceptedBy}</span>
                </p>
                {request.approvalDate && (
                    <p className="text-xs text-green-500 mt-1">
                        {t('approvalDate')}: {new Date(request.approvalDate).toLocaleString()}
                    </p>
                )}
            </div>
          )}
          
          <div className="border rounded-lg p-4 mb-6 text-start">
              <h3 className="font-bold text-lg mb-2 border-b pb-1">{t('equipmentDetails')}</h3>
              <div className="grid grid-cols-2 gap-x-4">
                <p><strong className="w-32 inline-block">{t('type')}:</strong> {language === 'ar' && equipment.arabicName ? equipment.arabicName : t(equipment.equipmentType)}</p>
                <p><strong className="w-32 inline-block">{t('equipmentNumber')}:</strong> {language === 'ar' && equipment.arabicName ? equipment.arabicName : equipment.equipmentNumber}</p>
                <p><strong className="w-32 inline-block">{t('make')}:</strong> {equipment.make}</p>
                <p><strong className="w-32 inline-block">{t('model')}:</strong> {equipment.modelNumber}</p>
                <p><strong className="w-32 inline-block">{t('serialNumber')}:</strong> {equipment.serialNumber}</p>
                <p><strong className="w-32 inline-block">{t('power')}:</strong> {equipment.power || '-'}</p>
                <p><strong className="w-32 inline-block">{t('location')}:</strong> {equipment.branchLocation}</p>
              </div>
          </div>
          
          <div className='text-start mb-6'>
            <h3 className="font-bold text-lg mb-2 border-b pb-1">{t('jobCard_faultsReported')}</h3>
            <table className="min-w-full border border-gray-300 table-fixed">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 border text-start w-16">{t('sr')}</th>
                        <th className="p-2 border text-start w-48">{t('workshop')}</th>
                        <th className="p-2 border text-start w-48">{t('mechanic')}</th>
                        <th className="p-2 border text-start">{t('faultDescription')}</th>
                    </tr>
                </thead>
                <tbody>
                    {request.faults.map((fault, index) => {
                        const workshop = workshops.find(w => String(w.id) === String(fault.workshopId));
                        return (
                            <tr key={fault.id}>
                                <td className="p-2 border text-center">{index + 1}</td>
                                <td className="p-2 border break-words">{workshop?.subName || 'N/A'}</td>
                                <td className="p-2 border break-words">{fault.mechanicName || ''}</td>
                                <td className="p-2 border break-words">{fault.description}</td>
                            </tr>
                        )
                    })}
                     {request.status === 'Pending' && Array.from({ length: Math.max(0, 10 - request.faults.length) }).map((_, index) => (
                        <tr key={`empty-${index}`}>
                            <td className="p-2 border text-center h-8">{request.faults.length + index + 1}</td>
                            <td className="p-2 border"></td>
                            <td className="p-2 border"></td>
                            <td className="p-2 border"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

          {request.status === 'Completed' && (
            <div className='text-start'>
                <h3 className="font-bold text-lg mb-2 border-b pb-1">{t('workDone_and_parts_used')}</h3>
                {request.faults.map((fault, index) => (
                    <div key={fault.id} className="mb-4 border-b pb-2">
                        <p className="font-semibold">{index + 1}. {t('fault_colon')} <span className="font-normal">{fault.description}</span></p>
                        <p className="mt-1 font-semibold">{t('workDone_colon')} <span className="font-normal whitespace-pre-wrap">{fault.workDone || 'N/A'}</span></p>
                        {fault.partsUsed && fault.partsUsed.length > 0 && (
                            <div className="mt-2">
                                <p className="font-semibold">{t('partsUsed')}:</p>
                                <table className="min-w-full border border-gray-200 mt-1 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-1 border text-start">{t('partName')}</th>
                                            <th className="p-1 border text-start w-24">{t('quantity')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fault.partsUsed.map(part => (
                                            <tr key={part.id}>
                                                <td className="p-1 border">{part.name}</td>
                                                <td className="p-1 border">{part.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
            </div>
          )}


          <div className="mt-16 grid grid-cols-3 gap-8 text-center text-sm">
            <div>
                <p className="border-t border-gray-400 pt-2">{t('driverSignature')}</p>
            </div>
             <div>
                <p className="font-semibold">{primaryForeman}</p>
                <p className="border-t border-gray-400 pt-2 mt-2">{t('foremanSignature')}</p>
            </div>
             <div>
                <p className="border-t border-gray-400 pt-2">{t('workshopManagerSignature')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};