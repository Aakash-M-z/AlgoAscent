import React, { useMemo, useState } from 'react';
import {
    ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, Cell,
    PieChart, Pie, Sector,
} from 'recharts';
import { Activity } from '../types';

interface Props { activities: Activity[]; }

/* ── Palette ─────────────────────────────────────────────────── */
const GOLD = '#D4AF37';
const GOLD2 = '#FFD700';
const EASY = '#22c55e';
const MEDIUM = '#f59e0b';
const HARD = '#ef4444';
const TOPIC_COLORS = [
    '#D4AF37', '#818cf8', '#22c55e', '#38bdf8',
    '#f59e0b', '#a78bfa', '#ef4444', '#34d399',
    '#fb923c', '#60a5fa',
];

/* ── Shared tooltip style ────────────────────────────────────── */
const tooltipStyle = {
    contentStyle: {
        background: '#111',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: '10px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
        fontSize: '0.8rem',
        color: '#EAEAEA',
        padding: '10px 14px',
    },
    labelStyle: { color: '#D4AF37', fontWeight: 700, marginBottom: '4px' },
    itemStyle: { color: '#EAEAEA' },
    cursor: { stroke: 'rgba(212,175,55,0.15)', strokeWidth: 1 },
};

/* ── Active pie sector ───────────────────────────────────────── */
const renderActiveShape = (props: any) => {
    const {
        cx, cy, innerRadius, outerRadius, startAngle, endAngle,
        fill, payload, percent, value,
    } = props;
    return (
        <g>
            <text x={cx} y={cy - 10} textAnchor="middle" fill="#EAEAEA" fontSize={13} fontWeight={700}>
                {payload.name}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill={fill} fontSize={18} fontWeight={800}
                fontFamily="Poppins, Inter, sans-serif">
                {value}
            </text>
            <text x={cx} y={cy + 30} textAnchor="middle" fill="#555" fontSize={11}>
                {(percent * 100).toFixed(0)}%
            </text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
                startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 13}
                startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
        </g>
    );
};

/* ── Card wrapper ────────────────────────────────────────────── */
const ChartCard: React.FC<{ title: string; sub?: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, sub, children, style }) => (
    <div className="card-dark" style={{ padding: '20px 24px', ...style }}>
        <div style={{ marginBottom: '20px' }}>
            <div className="card-title">{title}</div>
            {sub && <div className="kpi-sub" style={{ marginTop: '3px' }}>{sub}</div>}
        </div>
        {children}
    </div>
);

/* ── Custom dot for line chart ───────────────────────────────── */
const GoldDot = (props: any) => {
    const { cx, cy, value } = props;
    if (!value) return null;
    return (
        <circle cx={cx} cy={cy} r={4} fill={GOLD} stroke="#0B0B0B" strokeWidth={2}
            style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.6))' }} />
    );
};

