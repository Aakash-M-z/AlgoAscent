import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, X, Zap, Clock, Sparkles,
  CheckCircle2, Circle, Filter, RotateCcw,
} from 'lucide-react';
import { Activity } from '../types';
import { useToast } from './Toast';

import { PROBLEM_DATASET } from '../../shared/problemDataset';

/* ── Types ───────────────────────────────────────────────────── */
interface Problem {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  platform: string;
  number?: number;
}

interface QuickAddProblemProps {
  onAdd: (activity: Activity) => Promise<boolean>;
}

/* ── Problem bank (from shared dataset) ─────────────────────── */
const PROBLEMS: Problem[] = PROBLEM_DATASET.map(p => ({
  id: p.id,
  number: p.number,
  name: p.name,
  difficulty: p.difficulty,
  topic: p.topic,
  platform: p.platform,
}));

const TOPICS = ['All', ...Array.from(new Set(PROBLEMS.map(p => p.topic))).sort()];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'] as const;

/* ── AI recommendations (top-rated unsolved from dataset) ────── */
const AI_RECS: Problem[] = PROBLEMS.filter(p =>
  ['p53', 'p44', 'p25'].includes(p.id)
);

/* ── Helpers ─────────────────────────────────────────────────── */
const DIFF_META = {
  Easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', dot: '🟢' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', dot: '🟡' },
  Hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', dot: '🔴' },
};

