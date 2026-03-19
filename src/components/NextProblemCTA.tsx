import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ExternalLink, RefreshCw, ChevronRight } from 'lucide-react';
import { Activity } from '../types';
import { databaseAPI } from '../api/database';

interface Props { activities: Activity[]; }

interface Problem {
    number: number;
    name: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
    reason: string;
    score: number;
}

const DIFF_COLOR: Record<string, string> = {
    Easy: '#22c55e',
    Medium: '#f59e0b',
    Hard: '#ef4444',
};

const NextProblemCTA: React.FC<Props> = ({ activities }) => {
    const [problem, setProblem] = useState<Problem | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const fetchNext = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const result = await databaseAPI.getRecommendations(activities as any);
            if (result && result.problems.length > 0) {
                const top = result.problems[0];
                setProblem({ number: top.number, name: top.name, difficulty: top.difficulty, topic: top.topic, reason: top.reason, score: top.score });
            } else {
                setError(true);
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [activities]);

    useEffect(() => { fetchNext(); }, []);

    const leetcodeUrl = problem
        ? `https://leetcode.com/problems/${problem.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/`
        : '#';

    const diffColor = problem ? (DIFF_COLOR[problem.difficulty] ?? '#D4AF37') : '#D4AF37';

    return (
        <motion.div
            className="card-dark"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ padding: '18px 22px', borderColor: 'rgba(212,175,55,0.2)', position: 'relative', overflow: 'hidden' }}
        >
            {/* Gold glow */}
            <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={14} color="#D4AF37" />
                </div>
                <div className="card-title" style={{ flex: 1, lineHeight: 1 }}>Solve Next Recommended Problem</div>
                <button
                    onClick={fetchNext}
                    disabled={loading}
                    title="Refresh recommendation"
                    style={{ background: 'none', border: 'none', color: '#444', cursor: loading ? 'not-allowed' : 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.color = '#D4AF37')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#444')}
                >
                    <motion.div animate={loading ? { rotate: 360 } : { rotate: 0 }} transition={loading ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : {}}>
                        <RefreshCw size={13} />
                    </motion.div>
                </button>
            </div>

            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 0' }}>
                        <div className="spinner-gold" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                        <span style={{ fontSize: '0.82rem', color: '#444' }}>Finding your best next problem…</span>
                    </motion.div>
                )}

                {!loading && error && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ fontSize: '0.82rem', color: '#555', padding: '10px 0' }}>
                        Could not load recommendation. <button onClick={fetchNext} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.82rem', padding: 0 }}>Retry →</button>
                    </motion.div>
                )}

                {!loading && problem && (
                    <motion.div key={problem.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                        {/* Problem card */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 16px', borderRadius: '12px', background: `${diffColor}08`, border: `1px solid ${diffColor}20`, marginBottom: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${diffColor}15`, border: `1px solid ${diffColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 800, color: diffColor }}>
                                #{problem.number}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#EAEAEA' }}>{problem.name}</span>
                                    <span style={{ fontSize: '0.68rem', padding: '1px 8px', borderRadius: '999px', fontWeight: 700, background: `${diffColor}15`, color: diffColor }}>{problem.difficulty}</span>
                                    <span style={{ fontSize: '0.68rem', padding: '1px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.04)', color: '#555', border: '1px solid rgba(255,255,255,0.06)' }}>{problem.topic}</span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: '#666', margin: 0, lineHeight: 1.5 }}>{problem.reason}</p>
                            </div>
                        </div>

                        {/* CTA button */}
                        <motion.a
                            href={leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '11px 20px', borderRadius: '10px', textDecoration: 'none',
                                background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))',
                                border: '1px solid rgba(212,175,55,0.35)',
                                color: '#D4AF37', fontWeight: 700, fontSize: '0.875rem',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.14))'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.55)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08))'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.35)'; }}
                        >
                            <Zap size={14} />
                            Solve Now on LeetCode
                            <ExternalLink size={12} style={{ opacity: 0.6 }} />
                            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default NextProblemCTA;
