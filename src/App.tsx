
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
] as const;

type TabId = typeof NAV_ITEMS[number]['id'] | 'admin';

/* ── Sidebar ─────────────────────────────────────────────────── */
const Sidebar: React.FC<{
    tabs: { id: string; label: string; icon: string; section: string }[];
    activeTab: string;
    onTabChange: (id: string) => void;
    collapsed: boolean;
    onToggle: () => void;
}> = ({ tabs, activeTab, onTabChange, collapsed, onToggle }) => {
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
                                <button key={tab.id} onClick={() => onTabChange(tab.id)} title={collapsed ? tab.label : undefined}
                                    className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                                    style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '10px' : '9px 12px', marginBottom: '1px' }}
                                >
                                    <span style={{ fontSize: '0.9rem', flexShrink: 0, lineHeight: 1, opacity: activeTab === tab.id ? 1 : 0.7 }}>{tab.icon}</span>
                                    {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.84rem' }}>{tab.label}</span>}
                                </button>
                            ))}
                            {!collapsed && <div style={{ height: '1px', background: 'rgba(255,255,255,0.03)', margin: '8px 4px' }} />}
                        </div>
                    );
                })}
            </nav>
            {!collapsed && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(212,175,55,0.07)' }}>
                    <div className="section-label" style={{ color: 'rgba(212,175,55,0.25)' }}>Progress Tracker v2</div>
                </div>
            )}
        </aside>
    );
};

/* ── Overview Tab ─────────────────────────────────────────────── */
const OverviewTab: React.FC<{
    activities: Activity[];
    loading: boolean;
    onAddActivity: (a: Activity) => void;
    onDeleteActivity: (id: string) => void;
}> = ({ activities, loading, onAddActivity, onDeleteActivity }) => {

    return (
        <div className="section-gap">
            {/* KPI cards */}
            {loading ? <SkeletonStatRow /> : <StatsCards activities={activities} />}

            {/* Daily motivation + streak */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'start' }}>
                <DailyMotivation />
                <StreakTracker activities={activities} />
            </div>

            {/* Heatmap */}
            {loading ? <SkeletonChart /> : (
                <div className="card-dark" style={{ padding: '20px 24px' }}>
                    <div className="card-title" style={{ marginBottom: '16px' }}>Activity Heatmap</div>
                    <SimpleHeatmap activities={activities} />
                </div>
            )}

            {/* Quick add problem */}
            <QuickAddProblem onAdd={onAddActivity} />

            {/* Recent activity */}
            {loading ? <SkeletonTaskList /> : (
                <div className="card-dark" style={{ padding: '20px 24px' }}>
                    <div className="card-title" style={{ marginBottom: '16px' }}>Recent Activity</div>
                    {activities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.2 }}>◈</div>
                            <div style={{ color: '#555', fontSize: '0.9rem' }}>No sessions yet. Add your first activity above.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activities.slice(0, 8).map(a => (
                                <div key={a.id} style={{
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
                                    <button onClick={() => onDeleteActivity(a.id)}
                                        style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 6px', borderRadius: '4px', transition: 'color 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#333'}
                                    >✕</button>
                                </div>
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

            {/* Notifications */}
            <DailyProblemNotification />
        </div>
    );
};

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

    const [activeTab, setActiveTab] = useState<string>('overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showHomePage, setShowHomePage] = useState(false);
    const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('intro_seen'));

    // Check onboarding on first auth
    useEffect(() => {
        if (isAuthenticated && shouldShowOnboarding()) {
            setShowOnboarding(true);
        }
    }, [isAuthenticated]);

    // Load activities when authenticated
    useEffect(() => {
        if (!isAuthenticated || !user) return;
        setDataLoading(true);
        databaseAPI.getUserActivities(user.id)
            .then(raw => setActivities(raw.map(dbToFrontendActivity)))
            .catch(() => toast('Failed to load activities', 'error'))
            .finally(() => setDataLoading(false));
    }, [isAuthenticated, user]);

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
        const items = [...NAV_ITEMS] as { id: string; label: string; icon: string; section: string }[];
        if (user?.role === 'admin') items.push({ id: 'admin', label: 'Admin', icon: '⚙', section: 'account' });
        return items;
    }, [user]);

    if (authLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0B0B' }}>
                <div className="spinner-gold" />
            </div>
        );
    }

    if (!isAuthenticated) {
        if (showHomePage) return <HomePage onGetStarted={() => setShowHomePage(false)} />;
        return (
            <>
                {showIntro && (
                    <IntroScreen onDone={() => {
                        localStorage.setItem('intro_seen', '1');
                        setShowIntro(false);
                    }} />
                )}
                {/* Login fades in underneath as intro fades out */}
                <div style={{
                    opacity: showIntro ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                    pointerEvents: showIntro ? 'none' : 'all',
                }}>
                    <Login />
                </div>
            </>
        );
    }

    const renderTab = () => {
        const content = (() => {
            switch (activeTab) {
                case 'overview':
                    return <OverviewTab activities={activities} loading={dataLoading} onAddActivity={handleAddActivity} onDeleteActivity={handleDeleteActivity} />;
                case 'tasks':
                    return <TaskManager />;
                case 'analytics':
                    return <AnalyticsDashboard activities={activities} />;
                case 'ai':
                    return <AITab activities={activities} />;
                case 'roadmap':
                    return <DSARoadmap activities={activities} onAddActivity={handleAddActivity} />;
                case 'stats':
                    return <ProgressStats activities={activities} />;
                case 'badges':
                    return <BadgeSystem activities={activities} />;
                case 'resources':
                    return <SolutionResources />;
                case 'profile':
                    return <UserProfile activities={activities} />;
                case 'admin':
                    return <RoleBasedRoute requiredRole="admin"><AdminPanel /></RoleBasedRoute>;
                default:
                    return null;
            }
        })();
        return <div key={activeTab} className="page-enter">{content}</div>;
    };

    return (
        <>
            {/* ── Desktop layout: locked to 100vh, only content column scrolls ── */}
            <div className="hidden md:flex" style={{ height: '100vh', background: '#080808', flexDirection: 'column', overflow: 'hidden' }}>
                {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
                <Header onNavigate={setActiveTab} />
                <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Sidebar
                        tabs={navItems}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(c => !c)}
                    />
                    <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.04) 0%, transparent 70%)' }}>
                        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px 56px', width: '100%', boxSizing: 'border-box' }}>
                            <ErrorBoundary>{renderTab()}</ErrorBoundary>
                        </main>
                    </div>
                </div>
            </div>

            {/* ── Mobile layout: normal page scroll, bottom nav fixed ── */}
            <div className="flex flex-col md:hidden" style={{ minHeight: '100vh', background: '#080808' }}>
                {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
                <Header onNavigate={setActiveTab} />
                <main style={{ flex: 1, padding: '20px 16px 80px', boxSizing: 'border-box' }}>
                    <ErrorBoundary>{renderTab()}</ErrorBoundary>
                </main>
                <MobileNav items={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <div style={{ display: 'none' }}><NotificationSettings /></div>
        </>
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
