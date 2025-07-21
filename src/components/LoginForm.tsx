import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

interface LoginFormProps {
  onBack?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, loading } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await signIn(email, password);
      // Role verification will be handled by useAuth hook
      // If user is not admin, they will be redirected appropriately
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Email atau kata laluan tidak betul.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Email atau kata laluan tidak betul.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Terlalu banyak percubaan. Sila cuba lagi kemudian.');
      } else {
        setError('Gagal log masuk. Sila cuba lagi.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '0.25rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={16} />
            Kembali ke Portal
          </button>
        )}
        <h2>Admin Login</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Masukkan email dan kata laluan admin
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="contoh@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Kata Laluan:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Kata laluan admin"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Memuatkan...' : 'Log Masuk'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #fbbf24' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
            ⚠️ Admin accounts are created by system administrators only
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;