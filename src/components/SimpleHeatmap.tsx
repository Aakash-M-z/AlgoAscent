import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from '../types';

interface Props { activities: Activity[]; }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

interface TooltipData {
  date: string;
  count: number;
  topics: string[];
  easy: number;
  medium: number;
  hard: number;
  x: number;
  y: number;
}

const SimpleHeatmap: React.FC<Props> = ({ activities }) => {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [period, setPeriod] = useState<90 | 180 | 365>(365);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a rich map: date → { count, topics, easy, medium, hard }
  const activityMap = useMemo(() => {
    const m = new Map<string, { count: number; topics: Set<string>; easy: number; medium: number; hard: number }>();
    activities.forEach(a => {
      const k = a.date.slice(0, 10);
      const cur = m.get(k) ?? { count: 0, topics: new Set<string>(), easy: 0, medium: 0, hard: 0 };
      cur.count++;
      if (a.category) cur.topics.add(a.category);
      if (a.difficulty === 'Easy') cur.easy++;
      else if (a.difficulty === 'Medium') cur.medium++;
      else if (a.difficulty === 'Hard') cur.hard++;
      m.set(k, cur);
    });
    return m;
  }, [activities]);

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, [period]);

  const firstDow = (new Date(days[0]).getDay() + 6) % 7;
  const padded = [...Array(firstDow).fill(null), ...days];
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const cellColor = (count: number) => {
    if (!count) return 'rgba(255,255,255,0.04)';
    if (count === 1) return 'rgba(212,175,55,0.25)';
    if (count === 2) return 'rgba(212,175,55,0.45)';
    if (count === 3) return 'rgba(212,175,55,0.65)';
    return 'rgba(212,175,55,0.9)';
  };

  const totalSessions = activities.filter(a => {
    const age = Date.now() - new Date(a.date).getTime();
    return age <= period * 86_400_000;
  }).length;

  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 365; i++) {
      const k = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      if (activityMap.has(k)) s++; else if (i > 0) break;
    }
    return s;
  })();

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const first = week.find(d => d !== null);
    if (first) {
      const m = new Date(first).getMonth();
      if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], col: wi }); lastMonth = m; }
    }
  });

  const handleCellEnter = (e: React.MouseEvent, day: string) => {
    const data = activityMap.get(day);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const x = containerRect ? rect.left - containerRect.left + rect.width / 2 : rect.left;
    const y = containerRect ? rect.top - containerRect.top : rect.top;
    setTooltip({
      date: day,
      count: data?.count ?? 0,
      topics: data ? [...data.topics] : [],
      easy: data?.easy ?? 0,
      medium: data?.medium ?? 0,
      hard: data?.hard ?? 0,
      x, y,
    });
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: 'Sessions', value: totalSessions, color: '#D4AF37' },
            { label: 'Streak', value: `${streak}d`, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: '0.62rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([90, 180, 365] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{
                padding: '3px 11px', borderRadius: '7px', fontSize: '0.7rem', fontWeight: 600,
                cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                background: period === p ? 'rgba(212,175,55,0.12)' : 'transparent',
                borderColor: period === p ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)',
                color: period === p ? '#D4AF37' : '#555',
              }}>
              {p === 365 ? '1y' : p === 180 ? '6m' : '3m'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0', minWidth: 'max-content' }}>
          {/* Month labels */}
          <div style={{ display: 'flex', marginBottom: '4px', paddingLeft: '24px' }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.col === wi);
              return (
                <div key={wi} style={{ width: '13px', marginRight: '2px', fontSize: '0.6rem', color: '#444', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {ml ? ml.label : ''}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '0' }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '6px', paddingTop: '1px' }}>
              {DAYS.map((d, i) => (
                <div key={i} style={{ height: '11px', fontSize: '0.55rem', color: '#444', lineHeight: '11px', textAlign: 'right', width: '18px' }}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ display: 'flex', gap: '2px' }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {week.map((day, di) => {
                    if (!day) return <div key={di} style={{ width: '11px', height: '11px' }} />;
                    const data = activityMap.get(day);
                    const count = data?.count ?? 0;
                    const isToday = day === new Date().toISOString().slice(0, 10);
                    const isHov = tooltip?.date === day;
                    return (
                      <motion.div
                        key={day}
                        whileHover={{ scale: 1.5 }}
                        transition={{ duration: 0.1 }}
                        onMouseEnter={e => handleCellEnter(e, day)}
                        onMouseLeave={() => setTooltip(null)}
                        style={{
                          width: '11px', height: '11px', borderRadius: '2px',
                          background: cellColor(count),
                          border: isToday ? '1px solid rgba(212,175,55,0.7)' : '1px solid transparent',
                          cursor: 'default',
                          boxShadow: isHov && count > 0 ? `0 0 8px rgba(212,175,55,0.5)` : 'none',
                          transition: 'background 0.15s',
                          zIndex: isHov ? 10 : 1,
                          position: 'relative',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating rich tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            key={tooltip.date}
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              left: Math.min(tooltip.x, 260),
              top: tooltip.y - 110,
              zIndex: 100,
              background: '#161616',
              border: '1px solid rgba(212,175,55,0.25)',
              borderRadius: '10px',
              padding: '10px 14px',
              minWidth: '160px',
              pointerEvents: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37', marginBottom: '6px' }}>{tooltip.date}</div>
            {tooltip.count === 0 ? (
              <div style={{ fontSize: '0.72rem', color: '#444' }}>No activity</div>
            ) : (
              <>
                <div style={{ fontSize: '0.78rem', color: '#EAEAEA', fontWeight: 600, marginBottom: '6px' }}>
                  {tooltip.count} session{tooltip.count !== 1 ? 's' : ''}
                </div>
                {/* Difficulty breakdown */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {tooltip.easy > 0 && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 600 }}>E×{tooltip.easy}</span>}
                  {tooltip.medium > 0 && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 600 }}>M×{tooltip.medium}</span>}
                  {tooltip.hard > 0 && <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontWeight: 600 }}>H×{tooltip.hard}</span>}
                </div>
                {/* Topics */}
                {tooltip.topics.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {tooltip.topics.slice(0, 3).map(t => (
                      <div key={t} style={{ fontSize: '0.65rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(212,175,55,0.4)', flexShrink: 0, display: 'inline-block' }} />
                        {t}
                      </div>
                    ))}
                    {tooltip.topics.length > 3 && <div style={{ fontSize: '0.62rem', color: '#333' }}>+{tooltip.topics.length - 3} more</div>}
                  </div>
                )}
              </>
            )}
            {/* Arrow */}
            <div style={{ position: 'absolute', bottom: '-5px', left: '20px', width: '8px', height: '8px', background: '#161616', border: '1px solid rgba(212,175,55,0.25)', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px' }}>
        <span style={{ fontSize: '0.62rem', color: '#444' }}>Less</span>
        {[0, 1, 2, 3, 4].map(v => (
          <div key={v} style={{ width: '11px', height: '11px', borderRadius: '2px', background: cellColor(v) }} />
        ))}
        <span style={{ fontSize: '0.62rem', color: '#444' }}>More</span>
      </div>

      {activities.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0 8px' }}>
          <div style={{ fontSize: '0.82rem', color: '#444' }}>Log your first session to light up the heatmap ✦</div>
        </div>
      )}
    </div>
  );
};

export default SimpleHeatmap;
