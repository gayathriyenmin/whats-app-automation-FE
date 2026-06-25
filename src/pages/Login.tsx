import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.scss';
import { Compass } from 'lucide-react';

const Login: React.FC = () => {
  const { login, error, isLoading } = useAuthStore();
  const [email, setEmail] = useState('admin@platform.com');
  const [password, setPassword] = useState('admin123');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {}
  };

  return (
    <div className={styles.modalOverlay} style={{ background: 'var(--bg-base)' }}>
      <div className={styles.modal} style={{ maxWidth: '400px', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <Compass size={42} color="var(--primary)" style={{ animation: 'spinSlow 20s linear infinite' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>WhatsApp AI Platform</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operator Portal Log In</span>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontSize: '0.8rem', padding: '10px', borderRadius: '6px', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} style={{ maxWidth: '100%' }}>
          <div className={styles.formGroup}>
            <label>Operator Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" className={styles.btn} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
