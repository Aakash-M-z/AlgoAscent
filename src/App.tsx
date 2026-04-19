
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
import ToastProvider, { useToast } from './components/Toast';
import Onboarding, { shouldShowOnboarding } from './components/Onboarding';
import MobileNav from './components/MobileNav';
import { SkeletonStatRow, SkeletonCard, SkeletonChart, SkeletonTaskList } from './components/SkeletonLoader';

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
import AIAssistant from './components/AIAssistant';
import AIAnalysis from './components/AIAnalysis';
import RecommendationEngine from './components/RecommendationEngine';
import TaskManager from './components/TaskManager';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import IntroScreen from './components/IntroScreen';
import StatsCards from './components/StatsCards';
import AIInsightCard from './components/AIInsightCard';
import NextProblemCTA from './components/NextProblemCTA';
import CoreSubjects from './components/CoreSubjects';
import XPSystem from './components/XPSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

/* ── Demo activities shown to new users ───────────────────────── */
const DEMO_ACTIVITIES: Activity[] = (() => {
    const topics = ['Arrays', 'Trees', 'Graphs', 'Dynamic Programming', 'Linked Lists', 'Stacks', 'Binary Search'];
    const diffs: Activity['difficulty'][] = ['Easy', 'Medium', 'Hard'];
    const descs = ['Two Sum', 'Binary Tree Inorder', 'Number of Islands', 'Coin Change', 'Reverse Linked List', 'Valid Parentheses', 'Search in Rotated Array'];
    const out: Activity[] = [];
    for (let i = 59; i >= 0; i--) {
        if (Math.random() > 0.5) {
            const n = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < n; j++) {
                const ti = Math.floor(Math.random() * topics.length);
                out.push({
                    id: `demo-${i}-${j}`,
                    date: new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
                    category: topics[ti],
                    duration: 20 + Math.floor(Math.random() * 50),
                    description: descs[ti % descs.length],
                    value: Math.floor(Math.random() * 4) + 1,
                    difficulty: diffs[Math.floor(Math.random() * 3)],
                    problemSolved: Math.random() > 0.28,
                });
            }
        }
    }
    return out;
})();

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '⊞', section: 'main', path: '/dashboard' },
    { id: 'tasks', label: 'Tasks', icon: '✓', section: 'main', path: '/dashboard/tasks' },
    { id: 'analytics', label: 'Analytics', icon: '◐', section: 'main', path: '/dashboard/analytics' },
    { id: 'ai', label: 'AI Assistant', icon: '◈', section: 'main', path: '/dashboard/ai' },
    { id: 'roadmap', label: 'DSA Roadmap', icon: '◎', section: 'tools', path: '/dashboard/roadmap' },
    { id: 'subjects', label: 'Core Subjects', icon: '⬡', section: 'tools', path: '/dashboard/subjects' },
    { id: 'stats', label: 'Statistics', icon: '▦', section: 'tools', path: '/dashboard/statistics' },
    { id: 'badges', label: 'Badges', icon: '◆', section: 'tools', path: '/dashboard/badges' },
    { id: 'xp', label: 'XP & Levels', icon: '★', section: 'tools', path: '/dashboard/xp' },
    { id: 'resources', label: 'Resources', icon: '◇', section: 'tools', path: '/dashboard/resources' },
    { id: 'profile', label: 'Profile', icon: '◉', section: 'account', path: '/dashboard/profile' },
] as const;

type TabId = typeof NAV_ITEMS[number]['id'] | 'admin';

