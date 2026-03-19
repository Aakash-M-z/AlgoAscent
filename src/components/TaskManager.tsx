import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../shared/schema';
import { databaseAPI } from '../api/database';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { calculateStreak, getStreakMessage } from '../utils/streakUtils';

// Re-export Task type for other components that import it from here
export type { Task };

const CATEGORY_COLORS: Record<string, string> = {
    Work: '#3b82f6', Study: '#D4AF37', Fitness: '#22c55e',
    Personal: '#a78bfa', Other: '#888',
};
const PRIORITY_COLORS: Record<string, string> = {
    High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e',
};

const iStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#EAEAEA', fontSize: '0.875rem',
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};
const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#D4AF37';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)';
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
    e.currentTarget.style.boxShadow = 'none';
};

/* ── Streak Banner ───────────────────────────────────────────── */
const StreakBanner: React.FC<{ streak: number }> = ({ streak }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: streak > 0 ? 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${streak > 0 ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '14px', transition: 'all 0.4s ease',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '1.8rem', filter: streak > 0 ? 'drop-shadow(0 0 8px rgba(212,175,55,0.6))' : 'grayscale(1) opacity(0.3)' }}>🔥</span>
            <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, color: streak > 0 ? '#D4AF37' : '#333', fontFamily: 'Poppins, Inter, sans-serif' }}>{streak}</span>
                    <span style={{ fontSize: '0.85rem', color: streak > 0 ? '#D4AF37' : '#333', fontWeight: 600 }}>day{streak !== 1 ? 's' : ''} streak</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>{getStreakMessage(streak)}</div>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
            {Array.from({ length: 7 }, (_, i) => (
                <div key={i} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: i < Math.min(streak, 7) ? `rgba(212,175,55,${0.4 + (i / 7) * 0.6})` : 'rgba(255,255,255,0.06)',
                    boxShadow: i < Math.min(streak, 7) ? '0 0 6px rgba(212,175,55,0.4)' : 'none',
                }} />
            ))}
        </div>
    </div>
);

const EMPTY_FORM = { title: '', category: 'Study' as Task['category'], priority: 'Medium' as Task['priority'], deadline: '', notes: '' };

