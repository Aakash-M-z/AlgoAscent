import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Flame, BarChart3, Target, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '../types';
import { calcXP, getLevelInfo } from './XPSystem';

/* ── Animated counter ────────────────────────────────────────── */
function useCountUp(target: number, duration = 900) {
    const [value, setValue] = useState(0);
    const raf = useRef<number>(0);
    useEffect(() => {
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration]);
    return value;
}

/* ── Animated progress bar ───────────────────────────────────── */
const Bar: React.FC<{ pct: number; color: string; gradient?: string; delay?: number; glow?: boolean }> = ({ pct, color, gradient, delay = 0, glow }) => {
    const [w, setW] = useState(0);
    useEffect(() => { const t = setTimeout(() => setW(pct), 120 + delay); return () => clearTimeout(t); }, [pct, delay]);
    return (
        <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{
                height: '100%', width: `${w}%`, borderRadius: '999px',
                background: gradient ?? color,
                transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: glow ? `0 0 10px ${color}80` : `0 0 6px ${color}55`,
            }} />
        </div>
    );
};

/* ── XP Breakdown Modal ──────────────────────────────────────── */
const XPModal: React.FC<{ activities: Activity[]; onClose: () => void }> = ({ activities, onClose }) => {
    const { total, breakdown } = calcXP(activities);
    const { current, next, progressPct, xpToNext } = getLevelInfo(total);
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.88, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#111', border: `1px solid ${current.color}35`, borderRadius: '20px', padding: '28px', maxWidth: '380px', width: '90%', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><X size={16} /></button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '2.5rem' }}>{current.icon}</span>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: current.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Level {current.level}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#EAEAEA' }}>{current.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#555' }}>{total.toLocaleString()} XP total</div>
                    </div>
                </div>
                {next && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', color: '#555' }}>Progress to {next.icon} {next.title}</span>
                            <span style={{ fontSize: '0.72rem', color: current.color, fontWeight: 700 }}>{progressPct}%</span>
                        </div>
                        <Bar pct={progressPct} color={current.color} gradient={`linear-gradient(90deg, ${current.color}, #22c55e)`} glow />
                        <div style={{ fontSize: '0.68rem', color: '#444', marginTop: '5px' }}>{xpToNext.toLocaleString()} XP to {next.title}</div>
                    </div>
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>XP Breakdown</div>
                    {breakdown.length === 0
                        ? <div style={{ fontSize: '0.82rem', color: '#444' }}>Solve problems to earn XP</div>
                        : breakdown.map((b, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ fontSize: '0.82rem', color: '#BDBDBD' }}>{b.label}{b.count > 0 ? ` ×${b.count}` : ''}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D4AF37' }}>+{b.xp.toLocaleString()}</span>
                            </div>
                        ))
                    }
                </div>
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', fontSize: '0.72rem', color: '#666', lineHeight: 1.5 }}>
                    💡 Earn XP by solving problems and maintaining streaks
                </div>
            </motion.div>
        </motion.div>
    );
};

/* ── Single stat card ────────────────────────────────────────── */
interface CardProps {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    displayValue: React.ReactNode;
    sub: string;
    pct: number;
    barColor: string;
    barGradient?: string;
    barDelay?: number;
    badge?: string;
    badgeColor?: string;
    onClick?: () => void;
    tooltip?: string;
    footer?: string;
    accentGlow?: boolean;
}

