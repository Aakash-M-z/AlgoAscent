import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Zap, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { usePlan, AI_FREE_DAILY_LIMIT } from '../hooks/usePlan';
import { PricingModal } from './PricingModal';

interface Props {
    feature?: string;
    children?: React.ReactNode;
    /** If true, shows a usage counter instead of a hard lock */
    showUsage?: boolean;
}

/**
 * Wraps a feature and shows a premium lock overlay when the user
 * is on the free plan and has exhausted their daily AI quota.
 */
const PremiumGate: React.FC<Props> = ({ feature = 'This feature', children, showUsage = false }) => {
    const { canUseAI, isPremium, aiUsageToday, aiRemaining } = usePlan();
    const [pricingOpen, setPricingOpen] = useState(false);

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
                        background: 'rgba(255,59,31,0.08)', border: '1px solid rgba(255,59,31,0.25)',
                        fontSize: '0.68rem', color: '#FF3B1F', fontWeight: 600,
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
        <>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-7 rounded-2xl text-center bg-gradient-to-b from-[#FF3B1F]/[0.06] to-transparent border border-[#FF3B1F]/20 flex flex-col items-center gap-3 my-4"
            >
                <div className="w-12 h-12 rounded-2xl bg-[#FF3B1F]/10 border border-[#FF3B1F]/30 flex items-center justify-center text-[#FF3B1F]">
                    <Lock size={20} />
                </div>

                <div>
                    <div className="text-base font-bold text-white mb-1">
                        Daily AI Limit Reached
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed max-w-sm">
                        {feature} uses advanced AI. Free plan includes <strong className="text-[#FF3B1F]">{AI_FREE_DAILY_LIMIT} requests/day</strong>.
                        You've used {aiUsageToday} today. Upgrade for unlimited instant responses.
                    </div>
                </div>

                <button
                    onClick={() => setPricingOpen(true)}
                    className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF3B1F] hover:bg-[#ff553d] text-white text-xs font-bold transition-all shadow-lg shadow-[#FF3B1F]/25 cursor-pointer"
                >
                    <Crown size={14} />
                    <span>Upgrade to Pro — ₹299/mo</span>
                    <ArrowRight size={13} />
                </button>
            </motion.div>

            <PricingModal
                isOpen={pricingOpen}
                onClose={() => setPricingOpen(false)}
                initialPlan="annual"
            />
        </>
    );
};

export default PremiumGate;
