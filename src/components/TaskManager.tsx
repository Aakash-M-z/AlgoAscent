import React, { useState, useMemo } from 'react';

export interface Task {
    id: string;
    title: string;
    category: 'Work' | 'Study' | 'Fitness' | 'Personal' | 'Other';
    priority: 'High' | 'Medium' | 'Low';
    deadline: string;
    completed: boolean;
    createdAt: string;
    notes?: string;
}

const CATEGORY_COLORS: Record<Task['category'], string> = {
    Work: '#3b82f6',
    Study: '#D4AF37',
    Fitness: '#22c55e',
    Personal: '#a78bfa',
    Other: '#888',
};

const PRIORITY_COLORS: Record<Task['priority'], string> = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#22c55e',
};

const STORAGE_KEY = 'pt_tasks';

function loadTasks(): Task[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveTasks(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

const EMPTY_FORM = { title: '', category: 'Study' as Task['category'], priority: 'Medium' as Task['priority'], deadline: '', notes: '' };

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#EAEAEA', fontSize: '0.875rem',
    fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box',
};

const TaskManager: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(loadTasks);
    const [form, setForm] = useState(EMPTY_FORM);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [lastDeleted, setLastDeleted] = useState<Task | null>(null);
    const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const persist = (updated: Task[]) => { setTasks(updated); saveTasks(updated); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        if (editId) {
            persist(tasks.map(t => t.id === editId ? { ...t, ...form } : t));
            setEditId(null);
        } else {
            const newTask: Task = { ...form, id: Date.now().toString(), completed: false, createdAt: new Date().toISOString() };
            persist([newTask, ...tasks]);
        }
        setForm(EMPTY_FORM);
        setShowForm(false);
    };

    const toggleComplete = (id: string) => persist(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

    const deleteTask = (task: Task) => {
        persist(tasks.filter(t => t.id !== task.id));
        setLastDeleted(task);
        if (undoTimer) clearTimeout(undoTimer);
        const timer = setTimeout(() => setLastDeleted(null), 5000);
        setUndoTimer(timer);
    };

    const undoDelete = () => {
        if (!lastDeleted) return;
        persist([lastDeleted, ...tasks]);
        setLastDeleted(null);
        if (undoTimer) clearTimeout(undoTimer);
    };

    const startEdit = (task: Task) => {
        setForm({ title: task.title, category: task.category, priority: task.priority, deadline: task.deadline, notes: task.notes || '' });
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
    }), [tasks]);

    const isOverdue = (t: Task) => t.deadline && !t.completed && new Date(t.deadline) < new Date();

    return (
        <div className="animate-fadeIn space-y-6">
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#EAEAEA', margin: 0 }}>Task Manager</h2>
                    <p style={{ color: '#555', fontSize: '0.8rem', margin: '2px 0 0' }}>{stats.completed}/{stats.total} completed · {stats.high} high priority pending</p>
                </div>
                <button
                    onClick={() => { setShowForm(s => !s); setEditId(null); setForm(EMPTY_FORM); }}
                    className="btn-gold"
                    style={{ padding: '9px 20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <span style={{ fontSize: '1.1rem' }}>{showForm ? '✕' : '+'}</span>
                    {showForm ? 'Cancel' : 'Add Task'}
                </button>
            </div>

            {/* Add/Edit form */}
            {showForm && (
                <div className="card-dark p-5 animate-fadeIn">
                    <h3 style={{ color: '#D4AF37', fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {editId ? 'Edit Task' : 'New Task'}
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <input
                                style={inputStyle} placeholder="Task title..." value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                                onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,175,55,0.12)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <select
                            style={{ ...inputStyle, cursor: 'pointer' }} value={form.category}
                            onChange={e => setForm(f => ({ ...f, category: e.target.value as Task['category'] }))}
                        >
                            {(['Work', 'Study', 'Fitness', 'Personal', 'Other'] as Task['category'][]).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            style={{ ...inputStyle, cursor: 'pointer' }} value={form.priority}
                            onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                        >
                            {(['High', 'Medium', 'Low'] as Task['priority'][]).map(p => <option key={p} value={p}>{p} Priority</option>)}
                        </select>
                        <input
                            type="date" style={inputStyle} value={form.deadline}
                            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                            onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        />
                        <input
                            style={inputStyle} placeholder="Notes (optional)" value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            onFocus={e => { e.currentTarget.style.borderColor = '#D4AF37'; }}
                            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        />
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-gold-outline" style={{ padding: '8px 20px', fontSize: '0.85rem' }} onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                            <button type="submit" className="btn-gold" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>{editId ? 'Save Changes' : 'Add Task'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {(['all', 'active', 'completed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: '1px solid',
                            background: filter === f ? 'rgba(212,175,55,0.15)' : 'transparent',
                            borderColor: filter === f ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
                            color: filter === f ? '#D4AF37' : '#666',
                            transition: 'all 0.15s ease',
                        }}
                    >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.08)' }} />
                {(['all', 'Work', 'Study', 'Fitness', 'Personal', 'Other'] as const).map(c => (
                    <button key={c} onClick={() => setCategoryFilter(c)}
                        style={{
                            padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid',
                            background: categoryFilter === c ? 'rgba(212,175,55,0.1)' : 'transparent',
                            borderColor: categoryFilter === c ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)',
                            color: categoryFilter === c ? '#D4AF37' : '#555',
                            transition: 'all 0.15s ease',
                        }}
                    >{c === 'all' ? 'All Categories' : c}</button>
                ))}
            </div>

            {/* Undo toast */}
            {lastDeleted && (
                <div className="animate-fadeIn" style={{
                    background: '#1a1a1a', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '10px',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Task "<span style={{ color: '#EAEAEA' }}>{lastDeleted.title}</span>" deleted</span>
                    <button onClick={undoDelete} style={{ color: '#D4AF37', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Undo</button>
                </div>
            )}

            {/* Task list */}
            {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px', opacity: 0.3 }}>◎</div>
                    <p style={{ color: '#444', fontSize: '0.9rem' }}>No tasks here yet. Add one to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(task => (
                        <div key={task.id}
                            style={{
                                background: task.completed ? 'rgba(255,255,255,0.02)' : '#161616',
                                border: `1px solid ${isOverdue(task) ? 'rgba(239,68,68,0.3)' : task.completed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.2)'}`,
                                borderRadius: '12px', padding: '14px 16px',
                                display: 'flex', alignItems: 'center', gap: '14px',
                                transition: 'all 0.2s ease', opacity: task.completed ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { if (!task.completed) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.4)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isOverdue(task) ? 'rgba(239,68,68,0.3)' : task.completed ? 'rgba(255,255,255,0.05)' : 'rgba(212,175,55,0.2)'; }}
                        >
                            {/* Checkbox */}
                            <button onClick={() => toggleComplete(task.id)}
                                style={{
                                    width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, cursor: 'pointer',
                                    border: `2px solid ${task.completed ? '#D4AF37' : 'rgba(255,255,255,0.2)'}`,
                                    background: task.completed ? 'linear-gradient(135deg, #D4AF37, #B8960C)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {task.completed && <span style={{ color: '#0B0B0B', fontSize: '0.7rem', fontWeight: 700 }}>✓</span>}
                            </button>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ color: task.completed ? '#555' : '#EAEAEA', fontSize: '0.9rem', fontWeight: 500, textDecoration: task.completed ? 'line-through' : 'none' }}>
                                        {task.title}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', background: `${CATEGORY_COLORS[task.category]}20`, color: CATEGORY_COLORS[task.category], border: `1px solid ${CATEGORY_COLORS[task.category]}40` }}>
                                        {task.category}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', background: `${PRIORITY_COLORS[task.priority]}15`, color: PRIORITY_COLORS[task.priority] }}>
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

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                <button onClick={() => startEdit(task)}
                                    style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#666', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s ease' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#666'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
                                >✎</button>
                                <button onClick={() => deleteTask(task)}
                                    style={{ padding: '6px 10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', color: '#666', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s ease' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.4)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#666'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(239,68,68,0.15)'; }}
                                >✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskManager;
