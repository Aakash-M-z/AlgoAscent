import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ArrowRight, UploadCloud, FileText, CheckCircle2, Clock, Sparkles, X, ChevronRight } from 'lucide-react';
import InterviewAnalyticsDashboard from '../admin/components/InterviewAnalyticsDashboard';
import AIMentorWidget from './components/AIMentorWidget';

const ROLES = [
    {
        id: 'Software Engineer',
        title: 'Software Engineer / SDE',
        desc: 'DSA, System Architecture, OOPs, OS, and Core Computer Science fundamentals.',
        icon: '💻',
        badge: 'Placement Core',
        skills: ['DSA', 'OOPs', 'OS', 'System Design']
    },
    {
        id: 'Frontend Engineer',
        title: 'Frontend Developer',
        desc: 'React, TypeScript, Web APIs, DOM performance, CSS architectures, and state flows.',
        icon: '⚡',
        badge: 'UI & Web',
        skills: ['React', 'TypeScript', 'DOM', 'JavaScript']
    },
    {
        id: 'Backend Engineer',
        title: 'Backend Developer',
        desc: 'Node.js/Express, Relational SQL, ACID, Redis caching, microservices, and concurrency.',
        icon: '🗄️',
        badge: 'Servers & DB',
        skills: ['Node.js', 'SQL / DBMS', 'ACID', 'APIs']
    },
    {
        id: 'Full Stack Engineer',
        title: 'Full Stack Developer',
        desc: 'End-to-end web apps: UI clients, backend APIs, database persistence, and Git workflows.',
        icon: '🚀',
        badge: 'End-to-End',
        skills: ['Full Stack', 'PostgreSQL', 'React', 'Git']
    },
    {
        id: 'DevOps & Cloud Engineer',
        title: 'DevOps & Cloud Engineer',
        desc: 'CI/CD pipelines, Docker containers, Linux OS, Git branching, and scalable infrastructure.',
        icon: '☁️',
        badge: 'Cloud & Infra',
        skills: ['Docker', 'CI/CD', 'Linux OS', 'Git']
    }
];

const MockInterviewPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [showReport, setShowReport] = useState(false);

    // Setup Wizard State
    const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [selectedRole, setSelectedRole] = useState('Software Engineer');
    const [selectedDuration, setSelectedDuration] = useState<10 | 15>(15);
    const [resumeText, setResumeText] = useState('');
    const [resumeFileName, setResumeFileName] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('Fresher / Entry Level');

    if (!user) {
        return <div className="p-8 text-center text-slate-500 bg-[#090b14] rounded-2xl border border-white/5">Loading...</div>;
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setResumeFileName(file.name);

        const reader = new FileReader();
        reader.onload = () => {
            const content = typeof reader.result === 'string' ? reader.result : '';
            setResumeText(content);
        };
        reader.readAsText(file);
    };

    const handleLaunchInterview = async () => {
        // Request fullscreen if supported
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch {
            // Fullscreen optional fallback
        }

        // Store config in sessionStorage for MockInterviewSession
        const sessionConfig = {
            role: selectedRole,
            duration: selectedDuration,
            resumeText,
            resumeFileName,
            experienceLevel,
            startedAt: Date.now(),
        };
        sessionStorage.setItem('active_mock_session', JSON.stringify(sessionConfig));

        setIsSetupModalOpen(false);
        navigate('/dashboard/interview/start');
    };

    if (user.role === 'admin') {
        return (
            <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-6 w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                            <span>📈</span> Interview Analytics
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">View global mock interview performance and statistics.</p>
                    </div>
                    {showReport && (
                        <button 
                            onClick={() => setShowReport(false)}
                            className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
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
                            className="p-8 md:p-14 text-center rounded-3xl bg-[#090a12]/90 border border-white/[0.08] shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden backdrop-blur-xl"
                        >
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Global Analytics Portal</h3>
                            <p className="text-slate-400 text-xs max-w-md mx-auto mb-8 leading-relaxed">
                                Monitor user success rates, common failure points, and AI scoring trends across all mock interviews.
                            </p>
                            <button 
                                onClick={() => setShowReport(true)}
                                className="px-8 py-3 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                            >
                                Generate Deep Report
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
        <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="space-y-6 w-full font-sans">
            <div>
                <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white text-xs">🎤</span>
                    Mock Interview
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Practice DSA algorithms, system projects, and placement questions in real time.</p>
            </div>
            
            {/* ── HERO INTERVIEW LAUNCH CARD ─────────────────── */}
            <div className="p-8 md:p-12 text-center rounded-2xl bg-[#090b14] border border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
                {/* Subtle dark ambient glow */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-[#FF3B1F]/10 rounded-full blur-[100px] pointer-events-none" />

                {/* AI Bot Frame */}
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#121422] border border-white/15 flex items-center justify-center mb-5 shadow-inner">
                    <Bot className="w-8 h-8 text-zinc-300" />
                </div>
                
                <h3 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight mb-2.5">
                    Ready for your Technical Interview?
                </h3>
                <p className="text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed">
                    Select your role, upload your resume, and enter an immersive live AI technical interview session covering project architecture, core CS, 1 live coding challenge, and behavioral questions.
                </p>
                
                {/* Action CTA Button */}
                <button 
                    onClick={() => {
                        setCurrentStep(1);
                        setIsSetupModalOpen(true);
                    }} 
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#FF3B1F] text-white font-medium text-xs sm:text-sm hover:bg-[#E63219] transition-all shadow-md shadow-[#FF3B1F]/20 active:scale-95 cursor-pointer"
                >
                    <span>Start Interview</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
                
                {/* Feature Status Pills */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span> 
                        Voice & Microphone Audio
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"></span> 
                        Resume Deep Dive
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]"></span> 
                        1 Live DSA Code Editor
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span> 
                        Core CS (OOPs, OS, SQL, CN, Git)
                    </span>
                </div>
            </div>

            {/* ── INTERACTIVE 3-STEP SETUP WIZARD MODAL ───────────────────── */}
            <AnimatePresence>
                {isSetupModalOpen && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[999] overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-[#090b14] border border-white/[0.12] shadow-[0_0_80px_rgba(0,0,0,0.9)] relative my-8"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-5 border-b border-white/[0.08]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-lg">
                                        🤖
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-lg text-white">
                                            Placement Interview Setup
                                        </h3>
                                        <p className="text-xs text-slate-400">Step {currentStep} of 3 • Customizing your live interview</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsSetupModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Step Indicators */}
                            <div className="grid grid-cols-3 gap-2 my-5">
                                {[
                                    { step: 1, label: '1. Select Role' },
                                    { step: 2, label: '2. Resume & Context' },
                                    { step: 3, label: '3. Duration & Mode' },
                                ].map(s => (
                                    <div
                                        key={s.step}
                                        onClick={() => setCurrentStep(s.step as any)}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                                            currentStep === s.step
                                                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                                : currentStep > s.step
                                                ? 'bg-white/[0.06] text-white border-white/20'
                                                : 'bg-white/[0.02] text-slate-500 border-white/[0.05]'
                                        }`}
                                    >
                                        {s.label}
                                    </div>
                                ))}
                            </div>

                            {/* ── STEP 1: ROLE SELECTION ──────────────────────── */}
                            {currentStep === 1 && (
                                <div className="space-y-3 py-2">
                                    <p className="text-xs text-slate-400 font-medium">Choose the engineering position you are interviewing for:</p>
                                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                                        {ROLES.map(role => {
                                            const isSelected = selectedRole === role.id;
                                            return (
                                                <div
                                                    key={role.id}
                                                    onClick={() => setSelectedRole(role.id)}
                                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                                        isSelected
                                                            ? 'bg-[#151726] border-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                                            : 'bg-[#0f111c]/60 border-white/[0.06] hover:bg-[#121422] hover:border-white/15'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl p-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">{role.icon}</span>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-sm text-white">{role.title}</h4>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 border border-white/10 font-mono">
                                                                    {role.badge}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{role.desc}</p>
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {role.skills.map((sk, idx) => (
                                                                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.03] text-slate-300 border border-white/5">
                                                                        #{sk}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-1 ${
                                                        isSelected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-white/20'
                                                    }`}>
                                                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 2: RESUME UPLOAD & CONTEXT ─────────────── */}
                            {currentStep === 2 && (
                                <div className="space-y-4 py-2">
                                    <div>
                                        <label className="block text-xs font-bold text-white mb-1.5">
                                            Upload Resume / Project Summary <span className="text-slate-400 font-normal">(Optional but recommended)</span>
                                        </label>
                                        <p className="text-xs text-slate-400 mb-3">
                                            The AI interviewer will ask tailored questions regarding the real projects and technologies mentioned in your resume.
                                        </p>

                                        {/* File Drop Area */}
                                        <div className="relative border-2 border-dashed border-white/15 hover:border-indigo-400/50 rounded-2xl p-5 text-center bg-white/[0.02] transition-colors">
                                            <input
                                                type="file"
                                                accept=".txt,.pdf,.docx,.doc,.md"
                                                onChange={handleFileUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                            {resumeFileName ? (
                                                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                                                    <FileText className="w-4 h-4" />
                                                    <span>Loaded: {resumeFileName}</span>
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-300">
                                                    <span className="font-bold text-white">Click to upload</span> or drag and drop (.txt, .pdf, .docx, .md)
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Or Paste Raw Text */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                            Or Paste Resume Text / Key Projects:
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={resumeText}
                                            onChange={e => setResumeText(e.target.value)}
                                            placeholder="Example: Built full-stack e-commerce app with React, Node.js, and Redis caching. Optimized query performance by 40% with database indexing..."
                                            className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-400/80 resize-none font-mono"
                                        />
                                    </div>

                                    {/* Experience Level Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                                            Candidate Experience Level:
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Fresher / Entry Level', '1-3 Years Experience', '3+ Years / Senior'].map(lvl => (
                                                <button
                                                    key={lvl}
                                                    type="button"
                                                    onClick={() => setExperienceLevel(lvl)}
                                                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                                        experienceLevel === lvl
                                                            ? 'bg-white/[0.12] border-indigo-400 text-white'
                                                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 3: DURATION & PILLARS ──────────────────── */}
                            {currentStep === 3 && (
                                <div className="space-y-4 py-2">
                                    <div>
                                        <label className="block text-xs font-bold text-white mb-2">
                                            Session Duration:
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => setSelectedDuration(10)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                                    selectedDuration === 10
                                                        ? 'bg-[#151726] border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                                        : 'bg-[#0f111c]/60 border-white/[0.06] hover:bg-[#121422]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 font-extrabold text-sm text-white">
                                                    <Clock className="w-4 h-4 text-amber-400" />
                                                    <span>10 Mins Sprint</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                    Fast-paced, high-yield placement sprint: 1 project probe, 2 core CS questions, 1 quick coding problem.
                                                </p>
                                            </div>

                                            <div
                                                onClick={() => setSelectedDuration(15)}
                                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                                    selectedDuration === 15
                                                        ? 'bg-[#151726] border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                                        : 'bg-[#0f111c]/60 border-white/[0.06] hover:bg-[#121422]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 font-extrabold text-sm text-white">
                                                    <Clock className="w-4 h-4 text-emerald-400" />
                                                    <span>15 Mins Standard</span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                    Comprehensive placement round: Deep project defense, multi-topic Core CS, live coding & complexity breakdown.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Topics Included Summary */}
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
                                        <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>Full Round Topics Covered:</span>
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                <span>Resume Project Architecture</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                                                <span>1 Live DSA Coding Problem</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                                <span>Core CS: OOPs & OS</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                                <span>DBMS/SQL, CN & Git</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-white/[0.08]">
                                {currentStep > 1 ? (
                                    <button
                                        onClick={() => setCurrentStep((currentStep - 1) as any)}
                                        className="py-2.5 px-5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-xs font-bold hover:bg-white/[0.12] transition-all"
                                    >
                                        Back
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsSetupModalOpen(false)}
                                        className="py-2.5 px-5 rounded-xl bg-white/[0.04] text-slate-400 text-xs font-bold hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}

                                {currentStep < 3 ? (
                                    <button
                                        onClick={() => setCurrentStep((currentStep + 1) as any)}
                                        className="py-2.5 px-6 rounded-xl bg-white text-black text-xs font-extrabold hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                    >
                                        <span>Next Step</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleLaunchInterview}
                                        className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-500 text-black text-xs font-black hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95"
                                    >
                                        <span>Launch Fullscreen Interview</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Mentor Widget */}
            <AIMentorWidget />
        </motion.div>
    );
};

export default MockInterviewPage;

