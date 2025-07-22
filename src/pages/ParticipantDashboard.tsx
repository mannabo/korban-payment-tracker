import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { getPaymentsByParticipant, getAllParticipants, getGroup, getParticipantsByGroup, createChangeRequest, createAuditLog, getChangeRequestsByParticipant } from '../utils/firestore';
import { Payment, Participant, Group, MONTHS, MONTH_LABELS, getParticipantPrice, ParticipantChangeRequest, SacrificeType, SACRIFICE_TYPE_LABELS, SACRIFICE_TYPE_DESCRIPTIONS, getSacrificeTypeColors, ParticipantCredit } from '../types';
import CreditService from '../utils/creditService';
import LoadingSpinner from '../components/LoadingSpinner';
import { GroupProgressView } from '../components/GroupProgressView';
import { CheckCircle, XCircle, Calendar, Users, DollarSign, TrendingUp, Eye, User, Edit3, Clock, AlertCircle } from 'lucide-react';

export const ParticipantDashboard: React.FC = () => {
  const { participantId, userRole } = useAuthContext();
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
  const [credit, setCredit] = useState<ParticipantCredit | null>(null);
  const creditService = CreditService.getInstance();

  useEffect(() => {
    const fetchData = async () => {
      if (!participantId) {
        setError('Participant ID not found');
        setLoading(false);
        return;
      }

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
          
          // Get pending change requests
          try {
            const changeRequests = await getChangeRequestsByParticipant(currentParticipant.id);
            const pending = changeRequests.filter(req => req.status === 'pending');
            setPendingRequests(pending);
          } catch (requestError) {
            console.warn('Unable to load change requests:', requestError);
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
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching participant data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [participantId]);

  if (userRole !== 'participant') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
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
        
        // Create audit log
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
        }
        
        // Refresh pending requests
        try {
          const updatedRequests = await getChangeRequestsByParticipant(participant.id);
          const pending = updatedRequests.filter(req => req.status === 'pending');
          setPendingRequests(pending);
        } catch (refreshError) {
          console.warn('Unable to refresh pending requests:', refreshError);
        }
        
        setShowEditForm(false);
        alert('Permohonan perubahan detail telah dihantar untuk kelulusan admin.');
        
      } catch (createError) {
        console.error('Error creating change request:', createError);
        
        if (createError instanceof Error && 'code' in createError && createError.code === 'permission-denied') {
          alert('Maaf, sistem permohonan perubahan belum tersedia. Sila hubungi admin secara langsung untuk mengemas kini maklumat anda.');
          setShowEditForm(false);
        } else {
          throw createError;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-green-800 mb-2">
              Dashboard Peserta
            </h1>
            <p className="text-green-600">
              {participant?.name} - {group?.name}
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setViewMode('personal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: viewMode === 'personal' ? '#16a34a' : '#f3f4f6',
                color: viewMode === 'personal' ? 'white' : '#374151',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
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
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: viewMode === 'group' ? '#16a34a' : '#f3f4f6',
                color: viewMode === 'group' ? 'white' : '#374151',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'personal' ? (
          <>
            {/* Participant Details Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Maklumat Peserta
                </h2>
                {!showEditForm && (
                  <button
                    onClick={handleEditClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {showEditForm ? (
                // Edit Form
                <div className="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800 font-medium">
                      Perubahan detail memerlukan kelulusan admin sebelum disimpan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => handleEditFormChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No. Telefon
                      </label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => handleEditFormChange('phone', e.target.value)}
                        placeholder="Contoh: +60123456789"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emel
                      </label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => handleEditFormChange('email', e.target.value)}
                        placeholder="Contoh: nama@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Korban
                      </label>
                      <select
                        value={editFormData.sacrificeType}
                        onChange={(e) => handleEditFormChange('sacrificeType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(SACRIFICE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {SACRIFICE_TYPE_DESCRIPTIONS[editFormData.sacrificeType as SacrificeType]}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3 justify-end">
                    <button
                      onClick={handleEditFormCancel}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleEditFormSubmit}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Menghantar...' : 'Hantar Permohonan'}
                    </button>
                  </div>
                </div>
              ) : (
                // Display current details
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Nama</h3>
                    <p className="text-lg font-semibold text-gray-900">{participant?.name || '-'}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">No. Telefon</h3>
                    <p className="text-lg font-semibold text-gray-900">{participant?.phone || '-'}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Emel</h3>
                    <p className="text-lg font-semibold text-gray-900">{participant?.email || '-'}</p>
                  </div>

                  <div className={`p-4 rounded-lg border-2`} style={{ backgroundColor: colorTheme.light, borderColor: colorTheme.border }}>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Jenis Korban</h3>
                    <p className="text-lg font-semibold" style={{ color: colorTheme.text }}>
                      {participant?.sacrificeType ? SACRIFICE_TYPE_LABELS[participant.sacrificeType] : 'Korban Sunat'}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: colorTheme.primary }}>
                      RM{participant ? getParticipantPrice(participant.sacrificeType || 'korban_sunat') * 8 : 800}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Kumpulan</h3>
                    <p className="text-lg font-semibold text-gray-900">{group?.name || '-'}</p>
                  </div>
                </div>
              )}
              
              {/* Pending Change Requests */}
              {pendingRequests.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Permohonan Menunggu Kelulusan ({pendingRequests.length})
                    </h3>
                  </div>
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-white p-3 rounded-md mb-2 text-sm">
                      <p className="text-gray-600 mb-1">
                        Diminta pada: {request.requestedAt.toLocaleDateString('ms-MY')}
                      </p>
                      <p className="text-gray-800">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Nilai</p>
                    <p className="text-2xl font-bold text-green-600 mb-1">RM{totalValue}</p>
                    {creditBalance > 0 && (
                      <p className="text-xs text-green-700 font-medium">
                        RM{totalPaid} bayaran + RM{creditBalance} kredit
                      </p>
                    )}
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Baki Perlu Bayar</p>
                    <p className="text-2xl font-bold text-red-600">RM{remainingAmount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{progressPercentage.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ahli Kumpulan</p>
                    <p className="text-2xl font-bold text-purple-600">{groupParticipants.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              
              {/* Credit Balance Card */}
              {credit && credit.creditBalance > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Baki Kredit</p>
                      <p className="text-2xl font-bold text-green-800 mb-1">RM{credit.creditBalance}</p>
                      <p className="text-xs text-green-700 font-medium">
                        {creditService.calculatePrepaidMonths(credit.creditBalance)} bulan bayaran hadapan
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Progress Pembayaran</h2>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-300 flex items-center justify-center"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                >
                  <span className="text-white text-sm font-medium">
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>RM0</span>
                <span className="font-medium">
                  RM{totalValue} / RM{totalRequired}
                  {creditBalance > 0 && (
                    <span className="block text-xs text-green-700">
                      (Termasuk RM{creditBalance} kredit)
                    </span>
                  )}
                </span>
                <span>RM{totalRequired}</span>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Sejarah Pembayaran
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MONTHS.map(month => {
                  const payment = payments.find(p => p.month === month);
                  const isPaid = payment?.isPaid || false;
                  const amount = payment?.amount || 0;
                  
                  // Check if this month is covered by credit
                  const isCoveredByCredit = credit && credit.creditBalance >= 100 && 
                    creditService.getNextUnpaidMonth(credit.creditBalance, month, MONTHS) !== month;
                  
                  // Get sacrifice type colors for paid months
                  const sacrificeType = participant?.sacrificeType || 'korban_sunat';
                  const colorTheme = getSacrificeTypeColors(sacrificeType);
                  
                  return (
                    <div 
                      key={month}
                      className={`border-2 rounded-lg p-4 ${
                        isPaid 
                          ? `border-opacity-50` 
                          : isCoveredByCredit
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      style={{
                        borderColor: isPaid ? colorTheme.border : isCoveredByCredit ? '#10b981' : undefined,
                        backgroundColor: isPaid ? colorTheme.light : isCoveredByCredit ? '#ecfdf5' : undefined
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {MONTH_LABELS[month]}
                          </h3>
                          <p className={`text-sm ${
                            isPaid ? 'text-gray-600' : isCoveredByCredit ? 'text-green-700 font-medium' : 'text-gray-600'
                          }`}>
                            {isPaid 
                              ? `RM${amount}` 
                              : isCoveredByCredit 
                              ? `RM${monthlyAmount} - Ditampung oleh kredit`
                              : `RM${monthlyAmount} - Belum Dibayar`
                            }
                          </p>
                          {payment?.paidDate && (
                            <p className="text-xs text-gray-500">
                              Dibayar: {payment.paidDate.toLocaleDateString('ms-MY')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          {isPaid ? (
                            <CheckCircle className="h-6 w-6" style={{ color: colorTheme.primary }} />
                          ) : isCoveredByCredit ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <XCircle className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          /* Group Progress View */
          participant && <GroupProgressView groupId={participant.groupId} />
        )}
      </main>
    </div>
  );
};
