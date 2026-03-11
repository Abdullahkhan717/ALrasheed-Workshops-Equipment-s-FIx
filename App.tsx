import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EquipmentView from './components/EquipmentView';
import RepairRequestView from './components/RepairRequestView';
import TransferRequestView from './components/TransferRequestView';
import OilLogView from './components/OilLogView';
import HistoryView from './components/HistoryView';
import ChangePasswordModal from './components/ChangePasswordModal';

import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { useLanguage } from './context/LanguageContext';
import { useTranslation } from 'react-i18next';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🔥 FIX #1 — Default value doesn't matter, it will be replaced by real sheet value
  const [lastJobCardNumber, setLastJobCardNumber] = useState<number>(262000);

  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const { language } = useLanguage();
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const {
    equipments,
    workshops,
    repairRequests,
    transferRequests,
    oilLogs,
    locations,
    loading,
    error,
    refetchData,
    createData,
    updateData,
    deleteData,
  } = useData();

  // 🔥 FIX #2 — Load real last job card number from Google Sheet
  useEffect(() => {
    if (repairRequests.length > 0) {
      const sorted = [...repairRequests].sort(
        (a, b) => Number(a.jobCardNumber) - Number(b.jobCardNumber)
      );

      const lastNumber = Number(sorted[sorted.length - 1].jobCardNumber);
      setLastJobCardNumber(lastNumber);
    }
  }, [repairRequests]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'equipment':
        return (
          <EquipmentView
            equipments={equipments}
            workshops={workshops}
            locations={locations}
            createData={createData}
            updateData={updateData}
            deleteData={deleteData}
          />
        );
      case 'repair':
        return (
          <RepairRequestView
            equipments={equipments}
            workshops={workshops}
            locations={locations}
            createData={createData}
            lastJobCardNumber={lastJobCardNumber}
            setLastJobCardNumber={setLastJobCardNumber}
            currentUser={currentUser}
          />
        );
      case 'transfer':
        return (
          <TransferRequestView
            equipments={equipments}
            locations={locations}
            createData={createData}
            updateData={updateData}
          />
        );
      case 'oil':
        return (
          <OilLogView
            equipments={equipments}
            oilLogs={oilLogs}
            createData={createData}
          />
        );
      case 'history':
        return (
          <HistoryView
            equipments={equipments}
            repairRequests={repairRequests}
            transferRequests={transferRequests}
            oilLogs={oilLogs}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className={`app-container ${language === 'ar' ? 'rtl' : ''}`}>
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setIsChangePasswordModalOpen={setIsChangePasswordModalOpen}
      />

      <div className="main-content">{renderView()}</div>

      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      )}
    </div>
  );
};

export default AppContent;
