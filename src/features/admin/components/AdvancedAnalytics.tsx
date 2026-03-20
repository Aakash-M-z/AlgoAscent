import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const AdvancedAnalytics = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        adminApi.getAnalytics()
            .then((res: any) => {
                setData(res);
                setLoading(false);
            })
            .catch((err: any) => {
                setError(err.response?.data?.error || err.message);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Enterprise Analytics...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Analytics Error: {error}</div>;

    return (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="flex flex-col gap-6">
            
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: data.kpis.totalUsers, color: '#D4AF37' },
                    { label: 'DAU (Today)', value: data.kpis.dau, color: '#f59e0b' },
                    { label: 'New (30d)', value: data.kpis.newUsersLast30, color: '#22c55e' },
                    { label: 'Retention Rate', value: `${data.kpis.retention}%`, color: '#818cf8' },
                ].map(k => (
                    <div key={k.label} className="card-dark p-5" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
                        <div className="kpi-label">{k.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* User Growth Area Chart */}
                <div className="card-dark p-6">
                    <h3 className="card-title mb-4">User Growth</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.userGrowth}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px' }} />
                                <Area type="monotone" dataKey="count" stroke="#D4AF37" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Difficulty Distribution Bar Chart */}
                <div className="card-dark p-6">
                    <h3 className="card-title mb-4">Activity Distribution (Difficulty)</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.diffStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="difficulty" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: '#111', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px' }} />
                                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};

export default AdvancedAnalytics;
