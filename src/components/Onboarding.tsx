import React, { useState, useEffect } from 'react';

const STEPS = [
    {
        icon: '◈',
        title: 'Track Your Progress',
        desc: 'Log daily study sessions, problems solved, and topics covered. Every session builds your streak.',
        cta: 'Got it',
        highlight: 'overview',
    },
    {
        icon: '✓',
        title: 'Manage Your Tasks',
        desc: 'Create tasks with priorities and deadlines. Mark them complete to boost your productivity score.',
        cta: 'Next',
        highlight: 'tasks',
    },
    {
        icon: '🤖',
        title: 'AI-Powered Insights',
        desc: 'Ask your AI assistant anything — "What should I do next?" or "Analyze my productivity" for smart suggestions.',
        cta: "Let's go!",
        highlight: 'ai',
    },
];

const STORAGE_KEY = 'pt_onboarding_done';

interface Props {
    onComplete: () => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [exiting, setExiting] = useState(false);

    const next = () => {
        if (step < STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            setExiting(true);
            setTimeout(() => {
                localStorage.setItem(STORAGE_KEY, '1');
                onComplete();
            }, 400);
        }
    };

    const skip = () => {
        setExiting(true);
        setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, '1');
            onComplete();
        }, 300);
    };

    const current = STEPS[step];

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                opacity: exiting ? 0 : 1,
                transition: 'opacity 0.4s ease',
            }}
        >
            <div
                style={{
                    background: '#111',
                    border: '1px solid rgba(212,175,55,0.3)',
                    borderRadius: '20px',
                    padding: '40px 36px',
                    maxWidth: '420px',
                    width: '100%',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.08)',
                    animation: 'fadeIn 0.4s ease',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Gold glow top */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '200px', height: '1px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />

                {/* Step indicator */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '32px' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            height: '3px',
                            width: i === step ? '24px' : '8px',
                            borderRadius: '999px',
                            background: i <= step ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                            transition: 'all 0.3s ease',
                        }} />
                    ))}
                </div>

                {/* Icon */}
                <div style={{
                    width: '64px', height: '64px', borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                    border: '1px solid rgba(212,175,55,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.8rem', margin: '0 auto 24px',
                    boxShadow: '0 0 24px rgba(212,175,55,0.1)',
                }}>
                    {current.icon}
                </div>

                {/* Content */}
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#EAEAEA', textAlign: 'center', marginBottom: '12px', fontFamily: 'Poppins, Inter, sans-serif' }}>
                    {current.title}
                </h2>
                <p style={{ fontSize: '0.9rem', color: '#666', textAlign: 'center', lineHeight: 1.7, marginBottom: '32px' }}>
                    {current.desc}
                </p>

                {/* CTA */}
                <button
                    onClick={next}
                    style={{
                        width: '100%', padding: '13px',
                        background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                        border: 'none', borderRadius: '12px',
                        color: '#0B0B0B', fontWeight: 700, fontSize: '0.95rem',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                        transition: 'all 0.2s ease',
                        marginBottom: '12px',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(212,175,55,0.5)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(212,175,55,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                >
                    {current.cta}
                </button>

                <button
                    onClick={skip}
                    style={{
                        width: '100%', padding: '10px',
                        background: 'transparent', border: 'none',
                        color: '#444', fontSize: '0.8rem', cursor: 'pointer',
                        transition: 'color 0.2s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#888'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444'; }}
                >
                    Skip tour
                </button>
            </div>
        </div>
    );
};

export function shouldShowOnboarding(): boolean {
    return !localStorage.getItem(STORAGE_KEY);
}

export default Onboarding;
