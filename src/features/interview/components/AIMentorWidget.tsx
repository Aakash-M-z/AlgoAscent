import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { SessionManager } from '../../../utils/sessionManager';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use(config => {
    const token = SessionManager.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

interface MentorData {
    weakTopics: { topic: string; avgScore: number; sessions: number; trend: string }[];
    strongTopics: { topic: string; avgScore: number; sessions: number; trend: string }[];
    readinessScore: number;
    readinessTrend: number;
    dailyPlan: {
        date: string;
        focusTopic: string;
        problems: { title: string; difficulty: string; platform: string; url: string; why: string }[];
        xpReward: number;
        estimatedTime: string;
    };
    insights: { type: 'danger' | 'success' | 'info'; text: string }[];
    isFallback: boolean;
}

// ── Readiness Score Gauge ────────────────────────────────────
const ReadinessGauge: React.FC<{ score: number; trend: number }> = ({ score, trend }) => {
    const [animated, setAnimated] = useState(0);

    useEffect(() => {
        setTimeout(() => {
            let start = 0;
            const step = () => {
                start = Math.min(start + 2, score);
                setAnimated(start);
                if (start < score) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, 400);
    }, [score]);

    const getReadinessLabel = (s: number) => {
        if (s >= 85) return { label: 'FAANG Ready', color: 'text-emerald-400' };
        if (s >= 70) return { label: 'Interview Ready', color: 'text-green-400' };
        if (s >= 55) return { label: 'Getting There', color: 'text-yellow-400' };
        if (s >= 40) return { label: 'Needs Work', color: 'text-orange-400' };
        return { label: 'Early Stage', color: 'text-red-400' };
    };

    const { label, color } = getReadinessLabel(animated);
    const radius = 52;
    const circ = 2 * Math.PI * radius;
    const dash = (animated / 100) * circ;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32">
                <svg viewBox="0 0 120 120" width="128" height="128" className="transform -rotate-90">
                    <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                    <motion.circle
                        cx="60" cy="60" r={radius}
                        fill="none"
                        stroke={animated >= 70 ? '#10B981' : animated >= 50 ? '#D4AF37' : '#EF4444'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ - dash }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                        style={{ filter: `drop-shadow(0 0 12px ${animated >= 70 ? '#10B98160' : '#D4AF3760'})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white">{animated}</span>
                    <span className="text-xs text-white/30 font-bold">/ 100</span>
                </div>
            </div>
            <span className={`text-xs font-black uppercase tracking-widest ${color}`}>{label}</span>
            {trend !== 0 && (
                <span className={`text-[10px] font-bold ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% this week
                </span>
            )}
        </div>
    );
};

// ── Insight Card ─────────────────────────────────────────────
const InsightCard: React.FC<{ type: 'danger' | 'success' | 'info'; text: string; delay: number }> = ({ type, text, delay }) => {
    const cfgs = {
        danger: { icon: '🔥', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
        success: { icon: '✅', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
        info:    { icon: '💡', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' }
    };
    const c = cfgs[type];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className={`flex items-start gap-3 p-4 rounded-xl border ${c.border} ${c.bg} group hover:brightness-110 transition-all`}
        >
            <span className="text-lg flex-shrink-0">{c.icon}</span>
            <p className={`text-xs leading-relaxed font-medium ${c.color}`}>{text}</p>
        </motion.div>
    );
};

// ── Main Mentor Widget ───────────────────────────────────────
const AIMentorWidget: React.FC = () => {
    const [data, setData] = useState<MentorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'overview' | 'plan' | 'topics'>('overview');

    useEffect(() => {
        api.get('/mentor/insights')
            .then(res => setData(res.data))
            .catch(() => {/* silently fail */})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="card-dark p-8 border border-white/5 flex flex-col gap-4">
                <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-white/5" />
                    <div className="flex-1 h-4 bg-white/5 rounded" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { weakTopics, strongTopics, readinessScore, readinessTrend, dailyPlan, insights, isFallback } = data;

    const DIFF_COLORS: Record<string, string> = {
        Easy:   'text-emerald-400 bg-emerald-500/10',
        Medium: 'text-yellow-400 bg-yellow-500/10',
        Hard:   'text-red-400 bg-red-500/10'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-dark border border-white/5 overflow-hidden"
        >
            {/* Header */}
            <div className="px-8 pt-8 pb-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center text-sm">
                            🧠
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-white/80">AI Mentor</h2>
                            <p className="text-[10px] text-white/25 font-bold">Personalized Intelligence Engine</p>
                        </div>
                    </div>
                    {isFallback && (
                        <span className="text-[9px] bg-white/5 px-2 py-1 rounded font-bold text-white/20 uppercase tracking-widest">Demo Mode</span>
                    )}
                </div>

                {/* Sub Tabs */}
                <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
                    {(['overview', 'plan', 'topics'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                                tab === t
                                    ? 'bg-white/10 text-white shadow'
                                    : 'text-white/30 hover:text-white/60'
                            }`}
                        >
                            {t === 'overview' ? '📊 Overview' : t === 'plan' ? '📅 Daily Plan' : '📚 Topics'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-8">
                <AnimatePresence mode="wait">
                    {/* ── Overview Tab ─────────────────────────────── */}
                    {tab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Row: Readiness + Insights */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-4">Interview Readiness</div>
                                    <ReadinessGauge score={readinessScore} trend={readinessTrend} />
                                </div>
                                <div className="lg:col-span-2 space-y-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-4">Intelligence Insights</div>
                                    {insights.map((ins, i) => (
                                        <InsightCard key={i} type={ins.type} text={ins.text} delay={i * 0.1} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Daily Plan Tab ───────────────────────────── */}
                    {tab === 'plan' && (
                        <motion.div
                            key="plan"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">Today's Focus</div>
                                    <h3 className="text-xl font-black text-white">{dailyPlan.focusTopic}</h3>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-xs text-white/30">⏱ {dailyPlan.estimatedTime}</span>
                                        <span className="text-xs text-gold font-bold">+{dailyPlan.xpReward} XP on completion</span>
                                    </div>
                                </div>
                                <div className="text-right text-[10px] text-white/20 font-bold uppercase">{dailyPlan.date}</div>
                            </div>

                            <div className="space-y-3">
                                {dailyPlan.problems.map((p, i) => (
                                    <motion.a
                                        key={i}
                                        href={p.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.04] transition-all group"
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-black text-white/40">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-white group-hover:text-gold transition-colors">{p.title}</div>
                                            <div className="text-xs text-white/30 mt-0.5">{p.why}</div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wide ${DIFF_COLORS[p.difficulty] || 'text-white/40'}`}>
                                                {p.difficulty}
                                            </span>
                                            <span className="text-[10px] text-white/20 font-bold">{p.platform}</span>
                                            <span className="text-white/20 group-hover:text-white/60 transition-colors text-xs">↗</span>
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── Topics Tab ──────────────────────────────── */}
                    {tab === 'topics' && (
                        <motion.div
                            key="topics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {weakTopics.length > 0 && (
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-red-400/60 mb-4 flex items-center gap-2">
                                        <span className="w-8 h-[1px] bg-red-500/30" /> Needs Attention
                                    </div>
                                    <div className="space-y-3">
                                        {weakTopics.map((t, i) => (
                                            <motion.div
                                                key={t.topic}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="space-y-2 p-4 rounded-xl bg-red-500/[0.03] border border-red-500/10"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-white/80">{t.topic}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-white/30 font-bold">{t.sessions} sessions</span>
                                                        <span className="text-xs font-black text-red-400 font-mono">{t.avgScore}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-red-500/60 rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${t.avgScore}%` }}
                                                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {strongTopics.length > 0 && (
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-4 flex items-center gap-2">
                                        <span className="w-8 h-[1px] bg-emerald-500/30" /> Your Strengths
                                    </div>
                                    <div className="space-y-3">
                                        {strongTopics.map((t, i) => (
                                            <motion.div
                                                key={t.topic}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="space-y-2 p-4 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-bold text-white/80">{t.topic}</span>
                                                    <span className="text-xs font-black text-emerald-400 font-mono">{t.avgScore}%</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-emerald-500/60 rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${t.avgScore}%` }}
                                                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {weakTopics.length === 0 && strongTopics.length === 0 && (
                                <div className="text-center py-12 text-white/20 text-sm">
                                    Complete at least one interview to see topic analysis.
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default AIMentorWidget;
