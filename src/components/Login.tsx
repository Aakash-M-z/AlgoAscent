import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { databaseAPI } from '../api/database';
import ParticleBackground from './ParticleBackground';

interface LoginProps {
  onLogin?: () => void;
  onBack?: () => void;
}

const LoadingOverlay: React.FC<{ text?: string }> = ({ text = 'Signing in...' }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(11,11,11,0.85)', backdropFilter: 'blur(8px)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '20px',
  }}>
    <div style={{
      width: '52px', height: '52px', borderRadius: '50%',
      border: '3px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37',
      animation: 'spinGold 0.8s linear infinite',
      boxShadow: '0 0 20px rgba(212,175,55,0.3)',
    }} />
    <span style={{ color: '#D4AF37', fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.08em' }}>
      {text}
    </span>
  </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Signing in...');
  const [error, setError] = useState('');
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then(r => { if (!r.ok) setServerDown(true); })
      .catch(() => setServerDown(true));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields'); return; }
    if (!isLogin && !username.trim()) { setError('Username is required'); return; }

    setLoadingText(isLogin ? 'Signing in...' : 'Creating account...');
    setLoading(true);

    try {
      const result = isLogin
        ? await databaseAPI.login(email.trim().toLowerCase(), password)
        : await databaseAPI.register(email.trim().toLowerCase(), password, username.trim());

      if (!result) throw new Error('Authentication failed. Please try again.');

      login(result);   // passes { user, token } to AuthContext
      onLogin?.();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(v => !v);
    setError('');
    setEmail(''); setPassword(''); setUsername('');
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoadingText('Signing in with Google...');
      setLoading(true);
      setError('');
      try {
        const result = await databaseAPI.googleAuth(tokenResponse.access_token);
        if (!result) throw new Error('Google login failed. Please try again.');
        login(result);
        onLogin?.();
      } catch (err: any) {
        setError(err.message || 'Google login failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => { setError('Google login was cancelled or failed.'); setLoading(false); },
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#EAEAEA',
    fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <>
      {loading && <LoadingOverlay text={loadingText} />}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: '#0B0B0B',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <ParticleBackground
          particleCount={45} particleColor="rgba(212,175,55,0.55)"
          lineColor="rgba(212,175,55,0.08)" particleSpeed={0.25}
          lineDistance={110} className="z-0"
        />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse at center, rgba(11,11,11,0.6) 0%, rgba(11,11,11,0.88) 100%)',
        }} />

        {onBack && (
          <button onClick={onBack} style={{
            position: 'absolute', top: '24px', left: '24px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '8px 14px',
            color: '#888', fontSize: '0.85rem', cursor: 'pointer',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#888'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            ← Back
          </button>
        )}

        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '420px', margin: '0 20px',
          animation: 'cardMount 0.45s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{
            position: 'absolute', inset: '-1px', borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05), rgba(212,175,55,0.15))',
            filter: 'blur(1px)', zIndex: -1,
          }} />
          <div style={{
            background: 'rgba(14,14,14,0.95)',
            border: '1px solid rgba(212,175,55,0.18)',
            borderRadius: '20px', padding: '36px 32px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.06)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                border: '1px solid rgba(212,175,55,0.3)',
                fontSize: '1.4rem', marginBottom: '12px',
              }}>◈</div>
              <h1 style={{
                fontSize: '1.55rem', fontWeight: 700, color: '#EAEAEA',
                marginBottom: '4px', fontFamily: 'Poppins, Inter, sans-serif',
              }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p style={{ color: '#555', fontSize: '0.82rem' }}>
                {isLogin ? 'Sign in to continue your journey' : 'Start your DSA journey today'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {serverDown && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', padding: '10px 14px', borderRadius: '10px', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span>⚠</span>
                  <span>Backend not running. Start with <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px' }}>npm run server</code></span>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '6px', letterSpacing: '0.05em' }}>USERNAME</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Choose a username" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '6px', letterSpacing: '0.05em' }}>EMAIL</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#666', marginBottom: '6px', letterSpacing: '0.05em' }}>PASSWORD</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171', padding: '11px 14px', borderRadius: '10px', fontSize: '0.82rem',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                border: 'none', borderRadius: '10px',
                color: '#0B0B0B', fontWeight: 700, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '2px',
                boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
              }}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ color: '#444', fontSize: '0.72rem', letterSpacing: '0.04em' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
              </div>

              <button type="button" onClick={() => googleLogin()} style={{
                width: '100%', padding: '11px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', color: '#EAEAEA', fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.06)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <span style={{ color: '#555', fontSize: '0.82rem' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button onClick={toggleMode} style={{
                color: '#D4AF37', fontWeight: 600, background: 'none',
                border: 'none', cursor: 'pointer', fontSize: '0.82rem',
              }}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
