import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    AreaChart, Area, CartesianGrid, LineChart, Line, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShouldRender(true), 150);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="card-dark p-6 flex flex-col min-h-[350px] w-full border border-white/5 overflow-hidden">
            <h3 className="card-title mb-6 flex items-center justify-between text-sm uppercase tracking-widest text-white/40">
                <span>{title}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-pulse" />
            </h3>
            <div className="flex-1 w-full h-[300px] min-h-[300px] relative">
                {shouldRender ? (
                    <ResponsiveContainer width="100%" height={300}>
                        {children as React.ReactElement}
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/5 text-[10px] uppercase tracking-[0.2em] animate-pulse">
                        Analyzing Patterns...
                    </div>
                )}
            </div>
        </div>
    );
};

const InterviewAnalyticsDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await adminApi.getInterviewAnalytics();
            setData(res);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="p-12 text-center flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-t-2 border-gold animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold/50">AI</div>
                </div>
                <div className="space-y-1">
                    <p className="text-white/80 font-bold uppercase tracking-widest text-sm">Synthesizing Global Performance</p>
                    <p className="text-white/20 text-xs">Aggregating real-time interview telemetry...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-500/5 border border-red-500/20 rounded-2xl">
                <div className="text-3xl mb-4">⚠️</div>
                <h3 className="text-red-400 font-bold mb-2">Telemetry Acquisition Failure</h3>
                <p className="text-red-400/60 text-sm mb-6">{error}</p>
                <button 
                    onClick={fetchData}
                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!data) return null;

    const COLORS = ['#D4AF37', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="flex flex-col gap-8 pb-12"
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Interviewees', value: data.kpis.totalUsers, color: 'text-gold', icon: '👥' },
                    { label: 'Average Platform Score', value: `${data.kpis.averageScore}%`, color: 'text-emerald-400', icon: '🎯' },
                    { label: 'Overall Pass Rate', value: `${data.kpis.passRate}%`, color: 'text-blue-400', icon: '✅' },
                    { label: 'Top Struggle Point', value: data.kpis.mostFailedTopics, color: 'text-red-400', icon: '🔥', small: true },
                ].map((k, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={k.label} 
                        className="card-dark p-6 group relative overflow-hidden active:scale-95 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-2xl">{k.icon}</div>
                        <div className="relative z-10 transition-transform group-hover:translate-x-1">
                            <div className={`text-3xl font-black mb-1 tracking-tighter ${k.color} ${k.small ? 'truncate text-xl h-[36px] flex items-center' : ''}`}>
                                {k.value}
                            </div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-white/20">
                                {k.label}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ChartWrapper title="Score Distribution Architecture">
                    <BarChart data={data.scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="range" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ background: '#080808', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '12px' }}
                            itemStyle={{ color: '#D4AF37', fontWeight: 800 }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                            {data.scoreDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.count > 30 ? '#D4AF37' : 'rgba(212,175,55,0.4)'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartWrapper>

                <ChartWrapper title="Interviews Engagement (Weekly)">
                    <AreaChart data={data.weeklyTrends}>
                        <defs>
                            <linearGradient id="colorTrends" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ background: '#080808', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px' }}
                            itemStyle={{ color: '#3B82F6', fontWeight: 800 }}
                        />
                        <Area type="monotone" dataKey="interviews" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrends)" />
                    </AreaChart>
                </ChartWrapper>
            </div>

            {/* Secondary Row: Topic Performance & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Topic Performance List */}
                <div className="lg:col-span-3 card-dark p-8 border border-white/5">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-8 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-white/10" /> Topic Proficiency Matrix
                    </h3>
                    <div className="space-y-6">
                        {data.topicPerformance.map((tp: any, index: number) => (
                            <div key={tp.topic} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-mono text-white/20">0{index + 1}</span>
                                        <span className="text-sm font-bold text-white/80">{tp.topic}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-gold tracking-widest px-2 py-0.5 rounded bg-gold/10">
                                        AVG {tp.avgScore}%
                                    </div>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${tp.passRate}%` }}
                                        transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                                        className={`h-full rounded-full ${tp.passRate > 60 ? 'bg-emerald-500/50' : 'bg-red-500/50'}`} 
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] uppercase font-bold text-white/20 tracking-wider">
                                    <span>Pass Rate: {tp.passRate}%</span>
                                    <span>Reliability: {tp.passRate > 50 ? 'Stable' : 'Volatile'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Leaderboard - Top Users */}
                <div className="lg:col-span-2 card-dark p-8 group border border-gold/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gold/40 mb-8 flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-gold/20" /> Performance Elite
                    </h3>
                    <div className="space-y-4">
                        {data.topUsers.map((user: any, index: number) => (
                            <div key={user.username} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5 group/row">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                    index === 0 ? 'bg-gold text-black' : 
                                    index === 1 ? 'bg-slate-300 text-black' : 
                                    index === 2 ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/40'
                                }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white group-hover/row:text-gold transition-colors">{user.username}</div>
                                    <div className="text-[10px] text-white/30 uppercase font-medium">{user.totalInterviews} Interviews</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-white">{user.avgScore}%</div>
                                    <div className="text-[9px] text-emerald-400 font-bold uppercase tracking-tighter">Verified</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Recent Activity & AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 card-dark p-8 border border-white/5">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-6 font-mono tracking-tighter">
                        Live Stream Telemetry
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest text-white/20 border-b border-white/5">
                                    <th className="text-left pb-4 font-black">User</th>
                                    <th className="text-left pb-4 font-black">Subject</th>
                                    <th className="text-right pb-4 font-black">Score</th>
                                    <th className="text-right pb-4 font-black">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {data.recentActivity.map((act: any, i: number) => (
                                    <tr key={i} className="group/tr border-b border-white/[0.02] last:border-0">
                                        <td className="py-4 font-bold text-white/80 group-hover/tr:text-white transition-colors">
                                            {act.username}
                                        </td>
                                        <td className="py-4">
                                            <span className="px-2 py-1 rounded bg-white/5 text-white/40 font-medium">
                                                {act.topic}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right font-mono font-black">
                                            <span className={act.status === 'Pass' ? 'text-emerald-400' : 'text-red-400'}>
                                                {act.score}%
                                            </span>
                                        </td>
                                        <td className="py-4 text-right text-white/20 font-medium">
                                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Insights Panel */}
                <div className="card-dark p-8 border border-blue-500/10 bg-blue-500/[0.01] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400/60 mb-8 flex items-center gap-2">
                        <span className="text-lg">✦</span> Neural Insights
                    </h3>
                    <div className="space-y-4">
                        {data.insights.map((insight: string, i: number) => (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + i * 0.2 }}
                                key={i} 
                                className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-white/60 leading-relaxed group hover:border-blue-500/20 transition-all"
                            >
                                <div className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.5)] flex-shrink-0" />
                                    {insight}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-white/20">
                            <span>Strategy Engine</span>
                            <span className="text-blue-400/40">v4.2.0-Alpha</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default InterviewAnalyticsDashboard;
