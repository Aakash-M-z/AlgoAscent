import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, ChevronRight, Lock, X } from 'lucide-react';
import { Activity } from '../types';

interface Props { activities: Activity[]; isDemo?: boolean; }
interface Insight { icon: React.ReactNode; text: string; color: string; bg: string; premium?: boolean; }

/* ── Compute topic stats from real activity data ─────────────── */
function computeTopicStats(activities: Activity[]) {
    const map = new Map<string, { solved: number; total: number }>();
    activities.forEach(a => {
        const t = a.category || 'General';
        const cur = map.get(t) ?? { solved: 0, total: 0 };
        cur.total++;
        if (a.problemSolved) cur.solved++;
        map.set(t, cur);
    });
    // Sort by solve rate ascending (weakest first)
    return [...map.entries()]
        .filter(([, v]) => v.total >= 2)
        .map(([topic, v]) => ({ topic, rate: v.total ? Math.round((v.solved / v.total) * 100) : 0, solved: v.solved, total: v.total }))
        .sort((a, b) => a.rate - b.rate);
}

const AIInsightCard: React.FC<Props> = ({ activities, isDemo = false }) => {
    const [premiumModal, setPremiumModal] = useState(false);

    const insights = useMemo((): Insight[] => {
        const now = Date.now();
        const solved = activities.filter(a => a.problemSolved).length;
        const total = activities.length;
        const rate = total ? Math.round((solved / total) * 100) : 0;
        const hours = Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60);
        const hard = activities.filter(a => a.difficulty === 'Hard' && a.problemSolved).length;

        const week7 = activities.filter(a => now - new Date(a.date).getTime() < 7 * 86_400_000).length;
        const week14 = activities.filter(a => { const age = now - new Date(a.date).getTime(); return age >= 7 * 86_400_000 && age < 14 * 86_400_000; }).length;

        const topicStats = computeTopicStats(activities);
        const weakest = topicStats[0];
        const strongest = topicStats[topicStats.length - 1];

        const list: Insight[] = [];

        // Insight 1 — Personalized solve rate + weak topic
        if (total === 0) {
            list.push({ icon: <Lightbulb size={13} />, text: 'Log your first problem to unlock personalized AI coaching insights.', color: '#D4AF37', bg: 'rgba(212,175,55,0.08)' });
        } else if (weakest) {
            const icon = rate >= 65 ? <TrendingUp size={13} /> : <AlertTriangle size={13} />;
            const color = rate >= 65 ? '#22c55e' : rate >= 40 ? '#f59e0b' : '#ef4444';
            list.push({
                icon, color, bg: `${color}14`,
                text: `${rate}% solve rate overall. Your weakest topic is ${weakest.topic} (${weakest.rate}% — ${weakest.solved}/${weakest.total} solved). Focus here first.`,
            });
        } else {
            const color = rate >= 65 ? '#22c55e' : rate >= 40 ? '#f59e0b' : '#ef4444';
            list.push({ icon: <TrendingUp size={13} />, color, bg: `${color}14`, text: `${rate}% solve rate across ${total} sessions. Keep building consistency.` });
        }

        // Insight 2 — Week-over-week momentum with real numbers
        if (week7 > week14 && week7 > 0) {
            list.push({
                icon: <TrendingUp size={13} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)',
                text: `You're accelerating — ${week7} sessions this week vs ${week14} last week (+${week7 - week14}). Momentum is building. 📈`,
            });
        } else if (week14 > week7 && week14 > 0) {
            list.push({
                icon: <AlertTriangle size={13} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',
                text: `Activity dipped — ${week7} sessions this week vs ${week14} last week. A 20-min session today will reset the trend.`,
            });
        } else if (hours >= 10) {
            list.push({
                icon: <Brain size={13} />, color: '#D4AF37', bg: 'rgba(212,175,55,0.08)',
                text: `${hours}h invested total. ${hard >= 3 ? `${hard} Hard problems cracked — interview-ready territory.` : 'Try a Hard problem this week to level up your thinking.'}`,
            });
        } else {
            list.push({
                icon: <Lightbulb size={13} />, color: '#818cf8', bg: 'rgba(129,140,248,0.08)',
                text: `${hours}h logged so far. Target 30 min daily — consistency compounds faster than long sessions.`,
            });
        }

        // Insight 3 — PREMIUM: Deep pattern analysis
        const premiumText = strongest && weakest && strongest.topic !== weakest.topic
            ? `You're strong in ${strongest.topic} (${strongest.rate}% rate) but struggling in ${weakest.topic}. Solving 3 more ${weakest.topic} problems this week would close the gap before interviews.`
            : `Deep pattern analysis: your problem-solving velocity and topic coverage suggest you're ready for ${hard >= 5 ? 'system design rounds' : 'Medium-Hard problems'}. Unlock full AI coaching to get a personalized study plan.`;

        list.push({
            icon: <Brain size={13} />, color: '#D4AF37', bg: 'rgba(212,175,55,0.06)',
            text: premiumText,
            premium: true,
        });

        return list.slice(0, 3);
    }, [activities]);

    return (
        <>
            <motion.div
                className="card-dark"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ padding: '18px 22px', borderColor: 'rgba(212,175,55,0.25)', position: 'relative', overflow: 'hidden' }}
            >
                {/* Ambient glow */}
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Brain size={14} color="#D4AF37" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div className="card-title" style={{ lineHeight: 1 }}>AI Coaching Insights</div>
                        {isDemo && <div style={{ fontSize: '0.62rem', color: '#444', marginTop: '2px' }}>Demo data — log activities to see your real insights</div>}
                    </div>
                    <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em' }}>LIVE</span>
                </div>

                {/* Insights */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                    {insights.map((ins, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 + i * 0.08, duration: 0.3 }}
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 12px', borderRadius: '9px', background: ins.bg, border: `1px solid ${ins.color}20`, filter: ins.premium ? 'blur(3.5px)' : 'none', userSelect: ins.premium ? 'none' : 'auto', pointerEvents: ins.premium ? 'none' : 'auto' }}>
                                <span style={{ color: ins.color, flexShrink: 0, marginTop: '1px' }}>{ins.icon}</span>
                                <p style={{ fontSize: '0.82rem', color: '#BDBDBD', margin: 0, lineHeight: 1.55, flex: 1 }}>{ins.text}</p>
                                <ChevronRight size={12} color={ins.color} style={{ flexShrink: 0, marginTop: '2px', opacity: 0.5 }} />
                            </div>
                            {/* Premium lock overlay */}
                            {ins.premium && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    onClick={() => setPremiumModal(true)}
                                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', borderRadius: '9px', background: 'rgba(8,8,8,0.55)', backdropFilter: 'blur(1px)' }}
                                >
                                    <Lock size={13} color="#D4AF37" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D4AF37' }}>Premium</span>
                                    <span style={{ fontSize: '0.68rem', color: '#555', padding: '1px 7px', borderRadius: '999px', border: '1px solid rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.06)' }}>Unlock →</span>
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Premium modal */}
            <AnimatePresence>
                {premiumModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPremiumModal(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            onClick={e => e.stopPropagation()}
                            style={{ background: '#111', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '18px', padding: '32px 28px', maxWidth: '380px', width: '90%', position: 'relative', textAlign: 'center' }}
                        >
                            <button onClick={() => setPremiumModal(false)} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><X size={16} /></button>
                            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>👑</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D4AF37', marginBottom: '8px' }}>Premium AI Coaching</div>
                            <div style={{ fontSize: '0.82rem', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
                                Unlock deep pattern analysis, personalized study plans, interview readiness scores, and weekly AI-generated roadmaps tailored to your weak areas.
                            </div>
                            <div style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', fontSize: '0.78rem', color: '#D4AF37', fontWeight: 600 }}>
                                🚀 Premium coming soon — stay tuned
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIInsightCard;
