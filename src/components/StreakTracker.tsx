import React from 'react';
import { Activity } from '../types';

interface Props { activities: Activity[]; }

// Activity-based streak (for the Overview tab)
function calcActivityStreak(activities: Activity[]): number {
  if (!activities.length) return 0;
  const dates = [...new Set(
    activities.map(a => a.date.slice(0, 10))
  )].sort((a, b) => (a > b ? -1 : 1));

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 864e5
    );
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

const StreakTracker: React.FC<Props> = ({ activities }) => {
  const streak = calcActivityStreak(activities);
  const totalProblems = activities.filter(a => a.problemSolved).length;
  const totalHours = Math.floor(activities.reduce((s, a) => s + a.duration, 0) / 60);

  const msg =
    streak === 0 ? 'Log a session to start!' :
      streak < 5 ? 'Good start!' :
        streak < 10 ? "You're consistent!" :
          "You're unstoppable 🔥";

  return (
    <div style={{
      background: streak > 0
        ? 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.04))'
        : '#161616',
      border: `1px solid ${streak > 0 ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '16px',
      padding: '20px',
      minWidth: '160px',
      boxShadow: streak > 0 ? '0 0 20px rgba(212,175,55,0.07)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      {/* Flame + count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{
          fontSize: '1.6rem',
          animation: streak > 0 ? 'float 2.5s ease-in-out infinite' : 'none',
          filter: streak > 0 ? 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' : 'grayscale(1) opacity(0.3)',
        }}>🔥</span>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: streak > 0 ? '#D4AF37' : '#333', lineHeight: 1 }}>{streak}</span>
            <span style={{ fontSize: '0.75rem', color: streak > 0 ? '#D4AF37' : '#333', fontWeight: 600 }}>day{streak !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '1px' }}>streak</div>
        </div>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#666', marginBottom: '14px', lineHeight: 1.4 }}>{msg}</div>

      {/* Mini stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span style={{ color: '#555' }}>Solved</span>
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>{totalProblems}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <span style={{ color: '#555' }}>Hours</span>
          <span style={{ color: '#D4AF37', fontWeight: 600 }}>{totalHours}h</span>
        </div>
      </div>

      {/* 7-day dots */}
      <div style={{ display: 'flex', gap: '4px', marginTop: '14px' }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '999px',
            background: i < Math.min(streak, 7)
              ? `rgba(212,175,55,${0.35 + (i / 7) * 0.65})`
              : 'rgba(255,255,255,0.05)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );
};

export default StreakTracker;
