import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

// ── Reusable Chart Wrapper to prevent Recharts "width(-1)" errors ──────────
const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [shouldRender, setShouldRender] = useState(false);

    // Delay rendering slightly to allow parent layouts (flex/grid) and page transitions to stabilize
    useEffect(() => {
        const timer = setTimeout(() => setShouldRender(true), 150);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="card-dark p-6 flex flex-col min-h-[350px] w-full border border-white/5 overflow-hidden">
            <h3 className="card-title mb-6 flex items-center justify-between">
                <span>{title}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse" />
            </h3>
            <div className="flex-1 w-full h-[300px] min-h-[300px] relative">
                {shouldRender ? (
                    <ResponsiveContainer width="100%" height={300}>
                        {children as React.ReactElement}
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/5 text-xs uppercase tracking-widest animate-pulse">
                        Calibrating Canvas...
                    </div>
                )}
            </div>
        </div>
    );
};

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

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
        Processing Global Intelligence...
    </div>;
    
    if (error) return <div className="p-8 text-center text-red-400 bg-red-500/5 border border-red-500/10 rounded-2xl mx-4">
        Analytics Error: {error}
    </div>;

    if (!data || !data.kpis) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="flex flex-col gap-6"
        >
            {/* KPI Banner Mode (Offline Notification is handled in parent AdminPanel) */}
            
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Users', value: data.kpis.totalUsers, color: 'text-gold', icon: '👤' },
                    { label: 'Today (DAU)', value: data.kpis.dau, color: 'text-amber-400', icon: '⚡' },
                    { label: 'Growth (30d)', value: `+${data.kpis.newUsersLast30}`, color: 'text-emerald-400', icon: '📈' },
                    { label: 'Retention', value: `${data.kpis.retention}%`, color: 'text-indigo-400', icon: '💎' },
                ].map(k => (
                    <div key={k.label} className="card-dark p-6 group hover:translate-y-[-2px] transition-all duration-300">
                        <div className="flex items-start justify-between mb-3 text-lg opacity-40 group-hover:opacity-100 transition-opacity">
                            {k.icon}
                        </div>
                        <div className={`text-3xl font-black mb-1 tracking-tight ${k.color}`}>
                            {k.value}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-[0.1em] text-white/20 whitespace-nowrap">
                            {k.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Intelligence Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Growth Strategy Analysis */}
                <ChartWrapper title="User Acquisition Pipeline">
                    <AreaChart data={data.userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                            dataKey="month" 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <Tooltip 
                            contentStyle={{ background: '#080808', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }} 
                            itemStyle={{ color: '#D4AF37', fontWeight: 800 }}
                            labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '10px', fontWeight: 700 }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#D4AF37" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ChartWrapper>

                {/* Difficulty Segment Analysis */}
                <ChartWrapper title="Competency Distribution">
                    <BarChart data={data.diffStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis 
                            dataKey="difficulty" 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10}
                        />
                        <YAxis 
                            stroke="rgba(255,255,255,0.2)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }} 
                            contentStyle={{ background: '#080808', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }} 
                            itemStyle={{ color: '#D4AF37', fontWeight: 800 }}
                            labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontSize: '10px', fontWeight: 700 }}
                        />
                        <Bar 
                            dataKey="count" 
                            fill="#D4AF37" 
                            radius={[6, 6, 0, 0]} 
                            barSize={32} 
                            animationDuration={1500}
                        />
                    </BarChart>
                </ChartWrapper>

            </div>
        </motion.div>
    );
};

export default AdvancedAnalytics;
