import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from '../types';
import { SUBJECTS, loadProgress } from './CoreSubjects';

/* ── XP Config ─────────────────────────────────────────────── */
export const XP_RULES = {
  problemEasy: 10,
  problemMedium: 25,
  problemHard: 60,
  streak3: 50,
  streak7: 150,
  streak14: 400,
  streak30: 1000,
  subjectTopicComplete: 30,
  subjectTopicRevisit: 10,
  sessionLogged: 5,
};

export const LEVELS = [
  { level: 1, title: 'Beginner', minXP: 0, color: '#888', icon: '🌱' },
  { level: 2, title: 'Learner', minXP: 200, color: '#22c55e', icon: '📚' },
  { level: 3, title: 'Practitioner', minXP: 600, color: '#38bdf8', icon: '⚡' },
  { level: 4, title: 'Intermediate', minXP: 1400, color: '#a78bfa', icon: '🚀' },
  { level: 5, title: 'Advanced', minXP: 3000, color: '#f59e0b', icon: '🔥' },
  { level: 6, title: 'Expert', minXP: 6000, color: '#D4AF37', icon: '👑' },
  { level: 7, title: 'Master', minXP: 12000, color: '#FFD700', icon: '💎' },
];

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

export function calcXP(activities: Activity[]): { total: number; breakdown: { label: string; xp: number; count: number }[] } {
  const streak = calcStreak(activities);
  const easy = activities.filter(a => a.problemSolved && a.difficulty === 'Easy').length;
  const medium = activities.filter(a => a.problemSolved && a.difficulty === 'Medium').length;
  const hard = activities.filter(a => a.problemSolved && a.difficulty === 'Hard').length;
  const sessions = activities.length;

  // Subject XP from localStorage
  const subjectProgress = loadProgress();
  let subjectXP = 0;
  SUBJECTS.forEach(s => {
    const sp = subjectProgress[s.id] || {};
    s.topics.forEach(t => {
      if (sp[t.id]?.completed) subjectXP += XP_RULES.subjectTopicComplete;
      if (sp[t.id]?.revisit) subjectXP += XP_RULES.subjectTopicRevisit;
    });
  });

  const streakXP = streak >= 30 ? XP_RULES.streak30 : streak >= 14 ? XP_RULES.streak14 : streak >= 7 ? XP_RULES.streak7 : streak >= 3 ? XP_RULES.streak3 : 0;

  const breakdown = [
    { label: 'Easy Problems', xp: easy * XP_RULES.problemEasy, count: easy },
    { label: 'Medium Problems', xp: medium * XP_RULES.problemMedium, count: medium },
    { label: 'Hard Problems', xp: hard * XP_RULES.problemHard, count: hard },
    { label: 'Sessions Logged', xp: sessions * XP_RULES.sessionLogged, count: sessions },
    { label: 'Streak Bonus', xp: streakXP, count: streak },
    { label: 'Core Subjects', xp: subjectXP, count: 0 },
  ].filter(b => b.xp > 0);

  const total = breakdown.reduce((s, b) => s + b.xp, 0);
  return { total, breakdown };
}

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.minXP) current = l; else break; }
  const idx = LEVELS.indexOf(current);
  const next = LEVELS[idx + 1] ?? null;
  const progressPct = next ? Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100) : 100;
  return { current, next, progressPct, xpToNext: next ? next.minXP - xp : 0 };
}

