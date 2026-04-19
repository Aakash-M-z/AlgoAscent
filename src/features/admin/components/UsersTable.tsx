import React, { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../../api/adminApi';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminUser {
    _id: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    plan: 'free' | 'premium';
    createdAt: string;
    aiUsageCount?: number;
}

interface CreateForm {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    plan: 'free' | 'premium';
    sendWelcome: boolean;
}

const EMPTY_FORM: CreateForm = {
    username: '', email: '', password: '',
    role: 'user', plan: 'free', sendWelcome: false,
};

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = 'w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-600';
const labelCls = 'block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5';

// ── Component ─────────────────────────────────────────────────────────────────
const UsersTable: React.FC = () => {
    const { toast } = useToast();
    const { user: currentUser } = useAuth();
    const isAdmin = currentUser?.role === 'admin';

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    // Modals
    const [editUser, setEditUser] = useState<AdminUser | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_FORM);
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');

    // ── Data loading ──────────────────────────────────────────────────────────
    // First load shows full skeleton. Subsequent refreshes are silent (no flicker).
    const loadUsers = async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await adminApi.getUsers();
            setUsers(data);
        } catch {
            toast('Failed to load users', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadUsers(); }, []);

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filteredUsers = useMemo(() => users.filter(u => {
        const q = search.toLowerCase();
        const matchSearch = u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    }), [users, search, roleFilter]);

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedUsers(e.target.checked ? new Set(filteredUsers.map(u => u._id)) : new Set());
    };
    const toggleOne = (id: string) => {
        const next = new Set(selectedUsers);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedUsers(next);
    };

    // ── Bulk delete ───────────────────────────────────────────────────────────
    const handleBulkDelete = async () => {
        if (!confirm(`Deactivate ${selectedUsers.size} user(s)? They will lose access immediately.`)) return;
        // Optimistic — remove from UI immediately
        const ids = Array.from(selectedUsers);
        setUsers(prev => prev.filter(u => !ids.includes(u._id)));
        setSelectedUsers(new Set());
        try {
            await adminApi.deleteUsersBulk(ids);
            toast(`${ids.length} user(s) deactivated`, 'success');
            loadUsers(true); // silent sync to confirm server state
        } catch {
            toast('Failed to deactivate some users', 'error');
            loadUsers(); // full reload to restore correct state
        }
    };

    // ── Single delete ─────────────────────────────────────────────────────────
    const handleDeleteOne = async (u: AdminUser) => {
        if (!confirm(`Deactivate "${u.username}"? They will be logged out on their next request.`)) return;
        // Optimistic — remove from UI immediately
        setUsers(prev => prev.filter(x => x._id !== u._id));
        try {
            await adminApi.deleteUser(u._id);
            toast(`"${u.username}" deactivated`, 'success');
            loadUsers(true); // silent sync
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? 'Failed to deactivate user';
            toast(msg, 'error');
            loadUsers(); // restore on failure
        }
    };

    // ── Edit (role / plan) ────────────────────────────────────────────────────
    const applyEdit = async (field: 'role' | 'plan', value: string) => {
        if (!editUser) return;
        // Optimistic update
        const updated = { ...editUser, [field]: value };
        setEditUser(updated);
        setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, [field]: value } : u));
        try {
            await adminApi.updateUser(editUser._id, { [field]: value });
            toast(`${field} updated to ${value}`, 'success');
        } catch {
            toast(`Failed to update ${field}`, 'error');
            loadUsers(); // restore on failure
        }
    };

    // ── Create user ───────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError('');

        if (!createForm.username.trim()) { setCreateError('Username is required'); return; }
        if (!createForm.email.trim()) { setCreateError('Email is required'); return; }
        if (createForm.password && createForm.password.length < 8) {
            setCreateError('Password must be at least 8 characters'); return;
        }

        setCreateLoading(true);
        try {
            await adminApi.createUser({
                username: createForm.username.trim(),
                email: createForm.email.trim().toLowerCase(),
                password: createForm.password || undefined,
                role: createForm.role,
                plan: createForm.plan,
                sendWelcome: createForm.sendWelcome,
            });
            toast(`User "${createForm.username}" created`, 'success');
            setShowCreate(false);
            setCreateForm(EMPTY_FORM);
            loadUsers(true); // silent refresh — no flicker
        } catch (err: any) {
            const msg = err?.response?.data?.error ?? 'Failed to create user';
            setCreateError(msg);
        } finally {
            setCreateLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="card-dark p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-dark p-6 overflow-hidden">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h3 className="card-title text-xl">User Management</h3>
                    <p className="text-sm text-gray-500 mt-1">{users.length} total users</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedUsers.size > 0 && (
                        <motion.button
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                            onClick={handleBulkDelete}
                            className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-colors"
                        >
                            Delete ({selectedUsers.size})
                        </motion.button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => { setShowCreate(true); setCreateError(''); setCreateForm(EMPTY_FORM); }}
                            className="bg-[#D4AF37] text-black font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#FFD700] transition-colors"
                        >
                            + Create User
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6">
                <input
                    type="text" placeholder="Search username or email…"
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
                <button onClick={() => loadUsers(true)} className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                    {refreshing ? <span className="animate-spin inline-block">↻</span> : '↻'}
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-white/5 rounded-xl">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#111]">
                        <tr className="border-b border-white/10 text-gray-400 font-semibold tracking-wide">
                            <th className="px-4 py-4 w-10">
                                <input type="checkbox"
                                    onChange={toggleAll}
                                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                    className="w-4 h-4 rounded border-white/20"
                                />
                            </th>
                            <th className="px-4 py-4 uppercase text-xs">User</th>
                            <th className="px-4 py-4 uppercase text-xs">Role</th>
                            <th className="px-4 py-4 uppercase text-xs">Plan</th>
                            <th className="px-4 py-4 uppercase text-xs">Status</th>
                            <th className="px-4 py-4 uppercase text-xs">Joined</th>
                            <th className="px-4 py-4 uppercase text-xs text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id}
                                className={`border-b border-white/[0.02] transition-colors ${selectedUsers.has(u._id) ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                            >
                                <td className="px-4 py-4">
                                    <input type="checkbox" checked={selectedUsers.has(u._id)}
                                        onChange={() => toggleOne(u._id)} className="w-4 h-4 rounded" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#D4AF37] to-[#818cf8] flex items-center justify-center text-black font-bold uppercase text-xs flex-shrink-0">
                                            {u.username.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{u.username}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </div>
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
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider flex items-center gap-1 w-fit ${(u as any).isActive !== false ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${(u as any).isActive !== false ? 'bg-green-400' : 'bg-red-400'}`} />
                                        {(u as any).isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-gray-500 font-mono text-xs">
                                    {new Date(u.createdAt).toISOString().slice(0, 10)}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditUser(u)}
                                            className="text-gray-400 hover:text-white bg-white/5 px-3 py-1.5 rounded border border-white/10 hover:border-white/20 transition-colors text-xs"
                                        >
                                            Edit
                                        </button>
                                        {u._id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleDeleteOne(u)}
                                                className="text-red-500/60 hover:text-red-400 bg-red-500/5 px-3 py-1.5 rounded border border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 transition-colors text-xs"
                                                title="Deactivate user"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={7} className="text-center py-10 text-gray-600 text-sm">No users found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Edit Modal ─────────────────────────────────────────────────── */}
            <AnimatePresence>
                {editUser && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#111] border border-[#D4AF37]/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
                        >
                            <h3 className="text-lg font-bold text-white mb-1">Edit User</h3>
                            <p className="text-xs text-gray-500 mb-6">{editUser.email}</p>

                            <div className="mb-5">
                                <label className={labelCls}>Role</label>
                                <div className="flex gap-2">
                                    {(['user', 'admin'] as const).map(r => (
                                        <button key={r} onClick={() => applyEdit('role', r)}
                                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${editUser.role === r
                                                ? r === 'admin' ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-[#818cf8]/20 border-[#818cf8]/50 text-[#818cf8]'
                                                : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'}`}
                                        >
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-8">
                                <label className={labelCls}>Plan</label>
                                <div className="flex gap-2">
                                    {(['free', 'premium'] as const).map(p => (
                                        <button key={p} onClick={() => applyEdit('plan', p)}
                                            className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${editUser.plan === p
                                                ? p === 'premium' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/10 border-white/30 text-white'
                                                : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'}`}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={() => setEditUser(null)}
                                className="w-full py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm font-medium">
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Create User Modal ──────────────────────────────────────────── */}
            <AnimatePresence>
                {showCreate && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#111] border border-[#D4AF37]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Create User</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">New account will be created immediately</p>
                                </div>
                                <button onClick={() => setShowCreate(false)}
                                    className="text-gray-500 hover:text-white transition-colors text-lg leading-none">✕</button>
                            </div>

                            <form id="create-user-form" onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                                {/* Username */}
                                <div>
                                    <label className={labelCls}>Username <span className="text-red-500">*</span></label>
                                    <input
                                        type="text" required
                                        value={createForm.username}
                                        onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                                        placeholder="e.g. john_doe"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email" required
                                        value={createForm.email}
                                        onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="user@example.com"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className={labelCls}>Password <span className="text-gray-600">(optional — auto-generated if blank)</span></label>
                                    <input
                                        type="password"
                                        value={createForm.password}
                                        onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="Min 8 characters"
                                        className={inputCls}
                                    />
                                </div>

                                {/* Role + Plan row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>Role</label>
                                        <select
                                            value={createForm.role}
                                            onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                                            className={inputCls}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Plan</label>
                                        <select
                                            value={createForm.plan}
                                            onChange={e => setCreateForm(f => ({ ...f, plan: e.target.value as 'free' | 'premium' }))}
                                            className={inputCls}
                                        >
                                            <option value="free">Free</option>
                                            <option value="premium">Premium</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Send welcome email toggle */}
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <div
                                        onClick={() => setCreateForm(f => ({ ...f, sendWelcome: !f.sendWelcome }))}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${createForm.sendWelcome ? 'bg-[#D4AF37]' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${createForm.sendWelcome ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </div>
                                    <span className="text-sm text-gray-400">Send welcome email</span>
                                </label>

                                {/* Error */}
                                {createError && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                                        {createError}
                                    </div>
                                )}
                            </form>

                            {/* Actions — outside scroll area, always visible */}
                            <div className="flex gap-3 px-6 pb-6 border-t border-white/5 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="create-user-form"
                                    disabled={createLoading}
                                    className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-sm hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {createLoading ? 'Creating…' : 'Create User'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </motion.div>
    );
};

export default UsersTable;
