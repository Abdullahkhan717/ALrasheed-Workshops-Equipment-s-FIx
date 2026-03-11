import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const RepairRequestView = ({
  equipments,
  workshops,
  locations,
  createData,
  lastJobCardNumber,
  setLastJobCardNumber,
  currentUser,
}) => {
  const { t } = useTranslation();

  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [remarks, setRemarks] = useState('');

  // 🔥 FIX #1 — Always generate correct next job card number
  const newJobCardNumber = lastJobCardNumber + 1;

  const handleSubmit = async () => {
    if (!selectedEquipment || !fromLocation || !toLocation) {
      alert('Please fill all fields');
      return;
    }

    // 🔥 FIX #2 — Correct application type logic
    const appType =
      fromLocation === toLocation
        ? 'Internal Repair Order (IRO)'
        : 'Outsourced / External Service';

    const isIRO = appType === 'Internal Repair Order (IRO)';

    const newRequest = {
      jobCardNumber: newJobCardNumber.toString(),
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      fromLocation,
      toLocation,
      requestedBy: currentUser?.name || 'Unknown',
      applicationType: appType,
      applicationStatus: isIRO ? 'Accepted' : 'Pending',
      remarks,
      createdAt: new Date().toISOString(),
    };

    // 🔥 FIX #3 — Save to Google Sheet
    await createData('RepairRequests', newRequest);

    // Update job card number in App.tsx
    setLastJobCardNumber(newJobCardNumber);

    alert(`Request Created Successfully. Job Card: ${newJobCardNumber}`);

    // Reset form
    setSelectedEquipment(null);
    setFromLocation('');
    setToLocation('');
    setRemarks('');
  };

  return (
    <div className="repair-request-container">
      <h2>{t('Create Repair Request')}</h2>

      <div className="form-section">
        <label>{t('Select Equipment')}</label>
        <select
          value={selectedEquipment?.id || ''}
          onChange={(e) => {
            const eq = equipments.find((x) => x.id === e.target.value);
            setSelectedEquipment(eq);
          }}
        >
          <option value="">{t('Choose')}</option>
          {equipments.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <label>{t('From Location')}</label>
        <select value={fromLocation} onChange={(e) => setFromLocation(e.target.value)}>
          <option value="">{t('Choose')}</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <label>{t('To Location')}</label>
        <select value={toLocation} onChange={(e) => setToLocation(e.target.value)}>
          <option value="">{t('Choose')}</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <label>{t('Remarks')}</label>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        ></textarea>
      </div>

      <button onClick={handleSubmit} className="submit-btn">
        {t('Submit Request')}
      </button>
    </div>
  );
};

export default RepairRequestView;
