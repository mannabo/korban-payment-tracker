import React, { useState, useEffect } from 'react';
import { Check, X, Search, Calendar, Users, Download, FileText, BarChart3, Upload, Mail } from 'lucide-react';
import { 
  MONTHS, 
  MONTH_LABELS, 
  Group, 
  Participant, 
  Payment,
  ParticipantCredit,
  KORBAN_MONTHLY_AMOUNT,
  getParticipantPrice 
} from '../types';
import CreditService from '../utils/creditService';
import { 
  subscribeToGroups, 
  subscribeToAllParticipants, 
  subscribeToPayments,
  createPayment,
  updatePayment 
} from '../utils/firestore';
import { smartSortGroups } from '../utils/sorting';
import { useResponsive } from '../hooks/useResponsive';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  exportPaymentReport, 
  exportGroupSummary, 
  exportMonthlySummary, 
  exportDetailedReport 
} from '../utils/exportUtils';
import BulkPaymentImport from '../components/BulkPaymentImport';
import PaymentReminderSystem from '../components/PaymentReminderSystem';

interface PaymentRecord {
  participantId: string;
  participantName: string;
  groupName: string;
  month: string;
  isPaid: boolean;
  paidDate?: string;
  amount: number;
  paymentId?: string;
  creditBalance?: number;
  isCoveredByCredit?: boolean;
}

