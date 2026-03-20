import React, { useState } from 'react';
import { adminApi } from '../../../api/adminApi';
import { motion } from 'framer-motion';

const NotificationsSender = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('all');
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await adminApi.createNotification({ title, message, targetAudience });
            setSuccess(true);
            setTitle(''); setMessage('');
            setTimeout(() => setSuccess(false), 3000);
        } catch {
            alert('Failed to send notification');
        }
        setSending(false);
    };

    return (
        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="card-dark p-6">
            <h3 className="card-title mb-4">Send Broadcast Notification</h3>
            <form onSubmit={handleSend} className="flex flex-col gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Target Audience</label>
                    <select 
                        value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                        <option value="all">All Users</option>
                        <option value="premium">Premium Users Only</option>
                        <option value="free">Free Users Only</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Title</label>
                    <input 
                        required value={title} onChange={e => setTitle(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                        placeholder="e.g. New Feature Release!"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Message</label>
                    <textarea 
                        required value={message} onChange={e => setMessage(e.target.value)} rows={3}
                        className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                        placeholder="Enter announcement details..." // 
                    />
                </div>

                <div className="flex justify-end items-center gap-4 mt-2">
                    {success && <span className="text-green-500 text-sm">✓ Sent successfully</span>}
                    <button 
                        type="submit" disabled={sending}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black font-bold py-2 px-6 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default NotificationsSender;
