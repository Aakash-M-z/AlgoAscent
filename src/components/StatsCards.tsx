import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Flame, BarChart3, Target } from 'lucide-react';
import { Activity } from '../types';

interface StatsCardsProps {
    activities: Activity[];
}

/* ── Animated number counter ─────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
    const [value, setValue] = useState(0);
    const raf = useRef<number>(0);
    useEffect(() => {
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(eased * target));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration]);
    return value;
}

/* ── Animated progress bar ───────────────────────────────────── */
const ProgressBar: React.FC<{ pct: number; color: string; delay?: number }> = ({ pct, color, delay = 0 }) => {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setWidth(pct), 120 + delay);
        return () => clearTimeout(t);
    }, [pct, delay]);
    return (
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
                height: '100%',
                width: `${width}%`,
                background: color,
                borderRadius: '999px',
                transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: `0 0 8px ${color}66`,
            }} />
        </div>
    );
};

/* ── Single card ─────────────────────────────────────────────── */
interface CardProps {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    value: number | string;
    animatedValue?: number;
    sub: string;
    pct: number;
    barColor: string;
    barDelay?: number;
    badge?: string;
    badgeColor?: string;
}

const StatCard: React.FC<CardProps> = ({
    icon, iconBg, iconColor, label, animatedValue, value, sub,
    pct, barColor, barDelay, badge, badgeColor,
}) => {
    const displayed = animatedValue !== undefined ? animatedValue : value;
    return (
        <div
            style={{
                background: 'linear-gradient(145deg, #131313 0%, #0f0f0f 100%)',
                border: '1px solid rgba(212,175,55,0.18)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                cursor: 'default',
                transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease, border-color 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-4px) scale(1.015)';
                el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.7), 0 0 24px rgba(212,175,55,0.1)';
                el.style.borderColor = 'rgba(212,175,55,0.38)';
            }}
            onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0) scale(1)';
                el.style.boxShadow = 'none';
                el.style.borderColor = 'rgba(212,175,55,0.18)';
            }}
        >
            {/* Top-edge shimmer */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                background: `linear-gradient(90deg, transparent, ${barColor}55, transparent)`,
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '11px',
                    background: iconBg, border: `1px solid ${iconColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <span style={{ color: iconColor, display: 'flex' }}>{icon}</span>
                </div>
                {badge && (
                    <span style={{
                        fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px',
                        borderRadius: '999px', background: `${badgeColor}18`,
                        border: `1px solid ${badgeColor}35`, color: badgeColor,
                        letterSpacing: '0.04em',
                    }}>{badge}</span>
                )}
            </div>

            {/* Value */}
            <div>
                <div style={{
                    fontSize: '2rem', fontWeight: 800, color: barColor,
                    fontFamily: 'Poppins, Inter, sans-serif', lineHeight: 1,
                    letterSpacing: '-0.02em',
                }}>
                    {displayed}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EAEAEA', marginTop: '5px' }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '2px' }}>{sub}</div>
            </div>

            {/* Progress bar */}
            <ProgressBar pct={pct} color={barColor} delay={barDelay} />

            {/* Pct label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-8px' }}>
                <span style={{ fontSize: '0.68rem', color: '#444' }}>0</span>
                <span style={{ fontSize: '0.68rem', color: barColor, fontWeight: 600 }}>{pct}%</span>
            </div>
        </div>
    );
};

/* ── Main component ──────────────────────────────────────────── */
const StatsCards: React.FC<StatsCardsProps> = ({ activities }) => {
    const totalSolved = activities.filter(a => a.problemSolved).length;
    const totalProblems = activities.length;

    // Daily streak
    const streak = (() => {
        const days = new Set(activities.map(a => a.date.slice(0, 10)));
        let count = 0;
        const d = new Date();
        while (days.has(d.toISOString().slice(0, 10))) {
            count++;
            d.setDate(d.getDate() - 1);
        }
        return count;
    })();

    // Weekly progress — sessions in last 7 days vs prior 7
    const now = Date.now();
    const DAY = 86_400_000;
    const thisWeek = activities.filter(a => now - new Date(a.date).getTime() < 7 * DAY).length;
    const lastWeek = activities.filter(a => {
        const age = now - new Date(a.date).getTime();
        return age >= 7 * DAY && age < 14 * DAY;
    }).length;
    const weeklyGoal = Math.max(lastWeek * 1.1, 7); // 10% growth target, min 7
    const weeklyPct = Math.min(Math.round((thisWeek / weeklyGoal) * 100), 100);

    // Accuracy
    const accuracy = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

    // Animated counters
    const animSolved = useCountUp(totalSolved);
    const animStreak = useCountUp(streak);
    const animWeekly = useCountUp(thisWeek);
    const animAccuracy = useCountUp(accuracy);

    const cards: CardProps[] = [
        {
            icon: <CheckCircle2 size={20} strokeWidth={2} />,
            iconBg: 'rgba(212,175,55,0.1)',
            iconColor: '#D4AF37',
            label: 'Problems Solved',
            value: totalSolved,
            animatedValue: animSolved,
            sub: `${totalProblems} total logged`,
            pct: totalProblems > 0 ? Math.min(Math.round((totalSolved / totalProblems) * 100), 100) : 0,
            barColor: '#D4AF37',
            barDelay: 0,
            badge: totalSolved >= 100 ? '100+ Club' : totalSolved >= 50 ? '50+ Club' : undefined,
            badgeColor: '#D4AF37',
        },
        {
            icon: <Flame size={20} strokeWidth={2} />,
            iconBg: 'rgba(245,158,11,0.1)',
            iconColor: '#f59e0b',
            label: 'Daily Streak',
            value: streak,
            animatedValue: animStreak,
            sub: streak > 0 ? 'Keep it going!' : 'Start your streak today',
            pct: Math.min(streak * 10, 100), // 10 days = 100%
            barColor: '#f59e0b',
            barDelay: 100,
            badge: streak >= 7 ? `${streak}d 🔥` : undefined,
            badgeColor: '#f59e0b',
        },
        {
            icon: <BarChart3 size={20} strokeWidth={2} />,
            iconBg: 'rgba(129,140,248,0.1)',
            iconColor: '#818cf8',
            label: 'Weekly Progress',
            value: thisWeek,
            animatedValue: animWeekly,
            sub: `Goal: ${Math.ceil(weeklyGoal)} sessions`,
            pct: weeklyPct,
            barColor: '#818cf8',
            barDelay: 200,
            badge: weeklyPct >= 100 ? 'Goal Hit ✓' : undefined,
            badgeColor: '#818cf8',
        },
        {
            icon: <Target size={20} strokeWidth={2} />,
            iconBg: 'rgba(34,197,94,0.1)',
            iconColor: '#22c55e',
            label: 'Accuracy',
            value: `${accuracy}%`,
            animatedValue: animAccuracy,
            sub: `${totalSolved} solved / ${totalProblems} attempted`,
            pct: accuracy,
            barColor: accuracy >= 70 ? '#22c55e' : accuracy >= 40 ? '#f59e0b' : '#ef4444',
            barDelay: 300,
            badge: accuracy >= 80 ? 'Elite' : accuracy >= 60 ? 'Good' : undefined,
            badgeColor: accuracy >= 80 ? '#22c55e' : '#f59e0b',
        },
    ];

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
        }}>
            {cards.map((card, i) => (
                <StatCard key={i} {...card} />
            ))}
        </div>
    );
};

export default StatsCards;
