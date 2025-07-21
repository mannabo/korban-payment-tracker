import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, UserPlus, FileEdit } from 'lucide-react';
import { Group, Participant } from '../types';
import { 
  subscribeToGroups, 
  subscribeToParticipants, 
  createGroup, 
  updateGroup,
  deleteGroup,
  createParticipant, 
  updateParticipant, 
  deleteParticipant 
} from '../utils/firestore';
import { smartSortGroups } from '../utils/sorting';
import { useResponsive } from '../hooks/useResponsive';
import LoadingSpinner from '../components/LoadingSpinner';

const GroupManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const { isMobile } = useResponsive();
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = useState(false);
  const [showBulkEditForm, setShowBulkEditForm] = useState(false);
  const [showAddGroupForm, setShowAddGroupForm] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  const [groupFormData, setGroupFormData] = useState({
    name: ''
  });

  const [bulkData, setBulkData] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkEditData, setBulkEditData] = useState('');
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    // Subscribe to groups
    const unsubscribeGroups = subscribeToGroups((groupsData) => {
      const sortedGroups = smartSortGroups(groupsData);
      setGroups(sortedGroups);
      setLoading(false);
    });
    
    // Cleanup subscription
    return () => {
      unsubscribeGroups();
    };
  }, []);

  useEffect(() => {
    let unsubscribeParticipants: (() => void) | null = null;
    
    if (selectedGroup) {
      // Subscribe to participants for selected group
      unsubscribeParticipants = subscribeToParticipants(selectedGroup.id, (participantsData) => {
        setParticipants(participantsData);
      });
    } else {
      setParticipants([]);
    }
    
    // Cleanup subscription
    return () => {
      if (unsubscribeParticipants) {
        unsubscribeParticipants();
      }
    };
  }, [selectedGroup]);

  const handleAddGroup = async () => {
    if (!groupFormData.name) return;

    try {
      await createGroup({
        name: groupFormData.name,
        participants: []
      });
      
      setGroupFormData({ name: '' });
      setShowAddGroupForm(false);
      // Real-time listener will update groups automatically
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !groupFormData.name) return;

    try {
      await updateGroup(editingGroup.id, {
        name: groupFormData.name
      });
      
      setGroupFormData({ name: '' });
      setEditingGroup(null);
      // Real-time listener will update groups automatically
      
      // Update selected group if it was the one being edited
      if (selectedGroup?.id === editingGroup.id) {
        setSelectedGroup({ ...editingGroup, name: groupFormData.name });
      }
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Adakah anda pasti ingin memadamkan kumpulan ini? Semua ahli dalam kumpulan ini juga akan dipadamkan.')) {
      return;
    }

    try {
      // First delete all participants in the group
      for (const participant of participants) {
        await deleteParticipant(participant.id);
      }
      
      // Then delete the group
      await deleteGroup(groupId);
      
      // Clear selected group if it was deleted
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setParticipants([]);
      }
      
      // Real-time listener will update groups automatically
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedGroup || !formData.name) return;

    try {
      await createParticipant({
        name: formData.name,
        groupId: selectedGroup.id,
        phone: formData.phone,
        email: formData.email,
        sacrificeType: 'korban_sunat'
      });

      setFormData({ name: '', phone: '', email: '' });
      setShowAddForm(false);
      // Real-time listener will update participants automatically
    } catch (error) {
      console.error('Error creating participant:', error);
    }
  };

  const handleEditParticipant = async () => {
    if (!editingParticipant || !formData.name) return;

    try {
      await updateParticipant(editingParticipant.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email
      });

      setEditingParticipant(null);
      setFormData({ name: '', phone: '', email: '' });
      // Real-time listener will update participants automatically
    } catch (error) {
      console.error('Error updating participant:', error);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    try {
      await deleteParticipant(participantId);
      // Real-time listener will update participants automatically
    } catch (error) {
      console.error('Error deleting participant:', error);
    }
  };

  const handleBulkAddParticipants = async () => {
    if (!selectedGroup || !bulkData.trim()) return;

    setBulkLoading(true);
    try {
      const lines = bulkData.trim().split('\n');
      const participantsToAdd = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Parse different formats:
        // Format 1: "Name, Phone, Email"
        // Format 2: "Name, Phone"
        // Format 3: "Name"
        const parts = trimmedLine.split(',').map(part => part.trim());
        
        if (parts.length >= 1 && parts[0]) {
          participantsToAdd.push({
            name: parts[0],
            groupId: selectedGroup.id,
            phone: parts[1] || '',
            email: parts[2] || '',
            sacrificeType: 'korban_sunat' as const
          });
        }
      }

      // Add all participants
      for (const participantData of participantsToAdd) {
        await createParticipant(participantData);
      }

      setBulkData('');
      setShowBulkAddForm(false);
      // Real-time listener will update participants automatically
      
      alert(`Berjaya menambah ${participantsToAdd.length} ahli!`);
    } catch (error) {
      console.error('Error bulk adding participants:', error);
      alert('Terdapat ralat semasa menambah ahli. Sila cuba lagi.');
    } finally {
      setBulkLoading(false);
    }
  };

  const populateBulkEditData = () => {
    if (!selectedGroup) return;
    
    const formattedData = participants.map(p => 
      `${p.name}, ${p.phone || ''}, ${p.email || ''}`
    ).join('\n');
    
    setBulkEditData(formattedData);
    setShowBulkEditForm(true);
  };

  const handleBulkEditParticipants = async () => {
    if (!selectedGroup || !bulkEditData.trim()) return;

    setBulkEditLoading(true);
    try {
      const lines = bulkEditData.trim().split('\n');
      const participantsToUpdate = [];
      const currentParticipants = [...participants];

      for (let i = 0; i < lines.length && i < currentParticipants.length; i++) {
        const trimmedLine = lines[i].trim();
        if (!trimmedLine) continue;

        const parts = trimmedLine.split(',').map(part => part.trim());
        
        if (parts.length >= 1 && parts[0]) {
          participantsToUpdate.push({
            id: currentParticipants[i].id,
            name: parts[0],
            phone: parts[1] || '',
            email: parts[2] || ''
          });
        }
      }

      // Update all participants
      for (const participantData of participantsToUpdate) {
        await updateParticipant(participantData.id, {
          name: participantData.name,
          phone: participantData.phone,
          email: participantData.email
        });
      }

      setBulkEditData('');
      setShowBulkEditForm(false);
      // Real-time listener will update participants automatically
      
      alert(`Berjaya mengemaskini ${participantsToUpdate.length} ahli!`);
    } catch (error) {
      console.error('Error bulk editing participants:', error);
      alert('Terdapat ralat semasa mengemaskini ahli. Sila cuba lagi.');
    } finally {
      setBulkEditLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid grid-cols-3" style={{ gap: isMobile ? '16px' : '24px', minHeight: 'calc(100vh - 200px)' }}>
      {/* Groups List */}
      <div className="card" style={{ height: 'fit-content' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            Senarai Kumpulan
          </h3>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddGroupForm(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px',
              minWidth: '36px'
            }}
            title="Tambah Kumpulan"
          >
            <Plus size={16} />
          </button>
        </div>
        <div style={{ maxHeight: isMobile ? '300px' : '500px', overflowY: 'auto' }}>
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              style={{
                padding: isMobile ? '12px' : '16px',
                border: selectedGroup?.id === group.id ? '2px solid #059669' : '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: selectedGroup?.id === group.id ? '#f0fdf4' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Users size={20} style={{ color: '#059669' }} />
                  <div>
                    <p style={{ fontWeight: '600' }}>{group.name}</p>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      {selectedGroup?.id === group.id ? participants.length : '...'} peserta
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroup(group);
                      setGroupFormData({ name: group.name });
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid #6b7280',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Edit Kumpulan"
                  >
                    <Edit size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.id);
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid #dc2626',
                      borderRadius: '4px',
                      padding: '4px',
                      cursor: 'pointer',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Padam Kumpulan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Participants List */}
      <div className="card">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
            {selectedGroup ? `Ahli ${selectedGroup.name}` : 'Pilih Kumpulan'}
          </h3>
          {selectedGroup && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '8px',
                  minWidth: '36px'
                }}
                title="Tambah Ahli"
              >
                <Plus size={16} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowBulkAddForm(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '8px',
                  minWidth: '36px'
                }}
                title="Tambah Beramai-ramai"
              >
                <UserPlus size={16} />
              </button>
              {participants.length > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={populateBulkEditData}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '8px',
                    minWidth: '36px'
                  }}
                  title="Edit Beramai-ramai"
                >
                  <FileEdit size={16} />
                </button>
              )}
            </div>
          )}
        </div>

        {selectedGroup ? (
          <div style={{ maxHeight: isMobile ? '400px' : '500px', overflowY: 'auto' }}>
            {participants.map((participant) => (
              <div
                key={participant.id}
                style={{
                  padding: isMobile ? '12px' : '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {participant.name}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                      📱 {participant.phone}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      📧 {participant.email}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setEditingParticipant(participant);
                        setFormData({
                          name: participant.name,
                          phone: participant.phone || '',
                          email: participant.email || ''
                        });
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid #6b7280',
                        borderRadius: '4px',
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '28px',
                        minHeight: '28px'
                      }}
                      title="Edit ahli"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteParticipant(participant.id)}
                      style={{
                        background: 'none',
                        border: '1px solid #dc2626',
                        borderRadius: '4px',
                        padding: '4px',
                        cursor: 'pointer',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '28px',
                        minHeight: '28px'
                      }}
                      title="Padam ahli"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6b7280' 
          }}>
            Pilih kumpulan untuk melihat senarai ahli
          </div>
        )}
      </div>

      {/* Add/Edit Group Form */}
      {(showAddGroupForm || editingGroup) && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            {editingGroup ? 'Edit Kumpulan' : 'Tambah Kumpulan Baru'}
          </h3>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nama Kumpulan *
            </label>
            <input
              type="text"
              value={groupFormData.name}
              onChange={(e) => setGroupFormData(prev => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Contoh: Kumpulan A"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={editingGroup ? handleEditGroup : handleAddGroup}
              style={{ flex: 1 }}
            >
              {editingGroup ? 'Kemaskini' : 'Tambah Kumpulan'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowAddGroupForm(false);
                setEditingGroup(null);
                setGroupFormData({ name: '' });
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Bulk Add Participants Form */}
      {showBulkAddForm && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Tambah Ahli Beramai-ramai
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Format Data *
            </label>
            <div style={{ 
              backgroundColor: '#f9fafb', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '12px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Format yang diterima:</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Nama sahaja:</strong> Ahmad Ali</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Nama + Telefon:</strong> Ahmad Ali, 0123456789</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Nama + Telefon + Email:</strong> Ahmad Ali, 0123456789, ahmad@email.com</p>
              <p style={{ margin: '0', fontSize: '12px', fontStyle: 'italic' }}>
                Satu nama per baris. Gunakan koma (,) untuk memisahkan data.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Senarai Ahli *
            </label>
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              style={{
                width: '100%',
                height: '200px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
              placeholder={`Ahmad Ali, 0123456789, ahmad@email.com
Siti Fatimah, 0198765432
Ali Abu Hassan, 0111222333, ali@email.com
Nur Aisyah`}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleBulkAddParticipants}
              disabled={bulkLoading || !bulkData.trim()}
              style={{ flex: 1 }}
            >
              {bulkLoading ? 'Memproses...' : 'Tambah Semua'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowBulkAddForm(false);
                setBulkData('');
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Bulk Edit Participants Form */}
      {showBulkEditForm && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            Edit Ahli Beramai-ramai
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              backgroundColor: '#fef3c7', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '12px',
              fontSize: '14px',
              color: '#92400e'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>⚠️ Perhatian:</p>
              <p style={{ margin: '0 0 4px 0' }}>• Data sedia ada telah dimuatkan untuk anda edit</p>
              <p style={{ margin: '0 0 4px 0' }}>• Urutan baris mesti sama dengan urutan ahli sedia ada</p>
              <p style={{ margin: '0 0 4px 0' }}>• Format: Nama, Telefon, Email (satu baris per ahli)</p>
              <p style={{ margin: '0', fontSize: '12px', fontStyle: 'italic' }}>
                Sebarang perubahan akan menggantikan data lama sepenuhnya.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Data Ahli (Jumlah: {participants.length}) *
            </label>
            <textarea
              value={bulkEditData}
              onChange={(e) => setBulkEditData(e.target.value)}
              style={{
                width: '100%',
                height: '300px',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
              placeholder="Nama ahli akan dimuatkan secara automatik..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleBulkEditParticipants}
              disabled={bulkEditLoading || !bulkEditData.trim()}
              style={{ flex: 1 }}
            >
              {bulkEditLoading ? 'Mengemaskini...' : 'Kemaskini Semua'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowBulkEditForm(false);
                setBulkEditData('');
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Participant Form */}
      {(showAddForm || editingParticipant) && (
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
            {editingParticipant ? 'Edit Ahli' : 'Tambah Ahli Baru'}
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nama Penuh *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Masukkan nama penuh"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              No. Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="01X-XXXXXXXX"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="email@example.com"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={editingParticipant ? handleEditParticipant : handleAddParticipant}
              style={{ flex: 1 }}
            >
              {editingParticipant ? 'Kemaskini' : 'Tambah'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setEditingParticipant(null);
                setFormData({ name: '', phone: '', email: '' });
              }}
              style={{ flex: 1 }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;