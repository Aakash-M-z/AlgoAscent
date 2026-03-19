import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, TrendingUp, AlertTriangle, Lightbulb, Target, RefreshCw, ChevronRight, Clock, Database, BarChart2 } from 'lucide-react';
import { Activity } from '../types';
import { databaseAPI } from '../api/database';
import { useAuth } from '../contexts/AuthContext';
import PremiumGate from './PremiumGate';
import { usePlan } from '../hooks/usePlan';
import { AnalysisSkeleton } from './AISkeleton';
import {
    getCached, setCached, getCacheInfo, invalidateCache,
    trackRequest, trackCacheHit, trackSuccess, trackFailure,
    getAnalytics, buildAnalysisCacheKey,
} from '../utils/aiCache';

interface AIAnalysisProps { activities: Activity[]; }

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

function buildLocalStats(activities: Activity[]) {
    const topicMap: Record<string, { solved: number; total: number }> = {};
    activities.forEach(a => {
        const t = a.dsaTopic || a.category || 'General';
        if (!topicMap[t]) topicMap[t] = { solved: 0, total: 0 };
        topicMap[t].total++;
        if (a.problemSolved) topicMap[t].solved++;
    });
    return topicMap;
}

function fmtAge(ms: number): string {
    const m = Math.floor(ms / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

/* ── Analytics badge ─────────────────────────────────────────── */
const AnalyticsBadge: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const a = getAnalytics();
    const successRate = a.totalRequests > 0
        ? Math.round(((a.totalRequests - a.totalFailures) / a.totalRequests) * 100)
        : 100;
    const cacheRate = a.totalRequests > 0
        ? Math.round((a.totalCacheHits / a.totalRequests) * 100)
        : 0;

    return (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="card-dark" style={{ padding: '16px 20px', borderColor: 'rgba(212,175,55,0.2)', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={13} color="#D4AF37" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Analytics</span>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                    { label: 'Requests', value: a.totalRequests, color: '#818cf8' },
                    { label: 'Success', value: `${successRate}%`, color: '#22c55e' },
                    { label: 'Cache hits', value: `${cacheRate}%`, color: '#D4AF37' },
                    { label: 'Avg time', value: a.avgDurationMs > 0 ? `${(a.avgDurationMs / 1000).toFixed(1)}s` : '—', color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '0.65rem', color: '#444', marginTop: '2px' }}>{s.label}</div>
                    </div>
                ))}
            </div>
            {a.recentFailures.length > 0 && (
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '0.65rem', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent failures</div>
                    {a.recentFailures.slice(0, 3).map((f, i) => (
                        <div key={i} style={{ fontSize: '0.72rem', color: '#ef4444', marginBottom: '3px', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#333', flexShrink: 0 }}>{new Date(f.ts).toLocaleTimeString()}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.error}</span>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

/* ── Main component ──────────────────────────────────────────── */
const AIAnalysis: React.FC<AIAnalysisProps> = ({ activities }) => {
    const { user } = useAuth();
    const { canUseAI } = usePlan();
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ran, setRan] = useState(false);
    const [fromCache, setFromCache] = useState(false);
    const [cacheAge, setCacheAge] = useState<number | null>(null);
    const [showAnalytics, setShowAnalytics] = useState(false);

    const cacheKey = buildAnalysisCacheKey(
        activities.map(a => ({ topic: a.dsaTopic || a.category, solved: a.problemSolved }))
    );

    // Restore last cached result on mount
    useEffect(() => {
        const cached = getCached<AnalysisResult>('analyze', cacheKey);
        if (cached) {
            setResult(cached);
            setRan(true);
            setFromCache(true);
            const info = getCacheInfo('analyze', cacheKey);
            if (info) setCacheAge(info.age);
        }
    }, []);  // only on mount — intentionally not re-running on cacheKey change

    const runAnalysis = useCallback(async (forceRefresh = false) => {
        if (activities.length === 0) return;

        // Serve from cache unless forced
        if (!forceRefresh) {
            const cached = getCached<AnalysisResult>('analyze', cacheKey);
            if (cached) {
                setResult(cached);
                setRan(true);
                setFromCache(true);
                const info = getCacheInfo('analyze', cacheKey);
                if (info) setCacheAge(info.age);
                trackCacheHit();
                return;
            }
        }

        setLoading(true);
        setError(null);
        setFromCache(false);
        trackRequest();
        const t0 = Date.now();

        const payload = activities.map(a => ({
            topic: a.dsaTopic || a.category,
            category: a.category,
            difficulty: a.difficulty || 'Medium',
            solved: a.problemSolved ?? false,
            date: a.date,
            timeSpent: a.duration,
        }));

        const data = await databaseAPI.analyzeProgress(payload as any, user?.username);
        const duration = Date.now() - t0;
        setLoading(false);
        setRan(true);

        if (data) {
            setResult(data);
            setCached('analyze', cacheKey, data);
            setCacheAge(0);
            trackSuccess(duration);
        } else {
            const errMsg = 'Could not reach the AI service. Check that OPENROUTER_API_KEY is set and the server is running.';
            setError(errMsg);
            trackFailure({ feature: 'analyze', error: errMsg, durationMs: duration });
        }
    }, [activities, user, cacheKey]);

    const handleForceRefresh = () => {
        invalidateCache('analyze', cacheKey);
        runAnalysis(true);
    };

    const localStats = buildLocalStats(activities);

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setShowAnalytics(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '8px 12px', color: '#555', fontSize: '0.75rem', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
                    >
                        <BarChart2 size={12} /> Stats
                    </button>
                    <button onClick={() => runAnalysis(false)}
                        disabled={loading || activities.length === 0 || !canUseAI}
                        className="btn-gold"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.875rem', opacity: (activities.length === 0 || !canUseAI) ? 0.4 : 1 }}
                    >
                        {loading
                            ? <><div className="spinner-gold" style={{ width: '14px', height: '14px', borderWidth: '2px' }} /> Analyzing…</>
                            : <><Sparkles size={14} /> {ran ? 'Re-analyze' : 'Analyze My Progress'}</>
                        }
                    </button>
                </div>
            </div>

            {/* Analytics panel */}
            <AnimatePresence>
                {showAnalytics && <AnalyticsBadge onClose={() => setShowAnalytics(false)} />}
            </AnimatePresence>

            {/* Empty state */}
            {activities.length === 0 && (
                <div className="card-dark" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.15 }}>◈</div>
                    <p style={{ color: '#555', fontSize: '0.9rem' }}>Log some activities first to enable AI analysis.</p>
                </div>
            )}

            {/* Quick stats */}
            {activities.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {[
                        { label: 'Total Solved', value: activities.filter(a => a.problemSolved).length, color: '#22c55e', icon: '✓' },
                        { label: 'Topics Covered', value: new Set(activities.map(a => a.dsaTopic || a.category)).size, color: '#818cf8', icon: '◎' },
                        { label: 'Hard Solved', value: activities.filter(a => a.difficulty === 'Hard' && a.problemSolved).length, color: '#ef4444', icon: '🔥' },
                        { label: 'Active Days', value: new Set(activities.map(a => a.date.slice(0, 10))).size, color: '#D4AF37', icon: '◆' },
                    ].map((s, i) => (
                        <div key={i} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{s.icon}</div>
                            <div>
                                <div className="kpi-number" style={{ color: s.color, fontSize: '1.5rem' }}>{s.value}</div>
                                <div className="kpi-sub">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Plan gate */}
            {!canUseAI && activities.length > 0 && <PremiumGate feature="AI Progress Analysis" showUsage />}

            {/* Error */}
            {error && canUseAI && (
                <div className="card-dark" style={{ padding: '16px 20px', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0 0 8px' }}>{error}</p>
                        <button onClick={() => runAnalysis(true)} style={{ fontSize: '0.78rem', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                            Retry →
                        </button>
                    </div>
                </div>
            )}

            {/* Loading skeleton */}
            <AnimatePresence>
                {loading && <AnalysisSkeleton />}
            </AnimatePresence>

            {/* AI Result */}
            <AnimatePresence>
                {result && !loading && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="section-gap">

                        {/* Cache badge */}
                        {fromCache && cacheAge !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '8px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)', width: 'fit-content' }}>
                                <Database size={11} color="#D4AF37" />
                                <span style={{ fontSize: '0.72rem', color: '#D4AF37' }}>Cached result · {fmtAge(cacheAge)}</span>
                                <button onClick={handleForceRefresh} style={{ fontSize: '0.68rem', color: '#555', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 4px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
                                >
                                    <RefreshCw size={10} /> Refresh
                                </button>
                            </div>
                        )}

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
                            <div className="card-dark" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <TrendingUp size={14} color="#22c55e" />
                                    <span className="card-title" style={{ color: '#22c55e' }}>Strengths</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {result.strengths.map((s, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 12px', borderRadius: '9px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                                            <ChevronRight size={13} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ fontSize: '0.84rem', color: '#EAEAEA', lineHeight: 1.5 }}>{s}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            <div className="card-dark" style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <AlertTriangle size={14} color="#f59e0b" />
                                    <span className="card-title" style={{ color: '#f59e0b' }}>Areas to Improve</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {result.weaknesses.map((w, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '9px 12px', borderRadius: '9px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.12)' }}>
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
                                        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderRadius: '11px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', transition: 'border-color 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.05)'}
                                        >
                                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 700, color: meta.color }}>{i + 1}</div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA' }}>{s.topic}</span>
                                                    <span style={{ fontSize: '0.65rem', padding: '1px 8px', borderRadius: '999px', fontWeight: 700, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>{meta.label}</span>
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
                                    <span style={{ fontSize: '0.65rem', color: '#555', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '1px 8px', borderRadius: '999px' }}>AI-picked</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                                    {result.nextProblems.map((p, i) => {
                                        const diffColor = p.difficulty === 'Easy' ? '#22c55e' : p.difficulty === 'Hard' ? '#ef4444' : '#f59e0b';
                                        const diffBg = p.difficulty === 'Easy' ? 'rgba(34,197,94,0.1)' : p.difficulty === 'Hard' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
                                        const leetUrl = `https://leetcode.com/problems/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;
                                        return (
                                            <motion.a key={i} href={leetUrl} target="_blank" rel="noopener noreferrer"
                                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                                style={{ display: 'block', padding: '14px 16px', borderRadius: '12px', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s', position: 'relative', overflow: 'hidden' }}
                                                whileHover={{ y: -2 }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${diffColor}40`}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}
                                            >
                                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${diffColor}50, transparent)` }} />
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{p.name}</span>
                                                    <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, color: diffColor, background: diffBg, border: `1px solid ${diffColor}30`, flexShrink: 0 }}>{p.difficulty}</span>
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#818cf8', marginBottom: '5px', fontWeight: 600 }}>{p.topic}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.4 }}>{p.reason}</div>
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                            {fromCache && cacheAge !== null && (
                                <span style={{ fontSize: '0.72rem', color: '#333', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={10} /> {fmtAge(cacheAge)}
                                </span>
                            )}
                            <button onClick={handleForceRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', transition: 'color 0.2s' }}
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
