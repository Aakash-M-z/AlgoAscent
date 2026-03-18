import React, { useState, useMemo } from 'react';
import { DSATopic, Activity } from '../types';
import ProblemPage from './ProblemPage';

interface Props {
  activities?: Activity[];
  onAddActivity?: (activity: Activity) => void;
}

const DSA_ROADMAP: DSATopic[] = [
  { name: 'Arrays & Strings', category: 'Data Structures', difficulty: 'Beginner', status: 'Not Started', problemsSolved: 0, totalProblems: 20 },
  { name: 'Linked Lists', category: 'Data Structures', difficulty: 'Beginner', status: 'Not Started', problemsSolved: 0, totalProblems: 15 },
  { name: 'Stacks & Queues', category: 'Data Structures', difficulty: 'Beginner', status: 'Not Started', problemsSolved: 0, totalProblems: 12 },
  { name: 'Trees & Binary Trees', category: 'Data Structures', difficulty: 'Intermediate', status: 'Not Started', problemsSolved: 0, totalProblems: 25 },
  { name: 'Graphs', category: 'Data Structures', difficulty: 'Intermediate', status: 'Not Started', problemsSolved: 0, totalProblems: 20 },
  { name: 'Heap/Priority Queue', category: 'Data Structures', difficulty: 'Intermediate', status: 'Not Started', problemsSolved: 0, totalProblems: 10 },
  { name: 'Trie', category: 'Data Structures', difficulty: 'Advanced', status: 'Not Started', problemsSolved: 0, totalProblems: 8 },
  { name: 'Union Find', category: 'Data Structures', difficulty: 'Advanced', status: 'Not Started', problemsSolved: 0, totalProblems: 6 },
  { name: 'Binary Search', category: 'Algorithms', difficulty: 'Beginner', status: 'Not Started', problemsSolved: 0, totalProblems: 15 },
  { name: 'Two Pointers', category: 'Algorithms', difficulty: 'Beginner', status: 'Not Started', problemsSolved: 0, totalProblems: 12 },
  { name: 'Sliding Window', category: 'Algorithms', difficulty: 'Intermediate', status: 'Not Started', problemsSolved: 0, totalProblems: 15 },
  { name: 'Sorting', category: 'Algorithms', difficulty: 'Beginner', status: 'Not Started', problemsSolved: 0, totalProblems: 10 },
  { name: 'Recursion', category: 'Algorithms', difficulty: 'Beginner', status: 'Not Started', problemsSolved: 0, totalProblems: 12 },
  { name: 'Backtracking', category: 'Algorithms', difficulty: 'Advanced', status: 'Not Started', problemsSolved: 0, totalProblems: 15 },
  { name: 'Dynamic Programming', category: 'Algorithms', difficulty: 'Advanced', status: 'Not Started', problemsSolved: 0, totalProblems: 30 },
  { name: 'Greedy Algorithms', category: 'Algorithms', difficulty: 'Intermediate', status: 'Not Started', problemsSolved: 0, totalProblems: 18 },
  { name: 'Bit Manipulation', category: 'Algorithms', difficulty: 'Advanced', status: 'Not Started', problemsSolved: 0, totalProblems: 8 },
  { name: 'Math', category: 'Algorithms', difficulty: 'Intermediate', status: 'Not Started', problemsSolved: 0, totalProblems: 12 },
];

// Topics that have problems in ProblemPage
const TOPICS_WITH_PROBLEMS = new Set([
  'Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Trees & Binary Trees',
  'Dynamic Programming', 'Graphs', 'Binary Search', 'Two Pointers',
]);

const DIFF_STYLE: Record<string, { color: string; bg: string }> = {
  Beginner: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  Intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Advanced: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  'Not Started': { color: '#555', bg: 'rgba(255,255,255,0.04)' },
  'In Progress': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Completed': { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'Mastered': { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
};

