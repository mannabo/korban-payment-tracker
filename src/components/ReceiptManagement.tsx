import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Eye, 
  FileText, 
  Search, 
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  writeBatch,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { ReceiptUpload } from '../types';
import { useAuthContext } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { 
  Participant, 
  Group, 
  MONTH_LABELS
} from '../types';
import { 
  subscribeToAllParticipants, 
  subscribeToGroups,
  createPayment 
} from '../utils/firestore';
import ReceiptService from '../utils/receiptService';
import LoadingSpinner from './LoadingSpinner';

interface ExtendedReceiptUpload extends ReceiptUpload {
  participantName?: string;
  groupName?: string;
}

interface ReceiptPreviewModalProps {
  receipt: ExtendedReceiptUpload;
  onClose: () => void;
  onApprove: (receiptId: string, reason?: string) => void;
  onReject: (receiptId: string, reason: string) => void;
  processing: boolean;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  receipt,
  onClose,
  onApprove,
  onReject,
  processing
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { isMobile } = useResponsive();

  const handleApprove = () => {
    onApprove(receipt.id!, approvalNotes.trim() || undefined);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Sila berikan sebab penolakan');
      return;
    }
    onReject(receipt.id!, rejectionReason.trim());
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
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: isMobile ? '100%' : '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px' : '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={24} color="#2563eb" />
            <h2 style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '600',
              margin: 0,
              color: '#374151'
            }}>
              Semakan Resit Pembayaran
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
            <X size={20} color="#6b7280" />
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          flex: 1, 
          minHeight: isMobile ? '300px' : '500px' 
        }}>
          {/* Receipt Image Section */}
          <div style={{
            flex: 1,
            padding: isMobile ? '16px' : '24px',
            borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
            borderBottom: isMobile ? '1px solid #e5e7eb' : 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>
              Gambar Resit
            </h3>
            
            <div style={{
              flex: 1,
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f9fafb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              minHeight: isMobile ? '200px' : '400px'
            }}>
              {imageLoading && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <LoadingSpinner />
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Memuat gambar...
                  </span>
                </div>
              )}
              
              {imageError ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#dc2626'
                }}>
                  <AlertCircle size={48} />
                  <span>Gagal memuat gambar</span>
                  <button
                    onClick={() => window.open(receipt.receiptImageUrl, '_blank')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <ExternalLink size={16} />
                    Buka di tab baru
                  </button>
                </div>
              ) : (
                <img
                  src={receipt.receiptImageUrl}
                  alt="Resit pembayaran"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: imageLoading ? 'none' : 'block'
                  }}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </div>

            <button
              onClick={() => window.open(receipt.receiptImageUrl, '_blank')}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}
            >
              <ExternalLink size={16} />
              Lihat saiz penuh
            </button>
          </div>

          {/* Receipt Details Section */}
          <div style={{
            width: isMobile ? '100%' : '400px',
            padding: isMobile ? '16px' : '24px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>
              Maklumat Resit
            </h3>

            {/* Payment Details */}
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                  PESERTA
                </label>
                <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '600', color: '#14532d' }}>
                  {receipt.participantName}
                </p>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                  KUMPULAN
                </label>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#059669' }}>
                  {receipt.groupName}
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                  BULAN
                </label>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#059669' }}>
                  {MONTH_LABELS[receipt.month] || receipt.month}
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                  JUMLAH
                </label>
                <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: '700', color: '#14532d' }}>
                  RM{receipt.amount}
                </p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                  TARIKH HANTAR
                </label>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#059669' }}>
                  {receipt.uploadDate instanceof Date 
                    ? receipt.uploadDate.toLocaleDateString('ms-MY')
                    : new Date(receipt.uploadDate).toLocaleDateString('ms-MY')}
                </p>
              </div>
            </div>

            {/* Notes */}
            {receipt.notes && (
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                <label style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
                  CATATAN
                </label>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#1e40af' }}>
                  {receipt.notes}
                </p>
              </div>
            )}

            {/* Status */}
            <div style={{
              backgroundColor: receipt.status === 'approved' ? '#f0fdf4' : 
                           receipt.status === 'rejected' ? '#fef2f2' : '#fef3c7',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {receipt.status === 'approved' && <CheckCircle size={16} color="#059669" />}
              {receipt.status === 'rejected' && <XCircle size={16} color="#dc2626" />}
              {receipt.status === 'pending' && <Clock size={16} color="#d97706" />}
              
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: receipt.status === 'approved' ? '#059669' : 
                       receipt.status === 'rejected' ? '#dc2626' : '#d97706'
              }}>
                {receipt.status === 'approved' && 'Diluluskan'}
                {receipt.status === 'rejected' && 'Ditolak'}
                {receipt.status === 'pending' && 'Menunggu Kelulusan'}
              </span>
            </div>

            {receipt.status === 'pending' && (
              <>
                {/* Approval Notes */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#374151'
                  }}>
                    Catatan Kelulusan (Pilihan)
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Catatan tambahan untuk kelulusan..."
                  />
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '12px'
                }}>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    style={{
                      padding: isMobile ? '14px 16px' : '12px 16px',
                      backgroundColor: processing ? '#d1d5db' : '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: isMobile ? '16px' : '14px',
                      fontWeight: '600',
                      flex: isMobile ? '1' : 'none'
                    }}
                  >
                    <Check size={16} />
                    {processing ? 'Memproses...' : 'Luluskan Resit'}
                  </button>

                  <button
                    onClick={() => setShowRejectionForm(!showRejectionForm)}
                    disabled={processing}
                    style={{
                      padding: isMobile ? '14px 16px' : '12px 16px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: isMobile ? '16px' : '14px',
                      fontWeight: '600',
                      flex: isMobile ? '1' : 'none'
                    }}
                  >
                    <X size={16} />
                    Tolak Resit
                  </button>

                  {showRejectionForm && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '6px',
                      border: '1px solid #fecaca'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#dc2626'
                      }}>
                        Sebab Penolakan *
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #f87171',
                          borderRadius: '4px',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                        placeholder="Nyatakan sebab penolakan..."
                      />
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: '8px', 
                        marginTop: '12px' 
                      }}>
                        <button
                          onClick={handleReject}
                          disabled={!rejectionReason.trim() || processing}
                          style={{
                            padding: isMobile ? '12px 16px' : '8px 16px',
                            backgroundColor: !rejectionReason.trim() || processing ? '#d1d5db' : '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: !rejectionReason.trim() || processing ? 'not-allowed' : 'pointer',
                            fontSize: isMobile ? '14px' : '12px',
                            flex: isMobile ? '1' : 'none'
                          }}
                        >
                          Sahkan Tolak
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectionForm(false);
                            setRejectionReason('');
                          }}
                          style={{
                            padding: isMobile ? '12px 16px' : '8px 16px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '14px' : '12px',
                            flex: isMobile ? '1' : 'none'
                          }}
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Rejection Reason (if rejected) */}
            {receipt.status === 'rejected' && receipt.rejectionReason && (
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <label style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                  SEBAB PENOLAKAN
                </label>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#dc2626' }}>
                  {receipt.rejectionReason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ReceiptManagement: React.FC = () => {
  const [receipts, setReceipts] = useState<ExtendedReceiptUpload[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ExtendedReceiptUpload | null>(null);
  const [processingReceiptId, setProcessingReceiptId] = useState<string | null>(null);
  const { isMobile, isTablet } = useResponsive();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [selectedReceipts, setSelectedReceipts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const { user } = useAuthContext();
  const receiptService = ReceiptService.getInstance();

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to receipts
    const receiptsQuery = query(
      collection(db, 'receiptUploads'), 
      orderBy('uploadDate', 'desc')
    );
    
    const unsubscribeReceipts = onSnapshot(receiptsQuery, (snapshot) => {
      const receiptsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadDate: doc.data().uploadDate?.toDate() || new Date()
      })) as ExtendedReceiptUpload[];
      
      setReceipts(receiptsData);
    });
    
    unsubscribes.push(unsubscribeReceipts);

    // Subscribe to participants
    const unsubscribeParticipants = subscribeToAllParticipants((participantsList) => {
      setParticipants(participantsList);
    });
    
    unsubscribes.push(unsubscribeParticipants);

    // Subscribe to groups
    const unsubscribeGroups = subscribeToGroups((groupsList) => {
      setGroups(groupsList);
      setLoading(false);
    });
    
    unsubscribes.push(unsubscribeGroups);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Enhance receipts with participant and group info
  const enhancedReceipts = receipts.map(receipt => {
    const participant = participants.find(p => p.id === receipt.participantId);
    const group = participant ? groups.find(g => g.id === participant.groupId) : null;
    
    return {
      ...receipt,
      participantName: participant?.name || 'Unknown',
      groupName: group?.name || 'Unknown Group'
    };
  });

  // Filter receipts
  const filteredReceipts = enhancedReceipts.filter(receipt => {
    if (statusFilter !== 'all' && receipt.status !== statusFilter) return false;
    if (monthFilter !== 'all' && receipt.month !== monthFilter) return false;
    if (searchTerm && !receipt.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !receipt.groupName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateFilter) {
      const receiptDate = receipt.uploadDate instanceof Date 
        ? receipt.uploadDate.toISOString().split('T')[0]
        : new Date(receipt.uploadDate).toISOString().split('T')[0];
      if (receiptDate !== dateFilter) return false;
    }
    
    return true;
  });

  const handleApproveReceipt = async (receiptId: string, notes?: string) => {
    if (!user?.uid) return;
    
    setProcessingReceiptId(receiptId);
    
    try {
      await receiptService.approveReceipt(receiptId, user.uid);
      
      // Optionally create payment record
      const receipt = receipts.find(r => r.id === receiptId);
      if (receipt) {
        const confirmation = window.confirm(
          'Resit telah diluluskan. Adakah anda ingin membuat rekod pembayaran secara automatik?'
        );
        
        if (confirmation) {
          await createPayment({
            participantId: receipt.participantId,
            month: receipt.month,
            amount: receipt.amount,
            isPaid: true,
            paidDate: new Date(),
            notes: notes || `Diluluskan melalui resit upload - ${receipt.id}`
          });
        }
      }
      
      setSelectedReceipt(null);
    } catch (error) {
      console.error('Error approving receipt:', error);
      alert('Ralat semasa meluluskan resit. Sila cuba lagi.');
    } finally {
      setProcessingReceiptId(null);
    }
  };

  const handleRejectReceipt = async (receiptId: string, reason: string) => {
    if (!user?.uid) return;
    
    setProcessingReceiptId(receiptId);
    
    try {
      await receiptService.rejectReceipt(receiptId, reason, user.uid);
      setSelectedReceipt(null);
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      alert('Ralat semasa menolak resit. Sila cuba lagi.');
    } finally {
      setProcessingReceiptId(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReceipts.size === 0) return;
    
    const confirmation = window.confirm(
      `Adakah anda pasti ingin meluluskan ${selectedReceipts.size} resit yang dipilih?`
    );
    
    if (!confirmation) return;

    const batch = writeBatch(db);
    
    try {
      selectedReceipts.forEach(receiptId => {
        const receiptRef = doc(db, 'receiptUploads', receiptId);
        batch.update(receiptRef, {
          status: 'approved',
          approvedBy: user?.uid,
          approvedDate: Timestamp.now()
        });
      });
      
      await batch.commit();
      setSelectedReceipts(new Set());
      alert(`${selectedReceipts.size} resit telah diluluskan.`);
    } catch (error) {
      console.error('Error bulk approving receipts:', error);
      alert('Ralat semasa meluluskan resit secara pukal. Sila cuba lagi.');
    }
  };

  const handleBulkReject = async () => {
    if (selectedReceipts.size === 0) return;
    
    const reason = prompt('Nyatakan sebab penolakan untuk semua resit yang dipilih:');
    if (!reason?.trim()) return;

    const batch = writeBatch(db);
    
    try {
      selectedReceipts.forEach(receiptId => {
        const receiptRef = doc(db, 'receiptUploads', receiptId);
        batch.update(receiptRef, {
          status: 'rejected',
          rejectionReason: reason.trim(),
          approvedBy: user?.uid,
          approvedDate: Timestamp.now()
        });
      });
      
      await batch.commit();
      setSelectedReceipts(new Set());
      alert(`${selectedReceipts.size} resit telah ditolak.`);
    } catch (error) {
      console.error('Error bulk rejecting receipts:', error);
      alert('Ralat semasa menolak resit secara pukal. Sila cuba lagi.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="#059669" />;
      case 'rejected': return <XCircle size={16} color="#dc2626" />;
      default: return <Clock size={16} color="#d97706" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
      rejected: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
      pending: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
    };

    const labels = {
      approved: 'Diluluskan',
      rejected: 'Ditolak',
      pending: 'Menunggu'
    };

    return (
      <span style={{
        ...styles[status as keyof typeof styles],
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {getStatusIcon(status)}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const toggleReceiptSelection = (receiptId: string) => {
    const newSelected = new Set(selectedReceipts);
    if (newSelected.has(receiptId)) {
      newSelected.delete(receiptId);
    } else {
      newSelected.add(receiptId);
    }
    setSelectedReceipts(newSelected);
  };

  const selectAllReceipts = () => {
    const pendingReceipts = filteredReceipts
      .filter(r => r.status === 'pending')
      .map(r => r.id!);
    setSelectedReceipts(new Set(pendingReceipts));
  };

  const clearSelection = () => {
    setSelectedReceipts(new Set());
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  const pendingCount = receipts.filter(r => r.status === 'pending').length;
  const approvedCount = receipts.filter(r => r.status === 'approved').length;
  const rejectedCount = receipts.filter(r => r.status === 'rejected').length;

  return (
    <div style={{ padding: isMobile ? '12px' : isTablet ? '16px' : '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: '700',
          color: '#374151',
          margin: '0 0 8px 0'
        }}>
          Pengurusan Resit Pembayaran
        </h1>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Semak dan luluskan resit pembayaran yang dihantar oleh peserta
        </p>
      </div>

      {/* Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '16px' : '24px'
      }}>
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={20} color="#d97706" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              Menunggu Kelulusan
            </span>
          </div>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
            {pendingCount}
          </span>
        </div>

        <div style={{
          backgroundColor: '#dcfce7',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#166534' }}>
              Diluluskan
            </span>
          </div>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
            {approvedCount}
          </span>
        </div>

        <div style={{
          backgroundColor: '#fee2e2',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <XCircle size={20} color="#dc2626" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
              Ditolak
            </span>
          </div>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
            {rejectedCount}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          marginBottom: showFilters ? '16px' : isMobile ? '12px' : '0',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '8px' : '12px', 
            alignItems: isMobile ? 'stretch' : 'center', 
            flex: 1 
          }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '300px' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Cari nama peserta atau kumpulan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 36px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Diluluskan</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <Filter size={16} />
            Filter
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Bulan
              </label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">Semua Bulan</option>
                {Object.entries(MONTH_LABELS).map(([month, label]) => (
                  <option key={month} value={month}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px', display: 'block' }}>
                Tarikh Upload
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedReceipts.size > 0 && (
        <div style={{
          backgroundColor: '#eff6ff',
          padding: isMobile ? '12px' : '12px 16px',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '12px' : '0'
        }}>
          <span style={{ fontSize: '14px', color: '#1e40af' }}>
            {selectedReceipts.size} resit dipilih
          </span>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '8px' 
          }}>
            <button
              onClick={handleBulkApprove}
              style={{
                padding: isMobile ? '12px' : '6px 12px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <Check size={14} />
              Luluskan Semua
            </button>
            <button
              onClick={handleBulkReject}
              style={{
                padding: isMobile ? '12px' : '6px 12px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <X size={14} />
              Tolak Semua
            </button>
            <button
              onClick={clearSelection}
              style={{
                padding: isMobile ? '12px' : '6px 12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '12px',
                textAlign: 'center'
              }}
            >
              Batal Pilihan
            </button>
          </div>
        </div>
      )}

      {/* Receipts Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        overflow: isMobile ? 'visible' : 'hidden'
      }}>
        {filteredReceipts.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <FileText size={48} color="#d1d5db" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Tiada resit dijumpai</h3>
            <p style={{ margin: 0 }}>
              {statusFilter !== 'all' || searchTerm || monthFilter !== 'all' 
                ? 'Cuba ubah filter pencarian anda'
                : 'Belum ada resit yang dihantar oleh peserta'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Table Header - Hidden on mobile */}
            {!isMobile && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isTablet 
                  ? '40px 1fr 1fr 80px 80px 100px 80px 60px'
                  : '40px 200px 150px 120px 100px 120px 100px 60px',
                gap: '12px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                alignItems: 'center'
              }}>
                <div>
                  <input
                    type="checkbox"
                    checked={selectedReceipts.size > 0 && 
                      filteredReceipts.filter(r => r.status === 'pending').every(r => selectedReceipts.has(r.id!))}
                    onChange={(e) => e.target.checked ? selectAllReceipts() : clearSelection()}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                <div>PESERTA</div>
                <div>KUMPULAN</div>
                <div>BULAN</div>
                <div>JUMLAH</div>
                <div>TARIKH</div>
                <div>STATUS</div>
                <div>AKSI</div>
              </div>
            )}

            {/* Table Body */}
            {filteredReceipts.map((receipt) => (
              isMobile ? (
                // Mobile Card View
                <div
                  key={receipt.id}
                  style={{
                    padding: '16px',
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: selectedReceipts.has(receipt.id!) ? '#eff6ff' : 'white'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: '#374151', marginBottom: '4px' }}>
                        {receipt.participantName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        {receipt.groupName}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {MONTH_LABELS[receipt.month] || receipt.month}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      {receipt.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedReceipts.has(receipt.id!)}
                          onChange={() => toggleReceiptSelection(receipt.id!)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                      <button
                        onClick={() => setSelectedReceipt(receipt)}
                        style={{
                          padding: '8px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <Eye size={14} />
                        Lihat
                      </button>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ fontWeight: '700', fontSize: '16px', color: '#059669' }}>
                        RM{receipt.amount}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {receipt.uploadDate instanceof Date 
                          ? receipt.uploadDate.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit' })
                          : new Date(receipt.uploadDate).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(receipt.status)}
                    </div>
                  </div>
                </div>
              ) : (
                // Desktop Table View
                <div
                  key={receipt.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isTablet 
                      ? '40px 1fr 1fr 80px 80px 100px 80px 60px'
                      : '40px 200px 150px 120px 100px 120px 100px 60px',
                    gap: '12px',
                    padding: '16px',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '14px',
                    alignItems: 'center',
                    backgroundColor: selectedReceipts.has(receipt.id!) ? '#eff6ff' : 'white'
                  }}
                >
                  <div>
                    {receipt.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedReceipts.has(receipt.id!)}
                        onChange={() => toggleReceiptSelection(receipt.id!)}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  </div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>
                    {receipt.participantName}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    {receipt.groupName}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    {MONTH_LABELS[receipt.month] || receipt.month}
                  </div>
                  <div style={{ fontWeight: '600', color: '#059669' }}>
                    RM{receipt.amount}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    {receipt.uploadDate instanceof Date 
                      ? receipt.uploadDate.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit' })
                      : new Date(receipt.uploadDate).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div>
                    {getStatusBadge(receipt.status)}
                  </div>
                  <div>
                    <button
                      onClick={() => setSelectedReceipt(receipt)}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Lihat resit"
                    >
                      <Eye size={16} color="#2563eb" />
                    </button>
                  </div>
                </div>
              )
            ))}
          </>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <ReceiptPreviewModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onApprove={handleApproveReceipt}
          onReject={handleRejectReceipt}
          processing={processingReceiptId === selectedReceipt.id}
        />
      )}
    </div>
  );
};

export default ReceiptManagement;