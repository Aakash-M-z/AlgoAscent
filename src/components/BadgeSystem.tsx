import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from '../types';

interface Props { activities?: Activity[]; }

interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  condition: (a: Activity[]) => boolean;
}

const RARITY: Record<string, { color: string; bg: string; label: string }> = {
  common: { color: '#888', bg: 'rgba(136,136,136,0.1)', label: 'Common' },
  rare: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Rare' },
  epic: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', label: 'Epic' },
  legendary: { color: '#D4AF37', bg: 'rgba(212,175,55,0.12)', label: 'Legendary' },
};

function calcStreak(activities: Activity[]): number {
  const dates = [...new Set(activities.map(a => a.date.slice(0, 10)))].sort((a, b) => b > a ? 1 : -1);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if (!dates.length || (dates[0] !== today && dates[0] !== yesterday)) return 0;
  let s = 1;
  for (let i = 1; i < dates.length; i++) {
    if (Math.round((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 864e5) === 1) s++;
    else break;
  }
  return s;
}

const BADGES: Badge[] = [
  { id: 'first', name: 'First Steps', desc: 'Solve your first problem', icon: '🎯', rarity: 'common', points: 10, condition: a => a.filter(x => x.problemSolved).length >= 1 },
  { id: 'week', name: 'Week Warrior', desc: 'Maintain a 7-day streak', icon: '🔥', rarity: 'rare', points: 50, condition: a => calcStreak(a) >= 7 },
  { id: 'century', name: 'Century Club', desc: 'Solve 100 problems', icon: '💯', rarity: 'epic', points: 200, condition: a => a.filter(x => x.problemSolved).length >= 100 },
  { id: 'hard', name: 'Hard Crusher', desc: 'Solve 10 Hard problems', icon: '💪', rarity: 'epic', points: 100, condition: a => a.filter(x => x.problemSolved && x.difficulty === 'Hard').length >= 10 },
  { id: 'allround', name: 'All Rounder', desc: 'Solve problems in 10+ categories', icon: '🌈', rarity: 'rare', points: 75, condition: a => new Set(a.filter(x => x.problemSolved).map(x => x.category)).size >= 10 },
  { id: 'speed', name: 'Speed Demon', desc: 'Solve 5 problems in one day', icon: '⚡', rarity: 'rare', points: 60, condition: a => { const m: Record<string, number> = {}; a.forEach(x => { if (x.problemSolved) { const d = x.date.slice(0, 10); m[d] = (m[d] || 0) + 1; } }); return Math.max(0, ...Object.values(m)) >= 5; } },
  { id: 'marathon', name: 'Marathon Runner', desc: 'Spend 100+ hours coding', icon: '🏃', rarity: 'epic', points: 150, condition: a => a.reduce((s, x) => s + x.duration, 0) >= 6000 },
  { id: 'legend', name: 'Legendary Coder', desc: '30-day streak + 500 problems', icon: '👑', rarity: 'legendary', points: 1000, condition: a => calcStreak(a) >= 30 && a.filter(x => x.problemSolved).length >= 500 },
];

const BadgeSystem: React.FC<Props> = ({ activities = [] }) => {
  const earned = useMemo(() => new Set(BADGES.filter(b => b.condition(activities)).map(b => b.id)), [activities]);
  const totalPoints = useMemo(() => BADGES.filter(b => earned.has(b.id)).reduce((s, b) => s + b.points, 0), [earned]);

  const rarityCounts = useMemo(() =>
    (['common', 'rare', 'epic', 'legendary'] as const).map(r => ({
      r, total: BADGES.filter(b => b.rarity === r).length,
      got: BADGES.filter(b => b.rarity === r && earned.has(b.id)).length,
    })), [earned]);

  return (
    <div className="section-gap animate-fadeIn">
      <div>
        <h2 className="page-heading">Badges</h2>
        <p className="page-subheading">Earn achievements by hitting milestones</p>
      </div>

      {/* Points banner */}
      <div className="card-dark" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>🏆</span>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA' }}>Achievement Points</div>
            <div className="kpi-sub">Earn points by unlocking badges</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="kpi-number">{totalPoints}</div>
          <div className="kpi-sub">total pts</div>
        </div>
      </div>

      {/* Rarity breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {rarityCounts.map(({ r, total, got }) => {
          const s = RARITY[r];
          return (
            <div key={r} className="stat-card" style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{got}/{total}</div>
              <div style={{ fontSize: '0.7rem', color: s.color, fontWeight: 600, textTransform: 'capitalize', marginTop: '4px' }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: 'center', padding: '32px 20px', borderRadius: '14px', background: 'rgba(212,175,55,0.03)', border: '1px dashed rgba(212,175,55,0.12)' }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏅</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555', marginBottom: '6px' }}>No badges yet</div>
          <div style={{ fontSize: '0.78rem', color: '#3a3a3a' }}>Log your first problem to start earning achievements.</div>
        </motion.div>
      )}

      {/* Badge grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {BADGES.map((badge, i) => {
          const isEarned = earned.has(badge.id);
          const r = RARITY[badge.rarity];
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              whileHover={isEarned ? { scale: 1.03, y: -2 } : undefined}
              style={{
                padding: '20px 16px', borderRadius: '14px', textAlign: 'center',
                background: isEarned ? r.bg : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isEarned ? r.color + '50' : 'rgba(255,255,255,0.05)'}`,
                opacity: isEarned ? 1 : 0.45,
                transition: 'all 0.25s ease',
                position: 'relative',
                cursor: isEarned ? 'default' : 'not-allowed',
              }}
            >
              {isEarned && (
                <div style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#22c55e', color: '#fff',
                  fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✓</div>
              )}
              <div style={{ fontSize: '2rem', marginBottom: '10px', filter: isEarned ? 'none' : 'grayscale(1)' }}>
                {badge.icon}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isEarned ? r.color : '#555', marginBottom: '4px' }}>
                {badge.name}
              </div>
              <div className="kpi-sub" style={{ marginBottom: '8px', lineHeight: 1.4 }}>{badge.desc}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: isEarned ? r.color : '#333' }}>
                {badge.points} pts
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeSystem;
