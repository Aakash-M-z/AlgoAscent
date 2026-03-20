import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { motion } from 'framer-motion';

const AIUsageMonitoring = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getAiMonitoring().then((res: any) => {
            setData(res);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 text-gray-500">Loading AI Usage...</div>;
    if (!data) return <div className="p-4 text-red-500">Failed to load AI usage stats.</div>;

    const totalUsage = data.usageByPlan.reduce((acc: number, curr: any) => acc + curr.total, 0);

    return (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="flex flex-col gap-6">
            <div className="card-dark p-6 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="card-title text-xl">Global AI API Usage</h3>
                    <span className="text-xl text-[#D4AF37] font-bold">{totalUsage} <span className="text-sm text-gray-400 font-normal">total requests today</span></span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    {data.usageByPlan.map((plan: any) => (
                        <div key={plan.plan} className="p-4 border border-white/5 rounded-xl bg-white/[0.02]">
                            <div className="text-sm font-semibold capitalize text-gray-400 mb-1">{plan.plan} Plan</div>
                            <div className="text-2xl font-bold text-white mb-2">{plan.total} <span className="text-xs text-gray-500">requests</span></div>
                            <div className="text-xs text-gray-400">Avg {plan.avg}/user</div>
                            {plan.plan === 'free' && (
                                <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (plan.avg / 2) * 100)}%` }}></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="card-dark p-6">
                <h3 className="card-title mb-4">Top AI Consumers (Potential Abuse Risk)</h3>
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/5 text-gray-500">
                            <th className="pb-3 font-semibold">User</th>
                            <th className="pb-3 font-semibold">Plan</th>
                            <th className="pb-3 font-semibold text-right">Usage</th>
                            <th className="pb-3 font-semibold text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.topUsers.map((u: any, i: number) => {
                            const overLimit = u.plan === 'free' && u.aiUsageCount > 2;
                            return (
                                <tr key={u._id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 text-white">
                                        <div className="font-semibold">{u.username}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                    </td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider ${u.plan === 'premium' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {u.plan}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right text-white font-mono">{u.aiUsageCount}</td>
                                    <td className="py-3 text-right">
                                        {overLimit ? (
                                            <span className="text-red-500 text-xs font-bold px-2 py-1 bg-red-500/10 rounded-full">Abuse Detected</span>
                                        ) : (
                                            <span className="text-green-500 text-xs font-bold px-2 py-1 bg-green-500/10 rounded-full">Normal</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default AIUsageMonitoring;
