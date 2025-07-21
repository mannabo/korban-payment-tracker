import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Send, Users, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Participant, Payment } from '../types';
import { getAllParticipants, getPaymentsByMonth } from '../utils/firestore';
import { MONTHS } from '../types';
import EmailService, { EmailTemplate, GroupedEmailData } from '../utils/emailService';
import EmailTestButton from './EmailTestButton';

interface PaymentReminderSystemProps {
  onClose: () => void;
}

interface ReminderEmail {
  to: string;
  template: EmailTemplate;
  participant?: Participant;
  groupData?: GroupedEmailData;
}

const PaymentReminderSystem: React.FC<PaymentReminderSystemProps> = ({ onClose }) => {
  const [, setParticipants] = useState<Participant[]>([]);
  const [, setPayments] = useState<Payment[]>([]);
  const [reminderEmails, setReminderEmails] = useState<ReminderEmail[]>([]);
  const [emailStats, setEmailStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [previewEmail, setPreviewEmail] = useState<ReminderEmail | null>(null);
  const [sendingStatus, setSendingStatus] = useState<'idle' | 'sending' | 'completed'>('idle');
  const [groupEmails, setGroupEmails] = useState(true); // Default to grouped emails

  const emailService = EmailService.getInstance();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Refresh email config from localStorage
      emailService.refreshConfig();
      
      // Get participants
      const participantsData = await getAllParticipants();
      
      // Get all payments by fetching each month
      const paymentPromises = MONTHS.map(month => 
        getPaymentsByMonth(month).catch(error => {
          console.warn(`Failed to load payments for ${month}:`, error);
          return []; // Return empty array if month fails
        })
      );
      const monthlyPayments = await Promise.all(paymentPromises);
      const paymentsData = monthlyPayments.flat();
      
      setParticipants(participantsData);
      setPayments(paymentsData);
      
      // Generate reminder emails (grouped or individual)
      const reminders = groupEmails 
        ? emailService.generateGroupedReminderEmails(participantsData, paymentsData).map(item => ({
            to: item.to,
            template: item.template,
            groupData: item.groupData
          }))
        : emailService.generateReminderEmails(participantsData, paymentsData);
      
      setReminderEmails(reminders);
      
      // Calculate email statistics
      const stats = emailService.generateEmailStats(participantsData);
      setEmailStats(stats);
      
      // Select all by default
      setSelectedEmails(new Set(reminders.map((_, index) => index)));
      
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty data to prevent crashes
      setParticipants([]);
      setPayments([]);
      setReminderEmails([]);
      setEmailStats({ totalParticipants: 0, withEmail: 0, withoutEmail: 0, validEmails: 0, invalidEmails: 0 });
    } finally {
      setLoading(false);
    }
  }, [emailService, groupEmails]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectAll = () => {
    if (selectedEmails.size === reminderEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(reminderEmails.map((_, index) => index)));
    }
  };

  const handleSelectEmail = (index: number) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedEmails(newSelected);
  };

  const sendSelectedEmails = () => {
    const selectedReminderEmails = reminderEmails.filter((_, index) => selectedEmails.has(index));
    
    setSendingStatus('sending');
    
    // Send emails via client (opens email client for each)
    emailService.sendBulkEmailsViaClient(
      selectedReminderEmails.map(email => ({
        to: email.to,
        template: email.template
      }))
    );
    
    // Mark as completed after a delay
    setTimeout(() => {
      setSendingStatus('completed');
    }, selectedReminderEmails.length * 1000 + 2000);
  };

  if (loading) {
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
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          <p>Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  // Preview Modal
  if (previewEmail) {
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
        zIndex: 10000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, color: '#374151' }}>Preview Email</h3>
            <button
              onClick={() => setPreviewEmail(null)}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <strong>Kepada:</strong> {previewEmail.to}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Subjek:</strong> {previewEmail.template.subject}
            </div>
            <div style={{
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '16px',
              whiteSpace: 'pre-line',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              {previewEmail.template.body}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
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
          borderRadius: '8px',
          maxWidth: '1000px',
          width: '95%',
          maxHeight: '95vh',
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
              <Mail size={24} color="#2563eb" />
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: '#374151'
              }}>
                Sistem Peringatan Pembayaran
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
            {/* Email Client Test */}
            <EmailTestButton />

            {/* Statistics */}
            {emailStats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#dbeafe',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Users size={24} color="#2563eb" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#1e40af' }}>
                    {emailStats.totalParticipants}
                  </p>
                  <p style={{ color: '#2563eb', margin: 0, fontSize: '14px' }}>Total Peserta</p>
                </div>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <CheckCircle size={24} color="#059669" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#14532d' }}>
                    {emailStats.validEmails}
                  </p>
                  <p style={{ color: '#059669', margin: 0, fontSize: '14px' }}>Email Valid</p>
                </div>
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <AlertCircle size={24} color="#dc2626" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#7f1d1d' }}>
                    {emailStats.withoutEmail}
                  </p>
                  <p style={{ color: '#dc2626', margin: 0, fontSize: '14px' }}>Tiada Email</p>
                </div>
                <div style={{
                  backgroundColor: '#fffbeb',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Clock size={24} color="#d97706" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#92400e' }}>
                    {reminderEmails.length}
                  </p>
                  <p style={{ color: '#d97706', margin: 0, fontSize: '14px' }}>Perlu Peringatan</p>
                </div>
              </div>
            )}

            {/* Email Grouping Toggle */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#14532d',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📧 Kelompokkan Email Sama
                  <input
                    type="checkbox"
                    checked={groupEmails}
                    onChange={(e) => setGroupEmails(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                </label>
              </div>
              <p style={{
                fontSize: '13px',
                color: '#059669',
                margin: 0
              }}>
                {groupEmails 
                  ? '✅ Email dengan alamat yang sama akan digabungkan dalam satu email (untuk keluarga yang sama)'
                  : '❌ Setiap peserta akan mendapat email berasingan (walaupun alamat email sama)'
                }
              </p>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={handleSelectAll}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {selectedEmails.size === reminderEmails.length ? 'Nyahpilih Semua' : 'Pilih Semua'}
                </button>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {selectedEmails.size} daripada {reminderEmails.length} dipilih
                  {groupEmails && (
                    <span style={{ color: '#059669', fontWeight: '500' }}> (emails dikelompokkan)</span>
                  )}
                </span>
              </div>
              <button
                onClick={sendSelectedEmails}
                disabled={selectedEmails.size === 0 || sendingStatus === 'sending'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  backgroundColor: selectedEmails.size === 0 ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedEmails.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {sendingStatus === 'sending' ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Menghantar...
                  </>
                ) : sendingStatus === 'completed' ? (
                  <>
                    <CheckCircle size={16} />
                    Selesai
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Hantar Email ({selectedEmails.size})
                  </>
                )}
              </button>
            </div>

            {/* Email List */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Senarai Peringatan Email
              </div>
              {reminderEmails.length === 0 ? (
                <div style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 16px auto' }} />
                  <h3 style={{ color: '#374151', marginBottom: '8px' }}>Tiada Peringatan Diperlukan</h3>
                  <p>Semua peserta telah membuat pembayaran terkini mereka.</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {reminderEmails.map((email, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: index < reminderEmails.length - 1 ? '1px solid #f3f4f6' : 'none',
                        backgroundColor: selectedEmails.has(index) ? '#eff6ff' : 'white'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmails.has(index)}
                        onChange={() => handleSelectEmail(index)}
                        style={{ marginRight: '12px', cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                            {email.groupData 
                              ? `${email.groupData.familyCount} Peserta (${email.groupData.participants.map(p => p.participant.name).join(', ')})`
                              : email.participant?.name || 'Unknown Participant'
                            }
                          </h4>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setPreviewEmail(email)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <Eye size={12} />
                              Preview
                            </button>
                          </div>
                        </div>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                          📧 {email.to}
                          {email.groupData && (
                            <span style={{ color: '#059669', fontWeight: '500' }}>
                              {' '}• Total: RM{email.groupData.combinedTotalOwed}
                            </span>
                          )}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                          Subjek: {email.template.subject}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              <div style={{ marginBottom: '12px' }}>
                ⚠️ <strong>PENTING: Cara Sistem Email Berfungsi</strong>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>1. BUKAN Auto-Send ke Inbox:</strong><br/>
                Sistem ini TIDAK akan auto-hantar email ke inbox peserta secara automatik.
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>2. Sistem Buka Email Client:</strong><br/>
                Apabila klik "Hantar Email", sistem akan buka aplikasi email di komputer/phone anda (Outlook, Apple Mail, Gmail app).
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>3. Admin Kena Manual Send:</strong><br/>
                Dalam email client, anda akan nampak draft email yang dah pre-filled. Anda perlu review dan klik Send manually untuk setiap email.
              </div>
              
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                padding: '8px', 
                borderRadius: '4px',
                marginTop: '12px'
              }}>
                <strong>💡 Tip:</strong> Cuba "Test Email Client" di atas dulu untuk pastikan email client berfungsi!
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentReminderSystem;