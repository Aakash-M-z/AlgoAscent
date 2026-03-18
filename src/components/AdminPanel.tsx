import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseAPI } from '../api/database';
import { useToast } from './Toast';
import { User, Activity, AdminLog } from '../../shared/schema';

type SafeUser = Omit<User, 'password'>;

type Tab = 'users' | 'activities' | 'logs';

/* ── small helpers ─────────────────────────────────────────── */
const Chip: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <span style={{ fontSize: '0.65rem', padding: '2px 9px', borderRadius: '999px', fontWeight: 600, color, background: bg, whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

const roleChip = (role: string) =>
  role === 'admin'
    ? <Chip label="admin" color="#D4AF37" bg="rgba(212,175,55,0.12)" />
    : <Chip label="user" color="#818cf8" bg="rgba(129,140,248,0.12)" />;

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', borderRadius: '8px',
  background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
  color: '#EAEAEA', fontSize: '0.8rem', outline: 'none',
};

/* ── component ─────────────────────────────────────────────── */
const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>('users');

  // Users state
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Logs state
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Role change modal
  const [roleTarget, setRoleTarget] = useState<SafeUser | null>(null);

  const adminId = user?.id ?? '';

  /* ── fetchers ─────────────────────────────────────────────── */
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const data = await databaseAPI.adminGetUsers(adminId);
    setUsers(data);
    setUsersLoading(false);
  }, [adminId]);

  const loadActivities = useCallback(async () => {
    setActLoading(true);
    const data = await databaseAPI.adminGetActivities(adminId, {
      userId: filterUserId || undefined,
      date: filterDate || undefined,
    });
    setActivities(data);
    setActLoading(false);
  }, [adminId, filterUserId, filterDate]);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const data = await databaseAPI.adminGetLogs(adminId);
    setLogs(data);
    setLogsLoading(false);
  }, [adminId]);

  // Load on tab switch
  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'activities') loadActivities();
    if (tab === 'logs') loadLogs();
  }, [tab]);

  /* ── actions ──────────────────────────────────────────────── */
  const handleDelete = async (u: SafeUser) => {
    if (!confirm(`Delete user ${u.email}? This cannot be undone.`)) return;
    const ok = await databaseAPI.adminDeleteUser(adminId, u.id);
    if (ok) {
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast(`Deleted ${u.email}`, 'info');
    } else {
      toast('Failed to delete user', 'error');
    }
  };

  const handleRoleChange = async (u: SafeUser, role: 'admin' | 'user') => {
    const updated = await databaseAPI.adminChangeRole(adminId, u.id, role);
    if (updated) {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role } : x));
      toast(`${u.email} is now ${role}`, 'success');
    } else {
      toast('Failed to change role', 'error');
    }
    setRoleTarget(null);
  };

  /* ── KPIs ─────────────────────────────────────────────────── */
  const kpis = [
    { label: 'Total Users', value: users.length, color: '#D4AF37' },
    { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#f59e0b' },
    { label: 'Activities', value: activities.length, color: '#818cf8' },
    { label: 'Audit Logs', value: logs.length, color: '#22c55e' },
  ];

  /* ── tab bar ──────────────────────────────────────────────── */
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'activities', label: 'Activities', icon: '📊' },
    { id: 'logs', label: 'Audit Log', icon: '📋' },
  ];

  return (
    <div className="section-gap animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="page-heading">⚙️ Admin Dashboard</h2>
        <p className="page-subheading">Logged in as <span style={{ color: '#D4AF37' }}>{user?.email}</span></p>
      </div>

      {/* KPI row — only meaningful after data loads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {kpis.map(k => (
          <div key={k.label} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '9px 18px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#D4AF37' : '#555',
              borderBottom: tab === t.id ? '2px solid #D4AF37' : '2px solid transparent',
              transition: 'all 0.18s',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ─────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="card-dark" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">All Users</span>
            <button onClick={loadUsers} style={{ ...inputStyle, cursor: 'pointer', padding: '6px 14px' }}>↻ Refresh</button>
          </div>

          {usersLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Loading…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No users found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Username', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 16px', color: '#EAEAEA', fontWeight: 500 }}>{u.username}</td>
                      <td style={{ padding: '12px 16px', color: '#888' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>{roleChip(u.role)}</td>
                      <td style={{ padding: '12px 16px', color: '#555', whiteSpace: 'nowrap' }}>{fmtDate(u.createdAt)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {u.id !== adminId && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setRoleTarget(u)}
                              style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: '#D4AF37', transition: 'all 0.15s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.2)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.1)'}
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => handleDelete(u)}
                              style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', transition: 'all 0.15s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.18)'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {u.id === adminId && <span style={{ color: '#333', fontSize: '0.72rem' }}>You</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITIES TAB ────────────────────────────────────── */}
      {tab === 'activities' && (
        <div className="section-gap">
          {/* Filters */}
          <div className="card-dark" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div className="kpi-sub" style={{ marginBottom: '5px' }}>Filter by User ID</div>
              <input value={filterUserId} onChange={e => setFilterUserId(e.target.value)} placeholder="e.g. 2" style={{ ...inputStyle, width: '140px' }} />
            </div>
            <div>
              <div className="kpi-sub" style={{ marginBottom: '5px' }}>Filter by Date</div>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: 'dark', width: '160px' }} />
            </div>
            <button onClick={loadActivities}
              style={{ padding: '7px 18px', borderRadius: '8px', background: 'linear-gradient(135deg,#D4AF37,#FFD700)', color: '#0B0B0B', fontWeight: 700, fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}>
              Apply
            </button>
            <button onClick={() => { setFilterUserId(''); setFilterDate(''); }}
              style={{ ...inputStyle, cursor: 'pointer', padding: '7px 14px' }}>
              Clear
            </button>
          </div>

          <div className="card-dark" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Activity Log</span>
              <span className="kpi-sub">{activities.length} records</span>
            </div>
            {actLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Loading…</div>
            ) : activities.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No activities found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['User ID', 'Category', 'Topic', 'Difficulty', 'Platform', 'Time', 'Solved', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map(a => (
                      <tr key={a.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', color: '#888' }}>{a.userId}</td>
                        <td style={{ padding: '10px 14px', color: '#EAEAEA' }}>{a.category}</td>
                        <td style={{ padding: '10px 14px', color: '#BDBDBD', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.topic}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <Chip
                            label={a.difficulty}
                            color={a.difficulty === 'Easy' ? '#22c55e' : a.difficulty === 'Medium' ? '#f59e0b' : '#ef4444'}
                            bg={a.difficulty === 'Easy' ? 'rgba(34,197,94,0.1)' : a.difficulty === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{a.platform}</td>
                        <td style={{ padding: '10px 14px', color: '#888' }}>{a.timeSpent}m</td>
                        <td style={{ padding: '10px 14px' }}>
                          {a.solved
                            ? <Chip label="✓" color="#22c55e" bg="rgba(34,197,94,0.1)" />
                            : <Chip label="✗" color="#555" bg="rgba(255,255,255,0.04)" />}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#555', whiteSpace: 'nowrap' }}>{a.date?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AUDIT LOG TAB ─────────────────────────────────────── */}
      {tab === 'logs' && (
        <div className="card-dark" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Audit Log</span>
            <button onClick={loadLogs} style={{ ...inputStyle, cursor: 'pointer', padding: '6px 14px' }}>↻ Refresh</button>
          </div>
          {logsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No audit logs yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {logs.map(l => (
                <div key={l.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    flexShrink: 0, width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px',
                    background: l.action === 'DELETE_USER' ? '#ef4444' : l.action === 'CHANGE_ROLE' ? '#D4AF37' : '#22c55e',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', color: '#EAEAEA', fontWeight: 500 }}>{l.detail}</div>
                    <div className="kpi-sub" style={{ marginTop: '3px' }}>
                      By {l.adminEmail} · {fmtDate(l.createdAt)}
                    </div>
                  </div>
                  <Chip
                    label={l.action}
                    color={l.action === 'DELETE_USER' ? '#ef4444' : l.action === 'CHANGE_ROLE' ? '#D4AF37' : '#818cf8'}
                    bg={l.action === 'DELETE_USER' ? 'rgba(239,68,68,0.1)' : l.action === 'CHANGE_ROLE' ? 'rgba(212,175,55,0.1)' : 'rgba(129,140,248,0.1)'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Role change modal ──────────────────────────────────── */}
      {roleTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setRoleTarget(null)}>
          <div style={{
            background: '#161616', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '16px',
            padding: '28px 32px', minWidth: '300px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }} onClick={e => e.stopPropagation()}>
            <div className="card-title" style={{ marginBottom: '6px' }}>Change Role</div>
            <div className="kpi-sub" style={{ marginBottom: '20px' }}>{roleTarget.email}</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleRoleChange(roleTarget, 'user')}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', color: '#818cf8', transition: 'all 0.15s' }}>
                Set User
              </button>
              <button onClick={() => handleRoleChange(roleTarget, 'admin')}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', transition: 'all 0.15s' }}>
                Set Admin
              </button>
            </div>
            <button onClick={() => setRoleTarget(null)}
              style={{ marginTop: '12px', width: '100%', padding: '8px', borderRadius: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.06)', color: '#555', cursor: 'pointer', fontSize: '0.8rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
