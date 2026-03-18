import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MotivationQuote {
  text: string;
  author: string;
  icon: string;
  color: string;
}

const MOTIVATION_QUOTES: MotivationQuote[] = [
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    icon: "🌱",
    color: "from-green-500 to-emerald-600"
  },
  {
    text: "Code is like humor. When you have to explain it, it's bad.",
    author: "Cory House",
    icon: "😄",
    color: "from-blue-500 to-indigo-600"
  },
  {
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
    icon: "🧠",
    color: "from-purple-500 to-violet-600"
  },
  {
    text: "Practice doesn't make perfect. Perfect practice makes perfect.",
    author: "Vince Lombardi",
    icon: "🎯",
    color: "from-orange-500 to-red-600"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    icon: "💫",
    color: "from-pink-500 to-rose-600"
  },
  {
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    author: "Martin Fowler",
    icon: "💻",
    color: "from-cyan-500 to-blue-600"
  },
  {
    text: "It's not about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    author: "Rocky Balboa",
    icon: "🥊",
    color: "from-yellow-500 to-orange-600"
  }
];

const DailyMotivation: React.FC = () => {
  const { user } = useAuth();
  const [currentQuote, setCurrentQuote] = useState<MotivationQuote>(MOTIVATION_QUOTES[0]);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Get quote based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % MOTIVATION_QUOTES.length;
    setCurrentQuote(MOTIVATION_QUOTES[quoteIndex]);

    // Auto-rotate quotes every 15 seconds for better readability
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentQuote(prev => {
          const currentIndex = MOTIVATION_QUOTES.findIndex(q => q.text === prev.text);
          const nextIndex = (currentIndex + 1) % MOTIVATION_QUOTES.length;
          return MOTIVATION_QUOTES[nextIndex];
        });
        setIsAnimating(false);
      }, 400);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const currentIndex = MOTIVATION_QUOTES.findIndex(q => q.text === currentQuote.text);

  return (
    <div
      className={`relative overflow-hidden transition-all duration-500 ${isAnimating ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}
      style={{
        background: 'linear-gradient(135deg, #161616 0%, #1a1a1a 100%)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.06)',
      }}
    >
      {/* Subtle glow bg */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}>{currentQuote.icon}</span>
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Daily Motivation</h3>
              <p style={{ fontSize: '0.75rem', color: '#555', margin: 0 }}>Hello, {user?.name?.split(' ')[0]}!</p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '4px 8px', color: '#555', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s ease' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; }}
          >
            ✕
          </button>
        </div>

        <div style={{ transition: 'all 0.3s ease', opacity: isAnimating ? 0 : 1, transform: isAnimating ? 'translateY(8px)' : 'translateY(0)' }}>
          <p style={{ fontSize: '1rem', fontStyle: 'italic', color: '#EAEAEA', lineHeight: 1.6, marginBottom: '8px' }}>
            "{currentQuote.text}"
          </p>
          <p style={{ fontSize: '0.8rem', color: '#D4AF37', fontWeight: 600 }}>— {currentQuote.author}</p>
        </div>

        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {MOTIVATION_QUOTES.map((_, i) => (
              <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentIndex ? '#D4AF37' : 'rgba(212,175,55,0.2)', transition: 'background 0.3s ease' }} />
            ))}
          </div>
          <span style={{ fontSize: '0.65rem', color: '#444' }}>Auto-rotating every 15s</span>
        </div>
      </div>
    </div>
  );
};

export default DailyMotivation;