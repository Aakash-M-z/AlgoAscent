import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi';
import { motion } from 'framer-motion';

const AuditLogTimeline = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadLogs();
    }, [filter]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await adminApi.getLogsFiltered(filter || undefined);
            setLogs(data);
        } catch { }
        setLoading(false);
    };

    const actionColors: Record<string, string> = {
        'DELETE_USER': '#ef4444',
        'CHANGE_ROLE': '#D4AF37',
        'CHANGE_PLAN': '#22c55e',
    };

    return (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="card-dark p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="card-title">Audit Log Timeline</h3>
                <select 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                >
                    <option value="">All Actions</option>
                    <option value="DELETE_USER">Deletions</option>
                    <option value="CHANGE_ROLE">Role Changes</option>
                    <option value="CHANGE_PLAN">Plan Changes</option>
                </select>
            </div>

            {loading ? <div className="text-gray-500">Loading Logs...</div> : (
                <div className="flex flex-col gap-4 relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
                    
                    {logs.map(log => (
                        <div key={log._id || log.id} className="relative pl-8 pb-4">
                            <div 
                                className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#1A1A1A]"
                                style={{ backgroundColor: actionColors[log.action] || '#818cf8' }}
                            />
                            <div className="bg-white/[0.02] border border-white/[0.05] p-3 rounded-xl flex flex-col gap-1">
                                <div className="text-sm font-medium text-[#EAEAEA]">{log.detail}</div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">Admin: {log.adminEmail}</span>
                                    <span className="text-xs text-gray-600 font-mono">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-gray-500 pl-8">No matching records found.</div>}
                </div>
            )}
        </motion.div>
    );
};

export default AuditLogTimeline;
