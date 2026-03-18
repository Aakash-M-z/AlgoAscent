
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Header from './components/Header';
import Login from './components/Login';
import HomePage from './components/HomePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Activity } from './types';
import { databaseAPI } from './api/database';
import { SessionManager } from './utils/sessionManager';
import { dbToFrontendActivity, frontendToDbActivity } from './utils/activityTransform';

import SimpleHeatmap from './components/SimpleHeatmap';
import ProgressStats from './components/ProgressStats';
import ActivityForm from './components/ActivityForm';
import DSARoadmap from './components/DSARoadmap';
import StreakTracker from './components/StreakTracker';
import RoleBasedRoute from './components/RoleBasedRoute';
import AdminPanel from './components/AdminPanel';
import DailyProblemNotification from './components/DailyProblemNotification';
import NotificationSettings from './components/NotificationSettings';
import BadgeSystem from './components/BadgeSystem';
import SolutionResources from './components/SolutionResources';
import QuickAddProblem from './components/QuickAddProblem';
import DailyMotivation from './components/DailyMotivation';
import UserProfile from './components/UserProfile';
import AIAnalysis from './components/AIAnalysis';
import AIAssistant from './components/AIAssistant';
import TaskManager from './components/TaskManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ErrorBoundary from './components/ErrorBoundary';

