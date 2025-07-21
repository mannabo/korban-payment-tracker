import React, { useState, useEffect } from 'react';
import { Check, X, Clock, User, Edit3, Calendar, FileText } from 'lucide-react';
import { 
  getPendingChangeRequests, 
  approveChangeRequest, 
  rejectChangeRequest, 
  getAllParticipants,
  subscribeToPendingChangeRequests 
} from '../utils/firestore';
import { ParticipantChangeRequest, Participant, SacrificeType, SACRIFICE_TYPE_LABELS } from '../types';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ChangeRequestManagement: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<ParticipantChangeRequest[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [requests, participantsList] = await Promise.all([
          getPendingChangeRequests(),
          getAllParticipants()
        ]);
        setPendingRequests(requests);
        setParticipants(participantsList);
      } catch (error) {
        console.error('Error fetching change requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time listener for pending requests
    const unsubscribe = subscribeToPendingChangeRequests((requests) => {
      setPendingRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    return participant?.name || 'Unknown Participant';
  };

  const handleApprove = async (request: ParticipantChangeRequest) => {
    if (!user?.uid) return;
    
    const confirmation = window.confirm(
      `Adakah anda pasti ingin meluluskan permohonan perubahan detail untuk ${getParticipantName(request.participantId)}?`
    );
    
    if (!confirmation) return;

    setProcessingRequests(prev => new Set(prev).add(request.id));
    
    try {
      await approveChangeRequest(
        request.id,
        user.uid,
        request.participantId,
        request.changes
      );
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== request.id));
      
      alert('Permohonan telah diluluskan dan maklumat peserta telah dikemaskini.');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Ralat semasa meluluskan permohonan. Sila cuba lagi.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleReject = async (request: ParticipantChangeRequest) => {
    if (!user?.uid) return;
    
    const reason = window.prompt(
      `Mengapa anda ingin menolak permohonan ini? (Opsional)`,
      ''
    );
    
    if (reason === null) return; // User cancelled
    
    const confirmation = window.confirm(
      `Adakah anda pasti ingin menolak permohonan perubahan detail untuk ${getParticipantName(request.participantId)}?`
    );
    
    if (!confirmation) return;

    setProcessingRequests(prev => new Set(prev).add(request.id));
    
    try {
      await rejectChangeRequest(request.id, user.uid, reason || undefined);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== request.id));
      
      alert('Permohonan telah ditolak.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Ralat semasa menolak permohonan. Sila cuba lagi.');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontFamily: "'Inter', sans-serif"
        }}>
          <Edit3 size={24} style={{ color: '#f59e0b' }} />
          Pengurusan Permohonan Perubahan Detail
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '1rem',
          fontFamily: "'Inter', sans-serif"
        }}>
          Semak dan luluskan permohonan perubahan maklumat peserta
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <Clock size={48} style={{ color: '#9ca3af', margin: '0 auto 1rem auto' }} />
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem',
            fontFamily: "'Inter', sans-serif"
          }}>
            Tiada Permohonan Menunggu
          </h3>
          <p style={{
            color: '#6b7280',
            fontFamily: "'Inter', sans-serif"
          }}>
            Semua permohonan perubahan detail telah diproses.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {pendingRequests.map((request) => {
            const isProcessing = processingRequests.has(request.id);
            const participantName = getParticipantName(request.participantId);
            
            return (
              <div
                key={request.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem',
                  border: '2px solid #fbbf24'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.5rem',
                      fontFamily: "'Inter', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <User size={20} style={{ color: '#3b82f6' }} />
                      {participantName}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>Diminta: {request.requestedAt.toLocaleDateString('ms-MY')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} />
                        <span>Status: Menunggu</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={isProcessing}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: isProcessing ? '#9ca3af' : '#16a34a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.backgroundColor = '#15803d';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.backgroundColor = '#16a34a';
                        }
                      }}
                    >
                      <Check size={16} />
                      {isProcessing ? 'Memproses...' : 'Lulus'}
                    </button>
                    
                    <button
                      onClick={() => handleReject(request)}
                      disabled={isProcessing}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: isProcessing ? '#9ca3af' : '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.backgroundColor = '#b91c1c';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isProcessing) {
                          e.currentTarget.style.backgroundColor = '#dc2626';
                        }
                      }}
                    >
                      <X size={16} />
                      Tolak
                    </button>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  padding: '1rem',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.75rem',
                    fontFamily: "'Inter', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FileText size={16} />
                    Perubahan yang Diminta:
                  </h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {Object.entries(request.changes).map(([field, value]) => {
                      let fieldLabel = field;
                      if (field === 'name') fieldLabel = 'Nama';
                      else if (field === 'phone') fieldLabel = 'No. Telefon';
                      else if (field === 'email') fieldLabel = 'Emel';
                      else if (field === 'sacrificeType') fieldLabel = 'Jenis Korban';
                      
                      let displayValue = value;
                      if (field === 'sacrificeType' && typeof value === 'string') {
                        displayValue = SACRIFICE_TYPE_LABELS[value as SacrificeType];
                      }
                      
                      return (
                        <div key={field} style={{
                          padding: '0.75rem',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db'
                        }}>
                          <p style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: '#6b7280',
                            marginBottom: '0.25rem',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {fieldLabel}
                          </p>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#111827',
                            fontFamily: "'Inter', sans-serif"
                          }}>
                            {displayValue}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {request.notes && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '6px',
                    border: '1px solid #fbbf24'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#92400e',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      <strong>Catatan:</strong> {request.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};