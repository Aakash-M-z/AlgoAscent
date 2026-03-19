import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, Crown } from 'lucide-react';
import { usePlan, AI_FREE_DAILY_LIMIT } from '../hooks/usePlan';

interface Props {
    feature?: string;
    children: React.ReactNode;
    /** If true, shows a usage counter instead of a hard lock */
    showUsage?: boolean;
}

/**
 * Wraps a feature and shows a premium lock overlay when the user
 * is on the free plan and has exhausted their daily AI quota.
 */
const PremiumGate: React.FC<Props> = ({ feature = 'This feature', children, showUsage = false }) => {
    const { canUseAI, isPremium, aiUsageToday, aiRemaining } = usePlan();

    // Admins and premium users always see the content
    if (isPremium) return <>{children}</>;

    // Free user still has quota — show content + optional usage badge
    if (canUseAI) {
        return (
            <div style={{ position: 'relative' }}>
                {children}
                {showUsage && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        marginTop: '8px', padding: '3px 10px', borderRadius: '999px',
                        background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                        fontSize: '0.68rem', color: '#D4AF37', fontWeight: 600,
                    }}>
                        <Zap size={10} />
                        {aiRemaining} AI {aiRemaining === 1 ? 'request' : 'requests'} left today (free plan)
                    </div>
                )}
            </div>
        );
    }

    // Free user exhausted quota — show lock overlay
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '28px 24px', borderRadius: '16px', textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))',
                border: '1px solid rgba(212,175,55,0.2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
            }}
        >
            <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Lock size={20} color="#D4AF37" />
            </div>

            <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '4px' }}>
                    Daily AI limit reached
                </div>
                <div style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.6, maxWidth: '320px' }}>
                    {feature} uses AI. Free plan allows <strong style={{ color: '#D4AF37' }}>{AI_FREE_DAILY_LIMIT} requests/day</strong>.
                    You've used {aiUsageToday} today. Resets at midnight.
                </div>
            </div>

            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '10px',
                background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)',
                fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37',
            }}>
                <Crown size={13} />
                Premium coming soon — unlimited AI access
            </div>
        </motion.div>
    );
};

export default PremiumGate;
