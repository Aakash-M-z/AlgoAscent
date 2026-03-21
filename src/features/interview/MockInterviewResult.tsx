import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ── Score Ring (SVG Animated) ────────────────────────────────
const ScoreRing: React.FC<{
    score: number;
    label: string;
    color: string;
    size?: number;
    delay?: number;
}> = ({ score, label, color, size = 90, delay = 0 }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (animatedScore / 100) * circumference;

    useEffect(() => {
        const timer = setTimeout(() => {
            let start = 0;
            const duration = 1200;
            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const elapsed = timestamp - start;
                const current = Math.min(Math.floor((elapsed / duration) * score), score);
                setAnimatedScore(current);
                if (elapsed < duration) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, delay);
        return () => clearTimeout(timer);
    }, [score, delay]);

    const getColor = (val: number) => {
        if (val >= 80) return '#10B981';
        if (val >= 60) return '#D4AF37';  
        if (val >= 40) return '#F59E0B';
        return '#EF4444';
    };

    const ringColor = getColor(animatedScore);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"
                    />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke={ringColor}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - progress }}
                        transition={{ duration: 1.2, delay: delay / 1000, ease: 'easeOut' }}
                        style={{ filter: `drop-shadow(0 0 8px ${ringColor}60)` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white font-mono">{animatedScore}</span>
                </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">{label}</span>
        </div>
    );
};

// ── Hire Verdict Card ────────────────────────────────────────
const HireVerdictCard: React.FC<{
    verdict: string;
    confidence: number;
    reasoning: string;
}> = ({ verdict, confidence, reasoning }) => {
    const configs: Record<string, { label: string; color: string; bg: string; border: string; icon: string; glow: string }> = {
        STRONG_HIRE: {
            label: 'STRONG HIRE', color: 'text-emerald-300', bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/40', icon: '🏆', glow: 'shadow-[0_0_40px_rgba(16,185,129,0.2)]'
        },
        HIRE: {
            label: 'HIRE', color: 'text-green-400', bg: 'bg-green-500/10',
            border: 'border-green-500/30', icon: '✅', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.15)]'
        },
        BORDERLINE: {
            label: 'BORDERLINE', color: 'text-yellow-400', bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30', icon: '⚖️', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]'
        },
        NO_HIRE: {
            label: 'NO HIRE', color: 'text-red-400', bg: 'bg-red-500/10',
            border: 'border-red-500/30', icon: '❌', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]'
        }
    };

    const cfg = configs[verdict] || configs['BORDERLINE'];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
            className={`${cfg.bg} ${cfg.border} ${cfg.glow} border rounded-3xl p-8 text-center relative overflow-hidden`}
        >
            <div className="absolute inset-0 opacity-5">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="absolute text-white text-xl" style={{
                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, opacity: 0.3
                    }}>{cfg.icon}</div>
                ))}
            </div>
            <div className="relative z-10">
                <div className="text-5xl mb-4">{cfg.icon}</div>
                <div className={`text-3xl font-black mb-2 tracking-widest ${cfg.color}`}>{cfg.label}</div>
                <div className="text-white/40 text-xs uppercase tracking-widest mb-6">
                    Confidence: <span className={`font-black ${cfg.color}`}>{confidence}%</span>
                </div>
                <div className="max-w-lg mx-auto text-sm text-white/60 leading-relaxed italic border-t border-white/10 pt-6">
                    "{reasoning}"
                </div>
            </div>
        </motion.div>
    );
};