const StatCard: React.FC<CardProps> = ({
    icon, iconBg, iconColor, label, displayValue, sub,
    pct, barColor, barGradient, barDelay, badge, badgeColor,
    onClick, tooltip, footer, accentGlow,
}) => {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.015 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            title={tooltip}
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'linear-gradient(145deg, #131313 0%, #0f0f0f 100%)',
                border: `1px solid ${hovered ? barColor + '55' : 'rgba(212,175,55,0.18)'}`,
                borderRadius: '16px', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: '14px',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative', overflow: 'hidden',
                boxShadow: hovered
                    ? `0 16px 48px rgba(0,0,0,0.7), 0 0 24px ${barColor}18`
                    : accentGlow ? `0 0 20px ${barColor}12` : 'none',
                transition: 'border-color 0.25s, box-shadow 0.25s',
            }}
        >
            {/* Top shimmer */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${barColor}55, transparent)` }} />
            {/* Corner glow on hover */}
            {hovered && <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: `radial-gradient(circle, ${barColor}12 0%, transparent 70%)`, pointerEvents: 'none' }} />}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: iconBg, border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: iconColor, display: 'flex' }}>{icon}</span>
                </div>
                {badge && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: `${badgeColor}18`, border: `1px solid ${badgeColor}35`, color: badgeColor, letterSpacing: '0.04em' }}>{badge}</span>
                )}
            </div>

            {/* Value */}
            <div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: barColor, fontFamily: 'Poppins, Inter, sans-serif', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {displayValue}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EAEAEA', marginTop: '5px' }}>{label}</div>
                <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '2px' }}>{sub}</div>
            </div>

            {/* Progress bar */}
            <Bar pct={pct} color={barColor} gradient={barGradient} delay={barDelay} />

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '-8px' }}>
                <span style={{ fontSize: '0.68rem', color: '#444' }}>{footer ?? '0'}</span>
                <span style={{ fontSize: '0.68rem', color: barColor, fontWeight: 600 }}>{pct}%</span>
            </div>
        </motion.div>
    );
};

/* ── Main 5-card grid ────────────────────────────────────────── */
const StatsCards: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    const [xpModal, setXpModal] = useState(false);

    // Problems solved
    const totalSolved = activities.filter(a => a.problemSolved).length;
    const totalProblems = activities.length;

    // Streak
    const streak = (() => {
        const days = new Set(activities.map(a => a.date.slice(0, 10)));
        let count = 0;
        const d = new Date();
        while (days.has(d.toISOString().slice(0, 10))) { count++; d.setDate(d.getDate() - 1); }
        return count;
    })();

    // Weekly
    const now = Date.now(), DAY = 86_400_000;
    const thisWeek = activities.filter(a => now - new Date(a.date).getTime() < 7 * DAY).length;
    const lastWeek = activities.filter(a => { const age = now - new Date(a.date).getTime(); return age >= 7 * DAY && age < 14 * DAY; }).length;
    const weeklyGoal = Math.max(lastWeek * 1.1, 7);
    const weeklyPct = Math.min(Math.round((thisWeek / weeklyGoal) * 100), 100);

    // Accuracy
    const accuracy = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

    // XP
    const { total: xpTotal, breakdown } = calcXP(activities);
    const { current: lvl, next: nextLvl, progressPct: xpPct, xpToNext } = getLevelInfo(xpTotal);

    // Animated counters
    const animSolved = useCountUp(totalSolved);
    const animStreak = useCountUp(streak);
    const animWeekly = useCountUp(thisWeek);
    const animAccuracy = useCountUp(accuracy);
    const animXP = useCountUp(xpTotal);

    const accColor = accuracy >= 70 ? '#22c55e' : accuracy >= 40 ? '#f59e0b' : '#ef4444';

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}
                className="stats-grid">
                <StatCard
                    icon={<CheckCircle2 size={20} strokeWidth={2} />}
                    iconBg="rgba(212,175,55,0.1)" iconColor="#D4AF37"
                    label="Problems Solved" displayValue={animSolved}
                    sub={`${totalProblems} total logged`}
                    pct={totalProblems > 0 ? Math.min(Math.round((totalSolved / totalProblems) * 100), 100) : 0}
                    barColor="#D4AF37" barDelay={0}
                    badge={totalSolved >= 100 ? '100+ Club' : totalSolved >= 50 ? '50+ Club' : undefined}
                    badgeColor="#D4AF37"
                    tooltip="Total problems you've successfully solved"
                />
                <StatCard
                    icon={<Flame size={20} strokeWidth={2} />}
                    iconBg="rgba(245,158,11,0.1)" iconColor="#f59e0b"
                    label="Daily Streak" displayValue={animStreak}
                    sub={streak > 0 ? 'Keep it going!' : 'Start your streak today'}
                    pct={Math.min(streak * 10, 100)}
                    barColor="#f59e0b" barDelay={100}
                    badge={streak >= 7 ? `${streak}d 🔥` : undefined} badgeColor="#f59e0b"
                    tooltip="Consecutive days with at least one session"
                />
                <StatCard
                    icon={<BarChart3 size={20} strokeWidth={2} />}
                    iconBg="rgba(129,140,248,0.1)" iconColor="#818cf8"
                    label="Weekly Progress" displayValue={animWeekly}
                    sub={`Goal: ${Math.ceil(weeklyGoal)} sessions`}
                    pct={weeklyPct}
                    barColor="#818cf8" barDelay={200}
                    badge={weeklyPct >= 100 ? 'Goal Hit ✓' : undefined} badgeColor="#818cf8"
                    tooltip="Sessions this week vs your personal goal"
                />
                <StatCard
                    icon={<Target size={20} strokeWidth={2} />}
                    iconBg={`${accColor}18`} iconColor={accColor}
                    label="Accuracy" displayValue={`${animAccuracy}%`}
                    sub={`${totalSolved} solved / ${totalProblems} attempted`}
                    pct={accuracy} barColor={accColor} barDelay={300}
                    badge={accuracy >= 80 ? 'Elite' : accuracy >= 60 ? 'Good' : undefined}
                    badgeColor={accuracy >= 80 ? '#22c55e' : '#f59e0b'}
                    tooltip="Percentage of attempted problems you solved"
                />
                {/* XP Card */}
                <StatCard
                    icon={<span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{lvl.icon}</span>}
                    iconBg={`${lvl.color}15`} iconColor={lvl.color}
                    label="XP & Level"
                    displayValue={
                        <span style={{ color: lvl.color }}>
                            {animXP.toLocaleString()}
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555', marginLeft: '4px' }}>XP</span>
                        </span>
                    }
                    sub={`${lvl.title} · Lv.${lvl.level}${nextLvl ? ` · ${xpToNext.toLocaleString()} to ${nextLvl.title}` : ' · Max Level'}`}
                    pct={xpPct}
                    barColor={lvl.color}
                    barGradient={`linear-gradient(90deg, ${lvl.color}, #22c55e)`}
                    barDelay={400}
                    badge={lvl.level >= 5 ? `${lvl.icon} ${lvl.title}` : undefined}
                    badgeColor={lvl.color}
                    onClick={() => setXpModal(true)}
                    tooltip="Earn XP by solving problems and maintaining streaks"
                    footer={`${xpTotal.toLocaleString()} / ${nextLvl ? nextLvl.minXP.toLocaleString() : '∞'}`}
                    accentGlow
                />
            </div>

            {/* Responsive: collapse to 2-col on small screens */}
            <style>{`
                @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(3, 1fr) !important; } }
                @media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(2, 1fr) !important; } }
            `}</style>

            <AnimatePresence>
                {xpModal && <XPModal activities={activities} onClose={() => setXpModal(false)} />}
            </AnimatePresence>
        </>
    );
};

export default StatsCards;