const TaskManager: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [lastDeleted, setLastDeleted] = useState<Task | null>(null);
    const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    // Load tasks from backend
    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        databaseAPI.getUserTasks(user.id)
            .then(setTasks)
            .catch(() => toast('Failed to load tasks', 'error'))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !user?.id) return;

        if (editId) {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === editId ? { ...t, ...form } : t));
            setEditId(null);
            const updated = await databaseAPI.updateTask(editId, form);
            if (!updated) {
                toast('Failed to update task', 'error');
                databaseAPI.getUserTasks(user.id).then(setTasks);
            }
        } else {
            const payload = {
                ...form, userId: user.id,
                completed: false,
                createdAt: new Date().toISOString(),
            };
            // Optimistic: add temp task
            const tempId = `temp_${Date.now()}`;
            const tempTask: Task = { ...payload, id: tempId };
            setTasks(prev => [tempTask, ...prev]);

            const saved = await databaseAPI.createTask(payload);
            if (saved) {
                setTasks(prev => prev.map(t => t.id === tempId ? saved : t));
                toast('Task added', 'success');
            } else {
                setTasks(prev => prev.filter(t => t.id !== tempId));
                toast('Failed to add task', 'error');
            }
        }
        setForm(EMPTY_FORM);
        setShowForm(false);
    }, [form, editId, user?.id, toast]);

    const toggleComplete = useCallback(async (task: Task) => {
        const nowComplete = !task.completed;
        const patch = { completed: nowComplete, completedAt: nowComplete ? new Date().toISOString() : undefined };
        // Optimistic
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...patch } : t));
        const updated = await databaseAPI.updateTask(task.id, patch);
        if (!updated) {
            setTasks(prev => prev.map(t => t.id === task.id ? task : t));
            toast('Failed to update task', 'error');
        }
    }, [toast]);

    const deleteTask = useCallback(async (task: Task) => {
        // Optimistic remove
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setLastDeleted(task);
        if (undoTimer) clearTimeout(undoTimer);
        const timer = setTimeout(() => setLastDeleted(null), 5000);
        setUndoTimer(timer);

        const ok = await databaseAPI.deleteTask(task.id);
        if (!ok) {
            setTasks(prev => [task, ...prev]);
            setLastDeleted(null);
            toast('Failed to delete task', 'error');
        }
    }, [undoTimer, toast]);

    const undoDelete = useCallback(async () => {
        if (!lastDeleted || !user?.id) return;
        setLastDeleted(null);
        if (undoTimer) clearTimeout(undoTimer);
        const saved = await databaseAPI.createTask({ ...lastDeleted, userId: user.id });
        if (saved) setTasks(prev => [saved, ...prev]);
    }, [lastDeleted, undoTimer, user?.id]);

    const startEdit = (task: Task) => {
        setForm({ title: task.title, category: task.category, priority: task.priority, deadline: task.deadline ?? '', notes: task.notes ?? '' });
        setEditId(task.id);
        setShowForm(true);
    };

    const filtered = useMemo(() => tasks.filter(t => {
        const statusOk = filter === 'all' || (filter === 'active' ? !t.completed : t.completed);
        const catOk = categoryFilter === 'all' || t.category === categoryFilter;
        return statusOk && catOk;
    }), [tasks, filter, categoryFilter]);

    const stats = useMemo(() => ({
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        high: tasks.filter(t => t.priority === 'High' && !t.completed).length,
        streak: calculateStreak(tasks),
    }), [tasks]);

    const isOverdue = (t: Task) => !!t.deadline && !t.completed && new Date(t.deadline) < new Date();

    return (
        <div className="animate-fadeIn section-gap">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 className="page-heading">Task Manager</h2>
                    <p className="page-subheading">{stats.completed}/{stats.total} completed · {stats.high} high priority pending</p>
                </div>
                <button onClick={() => { setShowForm(s => !s); setEditId(null); setForm(EMPTY_FORM); }}
                    className="btn-gold" style={{ padding: '9px 20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{showForm ? '✕' : '+'}</span>
                    {showForm ? 'Cancel' : 'Add Task'}
                </button>
            </div>

            <StreakBanner streak={stats.streak} />

            {showForm && (
                <div className="card-dark" style={{ padding: '20px' }}>
                    <div className="card-title" style={{ marginBottom: '16px' }}>{editId ? 'Edit Task' : 'New Task'}</div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <input style={iStyle} placeholder="Task title..." value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                                onFocus={focusIn} onBlur={focusOut} />
                        </div>
                        <select style={{ ...iStyle, cursor: 'pointer' }} value={form.category}
                            onChange={e => setForm(f => ({ ...f, category: e.target.value as Task['category'] }))}
                            onFocus={focusIn} onBlur={focusOut}>
                            {(['Work', 'Study', 'Fitness', 'Personal', 'Other'] as const).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select style={{ ...iStyle, cursor: 'pointer' }} value={form.priority}
                            onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                            onFocus={focusIn} onBlur={focusOut}>
                            {(['High', 'Medium', 'Low'] as const).map(p => <option key={p} value={p}>{p} Priority</option>)}
                        </select>
                        <input type="date" style={iStyle} value={form.deadline}
                            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                            onFocus={focusIn} onBlur={focusOut} />
                        <input style={iStyle} placeholder="Notes (optional)" value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            onFocus={focusIn} onBlur={focusOut} />
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-gold-outline" style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                                onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                            <button type="submit" className="btn-gold" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                                {editId ? 'Save Changes' : 'Add Task'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(['all', 'active', 'completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500,
                        cursor: 'pointer', border: '1px solid',
                        background: filter === f ? 'rgba(212,175,55,0.15)' : 'transparent',
                        borderColor: filter === f ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
                        color: filter === f ? '#D4AF37' : '#666',
                    }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)' }} />
                {(['all', 'Work', 'Study', 'Fitness', 'Personal', 'Other'] as const).map(c => (
                    <button key={c} onClick={() => setCategoryFilter(c)} style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem',
                        cursor: 'pointer', border: '1px solid',
                        background: categoryFilter === c ? 'rgba(212,175,55,0.1)' : 'transparent',
                        borderColor: categoryFilter === c ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)',
                        color: categoryFilter === c ? '#D4AF37' : '#555',
                    }}>{c === 'all' ? 'All Categories' : c}</button>
                ))}
            </div>

            {/* Undo toast */}
            {lastDeleted && (
                <div style={{
                    background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>
                        Task "<span style={{ color: '#EAEAEA' }}>{lastDeleted.title}</span>" deleted
                    </span>
                    <button onClick={undoDelete} style={{ color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Undo</button>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div className="spinner-gold" />
                </div>
            ) : filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ textAlign: 'center', padding: '60px 20px' }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.15 }}>◎</div>
                    <div style={{ color: '#555', fontSize: '0.9rem', marginBottom: '6px' }}>No tasks here</div>
                    <div style={{ color: '#3a3a3a', fontSize: '0.78rem' }}>Click "Add Task" above to create your first task.</div>
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <AnimatePresence initial={false}>
                        {filtered.map((task, i) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                                transition={{ delay: i * 0.03, duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <div style={{
                                    background: task.completed ? 'rgba(255,255,255,0.02)' : '#161616',
                                    border: `1px solid ${isOverdue(task) ? 'rgba(239,68,68,0.3)' : task.completed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.2)'}`,
                                    borderRadius: '12px', padding: '14px 16px',
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    transition: 'all 0.2s ease', opacity: task.completed ? 0.6 : 1,
                                }}
                                    onMouseEnter={e => { if (!task.completed) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isOverdue(task) ? 'rgba(239,68,68,0.3)' : task.completed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.2)'; }}
                                >
                                    <button onClick={() => toggleComplete(task)} style={{
                                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, cursor: 'pointer',
                                        border: `2px solid ${task.completed ? '#D4AF37' : 'rgba(255,255,255,0.2)'}`,
                                        background: task.completed ? 'linear-gradient(135deg, #D4AF37, #B8960C)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                                    }}>
                                        {task.completed && <span style={{ color: '#0B0B0B', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
                                    </button>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ color: task.completed ? '#555' : '#EAEAEA', fontSize: '0.9rem', fontWeight: 500, textDecoration: task.completed ? 'line-through' : 'none' }}>
                                                {task.title}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', background: `${CATEGORY_COLORS[task.category] ?? '#888'}20`, color: CATEGORY_COLORS[task.category] ?? '#888', border: `1px solid ${CATEGORY_COLORS[task.category] ?? '#888'}40` }}>
                                                {task.category}
                                            </span>
                                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', background: `${PRIORITY_COLORS[task.priority] ?? '#888'}15`, color: PRIORITY_COLORS[task.priority] ?? '#888' }}>
                                                {task.priority}
                                            </span>
                                            {isOverdue(task) && <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600 }}>Overdue</span>}
                                        </div>
                                        {(task.deadline || task.notes) && (
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                                                {task.deadline && <span style={{ fontSize: '0.75rem', color: isOverdue(task) ? '#ef4444' : '#555' }}>📅 {new Date(task.deadline).toLocaleDateString()}</span>}
                                                {task.notes && <span style={{ fontSize: '0.75rem', color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{task.notes}</span>}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        <button onClick={() => startEdit(task)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#666', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#666'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>✎</button>
                                        <button onClick={() => deleteTask(task)} style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#666', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#666'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.15)'; }}>✕</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default TaskManager;
