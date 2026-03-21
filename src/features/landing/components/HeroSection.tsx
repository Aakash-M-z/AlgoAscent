import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';

interface HeroSectionProps {
    onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center pt-32 pb-16 overflow-hidden bg-black z-0">
            {/* Background elements - z-0 */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full animate-float opacity-40" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full animate-float opacity-30" style={{ animationDelay: '1s' }} />
                <div className="absolute inset-0 bg-[#080808]/20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(212,175,55,0.06) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Dark Overlay - z-5 */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-[5] opacity-60" />

            {/* Main Content - z-10 */}
            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-[0.2em] mb-8"
                >
                    <Sparkles size={14} className="animate-pulse" />
                    Revolutionizing Technical Preparation
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-black text-white mb-8 uppercase tracking-tighter leading-[0.9]"
                >
                    AI-Powered <span className="text-gold">Technical</span> <br />
                    Interview Platform
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-xl md:text-2xl text-white/40 max-w-4xl mx-auto mb-12 font-medium leading-relaxed"
                >
                    Master DSA, Operating Systems, DBMS, Computer Networks, and OOPS with an intelligent assistant, 
                    personalized mock interviews, and data-driven performance analytics.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <button
                        onClick={onGetStarted}
                        className="btn-gold group relative overflow-hidden text-lg px-8 py-4 rounded-2xl w-full sm:w-auto"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            Start Practicing <Play size={18} fill="currentColor" />
                        </span>
                    </button>
                    <button
                        onClick={onGetStarted}
                        className="px-8 py-4 text-white hover:text-gold font-bold uppercase tracking-[0.2em] text-sm border-b-2 border-white/5 hover:border-gold transition-all w-full sm:w-auto text-center"
                    >
                        Try Mock Interview
                    </button>
                </motion.div>

                {/* Platform preview mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="mt-20 relative mx-auto max-w-5xl group"
                >
                    <div className="absolute inset-0 bg-gold/10 blur-[100px] rounded-full group-hover:bg-gold/15 transition-all duration-700" />
                    <div className="card-dark p-2 border-white/10 rounded-3xl overflow-hidden shadow-3xl">
                        <div className="bg-[#0c0c0c] rounded-2xl overflow-hidden border border-white/5 aspect-video flex flex-col p-6 items-stretch">
                           {/* Dashboard UI Header Teaser */}
                           <div className="flex items-center justify-between mb-8">
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gold/20" />
                                    <div className="w-32 h-8 bg-white/5 rounded-lg" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 rounded-full bg-white/5" />
                                </div>
                           </div>

                           <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { label: 'Solve Rate', val: '84%', color: 'border-gold/20' },
                                    { label: 'Current Streak', val: '12 Days', color: 'border-white/5' },
                                    { label: 'Total XP', val: '14,250', color: 'border-white/5' }
                                ].map((s, i) => (
                                    <div key={i} className={`p-4 rounded-xl border ${s.color} bg-white/[0.02]`}>
                                        <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1">{s.label}</div>
                                        <div className="text-lg font-black text-white">{s.val}</div>
                                    </div>
                                ))}
                           </div>

                           <div className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                <div className="absolute top-4 left-6 text-[10px] font-bold text-white/20 uppercase tracking-widest">Growth Analytics</div>
                                <div className="flex gap-3 w-full h-full items-end pt-8">
                                    {[30, 45, 35, 65, 55, 85, 45, 75, 55, 95].map((h, i) => (
                                        <motion.div 
                                            key={i} 
                                            initial={{ height: 0 }}
                                            whileInView={{ height: `${h}%` }}
                                            transition={{ delay: 0.8 + i * 0.05, duration: 1 }}
                                            className="flex-1 bg-gradient-to-t from-gold/40 to-gold/5 rounded-t-lg border-x border-t border-gold/10" 
                                        />
                                    ))}
                                </div>
                           </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
