import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { 
  MONTHS, 
  MONTH_LABELS, 
  Group, 
  Participant, 
  Payment,
  ParticipantCredit,
  getParticipantPrice 
} from '../types';
import { subscribeToGroups, subscribeToAllParticipants, subscribeToPayments } from '../utils/firestore';
import CreditService from '../utils/creditService';
import { smartSortGroups } from '../utils/sorting';
import LoadingSpinner from '../components/LoadingSpinner';
import { analyzePaymentData, generateDataReport } from '../utils/dataCleanup';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [participantCredits, setParticipantCredits] = useState<ParticipantCredit[]>([]);
  const [dataIssues, setDataIssues] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024);
  const creditService = CreditService.getInstance();
  const [stats, setStats] = useState({
    totalGroups: 0,
    totalParticipants: 0,
    totalCollected: 0,
    totalExpected: 0,
    totalCreditBalance: 0,
    participantsWithCredit: 0,
    currentMonth: '2025-08'
  });

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to groups
    const unsubscribeGroups = subscribeToGroups((groupsData) => {
      const sortedGroups = smartSortGroups(groupsData);
      setGroups(sortedGroups);
      
      setStats(prev => ({
        ...prev,
        totalGroups: groupsData.length
      }));
    });
    
    // Subscribe to all participants
    const unsubscribeParticipants = subscribeToAllParticipants((allParticipants) => {
      setParticipants(allParticipants);
      
      // Calculate total expected based on each participant's sacrifice type
      const totalExpected = allParticipants.reduce((sum, participant) => {
        const monthlyAmount = getParticipantPrice(participant.sacrificeType || 'korban_sunat');
        return sum + (monthlyAmount * 8); // 8 months total
      }, 0);
      
      setStats(prev => ({
        ...prev,
        totalParticipants: allParticipants.length,
        totalExpected
      }));
    });
    
    // Subscribe to payments for all months
    const paymentUnsubscribers: Array<() => void> = [];
    let allPaymentsCollected: Payment[] = [];
    
    MONTHS.forEach(month => {
      const unsubscribe = subscribeToPayments(month, (monthPayments) => {
        // Update payments for this month
        allPaymentsCollected = [
          ...allPaymentsCollected.filter(p => p.month !== month),
          ...monthPayments
        ];
        
        setAllPayments([...allPaymentsCollected]);
        
        // Calculate total collected from all months
        const paidPayments = allPaymentsCollected.filter(p => p.isPaid);
        const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // DEBUG: Check for data anomalies
        const duplicateCheck: { [key: string]: Payment } = {};
        const duplicates: Array<{ key: string; payments: Payment[] }> = [];
        paidPayments.forEach(payment => {
          const key = `${payment.participantId}-${payment.month}`;
          if (duplicateCheck[key]) {
            duplicates.push({ key, payments: [duplicateCheck[key], payment] });
          }
          duplicateCheck[key] = payment;
        });
        
        if (duplicates.length > 0) {
          console.error('🚨 DUPLICATE PAYMENTS DETECTED:', duplicates);
        }
        
        if (paidPayments.length > participants.length * 8) {
          console.warn('🚨 TOO MANY PAYMENTS:', {
            totalPayments: paidPayments.length,
            expectedMax: participants.length * 8,
            participantCount: participants.length
          });
        }
        
        setStats(prev => ({
          ...prev,
          totalCollected
        }));
      });
      paymentUnsubscribers.push(unsubscribe);
    });
    
    // Load participant credits
    const loadCredits = async () => {
      try {
        const credits = await creditService.getAllParticipantCredits();
        setParticipantCredits(credits);
        
        const totalCreditBalance = credits.reduce((sum, credit) => sum + credit.creditBalance, 0);
        const participantsWithCredit = credits.filter(credit => credit.creditBalance > 0).length;
        
        setStats(prev => ({
          ...prev,
          totalCreditBalance,
          participantsWithCredit
        }));
      } catch (error) {
        console.warn('Unable to load credit data:', error);
      }
    };
    
    loadCredits();
    setLoading(false);
    
    // Cleanup subscriptions
    return () => {
      unsubscribeGroups();
      unsubscribeParticipants();
      paymentUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [participants.length]);

  // Run data analysis when participants and payments change
  useEffect(() => {
    if (participants.length > 0 && allPayments.length > 0) {
      const analysis = analyzePaymentData(allPayments, participants);
      setDataIssues(analysis.totalIssues);
      
      if (analysis.totalIssues > 0) {
        console.error('🚨 DATA ISSUES DETECTED:', analysis);
        console.log('📋 DETAILED REPORT:\n' + generateDataReport(analysis));
      }
    }
  }, [participants, allPayments]);



  const monthlyProgress = MONTHS.map(month => {
    // Calculate monthly expected amount based on all participants' sacrifice types
    const monthlyExpected = participants.reduce((sum, participant) => {
      const monthlyAmount = getParticipantPrice(participant.sacrificeType || 'korban_sunat');
      return sum + monthlyAmount;
    }, 0);
    
    // Calculate actual collected amount for this month
    const monthPayments = allPayments.filter(p => p.month === month && p.isPaid);
    const monthlyCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // DEBUG: Log suspicious data
    if (monthlyCollected > monthlyExpected * 2 || monthPayments.length > participants.length) {
      console.warn(`🚨 SUSPICIOUS DATA for ${month}:`, {
        expectedAmount: monthlyExpected,
        collectedAmount: monthlyCollected,
        participantCount: participants.length,
        paymentCount: monthPayments.length,
        paymentsDetails: monthPayments.map(p => ({ 
          participantId: p.participantId, 
          amount: p.amount, 
          id: p.id 
        }))
      });
    }
    
    return {
      month,
      collected: monthlyCollected,
      expected: monthlyExpected
    };
  });

  const groupSummary = groups.map(group => {
    const groupParticipants = participants.filter(p => p.groupId === group.id);
    const groupPayments = allPayments.filter(p => 
      groupParticipants.some(participant => participant.id === p.participantId) && p.isPaid
    );
    
    // Calculate total amount based on each participant's sacrifice type
    const totalAmount = groupParticipants.reduce((sum, participant) => {
      const monthlyAmount = getParticipantPrice(participant.sacrificeType || 'korban_sunat');
      return sum + (monthlyAmount * 8); // 8 months total
    }, 0);
    
    // Count total payment instances (consistent with export utilities)
    const totalPaymentInstances = groupParticipants.length * 8; // 8 months
    const paidPaymentInstances = groupPayments.length;
    
    return {
      groupName: group.name,
      participants: groupParticipants.length,
      paidCount: paidPaymentInstances,
      totalPaymentInstances,
      totalAmount,
      paidAmount: groupPayments.reduce((sum, p) => sum + p.amount, 0)
    };
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Data Issues Warning */}
      {dataIssues > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ color: '#dc2626', fontSize: '18px' }}>⚠️</span>
          <div>
            <p style={{ color: '#dc2626', fontWeight: '600', margin: '0' }}>
              Data Issues Detected: {dataIssues} problems found
            </p>
            <p style={{ color: '#7f1d1d', fontSize: '14px', margin: '4px 0 0 0' }}>
              Check browser console for detailed analysis. May affect calculation accuracy.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? '1fr' 
          : isTablet 
            ? 'repeat(2, 1fr)' 
            : 'repeat(5, 1fr)',
        gap: isMobile ? '1rem' : '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: isMobile ? '1rem' : undefined
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: isMobile ? '12px' : '14px',
                margin: '0 0 0.5rem 0'
              }}>
                Jumlah Kumpulan
              </p>
              <p style={{ 
                fontSize: isMobile ? '24px' : '32px', 
                fontWeight: 'bold', 
                color: '#059669',
                margin: 0
              }}>
                {stats.totalGroups}
              </p>
            </div>
            <Users size={isMobile ? 32 : 40} style={{ color: '#059669' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: isMobile ? '1rem' : undefined
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: isMobile ? '12px' : '14px',
                margin: '0 0 0.5rem 0'
              }}>
                Jumlah Peserta
              </p>
              <p style={{ 
                fontSize: isMobile ? '24px' : '32px', 
                fontWeight: 'bold', 
                color: '#059669',
                margin: 0
              }}>
                {stats.totalParticipants}
              </p>
            </div>
            <Users size={isMobile ? 32 : 40} style={{ color: '#059669' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: isMobile ? '1rem' : undefined
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: isMobile ? '12px' : '14px',
                margin: '0 0 0.5rem 0'
              }}>
                Jumlah Terkumpul
              </p>
              <p style={{ 
                fontSize: isMobile ? '20px' : '32px', 
                fontWeight: 'bold', 
                color: '#059669',
                margin: 0,
                lineHeight: 1.2
              }}>
                RM{stats.totalCollected.toLocaleString()}
              </p>
            </div>
            <DollarSign size={isMobile ? 32 : 40} style={{ color: '#059669' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: isMobile ? '1rem' : undefined
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: isMobile ? '12px' : '14px',
                margin: '0 0 0.5rem 0'
              }}>
                Peratus Pencapaian
              </p>
              <p style={{ 
                fontSize: isMobile ? '24px' : '32px', 
                fontWeight: 'bold', 
                color: '#059669',
                margin: 0
              }}>
                {stats.totalExpected > 0 ? Math.round((stats.totalCollected / stats.totalExpected) * 100) : 0}%
              </p>
            </div>
            <TrendingUp size={isMobile ? 32 : 40} style={{ color: '#059669' }} />
          </div>
        </div>
        
        <div className="card" style={{ 
          border: '2px solid #10b981', 
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: isMobile ? '1rem' : undefined
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: '#047857', 
                fontSize: isMobile ? '12px' : '14px', 
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                Total Baki Kredit
              </p>
              <p style={{ 
                fontSize: isMobile ? '20px' : '28px', 
                fontWeight: 'bold', 
                color: '#047857', 
                margin: '0 0 0.25rem 0',
                lineHeight: 1.2
              }}>
                RM{stats.totalCreditBalance.toLocaleString()}
              </p>
              <p style={{ 
                color: '#059669', 
                fontSize: isMobile ? '10px' : '12px', 
                fontWeight: '500',
                margin: 0
              }}>
                {stats.participantsWithCredit} peserta dengan kredit
              </p>
            </div>
            <CreditCard size={isMobile ? 28 : 36} style={{ color: '#10b981' }} />
          </div>
        </div>
      </div>

      {/* Main Content Sections - Responsive Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem'
      }}>
        <div className="card">
          <h3 style={{ 
            marginBottom: isMobile ? '1rem' : '1.25rem', 
            fontSize: isMobile ? '16px' : '18px', 
            fontWeight: '600',
            margin: '0 0 1rem 0'
          }}>
            Progress Bulanan
          </h3>
          {monthlyProgress.map(({ month, collected, expected }) => (
            <div key={month} style={{ 
              marginBottom: isMobile ? '12px' : '16px',
              padding: isMobile ? '0.5rem 0' : undefined
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                flexWrap: isMobile ? 'wrap' : 'nowrap',
                gap: isMobile ? '0.25rem' : '0'
              }}>
                <span style={{ 
                  fontWeight: '500',
                  fontSize: isMobile ? '14px' : '16px'
                }}>
                  {MONTH_LABELS[month]}
                </span>
                <span style={{ 
                  color: '#6b7280',
                  fontSize: isMobile ? '12px' : '14px',
                  whiteSpace: 'nowrap'
                }}>
                  RM{collected.toLocaleString()} / RM{expected.toLocaleString()}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${expected > 0 ? Math.min((collected / expected) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ 
            marginBottom: isMobile ? '1rem' : '1.25rem', 
            fontSize: isMobile ? '16px' : '18px', 
            fontWeight: '600',
            margin: '0 0 1rem 0'
          }}>
            Ringkasan Kumpulan
          </h3>
          <div style={{ 
            maxHeight: isMobile ? '300px' : '400px', 
            overflowY: 'auto' 
          }}>
            {groupSummary.map((group, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center',
                  padding: isMobile ? '8px 0' : '12px 0',
                  borderBottom: '1px solid #e5e7eb',
                  gap: isMobile ? '0.5rem' : '1rem'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ 
                    fontWeight: '500',
                    fontSize: isMobile ? '14px' : '16px',
                    margin: '0 0 0.25rem 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {group.groupName}
                  </p>
                  <p style={{ 
                    fontSize: isMobile ? '12px' : '14px', 
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {group.paidCount}/{group.totalPaymentInstances} pembayaran selesai
                  </p>
                </div>
                <div style={{ 
                  textAlign: 'right',
                  flexShrink: 0
                }}>
                  <p style={{ 
                    fontWeight: '600', 
                    color: '#059669',
                    fontSize: isMobile ? '14px' : '16px',
                    margin: '0 0 0.25rem 0'
                  }}>
                    RM{group.paidAmount.toLocaleString()}
                  </p>
                  <p style={{ 
                    fontSize: isMobile ? '12px' : '14px', 
                    color: '#6b7280',
                    margin: 0
                  }}>
                    {group.totalPaymentInstances > 0 ? Math.round((group.paidCount / group.totalPaymentInstances) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card" style={{ borderTop: '4px solid #10b981' }}>
          <h3 style={{ 
            marginBottom: isMobile ? '1rem' : '1.25rem', 
            fontSize: isMobile ? '16px' : '18px', 
            fontWeight: '600', 
            color: '#047857',
            margin: '0 0 1rem 0'
          }}>
            Baki Kredit Peserta
          </h3>
          <div style={{ 
            maxHeight: isMobile ? '300px' : '400px', 
            overflowY: 'auto' 
          }}>
            {participantCredits
              .filter(credit => credit.creditBalance > 0)
              .sort((a, b) => b.creditBalance - a.creditBalance)
              .map((credit) => {
                const participant = participants.find(p => p.id === credit.participantId);
                const prepaidMonths = creditService.calculatePrepaidMonths(credit.creditBalance);
                
                return (
                  <div 
                    key={credit.participantId}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center',
                      padding: isMobile ? '8px 0' : '12px 0',
                      borderBottom: '1px solid #e5e7eb',
                      gap: isMobile ? '0.5rem' : '1rem'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        fontWeight: '500',
                        fontSize: isMobile ? '14px' : '16px',
                        margin: '0 0 0.25rem 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {participant?.name || 'Unknown'}
                      </p>
                      <p style={{ 
                        fontSize: isMobile ? '12px' : '14px', 
                        color: '#059669', 
                        fontWeight: '500',
                        margin: 0
                      }}>
                        {prepaidMonths} bulan hadapan
                      </p>
                    </div>
                    <div style={{ 
                      textAlign: 'right',
                      flexShrink: 0
                    }}>
                      <p style={{ 
                        fontWeight: '600', 
                        color: '#047857', 
                        fontSize: isMobile ? '14px' : '16px',
                        margin: '0 0 0.25rem 0'
                      }}>
                        RM{credit.creditBalance}
                      </p>
                      <p style={{ 
                        fontSize: isMobile ? '10px' : '12px', 
                        color: '#6b7280',
                        margin: 0
                      }}>
                        {credit.transactions.length} transaksi
                      </p>
                    </div>
                  </div>
                );
              })}
            
            {participantCredits.filter(credit => credit.creditBalance > 0).length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#6b7280', 
                padding: isMobile ? '20px 10px' : '40px 20px' 
              }}>
                <CreditCard 
                  size={isMobile ? 32 : 48} 
                  style={{ 
                    color: '#d1d5db', 
                    margin: isMobile ? '0 auto 8px auto' : '0 auto 16px auto' 
                  }} 
                />
                <p style={{ 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: '500',
                  margin: '0 0 0.5rem 0'
                }}>
                  Tiada Baki Kredit
                </p>
                <p style={{ 
                  fontSize: isMobile ? '12px' : '14px',
                  margin: 0
                }}>
                  Semua peserta telah menggunakan kredit mereka
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;