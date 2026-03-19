import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Trophy, TrendingUp } from 'lucide-react';
import { Activity } from '../types';

interface Props { activities: Activity[]; }

function calcStreak(activities: Activity[]): number {
  if (!activities.length) return 0;
  const dates = [...new Set(activities.map(a => a.date.slice(0, 10)))].sort((a, b) => b > a ? 1 : -1);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let s = 1;
  for (let i = 1; i < dates.length; i++) {
    if (Math.round((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 864e5) === 1) s++;
    else break;
  }
  return s;
}

const MILESTONES = [3, 7, 14, 30, 60, 100];

const StreakTracker: React.FC<Props> = ({ activities }) => {
  const streak = calcStreak(activities);
  const totalProblems = activities.filter(a => a.problemSolved).length;
  const totalHours = Math.floor(activities.reduce((s, a) => s + a.duration, 0) / 60);
  const prevStreak = useRef(streak);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestone, setMilestone] = useState(0);
  const [flameScale, setFlameScale] = useState(1);

  // Milestone alert
  useEffect(() => {
    if (streak > prevStreak.current && MILESTONES.includes(streak)) {
      setMilestone(streak);
      setShowMilestone(true);
      setTimeout(() => setShowMilestone(false), 3500);
    }
    prevStreak.current = streak;
  }, [streak]);

  // Pulse flame on mount
  useEffect(() => {
    if (streak > 0) {
      const t = setInterval(() => {
        setFlameScale(s => s === 1 ? 1.15 : 1);
      }, 1800);
      return () => clearInterval(t);
    }
  }, [streak]);

  const nextMilestone = MILESTONES.find(m => m > streak) ?? null;
  const progressToNext = nextMilestone ? Math.round((streak / nextMilestone) * 100) : 100;

  const msg =
    streak === 0 ? 'Log a session to start!' :
      streak < 3 ? 'Good start — keep going!' :
        streak < 7 ? "Building momentum 💪" :
          streak < 14 ? "You're on fire! 🔥" :
            streak < 30 ? "Unstoppable streak!" :
              "Legendary consistency 👑";

  const flameColor = streak === 0 ? '#333' : streak >= 30 ? '#FFD700' : streak >= 7 ? '#f59e0b' : '#D4AF37';

  return (
    <div style={{ position: 'relative' }}>
      {/* Milestone popup */}
      <AnimatePresence>
        {showMilestone && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            style={{
              position: 'absolute', top: '-56px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 50, whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #1a1500, #0f0f0f)',
              border: '1px solid rgba(212,175,55,0.5)',
              borderRadius: '12px', padding: '10px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 24px rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <Trophy size={14} color="#FFD700" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFD700' }}>
              🎉 {milestone}-Day Streak Milestone!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ boxShadow: streak > 0 ? '0 8px 32px rgba(0,0,0,0.6), 0 0 28px rgba(212,175,55,0.15)' : undefined }}
        style={{
          background: streak > 0
            ? 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.04))'
            : '#161616',
          border: `1px solid ${streak > 0 ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '16px', padding: '20px', minWidth: '160px',
          transition: 'border-color 0.3s ease',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Background glow for active streak */}
        {streak >= 7 && (
          <div style={{
            position: 'absolute', top: '-30px', right: '-30px',
            width: '120px', height: '120px', borderRadius: '50%',
            background: `radial-gradient(circle, ${flameColor}18 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Flame + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <motion.span
            animate={{ scale: flameScale }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              fontSize: '1.6rem', display: 'inline-block',
              filter: streak > 0 ? `drop-shadow(0 0 8px ${flameColor}80)` : 'grayscale(1) opacity(0.25)',
            }}
          >🔥</motion.span>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <motion.span
                key={streak}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '1.6rem', fontWeight: 800, color: streak > 0 ? flameColor : '#333', lineHeight: 1 }}
              >
                {streak}
              </motion.span>
              <span style={{ fontSize: '0.72rem', color: streak > 0 ? flameColor : '#333', fontWeight: 600 }}>
                day{streak !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ fontSize: '0.62rem', color: '#555', marginTop: '1px' }}>streak</div>
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: '12px', lineHeight: 1.4 }}>{msg}</div>

        {/* Progress to next milestone */}
        {nextMilestone && streak > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.62rem', color: '#444' }}>Next: {nextMilestone}d</span>
              <span style={{ fontSize: '0.62rem', color: flameColor, fontWeight: 600 }}>{streak}/{nextMilestone}</span>
            </div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                style={{ height: '100%', background: `linear-gradient(90deg, ${flameColor}, ${flameColor}99)`, borderRadius: '999px', boxShadow: `0 0 6px ${flameColor}60` }}
              />
            </div>
          </div>
        )}

        {/* Mini stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[
            { label: 'Solved', value: totalProblems, icon: <Zap size={10} /> },
            { label: 'Hours', value: `${totalHours}h`, icon: <TrendingUp size={10} /> },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
              <span style={{ color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#333' }}>{s.icon}</span>{s.label}
              </span>
              <span style={{ color: '#D4AF37', fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* 7-day dots */}
        <div style={{ display: 'flex', gap: '4px', marginTop: '14px' }}>
          {Array.from({ length: 7 }, (_, i) => (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              style={{
                flex: 1, height: '4px', borderRadius: '999px',
                background: i < Math.min(streak, 7)
                  ? `rgba(212,175,55,${0.3 + (i / 7) * 0.7})`
                  : 'rgba(255,255,255,0.05)',
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default StreakTracker;