// ── Approach Quality Badge ───────────────────────────────────
const ApproachBadge: React.FC<{ quality: string }> = ({ quality }) => {
    const badges: Record<string, { label: string; color: string; bg: string }> = {
        OPTIMAL:      { label: 'Optimal Solution', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
        SUBOPTIMAL:   { label: 'Suboptimal Solution', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
        BRUTE_FORCE:  { label: 'Brute Force', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' }
    };
    const b = badges[quality] || badges['SUBOPTIMAL'];
    return (
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border ${b.bg} ${b.color}`}>
            <span className={`w-2 h-2 rounded-full ${quality === 'OPTIMAL' ? 'bg-emerald-400' : quality === 'BRUTE_FORCE' ? 'bg-red-400' : 'bg-yellow-400'} animate-pulse`} />
            {b.label}
        </span>
    );
};

// ── Complexity Comparison Table ──────────────────────────────
const ComplexityTable: React.FC<{ analysis: any }> = ({ analysis }) => {
    if (!analysis) return null;
    const rows = [
        { label: 'Time', yours: analysis.time, optimal: analysis.optimalTime },
        { label: 'Space', yours: analysis.space, optimal: analysis.optimalSpace }
    ];
    const isSame = (a: string, b: string) => a?.toLowerCase() === b?.toLowerCase();

    return (
        <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full">
                <thead className="bg-white/[0.03]">
                    <tr>
                        {['Metric', 'Your Solution', 'Optimal'].map(h => (
                            <th key={h} className="text-[10px] uppercase tracking-widest text-white/25 font-black p-4 text-left">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => (
                        <tr key={row.label} className="border-t border-white/5">
                            <td className="p-4 text-xs font-bold text-white/40 uppercase">{row.label}</td>
                            <td className="p-4">
                                <span className={`font-mono text-sm font-bold ${isSame(row.yours, row.optimal) ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    {row.yours || 'N/A'}
                                </span>
                            </td>
                            <td className="p-4">
                                <span className="font-mono text-sm font-bold text-emerald-400">{row.optimal || 'N/A'}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ── Main Result Page ─────────────────────────────────────────
const MockInterviewResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showIdeal, setShowIdeal] = useState(false);
    const [copied, setCopied] = useState(false);

    const result = location.state?.result;

    if (!result) {
        return (
            <div className="text-center mt-20 flex flex-col gap-4 items-center">
                <div className="text-5xl opacity-20">📭</div>
                <div className="text-red-400 font-bold">No interview result found.</div>
                <button onClick={() => navigate('/dashboard/interview')} className="mt-4 bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl text-white/70 hover:text-white transition-all text-sm">
                    Back to Interviews
                </button>
            </div>
        );
    }

    const { score, feedback, type, question } = result;
    
    // Support both old and new API shape
    const hireVerdict     = feedback?.hireVerdict     || 'BORDERLINE';
    const hireConfidence  = feedback?.hireConfidence  || 70;
    const hireReasoning   = feedback?.hireReasoning   || 'Performance was evaluated. See detailed breakdown below.';
    const approachQuality = feedback?.approachQuality || 'SUBOPTIMAL';
    const communication   = score?.communication       || 70;
    const stepFeedback    = feedback?.stepByStepFeedback || [];
    const resumeBullet    = feedback?.resumeBullet     || '';

    const handleCopyBullet = () => {
        if (resumeBullet) {
            navigator.clipboard.writeText(resumeBullet);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto section-gap pb-16">

            {/* Header */}
            <div className="text-center space-y-3">
                <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-block bg-[#D4AF37]/15 text-[#D4AF37] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]"
                >
                    {type} Interview Complete
                </motion.span>
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl font-black text-white tracking-tighter"
                >
                    Performance Report
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/30 text-sm"
                >
                    AI-powered evaluation by your senior interviewer
                </motion.p>
            </div>

            {/* Hire Verdict */}
            <HireVerdictCard verdict={hireVerdict} confidence={hireConfidence} reasoning={hireReasoning} />

            {/* Score Rings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card-dark p-8 border border-white/5"
            >
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Score Breakdown</h3>
                    <ApproachBadge quality={approachQuality} />
                </div>
                <div className="flex flex-wrap justify-around gap-8">
                    {[
                        { score: score?.overallScore || 0, label: 'Overall', delay: 0 },
                        { score: score?.correctness || 0, label: 'Correctness', delay: 150 },
                        { score: score?.optimization || 0, label: 'Optimization', delay: 300 },
                        { score: score?.clarity || 0, label: 'Code Clarity', delay: 450 },
                        { score: communication, label: 'Communication', delay: 600 },
                    ].map(s => (
                        <ScoreRing key={s.label} score={s.score} label={s.label} color="#D4AF37" delay={s.delay} />
                    ))}
                </div>
            </motion.div>

            {/* Complexity Comparison */}
            {feedback?.complexityAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card-dark p-8 border border-white/5"
                >
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-white/10" /> Complexity Analysis
                    </h3>
                    <ComplexityTable analysis={feedback.complexityAnalysis} />
                </motion.div>
            )}

            {/* Step-by-Step Feedback */}
            {stepFeedback.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="card-dark p-8 border border-blue-500/10"
                >
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/60 mb-6 flex items-center gap-3">
                        <span className="text-lg">🔬</span> Step-by-Step Analysis
                    </h3>
                    <div className="space-y-4">
                        {stepFeedback.map((step: string, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                                className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                            >
                                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs font-black text-blue-400 flex-shrink-0">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed">{step}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="card-dark p-8 border-l-4 border-emerald-500/50"
                >
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400/80 mb-6 flex items-center gap-2">
                        <span>💪</span> Strengths
                    </h3>
                    <ul className="space-y-3">
                        {(feedback?.strengths || []).map((str: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-white/60">
                                <span className="text-emerald-400 mt-0.5 flex-shrink-0">▸</span> {str}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 }}
                    className="card-dark p-8 border-l-4 border-red-500/50"
                >
                    <h3 className="text-sm font-black uppercase tracking-widest text-red-400/80 mb-6 flex items-center gap-2">
                        <span>🚨</span> Areas to Strengthen
                    </h3>
                    <ul className="space-y-3">
                        {(feedback?.weaknesses || []).map((w: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-white/60">
                                <span className="text-red-400 mt-0.5 flex-shrink-0">▸</span> {w}
                            </li>
                        ))}
                    </ul>
                </motion.div>
            </div>

            {/* Action Items */}
            {(feedback?.improvements || []).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="card-dark p-8 border border-indigo-500/20"
                >
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400/80 mb-6 flex items-center gap-2">
                        <span>🚀</span> Priority Action Items
                    </h3>
                    <div className="space-y-3">
                        {feedback.improvements.map((imp: string, i: number) => (
                            <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                                <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400 flex-shrink-0">{i + 1}</div>
                                <p className="text-sm text-white/60 leading-relaxed">{imp}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Resume Bullet */}
            {resumeBullet && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="card-dark p-8 border border-[#D4AF37]/20 bg-[#D4AF37]/[0.02]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#D4AF37]/80 flex items-center gap-2">
                            <span>📄</span> Resume Bullet Point
                        </h3>
                        <button
                            onClick={handleCopyBullet}
                            className="text-xs text-[#D4AF37]/60 hover:text-[#D4AF37] font-bold transition-colors border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 px-3 py-1.5 rounded-lg"
                        >
                            {copied ? '✓ Copied!' : 'Copy'}
                        </button>
                    </div>
                    <div className="p-4 rounded-xl bg-black/40 border border-[#D4AF37]/10">
                        <p className="text-white/70 text-sm leading-relaxed font-medium">• {resumeBullet}</p>
                    </div>
                    <p className="text-white/20 text-xs mt-3">Add this to your resume under Projects or Technical Skills.</p>
                </motion.div>
            )}

            {/* Ideal Solution Reveal */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="card-dark border border-white/5 overflow-hidden"
            >
                <button
                    onClick={() => setShowIdeal(s => !s)}
                    className="w-full flex items-center justify-between p-8 hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-lg">✨</span>
                        <div className="text-left">
                            <div className="text-sm font-black text-white uppercase tracking-widest">Ideal Solution</div>
                            <div className="text-xs text-white/30 mt-0.5">See the production-quality answer</div>
                        </div>
                    </div>
                    <div className={`transition-transform duration-300 text-white/30 ${showIdeal ? 'rotate-180' : ''}`}>▼</div>
                </button>

                <AnimatePresence>
                    {showIdeal && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="border-t border-white/5 p-6">
                                <SyntaxHighlighter
                                    language="javascript"
                                    style={oneDark}
                                    customStyle={{
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        background: '#0d0d0d',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                >
                                    {feedback?.idealAnswer || '// No ideal solution provided'}
                                </SyntaxHighlighter>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
            >
                <button
                    onClick={() => navigate('/dashboard/interview')}
                    className="bg-[#D4AF37] text-black font-black px-10 py-4 rounded-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] text-sm uppercase tracking-widest"
                >
                    Take Another Interview
                </button>
                <button
                    onClick={() => navigate('/dashboard/analytics')}
                    className="border border-white/10 text-white/60 hover:text-white font-bold px-8 py-4 rounded-xl hover:bg-white/5 transition-all text-sm"
                >
                    View My Analytics
                </button>
            </motion.div>
        </motion.div>
    );
};

export default MockInterviewResult;
