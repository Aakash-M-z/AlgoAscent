import React, { useMemo } from 'react';
import { Activity } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface Props { activities?: Activity[]; }

const LEVELS = [
    { key: 'beginner', label: 'Beginner', icon: '🌱', minProblems: 0, minTopics: 0, minStreak: 0, color: '#22c55e' },
    { key: 'intermediate', label: 'Intermediate', icon: '🚀', minProblems: 15, minTopics: 4, minStreak: 3, color: '#3b82f6' },
    { key: 'advanced', label: 'Advanced', icon: '👑', minProblems: 50, minTopics: 8, minStreak: 7, color: '#D4AF37' },
];

function calcStreak(activities: Activity[]): number {
    const dates = [...new Set(activities.map(a => a.date.slice(0, 10)))].sort((a, b) => b > a ? 1 : -1);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (!dates.length || (dates[0] !== today && dates[0] !== yesterday)) return 0;
    let s = 1;
    for (let i = 1; i < dates.length; i++) {
        const diff = Math.round((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 864e5);
        if (diff === 1) s++; else break;
    }
    return s;
}

const UserProfile: React.FC<Props> = ({ activities = [] }) => {
    const { user } = useAuth();

    const stats = useMemo(() => ({
        solved: activities.filter(a => a.problemSolved).length,
        topics: new Set(activities.map(a => a.category)).size,
        streak: calcStreak(activities),
        hours: Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60),
    }), [activities]);

    const currentLevel = useMemo(() => {
        for (let i = LEVELS.length - 1; i >= 0; i--) {
            const l = LEVELS[i];
            if (stats.solved >= l.minProblems && stats.topics >= l.minTopics && stats.streak >= l.minStreak)
                return LEVELS[i];
        }
        return LEVELS[0];
    }, [stats]);

    const levelIdx = LEVELS.indexOf(currentLevel);
    const nextLevel = LEVELS[levelIdx + 1] ?? null;

    const progressToNext = nextLevel ? Math.round(
        ((Math.min(stats.solved / Math.max(nextLevel.minProblems, 1), 1) +
            Math.min(stats.topics / Math.max(nextLevel.minTopics, 1), 1) +
            Math.min(stats.streak / Math.max(nextLevel.minStreak, 1), 1)) / 3) * 100
    ) : 100;

    return (
        <div className="section-gap animate-fadeIn">
            <div>
                <h2 className="page-heading">Profile</h2>
                <p className="page-subheading">Your progress and skill level</p>
            </div>

            {/* User card */}
            <div className="card-dark" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4AF37, #8A6012)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', fontWeight: 800, color: '#0B0B0B', flexShrink: 0,
                    boxShadow: '0 0 20px rgba(212,175,55,0.3)',
                }}>
                    {user?.name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#EAEAEA' }}>{user?.name ?? 'User'}</div>
                    <div className="kpi-sub">{user?.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontSize: '1.1rem' }}>{currentLevel.icon}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: currentLevel.color }}>{currentLevel.label}</span>
                        <span className="kpi-sub">· Level {levelIdx + 1}</span>
                    </div>
                </div>
            </div>

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                {[
                    { label: 'Problems Solved', value: stats.solved, icon: '✓' },
                    { label: 'Topics Covered', value: stats.topics, icon: '◎' },
                    { label: 'Day Streak', value: stats.streak, icon: '🔥' },
                    { label: 'Hours Studied', value: stats.hours, icon: '⏱' },
                ].map(k => (
                    <div key={k.label} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '1.2rem' }}>{k.icon}</div>
                        <div className="kpi-number">{k.value}</div>
                        <div className="kpi-label">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Progress to next level */}
            {nextLevel && (
                <div className="card-dark" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#EAEAEA' }}>
                            Progress to {nextLevel.icon} {nextLevel.label}
                        </div>
                        <span className="kpi-sub">{progressToNext}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{ height: '100%', width: `${progressToNext}%`, background: 'linear-gradient(90deg, #D4AF37, #FFD700)', borderRadius: '999px', transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {[
                            { label: 'Problems', cur: stats.solved, req: nextLevel.minProblems, color: '#22c55e' },
                            { label: 'Topics', cur: stats.topics, req: nextLevel.minTopics, color: '#3b82f6' },
                            { label: 'Streak', cur: stats.streak, req: nextLevel.minStreak, color: '#f59e0b' },
                        ].map(r => (
                            <div key={r.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#EAEAEA' }}>{r.cur}/{r.req}</div>
                                <div className="kpi-sub">{r.label}</div>
                                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden', marginTop: '6px' }}>
                                    <div style={{ height: '100%', width: `${Math.min(r.cur / Math.max(r.req, 1) * 100, 100)}%`, background: r.color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Level system */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
                <div className="card-title" style={{ marginBottom: '16px' }}>Level System</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {LEVELS.map((l, i) => {
                        const isCurrent = l.key === currentLevel.key;
                        return (
                            <div key={l.key} style={{
                                display: 'flex', alignItems: 'center', gap: '14px',
                                padding: '12px 16px', borderRadius: '12px',
                                background: isCurrent ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isCurrent ? l.color + '50' : 'rgba(255,255,255,0.04)'}`,
                            }}>
                                <span style={{ fontSize: '1.4rem' }}>{l.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isCurrent ? l.color : '#666' }}>{l.label}</div>
                                    <div className="kpi-sub">{l.minProblems}+ problems · {l.minTopics}+ topics · {l.minStreak}+ day streak</div>
                                </div>
                                {isCurrent
                                    ? <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 700 }}>✓ Current</span>
                                    : i > levelIdx && <span className="kpi-sub">Locked</span>
                                }
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
