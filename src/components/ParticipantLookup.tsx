import React, { useState, useEffect } from 'react';
import { getAllParticipants, getGroups } from '../utils/firestore';
import { Participant, Group } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Search, Users, ArrowLeft, User } from 'lucide-react';

interface ParticipantLookupProps {
  onParticipantSelected: (participant: { id: string; name: string; groupId: string }) => void;
  onBack: () => void;
}

export const ParticipantLookup: React.FC<ParticipantLookupProps> = ({ onParticipantSelected, onBack }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Try to fetch from Firebase first
        try {
          const [participantsData, groupsData] = await Promise.all([
            getAllParticipants(),
            getGroups()
          ]);
          setParticipants(participantsData);
          setGroups(groupsData);
        } catch (firebaseError) {
          console.error('Firebase fetch failed:', firebaseError);
          throw firebaseError; // Re-throw to be caught by outer catch
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Ralat: Tidak dapat mengambil data. Sila periksa sambungan internet dan cuba lagi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.phone?.includes(searchTerm) ||
                         participant.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = selectedGroup === 'all' || participant.groupId === selectedGroup;
    
    return matchesSearch && matchesGroup;
  });

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <LoadingSpinner />
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
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                transition: 'color 0.2s',
                padding: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#15803d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#16a34a';
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
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}>
                Cari Peserta
              </h1>
              <p style={{
                color: '#16a34a',
                fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}>
                Masukkan nama untuk melihat progress pembayaran
              </p>
            </div>
            <div style={{ width: '120px' }}></div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto" style={{ 
        maxWidth: '1200px',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#9ca3af' 
                }} 
              />
              <input
                type="text"
                placeholder="Cari nama, telefon, atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#16a34a';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Group Filter */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem'
            }}>
              <button
                onClick={() => setSelectedGroup('all')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: selectedGroup === 'all' ? '#16a34a' : '#f3f4f6',
                  color: selectedGroup === 'all' ? 'white' : '#374151'
                }}
                onMouseEnter={(e) => {
                  if (selectedGroup !== 'all') {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedGroup !== 'all') {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                Semua Kumpulan
              </button>
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedGroup === group.id ? '#16a34a' : '#f3f4f6',
                    color: selectedGroup === group.id ? 'white' : '#374151'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedGroup !== group.id) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedGroup !== group.id) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              <Users size={20} style={{ marginRight: '0.5rem' }} />
              Senarai Peserta
            </h2>
            <span style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              {filteredParticipants.length} peserta dijumpai
            </span>
          </div>

          {filteredParticipants.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem 0' 
            }}>
              <User size={48} style={{ 
                color: '#9ca3af', 
                margin: '0 auto 1rem auto' 
              }} />
              <p style={{
                color: '#6b7280',
                fontSize: '1.125rem',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                marginBottom: '0.5rem'
              }}>
                Tiada peserta dijumpai
              </p>
              <p style={{
                color: '#9ca3af',
                fontSize: '0.875rem',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}>
                Cuba cari dengan nama, telefon, atau email yang berbeza
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1" style={{
              gap: '1rem'
            }}>
              {filteredParticipants.map(participant => (
                <button
                  key={participant.id}
                  onClick={() => onParticipantSelected({
                    id: participant.id,
                    name: participant.name,
                    groupId: participant.groupId
                  })}
                  style={{
                    textAlign: 'left',
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#16a34a';
                    e.currentTarget.style.backgroundColor = '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'start', 
                    justifyContent: 'space-between' 
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontWeight: '500',
                        color: '#1f2937',
                        marginBottom: '0.25rem',
                        fontSize: '1rem'
                      }}>
                        {participant.name}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.5rem'
                      }}>
                        {getGroupName(participant.groupId)}
                      </p>
                      {participant.phone && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af',
                          marginBottom: '0.25rem'
                        }}>
                          📱 {participant.phone}
                        </p>
                      )}
                      {participant.email && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af'
                        }}>
                          ✉️ {participant.email}
                        </p>
                      )}
                    </div>
                    <div style={{ marginLeft: '0.5rem' }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        backgroundColor: '#dcfce7',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={16} style={{ color: '#16a34a' }} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '2rem',
          backgroundColor: '#eff6ff',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontWeight: '600',
            color: '#1e40af',
            marginBottom: '0.5rem',
            fontSize: '1.125rem',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}>
            Cara Menggunakan
          </h3>
          <ul style={{
            fontSize: '0.875rem',
            color: '#1e40af',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            paddingLeft: '1rem'
          }}>
            <li>• Taip nama anda di kotak carian</li>
            <li>• Klik nama anda untuk melihat progress pembayaran</li>
            <li>• Gunakan filter kumpulan untuk mempersempit carian</li>
            <li>• Jika nama tidak dijumpai, hubungi pengurus masjid</li>
          </ul>
        </div>
      </div>
    </div>
  );
};