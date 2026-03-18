
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
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>Analytics</h2>
                <p style={{ color: '#555', fontSize: '0.8rem', margin: '2px 0 0' }}>Your productivity trends and insights</p>
            </div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {[
                    { label: 'Completion Rate', value: `${completionRate}%`, color: '#22c55e', sub: 'problems solved' },
                    { label: 'Total Hours', value: `${totalHours}h`, color: '#D4AF37', sub: 'study time' },
                    { label: 'Avg / Day', value: avgPerDay, color: '#a78bfa', sub: 'sessions (7d)' },
                    { label: 'Topics', value: String(new Set(activities.map(a => a.category)).size), color: '#38bdf8', sub: 'categories' },
                ].map((k, i) => (
                    <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: k.color, marginBottom: '4px' }}>{k.value}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '2px' }}>{k.label}</div>
                        <div style={{ fontSize: '0.7rem', color: '#555' }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Weekly bar chart */}
            <div className="card-dark p-6">
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
                    Weekly Activity — Last 7 Days
                </h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '110px' }}>
                    {weeklyData.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                            {d.count > 0 && <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 600 }}>{d.count}</span>}
                            <div style={{
                                width: '100%',
                                height: `${Math.max((d.count / maxCount) * 80, d.count > 0 ? 8 : 3)}px`,
                                background: d.count > 0 ? 'linear-gradient(180deg, #D4AF37 0%, #8A6012 100%)' : 'rgba(255,255,255,0.04)',
                                borderRadius: '5px 5px 0 0',
                                boxShadow: d.count > 0 ? '0 0 8px rgba(212,175,55,0.25)' : 'none',
                                transition: 'height 0.6s ease',
                            }} />
                            <span style={{ fontSize: '0.7rem', color: '#555' }}>{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Category breakdown */}
                <div className="card-dark p-5">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                        By Category
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {categoryData.slice(0, 5).map((c, i) => (
                            <div key={c.cat}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#EAEAEA' }}>{c.cat}</span>
                                    <span style={{ fontSize: '0.8rem', color: CAT_COLORS[i % CAT_COLORS.length], fontWeight: 600 }}>{c.pct}%</span>
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
                <div className="card-dark p-5">
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                        Monthly Trend
                    </h3>
                    {monthlyData.length === 0 ? (
                        <p style={{ color: '#444', fontSize: '0.85rem' }}>Not enough data yet.</p>
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
            <div className="card-dark p-6" style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
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
                        <span style={{ fontSize: '0.6rem', color: '#555' }}>solved</span>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '8px' }}>Productivity Insights</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[
                            completionRate >= 70 ? '🔥 Excellent solve rate — you\'re in the top tier' : completionRate >= 40 ? '📈 Good progress — aim for 70%+ solve rate' : '💡 Focus on solving more problems to improve your rate',
                            totalHours >= 20 ? `⏱ ${totalHours}h invested — strong commitment` : `⏱ ${totalHours}h logged — try to hit 20h this month`,
                            parseFloat(avgPerDay) >= 1 ? `✓ Averaging ${avgPerDay} sessions/day this week` : `📅 Averaging ${avgPerDay} sessions/day — aim for 1+ daily`,
                        ].map((insight, i) => (
                            <p key={i} style={{ fontSize: '0.82rem', color: '#888', margin: 0, lineHeight: 1.5 }}>{insight}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
