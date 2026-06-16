import React, { useState, useEffect } from 'react';
import { Bell, LogOut, User, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Navbar({ activeView, onViewChange, currentUser, onLogout, onOpenAuthModal, notifications, onMarkNotificationRead }) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setShowNotifDropdown(false);
    if (showNotifDropdown) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showNotifDropdown]);

  const handleNotificationClick = (e, notif) => {
    e.stopPropagation();
    onMarkNotificationRead(notif.id);
    // Automatically redirect to claims dashboard if notification is related to claims
    if (notif.title.toLowerCase().includes('claim')) {
      onViewChange('claims');
      setShowNotifDropdown(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#" className="navbar-brand" onClick={(e) => { e.preventDefault(); onViewChange('dashboard'); }}>
          <MapPin size={24} style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.6))' }} />
          <span>CampusTrace</span>
        </a>

        <div className="navbar-links">
          <a 
            className={`nav-link ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => onViewChange('dashboard')}
          >
            Dashboard
          </a>
          <a 
            className={`nav-link ${activeView === 'report' ? 'active' : ''}`}
            onClick={() => onViewChange('report')}
          >
            Report Item
          </a>
          <a 
            className={`nav-link ${activeView === 'claims' ? 'active' : ''}`}
            onClick={() => onViewChange('claims')}
          >
            Claims Center
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
          {currentUser ? (
            <>
              {/* Notification icon */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  className="nav-btn-hover"
                >
                  <Bell size={20} className={unreadCount > 0 ? 'text-indigo' : ''} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'var(--accent-error)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-primary)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="notification-dropdown glass-panel" onClick={(e) => e.stopPropagation()}>
                    <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unreadCount} unread</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                          onClick={(e) => handleNotificationClick(e, notif)}
                        >
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <div style={{ marginTop: '2px' }}>
                              {notif.title.toLowerCase().includes('approved') ? (
                                <CheckCircle size={16} style={{ color: 'var(--accent-success)' }} />
                              ) : notif.title.toLowerCase().includes('reject') ? (
                                <AlertTriangle size={16} style={{ color: 'var(--accent-error)' }} />
                              ) : (
                                <Bell size={16} style={{ color: 'var(--accent-primary)' }} />
                              )}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{notif.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{notif.message}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User details and Logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-glass)', paddingLeft: '1rem' }}>
                <span className="user-name-display" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {currentUser.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.25rem' }}>({currentUser.student_id})</span>
                </span>
                <button 
                  onClick={onLogout} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <button onClick={onOpenAuthModal} className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              <User size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
