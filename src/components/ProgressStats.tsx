import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from '../types';

interface ProgressStatsProps {
  activities: Activity[];
}

const BAR_COLORS = ['#D4AF37', '#818cf8', '#22c55e', '#38bdf8', '#f59e0b', '#ef4444'];

const diffColor = (d: string) =>
  d === 'Easy' ? { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' }
    : d === 'Medium' ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' }
      : { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };

const ProgressStats: React.FC<ProgressStatsProps> = ({ activities }) => {
  const stats = useMemo(() => {
    const total = activities.length;
    const totalTime = activities.reduce((s, a) => s + a.duration, 0);
    const solved = activities.filter(a => a.problemSolved).length;
    const totalProblems = activities.filter(a => a.dsaTopic).length;
    const successRate = totalProblems > 0 ? Math.round((solved / totalProblems) * 100) : 0;
    const avgUnderstanding = total > 0
      ? (activities.reduce((s, a) => s + a.value, 0) / total).toFixed(1)
      : '0';

    const difficulty: Record<string, number> = {};
    const platform: Record<string, number> = {};
    const topic: Record<string, number> = {};

    activities.forEach(a => {
      if (a.difficulty) difficulty[a.difficulty] = (difficulty[a.difficulty] || 0) + 1;
      if (a.platform) platform[a.platform] = (platform[a.platform] || 0) + 1;
      if (a.category) topic[a.category] = (topic[a.category] || 0) + 1;
    });

    const recent = [...activities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return { total, totalTime, solved, totalProblems, successRate, avgUnderstanding, difficulty, platform, topic, recent };
  }, [activities]);

  const fmt = (m: number) => {
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}h ${min}m` : `${min}m`;
  };

  const kpis = [
    { label: 'Total Sessions', value: stats.total, color: '#D4AF37', icon: '▦', sub: 'all time' },
    { label: 'Problems Solved', value: stats.solved, color: '#22c55e', icon: '✓', sub: 'logged' },
    { label: 'Total Time', value: fmt(stats.totalTime), color: '#818cf8', icon: '◐', sub: 'invested' },
    { label: 'Avg Understanding', value: stats.avgUnderstanding, color: '#38bdf8', icon: '◈', sub: 'out of 10' },
  ];

  return (
    <div className="animate-fadeIn section-gap">
      <div>
        <h2 className="page-heading">Statistics</h2>
        <p className="page-subheading">Detailed breakdown of your learning progress</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {kpis.map(k => (
          <div key={k.label} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '1.3rem', lineHeight: 1 }}>{k.icon}</div>
            <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Success rate */}
      {stats.totalProblems > 0 && (
        <div className="card-dark" style={{ padding: '20px 24px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>🎯 Success Rate</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${stats.successRate}%`,
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                  borderRadius: '999px', transition: 'width 1s ease',
                  boxShadow: '0 0 8px rgba(34,197,94,0.4)',
                }} />
              </div>
              <div className="kpi-sub" style={{ marginTop: '8px' }}>
                {stats.solved} of {stats.totalProblems} problems solved
              </div>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e', fontFamily: 'Poppins, sans-serif', flexShrink: 0 }}>
              {stats.successRate}%
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Difficulty distribution */}
        {Object.keys(stats.difficulty).length > 0 && (
          <div className="card-dark" style={{ padding: '20px 24px' }}>
            <div className="card-title" style={{ marginBottom: '16px' }}>📊 Difficulty</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(stats.difficulty).map(([d, count]) => {
                const c = diffColor(d);
                const pct = Math.round((count / stats.total) * 100);
                return (
                  <div key={d}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{
                        fontSize: '0.72rem', padding: '2px 10px', borderRadius: '999px',
                        fontWeight: 600, color: c.color, background: c.bg, border: `1px solid ${c.border}`,
                      }}>{d}</span>
                      <span style={{ fontSize: '0.8rem', color: c.color, fontWeight: 700 }}>{count} <span style={{ color: '#555', fontWeight: 400 }}>({pct}%)</span></span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: c.color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Platform usage */}
        {Object.keys(stats.platform).length > 0 && (
          <div className="card-dark" style={{ padding: '20px 24px' }}>
            <div className="card-title" style={{ marginBottom: '16px' }}>🌐 Platforms</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(stats.platform)
                .sort(([, a], [, b]) => b - a)
                .map(([p, count], i) => {
                  const maxVal = Math.max(...Object.values(stats.platform));
                  const pct = Math.round((count / maxVal) * 100);
                  return (
                    <div key={p}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#EAEAEA' }}>{p}</span>
                        <span style={{ fontSize: '0.8rem', color: BAR_COLORS[i % BAR_COLORS.length], fontWeight: 700 }}>{count}</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: BAR_COLORS[i % BAR_COLORS.length],
                          borderRadius: '999px', transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Top topics */}
      {Object.keys(stats.topic).length > 0 && (
        <div className="card-dark" style={{ padding: '20px 24px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>📚 Most Studied Topics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(stats.topic)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([t, count], i) => {
                const maxVal = Math.max(...Object.values(stats.topic));
                const pct = Math.round((count / maxVal) * 100);
                return (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#555', width: '16px', textAlign: 'right', flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontSize: '0.875rem', color: '#EAEAEA', width: '120px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                    <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: `linear-gradient(90deg, ${BAR_COLORS[i % BAR_COLORS.length]}, ${BAR_COLORS[i % BAR_COLORS.length]}88)`,
                        borderRadius: '999px', transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#555', flexShrink: 0, width: '60px', textAlign: 'right' }}>{count} sessions</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recent.length > 0 && (
        <div className="card-dark" style={{ padding: '20px 24px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>🕒 Recent Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recent.map(a => (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.04)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.problemSolved ? '#22c55e' : '#D4AF37', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', color: '#EAEAEA', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.dsaTopic || a.category}
                  </div>
                  <div className="kpi-sub" style={{ marginTop: '2px' }}>{a.description}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>{fmt(a.duration)}</div>
                  <div className="kpi-sub">{new Date(a.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activities.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: 'center', padding: '80px 20px' }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.12 }}>▦</div>
          <div style={{ color: '#555', fontSize: '0.9rem', marginBottom: '6px' }}>No data yet</div>
          <div style={{ color: '#3a3a3a', fontSize: '0.78rem' }}>Start logging activities to see your detailed stats here.</div>
        </motion.div>
      )}
    </div>
  );
};

export default ProgressStats;
