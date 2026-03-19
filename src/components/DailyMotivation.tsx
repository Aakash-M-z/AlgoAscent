import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface MotivationQuote { text: string; author: string; icon: string; }

const MOTIVATION_QUOTES: MotivationQuote[] = [
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", icon: "🌱" },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House", icon: "😄" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson", icon: "🧠" },
  { text: "Practice doesn't make perfect. Perfect practice makes perfect.", author: "Vince Lombardi", icon: "🎯" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", icon: "💫" },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler", icon: "💻" },
  { text: "It's not about how hard you hit. It's about how hard you can get hit and keep moving forward.", author: "Rocky Balboa", icon: "🥊" },
];

const DailyMotivation: React.FC = () => {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
    setIdx(dayOfYear % MOTIVATION_QUOTES.length);
    const t = setInterval(() => setIdx(i => (i + 1) % MOTIVATION_QUOTES.length), 15_000);
    return () => clearInterval(t);
  }, []);

  if (!visible) return null;

  const q = MOTIVATION_QUOTES[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #161616 0%, #1a1a1a 100%)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '16px', padding: '20px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.06)',
      }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>{q.icon}</span>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Daily Motivation</div>
              <div style={{ fontSize: '0.75rem', color: '#555' }}>Hello, {user?.name?.split(' ')[0] ?? 'there'}!</div>
            </div>
          </div>
          <button onClick={() => setVisible(false)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px', color: '#555', cursor: 'pointer', fontSize: '0.75rem', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#D4AF37'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#555'}
          >✕</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#EAEAEA', lineHeight: 1.6, marginBottom: '8px' }}>
              "{q.text}"
            </p>
            <p style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 600 }}>— {q.author}</p>
          </motion.div>
        </AnimatePresence>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {MOTIVATION_QUOTES.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === idx ? '#D4AF37' : 'rgba(212,175,55,0.2)', border: 'none', padding: 0, cursor: 'pointer', transition: 'background 0.3s' }} />
            ))}
          </div>
          <span style={{ fontSize: '0.65rem', color: '#444' }}>Auto-rotating · 15s</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyMotivation;