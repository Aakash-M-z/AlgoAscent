import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, BookOpen, RefreshCw, ExternalLink, ChevronRight, Zap, Target, AlertCircle } from 'lucide-react';
import { Activity } from '../types';
import { databaseAPI } from '../api/database';

interface Props {
    activities: Activity[];
    /** If provided, auto-fetches on mount */
    autoFetch?: boolean;
}

type Urgency = 'high' | 'medium' | 'low';

interface RecommendedProblem {
    id: string;
    number: number;
    name: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
    platform: string;
    tags: string[];
    reason: string;
    score: number;
    isNew: boolean;
}

interface RecommendationData {
    recommendedDifficulty: 'Easy' | 'Medium' | 'Hard';
    difficultyReason: string;
    topicPriority: { topic: string; reason: string; urgency: Urgency }[];
    problems: RecommendedProblem[];
}

/* ── Palette helpers ─────────────────────────────────────────── */
const DIFF_META = {
    Easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.22)' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)' },
    Hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.22)' },
};

const URGENCY_META: Record<Urgency, { color: string; label: string }> = {
    high: { color: '#ef4444', label: 'High Priority' },
    medium: { color: '#f59e0b', label: 'Review' },
    low: { color: '#818cf8', label: 'Explore' },
};

const DiffBadge: React.FC<{ d: 'Easy' | 'Medium' | 'Hard' }> = ({ d }) => {
    const m = DIFF_META[d];
    return (
        <span style={{ fontSize: '0.65rem', padding: '2px 9px', borderRadius: '999px', fontWeight: 700, color: m.color, background: m.bg, border: `1px solid ${m.border}`, whiteSpace: 'nowrap' }}>
            {d}
        </span>
    );
};

const TagChip: React.FC<{ label: string }> = ({ label }) => (
    <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: '5px', color: '#555', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
        {label}
    </span>
);

/* ── Skeleton ────────────────────────────────────────────────── */
const Skeleton: React.FC<{ h?: number; w?: string }> = ({ h = 20, w = '100%' }) => (
    <div className="skeleton" style={{ height: `${h}px`, width: w, borderRadius: '8px' }} />
);

/* ── Problem card ────────────────────────────────────────────── */
const ProblemCard: React.FC<{ p: RecommendedProblem; index: number }> = ({ p, index }) => {
    const diff = DIFF_META[p.difficulty];
    const leetcodeUrl = `https://leetcode.com/problems/${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
                padding: '14px 16px', borderRadius: '12px',
                background: 'linear-gradient(145deg, #131313, #0f0f0f)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.2s, transform 0.2s',
                position: 'relative', overflow: 'hidden',
            }}
            whileHover={{ y: -2 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.25)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}
        >
            {/* Top shimmer on hover */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${diff.color}40, transparent)` }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Rank badge */}
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37' }}>
                    {index + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#444', fontWeight: 500 }}>#{p.number}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>{p.name}</span>
                        <DiffBadge d={p.difficulty} />
                        {p.isNew && (
                            <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: '999px', fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}>
                                NEW TOPIC
                            </span>
                        )}
                    </div>

                    {/* Topic + reason */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: '#818cf8', background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', padding: '1px 8px', borderRadius: '5px', fontWeight: 600 }}>{p.topic}</span>
                        <ChevronRight size={10} color="#333" />
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>{p.reason}</span>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {p.tags.slice(0, 4).map(t => <TagChip key={t} label={t} />)}
                    </div>
                </div>

                {/* LeetCode link */}
                <a href={leetcodeUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#333', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: 'color 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#333'}
                    title="Open on LeetCode"
                >
                    <ExternalLink size={13} />
                </a>
            </div>
        </motion.div>
    );
};

