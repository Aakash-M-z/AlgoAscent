import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, ShieldCheck, Sparkles, HelpCircle, ArrowRight, Zap, Code, Users, BookOpen } from 'lucide-react';
import { PricingModal } from '../components/PricingModal';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { Link } from 'react-router-dom';

export const PricingPage: React.FC = () => {
    const { user } = useAuth();
    const { isPremium } = usePlan();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('annual');

    const openCheckout = (plan: 'monthly' | 'annual' | 'lifetime') => {
        setSelectedPlan(plan);
        setModalOpen(true);
    };

    const faqs = [
        {
            q: 'Which payment methods are supported?',
            a: 'We support all major UPI apps including Google Pay, PhonePe, Paytm, and BHIM via direct QR transfer with swift verification by our team.'
        },
        {
            q: 'Can I cancel or change my plan later?',
            a: 'Yes, your subscription remains active until the end of your billing cycle. You will never be charged surprise fees, and lifetime passes never expire.'
        },
        {
            q: 'What is included in the AI Mock Interview system?',
            a: 'Pro members get unlimited full-length technical coding and behavioral mock interviews with our AI engineering interviewer, detailed feedback reports, time complexity analysis, and communication scorecards.'
        },
        {
            q: 'Is there a student discount?',
            a: 'Our Pro Annual plan already includes an automatic 30% discount compared to monthly billing to make it super affordable for campus students and job seekers.'
        }
    ];

    return (
        <div className="min-h-screen bg-[#070709] text-white pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden font-sans">
            {/* Background Ambient Glows */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF3B1F]/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Hero Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FF3B1F]/15 text-[#FF3B1F] border border-[#FF3B1F]/30 mb-3"
                    >
                        <Crown size={13} /> Flexible & Transparent Pricing
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl sm:text-4xl font-semibold text-zinc-100 tracking-tight mb-3"
                    >
                        Invest in Your Engineering Career
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed"
                    >
                        Master data structures, algorithms, and technical interviews with AI-guided acceleration. Choose the plan that best fits your prep goals.
                    </motion.p>
                </div>

                {/* Plan Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {/* Monthly */}
                    <div className="p-7 rounded-2xl bg-[#0E0E14] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all">
                        <div>
                            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Monthly</div>
                            <h3 className="text-lg font-semibold text-zinc-100 mb-1.5">Pro Monthly</h3>
                            <p className="text-xs text-zinc-400 mb-6">
                                Month-to-month access for active interview sprint preparation.
                            </p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl sm:text-4xl font-bold text-zinc-100">₹299</span>
                                <span className="text-xs text-zinc-500 font-medium">/ month</span>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-white/10">
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Unlimited AI Code Explanations</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Unlimited AI Mock Interviews</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Full Assessment Studio & Reports</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Spaced Repetition Review Engine</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <button
                                onClick={() => openCheckout('monthly')}
                                className="w-full py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white transition-all cursor-pointer"
                            >
                                {isPremium ? 'Renew Monthly' : 'Get Monthly Pro'}
                            </button>
                        </div>
                    </div>

                    {/* Annual (Featured) */}
                    <div className="relative p-7 rounded-2xl bg-[#14141E] border-2 border-[#FF3B1F] shadow-2xl shadow-[#FF3B1F]/15 flex flex-col justify-between">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#FF3B1F] text-white shadow-lg">
                            Most Popular • Save 30%
                        </div>

                        <div>
                            <div className="text-[11px] font-semibold text-[#FF3B1F] uppercase tracking-wider mb-2">Annual Pack</div>
                            <h3 className="text-lg font-semibold text-zinc-100 mb-1.5">Pro Annual</h3>
                            <p className="text-xs text-zinc-400 mb-6">
                                Full-year complete interview mastery with top-tier AI processing.
                            </p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl sm:text-4xl font-bold text-zinc-100">₹2,499</span>
                                <span className="text-xs text-zinc-500 font-medium">/ year (₹208/mo)</span>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-white/10">
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span className="font-medium text-zinc-200">Everything in Monthly Pro</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Priority AI GPU Queue (Zero lag)</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Verified Pro Crown Badge on Profile</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Unlimited Assessment Creation & Sharing</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-zinc-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Curated FAANG / Top-Tier Question Sets</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <button
                                onClick={() => openCheckout('annual')}
                                className="w-full py-3 rounded-xl font-medium text-xs bg-[#FF3B1F] hover:bg-[#E63219] text-white transition-all shadow-md shadow-[#FF3B1F]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <span>{isPremium ? 'Extend 1 Year' : 'Upgrade to Annual Pro'}</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Lifetime */}
                    <div className="p-7 rounded-2xl bg-[#0E0E14] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all">
                        <div>
                            <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Lifetime</div>
                            <h3 className="text-lg font-semibold text-zinc-100 mb-1.5">Lifetime Pass</h3>
                            <p className="text-xs text-zinc-400 mb-6">
                                One single payment for lifetime access and all future updates.
                            </p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl sm:text-4xl font-bold text-zinc-100">₹4,999</span>
                                <span className="text-xs text-zinc-500 font-medium">one-time</span>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-white/10">
                                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span className="font-semibold text-white">Lifetime Access to all Pro features</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>All Future Products & AI Models</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>Exclusive Elite Community Role</span>
                                </div>
                                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                                    <Check size={15} className="text-[#FF3B1F] shrink-0 mt-0.5" />
                                    <span>VIP Developer Support</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <button
                                onClick={() => openCheckout('lifetime')}
                                className="w-full py-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer"
                            >
                                Get Lifetime Access
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trust & Guarantee Banner */}
                <div className="p-8 rounded-2xl bg-[#0E0E14] border border-white/10 mb-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FF3B1F]/10 border border-[#FF3B1F]/20 flex items-center justify-center text-[#FF3B1F] shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Razorpay Secure Checkout</h4>
                            <p className="text-xs text-gray-400">256-bit encrypted banking standards</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FF3B1F]/10 border border-[#FF3B1F]/20 flex items-center justify-center text-[#FF3B1F] shrink-0">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Instant Account Activation</h4>
                            <p className="text-xs text-gray-400">No waiting time, instant feature unlock</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FF3B1F]/10 border border-[#FF3B1F]/20 flex items-center justify-center text-[#FF3B1F] shrink-0">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">State-of-the-Art AI</h4>
                            <p className="text-xs text-gray-400">Fine-tuned DSA interview models</p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h3>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="p-5 rounded-xl bg-[#0E0E14] border border-white/10">
                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <HelpCircle size={15} className="text-[#FF3B1F]" />
                                    {faq.q}
                                </h4>
                                <p className="text-xs text-gray-400 leading-relaxed pl-6">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Modal */}
            <PricingModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialPlan={selectedPlan}
            />
        </div>
    );
};
