import React from 'react';
import { AlertTriangle, Wifi, RefreshCw, Shield, HelpCircle } from 'lucide-react';

const UploadTroubleshooting: React.FC = () => {
  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <AlertTriangle size={20} color="#d97706" />
        <h4 style={{ margin: 0, color: '#92400e' }}>Troubleshooting Upload Issues</h4>
      </div>
      
      <div style={{ fontSize: '14px', color: '#92400e' }}>
        <p style={{ marginBottom: '12px' }}>
          Jika upload gagal, cuba langkah-langkah berikut:
        </p>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Wifi size={16} color="#d97706" />
            <strong>1. Semak Sambungan Internet</strong>
          </div>
          <ul style={{ margin: '0 0 0 24px', paddingLeft: '0' }}>
            <li>Pastikan WiFi/data aktif dan stabil</li>
            <li>Cuba buka website lain untuk test connection</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <RefreshCw size={16} color="#d97706" />
            <strong>2. Refresh & Login Semula</strong>
          </div>
          <ul style={{ margin: '0 0 0 24px', paddingLeft: '0' }}>
            <li>
              <button
                onClick={refreshPage}
                style={{
                  backgroundColor: '#d97706',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                Refresh Page
              </button>
              Kemudian log masuk semula
            </li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <Shield size={16} color="#d97706" />
            <strong>3. Saiz & Format File</strong>
          </div>
          <ul style={{ margin: '0 0 0 24px', paddingLeft: '0' }}>
            <li>Gunakan file kurang dari 2MB</li>
            <li>Format: JPEG, PNG, atau WebP sahaja</li>
            <li>Compress gambar jika terlalu besar</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <HelpCircle size={16} color="#d97706" />
            <strong>4. Browser Issues</strong>
          </div>
          <ul style={{ margin: '0 0 0 24px', paddingLeft: '0' }}>
            <li>Cuba guna browser lain (Chrome, Firefox, Safari)</li>
            <li>Clear browser cache dan cookies</li>
            <li>Disable ad-blocker sementara</li>
          </ul>
        </div>
        
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          padding: '8px',
          borderRadius: '4px',
          marginTop: '12px'
        }}>
          <strong>💡 Tip:</strong> Jika masih gagal, hantar resit melalui WhatsApp/email kepada admin: 
          <br />📱 014-6168216 | 📧 masjid.hangtuahsagil@gmail.com
        </div>
      </div>
    </div>
  );
};

export default UploadTroubleshooting;