/* ── Nav items ─────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '⊞', section: 'main' },
  { id: 'tasks', label: 'Tasks', icon: '✓', section: 'main' },
  { id: 'analytics', label: 'Analytics', icon: '◐', section: 'main' },
  { id: 'ai', label: 'AI Assistant', icon: '◈', section: 'main' },
  { id: 'roadmap', label: 'DSA Roadmap', icon: '◎', section: 'tools' },
  { id: 'stats', label: 'Statistics', icon: '▦', section: 'tools' },
  { id: 'badges', label: 'Badges', icon: '◆', section: 'tools' },
  { id: 'resources', label: 'Resources', icon: '◇', section: 'tools' },
  { id: 'profile', label: 'Profile', icon: '◉', section: 'account' },
];

/* ── Sidebar ───────────────────────────────────────────────────── */
interface SidebarProps {
  tabs: typeof NAV_ITEMS;
  activeTab: string;
  onTabChange: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ tabs, activeTab, onTabChange, collapsed, onToggle }) => {
  const sections = [
    { key: 'main', label: 'Main' },
    { key: 'tools', label: 'Tools' },
    { key: 'account', label: 'Account' },
  ];

  return (
    <aside className="sidebar hidden md:flex flex-col sticky top-16 h-[calc(100vh-64px)]"
      style={{ width: collapsed ? '60px' : '216px', flexShrink: 0, transition: 'width 0.25s ease', overflow: 'hidden' }}>
      {/* Toggle */}
      <div style={{ padding: '12px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <button onClick={onToggle}
          style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#555', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#555'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
        >{collapsed ? '▶' : '◀'}</button>
      </div>

      <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {sections.map(sec => {
          const items = tabs.filter(t => t.section === sec.key);
          if (items.length === 0) return null;
          return (
            <div key={sec.key} style={{ marginBottom: '8px' }}>
              {!collapsed && (
                <div style={{ fontSize: '0.6rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '8px 10px 4px', fontWeight: 600 }}>
                  {sec.label}
                </div>
              )}
              {items.map(tab => (
                <button key={tab.id} onClick={() => onTabChange(tab.id)} title={collapsed ? tab.label : undefined}
                  className={`sidebar-item w-full ${activeTab === tab.id ? 'active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '10px 12px' }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>{tab.icon}</span>
                  {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tab.label}</span>}
                </button>
              ))}
              {!collapsed && <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '8px 4px' }} />}
            </div>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <div style={{ fontSize: '0.65rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Progress Tracker</div>
        </div>
      )}
    </aside>
  );
};

/* ── AppContent ────────────────────────────────────────────────── */
const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDailyProblem, setShowDailyProblem] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tabs = useMemo(() => [
    ...NAV_ITEMS,
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '⚙', section: 'account' as const }] : []),
  ], [user?.role]);

  useEffect(() => {
    if (isAuthenticated && user) loadActivities();
    else { setActivities([]); setLoading(false); }
  }, [isAuthenticated, user]);

  useEffect(() => { if (isAuthenticated) setShowLogin(false); }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const iv = setInterval(() => SessionManager.refreshSession(), 30 * 60 * 1000);
    return () => clearInterval(iv);
  }, [isAuthenticated]);

  const loadActivities = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const db = await databaseAPI.getUserActivities(user.id);
      setActivities(db.map(dbToFrontendActivity));
    } catch {
      const saved = localStorage.getItem(`activities_${user.id}`);
      if (saved) { try { setActivities(JSON.parse(saved)); } catch { setActivities([]); } }
    } finally { setLoading(false); }
  }, [user]);

  const addActivity = async (activity: Omit<Activity, 'id' | 'date'>) => {
    if (!user) return;
    const full: Activity = { ...activity, id: Date.now().toString(), date: new Date().toISOString() };
    try {
      const created = await databaseAPI.createActivity(frontendToDbActivity(full, user.id));
      if (created) setActivities(p => [...p, dbToFrontendActivity(created)]);
      else { setActivities(p => [...p, full]); localStorage.setItem(`activities_${user.id}`, JSON.stringify([...activities, full])); }
    } catch {
      setActivities(p => [...p, full]);
      localStorage.setItem(`activities_${user.id}`, JSON.stringify([...activities, full]));
    }
  };

  const quickStats = useMemo(() => {
    const dates = [...new Set(activities.map(a => a.date.split('T')[0]))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    if (dates.includes(today)) {
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        if (Math.floor((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000) === 1) streak++;
        else break;
      }
    }
    return {
      totalActivities: activities.length,
      problemsSolved: activities.filter(a => a.problemSolved).length,
      totalTime: Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60),
      topicsCovered: new Set(activities.map(a => a.category)).size,
      currentStreak: streak,
    };
  }, [activities]);

  const handleTabChange = useCallback((id: string) => setActiveTab(id), []);

  const Spinner = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0B' }}>
      <div className="text-center animate-fadeIn">
        <div className="spinner-gold mx-auto mb-4" />
        <p style={{ color: '#555', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>Loading...</p>
      </div>
    </div>
  );

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return showLogin
    ? <Login onLogin={() => { }} onBack={() => setShowLogin(false)} />
    : <HomePage onGetStarted={() => setShowLogin(true)} />;
  if (loading) return <Spinner />;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0B0B0B 0%, #111111 50%, #0E0E0E 100%)', color: '#EAEAEA', fontFamily: 'Inter, Poppins, sans-serif' }} className="animate-fadeIn">
      <Header />
      <DailyProblemNotification />
      {showDailyProblem && <DailyProblemNotification forceShow onClose={() => setShowDailyProblem(false)} />}
      <NotificationSettings onTriggerDailyProblem={() => setShowDailyProblem(true)} />

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <Sidebar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

        <main style={{ flex: 1, overflow: 'auto', padding: '24px', minWidth: 0 }}>
          {/* Mobile tab nav */}
          <div className="md:hidden tab-nav mb-5">
            {tabs.map(t => (
              <button key={t.id} onClick={() => handleTabChange(t.id)} className={`tab-item ${activeTab === t.id ? 'active' : ''}`}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>

          <ErrorBoundary key={activeTab}>
            {activeTab === 'overview' && <OverviewTab activities={activities} quickStats={quickStats} addActivity={addActivity} user={user} />}
            {activeTab === 'tasks' && <div className="card-dark p-6"><TaskManager /></div>}
            {activeTab === 'analytics' && <AnalyticsDashboard activities={activities} />}
            {activeTab === 'ai' && <div className="card-dark p-6"><AIAssistant activities={activities} username={user?.name} /></div>}
            {activeTab === 'roadmap' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px' }}>
                <div className="card-dark p-6"><DSARoadmap activities={activities} onAddActivity={addActivity} /></div>
                <div className="card-dark p-6" style={{ width: '280px' }}>
                  <h3 style={{ color: '#D4AF37', fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px' }}>Log Activity</h3>
                  <RoleBasedRoute allowedRoles={['admin', 'user']}><ActivityForm onAddActivity={addActivity} /></RoleBasedRoute>
                </div>
              </div>
            )}
            {activeTab === 'stats' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px' }}>
                <div className="card-dark p-6">
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#EAEAEA', marginBottom: '20px' }}>Detailed Statistics</h2>
                  <RoleBasedRoute allowedRoles={['admin', 'user']}><ProgressStats activities={activities} /></RoleBasedRoute>
                </div>
                <div className="card-dark p-6" style={{ width: '280px' }}>
                  <h3 style={{ color: '#D4AF37', fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px' }}>Log Activity</h3>
                  <RoleBasedRoute allowedRoles={['admin', 'user']}><ActivityForm onAddActivity={addActivity} /></RoleBasedRoute>
                </div>
              </div>
            )}
            {activeTab === 'badges' && <div className="animate-fadeIn"><BadgeSystem activities={activities} /></div>}
            {activeTab === 'resources' && <div className="animate-fadeIn"><SolutionResources /></div>}
            {activeTab === 'profile' && <div className="animate-fadeIn"><UserProfile activities={activities} /></div>}
            {activeTab === 'admin' && user?.role === 'admin' && <div className="card-dark p-6 animate-fadeIn"><AdminPanel /></div>}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

/* ── Overview Tab ──────────────────────────────────────────────── */
interface OverviewProps {
  activities: Activity[];
  quickStats: { totalActivities: number; problemsSolved: number; totalTime: number; topicsCovered: number; currentStreak: number };
  addActivity: (a: Omit<Activity, 'id' | 'date'>) => void;
  user: any;
}

const OverviewTab: React.FC<OverviewProps> = ({ activities, quickStats, addActivity, user }) => {
  const productivityScore = useMemo(() => {
    const total = activities.length;
    if (total === 0) return 0;
    const solveRate = activities.filter(a => a.problemSolved).length / total;
    const streakBonus = Math.min(quickStats.currentStreak, 14) / 14;
    const last7 = activities.filter(a => {
      const diff = (Date.now() - new Date(a.date).getTime()) / 86400000;
      return diff <= 7;
    }).length;
    return Math.min(100, Math.round(solveRate * 40 + streakBonus * 30 + Math.min(last7, 7) / 7 * 30));
  }, [activities, quickStats.currentStreak]);

  const circumference = 2 * Math.PI * 36;

  const statCards = [
    { label: 'Problems Solved', value: quickStats.problemsSolved, icon: '✓', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    { label: 'Day Streak', value: quickStats.currentStreak, icon: '◈', color: '#D4AF37', bg: 'rgba(212,175,55,0.08)' },
    { label: 'Hours Invested', value: `${quickStats.totalTime}h`, icon: '◷', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    { label: 'Topics Covered', value: quickStats.topicsCovered, icon: '◎', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fadeIn">
      {/* Welcome + score */}
      <div className="card-dark p-6" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(ellipse at right, rgba(212,175,55,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Welcome back</p>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EAEAEA', margin: 0, fontFamily: 'Poppins, Inter, sans-serif' }}>
              {user?.name?.split(' ')[0]}{' '}
              <span style={{ color: '#D4AF37' }}>👋</span>
            </h1>
            <p style={{ color: '#555', fontSize: '0.875rem', marginTop: '6px' }}>
              {quickStats.currentStreak > 0 ? `🔥 ${quickStats.currentStreak}-day streak — keep it going!` : 'Log a session today to start your streak.'}
            </p>
          </div>

          {/* Productivity score ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(212,175,55,0.1)" strokeWidth="6" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="url(#scoreGrad)" strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - productivityScore / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1.2s ease' }}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#D4AF37', lineHeight: 1 }}>{productivityScore}</span>
                <span style={{ fontSize: '0.55rem', color: '#555' }}>score</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#EAEAEA', marginBottom: '2px' }}>Productivity</div>
              <div style={{ fontSize: '0.7rem', color: productivityScore >= 70 ? '#22c55e' : productivityScore >= 40 ? '#D4AF37' : '#ef4444' }}>
                {productivityScore >= 70 ? 'Excellent' : productivityScore >= 40 ? 'Good' : 'Needs work'}
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EAEAEA' }}>{quickStats.totalActivities}</div>
                  <div style={{ fontSize: '0.6rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sessions</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(212,175,55,0.15)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#D4AF37' }}>{quickStats.problemsSolved}</div>
                  <div style={{ fontSize: '0.6rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Solved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ background: s.bg, borderColor: `${s.color}30` }}>
            <div style={{ fontSize: '1.2rem', color: s.color, marginBottom: '10px' }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#EAEAEA', marginBottom: '2px' }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily motivation */}
      <DailyMotivation />

      {/* Heatmap + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="card-dark p-5">
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Activity Heatmap</h3>
          <SimpleHeatmap activities={activities} />
        </div>
        <div className="card-dark p-5">
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Progress Stats</h3>
          <ProgressStats activities={activities} />
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card-dark p-5">
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#D4AF37', marginBottom: '14px' }}>Log Activity</h3>
          <RoleBasedRoute allowedRoles={user?.role === 'admin' ? ['admin'] : ['admin', 'user']}>
            <ActivityForm onAddActivity={addActivity} />
          </RoleBasedRoute>
        </div>
        <QuickAddProblem onAddActivity={addActivity} />
        <div className="card-dark p-5">
          <StreakTracker activities={activities} />
        </div>
      </div>
    </div>
  );
};

/* ── Root ──────────────────────────────────────────────────────── */
const App: React.FC = () => (
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </GoogleOAuthProvider>
);

export default App;
