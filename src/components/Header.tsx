import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
}

/* ── Logout confirmation modal (Using Portals for perfect centering) ── */
const LogoutModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="relative bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] w-full max-w-[400px] p-10 shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_40px_rgba(212,175,55,0.08)]"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

        {/* Sign Out Icon */}
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-inner">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>

        <h2 className="text-center text-2xl font-black text-white/95 mb-3 tracking-tighter">Sign Out?</h2>
        <p className="text-center text-white/40 text-sm mb-10 leading-relaxed font-medium">
          Ready to leave? Your progress is saved, but you'll need to sign back in for AI insights.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full px-8 py-4 bg-red-600 border border-red-500 rounded-2xl text-white text-sm font-black hover:bg-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all uppercase tracking-widest active:scale-95"
          >
            Confirm Logout
          </button>
          <button
            onClick={onCancel}
            className="w-full px-8 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white/30 text-sm font-bold hover:bg-white/[0.08] hover:text-white transition-all uppercase tracking-widest"
          >
            Stay Logged In
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

/* ── Header ──────────────────────────────────────────────────── */
const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth();
  const routerNavigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowDropdown(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const navigate = useCallback((path: string) => {
    setShowDropdown(false);
    routerNavigate(path);
  }, [routerNavigate]);

  const handleLogoutConfirm = useCallback(() => {
    setShowLogoutModal(false);
    logout();
    // Navigate to landing page via React Router — no full reload
    routerNavigate('/', { replace: true });
  }, [logout, routerNavigate]);

  const menuItems = [
    { label: 'Profile', icon: '◉', path: '/dashboard/profile' },
    { label: 'Settings', icon: '⚙', path: '/dashboard/settings' },
  ];

  const adminItems = user?.role === 'admin' ? [
    { label: 'Admin Panel', icon: '◈', path: '/dashboard/admin' },
    { label: 'Manage Users', icon: '◎', path: '/dashboard/admin' },
  ] : [];

  const displayName = user?.name && user.name !== 'Guest' ? user.name : (user?.username ?? 'User');
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(11,11,11,0.95)',
          borderBottom: '1px solid rgba(212,175,55,0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          height: '64px',
        }}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 h-full flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              border: '1px solid rgba(212,175,55,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(212,175,55,0.08)', overflow: 'hidden',
            }}>
              <img
                src="/logo.png" alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span style="font-size:1.2rem">◈</span>';
                }}
              />
            </div>
            <div>
              <h1 style={{
                fontFamily: '"Orbitron", "Inter", sans-serif',
                fontSize: '1rem', fontWeight: 800, color: '#EAEAEA',
                letterSpacing: '0.05em', lineHeight: 1.2,
              }}>
                Progress <span style={{ color: '#D4AF37' }}>Tracker</span>
              </h1>
              <p style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                Mastering Algorithms
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* User dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(d => !d)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 12px',
                  background: showDropdown ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${showDropdown ? 'rgba(212,175,55,0.45)' : 'rgba(212,175,55,0.2)'}`,
                  borderRadius: '10px', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  if (!showDropdown) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.45)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!showDropdown) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #D4AF37, #8A6012)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#0B0B0B',
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EAEAEA', lineHeight: 1.2 }}>
                    {displayName}
                  </p>
                  <p style={{ fontSize: '0.6rem', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {user?.role || 'Member'}
                  </p>
                </div>
                <svg
                  style={{
                    width: '12px', height: '12px', color: '#555',
                    transition: 'transform 0.2s',
                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {showDropdown && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: '230px',
                    background: '#111',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 56px rgba(0,0,0,0.75), 0 0 24px rgba(212,175,55,0.05)',
                    zIndex: 100, overflow: 'hidden',
                    animation: 'dropdownOpen 0.18s cubic-bezier(0.22,1,0.36,1) both',
                  }}
                >
                  {/* User info header */}
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #D4AF37, #8A6012)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem', fontWeight: 700, color: '#0B0B0B',
                      boxShadow: '0 0 12px rgba(212,175,55,0.3)',
                    }}>
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#EAEAEA', lineHeight: 1.3 }}>
                        {displayName}
                      </p>
                      <p style={{
                        fontSize: '0.72rem', color: '#555',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{ padding: '6px' }}>
                    {menuItems.map(item => (
                      <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 12px', borderRadius: '8px',
                          background: 'transparent', border: 'none',
                          color: '#888', fontSize: '0.85rem', cursor: 'pointer',
                          transition: 'all 0.15s ease', textAlign: 'left',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)';
                          (e.currentTarget as HTMLElement).style.color = '#D4AF37';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#888';
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 2px' }} />

                    {/* Admin section — only visible to admins */}
                    {adminItems.length > 0 && (
                      <>
                        <div style={{
                          padding: '8px 12px 4px',
                          fontSize: '0.65rem', fontWeight: 700,
                          color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em',
                        }}>
                          Admin
                        </div>
                        {adminItems.map(item => (
                          <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '9px 12px', borderRadius: '8px',
                              background: 'transparent', border: 'none',
                              color: '#D4AF37', fontSize: '0.85rem', cursor: 'pointer',
                              transition: 'all 0.15s ease', textAlign: 'left', opacity: 0.85,
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.1)';
                              (e.currentTarget as HTMLElement).style.opacity = '1';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                              (e.currentTarget as HTMLElement).style.opacity = '0.85';
                            }}
                          >
                            <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 2px' }} />
                      </>
                    )}

                    {/* Logout */}
                    <button
                      onClick={() => { setShowDropdown(false); setShowLogoutModal(true); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '8px',
                        background: 'transparent', border: 'none',
                        color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.15s ease', textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(239,68,68,0.15)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>⏻</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
