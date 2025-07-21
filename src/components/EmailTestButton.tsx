import React from 'react';
import { Mail, TestTube } from 'lucide-react';

const EmailTestButton: React.FC = () => {
  const testEmailClient = () => {
    const testSubject = "Test Email Client - Korban Payment System";
    const testBody = `Assalamualaikum,

Ini adalah email test untuk memastikan email client berfungsi dengan betul.

Jika anda dapat melihat email ini dalam email client (Outlook, Apple Mail, dll), bermakna sistem berfungsi dengan baik.

Langkah seterusnya:
1. Tutup email ini tanpa menghantar
2. Kembali ke sistem Payment Tracking
3. Cuba gunakan Email Peringatan untuk peserta sebenar

Wassalamualaikum,
Admin Test`;

    const testEmail = "admin@test.com";
    
    // Create mailto URL
    const encodedSubject = encodeURIComponent(testSubject);
    const encodedBody = encodeURIComponent(testBody);
    const mailtoUrl = `mailto:${testEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    
    console.log('Testing email client with URL:', mailtoUrl);
    
    try {
      // Open email client
      window.open(mailtoUrl, '_blank');
      
      // Show success message
      setTimeout(() => {
        alert('✅ Jika email client terbuka dengan email test, sistem berfungsi dengan baik!\n\n' +
              '📧 Email client yang disokong:\n' +
              '• Windows: Outlook, Mail app\n' +
              '• Mac: Apple Mail, Outlook\n' +
              '• Phone: Gmail app, Outlook app\n\n' +
              '⚠️ Jika tiada apa berlaku, sila install email client terlebih dahulu.');
      }, 1000);
      
    } catch (error) {
      console.error('Error opening email client:', error);
      alert('❌ Error: Tidak dapat buka email client.\n\n' +
            'Sila pastikan email client telah di-install:\n' +
            '• Windows: Outlook atau Mail app\n' +
            '• Mac: Apple Mail atau Outlook\n' +
            '• Phone: Gmail app atau Outlook app');
    }
  };

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <TestTube size={20} color="#2563eb" />
        <h4 style={{ margin: 0, color: '#1e40af' }}>Test Email Client</h4>
      </div>
      
      <p style={{
        fontSize: '14px',
        color: '#1e40af',
        marginBottom: '12px'
      }}>
        Klik butang di bawah untuk test sama ada email client berfungsi di komputer/phone anda.
      </p>
      
      <button
        onClick={testEmailClient}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
      >
        <Mail size={16} />
        Test Email Client
      </button>
      
      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <strong>Jangkaan:</strong> Email client akan terbuka dengan email test yang dah pre-filled. 
        Jangan hantar email test tersebut - tutup sahaja selepas verify email client berfungsi.
      </div>
    </div>
  );
};

export default EmailTestButton;