import React, { useState, useEffect } from 'react';
import { Mail, Save, Settings, CheckCircle } from 'lucide-react';

interface EmailConfig {
  adminEmail: string;
  organizationName: string;
  fromName: string;
  replyToEmail: string;
  signatureText: string;
}

interface EmailSettingsProps {
  onClose: () => void;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<EmailConfig>({
    adminEmail: 'masjid.hangtuahsagil@gmail.com',
    organizationName: 'Masjid Hang Tuah Sagil',
    fromName: 'Jawatankuasa Program Korban',
    replyToEmail: 'masjid.hangtuahsagil@gmail.com',
    signatureText: 'Wassalamualaikum warahmatullahi wabarakatuh\n\nJawatankuasa Program Korban\nMasjid Hang Tuah Sagil'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('korban_email_config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error loading email config:', error);
      }
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('korban_email_config', JSON.stringify(config));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving email config:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EmailConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={24} color="#2563eb" />
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              color: '#374151'
            }}>
              Konfigurasi Email
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Admin Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Email Admin Utama
            </label>
            <input
              type="email"
              value={config.adminEmail}
              onChange={(e) => handleChange('adminEmail', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="admin@masjid.com"
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Email untuk menerima notifikasi dan reply dari peserta
            </p>
          </div>

          {/* Organization Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Nama Organisasi
            </label>
            <input
              type="text"
              value={config.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Masjid Hang Tuah Sagil"
            />
          </div>

          {/* From Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Nama Pengirim
            </label>
            <input
              type="text"
              value={config.fromName}
              onChange={(e) => handleChange('fromName', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Jawatankuasa Program Korban"
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Nama yang akan muncul sebagai pengirim email
            </p>
          </div>

          {/* Reply To Email */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Email Reply-To
            </label>
            <input
              type="email"
              value={config.replyToEmail}
              onChange={(e) => handleChange('replyToEmail', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="reply@masjid.com"
            />
            <p style={{
              fontSize: '12px',
              color: '#6b7280',
              margin: '4px 0 0 0'
            }}>
              Email untuk menerima reply dari peserta
            </p>
          </div>

          {/* Signature */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#374151'
            }}>
              Tandatangan Email
            </label>
            <textarea
              value={config.signatureText}
              onChange={(e) => handleChange('signatureText', e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
              placeholder="Wassalamualaikum warahmatullahi wabarakatuh&#10;&#10;Jawatankuasa Program Korban&#10;Masjid Hang Tuah Sagil"
            />
          </div>

          {/* Current Configuration Preview */}
          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>Preview Konfigurasi:</h4>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>
              <p style={{ margin: '4px 0' }}><strong>From:</strong> {config.fromName} &lt;{config.adminEmail}&gt;</p>
              <p style={{ margin: '4px 0' }}><strong>Reply-To:</strong> {config.replyToEmail}</p>
              <p style={{ margin: '4px 0' }}><strong>Organization:</strong> {config.organizationName}</p>
              <div style={{ marginTop: '8px' }}>
                <strong>Signature:</strong>
                <pre style={{ 
                  fontSize: '12px', 
                  backgroundColor: 'white', 
                  padding: '8px', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  margin: '4px 0 0 0'
                }}>
                  {config.signatureText}
                </pre>
              </div>
            </div>
          </div>

          {/* Email Setup Instructions */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <Mail size={16} color="#2563eb" />
              <h4 style={{ margin: 0, color: '#1e40af' }}>Panduan Setup Email</h4>
            </div>
            <div style={{ fontSize: '13px', color: '#1e40af' }}>
              <p style={{ margin: '4px 0' }}>1. Pastikan email admin sudah dikonfigurasi di aplikasi email (Outlook, Apple Mail, Gmail)</p>
              <p style={{ margin: '4px 0' }}>2. Sistem akan buka aplikasi email dengan template yang sudah diisi</p>
              <p style={{ margin: '4px 0' }}>3. Admin perlu review dan hantar email secara manual</p>
              <p style={{ margin: '4px 0' }}>4. Untuk auto-send, perlu upgrade ke SMTP service (berbayar)</p>
            </div>
          </div>

          {/* Save Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              {saved && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#059669',
                  fontSize: '14px'
                }}>
                  <CheckCircle size={16} />
                  Konfigurasi berjaya disimpan!
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Tutup
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: saving ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {saving ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Simpan Konfigurasi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default EmailSettings;