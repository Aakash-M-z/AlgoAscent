import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, Cell,
    PieChart, Pie, Sector,
    Area, AreaChart,
} from 'recharts';
import { TrendingUp, Zap, Clock, BookOpen, Brain, ChevronRight, Award } from 'lucide-react';
import { Activity } from '../types';

interface Props { activities: Activity[]; }

/* ── Palette ─────────────────────────────────────────────────── */
const GOLD = '#D4AF37';
const GOLD2 = '#FFD700';
const EASY = '#22c55e';
const MEDIUM = '#f59e0b';
const HARD = '#ef4444';
const INDIGO = '#818cf8';
const TOPIC_COLORS = [
    '#D4AF37', '#818cf8', '#22c55e', '#38bdf8',
    '#f59e0b', '#a78bfa', '#ef4444', '#34d399',
    '#fb923c', '#60a5fa',
];

/* ── Demo data for empty state ───────────────────────────────── */
const DEMO_ACTIVITIES: Activity[] = (() => {
    const topics = ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'Linked Lists', 'Stacks'];
    const diffs: Activity['difficulty'][] = ['Easy', 'Medium', 'Hard'];
    const out: Activity[] = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86_400_000);
        if (Math.random() > 0.45) {
            const n = Math.floor(Math.random() * 3) + 1;
            for (let j = 0; j < n; j++) {
                out.push({
                    id: `demo-${i}-${j}`,
                    date: d.toISOString().slice(0, 10),
                    category: topics[Math.floor(Math.random() * topics.length)],
                    duration: 20 + Math.floor(Math.random() * 60),
                    description: 'Demo problem',
                    value: Math.floor(Math.random() * 4) + 1,
                    difficulty: diffs[Math.floor(Math.random() * 3)],
                    problemSolved: Math.random() > 0.3,
                });
            }
        }
    }
    return out;
})();

/* ── Animated counter hook ───────────────────────────────────── */
function useCounter(target: number, duration = 900, active = true) {
    const [val, setVal] = useState(0);
    const raf = useRef<number>(0);
    useEffect(() => {
        if (!active) return;
        const start = performance.now();
        const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(ease * target));
            if (p < 1) raf.current = requestAnimationFrame(tick);
        };
        raf.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf.current);
    }, [target, duration, active]);
    return val;
}

/* ── Tooltip style ───────────────────────────────────────────── */
const tooltipStyle = {
    contentStyle: {
        background: '#0f0f0f',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: '12px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.06)',
        fontSize: '0.8rem',
        color: '#EAEAEA',
        padding: '10px 14px',
    },
    labelStyle: { color: GOLD, fontWeight: 700, marginBottom: '4px', fontSize: '0.78rem' },
    itemStyle: { color: '#EAEAEA' },
    cursor: { stroke: 'rgba(212,175,55,0.12)', strokeWidth: 1 },
};

/* ── Active pie sector ───────────────────────────────────────── */
const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy - 12} textAnchor="middle" fill="#EAEAEA" fontSize={12} fontWeight={700}>{payload.name}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill={fill} fontSize={20} fontWeight={800} fontFamily="Poppins,Inter,sans-serif">{value}</text>
            <text x={cx} y={cy + 28} textAnchor="middle" fill="#666" fontSize={11}>{(percent * 100).toFixed(0)}%</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 7} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 11} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.35} />
        </g>
    );
};

/* ── Custom dot ──────────────────────────────────────────────── */
const GoldDot = (props: any) => {
    const { cx, cy, value } = props;
    if (!value) return null;
    return <circle cx={cx} cy={cy} r={4} fill={GOLD} stroke="#0B0B0B" strokeWidth={2} style={{ filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.7))' }} />;
};

/* ── Chart card ──────────────────────────────────────────────── */
const ChartCard: React.FC<{
    title: string; sub?: string; children: React.ReactNode;
    style?: React.CSSProperties; delay?: number;
}> = ({ title, sub, children, style, delay = 0 }) => (
    <motion.div
        className="card-dark"
        style={{ padding: '20px 24px', ...style }}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ boxShadow: '0 16px 56px rgba(0,0,0,0.7), 0 0 28px rgba(212,175,55,0.1)' }}
    >
        <div style={{ marginBottom: '18px' }}>
            <div className="card-title">{title}</div>
            {sub && <div className="kpi-sub" style={{ marginTop: '3px' }}>{sub}</div>}
        </div>
        {children}
    </motion.div>
);

