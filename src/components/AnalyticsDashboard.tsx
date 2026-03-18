
import React, { useMemo } from 'react';
import { Activity } from '../types';

interface Props { activities: Activity[]; }

function getLast7Days() {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });
}

const CAT_COLORS = ['#D4AF37', '#3b82f6', '#22c55e', '#a78bfa', '#f59e0b', '#ef4444'];

const AnalyticsDashboard: React.FC<Props> = ({ activities }) => {
    const days = getLast7Days();

    const weeklyData = useMemo(() => days.map(day => ({
        day: new Date(day + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
        count: activities.filter(a => a.date.startsWith(day)).length,
    })), [activities]);

    const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

    const categoryData = useMemo(() => {
        const map: Record<string, number> = {};
        activities.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
        const total = activities.length || 1;
        return Object.entries(map)
            .map(([cat, count]) => ({ cat, count, pct: Math.round(count / total * 100) }))
            .sort((a, b) => b.count - a.count);
    }, [activities]);

    const monthlyData = useMemo(() => {
        const map: Record<string, number> = {};
        activities.forEach(a => {
            const month = a.date.slice(0, 7);
            map[month] = (map[month] || 0) + 1;
        });
        return Object.entries(map).sort().slice(-6).map(([m, c]) => ({
            label: new Date(m + '-15').toLocaleDateString('en', { month: 'short' }),
            count: c,
        }));
    }, [activities]);

    const maxMonthly = Math.max(...monthlyData.map(d => d.count), 1);
    const completionRate = activities.length ? Math.round(activities.filter(a => a.problemSolved).length / activities.length * 100) : 0;
    const totalHours = Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60);
    const avgPerDay = (weeklyData.reduce((s, d) => s + d.count, 0) / 7).toFixed(1);
    const circumference = 2 * Math.PI * 42;

    if (activities.length === 0) {
        return (
            <div className="animate-fadeIn" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.2 }}>◐</div>
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
                {[
                    { label: 'Completion Rate', value: `${completionRate}%`, color: '#22c55e', sub: 'problems solved' },
                    { label: 'Total Hours', value: `${totalHours}h`, color: '#D4AF37', sub: 'study time' },
                    { label: 'Avg / Day', value: avgPerDay, color: '#a78bfa', sub: 'sessions (7d)' },
                    { label: 'Topics', value: String(new Set(activities.map(a => a.category)).size), color: '#38bdf8', sub: 'categories' },
                ].map((k, i) => (
                    <div key={i} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-sub">{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Weekly bar chart */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
                <div className="card-title" style={{ marginBottom: '20px' }}>Weekly Activity — Last 7 Days</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px' }}>
                    {weeklyData.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                            {d.count > 0 && <span style={{ fontSize: '0.72rem', color: '#D4AF37', fontWeight: 700 }}>{d.count}</span>}
                            <div style={{
                                width: '100%',
                                height: `${Math.max((d.count / maxCount) * 80, d.count > 0 ? 8 : 3)}px`,
                                background: d.count > 0 ? 'linear-gradient(180deg, #D4AF37 0%, #8A6012 100%)' : 'rgba(255,255,255,0.04)',
                                borderRadius: '5px 5px 0 0',
                                boxShadow: d.count > 0 ? '0 0 8px rgba(212,175,55,0.25)' : 'none',
                                transition: 'height 0.6s ease',
                            }} />
                            <span style={{ fontSize: '0.72rem', color: '#555' }}>{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Category breakdown */}
                <div className="card-dark" style={{ padding: '20px 24px' }}>
                    <div className="card-title" style={{ marginBottom: '16px' }}>By Category</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {categoryData.slice(0, 5).map((c, i) => (
                            <div key={c.cat}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#EAEAEA' }}>{c.cat}</span>
                                    <span style={{ fontSize: '0.875rem', color: CAT_COLORS[i % CAT_COLORS.length], fontWeight: 700 }}>{c.pct}%</span>
                                </div>
                                <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${c.pct}%`,
                                        background: `linear-gradient(90deg, ${CAT_COLORS[i % CAT_COLORS.length]}, ${CAT_COLORS[i % CAT_COLORS.length]}66)`,
                                        borderRadius: '999px', transition: 'width 0.8s ease',
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly trend */}
                <div className="card-dark" style={{ padding: '20px 24px' }}>
                    <div className="card-title" style={{ marginBottom: '16px' }}>Monthly Trend</div>
                    {monthlyData.length === 0 ? (
                        <p style={{ color: '#555', fontSize: '0.875rem' }}>Not enough data yet.</p>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '90px' }}>
                            {monthlyData.map((m, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                    <div style={{
                                        width: '100%',
                                        height: `${Math.max((m.count / maxMonthly) * 70, 4)}px`,
                                        background: i === monthlyData.length - 1 ? 'linear-gradient(180deg, #D4AF37, #8A6012)' : 'rgba(212,175,55,0.2)',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'height 0.6s ease',
                                    }} />
                                    <span style={{ fontSize: '0.65rem', color: '#555' }}>{m.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Completion ring + insights */}
            <div className="card-dark" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#goldGrad)" strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference * (1 - completionRate / 100)}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s ease' }}
                        />
                        <defs>
                            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FFD700" />
                                <stop offset="100%" stopColor="#D4AF37" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#D4AF37' }}>{completionRate}%</span>
                        <span className="kpi-sub">solved</span>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '12px', margin: '0 0 12px' }}>Productivity Insights</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[
                            completionRate >= 70 ? '🔥 Excellent solve rate — you\'re in the top tier' : completionRate >= 40 ? '📈 Good progress — aim for 70%+ solve rate' : '💡 Focus on solving more problems to improve your rate',
                            totalHours >= 20 ? `⏱ ${totalHours}h invested — strong commitment` : `⏱ ${totalHours}h logged — try to hit 20h this month`,
                            parseFloat(avgPerDay) >= 1 ? `✓ Averaging ${avgPerDay} sessions/day this week` : `📅 Averaging ${avgPerDay} sessions/day — aim for 1+ daily`,
                        ].map((insight, i) => (
                            <p key={i} style={{ fontSize: '0.875rem', color: '#888', margin: 0, lineHeight: 1.6 }}>{insight}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