/* ── XP Badge (compact, for dashboard) ────────────────────── */
export const XPBadge: React.FC<{ activities: Activity[]; onClick?: () => void }> = ({ activities, onClick }) => {
  const { total, breakdown } = useMemo(() => calcXP(activities), [activities]);
  const { current, next, progressPct, xpToNext } = useMemo(() => getLevelInfo(total), [total]);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '16px 20px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${current.color}12, ${current.color}04)`,
        border: `1px solid ${current.color}30`,
        minWidth: '220px',
      }}
    >
      {/* Top row: icon + level info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ fontSize: '2rem', lineHeight: 1 }}>{current.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: current.color }}>{total.toLocaleString()}</span>
            <span style={{ fontSize: '0.7rem', color: '#555', fontWeight: 600 }}>XP</span>
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: current.color, lineHeight: 1 }}>
            {current.title} <span style={{ color: '#444', fontWeight: 500 }}>· Lv.{current.level}</span>
          </div>
        </div>
        {next && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.62rem', color: '#444' }}>Next level</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: current.color }}>{xpToNext.toLocaleString()} XP</div>
          </div>
        )}
      </div>

      {/* XP progress bar */}
      {next && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '0.62rem', color: '#444' }}>Progress to {next.icon} {next.title}</span>
            <span style={{ fontSize: '0.62rem', color: current.color, fontWeight: 700 }}>{progressPct}%</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${current.color}, ${current.color}88)`, borderRadius: '999px', boxShadow: `0 0 8px ${current.color}50` }}
            />
          </div>
          <div style={{ fontSize: '0.6rem', color: '#333', marginTop: '4px' }}>
            {breakdown.length > 0 && `${breakdown[0].label}: +${breakdown[0].xp} XP`}
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ── Full XP Panel ─────────────────────────────────────────── */
const XPSystem: React.FC<{ activities: Activity[] }> = ({ activities }) => {
  const { total, breakdown } = useMemo(() => calcXP(activities), [activities]);
  const { current, next, progressPct, xpToNext } = useMemo(() => getLevelInfo(total), [total]);

  return (
    <div className="section-gap animate-fadeIn">
      <div>
        <h2 className="page-heading">XP & Levels</h2>
        <p className="page-subheading">Earn XP by solving problems and completing topics</p>
      </div>

      {/* Current level hero */}
      <motion.div className="card-dark" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '28px', background: `linear-gradient(135deg, ${current.color}12, ${current.color}04)`, borderColor: `${current.color}40` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '4rem', lineHeight: 1 }}>{current.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: current.color, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Level {current.level}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EAEAEA', lineHeight: 1.1 }}>{current.title}</div>
            <div style={{ fontSize: '0.85rem', color: '#555', marginTop: '4px' }}>{total.toLocaleString()} XP total</div>
          </div>
          {next && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#444', marginBottom: '4px' }}>Next: {next.icon} {next.title}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: current.color }}>{xpToNext.toLocaleString()} XP</div>
              <div style={{ fontSize: '0.68rem', color: '#444' }}>to go</div>
            </div>
          )}
        </div>
        {next && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#555' }}>Progress to {next.title}</span>
              <span style={{ fontSize: '0.72rem', color: current.color, fontWeight: 700 }}>{progressPct}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.3 }} style={{ height: '100%', background: `linear-gradient(90deg, ${current.color}, ${current.color}bb)`, borderRadius: '999px', boxShadow: `0 0 12px ${current.color}60` }} />
            </div>
          </div>
        )}
      </motion.div>

      {/* XP Breakdown */}
      <div className="card-dark" style={{ padding: '20px 24px' }}>
        <div className="card-title" style={{ marginBottom: '16px' }}>XP Breakdown</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {breakdown.map((b, i) => (
            <motion.div key={b.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, fontSize: '0.875rem', color: '#EAEAEA' }}>{b.label}</div>
              {b.count > 0 && <div style={{ fontSize: '0.72rem', color: '#555' }}>×{b.count}</div>}
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#D4AF37', minWidth: '60px', textAlign: 'right' }}>+{b.xp.toLocaleString()}</div>
            </motion.div>
          ))}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA' }}>Total XP</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#D4AF37' }}>{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* All levels */}
      <div className="card-dark" style={{ padding: '20px 24px' }}>
        <div className="card-title" style={{ marginBottom: '16px' }}>Level Roadmap</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LEVELS.map((l, i) => {
            const isCurrent = l.level === current.level;
            const isUnlocked = total >= l.minXP;
            return (
              <motion.div key={l.level} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', borderRadius: '12px', background: isCurrent ? `${l.color}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${isCurrent ? l.color + '40' : 'rgba(255,255,255,0.04)'}`, opacity: isUnlocked ? 1 : 0.45 }}>
                <span style={{ fontSize: '1.4rem' }}>{l.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isCurrent ? l.color : isUnlocked ? '#EAEAEA' : '#555' }}>Lv.{l.level} — {l.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#444' }}>{l.minXP.toLocaleString()} XP required</div>
                </div>
                {isCurrent && <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 700 }}>✓ Current</span>}
                {!isUnlocked && <span style={{ fontSize: '0.72rem', color: '#333' }}>Locked</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default XPSystem;
