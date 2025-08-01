import React, { useState, useEffect } from 'react';
import { getPaymentsByParticipant, getAllParticipants, getGroup, getParticipantsByGroup, createChangeRequest, createAuditLog, getChangeRequestsByParticipant, subscribeToParticipantReceiptSubmissions } from '../utils/firestore';
import { Payment, Participant, Group, MONTHS, MONTH_LABELS, getParticipantPrice, ParticipantChangeRequest, SacrificeType, SACRIFICE_TYPE_LABELS, SACRIFICE_TYPE_DESCRIPTIONS, getSacrificeTypeColors, ParticipantCredit, ReceiptUpload as ReceiptUploadType } from '../types';
import CreditService from '../utils/creditService';
import LoadingSpinner from './LoadingSpinner';
import { GroupProgressView } from './GroupProgressView';
import { CheckCircle, XCircle, Calendar, Users, DollarSign, TrendingUp, Eye, ArrowLeft, User, Edit3, Clock, AlertCircle, Upload, FileText, Image as ImageIcon, QrCode } from 'lucide-react';
import ReceiptUpload from './ReceiptUpload';
import QRPayment from './QRPayment';

interface PublicParticipantDashboardProps {
  participantId: string;
  participantName: string;
  onBack: () => void;
}

export const PublicParticipantDashboard: React.FC<PublicParticipantDashboardProps> = ({ 
  participantId, 
  participantName, 
  onBack 
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupParticipants, setGroupParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'personal' | 'group'>('personal');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', phone: '', email: '', sacrificeType: 'korban_sunat' as SacrificeType });
  const [pendingRequests, setPendingRequests] = useState<ParticipantChangeRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [showQRPayment, setShowQRPayment] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [credit, setCredit] = useState<ParticipantCredit | null>(null);
  const [receiptSubmissions, setReceiptSubmissions] = useState<ReceiptUploadType[]>([]);
  const creditService = CreditService.getInstance();

  useEffect(() => {
    let unsubscribeReceipts: (() => void) | null = null;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get participant payments
        const participantPayments = await getPaymentsByParticipant(participantId);
        setPayments(participantPayments);

        // Get participant details
        const allParticipants = await getAllParticipants();
        const currentParticipant = allParticipants.find(p => p.id === participantId);
        
        if (currentParticipant) {
          setParticipant(currentParticipant);
          
          // Initialize edit form with current participant data
          setEditFormData({
            name: currentParticipant.name || '',
            phone: currentParticipant.phone || '',
            email: currentParticipant.email || '',
            sacrificeType: currentParticipant.sacrificeType || 'korban_sunat'
          });
          
          // Get group details
          const groupData = await getGroup(currentParticipant.groupId);
          setGroup(groupData);
          
          // Get all participants in the same group
          const groupParticipantsData = await getParticipantsByGroup(currentParticipant.groupId);
          setGroupParticipants(groupParticipantsData);
          
          // Get pending change requests (with fallback)
          try {
            const changeRequests = await getChangeRequestsByParticipant(currentParticipant.id);
            const pending = changeRequests.filter(req => req.status === 'pending');
            setPendingRequests(pending);
          } catch (requestError) {
            console.warn('Unable to load change requests, permissions may be missing:', requestError);
            // Continue without change requests - not critical for basic functionality
            setPendingRequests([]);
          }
          
          // Get participant credit balance (with fallback)
          try {
            const participantCredit = await creditService.getParticipantCredit(currentParticipant.id);
            setCredit(participantCredit);
          } catch (creditError) {
            console.warn('Unable to load credit balance:', creditError);
            // Continue without credit balance - not critical for basic functionality
            setCredit(null);
          }
          
          // Subscribe to receipt submissions for real-time updates
          unsubscribeReceipts = subscribeToParticipantReceiptSubmissions(
            currentParticipant.id, 
            (receipts) => {
              setReceiptSubmissions(receipts);
            }
          );
        }
      } catch (err) {
        setError('Gagal memuat data');
        console.error('Error fetching participant data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Cleanup function
    return () => {
      if (unsubscribeReceipts) {
        unsubscribeReceipts();
      }
    };
  }, [participantId]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          maxWidth: '28rem',
          margin: '0 1rem'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#dc2626',
            marginBottom: '1rem',
            fontFamily: "'Inter', sans-serif"
          }}>Database Connection Error</h1>
          <p style={{
            color: '#6b7280',
            marginBottom: '1rem',
            fontFamily: "'Inter', sans-serif"
          }}>{error}</p>
          <button
            onClick={onBack}
            style={{
              width: '100%',
              backgroundColor: '#16a34a',
              color: 'white',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: "'Inter', sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#15803d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a';
            }}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const totalPaid = payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
  const monthlyAmount = participant ? getParticipantPrice(participant.sacrificeType || 'korban_sunat') : 100;
  const totalRequired = monthlyAmount * 8; // 8 months total
  const creditBalance = credit?.creditBalance || 0;
  const totalValue = totalPaid + creditBalance; // Include credit in total value
  const progressPercentage = (totalValue / totalRequired) * 100;
  const remainingAmount = Math.max(0, totalRequired - totalValue); // Can't be negative with credit
  
  // Get color theme based on sacrifice type
  const colorTheme = participant ? getSacrificeTypeColors(participant.sacrificeType || 'korban_sunat') : getSacrificeTypeColors('korban_sunat');

  const handleEditClick = () => {
    setShowEditForm(true);
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditFormSubmit = async () => {
    if (!participant) return;
    
    setIsSubmitting(true);
    try {
      const now = new Date();
      
      // Check what fields have changed
      const changes: { name?: string; phone?: string; email?: string; sacrificeType?: SacrificeType } = {};
      if (editFormData.name !== participant.name) {
        changes.name = editFormData.name;
      }
      if (editFormData.phone !== participant.phone) {
        changes.phone = editFormData.phone;
      }
      if (editFormData.email !== participant.email) {
        changes.email = editFormData.email;
      }
      if (editFormData.sacrificeType !== participant.sacrificeType) {
        changes.sacrificeType = editFormData.sacrificeType;
      }
      
      // Only submit if there are changes
      if (Object.keys(changes).length === 0) {
        alert('Tiada perubahan untuk dihantar.');
        setShowEditForm(false);
        return;
      }
      
      try {
        // Create change request
        const requestId = await createChangeRequest({
          participantId: participant.id,
          requestedBy: participant.userId || 'anonymous',
          requestedAt: now,
          status: 'pending',
          changes
        });
        
        // Create audit log (optional - don't fail if this doesn't work)
        try {
          await createAuditLog({
            participantId: participant.id,
            action: 'detail_change_requested',
            performedBy: participant.userId || 'anonymous',
            performedAt: now,
            details: {
              requestId,
              notes: `Participant requested changes: ${Object.keys(changes).join(', ')}`
            }
          });
        } catch (auditError) {
          console.warn('Unable to create audit log:', auditError);
          // Continue anyway - audit log is not critical
        }
        
        // Refresh pending requests
        try {
          const updatedRequests = await getChangeRequestsByParticipant(participant.id);
          const pending = updatedRequests.filter(req => req.status === 'pending');
          setPendingRequests(pending);
        } catch (refreshError) {
          console.warn('Unable to refresh pending requests:', refreshError);
          // Continue anyway
        }
        
        setShowEditForm(false);
        alert('Permohonan perubahan detail telah dihantar untuk kelulusan admin.');
        
      } catch (createError) {
        console.error('Error creating change request:', createError);
        
        // If change request creation fails due to permissions, 
        // show a message but don't completely fail
        if (createError instanceof Error && 'code' in createError && createError.code === 'permission-denied') {
          alert('Maaf, sistem permohonan perubahan belum tersedia. Sila hubungi admin secara langsung untuk mengemas kini maklumat anda.');
          setShowEditForm(false);
        } else {
          throw createError; // Re-throw other errors
        }
      }
      
    } catch (error) {
      console.error('Error submitting change request:', error);
      alert('Ralat semasa menghantar permohonan. Sila cuba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFormCancel = () => {
    // Reset form to original values
    if (participant) {
      setEditFormData({
        name: participant.name || '',
        phone: participant.phone || '',
        email: participant.email || '',
        sacrificeType: participant.sacrificeType || 'korban_sunat'
      });
    }
    setShowEditForm(false);
  };

  const handleReceiptUpload = (month: string) => {
    setSelectedMonth(month);
    setShowReceiptUpload(true);
  };

  const handleQRPayment = (month: string) => {
    setSelectedMonth(month);
    setShowQRPayment(true);
  };

  const handleReceiptUploadSuccess = async () => {
    // Refresh payment data after successful upload
    try {
      const updatedPayments = await getPaymentsByParticipant(participantId);
      setPayments(updatedPayments);
      
      // Note: Receipt submissions will auto-update via subscription
      // No need to manually refresh receipt submissions
    } catch (error) {
      console.error('Error refreshing payments:', error);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1.5rem 1rem'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                color: '#16a34a',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: "'Inter', sans-serif",
                transition: 'color 0.2s',
                padding: '0.5rem'
              }}
            >
              <ArrowLeft size={20} style={{ marginRight: '0.5rem' }} />
              <span>Kembali ke Portal</span>
            </button>
            <div style={{ 
              textAlign: 'center',
              flex: 1
            }}>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 'bold',
                color: '#166534',
                marginBottom: '0.25rem',
                fontFamily: "'Inter', sans-serif"
              }}>
                Progress Pembayaran
              </h1>
              <p style={{
                color: '#16a34a',
                fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                fontFamily: "'Inter', sans-serif",
                marginTop: '0.25rem'
              }}>
                {participantName} - {group?.name}
              </p>
            </div>
            <div style={{ width: '120px' }}></div>
          </div>
          
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => setViewMode('personal')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'personal' ? '#16a34a' : '#f3f4f6',
                color: viewMode === 'personal' ? 'white' : '#374151'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'personal') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'personal') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              <DollarSign size={16} />
              <span>Progress Saya</span>
            </button>
            <button
              onClick={() => setViewMode('group')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'group' ? '#16a34a' : '#f3f4f6',
                color: viewMode === 'group' ? 'white' : '#374151'
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'group') {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'group') {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              <Eye size={16} />
              <span>Progress Kumpulan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        {viewMode === 'personal' ? (
          <>
            {/* Participant Details Section */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#111827',
                  fontFamily: "'Inter', sans-serif",
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <User size={20} style={{ marginRight: '0.5rem' }} />
                  Maklumat Peserta
                </h2>
                {!showEditForm && (
                  <button
                    onClick={handleEditClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3b82f6';
                    }}
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                )}
              </div>

              {showEditForm ? (
                // Edit Form
                <div style={{
                  border: '2px solid #fbbf24',
                  borderRadius: '8px',
                  backgroundColor: '#fef3c7',
                  padding: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#92400e',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: '500'
                    }}>
                      Perubahan detail memerlukan kelulusan admin sebelum disimpan.
                    </p>
                  </div>

                  <div style={{
                    display: 'grid',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Nama
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: "'Inter', sans-serif",
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        No. Telefon
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => handleEditFormChange('phone', e.target.value)}
                        placeholder="Contoh: +60123456789"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: "'Inter', sans-serif",
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Emel
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                        placeholder="Contoh: nama@example.com"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: "'Inter', sans-serif",
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        Jenis Korban
                      </label>
                      <select
                        value={editFormData.sacrificeType}
                        onChange={(e) => handleEditFormChange('sacrificeType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontFamily: "'Inter', sans-serif",
                          outline: 'none',
                          backgroundColor: 'white'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      >
                        {Object.entries(SACRIFICE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        marginTop: '0.25rem',
                        fontFamily: "'Inter', sans-serif"
                      }}>
                        {SACRIFICE_TYPE_DESCRIPTIONS[editFormData.sacrificeType as SacrificeType]}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={handleEditFormCancel}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#4b5563';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#6b7280';
                      }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleEditFormSubmit}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#15803d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#16a34a';
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Menghantar...' : 'Hantar Permohonan'}
                    </button>
                  </div>
                </div>
              ) : (
                // Display current details
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Nama
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {participant?.name || '-'}
                    </p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      No. Telefon
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {participant?.phone || '-'}
                    </p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Emel
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {participant?.email || '-'}
                    </p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    backgroundColor: colorTheme.light,
                    borderRadius: '8px',
                    border: `2px solid ${colorTheme.border}`
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Jenis Korban
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: colorTheme.text,
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: '0.25rem'
                    }}>
                      {participant?.sacrificeType ? SACRIFICE_TYPE_LABELS[participant.sacrificeType] : 'Korban Sunat'}
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: colorTheme.primary,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: '600'
                    }}>
                      RM{participant ? getParticipantPrice(participant.sacrificeType || 'korban_sunat') * 8 : 800}
                    </p>
                  </div>

                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Kumpulan
                    </h3>
                    <p style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      {group?.name || '-'}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Pending Change Requests */}
              {pendingRequests.length > 0 && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <Clock size={16} style={{ color: '#f59e0b' }} />
                    <h3 style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#92400e',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Permohonan Menunggu Kelulusan ({pendingRequests.length})
                    </h3>
                  </div>
                  {pendingRequests.map((request) => (
                    <div key={request.id} style={{
                      backgroundColor: 'white',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                        Diminta pada: {request.requestedAt.toLocaleDateString('ms-MY')}
                      </p>
                      <p style={{ color: '#374151' }}>
                        Perubahan: {Object.entries(request.changes).map(([field, value]) => {
                          let fieldLabel = field;
                          if (field === 'name') fieldLabel = 'Nama';
                          else if (field === 'phone') fieldLabel = 'Telefon';
                          else if (field === 'email') fieldLabel = 'Emel';
                          else if (field === 'sacrificeType') fieldLabel = 'Jenis Korban';
                          
                          let displayValue = value;
                          if (field === 'sacrificeType' && typeof value === 'string') {
                            displayValue = SACRIFICE_TYPE_LABELS[value as SacrificeType];
                          }
                          
                          return `${fieldLabel}: ${displayValue}`;
                        }).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>Total Nilai</p>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#16a34a',
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: '0.25rem'
                    }}>RM{totalValue}</p>
                    {creditBalance > 0 && (
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '500'
                      }}>
                        RM{totalPaid} bayaran + RM{creditBalance} kredit
                      </p>
                    )}
                  </div>
                  <DollarSign size={32} style={{ color: '#16a34a' }} />
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>Baki Perlu Bayar</p>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#dc2626',
                      fontFamily: "'Inter', sans-serif"
                    }}>RM{remainingAmount}</p>
                  </div>
                  <XCircle size={32} style={{ color: '#dc2626' }} />
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>Progress</p>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#2563eb',
                      fontFamily: "'Inter', sans-serif"
                    }}>{progressPercentage.toFixed(1)}%</p>
                  </div>
                  <TrendingUp size={32} style={{ color: '#2563eb' }} />
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif"
                    }}>Ahli Kumpulan</p>
                    <p style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      color: '#7c3aed',
                      fontFamily: "'Inter', sans-serif"
                    }}>{groupParticipants.length}</p>
                  </div>
                  <Users size={32} style={{ color: '#7c3aed' }} />
                </div>
              </div>
              
              {/* Credit Balance Card */}
              {credit && credit.creditBalance > 0 && (
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem',
                  border: '2px solid #10b981',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#059669',
                        marginBottom: '0.5rem',
                        fontFamily: "'Inter', sans-serif"
                      }}>Baki Kredit</p>
                      <p style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#047857',
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: '0.25rem'
                      }}>RM{credit.creditBalance}</p>
                      <p style={{
                        fontSize: '0.75rem',
                        color: '#059669',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: '500'
                      }}>
                        {creditService.calculatePrepaidMonths(credit.creditBalance)} bulan bayaran hadapan
                      </p>
                    </div>
                    <CheckCircle size={32} style={{ color: '#10b981' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: '#111827',
                fontFamily: "'Inter', sans-serif"
              }}>Progress Pembayaran</h2>
              <div style={{
                width: '100%',
                backgroundColor: '#f3f4f6',
                borderRadius: '9999px',
                height: '1.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  backgroundColor: '#16a34a',
                  height: '1.5rem',
                  borderRadius: '9999px',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${Math.min(progressPercentage, 100)}%`
                }}>
                  <span style={{
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    fontFamily: "'Inter', sans-serif"
                  }}>
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.875rem',
                color: '#6b7280',
                fontFamily: "'Inter', sans-serif"
              }}>
                <span>RM0</span>
                <span style={{ fontWeight: '500' }}>
                  RM{totalValue} / RM{totalRequired}
                  {creditBalance > 0 && (
                    <span style={{ color: '#059669', fontSize: '0.75rem', display: 'block' }}>
                      (Termasuk RM{creditBalance} kredit)
                    </span>
                  )}
                </span>
                <span>RM{totalRequired}</span>
              </div>
            </div>

            {/* Payment History */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                color: '#111827',
                fontFamily: "'Inter', sans-serif"
              }}>
                <Calendar size={20} style={{ marginRight: '0.5rem' }} />
                Sejarah Pembayaran
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1rem'
              }}>
                {MONTHS.map(month => {
                  const payment = payments.find(p => p.month === month);
                  const isPaid = payment?.isPaid || false;
                  const amount = payment?.amount || 0;
                  
                  // Get sacrifice type colors for paid months
                  const sacrificeType = participant?.sacrificeType || 'korban_sunat';
                  const colorTheme = getSacrificeTypeColors(sacrificeType);
                  
                  return (
                    <div 
                      key={month}
                      style={{
                        border: `2px solid ${isPaid ? colorTheme.border : '#e5e7eb'}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        backgroundColor: isPaid ? colorTheme.light : '#f9fafb'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <h3 style={{
                            fontWeight: '500',
                            color: '#111827',
                            marginBottom: '0.25rem',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {MONTH_LABELS[month]}
                          </h3>
                          <p style={{
                            fontSize: '0.875rem',
                            color: isPaid ? '#6b7280' : '#6b7280',
                            marginBottom: '0.25rem',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 'normal'
                          }}>
                            {isPaid 
                              ? `RM${amount}` 
                              : `RM${monthlyAmount} - Belum Dibayar`
                            }
                          </p>
                          {payment?.paidDate && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#9ca3af',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              Dibayar: {payment.paidDate.toLocaleDateString('ms-MY')}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isPaid ? (
                            <CheckCircle size={24} style={{ color: colorTheme.primary }} />
                          ) : (
                            <>
                              <XCircle size={24} style={{ color: '#9ca3af' }} />
                              <div style={{ 
                                display: 'flex', 
                                gap: '4px',
                                flexWrap: 'wrap',
                                justifyContent: 'flex-end',
                                alignItems: 'center'
                              }}>
                                <button
                                  onClick={() => handleQRPayment(month)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '5px 8px',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s',
                                    minWidth: '68px',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#047857';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#059669';
                                  }}
                                >
                                  <QrCode size={12} />
                                  QR
                                </button>
                                <button
                                  onClick={() => handleReceiptUpload(month)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '5px 8px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    transition: 'background-color 0.2s',
                                    minWidth: '68px',
                                    justifyContent: 'center'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2563eb';
                                  }}
                                >
                                  <Upload size={12} />
                                  Resit
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Receipt Submission History */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem',
              marginTop: '2rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                color: '#111827',
                fontFamily: "'Inter', sans-serif"
              }}>
                <FileText size={20} style={{ marginRight: '0.5rem' }} />
                Sejarah Resit Upload
                {receiptSubmissions.length > 0 && (
                  <span style={{
                    marginLeft: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px',
                    fontWeight: 'normal'
                  }}>
                    {receiptSubmissions.length}
                  </span>
                )}
              </h2>
              
              {receiptSubmissions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#6b7280',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <Upload size={32} style={{ color: '#9ca3af', margin: '0 auto 0.5rem auto' }} />
                  <p style={{ fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>
                    Belum ada resit yang dihantar. Upload resit pembayaran pada setiap bulan di atas.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {receiptSubmissions
                    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()) // Latest first
                    .map(receipt => {
                      const getStatusDetails = (status: string) => {
                        switch (status) {
                          case 'approved':
                            return {
                              icon: <CheckCircle size={16} style={{ color: '#059669' }} />,
                              text: 'Diluluskan',
                              bgColor: '#ecfdf5',
                              borderColor: '#10b981',
                              textColor: '#047857'
                            };
                          case 'rejected':
                            return {
                              icon: <XCircle size={16} style={{ color: '#dc2626' }} />,
                              text: 'Ditolak',
                              bgColor: '#fef2f2',
                              borderColor: '#ef4444',
                              textColor: '#dc2626'
                            };
                          default: // pending
                            return {
                              icon: <Clock size={16} style={{ color: '#f59e0b' }} />,
                              text: 'Menunggu Kelulusan',
                              bgColor: '#fef3c7',
                              borderColor: '#fbbf24',
                              textColor: '#d97706'
                            };
                        }
                      };

                      const statusDetails = getStatusDetails(receipt.status);
                      const monthLabel = MONTH_LABELS[receipt.month] || receipt.month;

                      return (
                        <div 
                          key={receipt.id}
                          style={{
                            border: `2px solid ${statusDetails.borderColor}`,
                            borderRadius: '8px',
                            padding: '1rem',
                            backgroundColor: statusDetails.bgColor
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '0.75rem'
                          }}>
                            <div>
                              <h3 style={{
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '0.25rem',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '1rem'
                              }}>
                                {monthLabel} - RM{receipt.amount}
                              </h3>
                              <p style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                margin: '0',
                                fontFamily: "'Inter', sans-serif"
                              }}>
                                Dihantar: {receipt.uploadDate.toLocaleDateString('ms-MY', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: 'rgba(255, 255, 255, 0.7)',
                              borderRadius: '6px',
                              border: `1px solid ${statusDetails.borderColor}`
                            }}>
                              {statusDetails.icon}
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: statusDetails.textColor,
                                fontFamily: "'Inter', sans-serif"
                              }}>
                                {statusDetails.text}
                              </span>
                            </div>
                          </div>

                          {/* Additional Details */}
                          <div style={{ 
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {receipt.status === 'approved' && receipt.approvedDate && (
                              <p style={{ margin: '0.25rem 0' }}>
                                ✅ Diluluskan pada: {receipt.approvedDate.toLocaleDateString('ms-MY')}
                              </p>
                            )}
                            
                            {receipt.status === 'rejected' && receipt.rejectionReason && (
                              <p style={{ 
                                margin: '0.25rem 0',
                                padding: '0.5rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '4px',
                                color: '#dc2626'
                              }}>
                                ❌ Sebab ditolak: {receipt.rejectionReason}
                              </p>
                            )}
                            
                            {receipt.notes && (
                              <p style={{ 
                                margin: '0.25rem 0',
                                padding: '0.5rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '4px',
                                fontStyle: 'italic'
                              }}>
                                💬 Catatan: {receipt.notes}
                              </p>
                            )}

                            {receipt.status === 'pending' && (
                              <p style={{ 
                                margin: '0.25rem 0',
                                color: '#d97706',
                                fontSize: '0.75rem'
                              }}>
                                ⏳ Resit sedang disemak oleh admin. Anda akan dimaklumkan setelah selesai.
                              </p>
                            )}
                          </div>

                          {/* File Type Indicator */}
                          <div style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {receipt.fileType === 'pdf' ? (
                              <FileText size={16} style={{ color: '#dc2626' }} />
                            ) : (
                              <ImageIcon size={16} style={{ color: '#059669' }} />
                            )}
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontFamily: "'Inter', sans-serif"
                            }}>
                              {receipt.fileType === 'pdf' ? 'PDF' : 'Gambar'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Group Progress View */
          participant && <GroupProgressView groupId={participant.groupId} />
        )}
      </main>

      {/* Receipt Upload Modal */}
      {showReceiptUpload && participant && (
        <ReceiptUpload
          participantId={participantId}
          participantName={participant.name}
          month={selectedMonth}
          onClose={() => {
            setShowReceiptUpload(false);
            setSelectedMonth('');
          }}
          onUploadSuccess={handleReceiptUploadSuccess}
        />
      )}

      {/* QR Payment Modal */}
      {showQRPayment && participant && (
        <QRPayment
          participantId={participantId}
          participantName={participant.name}
          month={selectedMonth}
          onClose={() => {
            setShowQRPayment(false);
            setSelectedMonth('');
          }}
        />
      )}
    </div>
  );
};
