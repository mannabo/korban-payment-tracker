import React, { useState } from 'react';
import { QrCode, Copy, CheckCircle, CreditCard, Clock, Download } from 'lucide-react';
import { KORBAN_MONTHLY_AMOUNT, MONTH_LABELS } from '../types';

interface QRPaymentProps {
  participantId: string;
  participantName: string;
  month?: string;
  onClose: () => void;
}

const QRPayment: React.FC<QRPaymentProps> = ({
  participantId,
  participantName,
  month,
  onClose
}) => {
  const [copied, setCopied] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<number>(KORBAN_MONTHLY_AMOUNT);
  
  // Generate payment reference number
  const paymentReference = month 
    ? `KPP${participantId.slice(-4).toUpperCase()}-${month.replace('-', '')}`
    : `KPP${participantId.slice(-4).toUpperCase()}`;

  const bankDetails = {
    bankName: 'Bank Simpanan Nasional (BSN)',
    accountName: 'Masjid Al-Falah Kampung Hang Tuah',
    accountNumber: '0410041000004137',
    reference: paymentReference
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = '/qr-code-masjid.png';
    link.download = 'QR-Masjid-Al-Falah-Korban-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '480px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flex: 1
            }}>
              <div style={{
                backgroundColor: '#dcfce7',
                padding: '0.5rem',
                borderRadius: '8px'
              }}>
                <QrCode size={20} style={{ color: '#16a34a' }} />
              </div>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                margin: '0'
              }}>
                Bayaran QR Code
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.25rem',
                color: '#6b7280',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: '0',
            lineHeight: 1.4
          }}>
            Scan QR code untuk bayar menggunakan banking app anda
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Payment Info */}
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <div>
                <span style={{ color: '#6b7280' }}>Peserta:</span>
                <div style={{ fontWeight: '500', color: '#111827' }}>
                  {participantName}
                </div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Jumlah:</span>
                <div style={{ fontWeight: '600', color: '#dc2626', fontSize: '1rem' }}>
                  RM {customAmount.toFixed(2)}
                </div>
              </div>
              {month && (
                <>
                  <div>
                    <span style={{ color: '#6b7280' }}>Bulan:</span>
                    <div style={{ fontWeight: '500', color: '#111827' }}>
                      {MONTH_LABELS[month] || month}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#6b7280' }}>Rujukan:</span>
                    <div style={{ 
                      fontWeight: '500', 
                      color: '#111827',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem'
                    }}>
                      {paymentReference}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Custom Amount Section */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.75rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CreditCard size={16} />
              Pilih Jumlah Bayaran
            </h4>
            
            {/* Quick Amount Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {[1, 2, 3, 4, 6, 8].map((months) => {
                const amount = months * KORBAN_MONTHLY_AMOUNT;
                const isSelected = customAmount === amount;
                return (
                  <button
                    key={months}
                    onClick={() => setCustomAmount(amount)}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #059669' : '1px solid #d1d5db',
                      backgroundColor: isSelected ? '#ecfdf5' : '#f9fafb',
                      color: isSelected ? '#059669' : '#374151',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                          transition: 'all 0.2s',
                      textAlign: 'center' as const
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                  >
                    <div>{months} Bulan</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      RM{amount}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Atau masukkan jumlah sendiri:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  padding: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px 0 0 6px',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}>
                  RM
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setCustomAmount(Math.max(0, value));
                  }}
                  min="0"
                  step="1"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0 6px 6px 0',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#059669';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                />
              </div>
              <p style={{
                fontSize: '0.625rem',
                color: '#6b7280',
                margin: '0.25rem 0 0 0',
                lineHeight: 1.3
              }}>
                Minimum RM10. Untuk bayaran kurang dari RM100, akan masuk ke baki kredit sahaja.
              </p>
            </div>
          </div>

          {/* QR Code Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              marginBottom: '1rem'
            }}>
              <img 
                src="/qr-code-masjid.png" 
                alt="QR Code Masjid Al-Falah Kampung Hang Tuah"
                style={{
                  width: 'min(240px, calc(100vw - 6rem))',
                  height: 'min(300px, calc(100vh - 24rem))',
                  maxWidth: '100%',
                  margin: '0 auto',
                  display: 'block',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  objectFit: 'contain' as const
                }}
                onError={(e) => {
                  // Fallback jika image tidak load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
              {/* Fallback jika QR image tidak load */}
              <div style={{
                width: 'min(240px, calc(100vw - 6rem))',
                height: 'min(300px, calc(100vh - 24rem))',
                maxWidth: '100%',
                backgroundColor: 'white',
                margin: '0 auto',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                flexDirection: 'column' as const
              }}>
                <QrCode size={80} style={{ color: '#6b7280', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                  QR Code Masjid<br />
                  (Image not found)
                </div>
              </div>
              
              {/* Download Button */}
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={downloadQRCode}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                      transition: 'background-color 0.2s',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#047857';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#059669';
                  }}
                >
                  <Download size={16} />
                  Muat Turun QR Code
                </button>
              </div>
            </div>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              margin: '0',
              lineHeight: 1.4
            }}>
              Scan menggunakan app bank anda<br />
              (BSN Go, Maybank2u, CIMB Clicks, Touch 'n Go eWallet, etc.)
            </p>
          </div>

          {/* Bank Details */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 0.75rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CreditCard size={16} />
              Maklumat Akaun Bank
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Nama Akaun</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    {bankDetails.accountName}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>No. Akaun</div>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    fontFamily: 'monospace'
                  }}>
                    {bankDetails.accountNumber}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(bankDetails.accountNumber, 'account')}
                  style={{
                    backgroundColor: copied === 'account' ? '#dcfce7' : '#f3f4f6',
                    color: copied === 'account' ? '#16a34a' : '#374151',
                    border: 'none',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  {copied === 'account' ? <CheckCircle size={12} /> : <Copy size={12} />}
                  {copied === 'account' ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {month && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Rujukan Pembayaran</div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500',
                      fontFamily: 'monospace',
                      color: '#dc2626'
                    }}>
                      {paymentReference}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentReference, 'reference')}
                    style={{
                      backgroundColor: copied === 'reference' ? '#dcfce7' : '#f3f4f6',
                      color: copied === 'reference' ? '#16a34a' : '#374151',
                      border: 'none',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    {copied === 'reference' ? <CheckCircle size={12} /> : <Copy size={12} />}
                    {copied === 'reference' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#1d4ed8',
              margin: '0 0 0.75rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Clock size={16} />
              Langkah Pembayaran
            </h4>
            <ol style={{
              margin: '0',
              paddingLeft: '1.25rem',
              fontSize: '0.875rem',
              color: '#1e40af',
              lineHeight: 1.5
            }}>
              <li>Buka banking app anda (Maybank2u, CIMB, etc.)</li>
              <li>Pilih "Transfer" atau "Pay" dan scan QR code di atas</li>
              <li>Pastikan jumlah adalah <strong>RM {customAmount.toFixed(2)}</strong></li>
              {month && (
                <li>Masukkan rujukan: <strong>{paymentReference}</strong></li>
              )}
              <li>Tekan "Transfer" untuk hantar bayaran</li>
              <li>Ambil screenshot resit dan upload melalui sistem ini</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPayment;