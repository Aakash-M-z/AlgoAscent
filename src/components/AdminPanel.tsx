import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../api/adminApi';

// Import Admin Sub-Components
// ... (omitted same imports)
import UsersTable from '../features/admin/components/UsersTable';
import AdvancedAnalytics from '../features/admin/components/AdvancedAnalytics';
import AIUsageMonitoring from '../features/admin/components/AIUsageMonitoring';
import SystemHealth from '../features/admin/components/SystemHealth';
import FeatureToggles from '../features/admin/components/FeatureToggles';
import AuditLogTimeline from '../features/admin/components/AuditLogTimeline';
import NotificationsSender from '../features/admin/components/NotificationsSender';

type AdminTab = 'users' | 'analytics' | 'ai' | 'security' | 'system';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        adminApi.getHealthDetails().then((data: any) => {
            if (data.isFallback || data.dbStatus.includes('Disconnected') || data.dbStatus.includes('Fallback')) {
                setIsOffline(true);
            }
        }).catch(() => setIsOffline(true));
    }, []);

    const tabs: {id: AdminTab, label: string, icon: string}[] = [
        { id: 'analytics', label: 'Analytics', icon: '📈' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'ai', label: 'AI Console', icon: '🤖' },
        { id: 'security', label: 'Security & Logs', icon: '🛡️' },
        { id: 'system', label: 'System Control', icon: '⚙️' },
    ];

    if (!user || user.role !== 'admin') {
        return <div className="p-8 text-center text-red-500 card-dark">Unauthorized. Admin access required.</div>;
    }

    return (
        <div className="section-gap animate-fadeIn min-h-[80vh]">
            <AnimatePresence>
                {isOffline && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gold/10 border border-gold/20 rounded-2xl p-4 mb-8 flex items-center gap-4 overflow-hidden"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">⚠️</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-gold font-bold text-sm uppercase tracking-wider">Database Offline Mode</h4>
                            <p className="text-white/40 text-xs mt-1">MongoDB is currently unavailable. Using localized fallback data for analytics and logs. Real-time edits may be restricted.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-end border-b border-white/[0.08] pb-6 mb-8">
                <div>
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#FFF8DC] tracking-tight">Enterprise Control Panel</h2>
                    <p className="text-gray-400 mt-2 text-sm">Welcome back, <span className="font-bold text-white">{user.username}</span>. {isOffline ? 'System running in fallback mode.' : 'System is operating normally.'}</p>
                </div>
                <div className="hidden md:flex gap-3">
                    <span className={`${isOffline ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'} border px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2`}>
                        <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span> {isOffline ? 'PARTIAL SERVICES ACTIVE' : 'ALL SYSTEMS OPERATIONAL'}
                    </span>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(t => (
                    <button 
                        key={t.id} 
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                            activeTab === t.id 
                                ? 'bg-gradient-to-br from-[#D4AF37] to-[#AA8A2A] text-black shadow-lg shadow-[#D4AF37]/20 transform -translate-y-0.5' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                        }`}
                    >
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            {/* Content Area with Animation */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                    {activeTab === 'analytics' && <AdvancedAnalytics />}
                    
                    {activeTab === 'users' && <UsersTable />}
                    
                    {activeTab === 'ai' && <AIUsageMonitoring />}
                    
                    {activeTab === 'security' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AuditLogTimeline />
                            <div className="hidden lg:block">
                                {/* Visual placeholder for security radar or maps later */}
                                <div className="card-dark p-6 h-full flex flex-col items-center justify-center opacity-50 border-dashed border-white/20">
                                    <div className="text-4xl mb-4">🛡️</div>
                                    <h4 className="font-bold text-gray-400 mb-2">Security Radar</h4>
                                    <p className="text-sm text-gray-600 text-center max-w-xs">Monitoring all JWT authentications and failed attempts. No anomalies detected.</p>
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