/* ── KPI card with animated counter ─────────────────────────── */
const KpiCard: React.FC<{
    label: string; rawValue: number; display: string;
    color: string; sub: string; icon: React.ReactNode; index: number;
}> = ({ label, rawValue, display, color, sub, icon, index }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    const counted = useCounter(rawValue, 900, visible);
    const isPercent = display.endsWith('%');
    const isHours = display.endsWith('h');
    const shown = isPercent ? `${counted}%` : isHours ? `${counted}h` : String(counted);

    return (
        <motion.div
            ref={ref}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ y: -4, boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 20px ${color}20` }}
            style={{ cursor: 'default' }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </div>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
            </div>
            <div className="kpi-number" style={{ color, fontSize: '1.8rem', marginBottom: '4px' }}>{shown}</div>
            <div className="kpi-label" style={{ marginBottom: '2px' }}>{label}</div>
            <div className="kpi-sub">{sub}</div>
            {/* Bottom accent bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}60, transparent)`, borderRadius: '0 0 14px 14px' }} />
        </motion.div>
    );
};

/* ── AI Insight banner ───────────────────────────────────────── */
const InsightBanner: React.FC<{ activities: Activity[]; isDemo: boolean }> = ({ activities, isDemo }) => {
    const insights = useMemo(() => {
        const solved = activities.filter(a => a.problemSolved).length;
        const total = activities.length;
        const rate = total ? Math.round((solved / total) * 100) : 0;
        const hours = Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60);
        const hardCount = activities.filter(a => a.difficulty === 'Hard' && a.problemSolved).length;
        const medCount = activities.filter(a => a.difficulty === 'Medium' && a.problemSolved).length;
        const topics = new Set(activities.map(a => a.category)).size;
        const recentDays = new Set(
            activities.filter(a => Date.now() - new Date(a.date).getTime() < 7 * 86_400_000).map(a => a.date.slice(0, 10))
        ).size;

        const list: { icon: string; text: string; color: string }[] = [];

        if (rate >= 70) list.push({ icon: '🔥', text: `${rate}% solve rate — elite tier. You're in the top percentile.`, color: EASY });
        else if (rate >= 45) list.push({ icon: '📈', text: `${rate}% solve rate — solid progress. Push for 70%+ to unlock harder problems.`, color: MEDIUM });
        else list.push({ icon: '💡', text: `${rate}% solve rate — focus on Easy problems to build pattern recognition first.`, color: HARD });

        if (hours >= 30) list.push({ icon: '⏱', text: `${hours}h invested this period — exceptional dedication.`, color: GOLD });
        else if (hours >= 10) list.push({ icon: '⏱', text: `${hours}h logged — you're building momentum. Target 30h for a breakthrough.`, color: GOLD });
        else list.push({ icon: '⏱', text: `${hours}h logged — consistency beats intensity. Try 30 min daily.`, color: GOLD });

        if (hardCount >= 5) list.push({ icon: '💪', text: `${hardCount} Hard problems conquered — interview-ready territory.`, color: HARD });
        else if (medCount >= 10) list.push({ icon: '🎯', text: `${medCount} Medium problems solved — ready to attempt Hard challenges.`, color: MEDIUM });
        else list.push({ icon: '🎯', text: `Tackle a Hard problem this week to accelerate your growth curve.`, color: INDIGO });

        if (topics >= 5) list.push({ icon: '◎', text: `${topics} topics covered — great breadth. Now deepen your weakest areas.`, color: INDIGO });
        else list.push({ icon: '◎', text: `${topics} topic${topics === 1 ? '' : 's'} covered — diversify into Trees, Graphs, and DP next.`, color: INDIGO });

        if (recentDays >= 5) list.push({ icon: '🗓', text: `Active ${recentDays}/7 days this week — outstanding consistency.`, color: EASY });
        else if (recentDays >= 3) list.push({ icon: '🗓', text: `${recentDays} active days this week — aim for 5+ to build a strong streak.`, color: MEDIUM });

        return list.slice(0, 3);
    }, [activities]);

    return (
        <motion.div
            className="card-dark"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{ padding: '20px 24px', borderColor: 'rgba(212,175,55,0.28)', position: 'relative', overflow: 'hidden' }}
        >
            {/* Background glow */}
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={15} color={GOLD} />
                </div>
                <div>
                    <div className="card-title">AI Insight Summary</div>
                    {isDemo && <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '1px' }}>Showing demo data — log activities to see your real insights</div>}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {insights.map((ins, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1, duration: 0.35 }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: `${ins.color}08`, border: `1px solid ${ins.color}18` }}
                    >
                        <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1.4 }}>{ins.icon}</span>
                        <p style={{ fontSize: '0.84rem', color: '#BDBDBD', margin: 0, lineHeight: 1.6 }}>{ins.text}</p>
                        <ChevronRight size={13} color={ins.color} style={{ flexShrink: 0, marginTop: '3px', opacity: 0.6 }} />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

