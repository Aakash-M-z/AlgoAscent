import React, { useState } from 'react';
import { Activity } from '../types';
import { useToast } from './Toast';

interface ActivityFormProps {
  onAddActivity: (activity: Omit<Activity, 'id' | 'date'>) => Promise<boolean>;
}

const DSA_CATEGORIES = [
  'Arrays & Strings', 'Linked Lists', 'Stacks & Queues', 'Trees & Binary Trees',
  'Graphs', 'Dynamic Programming', 'Greedy Algorithms', 'Two Pointers',
  'Sliding Window', 'Binary Search', 'Backtracking', 'Heap/Priority Queue',
  'Trie', 'Union Find', 'Bit Manipulation', 'Math', 'Sorting', 'Recursion', 'Other',
];

const PLATFORMS = [
  'LeetCode', 'HackerRank', 'CodeForces', 'AtCoder',
  'CodeChef', 'GeeksforGeeks', 'InterviewBit', 'Other',
];

const iStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', color: '#EAEAEA', fontSize: '0.875rem',
  fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const lStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: '#666', marginBottom: '6px', letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = '#D4AF37';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)';
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
  e.currentTarget.style.boxShadow = 'none';
};

const ActivityForm: React.FC<ActivityFormProps> = ({ onAddActivity }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState(2);
  const [dsaTopic, setDsaTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | ''>('');
  const [platform, setPlatform] = useState('');
  const [problemSolved, setProblemSolved] = useState(false);
  const [timeComplexity, setTimeComplexity] = useState('');
  const [spaceComplexity, setSpaceComplexity] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setCategory(''); setCustomCategory(''); setDuration(''); setDescription('');
    setValue(2); setDsaTopic(''); setDifficulty(''); setPlatform('');
    setProblemSolved(false); setTimeComplexity(''); setSpaceComplexity(''); setNotes('');
  };

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === 'Other' ? customCategory : category;
    if (!finalCategory || !duration || !description) {
      toast('Please fill in all required fields', 'error');
      return;
    }
    setSaving(true);
    const ok = await onAddActivity({
      category: finalCategory,
      duration: parseInt(duration, 10),
      description,
      value,
      dsaTopic: dsaTopic || undefined,
      difficulty: (difficulty as 'Easy' | 'Medium' | 'Hard') || undefined,
      platform: platform || undefined,
      problemSolved: problemSolved || undefined,
      timeComplexity: timeComplexity || undefined,
      spaceComplexity: spaceComplexity || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (ok) {
      toast(problemSolved ? '🎉 Problem solved! Great work!' : '📝 Activity logged', 'success');
      reset();
      setOpen(false);
    }
  };

  return (
    <div className="card-dark" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: open ? '20px' : 0 }}>
        <div className="card-title">Log DSA Activity</div>
        <button
          type="button"
          onClick={() => { setOpen(o => !o); if (open) reset(); }}
          style={{
            padding: '6px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
            background: open ? 'rgba(255,255,255,0.04)' : 'rgba(212,175,55,0.12)',
            border: open ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(212,175,55,0.3)',
            color: open ? '#666' : '#D4AF37', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          {open ? '✕ Cancel' : '+ New Entry'}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lStyle}>DSA Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ ...iStyle, cursor: 'pointer' }} required onFocus={focusIn} onBlur={focusOut}>
                <option value="">Select category</option>
                {DSA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {category === 'Other' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lStyle}>Custom Category *</label>
                <input value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter category name" style={iStyle} required onFocus={focusIn} onBlur={focusOut} />
              </div>
            )}

            <div>
              <label style={lStyle}>Specific Topic / Problem</label>
              <input value={dsaTopic} onChange={e => setDsaTopic(e.target.value)}
                placeholder="e.g., Two Sum, BFS" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            <div>
              <label style={lStyle}>Platform</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)}
                style={{ ...iStyle, cursor: 'pointer' }} onFocus={focusIn} onBlur={focusOut}>
                <option value="">Select platform</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label style={lStyle}>Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                style={{ ...iStyle, cursor: 'pointer' }} onFocus={focusIn} onBlur={focusOut}>
                <option value="">Select difficulty</option>
                {(['Easy', 'Medium', 'Hard'] as const).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label style={lStyle}>Time Spent (minutes) *</label>
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
                min="1" placeholder="e.g., 45" style={iStyle} required onFocus={focusIn} onBlur={focusOut} />
            </div>

            <div>
              <label style={lStyle}>Time Complexity</label>
              <input value={timeComplexity} onChange={e => setTimeComplexity(e.target.value)}
                placeholder="e.g., O(n log n)" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            <div>
              <label style={lStyle}>Space Complexity</label>
              <input value={spaceComplexity} onChange={e => setSpaceComplexity(e.target.value)}
                placeholder="e.g., O(1)" style={iStyle} onFocus={focusIn} onBlur={focusOut} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lStyle}>Problem Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={2} placeholder="Brief description of what you worked on" required
                style={{ ...iStyle, resize: 'vertical', minHeight: '72px' } as React.CSSProperties}
                onFocus={focusIn} onBlur={focusOut} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lStyle}>Notes & Insights</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={2} placeholder="Key insights, approach, lessons learned"
                style={{ ...iStyle, resize: 'vertical', minHeight: '72px' } as React.CSSProperties}
                onFocus={focusIn} onBlur={focusOut} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lStyle}>
                Understanding Level — {(['', 'Basic', 'Familiar', 'Confident', 'Mastered'] as const)[value]}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="range" min={1} max={4} value={value}
                  onChange={e => setValue(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#D4AF37' }} />
                <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '1rem', width: '20px', textAlign: 'center' }}>
                  {value}
                </span>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <button type="button" onClick={() => setProblemSolved(s => !s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
                  background: problemSolved ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                  border: problemSolved ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  color: problemSolved ? '#22c55e' : '#666',
                  fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s', width: '100%',
                }}>
                <span style={{ fontSize: '1.1rem' }}>{problemSolved ? '✓' : '○'}</span>
                {problemSolved ? 'Problem Solved!' : 'Mark as Solved'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-gold" style={{ padding: '12px', fontSize: '0.9rem', width: '100%', opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : '📝 Log Activity'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ActivityForm;
