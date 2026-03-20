import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockInterviewApi } from '../../api/mockInterviewApi';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
    id: string;
    role: 'ai' | 'user';
    content: string;
    isCode?: boolean;
};

type Phase = 'START' | 'APPROACH' | 'CODING' | 'FOLLOW_UP' | 'EVALUATING';

const MockInterviewSession = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState('DSA');
    const [question, setQuestion] = useState('');
    const [phase, setPhase] = useState<Phase>('START');
    const [messages, setMessages] = useState<Message[]>([]);
    
    // Timer
    const [timeLeft, setTimeLeft] = useState(45 * 60);
    
    // Inputs
    const [approachInput, setApproachInput] = useState('');
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
            setPhase('APPROACH');
            setTimeLeft(45 * 60);
            
            addMessage('ai', `Hello! I'm your AI interviewer. Today we will be doing a ${topic} interview.\n\nYour question is:\n"${data.question}"\n\nBefore writing any code, please explain your approach and how you plan to solve this.`);
        } catch {
            alert('Failed to start interview. Check backend connection.');
        }
        setLoadingAI(false);
    };

    const handleApproachSubmit = () => {
        if (!approachInput.trim()) return;
        addMessage('user', approachInput);
        setApproachInput('');
        setPhase('CODING');
        
        setTimeout(() => {
            addMessage('ai', 'That sounds like a solid plan. Please go ahead and write your code to implement this approach.');
        }, 800);
    };

    const handleCodeSubmit = async () => {
        if (!codeInput.trim()) return;
        addMessage('user', codeInput, true);
        setPhase('FOLLOW_UP');
        setLoadingAI(true);
        
        const thinkingId = Math.random().toString();
        setMessages(prev => [...prev, { id: thinkingId, role: 'ai', content: '🤖 Analyzing your code...' }]);

        try {
            const data = await mockInterviewApi.getFollowup({ question, approach: approachInput, code: codeInput });
            setMessages(prev => prev.filter(m => m.id !== thinkingId)); // remove thinking
            setFollowUpQuestion(data.followup);
            addMessage('ai', data.followup);
        } catch {
            setMessages(prev => prev.filter(m => m.id !== thinkingId));
            const fallback = "What is the time and space complexity of your solution?";
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
        setMessages(prev => [...prev, { id: thinkingId, role: 'ai', content: '🤖 Evaluating your entire performance...' }]);

        try {
            const payload = {
                question,
                approach: messages.find(m => m.role === 'user' && !m.isCode)?.content || '',
                code: codeInput,
                followUpQuestion,
                followUpAnswer: followUpInput,
                type: topic
            };
            const result = await mockInterviewApi.submit(payload);
            navigate('/interview/result', { state: { result } });
        } catch {
            setMessages(prev => prev.filter(m => m.id !== thinkingId));
            addMessage('ai', 'Evaluation failed due to network error. You can retry submitting.');
            setPhase('FOLLOW_UP'); // let them retry
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
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="max-w-xl mx-auto mt-20 p-8 card-dark text-center">
                <div className="w-20 h-20 mx-auto bg-[#D4AF37]/10 rounded-full flex items-center justify-center mb-6 border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                    <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Technical Interview Simulation</h3>
                <p className="text-gray-400 mb-8 text-sm">You will be tested on your approach, code quality, and ability to handle follow-up questions from the interviewer.</p>
                <div className="flex gap-4 justify-center mb-8">
                    {['DSA', 'OS', 'OOP', 'CN'].map(t => (
                        <button 
                            key={t} onClick={() => setTopic(t)}
                            className={`px-6 py-2 rounded-xl font-bold border transition-colors ${topic === t ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-transparent text-gray-400 border-white/20'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={handleStart} disabled={loadingAI}
                    className="bg-white text-black font-bold px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors w-full"
                >
                    {loadingAI ? 'Connecting to Interviewer...' : 'Start Interview'}
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="flex flex-col h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-4">
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{topic} Interview</span>
                    {timeLeft <= 300 && timeLeft > 0 && <span className="text-red-400 text-xs font-bold animate-pulse">⚠️ 5 minutes left - Please wrap up</span>}
                </div>
                <div className="flex items-center gap-3">
                    <span className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        ⏱ {formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* Split Pane view */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
                
                {/* Chat History Side */}
                <div className="card-dark p-6 flex flex-col gap-4 overflow-y-auto">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest sticky top-0 bg-[#0A0A0A] py-2 z-10 border-b border-white/5">Conversation History</h4>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 pt-4">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div 
                                    key={msg.id}
                                    initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}
                                    className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-white rounded-tr-sm' : 'bg-[#1A1A1A] border border-white/10 text-gray-300 rounded-tl-sm'}`}>
                                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-1">
                                            {msg.role === 'user' ? 'You' : 'AI Interviewer'}
                                        </div>
                                        {msg.isCode ? (
                                            <pre className="font-mono text-xs bg-black/50 p-3 rounded-xl overflow-x-auto text-blue-300 border border-white/5 mt-2">
                                                {msg.content}
                                            </pre>
                                        ) : (
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Workspace Side */}
                <div className="card-dark flex flex-col p-1 overflow-hidden relative">
                    <div className="bg-[#1a1a1a] flex justify-between items-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase rounded-t-xl border-b border-white/5">
                        <span>Workspace</span>
                        <span className="text-[#D4AF37]">{phase} PHASE</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col p-4">
                        {phase === 'APPROACH' && (
                            <>
                                <p className="text-gray-400 text-sm mb-3">Explain your thought process, data structures, and edge cases before coding.</p>
                                <textarea 
                                    value={approachInput} onChange={e => setApproachInput(e.target.value)}
                                    placeholder="I plan to solve this by..."
                                    className="flex-1 w-full bg-[#111] text-gray-300 p-4 focus:outline-none resize-none font-mono text-sm leading-relaxed rounded-xl border border-white/5"
                                />
                                <div className="mt-4 flex justify-end">
                                    <button onClick={handleApproachSubmit} className="bg-white text-black font-bold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                                        Submit Approach
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {phase === 'CODING' && (
                            <>
                                <p className="text-gray-400 text-sm mb-3">Write the optimized code for your approach.</p>
                                <textarea 
                                    value={codeInput} onChange={e => setCodeInput(e.target.value)}
                                    placeholder="function solve() {\n  // your code here\n}"
                                    className="flex-1 w-full bg-[#050505] text-blue-300 p-4 focus:outline-none resize-none font-mono text-sm leading-relaxed rounded-xl border border-white/5"
                                />
                                <div className="mt-4 flex justify-end">
                                    <button onClick={handleCodeSubmit} className="bg-white text-black font-bold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                                        Submit Code
                                    </button>
                                </div>
                            </>
                        )}
                        
                        {phase === 'FOLLOW_UP' && (
                            <>
                                <p className="text-gray-400 text-sm mb-3">Answer the interviewer's follow-up question.</p>
                                <textarea 
                                    value={followUpInput} onChange={e => setFollowUpInput(e.target.value)}
                                    placeholder="The time complexity is O(N) because..."
                                    className="flex-1 w-full bg-[#111] text-gray-300 p-4 focus:outline-none resize-none font-mono text-sm leading-relaxed rounded-xl border border-white/5"
                                    disabled={loadingAI}
                                />
                                <div className="mt-4 flex justify-end">
                                    <button onClick={handleFinalSubmit} disabled={loadingAI || !followUpInput.trim()} className="bg-[#D4AF37] text-black font-bold px-6 py-2.5 rounded-lg hover:bg-[#FFD700] transition-colors disabled:opacity-50">
                                        {loadingAI ? 'Processing...' : 'Finish Interview'}
                                    </button>
                                </div>
                            </>
                        )}

                        {phase === 'EVALUATING' && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-6"></div>
                                <h2 className="text-xl font-bold text-white mb-2">Generating Report</h2>
                                <p className="text-gray-400 text-sm max-w-xs">AI is deeply analyzing your approach, code efficiency, and follow-up responses.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default MockInterviewSession;
