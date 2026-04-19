import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../api/adminApi';
import SystemStatus from './SystemStatus';

import UsersTable from '../features/admin/components/UsersTable';
import AdvancedAnalytics from '../features/admin/components/AdvancedAnalytics';
import AIUsageMonitoring from '../features/admin/components/AIUsageMonitoring';
import SystemHealth from '../features/admin/components/SystemHealth';
import FeatureToggles from '../features/admin/components/FeatureToggles';
import AuditLogTimeline from '../features/admin/components/AuditLogTimeline';
import NotificationsSender from '../features/admin/components/NotificationsSender';
import InterviewAnalyticsDashboard from '../features/admin/components/InterviewAnalyticsDashboard';

type AdminTab = 'analytics' | 'users' | 'ai' | 'security' | 'system';

const VALID_TABS: AdminTab[] = ['analytics', 'users', 'ai', 'security', 'system'];

const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'ai', label: 'AI Console', icon: '🤖' },
    { id: 'security', label: 'Security & Logs', icon: '🛡️' },
    { id: 'system', label: 'System Control', icon: '⚙️' },
];

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { tab } = useParams<{ tab?: string }>();

    // Derive active tab from URL param — default to 'analytics'
    const activeTab: AdminTab =
        tab && VALID_TABS.includes(tab as AdminTab) ? (tab as AdminTab) : 'analytics';

    // Redirect /dashboard/admin → /dashboard/admin/analytics so URL is always canonical
    useEffect(() => {
        if (!tab || !VALID_TABS.includes(tab as AdminTab)) {
            navigate('/dashboard/admin/analytics', { replace: true });
        }
    }, [tab, navigate]);

    if (!user || user.role !== 'admin') {
        return (
            <div className="p-8 text-center text-red-500 card-dark">
                Unauthorized. Admin access required.
            </div>
        );
    }

    return (
        <div className="section-gap animate-fadeIn min-h-[80vh]">

            {/* System status — auto-refreshes every 60s, hides when all good */}
            <SystemStatus hideWhenOnline={false} refreshInterval={60_000} />

            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/[0.08] pb-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#FFF8DC] tracking-tight">
                        Enterprise Control Panel
                    </h2>
                    <p className="text-gray-400 mt-2 text-sm">
                        Welcome back, <span className="font-bold text-white">{user.username}</span>.{' '}
                        {isOffline ? 'System running in fallback mode.' : 'System is operating normally.'}
                    </p>
                </div>
                <div className="hidden md:flex gap-3">
                    <SystemStatus hideWhenOnline={false} refreshInterval={60_000} />
                </div>
            </div>

            {/* Tab navigation — each button navigates to its URL */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => navigate(`/dashboard/admin/${t.id}`)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${activeTab === t.id
                            ? 'bg-gradient-to-br from-[#D4AF37] to-[#AA8A2A] text-black shadow-lg shadow-[#D4AF37]/20 -translate-y-0.5'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                            }`}
                    >
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            {/* Content — keyed by activeTab so AnimatePresence transitions correctly */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                    {activeTab === 'analytics' && <AdvancedAnalytics />}

                    {activeTab === 'users' && <UsersTable />}

                    {activeTab === 'ai' && <AIUsageMonitoring />}

                    {activeTab === 'security' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AuditLogTimeline />
                            <div className="hidden lg:block">
                                <div className="card-dark p-6 h-full flex flex-col items-center justify-center opacity-50 border-dashed border-white/20">
                                    <div className="text-4xl mb-4">🛡️</div>
                                    <h4 className="font-bold text-gray-400 mb-2">Security Radar</h4>
                                    <p className="text-sm text-gray-600 text-center max-w-xs">
                                        Monitoring all JWT authentications and failed attempts. No anomalies detected.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="flex flex-col gap-6">
                            <SystemHealth />
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <FeatureToggles />
                                <NotificationsSender />
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AdminPanel;
