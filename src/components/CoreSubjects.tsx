import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, BookOpen, Network, Cpu, ChevronDown, ChevronRight, CheckCircle, Circle, FileText, RotateCcw, Sparkles, X, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePlan } from '../hooks/usePlan';
import { databaseAPI } from '../api/database';

/* ── Types ─────────────────────────────────────────────────── */
export interface SubjectTopic {
    id: string;
    title: string;
    subtopics: string[];
    keyPoints: string[];
    interviewQuestions: string[];
}

export interface Subject {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    topics: SubjectTopic[];
}

export interface SubjectProgress {
    [topicId: string]: {
        completed: boolean;
        notes: string;
        revisit: boolean;
        completedAt?: string;
    };
}

/* ── Subject Data ──────────────────────────────────────────── */
const SUBJECTS: Subject[] = [
    {
        id: 'system-design',
        name: 'System Design',
        icon: <Network size={16} />,
        color: '#38bdf8',
        bg: 'rgba(56,189,248,0.08)',
        topics: [
            { id: 'sd-1', title: 'Scalability & Load Balancing', subtopics: ['Horizontal vs Vertical Scaling', 'Load Balancer Types', 'Consistent Hashing', 'CDN'], keyPoints: ['Scale-out vs scale-up tradeoffs', 'Round-robin, least-connections, IP-hash algorithms', 'CDN reduces latency for static assets'], interviewQuestions: ['How would you scale a system to 1M users?', 'Explain consistent hashing with an example', 'When would you use a CDN?'] },
            { id: 'sd-2', title: 'Databases & Storage', subtopics: ['SQL vs NoSQL', 'Sharding & Replication', 'CAP Theorem', 'Indexing', 'ACID vs BASE'], keyPoints: ['CAP: Consistency, Availability, Partition Tolerance — pick 2', 'Sharding splits data horizontally across nodes', 'Indexes speed reads but slow writes'], interviewQuestions: ['When to use SQL vs NoSQL?', 'Explain CAP theorem with real examples', 'How does database sharding work?'] },
            { id: 'sd-3', title: 'Caching Strategies', subtopics: ['Cache-aside', 'Write-through', 'Write-back', 'Redis vs Memcached', 'Cache Invalidation'], keyPoints: ['Cache-aside: app manages cache explicitly', 'Write-through: write to cache and DB simultaneously', 'Cache invalidation is one of the hardest problems'], interviewQuestions: ['Design a caching layer for a social feed', 'How do you handle cache invalidation?', 'Redis vs Memcached — when to use which?'] },
            { id: 'sd-4', title: 'Message Queues & Event Streaming', subtopics: ['Kafka', 'RabbitMQ', 'Pub/Sub Pattern', 'Event Sourcing', 'CQRS'], keyPoints: ['Kafka: high-throughput, durable, replay-able', 'RabbitMQ: flexible routing, lower throughput', 'CQRS separates read and write models'], interviewQuestions: ['Design a notification system using queues', 'Kafka vs RabbitMQ — key differences?', 'What is event sourcing?'] },
            { id: 'sd-5', title: 'API Design & Microservices', subtopics: ['REST vs GraphQL vs gRPC', 'API Gateway', 'Service Discovery', 'Circuit Breaker', 'Rate Limiting'], keyPoints: ['gRPC: binary protocol, faster than REST', 'Circuit breaker prevents cascade failures', 'Rate limiting protects against abuse'], interviewQuestions: ['Design a rate limiter', 'REST vs GraphQL — when to use each?', 'How does a circuit breaker work?'] },
            { id: 'sd-6', title: 'Design Case Studies', subtopics: ['Design URL Shortener', 'Design Twitter Feed', 'Design WhatsApp', 'Design Netflix', 'Design Uber'], keyPoints: ['URL shortener: hashing + redirect + analytics', 'Twitter feed: fan-out on write vs read', 'Netflix: CDN + adaptive bitrate streaming'], interviewQuestions: ['Design a URL shortener like bit.ly', 'How would you design Twitter?', 'Design a ride-sharing system like Uber'] },
        ],
    },
    {
        id: 'oops',
        name: 'Object-Oriented Programming',
        icon: <Brain size={16} />,
        color: '#a78bfa',
        bg: 'rgba(167,139,250,0.08)',
        topics: [
            { id: 'oop-1', title: 'Core OOP Principles', subtopics: ['Encapsulation', 'Abstraction', 'Inheritance', 'Polymorphism'], keyPoints: ['Encapsulation: bundle data + methods, hide internals', 'Abstraction: expose only what is necessary', 'Polymorphism: same interface, different behavior'], interviewQuestions: ['Explain the 4 pillars of OOP with examples', 'Difference between abstraction and encapsulation?', 'Real-world example of polymorphism?'] },
            { id: 'oop-2', title: 'SOLID Principles', subtopics: ['Single Responsibility', 'Open/Closed', 'Liskov Substitution', 'Interface Segregation', 'Dependency Inversion'], keyPoints: ['SRP: one class, one reason to change', 'OCP: open for extension, closed for modification', 'DIP: depend on abstractions, not concretions'], interviewQuestions: ['Explain SOLID with a code example', 'How does DIP improve testability?', 'Violation of LSP — give an example'] },
            { id: 'oop-3', title: 'Design Patterns', subtopics: ['Singleton', 'Factory', 'Observer', 'Strategy', 'Decorator', 'Builder'], keyPoints: ['Singleton: one instance globally — use carefully', 'Observer: event-driven, loose coupling', 'Strategy: swap algorithms at runtime'], interviewQuestions: ['Implement Singleton in a thread-safe way', 'Factory vs Abstract Factory?', 'When would you use the Observer pattern?'] },
            { id: 'oop-4', title: 'Classes & Objects Deep Dive', subtopics: ['Constructors & Destructors', 'Static vs Instance', 'Abstract Classes vs Interfaces', 'Composition vs Inheritance'], keyPoints: ['Prefer composition over inheritance', 'Abstract class can have implementation; interface cannot (pre-Java 8)', 'Static members belong to class, not instance'], interviewQuestions: ['Abstract class vs Interface — when to use each?', 'Composition vs Inheritance — which is better?', 'What is a copy constructor?'] },
        ],
    },
    {
        id: 'os',
        name: 'Operating Systems',
        icon: <Cpu size={16} />,
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.08)',
        topics: [
            { id: 'os-1', title: 'Processes & Threads', subtopics: ['Process vs Thread', 'Context Switching', 'Process States', 'Thread Lifecycle', 'Multithreading'], keyPoints: ['Process: independent memory space; Thread: shared memory', 'Context switch saves/restores CPU state', 'User threads vs kernel threads'], interviewQuestions: ['Process vs Thread — key differences?', 'What happens during a context switch?', 'Explain multithreading with an example'] },
            { id: 'os-2', title: 'CPU Scheduling', subtopics: ['FCFS', 'SJF', 'Round Robin', 'Priority Scheduling', 'Multilevel Queue'], keyPoints: ['Round Robin: time quantum prevents starvation', 'SJF: optimal average waiting time but needs future knowledge', 'Priority scheduling can cause starvation — aging fixes it'], interviewQuestions: ['Compare FCFS vs Round Robin', 'What is starvation and how to prevent it?', 'Calculate average waiting time for given processes'] },
            { id: 'os-3', title: 'Memory Management', subtopics: ['Paging', 'Segmentation', 'Virtual Memory', 'Page Replacement Algorithms', 'Thrashing'], keyPoints: ['Paging eliminates external fragmentation', 'LRU page replacement is optimal in practice', 'Thrashing: too many page faults, CPU busy swapping'], interviewQuestions: ['Explain paging vs segmentation', 'What is virtual memory and how does it work?', 'LRU vs FIFO page replacement — which is better?'] },
            { id: 'os-4', title: 'Synchronization & Deadlocks', subtopics: ['Mutex', 'Semaphore', 'Deadlock Conditions', 'Banker\'s Algorithm', 'Race Conditions'], keyPoints: ['Deadlock: mutual exclusion + hold & wait + no preemption + circular wait', 'Mutex: binary lock; Semaphore: counting lock', 'Banker\'s algorithm: safe state detection'], interviewQuestions: ['4 conditions for deadlock?', 'Mutex vs Semaphore — when to use each?', 'How does the Banker\'s algorithm work?'] },
            { id: 'os-5', title: 'File Systems & I/O', subtopics: ['File Allocation Methods', 'Directory Structure', 'Disk Scheduling', 'I/O Buffering', 'RAID'], keyPoints: ['Contiguous allocation: fast but fragmentation', 'SSTF disk scheduling: minimizes seek time', 'RAID 5: striping with parity — good balance'], interviewQuestions: ['Contiguous vs linked file allocation?', 'Explain RAID levels', 'How does disk scheduling work?'] },
        ],
    },
    {
        id: 'cn',
        name: 'Computer Networks',
        icon: <Network size={16} />,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        topics: [
            { id: 'cn-1', title: 'OSI & TCP/IP Model', subtopics: ['7 OSI Layers', 'TCP/IP 4 Layers', 'Layer Functions', 'Encapsulation', 'PDUs'], keyPoints: ['OSI: Physical, Data Link, Network, Transport, Session, Presentation, Application', 'TCP/IP: Network Access, Internet, Transport, Application', 'Each layer adds a header (encapsulation)'], interviewQuestions: ['Explain the OSI model layers', 'What happens when you type a URL in a browser?', 'TCP/IP vs OSI — key differences?'] },
            { id: 'cn-2', title: 'TCP vs UDP', subtopics: ['TCP Handshake', 'Flow Control', 'Congestion Control', 'UDP Use Cases', 'Reliability Mechanisms'], keyPoints: ['TCP: reliable, ordered, connection-oriented', 'UDP: fast, connectionless, no guarantee', '3-way handshake: SYN → SYN-ACK → ACK'], interviewQuestions: ['TCP vs UDP — when to use each?', 'Explain the TCP 3-way handshake', 'How does TCP handle congestion?'] },
            { id: 'cn-3', title: 'HTTP & HTTPS', subtopics: ['HTTP Methods', 'Status Codes', 'HTTP/1.1 vs HTTP/2 vs HTTP/3', 'TLS/SSL', 'Cookies & Sessions'], keyPoints: ['HTTP/2: multiplexing, header compression, server push', 'TLS: asymmetric key exchange → symmetric encryption', 'Cookies: client-side; Sessions: server-side'], interviewQuestions: ['HTTP vs HTTPS — how does TLS work?', 'HTTP/1.1 vs HTTP/2 improvements?', 'Explain REST status codes'] },
            { id: 'cn-4', title: 'DNS & IP Addressing', subtopics: ['DNS Resolution', 'IPv4 vs IPv6', 'Subnetting', 'NAT', 'DHCP'], keyPoints: ['DNS: recursive vs iterative resolution', 'NAT: maps private IPs to public IP', 'Subnetting: divide network into smaller segments'], interviewQuestions: ['How does DNS resolution work?', 'What is NAT and why is it used?', 'Explain subnetting with an example'] },
            { id: 'cn-5', title: 'Network Security', subtopics: ['Firewalls', 'VPN', 'SSL/TLS', 'Common Attacks', 'Authentication Protocols'], keyPoints: ['Firewall: packet filtering, stateful inspection, application layer', 'VPN: encrypted tunnel over public network', 'MITM, DDoS, SQL injection — common attack vectors'], interviewQuestions: ['How does a VPN work?', 'Explain SSL/TLS handshake', 'What is a DDoS attack and how to mitigate it?'] },
        ],
    },
];

