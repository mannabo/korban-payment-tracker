import React, { useState, useEffect } from 'react';
import { createAdminAccount, listAdminAccounts, CreateAdminData } from '../utils/adminUtils';
import { Shield, Plus, Users, AlertTriangle } from 'lucide-react';

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateAdminData>({
    email: '',
    password: '',
    displayName: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const adminList = await listAdminAccounts();
      setAdmins(adminList);
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await createAdminAccount(formData);
      setSuccess(`Admin account created successfully for ${formData.email}`);
      setFormData({ email: '', password: '', displayName: '' });
      setShowCreateForm(false);
      await loadAdmins();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Shield size={24} style={{ color: '#dc2626' }} />
          Admin Management
        </h1>
        
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          <Plus size={16} />
          Create New Admin
        </button>
      </div>

      {/* Security Warning */}
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={20} style={{ color: '#dc2626' }} />
          <h3 style={{ color: '#dc2626', fontWeight: '600', margin: 0 }}>Security Notice</h3>
        </div>
        <p style={{ color: '#7f1d1d', fontSize: '0.875rem', margin: 0 }}>
          Admin account creation is restricted to existing administrators only. 
          Regular users cannot register as admins through the public interface.
        </p>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#1f2937' }}>Create New Admin Account</h2>
          
          <form onSubmit={handleCreateAdmin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="admin@example.com"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Full Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="John Doe"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
                placeholder="Minimum 6 characters"
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                backgroundColor: '#f0fdf4',
                color: '#166534',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {success}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admin List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem'
      }}>
        <h2 style={{ 
          marginBottom: '1rem', 
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Users size={20} />
          Current Administrators ({admins.length})
        </h2>
        
        {admins.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No admin accounts found
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {admins.map((admin, index) => (
              <div
                key={admin.id || index}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <p style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>
                    {admin.displayName || 'No Name'}
                  </p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                    {admin.email || admin.id}
                  </p>
                  {admin.createdAt && (
                    <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                      Created: {new Date(admin.createdAt.seconds * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  Admin
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;