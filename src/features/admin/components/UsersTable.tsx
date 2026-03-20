import React, { useState, useEffect, useMemo } from 'react';
import { databaseAPI } from '../../../api/database';
import { adminApi } from '../../../api/adminApi';
import { useToast } from '../../../components/Toast';
import { User } from '../../../../shared/schema';
import { motion } from 'framer-motion';

const UsersTable = () => {
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    // Role + Plan Modal
    const [editUser, setEditUser] = useState<any>(null);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await databaseAPI.adminGetUsers();
            setUsers(data);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { loadUsers(); }, []);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) || 
                                u.email.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedUsers(new Set(filteredUsers.map(u => u.id || u._id)));
        else setSelectedUsers(new Set());
    };

    const handleSelectOne = (id: string) => {
        const next = new Set(selectedUsers);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedUsers(next);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedUsers.size} users?`)) return;
        try {
            await adminApi.deleteUsersBulk(Array.from(selectedUsers));
            toast('Users deleted successfully', 'success');
            setSelectedUsers(new Set());
            loadUsers();
        } catch {
            toast('Failed to delete some users', 'error');
        }
    };

    const changeRole = async (id: string, role: string) => {
        await databaseAPI.adminChangeRole(id, role as any);
        toast(`Changed role to ${role}`, 'success');
        setEditUser(null);
        loadUsers();
    };
    
    const changePlan = async (id: string, plan: string) => {
        await databaseAPI.adminChangePlan(id, plan as any);
        toast(`Changed plan to ${plan}`, 'success');
        setEditUser(null);
        loadUsers();
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Users...</div>;

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-dark p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="card-title text-xl">User Management</h3>
                    <div className="text-sm text-gray-500 mt-1">Manage global users, roles, and subscriptions.</div>
                </div>

                {selectedUsers.size > 0 && (
                    <motion.button 
                        initial={{scale: 0.9}} animate={{scale: 1}}
                        onClick={handleBulkDelete}
                        className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors"
                    >
                        Delete Selected ({selectedUsers.size})
                    </motion.button>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <input 
                    type="text" placeholder="Search name or email..." 
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
                <select 
                    value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    className="bg-[#111] border border-white/10 rounded-lg px-4 py-2 text-sm text-white"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="user">Users</option>
                </select>
                <button onClick={loadUsers} className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">↻</button>
            </div>

            <div className="overflow-x-auto w-full border border-white/5 rounded-xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#111]">
                        <tr className="border-b border-white/10 text-gray-400 font-semibold tracking-wide">
                            <th className="px-4 py-4 w-10">
                                <input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0} className="w-4 h-4 rounded border-white/20" />
                            </th>
                            <th className="px-4 py-4 uppercase text-xs">User</th>
                            <th className="px-4 py-4 uppercase text-xs">Role</th>
                            <th className="px-4 py-4 uppercase text-xs">Plan</th>
                            <th className="px-4 py-4 uppercase text-xs">Joined</th>
                            <th className="px-4 py-4 uppercase text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => {
                            const uId = u.id || u._id;
                            const isSelected = selectedUsers.has(uId);
                            
                            return (
                                <tr key={uId} className={`border-b border-white/[0.02] transition-colors ${isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                                    <td className="px-4 py-4">
                                        <input type="checkbox" checked={isSelected} onChange={() => handleSelectOne(uId)} className="w-4 h-4 rounded" />
                                    </td>
                                    <td className="px-4 py-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#818cf8] flex items-center justify-center text-black font-bold uppercase">
                                            {u.username.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{u.username}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider ${u.role === 'admin' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#818cf8]/10 text-[#818cf8]'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider ${u.plan === 'premium' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {u.plan}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-500 font-mono text-xs">
                                        {new Date(u.createdAt).toISOString().split('T')[0]}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button 
                                            onClick={() => setEditUser(u)}
                                            className="text-gray-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded border border-white/10 hover:border-white/20"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-8 text-gray-500">No users found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editUser && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-[#111] border border-[#D4AF37]/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-1">Edit User</h3>
                        <p className="text-sm text-gray-400 mb-6">{editUser.email}</p>
                        
                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Role</label>
                            <div className="flex gap-2">
                                <button onClick={() => changeRole(editUser.id || editUser._id, 'user')} className={`flex-1 py-2 rounded-lg border ${editUser.role === 'user' ? 'bg-[#818cf8]/20 border-[#818cf8]/50 text-[#818cf8]' : 'bg-transparent border-white/10 text-gray-400'}`}>User</button>
                                <button onClick={() => changeRole(editUser.id || editUser._id, 'admin')} className={`flex-1 py-2 rounded-lg border ${editUser.role === 'admin' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-transparent border-white/10 text-gray-400'}`}>Admin</button>
                            </div>
                        </div>

                        <div className="mb-8">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Plan</label>
                            <div className="flex gap-2">
                                <button onClick={() => changePlan(editUser.id || editUser._id, 'free')} className={`flex-1 py-2 rounded-lg border ${editUser.plan === 'free' ? 'bg-white/10 border-white/30 text-white' : 'bg-transparent border-white/10 text-gray-400'}`}>Free</button>
                                <button onClick={() => changePlan(editUser.id || editUser._id, 'premium')} className={`flex-1 py-2 rounded-lg border ${editUser.plan === 'premium' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-transparent border-white/10 text-gray-400'}`}>Premium</button>
                            </div>
                        </div>

                        <button onClick={() => setEditUser(null)} className="w-full py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium">Close</button>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default UsersTable;