/* ── Custom bar label ────────────────────────────────────────── */
const BarLabel = (props: any) => {
    const { x, y, width, value, fill } = props;
    if (!value) return null;
    return (
        <text x={x + width / 2} y={y - 6} textAnchor="middle" fill={fill} fontSize={12} fontWeight={700}>
            {value}
        </text>
    );
};

/* ── Donut center label ──────────────────────────────────────── */
const DonutCenter: React.FC<{ total: number; label: string }> = ({ total, label }) => (
    <text>
        <tspan x="50%" y="47%" textAnchor="middle" fill="#EAEAEA" fontSize={20} fontWeight={800} fontFamily="Poppins,Inter,sans-serif">{total}</tspan>
        <tspan x="50%" y="57%" textAnchor="middle" fill="#555" fontSize={11}>{label}</tspan>
    </text>
);

/* ── Percentage label on pie slices ──────────────────────────── */
const PiePercentLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, index } = props;
    if (percent < 0.06) return null;
    const RADIAN = Math.PI / 180;
    const r = outerRadius + 18;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} textAnchor={x > cx ? 'start' : 'end'} fill={TOPIC_COLORS[index % TOPIC_COLORS.length]}
            fontSize={10} fontWeight={700}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

/* ── Main component ──────────────────────────────────────────── */
const AnalyticsDashboard: React.FC<Props> = ({ activities }) => {
    const [activePieIndex, setActivePieIndex] = useState(0);
    const [lineRange, setLineRange] = useState<'30' | '60' | '90'>('30');

    const isDemo = activities.length === 0;
    const data = isDemo ? DEMO_ACTIVITIES : activities;

    /* ── KPIs ── */
    const kpis = useMemo(() => {
        const solved = data.filter(a => a.problemSolved).length;
        const total = data.length;
        const rate = total ? Math.round((solved / total) * 100) : 0;
        const hours = Math.round(data.reduce((s, a) => s + a.duration, 0) / 60);
        const topics = new Set(data.map(a => a.category)).size;
        const now = Date.now();
        const week = data.filter(a => now - new Date(a.date).getTime() < 7 * 86_400_000).length;
        const streak = (() => {
            const days = new Set(data.map(a => a.date.slice(0, 10)));
            let s = 0;
            for (let i = 0; i < 365; i++) {
                const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
                if (days.has(d)) s++; else break;
            }
            return s;
        })();
        return [
            { label: 'Solve Rate', rawValue: rate, display: `${rate}%`, color: EASY, sub: `${solved} of ${total} solved`, icon: <TrendingUp size={15} color={EASY} /> },
            { label: 'Study Hours', rawValue: hours, display: `${hours}h`, color: GOLD, sub: 'total time invested', icon: <Clock size={15} color={GOLD} /> },
            { label: 'This Week', rawValue: week, display: String(week), color: INDIGO, sub: 'sessions (7 days)', icon: <Zap size={15} color={INDIGO} /> },
            { label: 'Topics', rawValue: topics, display: String(topics), color: '#38bdf8', sub: 'categories covered', icon: <BookOpen size={15} color="#38bdf8" /> },
            { label: 'Streak', rawValue: streak, display: String(streak), color: MEDIUM, sub: 'day streak', icon: <Award size={15} color={MEDIUM} /> },
        ];
    }, [data]);

    /* ── Line / Area chart data ── */
    const lineData = useMemo(() => {
        const days = parseInt(lineRange);
        const map: Record<string, { date: string; solved: number; attempted: number; cumulative: number }> = {};
        const cutoff = Date.now() - days * 86_400_000;
        data.filter(a => new Date(a.date).getTime() >= cutoff).forEach(a => {
            const d = a.date.slice(0, 10);
            if (!map[d]) map[d] = { date: d, solved: 0, attempted: 0, cumulative: 0 };
            if (a.problemSolved) map[d].solved++;
            else map[d].attempted++;
        });
        let cum = 0;
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(cutoff + (i + 1) * 86_400_000);
            const key = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            const s = map[key]?.solved ?? 0;
            cum += s;
            return { date: label, solved: s, attempted: map[key]?.attempted ?? 0, cumulative: cum };
        }).filter((_, i) => days === 30 ? true : days === 60 ? i % 2 === 0 : i % 3 === 0);
    }, [data, lineRange]);

    /* ── Bar chart ── */
    const barData = useMemo(() => {
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        data.forEach(a => { if (a.difficulty && a.problemSolved) counts[a.difficulty as keyof typeof counts]++; });
        const total = counts.Easy + counts.Medium + counts.Hard || 1;
        return [
            { name: 'Easy', count: counts.Easy, pct: Math.round(counts.Easy / total * 100), fill: EASY },
            { name: 'Medium', count: counts.Medium, pct: Math.round(counts.Medium / total * 100), fill: MEDIUM },
            { name: 'Hard', count: counts.Hard, pct: Math.round(counts.Hard / total * 100), fill: HARD },
        ];
    }, [data]);

    /* ── Pie chart ── */
    const pieData = useMemo(() => {
        const map: Record<string, number> = {};
        data.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
        return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8).map(([name, value]) => ({ name, value }));
    }, [data]);

    const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

    /* ── Weekly heatmap mini ── */
    const weeklyData = useMemo(() => {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const counts = new Array(7).fill(0);
        data.forEach(a => {
            const dow = (new Date(a.date).getDay() + 6) % 7; // Mon=0
            counts[dow]++;
        });
        const max = Math.max(...counts, 1);
        return days.map((d, i) => ({ day: d, count: counts[i], intensity: counts[i] / max }));
    }, [data]);

    return (
        <div className="animate-fadeIn section-gap">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                <h2 className="page-heading" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Analytics
                    {isDemo && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 10px', borderRadius: '999px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: GOLD, fontWeight: 700, letterSpacing: '0.08em' }}>
                            DEMO
                        </span>
                    )}
                </h2>
                <p className="page-subheading">{isDemo ? 'Sample data — log activities to see your real analytics' : 'Your productivity trends and insights'}</p>
            </motion.div>

            {/* AI Insight Banner */}
            <InsightBanner activities={data} isDemo={isDemo} />

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {kpis.map((k, i) => (
                    <KpiCard key={k.label} {...k} index={i} />
                ))}
            </div>

            {/* ── LINE / AREA CHART ── */}
            <ChartCard title="Problems Solved Over Time" sub="Daily solved vs attempted · gradient area shows cumulative progress" delay={0.1}>
                {/* Range toggle + chart type */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {(['30', '60', '90'] as const).map(r => (
                            <motion.button key={r} onClick={() => setLineRange(r)}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                style={{
                                    padding: '4px 13px', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 600,
                                    cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                    background: lineRange === r ? 'rgba(212,175,55,0.12)' : 'transparent',
                                    borderColor: lineRange === r ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)',
                                    color: lineRange === r ? GOLD : '#555',
                                }}>
                                {r}d
                            </motion.button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '14px' }}>
                        {[{ color: GOLD, label: 'Solved' }, { color: INDIGO, label: 'Attempted' }, { color: '#38bdf8', label: 'Cumulative' }].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '20px', height: '2px', background: l.color, borderRadius: '2px' }} />
                                <span style={{ fontSize: '0.68rem', color: '#666' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={lineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradSolved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={GOLD} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradAttempted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={INDIGO} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={INDIGO} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                            interval={lineRange === '30' ? 4 : lineRange === '60' ? 3 : 2} />
                        <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...tooltipStyle}
                            formatter={(value: any, name: string) => {
                                const labels: Record<string, string> = { solved: 'Solved', attempted: 'Attempted', cumulative: 'Cumulative' };
                                return [`${value} problems`, labels[name] ?? name];
                            }}
                        />
                        <Area type="monotone" dataKey="cumulative" name="cumulative" stroke="#38bdf8" strokeWidth={1.5}
                            strokeDasharray="5 3" fill="url(#gradCumulative)" dot={false}
                            activeDot={{ r: 5, fill: '#38bdf8', stroke: '#0B0B0B', strokeWidth: 2 }}
                            animationDuration={1600} animationEasing="ease-out" />
                        <Area type="monotone" dataKey="attempted" name="attempted" stroke={`${INDIGO}99`} strokeWidth={1.5}
                            strokeDasharray="4 3" fill="url(#gradAttempted)" dot={false}
                            activeDot={{ r: 5, fill: INDIGO, stroke: '#0B0B0B', strokeWidth: 2 }}
                            animationDuration={1400} animationEasing="ease-out" />
                        <Area type="monotone" dataKey="solved" name="solved" stroke={GOLD} strokeWidth={2.5}
                            fill="url(#gradSolved)" dot={<GoldDot />}
                            activeDot={{ r: 7, fill: GOLD, stroke: '#0B0B0B', strokeWidth: 2, style: { filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.8))' } }}
                            animationDuration={1200} animationEasing="ease-out" />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* ── BAR + PIE row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>

                {/* BAR CHART */}
                <ChartCard title="Difficulty Distribution" sub="Solved problems by difficulty level" delay={0.15}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} margin={{ top: 20, right: 8, left: -20, bottom: 0 }} barCategoryGap="32%">
                            <defs>
                                <linearGradient id="barEasy" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={EASY} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={EASY} stopOpacity={0.4} />
                                </linearGradient>
                                <linearGradient id="barMedium" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={MEDIUM} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={MEDIUM} stopOpacity={0.4} />
                                </linearGradient>
                                <linearGradient id="barHard" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={HARD} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={HARD} stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip {...tooltipStyle}
                                formatter={(value: any, _name: any, props: any) => [
                                    `${value} problems (${props?.payload?.pct ?? 0}%)`,
                                    props?.payload?.name ?? _name,
                                ]}
                            />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={1000} animationEasing="ease-out"
                                label={<BarLabel />}>
                                {barData.map((entry, i) => (
                                    <Cell key={i}
                                        fill={`url(#bar${entry.name})`}
                                        style={{ filter: `drop-shadow(0 0 8px ${entry.fill}55)`, cursor: 'pointer' }}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Legend with percentages */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px' }}>
                        {barData.map(d => (
                            <div key={d.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.fill }} />
                                    <span style={{ fontSize: '0.72rem', color: '#666' }}>{d.name}</span>
                                </div>
                                <span style={{ fontSize: '0.78rem', color: d.fill, fontWeight: 700 }}>{d.count} <span style={{ color: '#444', fontWeight: 400 }}>({d.pct}%)</span></span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* PIE / DONUT CHART */}
                <ChartCard title="Topic Coverage" sub="Sessions by category · hover to inspect" delay={0.2}>
                    {pieData.length === 0 ? (
                        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.875rem' }}>No topic data yet</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <defs>
                                        {TOPIC_COLORS.map((c, i) => (
                                            <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
                                                <stop offset="0%" stopColor={c} stopOpacity={1} />
                                                <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                                            </radialGradient>
                                        ))}
                                    </defs>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={58} outerRadius={88}
                                        dataKey="value"
                                        activeShape={(props: any) =>
                                            props.index === activePieIndex ? renderActiveShape(props) : <Sector {...props} />
                                        }
                                        labelLine={false}
                                        label={<PiePercentLabel />}
                                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                                        animationBegin={0}
                                        animationDuration={1000}
                                        animationEasing="ease-out"
                                        paddingAngle={2}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={`url(#pieGrad${i % TOPIC_COLORS.length})`} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip {...tooltipStyle}
                                        formatter={(value: any, name: any) => [`${value} sessions (${Math.round(value / pieTotal * 100)}%)`, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Legend chips */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', marginTop: '4px' }}>
                                {pieData.map((d, i) => {
                                    const active = activePieIndex === i;
                                    const c = TOPIC_COLORS[i % TOPIC_COLORS.length];
                                    return (
                                        <motion.button key={d.name} onClick={() => setActivePieIndex(i)}
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                padding: '3px 9px', borderRadius: '999px', cursor: 'pointer',
                                                background: active ? `${c}18` : 'transparent',
                                                border: `1px solid ${active ? c + '40' : 'rgba(255,255,255,0.06)'}`,
                                                transition: 'all 0.15s',
                                            }}>
                                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, flexShrink: 0, boxShadow: active ? `0 0 6px ${c}` : 'none' }} />
                                            <span style={{ fontSize: '0.67rem', color: active ? c : '#666', fontWeight: active ? 700 : 400 }}>
                                                {d.name}
                                            </span>
                                            {active && <span style={{ fontSize: '0.6rem', color: c, fontWeight: 700 }}>{Math.round(d.value / pieTotal * 100)}%</span>}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </ChartCard>
            </div>

            {/* ── Weekly activity heatmap mini ── */}
            <ChartCard title="Weekly Pattern" sub="Activity distribution by day of week" delay={0.25}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', justifyContent: 'center', padding: '8px 0' }}>
                    {weeklyData.map((d, i) => (
                        <motion.div key={d.day}
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}
                        >
                            <span style={{ fontSize: '0.68rem', color: d.count > 0 ? GOLD : '#444', fontWeight: d.count > 0 ? 700 : 400 }}>{d.count || ''}</span>
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                style={{
                                    width: '100%', maxWidth: '44px',
                                    height: `${Math.max(d.intensity * 80, 8)}px`,
                                    borderRadius: '6px 6px 3px 3px',
                                    background: d.count > 0
                                        ? `linear-gradient(180deg, ${GOLD}${Math.round(d.intensity * 255).toString(16).padStart(2, '0')} 0%, ${GOLD}40 100%)`
                                        : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${d.count > 0 ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.05)'}`,
                                    boxShadow: d.count > 0 ? `0 0 12px rgba(212,175,55,${d.intensity * 0.3})` : 'none',
                                    cursor: 'default',
                                    transition: 'all 0.2s',
                                }}
                                title={`${d.day}: ${d.count} sessions`}
                            />
                            <span style={{ fontSize: '0.68rem', color: '#555' }}>{d.day}</span>
                        </motion.div>
                    ))}
                </div>
            </ChartCard>

            {/* ── Topic solve rate breakdown ── */}
            <ChartCard title="Topic Solve Rates" sub="Solved vs attempted per category" delay={0.3}>
                {(() => {
                    const topicStats: Record<string, { solved: number; total: number }> = {};
                    data.forEach(a => {
                        const t = a.category;
                        if (!topicStats[t]) topicStats[t] = { solved: 0, total: 0 };
                        topicStats[t].total++;
                        if (a.problemSolved) topicStats[t].solved++;
                    });
                    const sorted = Object.entries(topicStats)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .slice(0, 7);
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {sorted.map(([topic, stats], i) => {
                                const rate = Math.round(stats.solved / Math.max(stats.total, 1) * 100);
                                const color = rate >= 70 ? EASY : rate >= 40 ? MEDIUM : HARD;
                                return (
                                    <motion.div key={topic}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.35 + i * 0.06 }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: TOPIC_COLORS[i % TOPIC_COLORS.length], flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.82rem', color: '#BDBDBD', fontWeight: 500 }}>{topic}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#555' }}>{stats.solved}/{stats.total}</span>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color, minWidth: '34px', textAlign: 'right' }}>{rate}%</span>
                                            </div>
                                        </div>
                                        <div className="progress-bar-gold" style={{ height: '5px' }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${rate}%` }}
                                                transition={{ delay: 0.4 + i * 0.06, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                                                style={{
                                                    height: '100%', borderRadius: '999px',
                                                    background: `linear-gradient(90deg, ${color}, ${color}99)`,
                                                    boxShadow: `0 0 8px ${color}50`,
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );
                })()}
            </ChartCard>
        </div>
    );
};

export default AnalyticsDashboard;
