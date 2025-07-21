import React, { useState, useEffect } from 'react';
import { getParticipantsByGroup, getGroup } from '../utils/firestore';
import { subscribeToPayments } from '../utils/firestore';
import { Participant, Group, Payment, MONTHS, MONTH_LABELS, getParticipantPrice } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Users, Calendar } from 'lucide-react';

interface GroupProgressViewProps {
  groupId: string;
}

export const GroupProgressView: React.FC<GroupProgressViewProps> = ({ groupId }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [paymentsByMonth, setPaymentsByMonth] = useState<{ [month: string]: Payment[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get group details
        const groupData = await getGroup(groupId);
        setGroup(groupData);
        
        // Get participants
        const groupParticipants = await getParticipantsByGroup(groupId);
        setParticipants(groupParticipants);
        
        // Set up payment listeners for each month
        const unsubscribers: Array<() => void> = [];
        
        MONTHS.forEach(month => {
          const unsubscribe = subscribeToPayments(month, (payments) => {
            setPaymentsByMonth(prev => ({
              ...prev,
              [month]: payments.filter(p => 
                groupParticipants.some(participant => participant.id === p.participantId)
              )
            }));
          });
          unsubscribers.push(unsubscribe);
        });
        
        setLoading(false);
        
        // Cleanup function
        return () => {
          unsubscribers.forEach(unsubscribe => unsubscribe());
        };
      } catch (error) {
        console.error('Error fetching group data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!group) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Kumpulan tidak dijumpai.</p>
      </div>
    );
  }

  // Calculate overall group statistics
  const totalParticipants = participants.length;
  const totalRequired = participants.reduce((sum, participant) => {
    const monthlyAmount = getParticipantPrice(participant.sacrificeType || 'korban_sunat');
    return sum + (monthlyAmount * 8); // 8 months total
  }, 0);
  
  const allPayments = Object.values(paymentsByMonth).flat();
  const totalPaid = allPayments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
  const overallProgress = totalRequired > 0 ? (totalPaid / totalRequired) * 100 : 0;
  
  // Calculate monthly statistics
  const monthlyStats = MONTHS.map(month => {
    const monthPayments = paymentsByMonth[month] || [];
    const monthlyPaid = monthPayments.filter(p => p.isPaid).length;
    const monthlyTotal = totalParticipants;
    const monthlyAmount = monthPayments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0);
    
    return {
      month,
      paid: monthlyPaid,
      total: monthlyTotal,
      amount: monthlyAmount,
      percentage: monthlyTotal > 0 ? (monthlyPaid / monthlyTotal) * 100 : 0
    };
  });

  const selectedMonthPayments = paymentsByMonth[selectedMonth] || [];
  const selectedMonthStats = monthlyStats.find(stat => stat.month === selectedMonth);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Group Overview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.5rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#1f2937',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
          <Users size={20} style={{ color: '#16a34a' }} />
          Progress Kumpulan: {group.name}
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#2563eb',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              {totalParticipants}
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              Jumlah Ahli
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#16a34a',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              RM{totalPaid.toLocaleString()}
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              Jumlah Dikutip
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#7c3aed',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              {overallProgress.toFixed(1)}%
            </div>
            <div style={{ 
              fontSize: '0.875rem', 
              color: '#6b7280',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              Progress Keseluruhan
            </div>
          </div>
        </div>
        
        {/* Overall Progress Bar */}
        <div style={{
          width: '100%',
          backgroundColor: '#e5e7eb',
          borderRadius: '9999px',
          height: '1rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            backgroundColor: '#16a34a',
            height: '1rem',
            borderRadius: '9999px',
            transition: 'all 0.3s',
            width: `${Math.min(overallProgress, 100)}%`
          }}></div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          color: '#6b7280',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
          <span>RM0</span>
          <span style={{ fontWeight: '500' }}>RM{totalPaid.toLocaleString()} / RM{totalRequired.toLocaleString()}</span>
          <span>RM{totalRequired.toLocaleString()}</span>
        </div>
      </div>

      {/* Monthly Progress */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#1f2937',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
          <Calendar size={20} style={{ color: '#16a34a' }} />
          Progress Bulanan
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {MONTHS.map(month => {
            const stats = monthlyStats.find(s => s.month === month);
            const isSelected = selectedMonth === month;
            
            return (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  border: '2px solid',
                  backgroundColor: isSelected ? '#dbeafe' : '#f9fafb',
                  borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
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
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#111827' }}>
                  {MONTH_LABELS[month].split(' ')[0]}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {stats?.paid || 0}/{stats?.total || 0}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#16a34a' }}>
                  {stats?.percentage.toFixed(0)}%
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Selected Month Details */}
        {selectedMonthStats && (
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <h4 style={{ fontWeight: '500', marginBottom: '0.75rem', color: '#1f2937', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
              {MONTH_LABELS[selectedMonth]} - Detail
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#2563eb', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                  {selectedMonthStats.paid}/{selectedMonthStats.total}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Telah Bayar</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#16a34a', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                  RM{selectedMonthStats.amount.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Jumlah Dikutip</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#7c3aed', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
                  {selectedMonthStats.percentage.toFixed(1)}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>Progress Bulan</div>
              </div>
            </div>
            
            {/* Progress Bar for Selected Month */}
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '9999px', height: '0.75rem' }}>
              <div style={{
                backgroundColor: '#3b82f6',
                height: '0.75rem',
                borderRadius: '9999px',
                transition: 'all 0.3s',
                width: `${selectedMonthStats.percentage}%`
              }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Participant Status for Selected Month */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
          color: '#1f2937',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}>
          Status Ahli - {MONTH_LABELS[selectedMonth]}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {participants.map(participant => {
            const payment = selectedMonthPayments.find(p => p.participantId === participant.id);
            const isPaid = payment?.isPaid || false;
            const amount = payment?.amount || 0;
            
            return (
              <div 
                key={participant.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '2px solid',
                  borderColor: isPaid ? '#bbf7d0' : '#fecaca',
                  backgroundColor: isPaid ? '#f0fdf4' : '#fef2f2'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '500', 
                      color: '#111827', 
                      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
                    }}>
                      {participant.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
                    }}>
                      {isPaid ? `RM${amount.toLocaleString()}` : 'Belum Bayar'}
                    </div>
                    {payment?.paidDate && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280', 
                        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
                      }}>
                        {payment.paidDate.toLocaleDateString('ms-MY')}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: '0.75rem',
                    height: '0.75rem',
                    borderRadius: '50%',
                    backgroundColor: isPaid ? '#22c55e' : '#ef4444'
                  }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};