import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockInterviewApi } from '../../api/mockInterviewApi';
import { motion, AnimatePresence } from 'framer-motion';

import CodeEnvironment from './components/CodeEnvironment';

type Message = {
    id: string;
    role: 'ai' | 'user';
    content: string;
    isCode?: boolean;
};

type Phase = 'START' | 'APPROACH' | 'APPROACH_EVALUATION' | 'CODING' | 'FOLLOW_UP' | 'EVALUATING';

const MockInterviewSession = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState('DSA');
    const [question, setQuestion] = useState('');
    const [testCases, setTestCases] = useState<any[]>([]);
    const [initialCodes, setInitialCodes] = useState<Record<string, string>>({});
    const [functionName, setFunctionName] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [tags, setTags] = useState<string[]>([]);
    const [company, setCompany] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>('START');
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Timer
    const [timeLeft, setTimeLeft] = useState(45 * 60);
    
    // Inputs
    const [approachInput, setApproachInput] = useState('');
    const [approachEvaluation, setApproachEvaluation] = useState('');
    const [codeInput, setCodeInput] = useState('');
    const [followUpInput, setFollowUpInput] = useState('');
    const [followUpQuestion, setFollowUpQuestion] = useState('');
    
    // Status
    const [loadingAI, setLoadingAI] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        let timer: any;
        if (phase !== 'START' && phase !== 'EVALUATING' && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [phase, timeLeft]);

    const addMessage = (role: 'ai' | 'user', content: string, isCode = false) => {
        setMessages(prev => [...prev, { id: Math.random().toString(), role, content, isCode }]);
    };

    const handleStart = async () => {
        setLoadingAI(true);
        try {
            const data = await mockInterviewApi.start(topic);
            setQuestion(data.question);
            setTestCases(data.testCases || []);
            setInitialCodes(data.initialCode || {});
            setFunctionName(data.functionName || '');
            setDifficulty(data.difficulty || 'Medium');
            setTags(data.tags || []);
            setCompany(data.company || []);
            setPhase('APPROACH');
            setTimeLeft(45 * 60);
            
            addMessage('ai', `Hello! I'm your AI interviewer. Today we will be doing a ${topic} interview.\n\nYour question is:\n"${data.question}"\n\nBefore writing any code, please explain your approach and how you plan to solve this.`);
        } catch {
            alert('Failed to start interview. Check backend connection.');
        }
        setLoadingAI(false);
    };

    const handleEvaluateApproach = async () => {
        if (!approachInput.trim()) return;
        setLoadingAI(true);
        addMessage('user', approachInput);
        
        try {
            const data = await mockInterviewApi.evaluateApproach({ question, approach: approachInput });
            setApproachEvaluation(data.evaluation);
            setPhase('APPROACH_EVALUATION');
            addMessage('ai', data.evaluation);
        } catch {
            addMessage('ai', "I had trouble analyzing that. Could you try rephrasing or let's just move to coding?");
            setPhase('APPROACH_EVALUATION'); 
        }
        setLoadingAI(false);
    };

    const handleMoveToCoding = () => {
        setPhase('CODING');
        addMessage('ai', "That's a good starting point. Please implement your solution in the editor. Remember to write only the function logic.");
    };

    const handleCodeSubmit = async () => {
        if (!codeInput.trim()) return;
        addMessage('user', codeInput, true);
        setPhase('FOLLOW_UP');
        setLoadingAI(true);
        
        const thinkingId = Math.random().toString();
        setMessages(prev => [...prev, { id: thinkingId, role: 'ai', content: '🤖 Analyzing your performance...' }]);

        try {
            const data = await mockInterviewApi.getFollowup({ question, approach: approachInput, code: codeInput });
            setMessages(prev => prev.filter(m => m.id !== thinkingId)); // remove thinking
            setFollowUpQuestion(data.followup);
            addMessage('ai', data.followup);
        } catch {
            setMessages(prev => prev.filter(m => m.id !== thinkingId));
            const fallback = "What is the time complexity of your solution?";
            setFollowUpQuestion(fallback);
            addMessage('ai', fallback);
        }
        setLoadingAI(false);
    };

    const handleFinalSubmit = async () => {
        if (!followUpInput.trim()) return;
        addMessage('user', followUpInput);
        setPhase('EVALUATING');
        setLoadingAI(true);
        
        const thinkingId = Math.random().toString();
        setMessages(prev => [...prev, { id: thinkingId, role: 'ai', content: '🤖 Generating final score...' }]);

        try {
            const payload = {
                question,
                approach: approachInput,
                code: codeInput,
                followUpQuestion,
                followUpAnswer: followUpInput,
                type: topic
            };
            const result = await mockInterviewApi.submit(payload);
            navigate('/dashboard/interview/result', { state: { result } });
        } catch {
            setMessages(prev => prev.filter(m => m.id !== thinkingId));
            addMessage('ai', 'Evaluation failed due to network error. You can retry submitting.');
            setPhase('FOLLOW_UP');
        }
        setLoadingAI(false);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (phase === 'START') {
        return (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-2xl mx-auto mt-20 p-10 bg-[#0d0d0d] border border-white/5 rounded-3xl text-center shadow-2xl relative overflow-hidden group">
                {/* Decorative background pulse */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-[#D4AF37]/10 transition-all duration-700"></div>

                <div className="inline-block px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                    Professional Assessment
                </div>

                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Mock Interview <span className="text-[#D4AF37]">Simulation</span></h3>
                <p className="text-gray-400 mb-10 text-sm max-w-md mx-auto leading-relaxed">Select a domain to begin a realistic FAANG-style technical interview with real-time feedback and evaluation.</p>
                
                <div className="flex flex-wrap justify-center gap-3 mb-10">
                    {['DSA', 'System Design', 'OOP', 'OS', 'CN'].map(t => (
                        <button 
                            key={t} onClick={() => setTopic(t)}
                            className={`px-5 py-2.5 rounded-lg text-[13px] font-bold tracking-wide border transition-all duration-200 active:scale-95 ${topic === t ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'bg-transparent text-gray-400 border-white/10 hover:border-[#D4AF37]/50 hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={handleStart} disabled={loadingAI}
                    className="relative group bg-white text-black font-black px-10 py-4 rounded-xl hover:bg-[#D4AF37] transition-all duration-300 w-full max-w-sm mx-auto flex items-center justify-center gap-3 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                    {loadingAI ? (
                        <>
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            <span className="relative z-10 text-sm uppercase">Initializing...</span>
                        </>
                    ) : (
                        <span className="relative z-10 text-sm uppercase tracking-widest">Start Interview</span>
                    )}
                </button>
                
                <p className="mt-8 text-[10px] text-gray-600 uppercase font-bold tracking-[0.1em]">No setup required · Powered by AI Models</p>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            className="flex flex-col h-[calc(100vh-120px)] w-full px-4 overflow-hidden"
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2 shrink-0 flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{topic} Interview</span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border ${
                        difficulty === 'Easy' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                        difficulty === 'Medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                        'text-red-400 border-red-500/30 bg-red-500/10'
                    }`}>{difficulty}</span>
                    {company.slice(0, 2).map(c => (
                        <span key={c} className="px-2 py-1 rounded text-[9px] font-black text-white/30 border border-white/10 bg-white/[0.03] uppercase tracking-widest">{c}</span>
                    ))}
                    {timeLeft <= 300 && timeLeft > 0 && <span className="text-red-400 text-xs font-bold animate-pulse">⚠️ 5 min left</span>}
                </div>
                <div className="flex items-center gap-3">
                    <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        ⏱ {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 w-full overflow-hidden">
                {phase === 'CODING' ? (
                    <div className="h-full w-full grid grid-cols-12 gap-4">
                        {/* Left Content: Problem statement */}
                        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 min-h-0 h-full overflow-hidden">
                            <div className="flex-1 overflow-y-auto bg-[#111] border border-white/10 rounded-2xl p-6 custom-scrollbar">
                                <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-4">Problem Statement</h3>
                                <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap mb-8 font-medium">
                                    {question}
                                </div>

                                <div className="bg-[#D4AF37]/5 border-l-2 border-[#D4AF37] p-4 rounded-r-xl mb-8">
                                    <h4 className="text-[10px] font-black text-[#D4AF37] uppercase mb-2 tracking-widest">Your Evaluated Approach</h4>
                                    <p className="text-xs text-gray-300 leading-relaxed italic">"{approachInput}"</p>
                                    <div className="mt-3 pt-3 border-t border-[#D4AF37]/20 text-[11px] text-gray-400 leading-relaxed">
                                        {approachEvaluation}
                                    </div>
                                </div>

                                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 border-t border-white/5 pt-6">Sample Test Cases</h3>
                                <div className="space-y-4">
                                    {testCases.map((tc, index) => (
                                        <div key={index} className="bg-black/40 rounded-xl p-4 border border-white/5">
                                            <p className="text-[10px] text-gray-500 font-bold mb-2 uppercase">Case {index + 1}</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-[9px] text-gray-600 uppercase font-bold">Input</span>
                                                    <code className="block text-xs text-blue-300 mt-1 font-mono">{JSON.stringify(tc.input)}</code>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-gray-600 uppercase font-bold">Output</span>
                                                    <code className="block text-xs text-green-300 mt-1 font-mono">{JSON.stringify(tc.expectedOutput)}</code>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-4 shrink-0 flex items-center justify-between">
                                <p className="text-xs text-gray-400 italic font-medium">Click submit when you are confident in your solution.</p>
                                <button 
                                    onClick={handleCodeSubmit} 
                                    className="bg-white text-black text-xs font-black px-6 py-2.5 rounded-lg hover:bg-[#D4AF37] transition-all shadow-xl active:scale-95 whitespace-nowrap"
                                >
                                    Finish & Submit
                                </button>
                            </div>
                        </div>

                        {/* Right Content: Code editor */}
                        <div className="col-span-12 lg:col-span-7 flex flex-col min-h-0 h-full overflow-hidden">
                             <CodeEnvironment 
                                onCodeChange={setCodeInput} 
                                testCases={testCases}
                                initialCodes={initialCodes}
                                question={question}
                                functionName={functionName}
                             />
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                        {/* Left: Chat History */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col min-h-0 overflow-hidden shadow-xl">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest py-2 border-b border-white/5 mb-4 shrink-0 font-mono">Interview Conversation</h4>
                            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                                <AnimatePresence>
                                    {messages.map((msg) => (
                                        <motion.div 
                                            key={msg.id}
                                            initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}
                                            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-white rounded-tr-sm' : 'bg-[#1A1A1A] border border-white/10 text-gray-300 rounded-tl-sm'}`}>
                                                <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 font-mono">
                                                    {msg.role === 'user' ? 'You' : 'Interviewer'}
                                                </div>
                                                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Right: Interaction Workspace */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-xl">
                            <div className="bg-[#1a1a1a] flex justify-between items-center px-6 py-4 border-b border-white/10 shrink-0 font-mono">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Workspace</span>
                                <span className="text-[#D4AF37] text-[10px] font-black tracking-tighter bg-[#D4AF37]/10 px-2 py-0.5 rounded ring-1 ring-[#D4AF37]/30">{phase.replace('_', ' ')}</span>
                            </div>
                            
                            <div className="flex-1 flex flex-col p-6 min-h-0 overflow-hidden">
                                {phase === 'APPROACH' && (
                                    <div className="flex flex-col h-full gap-4">
                                        <div className="bg-[#D4AF37]/5 border-l-2 border-[#D4AF37] p-3 text-xs text-[#D4AF37]/80 italic">
                                            Interviewer: "Please tell me how you would solve this problem. Mention data structures and complexity."
                                        </div>
                                        <textarea 
                                            value={approachInput} onChange={e => setApproachInput(e.target.value)}
                                            placeholder="Example: I'll use a hash map to store seen numbers..."
                                            className="flex-1 w-full bg-[#0d0d0d] text-gray-300 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed rounded-xl border border-white/5 focus:border-[#D4AF37]/30 transition-all shadow-inner"
                                        />
                                        <button 
                                            onClick={handleEvaluateApproach} disabled={loadingAI}
                                            className="bg-[#D4AF37] text-black font-black px-8 py-4 rounded-xl hover:bg-white transition-all shadow-xl active:scale-95 text-sm disabled:opacity-50"
                                        >
                                            {loadingAI ? 'Interviewer is thinking...' : 'Evaluate My Approach'}
                                        </button>
                                    </div>
                                )}

                                {phase === 'APPROACH_EVALUATION' && (
                                    <div className="flex flex-col h-full gap-4">
                                        <div className="flex-1 overflow-y-auto bg-[#0d0d0d] rounded-xl p-6 border border-white/5 custom-scrollbar">
                                            <h4 className="text-[#D4AF37] text-xs font-black uppercase tracking-widest mb-4">Interviewer's Assessment</h4>
                                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                {approachEvaluation}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setPhase('APPROACH')} className="bg-transparent border border-white/10 text-white font-bold px-4 py-4 rounded-xl hover:bg-white/5 transition-all text-sm">
                                                Refine Approach
                                            </button>
                                            <button onClick={handleMoveToCoding} className="bg-white text-black font-black px-4 py-4 rounded-xl hover:bg-[#D4AF37] transition-all shadow-xl text-sm">
                                                Move to Coding
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {phase === 'FOLLOW_UP' && (
                                    <div className="flex flex-col h-full gap-4">
                                        <div className="bg-[#D4AF37]/5 border-l-2 border-[#D4AF37] p-3 text-xs text-[#D4AF37]/80 italic">
                                            Interviewer: "{followUpQuestion}"
                                        </div>
                                        <textarea 
                                            value={followUpInput} onChange={e => setFollowUpInput(e.target.value)}
                                            placeholder="Type your answer to the follow-up question..."
                                            className="flex-1 w-full bg-[#0d0d0d] text-gray-300 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed rounded-xl border border-white/5 focus:border-[#D4AF37]/30 transition-all shadow-inner"
                                        />
                                        <button onClick={handleFinalSubmit} disabled={loadingAI} className="bg-[#D4AF37] text-black font-black px-8 py-4 rounded-xl hover:bg-white transition-all shadow-xl active:scale-95 disabled:opacity-50 text-sm">
                                            {loadingAI ? 'Reviewing...' : 'Final Submit'}
                                        </button>
                                    </div>
                                )}

                                {phase === 'EVALUATING' && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-6"></div>
                                        <h2 className="text-xl font-bold text-white mb-2">Generating Report</h2>
                                        <p className="text-gray-400 text-sm max-w-xs mx-auto">The interviewer is compiling your performance metrics...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default MockInterviewSession;
