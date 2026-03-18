import React, { useState, useMemo } from 'react';

interface Resource { type: 'video' | 'article' | 'website'; title: string; url: string; author: string; platform: string; duration?: string; quality: 'beginner' | 'intermediate' | 'advanced'; }
interface Problem { id: string; name: string; difficulty: 'Easy' | 'Medium' | 'Hard'; category: string; resources: Resource[]; }

const DATA: Problem[] = [
  {
    id: 'two-sum', name: 'Two Sum', difficulty: 'Easy', category: 'Arrays & Strings', resources: [
      { type: 'video', title: 'Two Sum - LeetCode Solution Explained', url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA', author: 'NeetCode', platform: 'YouTube', duration: '5:32', quality: 'beginner' },
      { type: 'article', title: 'Two Sum - Multiple Approaches', url: 'https://leetcode.com/problems/two-sum/solution/', author: 'LeetCode', platform: 'LeetCode', quality: 'intermediate' },
    ]
  },
  {
    id: 'valid-parens', name: 'Valid Parentheses', difficulty: 'Easy', category: 'Stacks & Queues', resources: [
      { type: 'video', title: 'Valid Parentheses - Stack Solution', url: 'https://www.youtube.com/watch?v=WTzjTskDFMg', author: 'NeetCode', platform: 'YouTube', duration: '6:45', quality: 'beginner' },
      { type: 'article', title: 'Understanding Stack-based Solutions', url: 'https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/', author: 'GeeksforGeeks', platform: 'GFG', quality: 'intermediate' },
    ]
  },
  {
    id: 'merge-lists', name: 'Merge Two Sorted Lists', difficulty: 'Easy', category: 'Linked Lists', resources: [
      { type: 'video', title: 'Merge Two Sorted Lists - Recursive & Iterative', url: 'https://www.youtube.com/watch?v=XIdigk956u0', author: 'NeetCode', platform: 'YouTube', duration: '7:22', quality: 'beginner' },
    ]
  },
  {
    id: 'max-subarray', name: "Maximum Subarray (Kadane's)", difficulty: 'Medium', category: 'Dynamic Programming', resources: [
      { type: 'video', title: "Kadane's Algorithm Explained", url: 'https://www.youtube.com/watch?v=5WZl3MMT0Eg', author: 'NeetCode', platform: 'YouTube', duration: '9:15', quality: 'intermediate' },
      { type: 'article', title: 'DP - Maximum Subarray', url: 'https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/', author: 'GeeksforGeeks', platform: 'GFG', quality: 'advanced' },
    ]
  },
  {
    id: 'tree-traversal', name: 'Binary Tree Inorder Traversal', difficulty: 'Easy', category: 'Trees & Binary Trees', resources: [
      { type: 'video', title: 'Tree Traversals - Inorder, Preorder, Postorder', url: 'https://www.youtube.com/watch?v=BHB0B1jFKUE', author: 'NeetCode', platform: 'YouTube', duration: '11:45', quality: 'beginner' },
      { type: 'article', title: 'Binary Tree Traversal Methods', url: 'https://www.geeksforgeeks.org/tree-traversals-inorder-preorder-and-postorder/', author: 'GeeksforGeeks', platform: 'GFG', quality: 'intermediate' },
    ]
  },
];

const DIFF_COLOR: Record<string, { color: string; bg: string }> = {
  Easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};
const QUAL_COLOR: Record<string, { color: string; bg: string }> = {
  beginner: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  intermediate: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  advanced: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
};
const TYPE_ICON: Record<string, string> = { video: '🎥', article: '📖', website: '🌐' };

const inputStyle: React.CSSProperties = {
  padding: '9px 14px', background: '#1A1A1A',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
  color: '#EAEAEA', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box',
};

const SolutionResources: React.FC = () => {
  const [search, setSearch] = useState('');
  const [diff, setDiff] = useState('');
  const [cat, setCat] = useState('');

  const categories = useMemo(() => [...new Set(DATA.map(d => d.category))], []);

  const filtered = useMemo(() => DATA.filter(p =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())) &&
    (!diff || p.difficulty === diff) &&
    (!cat || p.category === cat)
  ), [search, diff, cat]);

  return (
    <div className="section-gap animate-fadeIn">
      <div>
        <h2 className="page-heading">Solution Resources</h2>
        <p className="page-subheading">Video tutorials and articles to help you understand DSA problems</p>
      </div>

      {/* Filters */}
      <div className="card-dark" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'end' }}>
        <div>
          <div className="kpi-sub" style={{ marginBottom: '6px' }}>Search</div>
          <input style={inputStyle} placeholder="Problem name or category..." value={search} onChange={e => setSearch(e.target.value)}
            onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
        </div>
        <div>
          <div className="kpi-sub" style={{ marginBottom: '6px' }}>Difficulty</div>
          <select style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }} value={diff} onChange={e => setDiff(e.target.value)}>
            <option value="">All</option>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </div>
        <div>
          <div className="kpi-sub" style={{ marginBottom: '6px' }}>Category</div>
          <select style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }} value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">All</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Problem cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '12px' }}>🔍</div>
          <p style={{ color: '#555', fontSize: '0.9rem' }}>No resources match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map(problem => {
            const dc = DIFF_COLOR[problem.difficulty];
            return (
              <div key={problem.id} className="card-dark" style={{ overflow: 'hidden' }}>
                {/* Problem header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#EAEAEA' }}>{problem.name}</div>
                    <div className="kpi-sub" style={{ marginTop: '2px' }}>{problem.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, background: dc.bg, color: dc.color }}>{problem.difficulty}</span>
                    <span className="kpi-sub">{problem.resources.length} resources</span>
                  </div>
                </div>

                {/* Resources */}
                <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                  {problem.resources.map((r, i) => {
                    const qc = QUAL_COLOR[r.quality];
                    return (
                      <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                      >
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{TYPE_ICON[r.type]}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                          <div className="kpi-sub" style={{ marginBottom: '8px' }}>
                            {r.author} · {r.platform}{r.duration ? ` · ${r.duration}` : ''}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', background: qc.bg, color: qc.color, fontWeight: 600, textTransform: 'capitalize' }}>{r.quality}</span>
                            <a href={r.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 600, textDecoration: 'none' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
                            >View →</a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SolutionResources;
