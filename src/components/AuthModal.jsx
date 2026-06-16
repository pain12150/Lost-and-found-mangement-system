import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, showToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && (!name || !studentId))) {
      showToast('Please fill out all fields', 'error');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password } 
      : { name, email, student_id: studentId, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      showToast(isLogin ? `Welcome back, ${data.name}!` : 'Account created successfully!', 'success');
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isLogin ? <LogIn size={20} className="text-indigo" /> : <UserPlus size={20} className="text-indigo" />}
            {isLogin ? 'Student Sign In' : 'Student Registration'}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="reg-name"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '35px' }}
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="reg-studentid">Student ID / Roll Number</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="reg-studentid"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '35px' }}
                  placeholder="e.g. STU-2026-999"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Campus Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="auth-email"
                type="email"
                className="form-control"
                style={{ paddingLeft: '35px' }}
                placeholder="you@student.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label htmlFor="auth-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="auth-password"
                type="password"
                className="form-control"
                style={{ paddingLeft: '35px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? 'Register' : 'Login'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
