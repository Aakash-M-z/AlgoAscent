import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNavigate?: (tab: string) => void;
}

/* ── Logout confirmation modal ───────────────────────────────── */
const LogoutModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'overlayFadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: '20px',
          padding: '32px 28px',
          width: '100%', maxWidth: '360px',
          margin: '0 20px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.06)',
          animation: 'cardMount 0.25s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 20px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
        }}>⏻</div>

        <h2 style={{
          textAlign: 'center', fontSize: '1.1rem', fontWeight: 700,
          color: '#EAEAEA', marginBottom: '8px',
          fontFamily: 'Poppins, Inter, sans-serif',
        }}>Sign Out</h2>
        <p style={{
          textAlign: 'center', fontSize: '0.85rem', color: '#666',
          marginBottom: '28px', lineHeight: 1.5,
        }}>
          Are you sure you want to sign out of your account?
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px', color: '#888',
              fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = '#EAEAEA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#888'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', color: '#ef4444',
              fontSize: '0.875rem', fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.22)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Header ──────────────────────────────────────────────────── */
const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
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

  const navigate = useCallback((tab: string) => {
    setShowDropdown(false);
    onNavigate?.(tab);
  }, [onNavigate]);

  const handleLogoutConfirm = useCallback(() => {
    setShowLogoutModal(false);
    logout();
  }, [logout]);

  const menuItems = [
    { label: 'Profile', icon: '◉', tab: 'profile' },
    { label: 'Settings', icon: '⚙', tab: 'profile' },
  ];

  const initials = user?.name?.charAt(0).toUpperCase() || 'U';

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
                    {user?.name || 'Guest'}
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
                        {user?.name || 'Guest'}
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
                        onClick={() => navigate(item.tab)}
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
