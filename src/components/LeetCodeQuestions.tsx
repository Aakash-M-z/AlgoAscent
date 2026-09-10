import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { databaseAPI } from '../api/database';
import { Activity } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    activities: Activity[];
    onAddActivity: (activity: Partial<Activity>) => Promise<boolean>;
}

interface LeetCodeProblem {
    leetcodeId: number;
    title: string;
    slug: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    description?: string;
    url?: string;
}

const TOPICS = [
    'Arrays', 'Strings', 'Dynamic Programming', 'Math', 'Greedy',
    'Graphs', 'Binary Search', 'Trees', 'Two Pointers', 'Bit Manipulation',
    'Stacks', 'Heaps', 'Sliding Window', 'Linked Lists', 'Trie',
    'Backtracking', 'Design', 'Intervals'
];

const LeetCodeQuestions: React.FC<Props> = ({ activities, onAddActivity }) => {
    const [problems, setProblems] = useState<LeetCodeProblem[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProblems, setTotalProblems] = useState(0);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [topic, setTopic] = useState('');

    // Modal state for logging a solve
    const [loggingProblem, setLoggingProblem] = useState<LeetCodeProblem | null>(null);
    const [duration, setDuration] = useState(20);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Memoize solved titles to avoid array search inside the loop
    const solvedProblemTitles = useMemo(() => {
        return new Set(
            activities
                .filter(a => a.problemSolved)
                .map(a => (a.description || '').trim().toLowerCase())
        );
    }, [activities]);

    const fetchProblems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await databaseAPI.getProblems({
                difficulty,
                topic,
                search,
                page,
                limit: 10
            });
            setProblems(res.problems);
            setTotalPages(res.pagination.pages);
            setTotalProblems(res.pagination.total);
        } catch (err) {
            console.error('Failed to fetch problems', err);
        } finally {
            setLoading(false);
        }
    }, [difficulty, topic, search, page]);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    // Reset page on filter changes
    useEffect(() => {
        setPage(1);
    }, [difficulty, topic, search]);

    const handleLogSolveSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loggingProblem) return;
        setSubmitting(true);
        try {
            const success = await onAddActivity({
                date: new Date().toISOString(),
                category: loggingProblem.topic,
                duration: duration,
                description: loggingProblem.title,
                difficulty: (loggingProblem.difficulty.charAt(0).toUpperCase() + loggingProblem.difficulty.slice(1)) as any,
                platform: 'LeetCode',
                problemSolved: true,
                notes: notes || undefined
            });
            if (success) {
                setLoggingProblem(null);
                setNotes('');
                setDuration(20);
            }
        } catch (err) {
            console.error('Failed to log solve', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="card-dark" style={{ padding: '28px', marginTop: '24px', background: '#07070a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#EDEDED', letterSpacing: '-0.01em' }}>
                        LeetCode Problem Dataset
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>Browse, redirect, and track your solves directly</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8', padding: '4px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 500 }}>
                    {totalProblems} Problems Available
                </div>
            </div>

            {/* Filters Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {/* Search */}
                <div>
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: '#fff',
                          fontSize: '0.82rem',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                        }}
                        className="focus:border-[#6366f1]/40 focus:bg-white/[0.03]"
                    />
                </div>

                {/* Difficulty */}
                <div>
                    <select
                        value={difficulty}
                        onChange={e => setDifficulty(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: '#fff',
                          fontSize: '0.82rem',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        className="focus:border-[#6366f1]/40 focus:bg-white/[0.03]"
                    >
                        <option value="" style={{ background: '#0a0a0f' }}>All Difficulties</option>
                        <option value="easy" style={{ background: '#0a0a0f' }}>Easy</option>
                        <option value="medium" style={{ background: '#0a0a0f' }}>Medium</option>
                        <option value="hard" style={{ background: '#0a0a0f' }}>Hard</option>
                    </select>
                </div>

                {/* Topic */}
                <div>
                    <select
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        style={{
                          width: '100%',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: '#fff',
                          fontSize: '0.82rem',
                          outline: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        className="focus:border-[#6366f1]/40 focus:bg-white/[0.03]"
                    >
                        <option value="" style={{ background: '#0a0a0f' }}>All Topics</option>
                        {TOPICS.map(t => (
                            <option key={t} value={t} style={{ background: '#0a0a0f' }}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Questions Table/List */}
            <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', background: '#050508' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>ID</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Topic</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Difficulty</th>
                            <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#475569' }}>
                                    <div className="animate-pulse font-medium">Loading LeetCode questions...</div>
                                </td>
                            </tr>
                        ) : problems.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#475569' }}>
                                    No problems matched the search criteria.
                                </td>
                            </tr>
                        ) : (
                            problems.map(problem => {
                                const isSolved = solvedProblemTitles.has(problem.title.trim().toLowerCase());
                                return (
                                    <tr
                                        key={problem.leetcodeId}
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s' }}
                                        className="hover:bg-white/[0.015]"
                                    >
                                        <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 500 }}>{problem.leetcodeId}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <a
                                                href={problem.url || `https://leetcode.com/problems/${problem.slug}/`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#f1f5f9',
                                                    fontWeight: 600,
                                                    textDecoration: 'none',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                className="hover:text-[#818cf8] transition-colors"
                                            >
                                                {problem.title}
                                                <span style={{ fontSize: '0.72rem', opacity: 0.35 }}>↗</span>
                                            </a>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{problem.topic}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                fontSize: '0.68rem',
                                                padding: '3px 10px',
                                                borderRadius: '999px',
                                                fontWeight: 700,
                                                background: problem.difficulty === 'easy' ? 'rgba(34,197,94,0.06)' : problem.difficulty === 'medium' ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
                                                color: problem.difficulty === 'easy' ? '#4ade80' : problem.difficulty === 'medium' ? '#fbbf24' : '#f87171',
                                                textTransform: 'capitalize'
                                            }}>
                                                {problem.difficulty}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            {isSolved ? (
                                                <span style={{ color: '#4ade80', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                    ✓ <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Solved</span>
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setLoggingProblem(problem)}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.02)',
                                                        border: '1px solid rgba(255,255,255,0.08)',
                                                        color: '#e2e8f0',
                                                        padding: '6px 14px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    className="hover:bg-white hover:text-black hover:border-white hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                                                >
                                                    Mark Solved
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Row */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: page === 1 ? '#444' : '#fff',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: page === 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Previous
                    </button>
                    <span className="kpi-sub" style={{ fontSize: '0.78rem' }}>
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: page === totalPages ? '#444' : '#fff',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: page === totalPages ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Quick Log Solve Modal */}
            <AnimatePresence>
                {loggingProblem && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000,
                        padding: '16px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 15 }}
                            className="card-dark"
                            style={{
                                width: '100%',
                                maxWidth: '440px',
                                padding: '32px',
                                background: '#0d0d12',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px',
                                boxShadow: '0 24px 64px rgba(0,0,0,0.8)'
                            }}
                        >
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>
                                Log solved problem
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, marginBottom: '20px' }}>
                                {loggingProblem.title}
                            </p>

                            <form onSubmit={handleLogSolveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                                        Time Spent (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="600"
                                        value={duration}
                                        onChange={e => setDuration(parseInt(e.target.value, 10) || 0)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: '8px',
                                            padding: '10px 14px',
                                            color: '#fff',
                                            fontSize: '0.82rem',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                        className="focus:border-[#6366f1]/40 focus:bg-white/[0.03]"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                                        Solution Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        placeholder="e.g. Optimized the space complexity to O(1) by using two pointers..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            borderRadius: '8px',
                                            padding: '10px 14px',
                                            color: '#fff',
                                            fontSize: '0.82rem',
                                            resize: 'none',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                        }}
                                        className="focus:border-[#6366f1]/40 focus:bg-white/[0.03]"
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setLoggingProblem(null)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            color: '#94a3b8',
                                            padding: '8px 18px',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:text-white hover:border-white/20"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        style={{
                                            background: '#ffffff',
                                            border: 'none',
                                            color: '#040406',
                                            padding: '8px 22px',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        className="hover:bg-[#f1f5f9] hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] active:scale-95"
                                    >
                                        {submitting ? 'Logging...' : 'Log Solve'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeetCodeQuestions;
