import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Always start in dark mode for the premium theme
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.user-dropdown')) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const next = !html.classList.contains('dark');
    next ? html.classList.add('dark') : html.classList.remove('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
  };

  return (
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
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div
            style={{
              width: '36px', height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(212,175,55,0.4)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(212,175,55,0.08)',
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span style="font-size:1.2rem">◈</span>';
              }}
            />
          </div>
          <div>
            <h1
              style={{
                fontFamily: '"Orbitron", "Inter", sans-serif',
                fontSize: '1rem',
                fontWeight: 800,
                color: '#EAEAEA',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
              }}
            >
              Progress{' '}
              <span style={{ color: '#D4AF37' }}>Tracker</span>
            </h1>
            <p style={{ fontSize: '0.6rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Mastering Algorithms
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            style={{
              padding: '7px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'; (e.currentTarget as HTMLElement).style.color = '#D4AF37'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#888'; }}
          >
            {isDark ? '☀' : '☾'}
          </button>

          {/* User dropdown */}
          <div className="relative user-dropdown">
            <button
              onClick={() => setShowDropdown(d => !d)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.5)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
            >
              {/* Avatar */}
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #D4AF37, #8A6012)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, color: '#0B0B0B',
              }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EAEAEA', lineHeight: 1.2 }}>{user?.name || 'User'}</p>
                <p style={{ fontSize: '0.6rem', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{user?.role || 'Member'}</p>
              </div>
              <svg
                style={{ width: '12px', height: '12px', color: '#555', transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'none' }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 mt-2 animate-scaleIn"
                style={{
                  width: '220px',
                  background: '#111',
                  border: '1px solid rgba(212,175,55,0.2)',
                  borderRadius: '14px',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '0.8rem', color: '#EAEAEA', fontWeight: 600 }}>Signed in as</p>
                  <p style={{ fontSize: '0.75rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                </div>
                <div style={{ padding: '8px' }}>
                  {[
                    { label: 'Profile', icon: '◉' },
                    { label: 'Edit Profile', icon: '✎' },
                    { label: 'Settings', icon: '⚙' },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => setShowDropdown(false)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 12px', borderRadius: '8px',
                        background: 'transparent', border: 'none',
                        color: '#888', fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.15s ease', textAlign: 'left',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.08)'; (e.currentTarget as HTMLElement).style.color = '#D4AF37'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#888'; }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                  <button
                    onClick={() => { setShowDropdown(false); if (window.confirm('Logout?')) logout(); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '8px',
                      background: 'transparent', border: 'none',
                      color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer',
                      transition: 'all 0.15s ease', textAlign: 'left',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span>⏻</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
