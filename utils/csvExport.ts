import type { RepairRequest, Equipment, Workshop } from '../types';

type TFunction = (key: string) => string;

export const downloadHistoryCSV = (
  requests: RepairRequest[],
  equipments: Equipment[],
  workshops: Workshop[],
  fileName: string = 'repair-history.csv',
  workshopId?: string,
  t?: TFunction
) => {
  const getEquipmentInfo = (equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    return equipment ? `${equipment.equipmentNumber} (${equipment.serialNumber})` : (t ? t('unknown') : 'Unknown');
  };

  const csvRows: string[] = [];

  // Headers
  const headers = t ? [t('csv_job'), t('csv_equipment'), t('csv_dateIn'), t('csv_mileage'), t('csv_status'), t('csv_workshop'), t('csv_mechanic'), t('csv_fault')] : ["Job #", "Equipment", "Date In", "Mileage", "Status", "Workshop", "Mechanic", "Fault"];
  csvRows.push(headers.join(","));

  // Rows
  requests.forEach(req => {
    const equipmentInfo = getEquipmentInfo(req.equipmentId);
    
    let faultsToExport = req.faults;
    if (workshopId) {
        faultsToExport = req.faults.filter(fault => fault.workshopId === workshopId);
    }
    
    if (faultsToExport.length === 0) {
      const row = [
        req.id,
        `"${equipmentInfo}"`,
        req.dateIn,
        req.mileage || '',
        req.status,
        '', // Workshop
        '', // Mechanic
        ''  // Fault
      ].join(",");
      csvRows.push(row);
    } else {
      faultsToExport.forEach(fault => {
        const workshop = workshops.find(w => w.id === fault.workshopId);
        const workshopName = workshop ? workshop.subName : 'N/A';
        const mechanicName = fault.mechanicName || '';

        const row = [
          req.id,
          `"${equipmentInfo}"`,
          req.dateIn,
          req.mileage || '',
          req.status,
          `"${workshopName}"`,
          `"${mechanicName}"`,
          `"${fault.description.replace(/"/g, '""')}"`
        ].join(",");
        csvRows.push(row);
      });
    }
  });

  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
