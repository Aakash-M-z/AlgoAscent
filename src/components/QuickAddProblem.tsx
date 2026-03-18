import React, { useState } from 'react';
import { Activity } from '../types';
import { useToast } from './Toast';

interface QuickAddProblemProps {
  onAdd: (activity: Activity) => void;
}

const POPULAR_PROBLEMS = [
  { name: 'Two Sum', difficulty: 'Easy', platform: 'LeetCode', category: 'Arrays & Strings' },
  { name: 'Valid Parentheses', difficulty: 'Easy', platform: 'LeetCode', category: 'Stacks & Queues' },
  { name: 'Merge Two Sorted Lists', difficulty: 'Easy', platform: 'LeetCode', category: 'Linked Lists' },
  { name: 'Maximum Subarray', difficulty: 'Medium', platform: 'LeetCode', category: 'Dynamic Programming' },
  { name: 'Climbing Stairs', difficulty: 'Easy', platform: 'LeetCode', category: 'Dynamic Programming' },
  { name: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', platform: 'LeetCode', category: 'Arrays & Strings' },
  { name: 'Binary Search', difficulty: 'Easy', platform: 'LeetCode', category: 'Binary Search' },
  { name: 'Reverse Linked List', difficulty: 'Easy', platform: 'LeetCode', category: 'Linked Lists' },
];

const diffColor = (d: string) => {
  if (d === 'Easy') return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
  if (d === 'Medium') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
};

const QuickAddProblem: React.FC<QuickAddProblemProps> = ({ onAdd }) => {
  const { toast } = useToast();
  const [timeSpent, setTimeSpent] = useState(15);
  const [solved, setSolved] = useState(false);

  const handleQuickAdd = (problem: typeof POPULAR_PROBLEMS[0]) => {
    const activity: Activity = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      category: problem.category,
      duration: timeSpent,
      description: `Worked on ${problem.name}`,
      value: solved ? 3 : 2,
      dsaTopic: problem.name,
      difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
      platform: problem.platform,
      problemSolved: solved,
    };
    onAdd(activity);
    toast(solved ? `✓ Solved: ${problem.name}` : `📚 Logged: ${problem.name}`, 'success');
  };

  return (
    <div className="card-dark" style={{ padding: '20px 24px' }}>
      <div className="card-title" style={{ marginBottom: '16px' }}>⚡ Quick Add Problem</div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div className="kpi-sub" style={{ marginBottom: '6px' }}>Time spent (min)</div>
          <input
            type="number"
            value={timeSpent}
            onChange={e => setTimeSpent(Number(e.target.value))}
            min={5} max={300}
            style={{
              width: '90px', padding: '8px 12px', borderRadius: '8px',
              background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
              color: '#EAEAEA', fontSize: '0.875rem', outline: 'none',
            }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '2px' }}>
          <input
            type="checkbox"
            checked={solved}
            onChange={e => setSolved(e.target.checked)}
            style={{ accentColor: '#D4AF37', width: '15px', height: '15px' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#EAEAEA' }}>Solved</span>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
        {POPULAR_PROBLEMS.map((p, i) => {
          const dc = diffColor(p.difficulty);
          return (
            <button
              key={i}
              onClick={() => handleQuickAdd(p)}
              style={{
                padding: '10px 14px', textAlign: 'left', borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.06)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.25)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '6px' }}>{p.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '999px', fontWeight: 600, color: dc.color, background: dc.bg }}>
                  {p.difficulty}
                </span>
                <span className="kpi-sub" style={{ fontSize: '0.65rem' }}>{p.platform}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="kpi-sub" style={{ marginTop: '12px', textAlign: 'center' }}>
        Click any problem to log your session
      </div>
    </div>
  );
};

export default QuickAddProblem;
