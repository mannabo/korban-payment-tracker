import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Database, 
  Users, 
  Shield, 
  Edit3, 
  Mail, 
  HardDrive,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import DataInvestigation from '../components/DataInvestigation';
import DataDiagnostics from '../components/DataDiagnostics';
import { ChangeRequestManagement } from '../components/ChangeRequestManagement';
import AdminManagement from '../components/AdminManagement';
import EmailSettings from '../components/EmailSettings';
import StorageManagement from '../components/StorageManagement';
import { deleteOrphanedParticipants } from '../utils/firestore';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'change-requests' | 'data-investigation' | 'data-diagnostics' | 'admin-management' | 'data-cleanup' | 'email-settings' | 'storage-management'>('change-requests');
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsiveness
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false); // Close mobile sidebar when switching to desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const handleCleanupOrphans = async () => {
    if (!window.confirm('Adakah anda pasti ingin memadamkan peserta yang orphaned? Ini akan memadamkan peserta yang tidak mempunyai kumpulan yang sah.')) {
      return;
    }
    
    try {
      const deletedCount = await deleteOrphanedParticipants();
      alert(`Berjaya memadamkan ${deletedCount} peserta orphaned!`);
    } catch (error) {
      console.error('Error cleaning orphaned participants:', error);
      alert('Terdapat ralat semasa membersihkan data. Sila cuba lagi.');
    }
  };

  // Menu items configuration
  const menuItems = [
    {
      id: 'change-requests',
      label: 'Change Requests',
      icon: Edit3,
      color: '#f59e0b',
      description: 'Semak dan luluskan permohonan perubahan maklumat peserta'
    },
    {
      id: 'admin-management',
      label: 'Admin Management',
      icon: Shield,
      color: '#dc2626',
      description: 'Pengurusan akaun admin dan kebenaran akses'
    },
    {
      id: 'data-investigation',
      label: 'Data Investigation',
      icon: Database,
      color: '#059669',
      description: 'Analisis dan semak konsistensi data dalam pangkalan data'
    },
    {
      id: 'data-diagnostics',
      label: 'Data Diagnostics',
      icon: Shield,
      color: '#dc2626',
      description: 'Diagnosis dan pembetulan isu data secara automatik'
    },
    {
      id: 'storage-management',
      label: 'Storage Management',
      icon: HardDrive,
      color: '#3b82f6',
      description: 'Monitor penggunaan storage dan backup data'
    },
    {
      id: 'data-cleanup',
      label: 'Data Cleanup',
      icon: Users,
      color: '#7c3aed',
      description: 'Penyelenggaraan dan pembersihan data bermasalah'
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 140px)' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
            display: !isMobile ? 'none' : 'block'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        width: !isMobile ? '280px' : sidebarOpen ? '280px' : '0',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        position: !isMobile ? 'sticky' : 'fixed',
        top: '0',
        left: !isMobile ? '0' : sidebarOpen ? '0' : '-280px',
        height: !isMobile ? 'calc(100vh - 140px)' : '100vh',
        overflowY: 'auto',
        transition: 'left 0.3s ease-in-out, width 0.3s ease-in-out',
        zIndex: 50,
        boxShadow: !isMobile ? 'none' : '2px 0 10px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              Tetapan Sistem
            </h3>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '0.25rem'
              }}
            >
              <X size={20} style={{ color: '#6b7280' }} />
            </button>
          </div>
        )}

        {/* Sidebar Header (Desktop) */}
        {!isMobile && (
          <div style={{ padding: '1.5rem 1rem 1rem 1rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#111827'
            }}>
              <SettingsIcon size={24} style={{ color: '#059669' }} />
              Tetapan Sistem
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
              Urus tetapan aplikasi dan penyelenggaraan data
            </p>
          </div>
        )}

        {/* Menu Items */}
        <nav style={{ padding: '0 0.5rem' }}>
          {menuItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id as any);
                  setSidebarOpen(false); // Close mobile sidebar
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  margin: '0.25rem 0',
                  backgroundColor: isActive ? `${item.color}15` : 'transparent',
                  border: isActive ? `1px solid ${item.color}30` : '1px solid transparent',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: isActive ? item.color : '#374151',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <item.icon size={18} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '500' }}>{item.label}</div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: isActive ? `${item.color}aa` : '#6b7280',
                    lineHeight: '1.2',
                    marginTop: '0.125rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <ChevronRight size={16} style={{ color: item.color }} />
                )}
              </button>
            );
          })}

          {/* Email Settings Button */}
          <button
            onClick={() => setShowEmailSettings(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              margin: '0.5rem 0',
              backgroundColor: '#2563eb15',
              border: '1px solid #2563eb30',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#2563eb',
              textAlign: 'left'
            }}
          >
            <Mail size={18} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '500' }}>Konfigurasi Email</div>
              <div style={{
                fontSize: '0.75rem',
                color: '#2563ebaa',
                lineHeight: '1.2',
                marginTop: '0.125rem'
              }}>
                Setup email untuk payment reminders
              </div>
            </div>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {/* Mobile Header */}
        {isMobile && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #e5e7eb',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Menu size={20} style={{ color: '#374151' }} />
            </button>
            <div>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#111827',
                margin: 0
              }}>
                {menuItems.find(item => item.id === activeSection)?.label || 'Tetapan'}
              </h1>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div style={{ padding: !isMobile ? '2rem' : '1rem' }}>
          {/* Content Sections */}
          {activeSection === 'change-requests' && (
            <ChangeRequestManagement />
          )}

          {activeSection === 'admin-management' && (
            <AdminManagement />
          )}

          {activeSection === 'data-investigation' && (
            <DataInvestigation />
          )}

          {activeSection === 'data-diagnostics' && (
            <DataDiagnostics />
          )}

          {activeSection === 'storage-management' && (
            <StorageManagement />
          )}

          {activeSection === 'data-cleanup' && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#111827'
              }}>
                <Users size={20} style={{ color: '#7c3aed' }} />
                Penyelenggaraan Data
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                Fungsi untuk membersihkan dan membaiki isu data yang bermasalah.
              </p>
              
              <div style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <Users size={16} style={{ color: '#dc2626' }} />
                  <h4 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#dc2626',
                    margin: 0
                  }}>
                    Bersihkan Peserta Orphaned
                  </h4>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#7f1d1d',
                  marginBottom: '1rem',
                  lineHeight: '1.4'
                }}>
                  Memadamkan peserta yang dirujuk kepada kumpulan yang tidak lagi wujud dalam sistem. 
                  Ini membantu mengekalkan integriti data dan kiraan yang tepat.
                </p>
                <button
                  onClick={handleCleanupOrphans}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  🗑️ Bersihkan Peserta Orphaned
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Settings Modal */}
      {showEmailSettings && (
        <EmailSettings
          onClose={() => setShowEmailSettings(false)}
        />
      )}
    </div>
  );
};

export default Settings;