const PaymentTracking: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'paid', 'unpaid'
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [participantCredits, setParticipantCredits] = useState<ParticipantCredit[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showEmailReminders, setShowEmailReminders] = useState(false);
  const { isMobile } = useResponsive();
  const creditService = CreditService.getInstance();

  // Load data with real-time subscriptions
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to groups
    const unsubscribeGroups = subscribeToGroups((groupsData) => {
      const sortedGroups = smartSortGroups(groupsData);
      setGroups(sortedGroups);
    });
    
    // Subscribe to all participants
    const unsubscribeParticipants = subscribeToAllParticipants((participantsData) => {
      setParticipants(participantsData);
    });
    
    // Load participant credits
    const loadCredits = async () => {
      try {
        const credits = await creditService.getAllParticipantCredits();
        setParticipantCredits(credits);
      } catch (error) {
        console.warn('Unable to load credit data:', error);
      }
    };
    
    loadCredits();
    setLoading(false);
    
    return () => {
      unsubscribeGroups();
      unsubscribeParticipants();
    };
  }, []);

  // Load all payments for export purposes
  useEffect(() => {
    const loadAllPayments = async () => {
      try {
        // Load payments for all months
        const allPaymentsData: Payment[] = [];
        for (const month of MONTHS) {
          const monthPayments = await new Promise<Payment[]>((resolve) => {
            const unsubscribe = subscribeToPayments(month, (payments) => {
              resolve(payments);
              unsubscribe();
            });
          });
          allPaymentsData.push(...monthPayments);
        }
        setAllPayments(allPaymentsData);
      } catch (error) {
        console.error('Error loading all payments:', error);
      }
    };

    if (participants.length > 0) {
      loadAllPayments();
    }
  }, [participants]);

  // Subscribe to payments for selected month
  useEffect(() => {
    const unsubscribePayments = subscribeToPayments(selectedMonth, (paymentsData) => {
      setPayments(paymentsData);
    });
    
    return () => {
      unsubscribePayments();
    };
  }, [selectedMonth]);

  // Create payment records by combining participants and payments
  const paymentRecords: PaymentRecord[] = participants.map(participant => {
    const group = groups.find(g => g.id === participant.groupId);
    const payment = payments.find(p => p.participantId === participant.id);
    const credit = participantCredits.find(c => c.participantId === participant.id);
    const creditBalance = credit?.creditBalance || 0;
    
    return {
      participantId: participant.id,
      participantName: participant.name,
      groupName: group?.name || 'Unknown Group',
      month: selectedMonth,
      isPaid: payment?.isPaid || false,
      paidDate: payment?.paidDate ? payment.paidDate.toISOString().split('T')[0] : undefined,
      amount: getParticipantPrice(participant.sacrificeType || 'korban_sunat'),
      paymentId: payment?.id,
      creditBalance,
      isCoveredByCredit: false // Keep for interface compatibility but always false
    };
  });

  const filteredRecords = paymentRecords
    .filter(record => {
      const matchesGroup = selectedGroup === 'all' || record.groupName === selectedGroup;
      const matchesSearch = record.participantName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPaymentStatus = paymentStatusFilter === 'all' || 
        (paymentStatusFilter === 'paid' && record.isPaid) ||
        (paymentStatusFilter === 'unpaid' && !record.isPaid);
      return matchesGroup && matchesSearch && matchesPaymentStatus;
    })
    .sort((a, b) => {
      // Sort by group name first (using smart sorting)
      const groupA = groups.find(g => g.name === a.groupName);
      const groupB = groups.find(g => g.name === b.groupName);
      
      if (groupA && groupB) {
        const indexA = groups.indexOf(groupA);
        const indexB = groups.indexOf(groupB);
        if (indexA !== indexB) {
          return indexA - indexB;
        }
      }
      
      // Then sort by participant name
      return a.participantName.localeCompare(b.participantName);
    });

  const togglePaymentStatus = async (participantId: string) => {
    try {
      const record = paymentRecords.find(r => r.participantId === participantId);
      if (!record) return;

      if (record.paymentId) {
        // Update existing payment
        await updatePayment(record.paymentId, {
          isPaid: !record.isPaid,
          paidDate: !record.isPaid ? new Date() : undefined
        });
      } else {
        // Create new payment
        const participant = participants.find(p => p.id === participantId);
        const monthlyAmount = participant ? getParticipantPrice(participant.sacrificeType || 'korban_sunat') : KORBAN_MONTHLY_AMOUNT;
        
        await createPayment({
          participantId: participantId,
          month: selectedMonth,
          amount: monthlyAmount,
          isPaid: true,
          paidDate: new Date()
        });
      }
    } catch (error) {
      console.error('Error toggling payment status:', error);
      alert('Terdapat ralat semasa mengemaskini status bayaran. Sila cuba lagi.');
    }
  };

  // Bulk operations
  const handleSelectParticipant = (participantId: string) => {
    const newSelected = new Set(selectedParticipants);
    if (newSelected.has(participantId)) {
      newSelected.delete(participantId);
    } else {
      newSelected.add(participantId);
    }
    setSelectedParticipants(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedParticipants.size === filteredRecords.length) {
      setSelectedParticipants(new Set());
    } else {
      setSelectedParticipants(new Set(filteredRecords.map(r => r.participantId)));
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedParticipants.size === 0) {
      alert('Sila pilih sekurang-kurangnya satu peserta.');
      return;
    }

    if (!window.confirm(`Adakah anda pasti ingin menandakan ${selectedParticipants.size} peserta sebagai telah bayar?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      for (const participantId of selectedParticipants) {
        const record = paymentRecords.find(r => r.participantId === participantId);
        if (!record) continue;

        if (record.paymentId) {
          // Update existing payment
          await updatePayment(record.paymentId, {
            isPaid: true,
            paidDate: new Date()
          });
        } else {
          // Create new payment
          const participant = participants.find(p => p.id === participantId);
          const monthlyAmount = participant ? getParticipantPrice(participant.sacrificeType || 'korban_sunat') : KORBAN_MONTHLY_AMOUNT;
          
          await createPayment({
            participantId: participantId,
            month: selectedMonth,
            amount: monthlyAmount,
            isPaid: true,
            paidDate: new Date()
          });
        }
      }
      
      setSelectedParticipants(new Set());
      alert(`Berjaya menandakan ${selectedParticipants.size} peserta sebagai telah bayar!`);
    } catch (error) {
      console.error('Error bulk marking as paid:', error);
      alert('Terdapat ralat semasa mengemaskini status bayaran. Sila cuba lagi.');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkMarkUnpaid = async () => {
    if (selectedParticipants.size === 0) {
      alert('Sila pilih sekurang-kurangnya satu peserta.');
      return;
    }

    if (!window.confirm(`Adakah anda pasti ingin menandakan ${selectedParticipants.size} peserta sebagai belum bayar?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      for (const participantId of selectedParticipants) {
        const record = paymentRecords.find(r => r.participantId === participantId);
        if (!record || !record.paymentId) continue;

        // Update existing payment to unpaid
        await updatePayment(record.paymentId, {
          isPaid: false,
          paidDate: undefined
        });
      }
      
      setSelectedParticipants(new Set());
      alert(`Berjaya menandakan ${selectedParticipants.size} peserta sebagai belum bayar!`);
    } catch (error) {
      console.error('Error bulk marking as unpaid:', error);
      alert('Terdapat ralat semasa mengemaskini status bayaran. Sila cuba lagi.');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Quick Actions
  const handleMarkAllUnpaidAsPaid = async () => {
    const unpaidRecords = filteredRecords.filter(r => !r.isPaid);
    
    if (unpaidRecords.length === 0) {
      alert('Tiada peserta yang belum bayar untuk bulan ini.');
      return;
    }

    if (!window.confirm(`Adakah anda pasti ingin menandakan SEMUA ${unpaidRecords.length} peserta yang belum bayar sebagai telah bayar?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      for (const record of unpaidRecords) {
        if (record.paymentId) {
          await updatePayment(record.paymentId, {
            isPaid: true,
            paidDate: new Date()
          });
        } else {
          const participant = participants.find(p => p.id === record.participantId);
          const monthlyAmount = participant ? getParticipantPrice(participant.sacrificeType || 'korban_sunat') : KORBAN_MONTHLY_AMOUNT;
          
          await createPayment({
            participantId: record.participantId,
            month: selectedMonth,
            amount: monthlyAmount,
            isPaid: true,
            paidDate: new Date()
          });
        }
      }
      
      alert(`Berjaya menandakan ${unpaidRecords.length} peserta sebagai telah bayar!`);
    } catch (error) {
      console.error('Error marking all unpaid as paid:', error);
      alert('Terdapat ralat semasa mengemaskini status bayaran. Sila cuba lagi.');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleMarkAllPaidAsUnpaid = async () => {
    const paidRecords = filteredRecords.filter(r => r.isPaid && r.paymentId);
    
    if (paidRecords.length === 0) {
      alert('Tiada peserta yang sudah bayar untuk bulan ini.');
      return;
    }

    if (!window.confirm(`Adakah anda pasti ingin menandakan SEMUA ${paidRecords.length} peserta yang sudah bayar sebagai belum bayar?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      for (const record of paidRecords) {
        if (record.paymentId) {
          await updatePayment(record.paymentId, {
            isPaid: false,
            paidDate: undefined
          });
        }
      }
      
      alert(`Berjaya menandakan ${paidRecords.length} peserta sebagai belum bayar!`);
    } catch (error) {
      console.error('Error marking all paid as unpaid:', error);
      alert('Terdapat ralat semasa mengemaskini status bayaran. Sila cuba lagi.');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // Export functions
  const handleExportCurrentView = () => {
    exportPaymentReport(participants, groups, payments, selectedMonth, selectedGroup);
  };

  const handleExportGroupSummary = () => {
    exportGroupSummary(participants, groups, payments, selectedMonth);
  };

  const handleExportMonthlySummary = () => {
    exportMonthlySummary(participants, groups, allPayments, MONTHS);
  };

  const handleExportDetailedReport = () => {
    exportDetailedReport(participants, groups, allPayments, MONTHS);
  };

  const handleImportComplete = () => {
    // Refresh data after import
    window.location.reload();
  };

  const paidCount = filteredRecords.filter(r => r.isPaid).length;
  const totalAmount = filteredRecords.reduce((sum, record) => {
    return sum + record.amount;
  }, 0);
  const collectedAmount = filteredRecords.filter(r => r.isPaid).reduce((sum, record) => {
    return sum + record.amount;
  }, 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={28} style={{ color: '#059669' }} />
          Tracking Bayaran Korban
        </h2>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Pantau dan urus status bayaran peserta untuk setiap bulan kutipan
        </p>
      </div>

      {/* Bulk Operations */}
      {selectedParticipants.size > 0 && (
        <div className="card" style={{ 
          marginBottom: '24px', 
          backgroundColor: '#f0f9ff', 
          border: '1px solid #0ea5e9' 
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h4 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#0c4a6e',
                marginBottom: '4px' 
              }}>
                Operasi Beramai-ramai
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#0369a1',
                margin: '0' 
              }}>
                {selectedParticipants.size} peserta dipilih
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={handleBulkMarkPaid}
                disabled={bulkOperationLoading}
                className="btn"
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                {bulkOperationLoading ? 'Memproses...' : 'Tandakan Sudah Bayar'}
              </button>
              
              <button
                onClick={handleBulkMarkUnpaid}
                disabled={bulkOperationLoading}
                className="btn"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <X size={16} />
                {bulkOperationLoading ? 'Memproses...' : 'Tandakan Belum Bayar'}
              </button>
              
              <button
                onClick={() => setSelectedParticipants(new Set())}
                disabled={bulkOperationLoading}
                className="btn btn-secondary"
                style={{
                  padding: '8px 16px',
                  fontSize: '14px'
                }}
              >
                Batal Pilihan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px' 
        }}>
          <Download size={20} style={{ color: '#059669' }} />
          Export Laporan
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('🔴 Import Pukal button clicked!');
              setShowBulkImport(true);
            }}
            className="btn"
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              zIndex: 1
            }}
          >
            <Upload size={16} />
            Import Pukal
          </button>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowEmailReminders(true);
            }}
            className="btn"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              zIndex: 1
            }}
          >
            <Mail size={16} />
            Email Peringatan
          </button>
          
          <button
            onClick={handleExportCurrentView}
            className="btn"
            style={{
              backgroundColor: '#059669',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}
          >
            <FileText size={16} />
            Export Paparan Semasa
          </button>
          
          <button
            onClick={handleExportGroupSummary}
            className="btn"
            style={{
              backgroundColor: '#0369a1',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}
          >
            <Users size={16} />
            Ringkasan Kumpulan
          </button>
          
          <button
            onClick={handleExportMonthlySummary}
            className="btn"
            style={{
              backgroundColor: '#7c2d12',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}
          >
            <Calendar size={16} />
            Ringkasan Bulanan
          </button>
          
          <button
            onClick={handleExportDetailedReport}
            className="btn"
            style={{
              backgroundColor: '#7c3aed',
              color: 'white',
              padding: '12px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}
          >
            <BarChart3 size={16} />
            Laporan Lengkap
          </button>
        </div>
        
        <div style={{ 
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#64748b'
        }}>
          <p style={{ margin: '0 0 4px 0' }}>📋 <strong>Import/Export Options:</strong></p>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li><strong>Import Pukal:</strong> Import pembayaran dari Excel/CSV dengan template</li>
            <li><strong>Paparan Semasa:</strong> Export data yang sedang ditunjukkan (bulan/kumpulan terpilih)</li>
            <li><strong>Ringkasan Kumpulan:</strong> Summary performance setiap kumpulan untuk bulan terpilih</li>
            <li><strong>Ringkasan Bulanan:</strong> Summary collection untuk semua bulan</li>
            <li><strong>Laporan Lengkap:</strong> Detail lengkap semua data (3 sheets: Details, Groups, Monthly)</li>
          </ul>
        </div>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? '1fr' 
            : 'repeat(4, 1fr) auto',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Pilih Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              {MONTHS.map(month => (
                <option key={month} value={month}>
                  {MONTH_LABELS[month]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Pilih Kumpulan
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">Semua Kumpulan</option>
              {groups.map(group => (
                <option key={group.id} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Status Bayaran
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="all">Semua Status</option>
              <option value="paid">Sudah Bayar</option>
              <option value="unpaid">Belum Bayar</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Cari Peserta
            </label>
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }} 
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nama peserta..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ minWidth: '200px' }}>
            <div style={{ 
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              textAlign: 'center',
              height: '48px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <p style={{ fontSize: '14px', color: '#059669', fontWeight: '600', margin: '0 0 2px 0' }}>
                RM{collectedAmount.toLocaleString()} / RM{totalAmount.toLocaleString()}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0' }}>
                {paidCount}/{filteredRecords.length} telah bayar
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Actions - Only show when specific group is selected */}
        {selectedGroup !== 'all' && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
              Tindakan Pantas - {selectedGroup}
            </h4>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap',
              alignItems: 'center' 
            }}>
              <button
                onClick={handleMarkAllUnpaidAsPaid}
                disabled={bulkOperationLoading || filteredRecords.filter(r => !r.isPaid).length === 0}
                className="btn"
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                Tandakan Semua Belum Bayar ({filteredRecords.filter(r => !r.isPaid).length})
              </button>
              
              <button
                onClick={handleMarkAllPaidAsUnpaid}
                disabled={bulkOperationLoading || filteredRecords.filter(r => r.isPaid).length === 0}
                className="btn"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <X size={16} />
                Batalkan Semua Sudah Bayar ({filteredRecords.filter(r => r.isPaid).length})
              </button>
              
              <div style={{ 
                padding: '8px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                Showing: {filteredRecords.length} participants
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Table */}
      <div className="card">
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Status Bayaran - {MONTH_LABELS[selectedMonth]}
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={selectedParticipants.size === filteredRecords.length && filteredRecords.length > 0}
                    onChange={handleSelectAll}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                </th>
                <th>Nama Peserta</th>
                <th>Kumpulan</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Baki Kredit</th>
                <th>Tarikh Bayar</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                // Get group index for alternating colors (only when showing all groups)
                const groupIndex = selectedGroup === 'all' 
                  ? groups.findIndex(g => g.name === record.groupName)
                  : 0;
                
                // Alternating background colors for different groups
                const getRowBackgroundColor = () => {
                  if (selectedGroup !== 'all') return 'white'; // Normal white when filtering specific group
                  
                  const colors = [
                    '#ffffff', // white
                    '#f8fafc', // slate-50
                    '#f1f5f9', // slate-100
                    '#e2e8f0', // slate-200
                    '#f0f9ff', // sky-50
                    '#e0f2fe', // sky-100
                    '#f0fdf4', // green-50
                    '#dcfce7', // green-100
                    '#fefce8', // yellow-50
                    '#fef3c7'  // yellow-100
                  ];
                  
                  return colors[groupIndex % colors.length] || '#ffffff';
                };
                
                return (
                  <tr 
                    key={`${record.participantId}-${record.month}`}
                    style={{ backgroundColor: getRowBackgroundColor() }}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedParticipants.has(record.participantId)}
                        onChange={() => handleSelectParticipant(record.participantId)}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer'
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {record.participantName}
                    </td>
                    <td style={{ 
                      color: selectedGroup === 'all' ? '#059669' : '#6b7280',
                      fontWeight: selectedGroup === 'all' ? '600' : '400'
                    }}>
                      {record.groupName}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      RM{record.amount}
                    </td>
                    <td>
                      <span className={record.isPaid ? 'status-paid' : 'status-pending'}>
                        {record.isPaid 
                          ? 'Sudah Bayar' 
                          : 'Belum Bayar'
                        }
                      </span>
                    </td>
                    <td style={{ 
                      color: (record.creditBalance || 0) > 0 ? '#047857' : '#6b7280',
                      fontWeight: (record.creditBalance || 0) > 0 ? '600' : 'normal',
                      fontSize: '14px'
                    }}>
                      {(record.creditBalance || 0) > 0 ? (
                        <span>
                          RM{record.creditBalance || 0}
                          <span style={{ display: 'block', fontSize: '11px', color: '#059669' }}>
                            {creditService.calculatePrepaidMonths(record.creditBalance || 0)} bulan
                          </span>
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ color: '#6b7280' }}>
                      {record.paidDate || '-'}
                    </td>
                    <td>
                      <button
                        onClick={() => togglePaymentStatus(record.participantId)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          backgroundColor: record.isPaid ? '#fee2e2' : '#dcfce7',
                          color: record.isPaid ? '#dc2626' : '#059669'
                        }}
                      >
                        {record.isPaid ? (
                          <>
                            <X size={14} />
                            Batalkan
                          </>
                        ) : (
                          <>
                            <Check size={14} />
                            Tandakan
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6b7280' 
          }}>
            Tiada rekod bayaran dijumpai
          </div>
        )}
      </div>

      {/* Summary by Group */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
          Ringkasan Mengikut Kumpulan - {MONTH_LABELS[selectedMonth]}
        </h3>

        <div className="grid grid-cols-2">
          {groups.map(group => {
            const groupRecords = paymentRecords.filter(r => r.groupName === group.name);
            const groupPaid = groupRecords.filter(r => r.isPaid).length;
            const groupTotal = groupRecords.length;
            const groupAmount = groupRecords.filter(r => r.isPaid).reduce((sum, record) => {
              return sum + record.amount;
            }, 0);
            const percentage = groupTotal > 0 ? (groupPaid / groupTotal) * 100 : 0;

            return (
              <div
                key={group.id}
                style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{ fontWeight: '600' }}>{group.name}</h4>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: percentage === 100 ? '#059669' : '#f59e0b'
                  }}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#6b7280' }}>
                    {groupPaid}/{groupTotal} telah bayar
                  </span>
                  <span style={{ fontWeight: '600', color: '#059669' }}>
                    RM{groupAmount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <BulkPaymentImport
          participants={participants}
          groups={groups}
          onImportComplete={handleImportComplete}
          onClose={() => {
            console.log('🔴 Closing modal');
            setShowBulkImport(false);
          }}
        />
      )}

      {/* Email Reminder Modal */}
      {showEmailReminders && (
        <PaymentReminderSystem
          onClose={() => setShowEmailReminders(false)}
        />
      )}
    </div>
  );
};

export default PaymentTracking;