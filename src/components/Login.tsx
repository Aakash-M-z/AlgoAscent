import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { User } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import ParticleBackground from './ParticleBackground';

interface LoginProps {
  onLogin: (user: User) => void;
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); setLoading(false); return; }
    if (!isLogin && !username.trim()) { setError('Username is required'); setLoading(false); return; }

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin
        ? { email: email.trim().toLowerCase(), password }
        : { email: email.trim().toLowerCase(), password, username: username.trim() };

      let response: Response;
      try {
        response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } catch {
        throw new Error('Cannot connect to server. Make sure the backend is running on port 3001.');
      }

      let data: any;
      try { data = await response.json(); } catch { throw new Error(`Server returned an invalid response (${response.status})`); }
      if (!response.ok) throw new Error(data.error || 'Authentication failed');

      const userData: User = { id: data.id, email: data.email, name: data.username, role: data.role as 'admin' | 'user' };
      login(userData);
      onLogin(userData);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => { setIsLogin(!isLogin); setError(''); setEmail(''); setPassword(''); setUsername(''); };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true); setError('');
      try {
        const res = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tokenResponse.access_token }) });
        let data;
        try { data = await res.json(); } catch { throw new Error(`Server Error (${res.status})`); }
        if (!res.ok) throw new Error(data.error || 'Google login failed');
        const userData: User = { id: data.id, email: data.email, name: data.username || data.name, role: data.role as 'admin' | 'user' };
        login(userData); onLogin(userData);
      } catch (err: any) {
        setError(err.message || 'Google login failed.');
      } finally { setLoading(false); }
    },
    onError: () => { setError('Google login failed'); setLoading(false); }
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: '#1A1A1A',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#EAEAEA',
    fontSize: '0.9rem',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.8rem', fontWeight: 600,
    color: '#888', marginBottom: '6px', letterSpacing: '0.05em',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B0B0B', display: 'flex', overflow: 'hidden' }} className="animate-fadeIn">
      {/* Left — Form */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', position: 'relative', zIndex: 10 }} className="animate-slideInFromLeft">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: 'absolute', top: '24px', left: '24px',
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '8px 14px',
              color: '#888', fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#888'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            ← Back
          </button>
        )}

        <ParticleBackground particleCount={40} particleColor="rgba(212,175,55,0.4)" lineColor="rgba(212,175,55,0.1)" particleSpeed={0.2} lineDistance={100} className="z-0" />

        <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
          {/* Card */}
          <div style={{
            background: '#111',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '20px',
            padding: '36px 32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          }}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '6px', fontFamily: 'Poppins, Inter, sans-serif' }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p style={{ color: '#555', fontSize: '0.875rem' }}>
                {isLogin ? 'Sign in to continue your journey' : 'Start your DSA journey today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isLogin && (
                <div className="animate-fadeIn">
                  <label style={labelStyle}>Username</label>
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Choose a username" required={!isLogin}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              )}

              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" required
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div className="animate-shake" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '13px',
                  background: loading ? 'rgba(212,175,55,0.3)' : 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                  border: 'none', borderRadius: '10px',
                  color: '#0B0B0B', fontWeight: 700, fontSize: '0.95rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(212,175,55,0.5)'; } }}
                onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(212,175,55,0.3)'; } }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <span className="spinner-gold" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span>
                    {isLogin ? 'Signing in...' : 'Creating Account...'}
                  </span>
                ) : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ color: '#444', fontSize: '0.75rem' }}>or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Social buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  {
                    label: 'Google', action: () => googleLogin(),
                    icon: (
                      <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    )
                  },
                  {
                    label: 'Facebook', action: () => { },
                    icon: <svg style={{ width: '20px', height: '20px', color: '#1877F2' }} fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                  },
                  {
                    label: 'Apple', action: () => { },
                    icon: <svg style={{ width: '20px', height: '20px', color: '#fff' }} fill="currentColor" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.7.79 3.49 1.95-3.07 1.67-2.55 6.07.6 7.32-.23 1.25-.97 3.04-2.68 3.76zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.54 4.33-3.74 4.25z" /></svg>
                  },
                ].map(s => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={s.action}
                    aria-label={`Sign in with ${s.label}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  >
                    {s.icon}
                  </button>
                ))}
              </div>
            </form>

            {/* Toggle */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
              <p style={{ color: '#555', fontSize: '0.85rem' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={toggleMode}
                  style={{ color: '#D4AF37', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Video panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'none' }} className="lg:block">
        <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7) contrast(1.1)' }}>
          <source src="/56376-479358463_small.mp4" type="video/mp4" />
        </video>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to left, rgba(0,0,0,0.5), rgba(0,0,0,0.2), rgba(0,0,0,0.7))' }} />
        <ParticleBackground particleCount={80} particleColor="rgba(212,175,55,0.8)" lineColor="rgba(212,175,55,0.2)" particleSpeed={0.3} lineDistance={120} className="z-10" />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
          <div className="text-center animate-fadeIn">
            <h2 style={{ fontSize: '3.5rem', fontWeight: 700, color: '#EAEAEA', lineHeight: 1.2, marginBottom: '16px', fontFamily: 'Poppins, sans-serif' }}>
              Start Your<br />
              <span style={{ color: '#D4AF37' }}>Journey</span>
            </h2>
            <p style={{ color: '#888', fontSize: '1rem', maxWidth: '360px' }}>
              Master Data Structures & Algorithms with focused practice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
