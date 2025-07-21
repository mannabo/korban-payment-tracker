import React, { useState, useEffect } from 'react';
import { getAllParticipants, getGroups, getPaymentsByParticipant } from '../utils/firestore';
import { Participant, Group, getSacrificeTypeColors } from '../types';
import { Users, ArrowLeft, Calendar, Search, Filter, X } from 'lucide-react';

interface GroupListingProps {
  onParticipantSelected: (participant: { id: string; name: string; groupId: string }) => void;
  onBack: () => void;
}

interface PaymentStatus {
  isPaid: boolean;
  monthsOverdue: number;
}

interface ParticipantWithProgress extends Participant {
  paymentProgress: PaymentStatus[];
}

// Skeleton Loading Components
const SkeletonIndicators = () => (
  <div style={{
    display: 'flex',
    gap: '4px',
    marginTop: '0.75rem',
    padding: '0.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  }}>
    {Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        style={{
          width: '24px',
          height: '8px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Shimmer effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      </div>
    ))}
  </div>
);

const SkeletonParticipant = () => (
  <div style={{
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.25rem'
    }}>
      {/* Name skeleton */}
      <div style={{
        width: '60%',
        height: '16px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      </div>
      
      {/* Percentage skeleton */}
      <div style={{
        width: '40px',
        height: '24px',
        backgroundColor: '#e2e8f0',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      </div>
    </div>
    
    <SkeletonIndicators />
    
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '0.75rem'
    }}>
      {/* Status text skeleton */}
      <div style={{
        width: '40%',
        height: '12px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      </div>
      
      {/* Click hint skeleton */}
      <div style={{
        width: '25%',
        height: '10px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      </div>
    </div>
  </div>
);

const SkeletonGroup = () => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    border: '1px solid #e5e7eb'
  }}>
    {/* Group Header Skeleton */}
    <div style={{
      borderBottom: '2px solid #f3f4f6',
      paddingBottom: '1rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0.5rem'
      }}>
        {/* Group name skeleton */}
        <div style={{
          width: '50%',
          height: '20px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
        
        {/* Percentage badge skeleton */}
        <div style={{
          width: '40px',
          height: '24px',
          backgroundColor: '#e2e8f0',
          borderRadius: '9999px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Participant count skeleton */}
        <div style={{
          width: '30%',
          height: '14px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
        
        {/* Completion stats skeleton */}
        <div style={{
          width: '40%',
          height: '12px',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        </div>
      </div>
    </div>

    {/* Participants List Skeleton */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: 3 }, (_, i) => (
        <SkeletonParticipant key={i} />
      ))}
    </div>
  </div>
);

export const GroupListing: React.FC<GroupListingProps> = ({ onParticipantSelected, onBack }) => {
  const [participants, setParticipants] = useState<ParticipantWithProgress[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'overdue' | 'pending'>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [participantsData, groupsData] = await Promise.all([
          getAllParticipants(),
          getGroups()
        ]);
        
        // Add payment progress for each participant with MONTH-SPECIFIC LOGIC
        const participantsWithProgress = await Promise.all(
          participantsData.map(async (participant) => {
            const payments = await getPaymentsByParticipant(participant.id);
            
            // MONTH-SPECIFIC LOGIC: Map actual months paid to indicators with overdue tracking
            const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
            const currentDate = new Date();
            const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
            
            const paymentProgress = months.map(month => {
              const payment = payments.find(p => p.month === month);
              
              if (payment && payment.isPaid) {
                return { isPaid: true, monthsOverdue: 0 };
              }
              
              // Calculate months overdue for unpaid months that have passed
              const monthDate = new Date(month + '-01');
              const currentMonthDate = new Date(currentMonth + '-01');
              
              if (monthDate <= currentMonthDate) {
                const monthsDiff = (currentMonthDate.getFullYear() - monthDate.getFullYear()) * 12 + 
                                 (currentMonthDate.getMonth() - monthDate.getMonth());
                return { isPaid: false, monthsOverdue: monthsDiff };
              }
              
              // Future months are not overdue
              return { isPaid: false, monthsOverdue: 0 };
            });
            
            return { ...participant, paymentProgress };
          })
        );
        
        setParticipants(participantsWithProgress);
        setGroups(groupsData);
        
      } catch (error) {
        console.error('Firebase fetch failed:', error);
        setError(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getParticipantsByGroup = (groupId: string) => {
    return participants.filter(participant => participant.groupId === groupId);
  };

  // Filter logic
  const filterParticipants = (participants: ParticipantWithProgress[]) => {
    return participants.filter(participant => {
      // Search filter
      const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const completedPayments = participant.paymentProgress.filter(p => p.isPaid).length;
      const overduePayments = participant.paymentProgress.filter(p => !p.isPaid && p.monthsOverdue > 0).length;
      const completionRate = Math.round((completedPayments / 8) * 100);
      
      let matchesStatus = true;
      if (statusFilter === 'completed') {
        matchesStatus = completionRate === 100;
      } else if (statusFilter === 'overdue') {
        matchesStatus = overduePayments > 0;
      } else if (statusFilter === 'pending') {
        matchesStatus = completionRate < 100 && overduePayments === 0;
      }
      
      // Completion rate filter
      let matchesCompletion = true;
      if (completionFilter === 'high') {
        matchesCompletion = completionRate >= 75;
      } else if (completionFilter === 'medium') {
        matchesCompletion = completionRate >= 50 && completionRate < 75;
      } else if (completionFilter === 'low') {
        matchesCompletion = completionRate < 50;
      }
      
      return matchesSearch && matchesStatus && matchesCompletion;
    });
  };


  const renderPaymentIndicator = (paymentProgress: PaymentStatus[]) => {
    const months = ['Ogo', 'Sep', 'Okt', 'Nov', 'Dis', 'Jan', 'Feb', 'Mac'];
    
    const getIndicatorColor = (status: PaymentStatus) => {
      if (status.isPaid) return '#16a34a'; // Green - paid
      if (status.monthsOverdue >= 2) return '#dc2626'; // Red - 2+ months overdue
      if (status.monthsOverdue === 1) return '#f59e0b'; // Yellow/amber - 1 month overdue
      return '#e5e7eb'; // Gray - not due yet or current month
    };
    
    const getStatusText = (status: PaymentStatus, monthName: string) => {
      if (status.isPaid) return `${monthName}: Sudah Bayar ✓`;
      if (status.monthsOverdue >= 2) return `${monthName}: Terlepas ${status.monthsOverdue} bulan! ⚠️`;
      if (status.monthsOverdue === 1) return `${monthName}: Terlepas 1 bulan ⚠️`;
      return `${monthName}: Belum Bayar ✗`;
    };
    
    return (
      <div style={{
        display: 'flex',
        gap: '4px',
        marginTop: '0.75rem',
        padding: '0.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        {paymentProgress.map((status, index) => (
          <div
            key={index}
            style={{
              width: '24px',
              height: '8px',
              backgroundColor: getIndicatorColor(status),
              borderRadius: '4px',
              transition: 'all 0.3s ease',
              cursor: 'help',
              position: 'relative',
              boxShadow: status.isPaid ? '0 2px 4px rgba(22, 163, 74, 0.2)' : 
                        status.monthsOverdue >= 2 ? '0 2px 4px rgba(220, 38, 38, 0.2)' :
                        status.monthsOverdue === 1 ? '0 2px 4px rgba(245, 158, 11, 0.2)' : 'none',
              transform: 'scale(1)'
            }}
            title={getStatusText(status, months[index])}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Month label below indicator */}
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.6rem',
              color: '#64748b',
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              {months[index]}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ 
        background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' 
      }}>
        {/* Add CSS animation for shimmer effect */}
        <style>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
        
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div className="container mx-auto" style={{ padding: '1.5rem 1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
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
                flex: 1,
                minWidth: '300px'
              }}>
                <h1 style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: 'bold',
                  color: '#166534',
                  marginBottom: '0.25rem',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Senarai Kumpulan
                </h1>
                <p style={{
                  color: '#16a34a',
                  fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                  fontFamily: "'Inter', sans-serif"
                }}>
                  Status pembayaran mengikut bulan sebenar
                </p>
              </div>
              <div style={{ width: '120px' }}></div>
            </div>
          </div>
        </header>

        {/* Content with skeleton loading */}
        <div className="container mx-auto" style={{ 
          maxWidth: '1200px',
          padding: '2rem 1rem'
        }}>
          {/* Loading indicator */}
          <div style={{
            backgroundColor: '#fff7ed',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #fed7aa',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#c2410c',
              fontFamily: "'Inter', sans-serif",
              margin: 0
            }}>
              ⏳ <strong>Loading</strong> - Mengambil data dari Firebase...
            </p>
          </div>

          {/* Skeleton Legend */}
          <div style={{
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            padding: 'clamp(1rem, 4vw, 1.25rem)',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '40%',
              height: '18px',
              backgroundColor: '#e2e8f0',
              borderRadius: '4px',
              marginBottom: '1rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                  animation: 'shimmer 1.5s infinite'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    width: '12px',
                    height: '4px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '2px'
                  }} />
                  <div style={{
                    width: '80px',
                    height: '12px',
                    backgroundColor: '#e2e8f0',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Search */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '100%',
              height: '44px',
              backgroundColor: '#e2e8f0',
              borderRadius: '8px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                  animation: 'shimmer 1.5s infinite'
                }}
              />
            </div>
          </div>

          {/* Skeleton Groups Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonGroup key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#dc2626', 
            marginBottom: '1rem',
            fontFamily: "'Inter', sans-serif"
          }}>Database Connection Error</h2>
          <p style={{ 
            color: '#374151', 
            marginBottom: '1rem',
            fontFamily: "'Inter', sans-serif"
          }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Inter', sans-serif",
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' 
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div className="container mx-auto" style={{ padding: '1.5rem 1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
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
              flex: 1,
              minWidth: '300px'
            }}>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                fontWeight: 'bold',
                color: '#166534',
                marginBottom: '0.25rem',
                fontFamily: "'Inter', sans-serif"
              }}>
                Senarai Kumpulan
              </h1>
              <p style={{
                color: '#16a34a',
                fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                fontFamily: "'Inter', sans-serif"
              }}>
                Status pembayaran mengikut bulan sebenar
              </p>
            </div>
            <div style={{ width: '120px' }}></div>
          </div>
        </div>
      </header>

      {/* Groups Section */}
      <div className="container mx-auto" style={{ 
        maxWidth: '1200px',
        padding: '2rem 1rem'
      }}>
        {/* Live Data Indicator */}
        <div style={{
          backgroundColor: '#d1fae5',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          border: '1px solid #10b981',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#065f46',
            fontFamily: "'Inter', sans-serif",
            margin: 0
          }}>
            🎉 <strong>Live Database</strong> - Real-time payment indicators from Firebase
          </p>
        </div>

        {/* Legend */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: 'clamp(1rem, 4vw, 1.25rem)',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            fontWeight: '600',
            color: '#1e40af',
            marginBottom: '1rem',
            fontSize: '1.125rem',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            alignItems: 'center'
          }}>
            <Calendar size={20} style={{ marginRight: '0.5rem' }} />
            Monthly Payment Progress
          </h3>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Example Progress Bar */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <div style={{
                display: 'flex',
                gap: '3px',
                padding: '0.5rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                {['Ogo', 'Sep', 'Okt', 'Nov', 'Dis', 'Jan', 'Feb', 'Mac'].map((month, i) => {
                  let color = '#e5e7eb'; // Default gray
                  if (i === 0) color = '#16a34a'; // Green - paid
                  if (i === 1) color = '#f59e0b'; // Yellow - 1 month overdue
                  if (i === 2) color = '#dc2626'; // Red - 2+ months overdue
                  
                  return (
                    <div key={i} style={{ position: 'relative' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '8px',
                          backgroundColor: color,
                          borderRadius: '4px',
                          boxShadow: i <= 2 ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
                        }}
                        title={month}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '0.6rem',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        {month}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Status Legend */}
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'clamp(0.75rem, 3vw, 1rem)',
              width: '100%'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.375rem',
                padding: 'clamp(0.375rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 0.75rem)',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '44px',
                justifyContent: 'flex-start'
              }}>
                <div style={{ 
                  width: 'clamp(10px, 3vw, 12px)', 
                  height: 'clamp(3px, 1vw, 4px)', 
                  backgroundColor: '#16a34a', 
                  borderRadius: '2px',
                  flexShrink: 0
                }} />
                <span style={{ 
                  fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', 
                  color: '#374151',
                  fontWeight: '500',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap'
                }}>Sudah Bayar</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.375rem',
                padding: 'clamp(0.375rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 0.75rem)',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '44px',
                justifyContent: 'flex-start'
              }}>
                <div style={{ 
                  width: 'clamp(10px, 3vw, 12px)', 
                  height: 'clamp(3px, 1vw, 4px)', 
                  backgroundColor: '#f59e0b', 
                  borderRadius: '2px',
                  flexShrink: 0
                }} />
                <span style={{ 
                  fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', 
                  color: '#374151',
                  fontWeight: '500',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap'
                }}>Terlepas 1 Bulan</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.375rem',
                padding: 'clamp(0.375rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 0.75rem)',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '44px',
                justifyContent: 'flex-start'
              }}>
                <div style={{ 
                  width: 'clamp(10px, 3vw, 12px)', 
                  height: 'clamp(3px, 1vw, 4px)', 
                  backgroundColor: '#dc2626', 
                  borderRadius: '2px',
                  flexShrink: 0
                }} />
                <span style={{ 
                  fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', 
                  color: '#374151',
                  fontWeight: '500',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap'
                }}>Terlepas 2+ Bulan</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.375rem',
                padding: 'clamp(0.375rem, 2vw, 0.5rem) clamp(0.5rem, 3vw, 0.75rem)',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                minHeight: '44px',
                justifyContent: 'flex-start'
              }}>
                <div style={{ 
                  width: 'clamp(10px, 3vw, 12px)', 
                  height: 'clamp(3px, 1vw, 4px)', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '2px',
                  flexShrink: 0
                }} />
                <span style={{ 
                  fontSize: 'clamp(0.65rem, 2.5vw, 0.75rem)', 
                  color: '#374151',
                  fontWeight: '500',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap'
                }}>Belum Bayar</span>
              </div>
            </div>
            
            {/* Info Text */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.1)',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)',
                color: '#475569',
                margin: 0,
                fontStyle: 'italic',
                fontFamily: "'Inter', sans-serif"
              }}>
                💡 Indicator warna berdasarkan status pembayaran dan tahap keutamaan
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1rem',
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            {/* Search Input */}
            <div style={{ 
              position: 'relative', 
              flex: 1,
              minWidth: isMobile ? '100%' : '300px'
            }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Cari nama peserta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '40px',
                  paddingRight: searchTerm ? '40px' : '12px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontFamily: "'Inter', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: '2px'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '12px 16px',
                backgroundColor: showFilters ? '#3b82f6' : '#f3f4f6',
                color: showFilters ? 'white' : '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontFamily: "'Inter', sans-serif",
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                minWidth: isMobile ? '100%' : 'auto',
                justifyContent: 'center'
              }}
            >
              <Filter size={16} />
              Filter {showFilters ? '✓' : ''}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {/* Status Filter */}
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Status Pembayaran
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                >
                  <option value="all">Semua Status</option>
                  <option value="completed">Selesai (100%)</option>
                  <option value="overdue">Ada Tertunggak</option>
                  <option value="pending">Belum Selesai</option>
                </select>
              </div>

              {/* Completion Rate Filter */}
              <div>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Kadar Selesai
                </label>
                <select
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                    backgroundColor: 'white',
                    outline: 'none'
                  }}
                >
                  <option value="all">Semua Kadar</option>
                  <option value="high">Tinggi (75%+)</option>
                  <option value="medium">Sederhana (50-74%)</option>
                  <option value="low">Rendah (&lt;50%)</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'end',
                justifyContent: isMobile ? 'stretch' : 'flex-start'
              }}>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCompletionFilter('all');
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: isMobile ? '100%' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                >
                  Reset Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filter Results Summary */}
        {(searchTerm || statusFilter !== 'all' || completionFilter !== 'all') && (
          <div style={{
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            border: '1px solid #dbeafe'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#1e40af',
              fontFamily: "'Inter', sans-serif",
              margin: 0,
              textAlign: 'center'
            }}>
              🔍 Menunjukkan hasil yang difilter {searchTerm && `untuk "${searchTerm}"`}
              {statusFilter !== 'all' && `, status: ${statusFilter}`}
              {completionFilter !== 'all' && `, kadar: ${completionFilter}`}
            </p>
          </div>
        )}

        {/* Groups Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {groups
            .sort((a, b) => {
              const getGroupNumber = (groupName: string) => {
                const match = groupName.match(/(\d+)/);
                return match ? parseInt(match[1]) : 999;
              };
              
              const numA = getGroupNumber(a.name);
              const numB = getGroupNumber(b.name);
              
              if (numA !== numB) {
                return numA - numB;
              }
              
              return a.name.localeCompare(b.name);
            })
            .filter(group => {
              // Only show groups that have participants matching the filters
              const allGroupParticipants = getParticipantsByGroup(group.id);
              const filteredParticipants = filterParticipants(allGroupParticipants);
              return filteredParticipants.length > 0;
            })
            .map(group => {
            const allGroupParticipants = getParticipantsByGroup(group.id);
            const groupParticipants = filterParticipants(allGroupParticipants);
            // Keep participants in admin-defined order (database order)
            
            const totalParticipants = groupParticipants.length;
            const totalMonthsPossible = totalParticipants * 8;
            const completedMonths = groupParticipants.reduce((acc, p) => 
              acc + p.paymentProgress.filter(status => status.isPaid).length, 0
            );
            const groupCompletionRate = totalMonthsPossible > 0 
              ? Math.round((completedMonths / totalMonthsPossible) * 100) 
              : 0;
            
            return (
              <div
                key={group.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem',
                  border: '1px solid #e5e7eb',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Group Header */}
                <div style={{
                  borderBottom: '2px solid #f3f4f6',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0,
                      fontFamily: "'Inter', sans-serif",
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Users size={20} style={{ marginRight: '0.5rem', color: '#16a34a' }} />
                      {group.name}
                    </h3>
                    <div style={{
                      backgroundColor: groupCompletionRate >= 75 ? '#dcfce7' : 
                                      groupCompletionRate >= 50 ? '#fef3c7' : '#fee2e2',
                      color: groupCompletionRate >= 75 ? '#166534' : 
                             groupCompletionRate >= 50 ? '#92400e' : '#991b1b',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {groupCompletionRate}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      fontFamily: "'Inter', sans-serif",
                      margin: 0
                    }}>
                      {totalParticipants} peserta
                    </p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      fontFamily: "'Inter', sans-serif",
                      margin: 0
                    }}>
                      {completedMonths}/{totalMonthsPossible} bulan selesai
                    </p>
                  </div>
                </div>

                {/* Participants List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {groupParticipants.length === 0 ? (
                    <p style={{
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontStyle: 'italic',
                      padding: '2rem 0',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      Tiada peserta dalam kumpulan ini
                    </p>
                  ) : (
                    groupParticipants.map(participant => {
                      const completedPayments = participant.paymentProgress.filter(p => p.isPaid).length;
                      const completionRate = Math.round((completedPayments / 8) * 100);
                      
                      // Get sacrifice type colors
                      const sacrificeType = participant.sacrificeType || 'korban_sunat';
                      const colorTheme = getSacrificeTypeColors(sacrificeType);
                      
                      return (
                        <button
                          key={participant.id}
                          onClick={() => onParticipantSelected({
                            id: participant.id,
                            name: participant.name,
                            groupId: participant.groupId
                          })}
                          style={{
                            textAlign: 'left',
                            padding: '1.25rem',
                            border: `1px solid ${colorTheme.border}`,
                            borderRadius: '12px',
                            backgroundColor: colorTheme.light,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            fontFamily: "'Inter', sans-serif",
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                          }}
                        >
                          <div>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              marginBottom: '0.25rem'
                            }}>
                              <h4 style={{
                                fontWeight: '600',
                                color: '#1f2937',
                                margin: 0,
                                fontSize: '1rem',
                                letterSpacing: '-0.025em'
                              }}>
                                {participant.name}
                              </h4>
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'white',
                                fontWeight: '600',
                                backgroundColor: completionRate >= 75 ? '#16a34a' : 
                                               completionRate >= 50 ? '#f59e0b' : '#dc2626',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '12px',
                                minWidth: '2rem',
                                textAlign: 'center'
                              }}>
                                {completionRate}%
                              </div>
                            </div>
                            {renderPaymentIndicator(participant.paymentProgress)}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '0.75rem'
                            }}>
                              <p style={{
                                fontSize: '0.8rem',
                                color: '#64748b',
                                margin: 0,
                                fontWeight: '500'
                              }}>
                                {completedPayments}/8 bulan selesai
                              </p>
                              <div style={{
                                fontSize: '0.7rem',
                                color: '#94a3b8',
                                fontStyle: 'italic'
                              }}>
                                Klik untuk detail
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};