/* ── Storage helpers ───────────────────────────────────────── */
const STORAGE_KEY = 'core_subject_progress';

function loadProgress(): Record<string, SubjectProgress> {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}

function saveProgress(p: Record<string, SubjectProgress>) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

/* ── AI Explain Modal ──────────────────────────────────────── */
const AIExplainModal: React.FC<{ topic: SubjectTopic; subject: Subject; onClose: () => void }> = ({ topic, subject, onClose }) => {
    const { user } = useAuth();
    const { canUseAI, aiRemaining, isPremium } = usePlan();
    const [loading, setLoading] = useState(false);
    const [explanation, setExplanation] = useState('');
    const [error, setError] = useState('');
    const [limitReached, setLimitReached] = useState(!canUseAI);

    const explain = useCallback(async () => {
        if (!canUseAI && !isPremium) { setLimitReached(true); return; }
        setLoading(true); setError(''); setExplanation('');
        try {
            const data = await databaseAPI.explainTopic(subject.name, topic.title, topic.subtopics, topic.interviewQuestions);
            if (!data) throw new Error('Failed to get AI explanation');
            setExplanation(data.explanation || '');
        } catch (e: any) {
            if (e.message === 'AI_LIMIT_REACHED') { setLimitReached(true); return; }
            setError(e.message || 'Failed to get AI explanation');
        }
        finally { setLoading(false); }
    }, [topic, subject, canUseAI, isPremium]);

    React.useEffect(() => { if (canUseAI || isPremium) explain(); }, []);

    return (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                style={{ background: '#111', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '680px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(212,175,55,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexShrink: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: subject.bg, border: `1px solid ${subject.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: subject.color }}><Sparkles size={16} /></div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: subject.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{subject.name}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EAEAEA' }}>{topic.title}</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 10px', color: '#555', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}><X size={14} /></button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {limitReached && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', gap: '12px', textAlign: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Lock size={20} color="#D4AF37" />
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#EAEAEA' }}>Daily AI limit reached</div>
                            <div style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.6 }}>Free plan allows 2 AI requests/day. Resets at midnight.</div>
                            <div style={{ padding: '8px 18px', borderRadius: '10px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', fontSize: '0.78rem', color: '#D4AF37', fontWeight: 600 }}>👑 Premium coming soon — unlimited AI</div>
                        </div>
                    )}
                    {!limitReached && loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', gap: '16px' }}>
                            <div className="spinner-gold" />
                            <div style={{ fontSize: '0.85rem', color: '#555' }}>AI is analyzing this topic...</div>
                        </div>
                    )}
                    {!limitReached && error && (
                        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.85rem' }}>
                            {error}
                            <button onClick={explain} style={{ marginLeft: '12px', color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Retry</button>
                        </div>
                    )}
                    {!limitReached && explanation && (
                        <div style={{ fontSize: '0.9rem', color: '#BDBDBD', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{explanation}</div>
                    )}
                    {/* Always show key points + interview Qs */}
                    {!loading && !limitReached && (
                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Key Points</div>
                                {topic.keyPoints.map((p, i) => <div key={i} style={{ fontSize: '0.82rem', color: '#999', marginBottom: '6px', paddingLeft: '12px', borderLeft: '2px solid rgba(212,175,55,0.3)' }}>{p}</div>)}
                            </div>
                            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)' }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Interview Questions</div>
                                {topic.interviewQuestions.map((q, i) => <div key={i} style={{ fontSize: '0.82rem', color: '#999', marginBottom: '6px', display: 'flex', gap: '8px' }}><span style={{ color: '#a78bfa', flexShrink: 0 }}>Q{i + 1}.</span>{q}</div>)}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

/* ── Topic Row ─────────────────────────────────────────────── */
const TopicRow: React.FC<{
    topic: SubjectTopic;
    subject: Subject;
    progress: SubjectProgress[string] | undefined;
    onToggleComplete: () => void;
    onToggleRevisit: () => void;
    onSaveNotes: (notes: string) => void;
    onExplain: () => void;
    index: number;
}> = ({ topic, subject, progress, onToggleComplete, onToggleRevisit, onSaveNotes, onExplain, index }) => {
    const [expanded, setExpanded] = useState(false);
    const [notes, setNotes] = useState(progress?.notes || '');
    const completed = progress?.completed ?? false;
    const revisit = progress?.revisit ?? false;

    return (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04, duration: 0.28 }}
            style={{ borderRadius: '12px', background: completed ? 'rgba(34,197,94,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${completed ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`, overflow: 'hidden', transition: 'all 0.2s' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
                <button onClick={e => { e.stopPropagation(); onToggleComplete(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, color: completed ? '#22c55e' : '#333', transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#22c55e'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = completed ? '#22c55e' : '#333'}>
                    {completed ? <CheckCircle size={18} /> : <Circle size={18} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: completed ? '#555' : '#EAEAEA', textDecoration: completed ? 'line-through' : 'none' }}>{topic.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '2px' }}>{topic.subtopics.slice(0, 3).join(' · ')}{topic.subtopics.length > 3 ? ` +${topic.subtopics.length - 3}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                    {revisit && <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', fontWeight: 600 }}>Revisit</span>}
                    <button onClick={e => { e.stopPropagation(); onExplain(); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '7px', background: subject.bg, border: `1px solid ${subject.color}30`, color: subject.color, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = subject.bg.replace('0.08', '0.15'); }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = subject.bg; }}>
                        <Sparkles size={11} /> AI Explain
                    </button>
                    <span style={{ color: '#333', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none', display: 'flex' }}><ChevronRight size={14} /></span>
                </div>
            </div>

            {/* Expanded content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                            {/* Subtopics */}
                            <div style={{ paddingTop: '12px' }}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>Subtopics</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {topic.subtopics.map((s, i) => <span key={i} style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px', background: subject.bg, color: subject.color, border: `1px solid ${subject.color}25` }}>{s}</span>)}
                                </div>
                            </div>
                            {/* Notes */}
                            <div>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={11} /> Notes</div>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => onSaveNotes(notes)} placeholder="Add your notes here..." rows={3}
                                    style={{ width: '100%', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#EAEAEA', fontSize: '0.82rem', padding: '10px 12px', resize: 'vertical', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'}
                                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; onSaveNotes(notes); }}
                                />
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={onToggleComplete} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', background: completed ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)', borderColor: completed ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)', color: completed ? '#22c55e' : '#666' }}>
                                    {completed ? '✓ Completed' : 'Mark Complete'}
                                </button>
                                <button onClick={onToggleRevisit} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', background: revisit ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', borderColor: revisit ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)', color: revisit ? '#f59e0b' : '#666' }}>
                                    <RotateCcw size={12} style={{ display: 'inline', marginRight: '4px' }} />{revisit ? 'Marked for Revisit' : 'Mark for Revisit'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/* ── Subject Card ──────────────────────────────────────────── */
const SubjectCard: React.FC<{ subject: Subject; progress: SubjectProgress; onUpdate: (p: SubjectProgress) => void }> = ({ subject, progress, onUpdate }) => {
    const [expanded, setExpanded] = useState(false);
    const [explainTopic, setExplainTopic] = useState<SubjectTopic | null>(null);

    const completed = subject.topics.filter(t => progress[t.id]?.completed).length;
    const revisitCount = subject.topics.filter(t => progress[t.id]?.revisit).length;
    const pct = Math.round((completed / subject.topics.length) * 100);

    const toggle = (topicId: string, field: 'completed' | 'revisit') => {
        const cur = progress[topicId] || { completed: false, notes: '', revisit: false };
        const updated = { ...progress, [topicId]: { ...cur, [field]: !cur[field], ...(field === 'completed' && !cur.completed ? { completedAt: new Date().toISOString() } : {}) } };
        onUpdate(updated);
    };

    const saveNotes = (topicId: string, notes: string) => {
        const cur = progress[topicId] || { completed: false, notes: '', revisit: false };
        onUpdate({ ...progress, [topicId]: { ...cur, notes } });
    };

    return (
        <>
            <AnimatePresence>{explainTopic && <AIExplainModal topic={explainTopic} subject={subject} onClose={() => setExplainTopic(null)} />}</AnimatePresence>
            <motion.div className="card-dark" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ overflow: 'hidden' }}>
                {/* Card header */}
                <div style={{ padding: '20px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }} onClick={() => setExpanded(e => !e)}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: subject.bg, border: `1px solid ${subject.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: subject.color, flexShrink: 0 }}>{subject.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EAEAEA' }}>{subject.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#555', marginTop: '2px' }}>{completed}/{subject.topics.length} topics · {revisitCount > 0 ? `${revisitCount} to revisit` : 'no revisits'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: subject.color, lineHeight: 1 }}>{pct}%</div>
                            <div style={{ fontSize: '0.62rem', color: '#444' }}>complete</div>
                        </div>
                        <span style={{ color: '#333', transition: 'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'none', display: 'flex' }}><ChevronDown size={16} /></span>
                    </div>
                </div>
                {/* Progress bar */}
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.04)', margin: '0 22px' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }} style={{ height: '100%', background: `linear-gradient(90deg, ${subject.color}, ${subject.color}99)`, borderRadius: '999px', boxShadow: `0 0 8px ${subject.color}60` }} />
                </div>
                {/* Topics list */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '16px 22px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {subject.topics.map((topic, i) => (
                                    <TopicRow key={topic.id} topic={topic} subject={subject} progress={progress[topic.id]} index={i}
                                        onToggleComplete={() => toggle(topic.id, 'completed')}
                                        onToggleRevisit={() => toggle(topic.id, 'revisit')}
                                        onSaveNotes={(notes) => saveNotes(topic.id, notes)}
                                        onExplain={() => setExplainTopic(topic)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
};

/* ── Main CoreSubjects Component ───────────────────────────── */
const CoreSubjects: React.FC = () => {
    const [allProgress, setAllProgress] = useState<Record<string, SubjectProgress>>(loadProgress);

    const updateSubjectProgress = useCallback((subjectId: string, p: SubjectProgress) => {
        setAllProgress(prev => {
            const next = { ...prev, [subjectId]: p };
            saveProgress(next);
            return next;
        });
    }, []);

    const overallStats = useMemo(() => {
        let total = 0, done = 0, revisit = 0;
        SUBJECTS.forEach(s => {
            s.topics.forEach(t => {
                total++;
                if (allProgress[s.id]?.[t.id]?.completed) done++;
                if (allProgress[s.id]?.[t.id]?.revisit) revisit++;
            });
        });
        return { total, done, revisit, pct: total ? Math.round((done / total) * 100) : 0 };
    }, [allProgress]);

    return (
        <div className="section-gap animate-fadeIn">
            <div>
                <h2 className="page-heading">Core Subjects</h2>
                <p className="page-subheading">System Design · OOP · OS · Computer Networks</p>
            </div>

            {/* Overall progress banner */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '28px' }}>
                        {[{ label: 'Topics Done', value: overallStats.done, color: '#22c55e' }, { label: 'Total Topics', value: overallStats.total, color: '#D4AF37' }, { label: 'To Revisit', value: overallStats.revisit, color: '#f59e0b' }].map(s => (
                            <div key={s.label}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.68rem', color: '#555', marginTop: '2px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#D4AF37' }}>{overallStats.pct}%</div>
                </div>
                <div className="progress-bar-gold"><div className="progress-bar-gold-fill" style={{ width: `${overallStats.pct}%` }} /></div>
                <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '8px' }}>Overall placement prep progress</div>
            </div>

            {/* Subject cards */}
            {SUBJECTS.map(subject => (
                <SubjectCard key={subject.id} subject={subject} progress={allProgress[subject.id] || {}} onUpdate={p => updateSubjectProgress(subject.id, p)} />
            ))}
        </div>
    );
};

export { SUBJECTS, loadProgress };
export default CoreSubjects;