/* ── Sidebar ─────────────────────────────────────────────────── */
const Sidebar: React.FC<{
    tabs: { id: string; label: string; icon: string; section: string; path: string }[];
    collapsed: boolean;
    onToggle: () => void;
}> = ({ tabs, collapsed, onToggle }) => {
    const sections = [
        { key: 'main', label: 'Main' },
        { key: 'tools', label: 'Tools' },
        { key: 'account', label: 'Account' },
    ];
    return (
        <aside
            className="sidebar hidden md:flex flex-col"
            style={{
                width: collapsed ? '58px' : '212px',
                flexShrink: 0,
                transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
                height: '100%',
                alignSelf: 'stretch',
            }}
        >
            <div style={{ padding: '10px 8px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
                <button onClick={onToggle}
                    style={{
                        width: '26px', height: '26px', borderRadius: '7px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#444', cursor: 'pointer', fontSize: '0.65rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D4AF37'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#444'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                >{collapsed ? '▶' : '◀'}</button>
            </div>
            <nav style={{ flex: 1, padding: '0 6px', overflowY: 'auto', overflowX: 'hidden' }}>
                {sections.map(sec => {
                    const items = tabs.filter(t => t.section === sec.key);
                    if (!items.length) return null;
                    return (
                        <div key={sec.key} style={{ marginBottom: '2px' }}>
                            {!collapsed && (
                                <div className="section-label" style={{ padding: '12px 10px 5px' }}>
                                    {sec.label}
                                </div>
                            )}
                            {items.map(tab => (
                                <NavLink key={tab.id} to={tab.path} title={collapsed ? tab.label : undefined}
                                    className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                                    style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '9px 12px', marginBottom: '1px' }}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span style={{ fontSize: '0.9rem', flexShrink: 0, lineHeight: 1, opacity: isActive ? 1 : 0.7 }}>{tab.icon}</span>
                                            {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.84rem' }}>{tab.label}</span>}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                            {!collapsed && <div style={{ height: '1px', background: 'rgba(255,255,255,0.03)', margin: '8px 4px' }} />}
                        </div>
                    );
                })}
            </nav>
            {!collapsed && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(212,175,55,0.07)' }}>
                    <div className="section-label" style={{ color: 'rgba(212,175,55,0.25)' }}>Placement Prep v3</div>
                </div>
            )}
        </aside>
    );
};

/* ── Overview Tab ─────────────────────────────────────────────── */
const OverviewTab: React.FC<{
    activities: Activity[];
    loading: boolean;
    onAddActivity: (a: Activity) => Promise<boolean>;
    onDeleteActivity: (id: string) => void;
}> = ({ activities, loading, onAddActivity, onDeleteActivity }) => {
    const isNewUser = activities.length === 0;
    const displayActivities = isNewUser ? DEMO_ACTIVITIES : activities;

    // Today's progress
    const todayKey = new Date().toISOString().slice(0, 10);
    const todayActivities = displayActivities.filter(a => a.date.slice(0, 10) === todayKey);
    const todaySolved = todayActivities.filter(a => a.problemSolved).length;
    const todayMins = todayActivities.reduce((s, a) => s + a.duration, 0);

    // Weekly goal (target: 5 problems/week)
    const WEEKLY_GOAL = 5;
    const weekStart = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
    const weekSolved = displayActivities.filter(a => a.date.slice(0, 10) >= weekStart && a.problemSolved).length;
    const weekPct = Math.min(100, Math.round((weekSolved / WEEKLY_GOAL) * 100));

    // Avg per day (last 30 days)
    const last30 = displayActivities.filter(a => Date.now() - new Date(a.date).getTime() < 30 * 864e5);
    const activeDays30 = new Set(last30.map(a => a.date.slice(0, 10))).size;
    const avgPerDay = activeDays30 > 0 ? (last30.filter(a => a.problemSolved).length / 30).toFixed(1) : '0.0';

    // Streak reminder
    const hasActivityToday = activities.some(a => a.date.slice(0, 10) === todayKey);
    const yesterdayKey = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const hasYesterday = activities.some(a => a.date.slice(0, 10) === yesterdayKey);
    const streakAtRisk = !hasActivityToday && hasYesterday;

    return (
        <div className="section-gap">
            {/* Demo banner */}
            <AnimatePresence>
                {isNewUser && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.35 }}
                        style={{
                            padding: '12px 18px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))',
                            border: '1px solid rgba(212,175,55,0.22)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                        }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>✦</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#D4AF37' }}>Welcome — you're seeing demo data</div>
                            <div style={{ fontSize: '0.75rem', color: '#555', marginTop: '2px' }}>Log your first problem below to replace this with your real progress.</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* KPI cards */}
            {loading ? <SkeletonStatRow /> : <StatsCards activities={displayActivities} />}

            {/* AI Insight */}
            {!loading && <AIInsightCard activities={displayActivities} isDemo={isNewUser} />}

            {/* Next recommended problem CTA */}
            {!loading && <NextProblemCTA activities={displayActivities} />}

            {/* Daily motivation */}
            <DailyMotivation />

            {/* ── Heatmap 2-col grid ── */}
            {loading ? <SkeletonChart /> : (
                <div className="heatmap-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) 220px',
                    gap: '14px',
                    alignItems: 'start',
                }}>
                    {/* Left: Heatmap */}
                    <div className="card-dark" style={{ padding: '20px 24px' }}>
                        <div className="card-title" style={{ marginBottom: '16px' }}>Activity Heatmap</div>
                        <SimpleHeatmap activities={displayActivities} />
                    </div>

                    {/* Right: Streak + Today + Reminder */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <StreakTracker activities={displayActivities} />

                        {/* Today's Progress */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15, duration: 0.35 }}
                            className="card-dark"
                            style={{ padding: '16px', borderColor: todaySolved > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.9rem' }}>📅</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#555' }}>Solved</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: todaySolved > 0 ? '#22c55e' : '#333' }}>{isNewUser ? '—' : todaySolved}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#555' }}>Time</span>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: todayMins > 0 ? '#D4AF37' : '#333' }}>{isNewUser ? '—' : `${todayMins}m`}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#555' }}>Avg/day</span>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#D4AF37' }}>{isNewUser ? '—' : avgPerDay}</span>
                                </div>
                            </div>
                            {!isNewUser && todaySolved === 0 && (
                                <div style={{ marginTop: '10px', fontSize: '0.68rem', color: '#444', textAlign: 'center', padding: '6px', borderRadius: '7px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    Nothing logged yet today
                                </div>
                            )}
                        </motion.div>

                        {/* Weekly Goal */}
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22, duration: 0.35 }}
                            className="card-dark"
                            style={{ padding: '14px 16px', borderColor: weekPct >= 100 ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.85rem' }}>🎯</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weekly Goal</span>
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: weekPct >= 100 ? '#22c55e' : '#D4AF37' }}>
                                    {isNewUser ? '—' : `${weekSolved}/${WEEKLY_GOAL}`}
                                </span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: isNewUser ? '0%' : `${weekPct}%` }}
                                    transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                                    style={{
                                        height: '100%', borderRadius: '999px',
                                        background: weekPct >= 100
                                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                            : 'linear-gradient(90deg, #D4AF37, #B8960C)',
                                        boxShadow: weekPct >= 100 ? '0 0 8px rgba(34,197,94,0.4)' : '0 0 8px rgba(212,175,55,0.3)',
                                    }}
                                />
                            </div>
                            {!isNewUser && weekPct >= 100 && (
                                <div style={{ marginTop: '8px', fontSize: '0.68rem', color: '#22c55e', textAlign: 'center', fontWeight: 600 }}>
                                    ✓ Goal reached this week!
                                </div>
                            )}
                        </motion.div>

                        {/* Streak Reminder */}
                        <AnimatePresence>
                            {streakAtRisk && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        padding: '14px 16px', borderRadius: '14px',
                                        background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))',
                                        border: '1px solid rgba(245,158,11,0.3)',
                                        boxShadow: '0 0 20px rgba(245,158,11,0.08)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '1rem' }}>🔥</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>Streak at risk!</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#888', lineHeight: 1.5 }}>
                                        Solve 1 more problem today to keep your streak alive.
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Quick add problem */}
            <QuickAddProblem onAdd={onAddActivity} />

            {/* Recent activity */}
            {loading ? <SkeletonTaskList /> : (
                <div className="card-dark" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div className="card-title">Recent Activity</div>
                        {isNewUser && <span style={{ fontSize: '0.65rem', color: '#444', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.06)' }}>demo</span>}
                    </div>
                    {displayActivities.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ textAlign: 'center', padding: '40px 20px' }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.15 }}>◈</div>
                            <div style={{ color: '#555', fontSize: '0.875rem', marginBottom: '6px' }}>No sessions yet</div>
                            <div style={{ color: '#3a3a3a', fontSize: '0.78rem' }}>Use the problem selector above to log your first solve.</div>
                        </motion.div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {displayActivities.slice(0, 8).map((a, i) => (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        padding: '10px 14px', borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(212,175,55,0.04)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                                >
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.problemSolved ? '#22c55e' : '#D4AF37', flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.875rem', color: '#EAEAEA', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {a.description || a.category}
                                        </div>
                                        <div className="kpi-sub" style={{ marginTop: '2px' }}>
                                            {a.date.slice(0, 10)} · {a.duration}m · {a.category}
                                        </div>
                                    </div>
                                    {a.difficulty && (
                                        <span style={{
                                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 600,
                                            background: a.difficulty === 'Easy' ? 'rgba(34,197,94,0.1)' : a.difficulty === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: a.difficulty === 'Easy' ? '#22c55e' : a.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                                        }}>{a.difficulty}</span>
                                    )}
                                    {!isNewUser && (
                                        <button onClick={() => onDeleteActivity(a.id)}
                                            style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 6px', borderRadius: '4px', transition: 'color 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#333'}
                                        >✕</button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Activity form */}
            <ActivityForm onAddActivity={async (partial) => {
                const activity: Activity = {
                    ...partial,
                    id: Date.now().toString(),
                    date: new Date().toISOString().split('T')[0],
                };
                return onAddActivity(activity);
            }} />
            <DailyProblemNotification />
        </div>
    );
}

/* ── AI Tab (chat + analysis + recommendations sub-tabs) ─────── */
const AITab: React.FC<{ activities: Activity[] }> = ({ activities }) => {
    const [sub, setSub] = useState<'chat' | 'analysis' | 'recommendations'>('chat');
    return (
        <div className="section-gap">
            <div className="tab-nav" style={{ width: 'fit-content' }}>
                {([
                    ['chat', '◈ Chat'],
                    ['analysis', '◐ Analysis'],
                    ['recommendations', '◆ Recommendations'],
                ] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setSub(id)} className={`tab-item ${sub === id ? 'active' : ''}`}>
                        {label}
                    </button>
                ))}
            </div>
            {sub === 'chat' && <AIAssistant activities={activities} />}
            {sub === 'analysis' && <AIAnalysis activities={activities} />}
            {sub === 'recommendations' && <RecommendationEngine activities={activities} />}
        </div>
    );
};

/* ── AppContent ───────────────────────────────────────────────── */
const AppContent: React.FC = () => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { toast } = useToast();

    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showHomePage, setShowHomePage] = useState(false);
    // Only show intro if user is NOT already logged in (no stored session)
    // This prevents the intro from blocking route restoration on refresh
    const [showIntro, setShowIntro] = useState(() => !SessionManager.isSessionValid());
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Check onboarding on first auth
    useEffect(() => {
        if (isAuthenticated && shouldShowOnboarding()) {
            setShowOnboarding(true);
        }
    }, [isAuthenticated]);

    // Redirect standalone profile to dashboard/profile
    useEffect(() => {
        if (location.pathname === '/profile') {
            navigate('/dashboard/profile', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Fast transition from Landing Page
    useEffect(() => {
        if (location.state?.fromGetStarted) {
            setShowIntro(false);
            // Replace history to clear the flag
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Load activities when authenticated — dep on user.id only, not the whole object
    // Using user object as dep causes re-fetch on every render since AuthContext
    // creates a new object reference each time
    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;
        setDataLoading(true);
        databaseAPI.getUserActivities(user.id)
            .then(raw => setActivities(raw.map(dbToFrontendActivity)))
            .catch(() => toast('Failed to load activities', 'error'))
            .finally(() => setDataLoading(false));
    }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddActivity = useCallback(async (activity: Activity): Promise<boolean> => {
        try {
            const saved = await databaseAPI.createActivity(frontendToDbActivity(activity, user!.id));
            if (saved) {
                setActivities(prev => [dbToFrontendActivity(saved), ...prev]);
                return true;
            }
            toast('Failed to save activity', 'error');
            return false;
        } catch {
            toast('Failed to save activity', 'error');
            return false;
        }
    }, [toast, user]);

    const handleDeleteActivity = useCallback(async (id: string) => {
        const prev = activities.find(a => a.id === id);
        setActivities(a => a.filter(x => x.id !== id));
        try {
            await databaseAPI.deleteActivity(id);
            toast('Activity removed', 'info');
        } catch {
            if (prev) setActivities(a => [prev, ...a]);
            toast('Failed to delete activity', 'error');
        }
    }, [activities, toast]);

    const navItems = useMemo(() => {
        const items = [...NAV_ITEMS] as { id: string; label: string; icon: string; section: string; path: string }[];

        const interviewItem = user?.role === 'admin'
            ? { id: 'interview', label: 'Interview Analytics', icon: '📈', section: 'main', path: '/dashboard/interview' }
            : { id: 'interview', label: 'Mock Interview', icon: '🎤', section: 'main', path: '/dashboard/interview' };

        items.splice(4, 0, interviewItem);

        if (user?.role === 'admin') items.push({ id: 'admin', label: 'Admin', icon: '⚙', section: 'account', path: '/dashboard/admin' });
        return items;
    }, [user]);

    const isDashboardPath = location.pathname.startsWith('/dashboard');

    if (authLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>
                <div className="spinner-gold" />
            </div>
        );
    }

    if (!isAuthenticated && isDashboardPath) {
        // Only show login/intro if auth has fully loaded — prevents flash-redirect on refresh
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                {showIntro && (
                    <IntroScreen onDone={() => setShowIntro(false)} />
                )}
                <div style={{
                    opacity: showIntro ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                    pointerEvents: showIntro ? 'none' : 'all',
                }}>
                    <Login />
                </div>
            </motion.div>
        );
    }

    // Dashboard Layout
    if (isAuthenticated && isDashboardPath) {

        return (
            <div className="h-screen w-full flex flex-col bg-black overflow-hidden relative">
                {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

                {/* Header Container */}
                <div className="relative z-[150] bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center pr-4">
                    <button
                        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                        className="p-4 text-white/40 hover:text-gold transition-colors md:hidden"
                        aria-label="Toggle Menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <Header />
                    </div>
                </div>

                {/* Dashboard layout container */}
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Desktop Sidebar (Auto-hidden on mobile) */}
                    <Sidebar
                        tabs={navItems}
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(c => !c)}
                    />

                    {/* Mobile Sidebar Overlay */}
                    <AnimatePresence>
                        {mobileSidebarOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setMobileSidebarOpen(false)}
                                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] md:hidden"
                                />
                                <motion.div
                                    initial={{ x: -300 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -300 }}
                                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                    className="fixed top-0 bottom-0 left-0 w-72 bg-[#0c0c0c] z-[210] border-r border-white/10 md:hidden flex flex-col"
                                >
                                    <div className="p-6 flex items-center justify-between border-b border-white/5">
                                        <span className="text-xl font-black text-white uppercase tracking-tighter">
                                            PrepTrack <span className="text-gold">AI</span>
                                        </span>
                                        <button onClick={() => setMobileSidebarOpen(false)} className="text-white/20 p-2">✕</button>
                                    </div>
                                    <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                                        {navItems.map(item => (
                                            <NavLink
                                                key={item.id}
                                                to={item.path}
                                                onClick={() => setMobileSidebarOpen(false)}
                                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-gold/10 text-gold border border-gold/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                            >
                                                <span className="text-lg">{item.icon}</span>
                                                <span className="font-bold text-sm uppercase tracking-wide">{item.label}</span>
                                            </NavLink>
                                        ))}
                                    </nav>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Main content area */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative transition-all duration-300 bg-[#080808]">
                        <motion.main
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="max-w-[1200px] mx-auto p-4 md:p-8 pb-20 md:pb-8"
                        >
                            <ErrorBoundary>
                                <AppRoutes
                                    activities={activities}
                                    handleAddActivity={handleAddActivity}
                                    overviewTabNode={<OverviewTab activities={activities} loading={dataLoading} onAddActivity={handleAddActivity} onDeleteActivity={handleDeleteActivity} />}
                                    aiTabNode={<AITab activities={activities} />}
                                />
                            </ErrorBoundary>
                        </motion.main>
                    </div>

                    {/* Mobile Bottom Nav (Hidden on desktop) */}
                    <MobileNav items={navItems} />
                </div>
            </div>
        );
    }


    // Default to catching everything else (Landing Page or redirects)
    return (
        <ErrorBoundary>
            <AppRoutes
                activities={activities}
                handleAddActivity={handleAddActivity}
                overviewTabNode={<OverviewTab activities={activities} loading={dataLoading} onAddActivity={handleAddActivity} onDeleteActivity={handleDeleteActivity} />}
                aiTabNode={<AITab activities={activities} />}
            />
        </ErrorBoundary>
    );
};

/* ── Root App ─────────────────────────────────────────────────── */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const App: React.FC = () => (
    <ErrorBoundary>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <ToastProvider>
                    <AppContent />
                </ToastProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    </ErrorBoundary>
);

export default App;
