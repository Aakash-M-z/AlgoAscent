import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, TrendingUp, AlertTriangle, Lightbulb, Target, RefreshCw, ChevronRight } from 'lucide-react';
import { Activity } from '../types';
import { databaseAPI } from '../api/database';
import { useAuth } from '../contexts/AuthContext';

interface AIAnalysisProps {
    activities: Activity[];
}

interface AnalysisResult {
    strengths: string[];
    weaknesses: string[];
    suggestions: { topic: string; reason: string; priority: 'High' | 'Medium' | 'Low' }[];
    nextProblems: { name: string; difficulty: 'Easy' | 'Medium' | 'Hard'; topic: string; reason: string }[];
    overallAssessment: string;
    nextMilestone: string;
}

const PRIORITY_META = {
    High: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'High Priority' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Medium' },
    Low: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'Low' },
};

/* ── Quick local stats (shown before/alongside AI result) ─────── */
function buildLocalStats(activities: Activity[]) {
    const topicMap: Record<string, { solved: number; total: number }> = {};
    activities.forEach(a => {
        const t = a.dsaTopic || a.category || 'General';
        if (!topicMap[t]) topicMap[t] = { solved: 0, total: 0 };
        topicMap[t].total++;
        if (a.problemSolved) topicMap[t].solved++;
    });
    const sorted = Object.entries(topicMap).sort(([, a], [, b]) => b.solved - a.solved);
    const strengths = sorted.filter(([, v]) => v.solved / Math.max(v.total, 1) >= 0.6 && v.solved >= 2).slice(0, 3);
    const weaknesses = sorted.filter(([, v]) => v.solved / Math.max(v.total, 1) < 0.4 && v.total >= 1).slice(0, 3);
    return { strengths, weaknesses, topicMap };
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ activities }) => {
    const { user } = useAuth();
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ran, setRan] = useState(false);

    const localStats = buildLocalStats(activities);

    const runAnalysis = useCallback(async () => {
        if (activities.length === 0) return;
        setLoading(true);
        setError(null);

        // Map frontend activities to the shape the backend expects
        const payload = activities.map(a => ({
            topic: a.dsaTopic || a.category,
            category: a.category,
            difficulty: a.difficulty || 'Medium',
            solved: a.problemSolved ?? false,
            date: a.date,
            timeSpent: a.duration,
        }));

        const data = await databaseAPI.analyzeProgress(payload as any, user?.username);
        setLoading(false);
        setRan(true);
        if (data) {
            setResult(data);
        } else {
            setError('Could not reach the AI service. Check that OPENROUTER_API_KEY is set in your .env and the server is running.');
        }
    }, [activities, user]);

    return (
        <div className="animate-fadeIn section-gap">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 className="page-heading" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Brain size={22} color="#D4AF37" style={{ flexShrink: 0 }} />
                        AI Progress Analysis
                    </h2>
                    <p className="page-subheading">OpenRouter-powered insights from your activity data</p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={loading || activities.length === 0}
                    className="btn-gold"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.875rem', opacity: activities.length === 0 ? 0.4 : 1 }}
                >
                    {loading
                        ? <><div className="spinner-gold" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Analyzing…</>
                        : <><Sparkles size={14} /> {ran ? 'Re-analyze' : 'Analyze My Progress'}</>
                    }
                </button>
            </div>

            {/* Empty state */}
            {activities.length === 0 && (
                <div className="card-dark" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.15 }}>◈</div>
                    <p style={{ color: '#555', fontSize: '0.9rem' }}>Log some activities first to enable AI analysis.</p>
                </div>
            )}

            {/* Local snapshot — always visible once there's data */}
            {activities.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {/* Quick stats */}
                    {[
                        { label: 'Total Solved', value: activities.filter(a => a.problemSolved).length, color: '#22c55e', icon: '✓' },
                        { label: 'Topics Covered', value: new Set(activities.map(a => a.dsaTopic || a.category)).size, color: '#818cf8', icon: '◎' },
                        { label: 'Hard Solved', value: activities.filter(a => a.difficulty === 'Hard' && a.problemSolved).length, color: '#ef4444', icon: '🔥' },
                        { label: 'Active Days', value: new Set(activities.map(a => a.date.slice(0, 10))).size, color: '#D4AF37', icon: '◆' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                                {s.icon}
                            </div>
                            <div>
                                <div className="kpi-number" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
                                <div className="kpi-sub">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="card-dark" style={{ padding: '16px 20px', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && (
                <div className="section-gap">
                    {[240, 180, 200].map((h, i) => (
                        <div key={i} className="skeleton" style={{ height: `${h}px`, borderRadius: '14px' }} />
                    ))}
                </div>
            )}

            {/* AI Result */}
            <AnimatePresence>
                {result && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        className="section-gap"
                    >
                        {/* Overall assessment */}
                        <div className="card-dark" style={{ padding: '20px 24px', borderColor: 'rgba(212,175,55,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <Sparkles size={14} color="#D4AF37" />
                                <span className="card-title">Overall Assessment</span>
                            </div>
                            <p style={{ color: '#EAEAEA', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{result.overallAssessment}</p>
                            {result.nextMilestone && (
                                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Target size={13} color="#D4AF37" style={{ flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.82rem', color: '#D4AF37', fontWeight: 600 }}>Next milestone: </span>
                                    <span style={{ fontSize: '0.82rem', color: '#EAEAEA' }}>{result.nextMilestone}</span>
                                </div>
                            )}
                        </div>

                        {/* Strengths + Weaknesses */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                            {/* Strengths */}
                            <div className="card-dark" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <TrendingUp size={14} color="#22c55e" />
                                    <span className="card-title" style={{ color: '#22c55e' }}>Strengths</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {result.strengths.map((s, i) => (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.07 }}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 12px', borderRadius: '9px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}
                                        >
                                            <ChevronRight size={13} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ fontSize: '0.84rem', color: '#EAEAEA', lineHeight: 1.5 }}>{s}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className="card-dark" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <AlertTriangle size={14} color="#f59e0b" />
                                    <span className="card-title" style={{ color: '#f59e0b' }}>Areas to Improve</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {result.weaknesses.map((w, i) => (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.07 }}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 12px', borderRadius: '9px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}
                                        >
                                            <ChevronRight size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ fontSize: '0.84rem', color: '#EAEAEA', lineHeight: 1.5 }}>{w}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div className="card-dark" style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <Lightbulb size={14} color="#D4AF37" />
                                <span className="card-title">Recommended Next Steps</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {result.suggestions.map((s, i) => {
                                    const meta = PRIORITY_META[s.priority] ?? PRIORITY_META.Medium;
                                    return (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderRadius: '11px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'border-color 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'}
                                        >
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: meta.color }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA' }}>{s.topic}</span>
                                                    <span style={{ fontSize: '0.65rem', padding: '1px 8px', borderRadius: '999px', fontWeight: 700, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
                                                        {meta.label}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.82rem', color: '#777', margin: 0, lineHeight: 1.5 }}>{s.reason}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Next Problems */}
                        {result.nextProblems?.length > 0 && (
                            <div className="card-dark" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Target size={14} color="#818cf8" />
                                    <span className="card-title" style={{ color: '#818cf8' }}>Recommended Problems</span>
                                    <span style={{ fontSize: '0.65rem', color: '#555', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '1px 8px', borderRadius: '999px' }}>
                                        AI-picked
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                    {result.nextProblems.map((p, i) => {
                                        const diffColor = p.difficulty === 'Easy' ? '#22c55e' : p.difficulty === 'Hard' ? '#ef4444' : '#f59e0b';
                                        const diffBg = p.difficulty === 'Easy' ? 'rgba(34,197,94,0.1)' : p.difficulty === 'Hard' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
                                        const leetUrl = `https://leetcode.com/problems/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
                                        return (
                                            <motion.a
                                                key={i}
                                                href={leetUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.07 }}
                                                style={{
                                                    display: 'block', padding: '14px 16px', borderRadius: '12px', textDecoration: 'none',
                                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                                    transition: 'border-color 0.2s, transform 0.2s', position: 'relative', overflow: 'hidden',
                                                }}
                                                whileHover={{ y: -2 }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${diffColor}40`}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}
                                            >
                                                {/* top edge glow */}
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${diffColor}50, transparent)` }} />
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{p.name}</span>
                                                    <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, color: diffColor, background: diffBg, border: `1px solid ${diffColor}30`, flexShrink: 0 }}>
                                                        {p.difficulty}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#818cf8', marginBottom: '5px', fontWeight: 600 }}>{p.topic}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.4 }}>{p.reason}</div>
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Re-analyze footer */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={runAnalysis} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', transition: 'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
                            >
                                <RefreshCw size={12} /> Refresh analysis
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pre-run hint */}
            {!ran && !loading && activities.length > 0 && (
                <div className="card-dark" style={{ padding: '32px 24px', textAlign: 'center', borderStyle: 'dashed' }}>
                    <Brain size={28} color="#333" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '6px' }}>Click "Analyze My Progress" to get AI-powered insights via OpenRouter</p>
                    <p className="kpi-sub">Strengths, weaknesses, and a personalized study plan based on your {activities.length} logged sessions</p>
                </div>
            )}
        </div>
    );
};

export default AIAnalysis;