const DiffBadge: React.FC<{ d: 'Easy' | 'Medium' | 'Hard'; small?: boolean }> = ({ d, small }) => {
  const m = DIFF_META[d];
  return (
    <span style={{
      fontSize: small ? '0.62rem' : '0.68rem',
      padding: small ? '1px 7px' : '2px 9px',
      borderRadius: '999px', fontWeight: 700,
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>
      {m.dot} {d}
    </span>
  );
};

const TopicTag: React.FC<{ topic: string; small?: boolean }> = ({ topic, small }) => (
  <span style={{
    fontSize: small ? '0.62rem' : '0.68rem',
    padding: small ? '1px 7px' : '2px 9px',
    borderRadius: '6px', fontWeight: 600,
    color: '#818cf8', background: 'rgba(129,140,248,0.1)',
    border: '1px solid rgba(129,140,248,0.2)',
    whiteSpace: 'nowrap',
  }}>
    {topic}
  </span>
);

const RECENT_KEY = 'qap_recent_v2';
function loadRecent(): Problem[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecent(list: Problem[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
}

/* ── Custom searchable dropdown ──────────────────────────────── */
const ProblemDropdown: React.FC<{
  value: Problem | null;
  onChange: (p: Problem | null) => void;
  topicFilter: string;
  diffFilter: string;
}> = ({ value, onChange, topicFilter, diffFilter }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return PROBLEMS.filter(p => {
      if (topicFilter !== 'All' && p.topic !== topicFilter) return false;
      if (diffFilter !== 'All' && p.difficulty !== diffFilter) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.topic.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, topicFilter, diffFilter]);

  // Group by topic
  const grouped = useMemo(() => {
    const map: Record<string, Problem[]> = {};
    filtered.forEach(p => { (map[p.topic] = map[p.topic] || []).push(p); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const select = (p: Problem) => { onChange(p); setOpen(false); setQuery(''); };
  const clear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(null); };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '11px 14px', borderRadius: '12px',
          background: open ? 'rgba(212,175,55,0.05)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? 'rgba(212,175,55,0.45)' : 'rgba(255,255,255,0.08)'}`,
          cursor: 'pointer', transition: 'all 0.2s ease',
          boxShadow: open ? '0 0 0 3px rgba(212,175,55,0.08)' : 'none',
        }}
      >
        <Search size={15} color="#555" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: '0.875rem', color: value ? '#EAEAEA' : '#444' }}>
          {value ? value.name : 'Search problems…'}
        </span>
        {value && (
          <>
            <DiffBadge d={value.difficulty} small />
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              onClick={clear}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clear(e as unknown as React.MouseEvent); } }}
              style={{ cursor: 'pointer', color: '#555', padding: '0 2px', display: 'flex', lineHeight: 1 }}
            >
              <X size={13} />
            </span>
          </>
        )}
        <ChevronDown size={14} color="#555" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: '#111', border: '1px solid rgba(212,175,55,0.2)',
              borderRadius: '14px', zIndex: 200,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
              overflow: 'hidden', maxHeight: '360px', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Search input */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} color="#555" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type to filter…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#EAEAEA', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif',
                }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex' }}>
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Options list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {grouped.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>No problems match</div>
              ) : grouped.map(([topic, problems]) => (
                <div key={topic}>
                  <div style={{
                    padding: '8px 14px 4px',
                    fontSize: '0.65rem', fontWeight: 700, color: '#333',
                    textTransform: 'uppercase', letterSpacing: '0.14em',
                    position: 'sticky', top: 0, background: '#111', zIndex: 1,
                  }}>
                    {topic}
                  </div>
                  {problems.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => select(p)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 14px', background: value?.id === p.id ? 'rgba(212,175,55,0.08)' : 'transparent',
                        border: 'none', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => { if (value?.id !== p.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={e => { if (value?.id !== p.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {value?.id === p.id
                        ? <CheckCircle2 size={14} color="#D4AF37" style={{ flexShrink: 0 }} />
                        : <Circle size={14} color="#333" style={{ flexShrink: 0 }} />
                      }
                      <span style={{ flex: 1, fontSize: '0.85rem', color: '#EAEAEA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.number && <span style={{ color: '#444', marginRight: '6px', fontSize: '0.75rem' }}>#{p.number}</span>}
                        {p.name}
                      </span>
                      <DiffBadge d={p.difficulty} small />
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────── */
const QuickAddProblem: React.FC<QuickAddProblemProps> = ({ onAdd }) => {
  const { toast } = useToast();

  const [selected, setSelected] = useState<Problem | null>(null);
  const [topicFilter, setTopicFilter] = useState('All');
  const [diffFilter, setDiffFilter] = useState<string>('All');
  const [timeSpent, setTimeSpent] = useState(30);
  const [solved, setSolved] = useState(true);
  const [recent, setRecent] = useState<Problem[]>(loadRecent);

  const [saving, setSaving] = useState(false);

  const addToRecent = useCallback((p: Problem) => {
    setRecent(prev => {
      const next = [p, ...prev.filter(r => r.id !== p.id)].slice(0, 5);
      saveRecent(next);
      return next;
    });
  }, []);

  const handleLog = useCallback(async () => {
    if (!selected) { toast('Select a problem first', 'error'); return; }
    if (saving) return;
    const activity: Activity = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      category: selected.topic,
      duration: timeSpent,
      description: `${solved ? 'Solved' : 'Attempted'}: ${selected.name}`,
      value: solved ? 3 : 2,
      dsaTopic: selected.name,
      difficulty: selected.difficulty,
      platform: selected.platform,
      problemSolved: solved,
    };
    setSaving(true);
    const ok = await onAdd(activity);
    setSaving(false);
    if (ok) {
      addToRecent(selected);
      toast(solved ? `✓ Solved: ${selected.name}` : `📚 Attempted: ${selected.name}`, 'success');
      setSelected(null);
    }
  }, [selected, timeSpent, solved, saving, onAdd, addToRecent, toast]);

  const quickSelect = (p: Problem) => {
    setSelected(p);
    // scroll to log button
    setTimeout(() => document.getElementById('qap-log-btn')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };

  return (
    <div className="card-dark" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#D4AF37" />
          </div>
          <div>
            <div className="card-title" style={{ margin: 0 }}>Problem Selector</div>
            <div className="kpi-sub">Search, filter, and log your sessions</div>
          </div>
        </div>
        {selected && (
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', padding: '4px' }}>
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* ── Filters row ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
        <Filter size={13} color="#555" style={{ flexShrink: 0 }} />
        {/* Difficulty pills */}
        {DIFFICULTIES.map(d => (
          <button key={d} onClick={() => setDiffFilter(d)}
            style={{
              padding: '4px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
              background: diffFilter === d
                ? (d === 'All' ? 'rgba(212,175,55,0.15)' : DIFF_META[d as keyof typeof DIFF_META]?.bg ?? 'rgba(212,175,55,0.15)')
                : 'transparent',
              borderColor: diffFilter === d
                ? (d === 'All' ? 'rgba(212,175,55,0.4)' : DIFF_META[d as keyof typeof DIFF_META]?.border ?? 'rgba(212,175,55,0.4)')
                : 'rgba(255,255,255,0.07)',
              color: diffFilter === d
                ? (d === 'All' ? '#D4AF37' : DIFF_META[d as keyof typeof DIFF_META]?.color ?? '#D4AF37')
                : '#555',
            }}>
            {d === 'All' ? 'All Levels' : `${DIFF_META[d as keyof typeof DIFF_META].dot} ${d}`}
          </button>
        ))}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
        {/* Topic select */}
        <select
          value={topicFilter}
          onChange={e => setTopicFilter(e.target.value)}
          style={{
            padding: '4px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600,
            background: topicFilter !== 'All' ? 'rgba(129,140,248,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${topicFilter !== 'All' ? 'rgba(129,140,248,0.3)' : 'rgba(255,255,255,0.07)'}`,
            color: topicFilter !== 'All' ? '#818cf8' : '#555',
            cursor: 'pointer', outline: 'none', colorScheme: 'dark',
          }}
        >
          {TOPICS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Topics' : t}</option>)}
        </select>
      </div>

      {/* ── Searchable dropdown ── */}
      <ProblemDropdown
        value={selected}
        onChange={setSelected}
        topicFilter={topicFilter}
        diffFilter={diffFilter}
      />

      {/* ── Selected problem preview ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '14px 16px', borderRadius: '12px',
              background: 'rgba(212,175,55,0.05)',
              border: '1px solid rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
            }}>
              <CheckCircle2 size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#EAEAEA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selected.number && <span style={{ color: '#555', marginRight: '6px' }}>#{selected.number}</span>}
                  {selected.name}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <DiffBadge d={selected.difficulty} small />
                  <TopicTag topic={selected.topic} small />
                  <span style={{ fontSize: '0.62rem', color: '#555' }}>{selected.platform}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Log controls ── */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <div className="kpi-sub" style={{ marginBottom: '5px' }}>Time (min)</div>
          <input
            type="number" value={timeSpent} min={5} max={300}
            onChange={e => setTimeSpent(Number(e.target.value))}
            style={{
              width: '80px', padding: '8px 12px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#EAEAEA', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          />
        </div>
        {/* Solved toggle */}
        <div style={{ display: 'flex', gap: '4px', padding: '3px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
          {[true, false].map(v => (
            <button key={String(v)} onClick={() => setSolved(v)}
              style={{
                padding: '6px 14px', borderRadius: '7px', fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: solved === v ? (v ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)') : 'transparent',
                color: solved === v ? (v ? '#22c55e' : '#ef4444') : '#555',
                boxShadow: solved === v ? `0 0 12px ${v ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)'}` : 'none',
              }}>
              {v ? '✓ Solved' : '○ Attempted'}
            </button>
          ))}
        </div>
        <button
          id="qap-log-btn"
          onClick={handleLog}
          disabled={!selected || saving}
          className="btn-gold"
          style={{ padding: '9px 22px', fontSize: '0.875rem', opacity: selected && !saving ? 1 : 0.4, cursor: selected && !saving ? 'pointer' : 'not-allowed', marginLeft: 'auto' }}
        >
          {saving ? 'Saving…' : 'Log Session'}
        </button>
      </div>

      {/* ── Recently solved ── */}
      {recent.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
            <Clock size={13} color="#555" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recently Logged</span>
          </div>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {recent.map(p => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => quickSelect(p)}
                style={{
                  padding: '5px 12px', borderRadius: '999px', cursor: 'pointer',
                  background: selected?.id === p.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selected?.id === p.id ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.07)'}`,
                  display: 'flex', alignItems: 'center', gap: '6px', transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: selected?.id === p.id ? '#D4AF37' : '#888', fontWeight: 500, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
                <DiffBadge d={p.difficulty} small />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Recommendations ── */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
          <Sparkles size={13} color="#D4AF37" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recommended for you</span>
          <span style={{ fontSize: '0.62rem', color: '#555', marginLeft: '2px' }}>AI-powered</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
          {AI_RECS.map((p, i) => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => quickSelect(p)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                padding: '12px 14px', textAlign: 'left', borderRadius: '12px', cursor: 'pointer',
                background: selected?.id === p.id ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${selected?.id === p.id ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
                transition: 'border-color 0.15s, background 0.15s',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Subtle top glow */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.number && <span style={{ color: '#444', marginRight: '5px', fontSize: '0.72rem' }}>#{p.number}</span>}
                {p.name}
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <DiffBadge d={p.difficulty} small />
                <TopicTag topic={p.topic} small />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickAddProblem;
