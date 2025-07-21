import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import GroupManagement from './pages/GroupManagement';
import PaymentTracking from './pages/PaymentTracking';
import Settings from './pages/Settings';
import { ParticipantDashboard } from './pages/ParticipantDashboard';
import { StyledPublicPortal } from './pages/StyledPublicPortal';
import LoginForm from './components/LoginForm';
import LoadingSpinner from './components/LoadingSpinner';
import DataDiagnostics from './components/DataDiagnostics';
// import { TestPage } from './TestPage';
import { useAuthContext } from './contexts/AuthContext';
import { useResponsive } from './hooks/useResponsive';
import { Users, DollarSign, BarChart3, Settings as SettingsIcon, LogOut, Shield, FileText } from 'lucide-react';
import ReceiptManagement from './components/ReceiptManagement';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { user, loading, logout, userRole } = useAuthContext();
  const { isMobile, isSmallMobile } = useResponsive();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If no user, show public portal by default
  if (!user) {
    if (showAdminLogin) {
      return <LoginForm onBack={() => setShowAdminLogin(false)} />;
    }
    return <StyledPublicPortal onShowAdminLogin={() => setShowAdminLogin(true)} />;
  }

  // If participant, show participant dashboard
  if (userRole === 'participant') {
    return <ParticipantDashboard />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'groups', label: 'Pengurusan Kumpulan', icon: Users },
    { id: 'payments', label: 'Tracking Bayaran', icon: DollarSign },
    { id: 'receipts', label: 'Pengurusan Resit', icon: FileText },
    { id: 'diagnostics', label: 'Data Diagnostics', icon: Shield },
    { id: 'settings', label: 'Tetapan', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'groups':
        return <GroupManagement />;
      case 'payments':
        return <PaymentTracking />;
      case 'receipts':
        return <ReceiptManagement />;
      case 'diagnostics':
        return <DataDiagnostics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ 
        backgroundColor: '#059669', 
        color: 'white', 
        padding: '1rem 0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <h1 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 'bold', lineHeight: '1.2' }}>
              Sistem Tracking Korban Perdana - Masjid Al-Falah Kg Hang Tuah
            </h1>
            <p style={{ marginTop: '4px', opacity: 0.9, fontSize: 'clamp(12px, 3vw, 14px)' }}>
              Program Korban Hari Raya Haji 2026
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: '0' }}>
            <div style={{ textAlign: 'right', display: isSmallMobile ? 'none' : 'block' }}>
              <p style={{ margin: '0', fontSize: '12px', opacity: 0.9 }}>
                Selamat datang,
              </p>
              <p style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>
                {user?.displayName || user?.email?.split('@')[0] || 'Pengguna'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAdminLogin(false)}
                className="btn btn-secondary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '14px'
                }}
              >
                <Shield size={14} />
                <span style={{ display: isSmallMobile ? 'none' : 'inline' }}>Portal Awam</span>
              </button>
              <button 
                onClick={logout}
                className="btn btn-secondary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '14px'
                }}
              >
                <LogOut size={14} />
                <span style={{ display: isSmallMobile ? 'none' : 'inline' }}>Log Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb',
        padding: '0',
        overflowX: 'auto'
      }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '0', minWidth: 'max-content' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: isMobile ? '12px 16px' : '16px 24px',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '3px solid #059669' : '3px solid transparent',
                    color: activeTab === tab.id ? '#059669' : '#6b7280',
                    fontWeight: activeTab === tab.id ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: isMobile ? '14px' : '16px',
                    whiteSpace: 'nowrap',
                    minWidth: 'max-content'
                  }}
                >
                  <Icon size={isMobile ? 18 : 20} />
                  <span style={{ display: isSmallMobile ? 'none' : 'inline' }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '24px' }}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;