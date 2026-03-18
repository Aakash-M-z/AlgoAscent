import React, { useEffect, useState } from 'react';
import ParticleBackground from './ParticleBackground';

interface Props {
    onDone: () => void;
    duration?: number; // ms before auto-dismiss
}

const IntroScreen: React.FC<Props> = ({ onDone, duration = 2600 }) => {
    const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

    useEffect(() => {
        // in → hold after 600ms
        const t1 = setTimeout(() => setPhase('hold'), 600);
        // hold → out after duration
        const t2 = setTimeout(() => setPhase('out'), duration);
        // unmount after fade-out completes (600ms)
        const t3 = setTimeout(() => onDone(), duration + 600);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            opacity: phase === 'out' ? 0 : 1,
            transition: phase === 'out' ? 'opacity 0.6s ease' : 'none',
            pointerEvents: phase === 'out' ? 'none' : 'all',
        }}>
            {/* Particles */}
            <ParticleBackground
                particleCount={38}
                particleColor="rgba(212,175,55,0.5)"
                lineColor="rgba(212,175,55,0.07)"
                particleSpeed={0.3}
                lineDistance={120}
            />

            {/* Radial vignette */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)',
                zIndex: 1,
            }} />

            {/* Content */}
            <div style={{
                position: 'relative', zIndex: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                opacity: phase === 'in' ? 0 : 1,
                transform: phase === 'in' ? 'translateY(18px) scale(0.97)' : 'translateY(0) scale(1)',
                transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)',
            }}>
                {/* Icon mark */}
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04))',
                    border: '1px solid rgba(212,175,55,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem',
                    boxShadow: '0 0 32px rgba(212,175,55,0.2)',
                    animation: phase === 'hold' ? 'goldGlow 2.5s ease-in-out infinite' : 'none',
                }}>◈</div>

                {/* Headline */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
                        fontWeight: 700,
                        color: '#EAEAEA',
                        fontFamily: 'Poppins, Inter, sans-serif',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.15,
                        margin: 0,
                    }}>
                        Start Your{' '}
                        <span style={{
                            color: '#D4AF37',
                            textShadow: '0 0 24px rgba(212,175,55,0.5)',
                        }}>
                            Journey
                        </span>
                    </h1>
                    <p style={{
                        marginTop: '10px',
                        color: '#555',
                        fontSize: '0.9rem',
                        letterSpacing: '0.04em',
                    }}>
                        Preparing your experience
                        <AnimatedDots />
                    </p>
                </div>

                {/* Progress bar */}
                <ProgressBar duration={duration} active={phase !== 'in'} />
            </div>
        </div>
    );
};

/* ── Animated "..." dots ─────────────────────────────────────── */
const AnimatedDots: React.FC = () => {
    const [dots, setDots] = useState('');
    useEffect(() => {
        const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 420);
        return () => clearInterval(id);
    }, []);
    return <span style={{ display: 'inline-block', width: '18px', textAlign: 'left' }}>{dots}</span>;
};

/* ── Thin gold progress bar ──────────────────────────────────── */
const ProgressBar: React.FC<{ duration: number; active: boolean }> = ({ duration, active }) => (
    <div style={{
        width: '160px', height: '2px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '999px', overflow: 'hidden',
    }}>
        <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #D4AF37, #FFD700)',
            borderRadius: '999px',
            width: active ? '100%' : '0%',
            transition: active ? `width ${duration}ms cubic-bezier(0.4,0,0.2,1)` : 'none',
            boxShadow: '0 0 8px rgba(212,175,55,0.6)',
        }} />
    </div>
);

export default IntroScreen;
