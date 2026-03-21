import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import InterviewAnalyticsDashboard from '../admin/components/InterviewAnalyticsDashboard';
import AIMentorWidget from './components/AIMentorWidget';

const MockInterviewPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showReport, setShowReport] = useState(false);

    // 5. Debugging: Log user object to verify role
    console.log('[MockInterviewPage] Current User:', user);

    if (!user) {
        return <div className="p-8 text-center text-gray-500 card-dark">Loading...</div>;
    }

    if (user.role === 'admin') {
        return (
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="section-gap">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="page-heading">📈 Interview Analytics</h2>
                        <p className="page-subheading text-gray-400">View global mock interview performance and statistics.</p>
                    </div>
                    {showReport && (
                        <button 
                            onClick={() => setShowReport(false)}
                            className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all"
                        >
                            Reset View
                        </button>
                    )}
                </div>
                
                <AnimatePresence mode="wait">
                    {!showReport ? (
                        <motion.div 
                            key="placeholder"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="card-dark p-8 md:p-12 text-center border border-dashed border-white/20 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.01] to-transparent pointer-events-none" />
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Global Analytics Portal</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                                Monitor user success rates, common failure points, and AI scoring trends across all mock interviews.
                            </p>
                            <button 
                                onClick={() => setShowReport(true)}
                                className="group relative bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 px-10 py-3 rounded-xl text-gold font-black transition-all shadow-[0_0_20px_rgba(212,175,55,0.05)] tracking-widest text-xs uppercase overflow-hidden"
                            >
                                <span className="relative z-10">Generate Deep Report</span>
                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </button>
                        </motion.div>
                    ) : (
                        <InterviewAnalyticsDashboard key="dashboard" />
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="section-gap">
            <div>
                <h2 className="page-heading">🎤 Mock Interview</h2>
                <p className="page-subheading text-gray-400">Practice your DSA skills with our real-time AI interivewer.</p>
            </div>
            
            <div className="card-dark p-8 md:p-12 text-center border border-[#D4AF37]/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
                
                <div className="w-20 h-20 mx-auto bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-6 border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                    <span className="text-3xl">🤖</span>
                </div>
                
                <h3 className="text-2xl font-black text-white mb-3">Ready for your interview?</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Our AI will simulate a real technical interview environment. You'll be asked an algorithmic question, and you'll need to explain your thought process and code it live.
                </p>
                
                <button onClick={() => navigate('/dashboard/interview/start')} className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-extrabold px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transform hover:-translate-y-0.5 transition-all text-lg tracking-wide">
                    Start Interview
                </button>
                
                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Live Audio</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Code Editor</span>
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Real-time Feedback</span>
                </div>
            </div>

            {/* AI Mentor Widget */}
            <AIMentorWidget />
        </motion.div>
    );
};

export default MockInterviewPage;
