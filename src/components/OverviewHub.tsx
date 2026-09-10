import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Code2,
    BookOpen,
    Github,
    Map,
    ExternalLink,
    Star,
    GitFork,
    FolderGit2,
    Terminal,
    Activity as ActivityIcon,
    ArrowUpRight,
    Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Activity } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../api/config';
import { SessionManager } from '../utils/sessionManager';
import LeetCodeQuestions from './LeetCodeQuestions';
import CoreSubjects from './CoreSubjects';
import DSARoadmap from './DSARoadmap';
import axios from 'axios';

interface OverviewHubProps {
    activities: Activity[];
    onAddActivity: (activity: Partial<Activity>) => Promise<boolean>;
}

type OverviewSection = 'leetcode' | 'subjects' | 'github' | 'roadmap';

interface GitHubRepo {
    id: number;
    name: string;
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    language: string | null;
    updated_at: string;
}

export const OverviewHub: React.FC<OverviewHubProps> = ({ activities, onAddActivity }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<OverviewSection>('leetcode');
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [githubUsername, setGithubUsername] = useState<string>(() => user?.username || '');

    // Resolve connected GitHub username
    useEffect(() => {
        if (!user?.id) {
            setGithubUsername('');
            setRepos([]);
            return;
        }

        const token = SessionManager.getToken();
        fetch(`${API_BASE}/api/platforms/accounts`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            }
        })
        .then(r => r.ok ? r.json() : { accounts: [] })
        .then(data => {
            const gh = data.accounts?.find((a: any) => a.platform === 'github');
            if (gh?.username) {
                setGithubUsername(gh.username);
            } else if (user?.username) {
                setGithubUsername(user.username);
            }
        })
        .catch(() => {
            if (user?.username) setGithubUsername(user.username);
        });
    }, [user?.id, user?.username]);

    // Fetch GitHub repos if on GitHub tab
    useEffect(() => {
        if (activeSection === 'github') {
            if (!githubUsername || !githubUsername.trim()) {
                setRepos([]);
                setReposLoading(false);
                return;
            }

            const fetchRepos = async () => {
                setReposLoading(true);
                try {
                    const res = await axios.get(`https://api.github.com/users/${githubUsername.trim()}/repos?sort=updated&per_page=12`, {
                        headers: { 'User-Agent': 'AlgoAscent-App' },
                        timeout: 8000,
                    });
                    if (Array.isArray(res.data)) {
                        setRepos(res.data);
                    } else {
                        setRepos([]);
                    }
                } catch {
                    setRepos([]);
                } finally {
                    setReposLoading(false);
                }
            };
            fetchRepos();
        }
    }, [activeSection, githubUsername]);

    const sections = [
        {
            id: 'leetcode' as OverviewSection,
            code: '01',
            label: 'LEETCODE ENGINE',
            sublabel: '1,200+ Problems & Live Solves',
            icon: Code2,
        },
        {
            id: 'subjects' as OverviewSection,
            code: '02',
            label: 'CORE CS SUBJECTS',
            sublabel: 'OS, DBMS, CN & System Design',
            icon: BookOpen,
        },
        {
            id: 'github' as OverviewSection,
            code: '03',
            label: 'GITHUB DEV HUB',
            sublabel: 'Repos & Open Source Work',
            icon: Github,
        },
        {
            id: 'roadmap' as OverviewSection,
            code: '04',
            label: 'DSA ROADMAP',
            sublabel: '4 Structured Stages & Blind 75',
            icon: Map,
        },
    ];

    return (
        <div className="space-y-8 animate-fadeIn font-sans">
            {/* ── TOP HERO OVERVIEW BANNER ────────────────── */}
            <div className="relative overflow-hidden bg-[#0E0E14] border border-white/10 p-6 sm:p-8 lg:p-10 shadow-2xl rounded-2xl">
                {/* Accent red geometric cut */}
                <div className="absolute top-0 left-0 w-32 h-1.5 bg-[#FF3B1F]" />

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-2.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF3B1F]" />
                            <span className="text-zinc-400 text-[11px] font-medium tracking-wider uppercase">
                                AlgoAscent Dashboard
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight mb-2">
                            Overview & Engineering Hub
                        </h1>
                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
                            Track problem-solving milestones, revise core computer science subjects, inspect repositories, and launch technical assessments.
                        </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => navigate('/assessment/algoascent-test-assessment')}
                            className="px-5 py-2.5 bg-[#FF3B1F] text-white font-medium text-xs sm:text-sm hover:bg-[#E63219] active:scale-[0.98] transition-all flex items-center gap-2 rounded-xl shadow-md shadow-[#FF3B1F]/20 cursor-pointer"
                        >
                            <span>Take Test Assessment</span>
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigate('/assessments')}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                        >
                            <span>Assessment Studio</span>
                        </button>
                    </div>
                </div>

                {/* Clean Metrics Strip */}
                <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                        <ActivityIcon className="w-3.5 h-3.5 text-[#FF3B1F]" />
                        <span>Solved: {activities.length} Questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-[#FF3B1F]" />
                        <span>Languages: JS, Python, Java, C++</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#FF3B1F]" />
                        <span>Core Subjects: 5 Tracks</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Map className="w-3.5 h-3.5 text-[#FF3B1F]" />
                        <span>Roadmaps: 4 Stages</span>
                    </div>
                </div>
            </div>

            {/* ── MINIMAL TAB NAVIGATION ────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {sections.map((s) => {
                    const isActive = activeSection === s.id;
                    const Icon = s.icon;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`
                                relative p-4 text-left transition-all duration-200 border rounded-xl cursor-pointer
                                ${isActive
                                    ? 'bg-[#14141E] border-[#FF3B1F]/80 text-zinc-100 shadow-md shadow-[#FF3B1F]/10'
                                    : 'bg-[#0A0A0E] border-white/10 hover:border-white/20 hover:bg-[#0E0E14] text-zinc-400'
                                }
                            `}
                        >
                            <div className="flex items-center justify-between mb-2.5">
                                <div className={`
                                    w-7 h-7 rounded-lg flex items-center justify-center border transition-colors
                                    ${isActive 
                                        ? 'bg-[#FF3B1F] text-white border-[#FF3B1F]' 
                                        : 'bg-white/5 text-zinc-400 border-white/10'
                                    }
                                `}>
                                    <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-mono text-[11px] text-[#FF3B1F] font-medium">
                                    {s.code} //
                                </span>
                            </div>

                            <div className="font-medium text-xs sm:text-sm text-zinc-200 tracking-normal">
                                {s.label}
                            </div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                                {s.sublabel}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── SECTION CONTENT SWITCHER ───────────────────────────────── */}
            <div className="relative">
                <AnimatePresence mode="wait">
                    {/* 1. LEETCODE PROBLEM SET */}
                    {activeSection === 'leetcode' && (
                        <motion.div
                            key="leetcode"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <LeetCodeQuestions activities={activities} onAddActivity={onAddActivity} />
                        </motion.div>
                    )}

                    {/* 2. CORE SUBJECTS */}
                    {activeSection === 'subjects' && (
                        <motion.div
                            key="subjects"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CoreSubjects />
                        </motion.div>
                    )}

                    {/* 3. GITHUB DEV HUB */}
                    {activeSection === 'github' && (
                        <motion.div
                            key="github"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* GitHub Profile Banner */}
                            <div className="p-6 bg-[#0E0E14] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-black border border-white/15 flex items-center justify-center text-[#FF3B1F]">
                                        <Github className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-white">
                                                {user?.name || user?.username || 'Developer'}
                                            </h3>
                                            <span className="px-2 py-0.5 bg-[#FF3B1F]/15 text-[#FF3B1F] border border-[#FF3B1F]/30 text-[10px] font-mono font-bold">
                                                ACTIVE SYNC
                                            </span>
                                        </div>
                                        <p className="text-xs text-white/40 font-mono mt-0.5">
                                            github.com/{githubUsername || 'connected_account'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={githubUsername}
                                        onChange={(e) => setGithubUsername(e.target.value)}
                                        placeholder="GitHub handle..."
                                        className="px-3.5 py-2 bg-black border border-white/15 text-xs text-white focus:border-[#FF3B1F] focus:outline-none"
                                    />
                                    <a
                                        href={`https://github.com/${githubUsername}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-white text-black text-xs font-bold hover:bg-white/90 transition-all flex items-center gap-1.5"
                                    >
                                        <span>View Profile</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </div>

                            {/* Repositories Grid */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <FolderGit2 className="w-4 h-4 text-[#FF3B1F]" />
                                        <span>PUBLIC REPOSITORIES ({repos.length})</span>
                                    </h4>
                                    <span className="text-xs text-white/40 font-mono">LIVE CONNECTED</span>
                                </div>

                                {reposLoading ? (
                                    <div className="p-12 text-center text-white/40 font-mono text-xs bg-[#0E0E14] border border-white/10">
                                        FETCHING GITHUB REPOSITORIES...
                                    </div>
                                ) : repos.length === 0 ? (
                                    <div className="p-12 text-center text-white/40 font-mono text-xs bg-[#0E0E14] border border-white/10">
                                        NO PUBLIC REPOSITORIES FOUND FOR THIS USERNAME.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {repos.map((repo) => (
                                            <a
                                                key={repo.id}
                                                href={repo.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-5 bg-[#0E0E14] border border-white/10 hover:border-[#FF3B1F] transition-all flex flex-col justify-between group"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <h5 className="text-sm font-bold text-white group-hover:text-[#FF3B1F] transition-colors truncate">
                                                            {repo.name}
                                                        </h5>
                                                        <ExternalLink className="w-3.5 h-3.5 text-white/30 group-hover:text-[#FF3B1F] flex-shrink-0" />
                                                    </div>
                                                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-4">
                                                        {repo.description || 'No description provided.'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-white/40 font-mono">
                                                    {repo.language && (
                                                        <span className="px-2 py-0.5 bg-black border border-white/10 text-[10px] text-white/80">
                                                            {repo.language}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-[#FF3B1F]" />
                                                            {repo.stargazers_count}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <GitFork className="w-3 h-3 text-white/40" />
                                                            {repo.forks_count}
                                                        </span>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* 4. DSA ROADMAP */}
                    {activeSection === 'roadmap' && (
                        <motion.div
                            key="roadmap"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <DSARoadmap activities={activities} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OverviewHub;