/* ── Main component ──────────────────────────────────────────── */
const RecommendationEngine: React.FC<Props> = ({ activities, autoFetch = false }) => {
    const [data, setData] = useState<RecommendationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ran, setRan] = useState(false);
    const [diffFilter, setDiffFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
    const [topicFilter, setTopicFilter] = useState<string>('All');

    const fetch = useCallback(async () => {
        if (activities.length === 0) return;
        setLoading(true);
        setError(null);
        const result = await databaseAPI.getRecommendations(activities as any);
        setLoading(false);
        setRan(true);
        if (result) {
            setData(result);
            setDiffFilter(result.recommendedDifficulty);
        } else {
            setError('Could not reach the recommendation service. Make sure the server is running.');
        }
    }, [activities]);

    useEffect(() => { if (autoFetch && activities.length > 0) fetch(); }, [autoFetch]);

    const filteredProblems = data?.problems.filter(p => {
        if (diffFilter !== 'All' && p.difficulty !== diffFilter) return false;
        if (topicFilter !== 'All' && p.topic !== topicFilter) return false;
        return true;
    }) ?? [];

    const availableTopics = data ? ['All', ...new Set(data.problems.map(p => p.topic))] : ['All'];

    return (
        <div className="animate-fadeIn section-gap">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 className="page-heading" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Sparkles size={20} color="#D4AF37" />
                        Smart Recommendations
                    </h2>
                    <p className="page-subheading">Personalized problems based on your history</p>
                </div>
                <button
                    onClick={fetch}
                    disabled={loading || activities.length === 0}
                    className="btn-gold"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '0.875rem', opacity: activities.length === 0 ? 0.4 : 1 }}
                >
                    {loading
                        ? <><div className="spinner-gold" style={{ width: '13px', height: '13px', borderWidth: '2px' }} /> Generating…</>
                        : <><RefreshCw size={13} /> {ran ? 'Refresh' : 'Get Recommendations'}</>
                    }
                </button>
            </div>

            {/* Empty state */}
            {activities.length === 0 && (
                <div className="card-dark" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <BookOpen size={28} color="#333" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#555', fontSize: '0.9rem' }}>Log some activities first to get personalized recommendations.</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="card-dark" style={{ padding: '14px 18px', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                </div>
            )}

            {/* Loading skeletons */}
            {loading && (
                <div className="section-gap">
                    <div className="card-dark" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <Skeleton h={14} w="40%" />
                        <Skeleton h={40} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                        {[...Array(3)].map((_, i) => <Skeleton key={i} h={80} />)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[...Array(6)].map((_, i) => <Skeleton key={i} h={72} />)}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {data && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="section-gap"
                    >
                        {/* ── Difficulty recommendation banner ── */}
                        <div className="card-dark" style={{ padding: '18px 22px', borderColor: `${DIFF_META[data.recommendedDifficulty].border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: DIFF_META[data.recommendedDifficulty].bg, border: `1px solid ${DIFF_META[data.recommendedDifficulty].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <TrendingUp size={16} color={DIFF_META[data.recommendedDifficulty].color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                        <span className="card-title" style={{ color: DIFF_META[data.recommendedDifficulty].color }}>Recommended Level</span>
                                        <DiffBadge d={data.recommendedDifficulty} />
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: '#888', margin: 0 }}>{data.difficultyReason}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Topic priority ── */}
                        {data.topicPriority.length > 0 && (
                            <div className="card-dark" style={{ padding: '18px 22px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <Target size={13} color="#D4AF37" />
                                    <span className="card-title">Topic Priorities</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                    {data.topicPriority.slice(0, 5).map((t, i) => {
                                        const u = URGENCY_META[t.urgency];
                                        return (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '9px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                                            >
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.color, flexShrink: 0, boxShadow: `0 0 6px ${u.color}` }} />
                                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#EAEAEA', minWidth: '120px' }}>{t.topic}</span>
                                                <span style={{ fontSize: '0.72rem', color: '#555', flex: 1 }}>{t.reason}</span>
                                                <span style={{ fontSize: '0.62rem', padding: '1px 8px', borderRadius: '999px', color: u.color, background: `${u.color}15`, border: `1px solid ${u.color}30`, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {u.label}
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Problem list ── */}
                        <div className="card-dark" style={{ padding: '18px 22px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Zap size={13} color="#D4AF37" />
                                    <span className="card-title">Recommended Problems</span>
                                    <span style={{ fontSize: '0.68rem', color: '#555', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '1px 8px', borderRadius: '999px' }}>
                                        {filteredProblems.length} shown
                                    </span>
                                </div>

                                {/* Filters */}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {(['All', 'Easy', 'Medium', 'Hard'] as const).map(d => {
                                        const active = diffFilter === d;
                                        const meta = d !== 'All' ? DIFF_META[d] : null;
                                        return (
                                            <button key={d} onClick={() => setDiffFilter(d)}
                                                style={{
                                                    padding: '3px 11px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                                                    cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                                                    background: active ? (meta ? meta.bg : 'rgba(212,175,55,0.12)') : 'transparent',
                                                    borderColor: active ? (meta ? meta.border : 'rgba(212,175,55,0.35)') : 'rgba(255,255,255,0.07)',
                                                    color: active ? (meta ? meta.color : '#D4AF37') : '#555',
                                                }}>
                                                {d}
                                            </button>
                                        );
                                    })}
                                    <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.06)' }} />
                                    <select value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
                                        style={{ padding: '3px 10px', borderRadius: '7px', fontSize: '0.7rem', fontWeight: 600, background: topicFilter !== 'All' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${topicFilter !== 'All' ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.07)'}`, color: topicFilter !== 'All' ? '#818cf8' : '#555', cursor: 'pointer', outline: 'none', colorScheme: 'dark' }}>
                                        {availableTopics.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            {filteredProblems.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', color: '#444', fontSize: '0.875rem' }}>
                                    No problems match the current filters.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {filteredProblems.map((p, i) => (
                                        <ProblemCard key={p.id} p={p} index={i} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={fetch}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px', transition: 'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
                            >
                                <RefreshCw size={11} /> Refresh recommendations
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pre-run hint */}
            {!ran && !loading && activities.length > 0 && (
                <div className="card-dark" style={{ padding: '32px 24px', textAlign: 'center', borderStyle: 'dashed' }}>
                    <Sparkles size={26} color="#333" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: '#555', fontSize: '0.9rem', marginBottom: '6px' }}>Click "Get Recommendations" to generate your personalized problem list</p>
                    <p className="kpi-sub">Based on {activities.length} logged sessions · Dynamic difficulty · Topic gap analysis</p>
                </div>
            )}
        </div>
    );
};

export default RecommendationEngine;
