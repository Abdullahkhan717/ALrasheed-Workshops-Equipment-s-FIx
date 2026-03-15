import React, { useRef, useEffect } from 'react';
import type { RepairRequest, Equipment, Workshop } from '../types';
import { XMarkIcon, PrinterIcon, DownloadIcon, ShareIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

import { useData } from '../context/DataContext';

declare const jspdf: any;
declare const html2canvas: any;

import { formatDate, formatTime } from '../utils/formatters';

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

  const generatePdfBlob = async (): Promise<{ blob: Blob; pdf: any } | null> => {
    if (!printRef.current) return null;
    try {
      const element = printRef.current;
      const { jsPDF } = jspdf;
      
      // Use html2canvas to capture the element
      // We don't need to force width here if we set it in the style, 
      // but let's ensure it's captured at a high resolution
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800 // Force the virtual window width for consistent layout
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      return { blob: pdf.output('blob'), pdf };
    } catch (error) {
      console.error("Error generating PDF blob", error);
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    const result = await generatePdfBlob();
    if (result) {
      result.pdf.save(`JobCard-${request.id}.pdf`);
    } else {
      alert(t('alert_pdfError'));
    }
  };

  const handleShare = async () => {
    const equipmentInfo = language === 'ar' && equipment?.arabicName 
      ? `${equipment.arabicName} (${equipment?.serialNumber})` 
      : `${equipment?.equipmentNumber} (${equipment?.serialNumber})`;
    
    const message = `${t('shareMessage')} ${equipmentInfo}. \n${t('jobCardNo')}: ${request.id}`;
    
    try {
      // Try Web Share API first (better for mobile)
      if (navigator.share) {
        const result = await generatePdfBlob();
        if (result) {
          const file = new File([result.blob], `JobCard-${request.id}.pdf`, { type: 'application/pdf' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Job Card ${request.id}`,
              text: message,
            });
            return;
          }
        }
        
        // If file sharing not supported but text sharing is
        await navigator.share({
          title: `Job Card ${request.id}`,
          text: message,
        });
      } else {
        throw new Error('Web Share not supported');
      }
    } catch (error) {
      // Fallback to WhatsApp
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      
      // If they wanted to share, they probably want the PDF too
      const result = await generatePdfBlob();
      if (result) {
        result.pdf.save(`JobCard-${request.id}.pdf`);
      }
    }
  };

  useEffect(() => {
    if (onShare) {
        handleShare();
    }
  }, [onShare]);

  const toLocationData = allLocations.find(l => l.name === request.toLocation);
  const primaryForeman = toLocationData?.workshopManager || 'Waseem khan';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-0 md:p-4">
      <div className="bg-gray-100 rounded-none md:rounded-lg w-full max-w-4xl h-full md:max-h-[90vh] flex flex-col">
        <div className="p-4 bg-white sticky top-0 z-10 flex justify-between items-center print:hidden border-b shrink-0">
            <h2 className="text-sm md:text-lg font-bold truncate mr-2">{t('jobCardPreview')}</h2>
            <div className="flex items-center gap-1 md:gap-2">
                 <button 
                  onClick={handleDownloadPdf} 
                  className="flex items-center bg-green-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-green-700 transition-colors"
                  title={t('downloadPDF')}
                >
                    <DownloadIcon className="h-5 w-5 md:me-2" />
                    <span className="hidden md:inline text-sm font-medium">{t('downloadPDF')}</span>
                </button>
                <button 
                  onClick={handleShare} 
                  className="flex items-center bg-teal-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-teal-700 transition-colors"
                  title={t('shareOnWhatsApp')}
                >
                    <ShareIcon className="h-5 w-5 md:me-2" />
                    <span className="hidden md:inline text-sm font-medium">{t('shareOnWhatsApp')}</span>
                </button>
                <button 
                  onClick={handlePrint} 
                  className="hidden sm:flex items-center bg-gray-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title={t('print')}
                >
                    <PrinterIcon className="h-5 w-5 md:me-2" />
                    <span className="hidden md:inline text-sm font-medium">{t('print')}</span>
                </button>
                <button onClick={onClose} className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors ml-1">
                    <XMarkIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-200 p-0 md:p-4 flex justify-center">
          <div 
            id="print-section" 
            className="p-4 md:p-8 bg-white shadow-lg origin-top scale-[0.45] sm:scale-75 md:scale-100" 
            style={{ width: '800px', minHeight: '1123px', flexShrink: 0 }} 
            ref={printRef} 
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">Workshop Repair Request / طلب اصلاح بالورشہ</h1>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-6">
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Workshop Name:</span>
                <span>{workshops.find(w => String(w.id) === String(request.workshopId))?.subName || '-'}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Foreman Name:</span>
                <span>{workshops.find(w => String(w.id) === String(request.workshopId))?.foreman || '-'}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Request Job Number:</span>
                <span>{request.id}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Date In:</span>
                <span>{formatDate(request.dateIn)}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Time In:</span>
                <span>{formatTime(request.timeIn)}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Equipment Detail:</span>
                <span>{t(equipment.equipmentType)}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Equipment Number:</span>
                <span>{equipment.equipmentNumber}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Equipment Company Number:</span>
                <span>{equipment.serialNumber}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Body Type and Number:</span>
                <span>{equipment.make} {equipment.modelNumber}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Driver / Requester Name:</span>
                <span>{request.driverName}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Complaints:</span>
                <span>{request.faults.map(f => f.description).join(', ')}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Out Date:</span>
                <span>{request.dateOut ? formatDate(request.dateOut) : '-'}</span>
              </div>
              <div className="flex border-b border-gray-300 py-1">
                <span className="font-bold w-48">Out Time:</span>
                <span>{request.timeOut ? formatTime(request.timeOut) : '-'}</span>
              </div>
            </div>

            <div className="mt-12 flex justify-between">
              <div className="text-center">
                <div className="border-t border-black pt-2 px-4">
                  <p className="font-bold">Sign Workshop Foreman</p>
                  <p>(sing)__________</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-2 px-4">
                  <p className="font-bold">Sign Mechanic</p>
                  <p>(sing)__________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
);
};