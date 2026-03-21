import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, Bell, Eye, Palette, Brain, 
    Database, Trash2, Save, Download, 
    CheckCircle2, AlertCircle, ChevronRight,
    Camera, Mail, Shield, Target, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { databaseAPI } from '../api/database';

/* ── Reusable Section Component ─────────────────────────────── */
const SettingsSection: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
    <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 md:p-8 mb-6"
    >
        <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                <p className="text-white/40 text-sm mt-1">{description}</p>
            </div>
        </div>
        <div className="space-y-6">
            {children}
        </div>
    </motion.section>
);

/* ── Toggle Switch Component ─────────────────────────────────── */
const Toggle: React.FC<{
    enabled: boolean;
    onChange: (val: boolean) => void;
    label?: string;
    description?: string;
}> = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between group">
        <div className="flex-1 pr-4">
            {label && <div className="text-sm font-bold text-white/90 group-hover:text-white transition-colors uppercase tracking-widest">{label}</div>}
            {description && <div className="text-xs text-white/40 mt-1">{description}</div>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-gold' : 'bg-white/10 opacity-60'}`}
        >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

/* ── Settings Page Component ────────────────────────────────── */
const Settings: React.FC = () => {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    
    // Profile State
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state when user loads
    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await databaseAPI.getProfile();
            if (profile) {
                setName(profile.name || profile.username || '');
                setEmail(profile.email || '');
                setBio(profile.learningGoal || '');
                setProfileImage(profile.profileImage || null);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        const changed = 
            name !== (user?.name || user?.username) || 
            email !== user?.email || 
            bio !== (user as any)?.learningGoal ||
            profileImage !== (user as any)?.profileImage;
        setHasChanges(changed);
    }, [name, email, bio, profileImage, user]);

    // Preferences State
    const [topics, setTopics] = useState(['DSA', 'OS']);
    const [difficulty, setDifficulty] = useState('Intermediate');
    const [dailyGoal, setDailyGoal] = useState(5);

    // AI/Notifications State
    const [aiCoaching, setAiCoaching] = useState(true);
    const [aiMode, setAiMode] = useState('Balanced');
    const [notifications, setNotifications] = useState({
        reminders: true,
        streaks: true,
        reports: false
    });

    // Theme/Privacy State
    const [theme, setTheme] = useState('dark');
    const [publicProfile, setPublicProfile] = useState(false);

    useEffect(() => {
        const changed = name !== user?.name || email !== user?.email || bio !== '';
        setHasChanges(changed);
    }, [name, email, bio, user]);

    const handleSaveProfile = async () => {
        if (!name || !email) {
            toast('Name and Email are required', 'error');
            return;
        }
        
        setIsSaving(true);
        try {
            const updated = await databaseAPI.updateProfile({
                name,
                email,
                profileImage: profileImage || undefined,
                learningGoal: bio
            });

            if (updated) {
                toast('Profile updated successfully', 'success');
                updateUser(updated);
                setHasChanges(false);
            } else {
                toast('Failed to update profile', 'error');
            }
        } catch (err) {
            toast('An error occurred during save', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Local preview
        const localUrl = URL.createObjectURL(file);
        setProfileImage(localUrl);
        setHasChanges(true);

        // Upload to Cloudinary
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            toast('Cloudinary not configured. Using local preview only.', 'warning');
            console.warn('Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.secure_url) {
                setProfileImage(data.secure_url);
                toast('Image uploaded to Cloudinary', 'success');
            }
        } catch (err) {
            toast('Cloudinary upload failed', 'error');
        }
    };


    const toggleTopic = (t: string) => {
        setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 pb-32">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-3">
                    Settings <span className="text-gold">⚙</span>
                </h1>
                <p className="text-white/40 font-medium">Manage your account preferences, security, and AI coaching experience.</p>
            </header>

            {/* A. Profile Settings */}
            <SettingsSection 
                title="Profile Information" 
                description="Update your personal details and how others see you."
                icon={<User size={24} />}
            >
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black text-gold shadow-2xl overflow-hidden">
                            {profileImage ? (
                                <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <Camera size={24} className="text-white" />
                        </div>
                        <input 
                            type="file" ref={fileInputRef} onChange={handleFileChange}
                            accept="image/*" className="hidden" 
                        />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                                type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50 focus:bg-white/[0.05] transition-all"
                                placeholder="Your name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Email Address</label>
                            <input 
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50 focus:bg-white/[0.05] transition-all"
                                placeholder="Email"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Daily Learning Goal</label>
                            <textarea 
                                value={bio} onChange={e => setBio(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50 focus:bg-white/[0.05] transition-all min-h-[100px]"
                                placeholder="What are your learning objectives for this month?"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-white/5">
                    <button 
                        onClick={handleSaveProfile}
                        disabled={!hasChanges || isSaving}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${hasChanges && !isSaving ? 'bg-gold-500 text-black shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 opacity-100' : 'bg-white/5 text-white/20 cursor-not-allowed opacity-50'}`}
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Save size={14} />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </SettingsSection>

            {/* B. Account & Security */}
            <SettingsSection 
                title="Account & Security" 
                description="Manage your password and active sessions."
                icon={<Shield size={24} />}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-3">
                            <Lock size={18} className="text-white/40 group-hover:text-gold transition-colors" />
                            <span className="text-sm font-bold text-white/80 group-hover:text-white uppercase tracking-widest">Change Password</span>
                        </div>
                        <ChevronRight size={14} className="text-white/20" />
                    </button>
                    <button className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-3">
                            <Mail size={18} className="text-white/40 group-hover:text-gold transition-colors" />
                            <span className="text-sm font-bold text-white/80 group-hover:text-white uppercase tracking-widest">Two-Factor Auth</span>
                        </div>
                        <span className="text-[10px] bg-white/5 text-white/40 px-2 py-1 rounded-md">Disabled</span>
                    </button>
                </div>
            </SettingsSection>

            {/* C. Learning Preferences */}
            <SettingsSection 
                title="Learning Preferences" 
                description="Tailor the platform to your specific curriculum."
                icon={<Target size={24} />}
            >
                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1 mb-4 block">Focus Areas</label>
                        <div className="flex flex-wrap gap-2">
                            {['DSA', 'OS', 'DBMS', 'CN', 'OOPS', 'System Design'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => toggleTopic(t)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${topics.includes(t) ? 'bg-gold/20 text-gold border border-gold/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'bg-white/5 text-white/40 border border-white/5 hover:border-white/20'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1 mb-2 block">Difficulty Level</label>
                            <select 
                                value={difficulty} onChange={e => setDifficulty(e.target.value)}
                                className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-gold/50 cursor-pointer"
                            >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1 mb-2 block">Daily Goal (Problems)</label>
                            <input 
                                type="number" value={dailyGoal} onChange={e => setDailyGoal(Number(e.target.value))}
                                className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold/50"
                            />
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* D. AI Settings */}
            <SettingsSection 
                title="AI Coaching Engine" 
                description="Configure how the intelligent assistant interacts with you."
                icon={<Brain size={24} />}
            >
                <div className="space-y-6">
                    <Toggle 
                        enabled={aiCoaching} onChange={setAiCoaching}
                        label="Enable AI Insights"
                        description="Receive personalized feedback on every solution you submit."
                    />
                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1 block">Assistant Strategy</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {['Balanced', 'Weak Area Focus', 'Speed Optimization'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setAiMode(m)}
                                    className={`p-4 rounded-2xl text-left transition-all ${aiMode === m ? 'bg-gold/10 border border-gold/40' : 'bg-white/[0.02] border border-white/5 opacity-40 hover:opacity-100'}`}
                                >
                                    <div className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${aiMode === m ? 'text-gold' : 'text-white'}`}>{m}</div>
                                    <div className="text-[9px] text-white/40 leading-tight">Optimizes AI triggers for {m.toLowerCase()} mode.</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* E. Notifications */}
            <SettingsSection 
                title="Preferences & Notifications" 
                description="Manage your UI theme and alert settings."
                icon={<Bell size={24} />}
            >
                <div className="space-y-6">
                    <Toggle 
                        enabled={notifications.reminders} onChange={v => setNotifications(n => ({...n, reminders: v}))}
                        label="Daily Practice Reminders"
                        description="We'll nudge you if you haven't solved a problem by 8 PM."
                    />
                    <Toggle 
                        enabled={notifications.streaks} onChange={v => setNotifications(n => ({...n, streaks: v}))}
                        label="Streak Milestone Alerts"
                        description="Celebrate your consistency when you hit 7, 30, and 100 days."
                    />
                    <Toggle 
                        enabled={notifications.reports} onChange={v => setNotifications(n => ({...n, reports: v}))}
                        label="Weekly Performance Report"
                        description="Receive a weekly summary of your progress via email."
                    />
                </div>
            </SettingsSection>

            {/* F. Data & Privacy (Danger Zone) */}
            <SettingsSection 
                title="Privacy & Data Management" 
                description="Control your data footprint and account status."
                icon={<Database size={24} />}
            >
                <div className="space-y-6">
                    <Toggle 
                        enabled={publicProfile} onChange={setPublicProfile}
                        label="Public Profile Visibility"
                        description="Allow other users and potential recruiters to view your solves."
                    />
                    
                    <div className="pt-6 border-t border-white/5 flex flex-wrap gap-4">
                        <button className="flex items-center gap-2 px-6 py-4 bg-white/[0.03] border border-white/5 hover:border-white/20 rounded-2xl text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
                            <Download size={16} />
                            Download My Data (JSON)
                        </button>
                        <button className="flex items-center gap-2 px-6 py-4 bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50 rounded-2xl text-red-500/60 hover:text-red-500 transition-all text-xs font-bold uppercase tracking-widest ml-auto">
                            <Trash2 size={16} />
                            Delete Account
                        </button>
                    </div>
                </div>
            </SettingsSection>

        </div>
    );
};

export default Settings;
