import React from 'react';
import { motion } from 'framer-motion';

/* ── Shimmer bar ─────────────────────────────────────────────── */
const Shimmer: React.FC<{ width?: string; height?: number; radius?: number; style?: React.CSSProperties }> = ({
    width = '100%', height = 16, radius = 6, style,
}) => (
    <div style={{
        width, height, borderRadius: radius,
        background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s infinite',
        ...style,
    }} />
);

/* ── Analysis skeleton (full page) ──────────────────────────── */
export const AnalysisSkeleton: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
    >
        {/* Assessment card */}
        <div className="card-dark" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Shimmer width="14px" height={14} radius={3} />
                <Shimmer width="160px" height={14} />
            </div>
            <Shimmer height={14} style={{ marginBottom: '8px' }} />
            <Shimmer width="85%" height={14} style={{ marginBottom: '8px' }} />
            <Shimmer width="70%" height={14} />
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Shimmer width="60%" height={12} />
            </div>
        </div>

        {/* Strengths + Weaknesses */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {[0, 1].map(i => (
                <div key={i} className="card-dark" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <Shimmer width="14px" height={14} radius={3} />
                        <Shimmer width="100px" height={14} />
                    </div>
                    {[0, 1, 2].map(j => (
                        <div key={j} style={{ padding: '9px 12px', borderRadius: '9px', background: 'rgba(255,255,255,0.02)', marginBottom: '8px' }}>
                            <Shimmer width={`${75 + j * 8}%`} height={13} />
                        </div>
                    ))}
                </div>
            ))}
        </div>

        {/* Suggestions */}
        <div className="card-dark" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Shimmer width="14px" height={14} radius={3} />
                <Shimmer width="200px" height={14} />
            </div>
            {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 16px', borderRadius: '11px', background: 'rgba(255,255,255,0.02)', marginBottom: '10px' }}>
                    <Shimmer width="28px" height={28} radius={8} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                            <Shimmer width="120px" height={13} />
                            <Shimmer width="60px" height={13} radius={999} />
                        </div>
                        <Shimmer width="80%" height={12} />
                    </div>
                </div>
            ))}
        </div>

        {/* Problems grid */}
        <div className="card-dark" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Shimmer width="14px" height={14} radius={3} />
                <Shimmer width="180px" height={14} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <Shimmer width="140px" height={13} />
                            <Shimmer width="50px" height={13} radius={999} />
                        </div>
                        <Shimmer width="80px" height={11} style={{ marginBottom: '6px' }} />
                        <Shimmer width="90%" height={11} />
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
);

/* ── Explain skeleton (modal body) ──────────────────────────── */
export const ExplainSkeleton: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}
    >
        <Shimmer height={13} />
        <Shimmer width="92%" height={13} />
        <Shimmer width="97%" height={13} />
        <Shimmer width="85%" height={13} />
        <div style={{ height: '12px' }} />
        <Shimmer height={13} />
        <Shimmer width="88%" height={13} />
        <Shimmer width="75%" height={13} />
        <div style={{ height: '12px' }} />
        <Shimmer height={13} />
        <Shimmer width="94%" height={13} />
        <Shimmer width="60%" height={13} />
        <div style={{ marginTop: '8px', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(212,175,55,0.3)', animation: 'pulse 1.2s ease-in-out infinite' }} />
                <span style={{ fontSize: '0.72rem', color: '#444' }}>AI is generating explanation…</span>
            </div>
        </div>
    </motion.div>
);

/* ── Inline mini skeleton (for small loading states) ─────────── */
export const InlineSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {Array.from({ length: lines }).map((_, i) => (
            <Shimmer key={i} width={i === lines - 1 ? '65%' : '100%'} height={12} />
        ))}
    </div>
);

export default Shimmer;
