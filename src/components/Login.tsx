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
    background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(10px)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '20px',
  }}>
    <div style={{
      width: '52px', height: '52px', borderRadius: '50%',
      border: '3px solid rgba(212,175,55,0.15)', borderTopColor: '#D4AF37',
      animation: 'spinGold 0.8s linear infinite',
      boxShadow: '0 0 24px rgba(212,175,55,0.35)',
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
      login(result);
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
      setLoading(true); setError('');
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

      {/* ── Full-screen container ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: '#080808',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>

        {/* ── Particle canvas — fills entire screen ── */}
        <ParticleBackground
          particleCount={65}
          particleColor="212,175,55"
          lineColor="rgba(212,175,55,0.07)"
          particleSpeed={0.22}
          lineDistance={125}
          className="z-0"
        />

        {/* ── Ambient corner glows ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 55% 45% at 0% 0%, rgba(212,175,55,0.07) 0%, transparent 70%)',
            'radial-gradient(ellipse 55% 45% at 100% 100%, rgba(212,175,55,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(8,8,8,0.55) 0%, rgba(8,8,8,0.82) 100%)',
          ].join(', '),
        }} />

        {/* ── Floating orb behind card ── */}
        <div style={{
          position: 'absolute', zIndex: 2, pointerEvents: 'none',
          width: '520px', height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,175,55,0.055) 0%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'translate(-50%, -50%)',
          left: '50%', top: '50%',
        }} />

        {/* ── Back button ── */}
        {onBack && (
          <button onClick={onBack} style={{
            position: 'absolute', top: '24px', left: '24px', zIndex: 20,
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '8px 14px',
            color: '#888', fontSize: '0.85rem', cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#888'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >← Back</button>
        )}

        {/* ── Brand watermark top-center ── */}
        <div style={{
          position: 'absolute', top: '28px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, display: 'flex', alignItems: 'center', gap: '8px',
          opacity: 0.35, pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '1rem', color: '#D4AF37' }}>◈</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.18em', textTransform: 'uppercase' }}>AlgoAscent</span>
        </div>

        {/* ── Login card ── */}
        <div style={{
          position: 'relative', zIndex: 10,
          width: '100%', maxWidth: '420px',
          margin: '0 20px',
          animation: 'cardMount 0.45s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {/* Gold border glow */}
          <div style={{
            position: 'absolute', inset: '-1px', borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.04), rgba(212,175,55,0.18))',
            filter: 'blur(1px)', zIndex: -1,
          }} />

          <div style={{
            background: 'rgba(12,12,12,0.96)',
            border: '1px solid rgba(212,175,55,0.16)',
            borderRadius: '20px', padding: '36px 32px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 60px rgba(212,175,55,0.05)',
            backdropFilter: 'blur(24px)',
          }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '26px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '50px', height: '50px', borderRadius: '15px',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04))',
                border: '1px solid rgba(212,175,55,0.28)',
                fontSize: '1.5rem', marginBottom: '14px',
                boxShadow: '0 0 24px rgba(212,175,55,0.15)',
              }}>◈</div>
              <h1 style={{
                fontSize: '1.55rem', fontWeight: 700, color: '#EAEAEA',
                marginBottom: '5px', fontFamily: 'Poppins, Inter, sans-serif',
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
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#555', marginBottom: '6px', letterSpacing: '0.08em' }}>USERNAME</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Choose a username" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#555', marginBottom: '6px', letterSpacing: '0.08em' }}>EMAIL</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email" style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#555', marginBottom: '6px', letterSpacing: '0.08em' }}>PASSWORD</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f87171', padding: '11px 14px', borderRadius: '10px', fontSize: '0.82rem',
                }}>{error}</div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                border: 'none', borderRadius: '10px',
                color: '#0B0B0B', fontWeight: 700, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer', marginTop: '2px',
                boxShadow: '0 4px 24px rgba(212,175,55,0.28)',
                opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif',
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 32px rgba(212,175,55,0.45)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(212,175,55,0.28)'; }}
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '2px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ color: '#3a3a3a', fontSize: '0.7rem', letterSpacing: '0.06em' }}>OR CONTINUE WITH</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
              </div>

              <button type="button" onClick={() => googleLogin()} style={{
                width: '100%', padding: '11px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px', color: '#EAEAEA', fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
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

            <div style={{ marginTop: '22px', textAlign: 'center' }}>
              <span style={{ color: '#444', fontSize: '0.82rem' }}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
              </span>
              <button onClick={toggleMode} style={{
                color: '#D4AF37', fontWeight: 600, background: 'none',
                border: 'none', cursor: 'pointer', fontSize: '0.82rem',
                transition: 'opacity 0.2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
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
