/**
 * AIChatPanel.tsx
 * Context-aware follow-up chat panel for subject explanations.
 * Renders as a slide-up panel inside AIExplainModal.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, RotateCcw, Trash2, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { SessionManager } from '../utils/sessionManager';
import { API_BASE } from '../api/config';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatContext {
    title: string;
    explanation: string;
    keyPoints: string[];
}

interface Message {
    id: string;
    role: 'user' | 'ai';
    text: string;
    ts: Date;
    error?: boolean;
}

interface Props {
    context: ChatContext;
    accentColor: string;
    accentBg: string;
    onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const STORAGE_PREFIX = 'ai_chat_ctx_';

function loadHistory(title: string): Message[] {
    try {
        const raw = sessionStorage.getItem(STORAGE_PREFIX + title);
        if (!raw) return [];
        return JSON.parse(raw).map((m: any) => ({ ...m, ts: new Date(m.ts) }));
    } catch {
        return [];
    }
}

function saveHistory(title: string, messages: Message[]) {
    try {
        // Keep last 20 messages in session storage
        sessionStorage.setItem(STORAGE_PREFIX + title, JSON.stringify(messages.slice(-20)));
    } catch { }
}

// ── Markdown renderer (minimal, no heavy deps) ────────────────────────────────

const MsgContent: React.FC<{ text: string }> = ({ text }) => (
    <ReactMarkdown
        components={{
            code({ className, children, ...props }: any) {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                    return (
                        <pre style={{
                            background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '8px', padding: '12px 14px', overflowX: 'auto',
                            fontSize: '0.8rem', lineHeight: 1.6, margin: '8px 0',
                        }}>
                            <code className={className} {...props}>{children}</code>
                        </pre>
                    );
                }
                return (
                    <code style={{
                        background: 'rgba(212,175,55,0.1)', color: '#D4AF37',
                        padding: '1px 6px', borderRadius: '4px', fontSize: '0.85em',
                    }} {...props}>{children}</code>
                );
            },
            p: ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.65 }}>{children}</p>,
            ul: ({ children }) => <ul style={{ paddingLeft: '18px', margin: '4px 0 8px' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: '18px', margin: '4px 0 8px' }}>{children}</ol>,
            li: ({ children }) => <li style={{ marginBottom: '3px', lineHeight: 1.55 }}>{children}</li>,
            strong: ({ children }) => <strong style={{ color: '#EAEAEA', fontWeight: 700 }}>{children}</strong>,
        }}
    >
        {text}
    </ReactMarkdown>
);

// ── Suggested follow-up prompts ───────────────────────────────────────────────

function getSuggestions(title: string): string[] {
    return [
        `Can you give a real-world example of ${title}?`,
        'What are the common interview questions on this?',
        'Explain this with a simple analogy',
        'What are the common mistakes to avoid?',
    ];
}

// ── Main Component ────────────────────────────────────────────────────────────

const AIChatPanel: React.FC<Props> = ({ context, accentColor, accentBg, onClose }) => {
    const [messages, setMessages] = useState<Message[]>(() => {
        const stored = loadHistory(context.title);
        if (stored.length > 0) return stored;
        return [{
            id: makeId(),
            role: 'ai',
            text: `I've read the explanation for **${context.title}**. What would you like to know more about?`,
            ts: new Date(),
        }];
    });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(messages.length <= 1);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Persist to sessionStorage — debounced via ref to avoid writing on every keystroke
    useEffect(() => {
        saveHistory(context.title, messages);
    }, [messages, context.title]);

    // Focus input on mount only
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, []);

    const send = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        setInput('');
        setShowSuggestions(false);

        const userMsg: Message = { id: makeId(), role: 'user', text: trimmed, ts: new Date() };

        // Update historyRef synchronously before the API call — no useEffect needed
        historyRef.current = [
            ...historyRef.current,
            { role: 'user' as const, content: trimmed },
        ].slice(-10);

        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const token = SessionManager.getToken();
            const res = await fetch(`${API_BASE}/api/ai/chat-context`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message: trimmed,
                    context: {
                        title: context.title,
                        explanation: context.explanation,
                        keyPoints: context.keyPoints,
                    },
                    history: historyRef.current,
                }),
            });

            if (res.status === 401) {
                setMessages(prev => [...prev, {
                    id: makeId(), role: 'ai', ts: new Date(), error: true,
                    text: '⚠️ Session expired. Please sign in again.',
                }]);
                return;
            }

            if (res.status === 403) {
                const data = await res.json().catch(() => ({}));
                setMessages(prev => [...prev, {
                    id: makeId(), role: 'ai', ts: new Date(), error: true,
                    text: `⚠️ **Daily AI limit reached**\n\n${data.message ?? 'Upgrade to Premium for unlimited access.'}`,
                }]);
                return;
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const aiReply = data.reply;
            // Keep historyRef in sync with AI response too
            historyRef.current = [
                ...historyRef.current,
                { role: 'assistant' as const, content: String(aiReply) },
            ].slice(-10);
            setMessages(prev => [...prev, {
                id: makeId(), role: 'ai', text: aiReply, ts: new Date(),
            }]);
        } catch (err: any) {
            console.error('[AIChatPanel]', err?.message);
            setMessages(prev => [...prev, {
                id: makeId(), role: 'ai', ts: new Date(), error: true,
                text: '⚠️ AI is temporarily unavailable. Please try again in a moment.',
            }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [loading, context]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    const clearChat = () => {
        sessionStorage.removeItem(STORAGE_PREFIX + context.title);
        setMessages([{
            id: makeId(), role: 'ai', ts: new Date(),
            text: `Chat cleared. Ask me anything about **${context.title}**.`,
        }]);
        setShowSuggestions(true);
    };

    const regenerate = async () => {
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUser) return;
        // Remove last AI response
        setMessages(prev => {
            const idx = [...prev].reverse().findIndex(m => m.role === 'ai');
            if (idx === -1) return prev;
            const realIdx = prev.length - 1 - idx;
            return prev.filter((_, i) => i !== realIdx);
        });
        await send(lastUser.text);
    };

    const lastIsAI = messages[messages.length - 1]?.role === 'ai';
    const suggestions = getSuggestions(context.title);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
                display: 'flex', flexDirection: 'column',
                height: '100%', overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: accentBg, border: `1px solid ${accentColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accentColor, flexShrink: 0,
                }}>
                    <MessageCircle size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EAEAEA' }}>
                        Ask Follow-up
                    </div>
                    <div style={{
                        fontSize: '0.65rem', color: '#555',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {context.title}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {lastIsAI && messages.length > 1 && (
                        <button
                            onClick={regenerate}
                            disabled={loading}
                            title="Regenerate last response"
                            style={{
                                background: 'none', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: '6px', padding: '4px 7px',
                                color: '#444', cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#444'}
                        >
                            <RotateCcw size={12} />
                        </button>
                    )}
                    <button
                        onClick={clearChat}
                        title="Clear chat"
                        style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '6px', padding: '4px 7px',
                            color: '#444', cursor: 'pointer', transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#444'}
                    >
                        <Trash2 size={12} />
                    </button>
                    <button
                        onClick={onClose}
                        title="Close chat"
                        style={{
                            background: 'none', border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '6px', padding: '4px 7px',
                            color: '#444', cursor: 'pointer', transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#EAEAEA'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#444'}
                    >
                        <X size={12} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '12px',
                display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
                {messages.map(msg => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            display: 'flex',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            gap: '8px', alignItems: 'flex-start',
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
                            background: msg.role === 'ai'
                                ? accentBg
                                : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${msg.role === 'ai' ? accentColor + '30' : 'rgba(255,255,255,0.08)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: msg.role === 'ai' ? accentColor : '#666',
                            marginTop: '2px',
                        }}>
                            {msg.role === 'ai' ? <Bot size={12} /> : <UserIcon size={12} />}
                        </div>

                        {/* Bubble */}
                        <div style={{
                            maxWidth: '85%',
                            padding: '10px 13px',
                            borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                            background: msg.role === 'user'
                                ? 'rgba(255,255,255,0.04)'
                                : msg.error
                                    ? 'rgba(239,68,68,0.06)'
                                    : 'rgba(212,175,55,0.04)',
                            border: `1px solid ${msg.role === 'user'
                                ? 'rgba(255,255,255,0.07)'
                                : msg.error
                                    ? 'rgba(239,68,68,0.2)'
                                    : 'rgba(212,175,55,0.12)'}`,
                            fontSize: '0.83rem',
                            color: msg.error ? '#fca5a5' : '#BDBDBD',
                            lineHeight: 1.6,
                        }}>
                            <MsgContent text={msg.text} />
                            <div style={{
                                fontSize: '0.6rem', color: '#333',
                                marginTop: '6px', textAlign: 'right',
                            }}>
                                {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                        >
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '6px',
                                background: accentBg, border: `1px solid ${accentColor}30`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: accentColor, flexShrink: 0,
                            }}>
                                <Bot size={12} />
                            </div>
                            <div style={{
                                padding: '10px 14px', borderRadius: '4px 14px 14px 14px',
                                background: 'rgba(212,175,55,0.04)',
                                border: '1px solid rgba(212,175,55,0.12)',
                                display: 'flex', gap: '4px', alignItems: 'center',
                            }}>
                                {[0, 1, 2].map(i => (
                                    <div key={i} style={{
                                        width: '5px', height: '5px', borderRadius: '50%',
                                        background: accentColor,
                                        animation: 'chatDot 1.2s ease-in-out infinite',
                                        animationDelay: `${i * 0.18}s`,
                                        opacity: 0.6,
                                    }} />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Suggestions */}
                <AnimatePresence>
                    {showSuggestions && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}
                        >
                            <div style={{ fontSize: '0.65rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: '2px' }}>
                                Suggested questions
                            </div>
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    onClick={() => send(s)}
                                    style={{
                                        textAlign: 'left', padding: '8px 12px',
                                        borderRadius: '10px', cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#666', fontSize: '0.78rem',
                                        transition: 'all 0.15s', lineHeight: 1.4,
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.color = '#EAEAEA';
                                        (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}30`;
                                        (e.currentTarget as HTMLElement).style.background = accentBg;
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.color = '#666';
                                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
                padding: '10px 12px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a follow-up question… (Enter to send)"
                        rows={1}
                        disabled={loading}
                        style={{
                            flex: 1, padding: '9px 12px',
                            background: '#0d0d0d',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px', color: '#EAEAEA',
                            fontSize: '0.82rem', fontFamily: 'Inter, sans-serif',
                            outline: 'none', resize: 'none',
                            lineHeight: 1.5, maxHeight: '100px', overflowY: 'auto',
                            transition: 'border-color 0.2s',
                            opacity: loading ? 0.6 : 1,
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = `${accentColor}60`}
                        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                        onInput={e => {
                            const el = e.currentTarget;
                            el.style.height = 'auto';
                            el.style.height = Math.min(el.scrollHeight, 100) + 'px';
                        }}
                    />
                    <button
                        onClick={() => send(input)}
                        disabled={!input.trim() || loading}
                        style={{
                            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                            background: input.trim() && !loading
                                ? `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`
                                : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${input.trim() && !loading ? accentColor + '60' : 'rgba(255,255,255,0.07)'}`,
                            color: input.trim() && !loading ? '#0B0B0B' : '#333',
                            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Send size={14} />
                    </button>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#2a2a2a', marginTop: '5px', textAlign: 'right' }}>
                    Shift+Enter for new line
                </div>
            </div>

            <style>{`
                @keyframes chatDot {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-4px); opacity: 1; }
                }
            `}</style>
        </motion.div>
    );
};

export default AIChatPanel;
