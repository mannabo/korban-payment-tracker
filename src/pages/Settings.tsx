import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Users, Shield, Edit3, Mail } from 'lucide-react';
import DataInvestigation from '../components/DataInvestigation';
import { ChangeRequestManagement } from '../components/ChangeRequestManagement';
import AdminManagement from '../components/AdminManagement';
import EmailSettings from '../components/EmailSettings';
import { deleteOrphanedParticipants } from '../utils/firestore';

const Settings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'change-requests' | 'data-investigation' | 'admin-management' | 'data-cleanup' | 'email-settings'>('change-requests');
  const [showEmailSettings, setShowEmailSettings] = useState(false);
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

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SettingsIcon size={28} style={{ color: '#059669' }} />
          Tetapan Sistem
        </h2>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Urus tetapan aplikasi dan penyelenggaraan data
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSection('change-requests')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: activeSection === 'change-requests' ? '#f59e0b' : '#f3f4f6',
            color: activeSection === 'change-requests' ? 'white' : '#374151'
          }}
        >
          <Edit3 size={16} />
          Change Requests
        </button>

        <button
          onClick={() => setActiveSection('admin-management')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: activeSection === 'admin-management' ? '#dc2626' : '#f3f4f6',
            color: activeSection === 'admin-management' ? 'white' : '#374151'
          }}
        >
          <Shield size={16} />
          Admin Management
        </button>

        <button
          onClick={() => setActiveSection('data-investigation')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: activeSection === 'data-investigation' ? '#059669' : '#f3f4f6',
            color: activeSection === 'data-investigation' ? 'white' : '#374151'
          }}
        >
          <Database size={16} />
          Data Investigation
        </button>

        <button
          onClick={() => setActiveSection('data-cleanup')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: activeSection === 'data-cleanup' ? '#7c3aed' : '#f3f4f6',
            color: activeSection === 'data-cleanup' ? 'white' : '#374151'
          }}
        >
          <Users size={16} />
          Data Cleanup
        </button>

        <button
          onClick={() => setShowEmailSettings(true)}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#2563eb',
            color: 'white'
          }}
        >
          <Mail size={16} />
          Konfigurasi Email
        </button>
      </div>

      {/* Content Sections */}
      {activeSection === 'change-requests' && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} style={{ color: '#f59e0b' }} />
            Pengurusan Permohonan Perubahan Detail
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
            Semak dan luluskan permohonan perubahan maklumat peserta.
          </p>
          <ChangeRequestManagement />
        </div>
      )}

      {activeSection === 'admin-management' && (
        <div>
          <AdminManagement />
        </div>
      )}

      {activeSection === 'data-investigation' && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} style={{ color: '#059669' }} />
            Penyelidikan Data
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
            Alat untuk menganalisis dan menyemak konsistensi data dalam pangkalan data.
          </p>
          <DataInvestigation />
        </div>
      )}

      {activeSection === 'data-cleanup' && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} style={{ color: '#dc2626' }} />
          Penyelenggaraan Data
        </h3>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
          Fungsi untuk membersihkan dan membaiki isu data yang bermasalah.
        </p>
        
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Users size={16} style={{ color: '#dc2626' }} />
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626' }}>
              Bersihkan Peserta Orphaned
            </h4>
          </div>
          <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '16px' }}>
            Memadamkan peserta yang dirujuk kepada kumpulan yang tidak lagi wujud dalam sistem. 
            Ini membantu mengekalkan integriti data dan kiraan yang tepat.
          </p>
          <button
            onClick={handleCleanupOrphans}
            className="btn"
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🗑️ Bersihkan Peserta Orphaned
          </button>
        </div>
        </div>
      )}

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