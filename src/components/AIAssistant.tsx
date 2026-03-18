import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Activity } from '../types';

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    ts: Date;
}

interface Props {
    activities: Activity[];
    username?: string;
}

/* ── Local AI engine ─────────────────────────────────────────── */
function analyzeActivities(activities: Activity[]) {
    const total = activities.length;
    const solved = activities.filter(a => a.problemSolved).length;
    const totalMins = activities.reduce((s, a) => s + a.duration, 0);
    const avgMins = total ? Math.round(totalMins / total) : 0;
    const categories = [...new Set(activities.map(a => a.category))];

    // streak
    const dates = [...new Set(activities.map(a => a.date.split('T')[0]))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    if (dates.includes(today)) {
        streak = 1;
        for (let i = 1; i < dates.length; i++) {
            const diff = Math.floor((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000);
            if (diff === 1) streak++; else break;
        }
    }

    // last 7 days activity
    const last7 = activities.filter(a => {
        const d = new Date(a.date);
        const diff = (Date.now() - d.getTime()) / 86400000;
        return diff <= 7;
    });

    // most active category
    const catCount: Record<string, number> = {};
    activities.forEach(a => { catCount[a.category] = (catCount[a.category] || 0) + 1; });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // productivity score 0-100
    const score = Math.min(100, Math.round(
        (solved / Math.max(total, 1)) * 40 +
        Math.min(streak, 14) / 14 * 30 +
        Math.min(last7.length, 7) / 7 * 30
    ));

    return { total, solved, totalMins, avgMins, categories, streak, last7: last7.length, topCat, score };
}

function generateResponse(input: string, activities: Activity[], username?: string): string {
    const q = input.toLowerCase();
    const s = analyzeActivities(activities);
    const name = username?.split(' ')[0] || 'there';

    if (s.total === 0) {
        return `Hey ${name}! I don't see any activity data yet. Start logging your study sessions and I'll be able to give you personalized insights. Try the "Log Activity" section in the Overview tab!`;
    }

    if (q.includes('next') || q.includes('what should') || q.includes('suggest')) {
        const suggestions = [];
        if (s.streak === 0) suggestions.push('Log a session today to restart your streak');
        if (s.solved / s.total < 0.5) suggestions.push('Focus on solving more problems — your solve rate is below 50%');
        if (s.avgMins < 30) suggestions.push('Try longer sessions (45–60 min) for deeper learning');
        if (s.categories.length < 3) suggestions.push('Diversify into new topics like Trees, Graphs, or DP');
        if (suggestions.length === 0) suggestions.push('Keep up the great work! Try a hard-difficulty problem today');
        return `Here's what I suggest for you, ${name}:\n\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nYour current productivity score is ${s.score}/100.`;
    }

    if (q.includes('analyz') || q.includes('pattern') || q.includes('how am i')) {
        return `📊 Productivity Analysis for ${name}:\n\n• Total sessions: ${s.total}\n• Problems solved: ${s.solved} (${Math.round(s.solved / s.total * 100)}% solve rate)\n• Current streak: ${s.streak} day${s.streak !== 1 ? 's' : ''}\n• Avg session: ${s.avgMins} min\n• Last 7 days: ${s.last7} sessions\n• Top category: ${s.topCat}\n• Productivity score: ${s.score}/100\n\n${s.score >= 70 ? '🔥 You\'re performing well! Keep the momentum.' : s.score >= 40 ? '📈 Good progress. Consistency will push you higher.' : '💡 Let\'s build better habits. Start with one session per day.'}`;
    }

    if (q.includes('improve') || q.includes('better') || q.includes('tips')) {
        const tips = [];
        if (s.streak < 3) tips.push('Build a daily habit — even 20 min counts toward your streak');
        if (s.avgMins < 45) tips.push('Increase session length gradually for better retention');
        if (s.solved / s.total < 0.6) tips.push('Review solutions after each problem to improve solve rate');
        tips.push('Use spaced repetition — revisit topics every 3–5 days');
        tips.push('Track your weak areas and dedicate focused sessions to them');
        return `Here are personalized improvement tips, ${name}:\n\n${tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    }

    if (q.includes('predict') || q.includes('goal') || q.includes('when')) {
        const dailyRate = s.last7 / 7;
        const projectedMonthly = Math.round(dailyRate * 30);
        const daysTo100 = s.solved >= 100 ? 0 : Math.ceil((100 - s.solved) / Math.max(dailyRate * 0.5, 0.1));
        return `🔮 Predictions for ${name}:\n\n• At your current pace (${dailyRate.toFixed(1)} sessions/day):\n  — ~${projectedMonthly} sessions this month\n  — ~${Math.round(dailyRate * 0.5 * 30)} problems solved this month\n\n• Days to reach 100 problems solved: ~${daysTo100} days\n\n${s.streak > 0 ? `• Your ${s.streak}-day streak is building momentum!` : '• Start a streak today to accelerate your progress.'}`;
    }

    if (q.includes('streak') || q.includes('consistent')) {
        return `🔥 Streak Report:\n\nCurrent streak: ${s.streak} day${s.streak !== 1 ? 's' : ''}\n\n${s.streak === 0 ? `You haven't logged anything today, ${name}. Log a session now to start your streak!` : s.streak < 7 ? `Great start! Keep going — 7 days is your next milestone.` : s.streak < 30 ? `Impressive ${s.streak}-day streak! You're building a real habit.` : `🏆 ${s.streak} days! You're in elite territory, ${name}!`}`;
    }

    if (q.includes('score') || q.includes('productivity')) {
        const level = s.score >= 80 ? 'Elite' : s.score >= 60 ? 'Advanced' : s.score >= 40 ? 'Intermediate' : 'Beginner';
        return `⚡ Productivity Score: ${s.score}/100 — ${level}\n\nBreakdown:\n• Solve rate: ${Math.round(s.solved / s.total * 100)}% (${s.solved}/${s.total})\n• Streak bonus: ${s.streak} days\n• Recent activity: ${s.last7}/7 days active\n\n${s.score < 70 ? 'Focus on consistency and solving more problems to boost your score.' : 'Excellent work! Maintain this level and push for harder problems.'}`;
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        return `Hey ${name}! 👋 I'm your AI productivity assistant. I can help you with:\n\n• "What should I do next?"\n• "Analyze my productivity"\n• "How can I improve?"\n• "Predict my goal completion"\n• "Show my streak"\n• "What's my productivity score?"\n\nWhat would you like to know?`;
    }

    if (q.includes('export') || q.includes('download')) {
        return `To export your data, you can use the browser console:\n\n\`JSON.stringify(activities)\`\n\nOr I can summarize your stats:\n• ${s.total} total sessions\n• ${s.solved} problems solved\n• ${Math.round(s.totalMins / 60)}h total study time\n• ${s.categories.join(', ')} topics covered`;
    }

    return `I'm not sure about that specific query, ${name}. Try asking me:\n\n• "What should I do next?"\n• "Analyze my productivity"\n• "How can I improve?"\n• "Predict my goals"\n• "Show my streak"\n\nYour current score is ${s.score}/100 — ${s.score >= 60 ? 'keep it up!' : 'let\'s improve it together!'}`;
}

const QUICK_PROMPTS = [
    'What should I do next?',
    'Analyze my productivity',
    'How can I improve?',
    'Predict my goals',
    'Show my streak',
    "What's my score?",
];

const AIAssistant: React.FC<Props> = ({ activities, username }) => {
    const [messages, setMessages] = useState<Message[]>([{
        id: '0', role: 'ai', ts: new Date(),
        text: `Hey ${username?.split(' ')[0] || 'there'}! 👋 I'm your AI productivity assistant. Ask me anything about your progress, or tap a quick prompt below.`,
    }]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const stats = useMemo(() => analyzeActivities(activities), [activities]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

    const send = (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: new Date() };
        setMessages(m => [...m, userMsg]);
        setInput('');
        setTyping(true);
        setTimeout(() => {
            const reply = generateResponse(text, activities, username);
            setMessages(m => [...m, { id: (Date.now() + 1).toString(), role: 'ai', text: reply, ts: new Date() }]);
            setTyping(false);
        }, 800 + Math.random() * 400);
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); send(input); };

    return (
        <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: '70vh', minHeight: '500px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                        border: '1px solid rgba(212,175,55,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                    }}>🤖</div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>AI Assistant</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                            <span style={{ fontSize: '0.7rem', color: '#555' }}>Online · Score {stats.score}/100</span>
                        </div>
                    </div>
                </div>
                {/* Score ring */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '52px', height: '52px' }}>
                        <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="4" />
                            <circle cx="26" cy="26" r="22" fill="none" stroke="#D4AF37" strokeWidth="4"
                                strokeDasharray={`${2 * Math.PI * 22}`}
                                strokeDashoffset={`${2 * Math.PI * 22 * (1 - stats.score / 100)}`}
                                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
                            />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#D4AF37' }}>
                            {stats.score}
                        </div>
                    </div>
                    <div style={{ fontSize: '0.6rem', color: '#444', marginTop: '2px' }}>Score</div>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                background: '#0E0E0E', borderRadius: '14px',
                border: '1px solid rgba(212,175,55,0.15)',
                display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', alignItems: 'flex-end' }}>
                        {msg.role === 'ai' && (
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>🤖</div>
                        )}
                        <div style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: msg.role === 'user' ? 'linear-gradient(135deg, #D4AF37, #B8960C)' : '#1A1A1A',
                            border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            color: msg.role === 'user' ? '#0B0B0B' : '#EAEAEA',
                            fontSize: '0.875rem', lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                            boxShadow: msg.role === 'user' ? '0 4px 12px rgba(212,175,55,0.2)' : 'none',
                        }}>
                            {msg.text}
                            <div style={{ fontSize: '0.65rem', color: msg.role === 'user' ? 'rgba(0,0,0,0.5)' : '#444', marginTop: '4px', textAlign: 'right' }}>
                                {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}
                {typing && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>🤖</div>
                        <div style={{ padding: '12px 16px', background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4AF37', animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '12px 0 8px' }}>
                {QUICK_PROMPTS.map(p => (
                    <button key={p} onClick={() => send(p)}
                        style={{
                            padding: '5px 12px', borderRadius: '999px', fontSize: '0.75rem', cursor: 'pointer',
                            background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)',
                            color: '#888', transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.1)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#888'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.2)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.06)'; }}
                    >{p}</button>
                ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
                <input
                    value={input} onChange={e => setInput(e.target.value)}
                    placeholder="Ask me anything about your progress..."
                    style={{
                        flex: 1, padding: '12px 16px',
                        background: '#161616', border: '1px solid rgba(212,175,55,0.2)',
                        borderRadius: '12px', color: '#EAEAEA', fontSize: '0.875rem',
                        fontFamily: 'Inter, sans-serif', outline: 'none',
                        transition: 'border-color 0.2s ease',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button type="submit" disabled={!input.trim() || typing}
                    style={{
                        padding: '12px 20px', borderRadius: '12px',
                        background: input.trim() && !typing ? 'linear-gradient(135deg, #D4AF37, #B8960C)' : 'rgba(212,175,55,0.1)',
                        border: '1px solid rgba(212,175,55,0.3)',
                        color: input.trim() && !typing ? '#0B0B0B' : '#555',
                        cursor: input.trim() && !typing ? 'pointer' : 'not-allowed',
                        fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.2s ease',
                    }}
                >Send</button>
            </form>

            <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

export default AIAssistant;