/* ── Main component ──────────────────────────────────────────── */
const AnalyticsDashboard: React.FC<Props> = ({ activities }) => {
    const [activePieIndex, setActivePieIndex] = useState(0);
    const [lineRange, setLineRange] = useState<'30' | '60' | '90'>('30');

    /* ── KPIs ── */
    const kpis = useMemo(() => {
        const solved = activities.filter(a => a.problemSolved).length;
        const total = activities.length;
        const rate = total ? Math.round((solved / total) * 100) : 0;
        const hours = Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60);
        const topics = new Set(activities.map(a => a.category)).size;
        const now = Date.now();
        const week = activities.filter(a => now - new Date(a.date).getTime() < 7 * 86_400_000).length;
        const avg = (week / 7).toFixed(1);
        return [
            { label: 'Solve Rate', value: `${rate}%`, color: '#22c55e', sub: 'problems solved' },
            { label: 'Total Hours', value: `${hours}h`, color: GOLD, sub: 'study time' },
            { label: 'Avg / Day', value: avg, color: '#818cf8', sub: 'sessions (7d)' },
            { label: 'Topics', value: String(topics), color: '#38bdf8', sub: 'categories' },
        ];
    }, [activities]);

    /* ── Line chart: problems solved over time ── */
    const lineData = useMemo(() => {
        const days = parseInt(lineRange);
        const map: Record<string, { date: string; solved: number; attempted: number }> = {};
        const cutoff = Date.now() - days * 86_400_000;

        activities
            .filter(a => new Date(a.date).getTime() >= cutoff)
            .forEach(a => {
                const d = a.date.slice(0, 10);
                if (!map[d]) map[d] = { date: d, solved: 0, attempted: 0 };
                if (a.problemSolved) map[d].solved++;
                else map[d].attempted++;
            });

        // Fill every day in range
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(cutoff + (i + 1) * 86_400_000);
            const key = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            return { date: label, solved: map[key]?.solved ?? 0, attempted: map[key]?.attempted ?? 0 };
        }).filter((_, i, arr) => {
            // For 60/90 days, show every 3rd/7th to avoid crowding
            if (days === 30) return true;
            if (days === 60) return i % 2 === 0;
            return i % 3 === 0;
        });
    }, [activities, lineRange]);

    /* ── Bar chart: difficulty distribution ── */
    const barData = useMemo(() => {
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        activities.forEach(a => {
            if (a.difficulty && a.problemSolved) counts[a.difficulty]++;
        });
        return [
            { name: 'Easy', count: counts.Easy, fill: EASY },
            { name: 'Medium', count: counts.Medium, fill: MEDIUM },
            { name: 'Hard', count: counts.Hard, fill: HARD },
        ];
    }, [activities]);

    /* ── Pie chart: topic coverage ── */
    const pieData = useMemo(() => {
        const map: Record<string, number> = {};
        activities.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
        return Object.entries(map)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([name, value]) => ({ name, value }));
    }, [activities]);

    /* ── Insights ── */
    const insights = useMemo(() => {
        const solved = activities.filter(a => a.problemSolved).length;
        const total = activities.length;
        const rate = total ? Math.round((solved / total) * 100) : 0;
        const hours = Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60);
        const hardCount = activities.filter(a => a.difficulty === 'Hard' && a.problemSolved).length;
        return [
            rate >= 70 ? `🔥 ${rate}% solve rate — top tier performance` : rate >= 40 ? `📈 ${rate}% solve rate — aim for 70%+` : `💡 ${rate}% solve rate — focus on fundamentals first`,
            hours >= 20 ? `⏱ ${hours}h invested — strong commitment` : `⏱ ${hours}h logged — try to hit 20h this month`,
            hardCount > 0 ? `💪 ${hardCount} Hard problems solved — impressive` : `🎯 Try tackling a Hard problem to level up`,
        ];
    }, [activities]);

    if (activities.length === 0) {
        return (
            <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.15 }}>◐</div>
                <p style={{ color: '#444', fontSize: '0.95rem' }}>No data yet. Start logging activities to see your analytics.</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn section-gap">
            <div>
                <h2 className="page-heading">Analytics</h2>
                <p className="page-subheading">Your productivity trends and insights</p>
            </div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {kpis.map((k, i) => (
                    <div key={i} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-sub">{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* ── LINE CHART ── */}
            <ChartCard
                title="Problems Solved Over Time"
                sub="Daily solved vs attempted sessions"
            >
                {/* Range toggle */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                    {(['30', '60', '90'] as const).map(r => (
                        <button key={r} onClick={() => setLineRange(r)}
                            style={{
                                padding: '4px 12px', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 600,
                                cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                background: lineRange === r ? 'rgba(212,175,55,0.12)' : 'transparent',
                                borderColor: lineRange === r ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)',
                                color: lineRange === r ? GOLD : '#555',
                            }}>
                            {r}d
                        </button>
                    ))}
                </div>

                <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={lineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="solvedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false}
                            interval={lineRange === '30' ? 4 : lineRange === '60' ? 3 : 2} />
                        <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: '0.75rem', color: '#888', paddingTop: '12px' }} />
                        <Line type="monotone" dataKey="solved" name="Solved" stroke={GOLD} strokeWidth={2.5}
                            dot={<GoldDot />} activeDot={{ r: 6, fill: GOLD, stroke: '#0B0B0B', strokeWidth: 2 }}
                            animationDuration={1200} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="attempted" name="Attempted" stroke="rgba(129,140,248,0.7)"
                            strokeWidth={1.5} strokeDasharray="4 3"
                            dot={false} activeDot={{ r: 5, fill: '#818cf8', stroke: '#0B0B0B', strokeWidth: 2 }}
                            animationDuration={1400} animationEasing="ease-out" />
                    </LineChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* ── BAR + PIE row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

                {/* BAR CHART */}
                <ChartCard title="Difficulty Distribution" sub="Solved problems by difficulty">
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                            barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }}
                                axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                {...tooltipStyle}
                                formatter={(value, _name, props) => [
                                    `${value} problems`,
                                    (props as any)?.payload?.name ?? _name,
                                ]}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1000} animationEasing="ease-out"
                                label={{ position: 'top', fill: '#555', fontSize: 11, fontWeight: 600 }}>
                                {barData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill}
                                        style={{ filter: `drop-shadow(0 0 6px ${entry.fill}55)` }} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
                        {barData.map(d => (
                            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: d.fill }} />
                                <span style={{ fontSize: '0.72rem', color: '#666' }}>{d.name}: <span style={{ color: d.fill, fontWeight: 700 }}>{d.count}</span></span>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* PIE CHART */}
                <ChartCard title="Topic Coverage" sub="Sessions by category">
                    {pieData.length === 0 ? (
                        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '0.875rem' }}>
                            No topic data yet
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={90}
                                        dataKey="value"
                                        activeShape={(props: any) =>
                                            props.index === activePieIndex ? renderActiveShape(props) : <Sector {...props} />
                                        }
                                        onMouseEnter={(_, index) => setActivePieIndex(index)}
                                        animationBegin={0}
                                        animationDuration={1000}
                                        animationEasing="ease-out"
                                        paddingAngle={2}
                                    >
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={TOPIC_COLORS[i % TOPIC_COLORS.length]}
                                                stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        {...tooltipStyle}
                                        formatter={(value, name) => [`${value} sessions`, name]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Legend grid */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
                                {pieData.map((d, i) => (
                                    <button key={d.name} onClick={() => setActivePieIndex(i)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '3px 9px', borderRadius: '999px', cursor: 'pointer',
                                            background: activePieIndex === i ? `${TOPIC_COLORS[i % TOPIC_COLORS.length]}18` : 'transparent',
                                            border: `1px solid ${activePieIndex === i ? TOPIC_COLORS[i % TOPIC_COLORS.length] + '40' : 'rgba(255,255,255,0.06)'}`,
                                            transition: 'all 0.15s',
                                        }}>
                                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: TOPIC_COLORS[i % TOPIC_COLORS.length], flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.68rem', color: activePieIndex === i ? TOPIC_COLORS[i % TOPIC_COLORS.length] : '#666', fontWeight: activePieIndex === i ? 600 : 400 }}>
                                            {d.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </ChartCard>
            </div>

            {/* ── Insights ── */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
                <div className="card-title" style={{ marginBottom: '14px' }}>Productivity Insights</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {insights.map((insight, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '10px 14px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                        }}>
                            <p style={{ fontSize: '0.875rem', color: '#888', margin: 0, lineHeight: 1.6 }}>{insight}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
