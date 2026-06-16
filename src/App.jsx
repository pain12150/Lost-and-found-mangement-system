import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ClaimsDashboard from './components/ClaimsDashboard';
import AuthModal from './components/AuthModal';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export default function App() {
  const [activeView, onViewChange] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('traceback_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Persist auth form credentials across modal open/close and logout
  const [authEmail, setAuthEmail] = useState(() => localStorage.getItem('traceback_last_email') || '');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authStudentId, setAuthStudentId] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Auth modal
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // App notifications from DB
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications helper
  const fetchNotifications = async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const response = await fetch(`/api/notifications?user_id=${currentUser.id}`);
      const data = await response.json();
      if (response.ok) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Poll for notifications when user is logged in
  useEffect(() => {
    fetchNotifications();
    let interval;
    if (currentUser) {
      interval = setInterval(fetchNotifications, 8000);
    }
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleMarkNotificationRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
        );
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleAuthSuccess = (user) => {
    localStorage.setItem('traceback_user', JSON.stringify(user));
    localStorage.setItem('traceback_last_email', user.email);
    setCurrentUser(user);
    // Keep email prefilled, clear password and registration fields
    setAuthEmail(user.email);
    setAuthPassword('');
    setAuthName('');
    setAuthStudentId('');
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('traceback_user');
    setCurrentUser(null);
    setNotifications([]);
    // Keep last email prefilled for quick sign-back-in; clear password
    setAuthPassword('');
    showToast('Logged out successfully', 'info');
    onViewChange('dashboard');
  };

  return (
    <div className="app-container">
      <Navbar
        activeView={activeView}
        onViewChange={onViewChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      <main className="main-content">
        {activeView === 'dashboard' && (
          <Dashboard
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            showToast={showToast}
          />
        )}

        {activeView === 'report' && (
          <ReportForm
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onViewChange={onViewChange}
            showToast={showToast}
          />
        )}

        {activeView === 'claims' && (
          <ClaimsDashboard
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            showToast={showToast}
          />
        )}
      </main>

      {/* Auth Modal Overlay */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        showToast={showToast}
        authEmail={authEmail}
        setAuthEmail={setAuthEmail}
        authPassword={authPassword}
        setAuthPassword={setAuthPassword}
        authName={authName}
        setAuthName={setAuthName}
        authStudentId={authStudentId}
        setAuthStudentId={setAuthStudentId}
      />

      {/* Toast Messages Stack */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <CheckCircle size={18} style={{ color: 'var(--accent-success)' }} />}
            {toast.type === 'error' && <XCircle size={18} style={{ color: 'var(--accent-error)' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent-primary)' }} />}
            <span style={{ fontSize: '0.9rem' }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
