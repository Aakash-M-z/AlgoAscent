import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { PricingModal } from './PricingModal';
import { Crown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuToggle?: () => void;
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
const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { isPremium } = usePlan();
  const routerNavigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
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
    { label: 'My Assessments', icon: '📝', path: '/dashboard/assessments' },
    { label: 'Pricing & Plans', icon: '💎', path: '/pricing' },
    { label: 'Profile', icon: '◉', path: '/dashboard/profile' },
  ];

  const adminItems = user?.role === 'admin' ? [
    { label: 'Admin Panel', icon: '◈', path: '/dashboard/admin' },
    { label: 'Assessments', icon: '📝', path: '/dashboard/admin/assessments' },
    { label: 'Manage Users', icon: '◎', path: '/dashboard/admin/users' },
  ] : [];

  const displayName = user?.name && user.name !== 'Guest' ? user.name : (user?.username ?? 'User');
  const initials = displayName.charAt(0).toUpperCase();
  const userAvatar = user?.avatar || null;

  const navItems = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Assessments', path: user?.role === 'admin' ? '/dashboard/admin/assessments' : '/dashboard/assessments' },
    { label: user?.role === 'admin' ? 'Interview Analytics' : 'Mock Interview', path: '/dashboard/interview' },
    { label: 'Pricing', path: '/pricing' },
    { label: 'Resources', path: '/dashboard/resources' },
  ];

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
      />

      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(5,5,7,0.92)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
          height: '64px',
        }}
      >
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 md:px-8 h-full flex items-center justify-between">
 
          {/* Left side: Hamburger (on mobile) + Logo */}
          <div className="flex items-center gap-4">
            {onMenuToggle && (
              <button
                onClick={onMenuToggle}
                className="p-2 -ml-2 text-white/40 hover:text-white transition-colors md:hidden"
                aria-label="Toggle Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-white/[0.03]">
                <svg className="w-4 h-4 text-[#FF3B1F]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-zinc-100 tracking-tight leading-tight">
                  Algo<span className="text-[#FF3B1F]">Ascent</span>
                </h1>
                <p className="text-[10px] text-zinc-500 font-medium tracking-wide">
                  {user?.role === 'admin' ? 'Enterprise Core' : 'Mastery Matrix'}
                </p>
              </div>
            </div>
          </div>
 
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 h-full font-sans">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) => `
                  h-full flex items-center px-1 border-b-2 text-[13px] font-medium transition-all duration-200
                  ${isActive
                    ? 'border-[#FF3B1F] text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-white/15'
                  }
                `}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Pro Badge or Upgrade CTA */}
            {isPremium ? (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FF3B1F]/15 border border-[#FF3B1F]/30 text-[#FF3B1F]">
                <Crown size={12} />
                <span>PRO</span>
              </div>
            ) : (
              <button
                onClick={() => setPricingOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF3B1F] hover:bg-[#E63219] text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
              >
                <Crown size={12} />
                <span>Upgrade</span>
              </button>
            )}

            {/* User Avatar Dropdown Button */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(d => !d)}
                className={`relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200 border-2 cursor-pointer ${
                  showDropdown
                    ? 'border-[#FF3B1F] shadow-[0_0_16px_rgba(255,59,31,0.4)] scale-105'
                    : 'border-white/15 hover:border-[#FF3B1F]/60 hover:scale-105'
                }`}
                style={{
                  background: 'linear-gradient(135deg, #FF3B1F, #B8220C)',
                }}
                aria-label="User Profile Menu"
              >
                {userAvatar ? (
                  <img src={userAvatar} alt={displayName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-xs font-bold text-black">{initials}</span>
                )}
              </button>
 
              {/* Dropdown panel */}
              {showDropdown && (
                <div
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: '230px',
                    background: '#0E0E14',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    boxShadow: '0 20px 56px rgba(0,0,0,0.85), 0 0 24px rgba(255,59,31,0.05)',
                    zIndex: 100, overflow: 'hidden',
                    animation: 'dropdownOpen 0.18s cubic-bezier(0.22,1,0.36,1) both',
                  }}
                >
                  {/* User info header */}
                  <div style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #FF3B1F, #B8220C)',
                      display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                      fontSize: '0.95rem', fontWeight: 700, color: '#000000',
                      boxShadow: '0 0 12px rgba(255,59,31,0.2)',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {userAvatar ? (
                        <img src={userAvatar} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3 }}>
                        {displayName}
                      </p>
                      <p style={{
                        fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)',
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
                          color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', cursor: 'pointer',
                          transition: 'all 0.15s ease', textAlign: 'left',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,31,0.1)';
                          (e.currentTarget as HTMLElement).style.color = '#FF3B1F';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)';
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
 
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 2px' }} />
 
                    {/* Admin section — only visible to admins */}
                    {adminItems.length > 0 && (
                      <>
                        <div style={{
                          padding: '8px 12px 4px',
                          fontSize: '0.65rem', fontWeight: 700,
                          color: '#FF3B1F', textTransform: 'uppercase', letterSpacing: '0.12em',
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
                              color: '#FF3B1F', fontSize: '0.85rem', cursor: 'pointer',
                              transition: 'all 0.15s ease', textAlign: 'left', opacity: 0.9,
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(255,59,31,0.1)';
                              (e.currentTarget as HTMLElement).style.opacity = '1';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                              (e.currentTarget as HTMLElement).style.opacity = '0.9';
                            }}
                          >
                            <span style={{ fontSize: '0.9rem', width: '16px', textAlign: 'center' }}>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 2px' }} />
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
