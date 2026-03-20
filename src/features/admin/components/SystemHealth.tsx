import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { motion } from 'framer-motion';

const SystemHealth = () => {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getHealthDetails().then((data: any) => {
            setHealth(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-4 text-gray-500">Loading System Health...</div>;
    if (!health) return <div className="p-4 text-red-500">Failed to load system health.</div>;

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        return `${d}d ${h}h ${m}m`;
    };

    const isDbConnected = health.dbStatus === 'Connected';

    return (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-dark p-5">
                <div className="text-gray-400 text-sm mb-2">Uptime</div>
                <div className="text-[#D4AF37] text-xl font-bold font-mono">{formatUptime(health.uptime)}</div>
            </div>
            
            <div className="card-dark p-5">
                <div className="text-gray-400 text-sm mb-2">DB Status</div>
                <div className={`text-xl font-bold flex items-center gap-2 ${isDbConnected ? 'text-green-500' : 'text-red-500'}`}>
                    <span className="relative flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDbConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${isDbConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    {health.dbStatus}
                </div>
            </div>

            <div className="card-dark p-5">
                <div className="text-gray-400 text-sm mb-2">DB Latency</div>
                <div className={`text-xl font-bold font-mono ${health.dbLatencyMs < 100 ? 'text-green-500' : 'text-yellow-500'}`}>
                    {health.dbLatencyMs} ms
                </div>
            </div>

            <div className="card-dark p-5">
                <div className="text-gray-400 text-sm mb-2">Environment</div>
                <div className="text-white text-xl font-bold capitalize">{health.env}</div>
            </div>
        </motion.div>
    );
};

export default SystemHealth;