const DSARoadmap: React.FC<Props> = ({ activities = [], onAddActivity }) => {
  const [catFilter, setCatFilter] = useState<'All' | 'Data Structures' | 'Algorithms'>('All');
  const [diffFilter, setDiffFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const roadmap = useMemo(() => DSA_ROADMAP.map(topic => {
    const related = activities.filter(a =>
      a.category === topic.name || a.dsaTopic?.includes(topic.name)
    );
    const solved = related.filter(a => a.problemSolved).length;
    let status: DSATopic['status'] = 'Not Started';
    if (solved > 0) {
      if (solved >= topic.totalProblems * 0.8) status = 'Mastered';
      else if (solved >= topic.totalProblems * 0.5) status = 'Completed';
      else status = 'In Progress';
    }
    return { ...topic, problemsSolved: solved, status };
  }), [activities]);

  const filtered = roadmap.filter(t =>
    (catFilter === 'All' || t.category === catFilter) &&
    (diffFilter === 'All' || t.difficulty === diffFilter)
  );

  const overall = roadmap.reduce((a, t) => ({ s: a.s + t.problemsSolved, t: a.t + t.totalProblems }), { s: 0, t: 0 });
  const pct = overall.t > 0 ? Math.round(overall.s / overall.t * 100) : 0;

  const selectStyle: React.CSSProperties = {
    padding: '8px 14px', background: '#1A1A1A',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
    color: '#EAEAEA', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
  };

  // Show ProblemPage when a topic is selected
  if (selectedTopic) {
    return (
      <ProblemPage
        category={selectedTopic}
        onBack={() => setSelectedTopic(null)}
        onAddActivity={(activity) => {
          onAddActivity?.(activity);
          setSelectedTopic(null);
        }}
      />
    );
  }

  return (
    <div className="section-gap animate-fadeIn">
      <div>
        <h2 className="page-heading">DSA Roadmap</h2>
        <p className="page-subheading">Track your progress through the complete DSA curriculum</p>
      </div>

      {/* Overall progress */}
      <div className="card-dark" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.875rem', color: '#EAEAEA', fontWeight: 500 }}>Overall Progress</span>
          <span className="kpi-number" style={{ fontSize: '1.4rem' }}>{pct}%</span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #D4AF37, #FFD700)', borderRadius: '999px', transition: 'width 0.8s ease', boxShadow: '0 0 8px rgba(212,175,55,0.4)' }} />
        </div>
        <div className="kpi-sub" style={{ marginTop: '8px' }}>{overall.s} of {overall.t} problems completed</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value as any)} style={selectStyle}>
          <option value="All">All Categories</option>
          <option value="Data Structures">Data Structures</option>
          <option value="Algorithms">Algorithms</option>
        </select>
        <select value={diffFilter} onChange={e => setDiffFilter(e.target.value as any)} style={selectStyle}>
          <option value="All">All Difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '12px' }}>◎</div>
          <p style={{ color: '#555', fontSize: '0.9rem' }}>No topics match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {filtered.map((topic, i) => {
            const diff = DIFF_STYLE[topic.difficulty] ?? DIFF_STYLE.Beginner;
            const stat = STATUS_STYLE[topic.status] ?? STATUS_STYLE['Not Started'];
            const topicPct = Math.round(topic.problemsSolved / topic.totalProblems * 100);
            const hasProblems = TOPICS_WITH_PROBLEMS.has(topic.name);
            return (
              <div
                key={i}
                className="card-dark"
                onClick={() => hasProblems && setSelectedTopic(topic.name)}
                style={{
                  padding: '18px 20px',
                  cursor: hasProblems ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  border: hasProblems ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.03)',
                }}
                onMouseEnter={e => {
                  if (hasProblems) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.04)';
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = hasProblems ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)';
                  (e.currentTarget as HTMLElement).style.background = '';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#EAEAEA', lineHeight: 1.3, flex: 1, marginRight: '8px' }}>
                    {topic.category === 'Data Structures' ? '🏗' : '⚡'} {topic.name}
                  </div>
                  <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '999px', fontWeight: 600, background: stat.bg, color: stat.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {topic.status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', background: diff.bg, color: diff.color, fontWeight: 600 }}>
                    {topic.difficulty}
                  </span>
                  <span className="kpi-sub">{topic.problemsSolved}/{topic.totalProblems}</span>
                </div>

                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${topicPct}%`, background: 'linear-gradient(90deg, #D4AF37, #FFD700)', borderRadius: '999px', transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <div className="kpi-sub">{topicPct}%</div>
                  {hasProblems && <div style={{ fontSize: '0.65rem', color: '#D4AF37', fontWeight: 500 }}>Solve Problems →</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DSARoadmap;
