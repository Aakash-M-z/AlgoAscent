import React, { useMemo } from 'react';
import { Activity } from '../types';

interface AIAnalysisProps {
    activities: Activity[];
    username?: string;
}

interface AnalysisResult {
    trend: 'improving' | 'declining' | 'stagnant' | 'new';
    trendLabel: string;
    trendColor: string;
    trendIcon: string;
    keyMetrics: { label: string; value: string; icon: string; color: string }[];
    suggestions: { title: string; desc: string; icon: string }[];
    prediction: string;
    motivation: string;
    score: number;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ activities, username }) => {

    const analysis = useMemo((): AnalysisResult => {
        const now = new Date();
        const last7 = activities.filter(a => {
            const d = new Date(a.date);
            return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
        });
        const prev7 = activities.filter(a => {
            const days = (now.getTime() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24);
            return days > 7 && days <= 14;
        });

        const totalSolved = activities.filter(a => a.problemSolved).length;
        const last7Solved = last7.filter(a => a.problemSolved).length;
        const prev7Solved = prev7.filter(a => a.problemSolved).length;
        const avgDuration = last7.length ? Math.round(last7.reduce((s, a) => s + a.duration, 0) / last7.length) : 0;
        const totalTime = Math.round(activities.reduce((s, a) => s + a.duration, 0) / 60);

        // Unique active days in last 7
        const activeDays = new Set(last7.map(a => a.date.slice(0, 10))).size;

        // Difficulty breakdown
        const hard = last7.filter(a => a.difficulty === 'Hard').length;
        const medium = last7.filter(a => a.difficulty === 'Medium').length;

        // Trend detection
        let trend: AnalysisResult['trend'] = 'new';
        let trendLabel = 'Just Getting Started';
        let trendColor = 'text-blue-400';
        let trendIcon = '🌱';

        if (activities.length > 0) {
            if (last7Solved > prev7Solved + 1) {
                trend = 'improving'; trendLabel = 'Improving'; trendColor = 'text-green-400'; trendIcon = '📈';
            } else if (last7Solved < prev7Solved - 1) {
                trend = 'declining'; trendLabel = 'Declining'; trendColor = 'text-red-400'; trendIcon = '📉';
            } else {
                trend = 'stagnant'; trendLabel = 'Consistent'; trendColor = 'text-yellow-400'; trendIcon = '➡️';
            }
        }

        // Score (0-100)
        const score = Math.min(100, Math.round(
            (activeDays / 7) * 30 +
            (Math.min(last7Solved, 10) / 10) * 40 +
            (hard * 3 + medium * 1.5) * 2
        ));

        // Suggestions based on data
        const suggestions: AnalysisResult['suggestions'] = [];

        if (activeDays < 4) {
            suggestions.push({ icon: '📅', title: 'Build Consistency', desc: 'Aim for at least 5 active days per week' });
        }
        if (avgDuration < 30) {
            suggestions.push({ icon: '⏱️', title: 'Increase Study Time', desc: 'Try 45–60 min focused sessions daily' });
        }
        if (hard === 0 && totalSolved > 10) {
            suggestions.push({ icon: '💪', title: 'Challenge Yourself', desc: 'Attempt 1–2 Hard problems this week' });
        }
        if (medium === 0) {
            suggestions.push({ icon: '🎯', title: 'Level Up', desc: 'Mix in Medium difficulty problems' });
        }
        if (suggestions.length < 2) {
            suggestions.push({ icon: '🔁', title: 'Review Past Problems', desc: 'Revisit solved problems to reinforce patterns' });
        }

        // Prediction
        const weeklyRate = last7Solved;
        const predicted = weeklyRate * 4;
        const prediction = weeklyRate > 0
            ? `At your current pace, you'll solve ~${predicted} problems this month`
            : 'Log some activity to get a performance prediction';

        // Motivation
        const motivations = [
            `Keep going ${username || 'champ'}! Every problem solved is a step forward. 🔥`,
            `You're building something great. Stay consistent! 💪`,
            `Progress > Perfection. One problem at a time! 🚀`,
            `The best coders were once beginners too. Keep pushing! ⚡`,
            `Consistency beats intensity. Show up every day! 🎯`,
        ];
        const motivation = motivations[Math.floor(Math.random() * motivations.length)];

        return {
            trend, trendLabel, trendColor, trendIcon,
            keyMetrics: [
                { label: 'Problems Solved', value: totalSolved.toString(), icon: '✅', color: 'text-green-400' },
                { label: 'Active Days (7d)', value: `${activeDays}/7`, icon: '📅', color: 'text-blue-400' },
                { label: 'Avg Session', value: `${avgDuration}m`, icon: '⏱️', color: 'text-purple-400' },
                { label: 'Total Hours', value: `${totalTime}h`, icon: '🕐', color: 'text-yellow-400' },
                { label: 'This Week', value: last7Solved.toString(), icon: '📊', color: 'text-cyan-400' },
                { label: 'Hard Solved', value: hard.toString(), icon: '🔥', color: 'text-red-400' },
            ],
            suggestions: suggestions.slice(0, 3),
            prediction,
            motivation,
            score,
        };
    }, [activities, username]);

    const scoreColor = analysis.score >= 70 ? 'text-green-400' : analysis.score >= 40 ? 'text-yellow-400' : 'text-red-400';
    const scoreRing = analysis.score >= 70 ? 'stroke-green-400' : analysis.score >= 40 ? 'stroke-yellow-400' : 'stroke-red-400';
    const circumference = 2 * Math.PI * 36;
    const dashOffset = circumference - (analysis.score / 100) * circumference;

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border border-yellow-500/30 flex items-center justify-center text-xl">🤖</div>
                <div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Orbitron", sans-serif' }}>AI Progress Analysis</h2>
                    <p className="text-gray-400 text-sm">Smart insights based on your activity data</p>
                </div>
            </div>

            {/* Top Row: Score + Trend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Performance Score */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 flex items-center gap-6">
                    <div className="relative w-24 h-24 flex-shrink-0">
                        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                            <circle cx="40" cy="40" r="36" fill="none" className={scoreRing} strokeWidth="6"
                                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-2xl font-black ${scoreColor}`}>{analysis.score}</span>
                            <span className="text-gray-500 text-[10px]">/ 100</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Performance Score</p>
                        <p className={`text-2xl font-bold ${scoreColor}`}>
                            {analysis.score >= 70 ? 'Excellent' : analysis.score >= 40 ? 'Good' : 'Needs Work'}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">Based on last 7 days</p>
                    </div>
                </div>

                {/* Trend */}
                <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6 flex items-center gap-4">
                    <div className="text-5xl">{analysis.trendIcon}</div>
                    <div>
                        <p className="text-gray-400 text-sm mb-1">Current Trend</p>
                        <p className={`text-2xl font-bold ${analysis.trendColor}`}>{analysis.trendLabel}</p>
                        <p className="text-gray-500 text-xs mt-1">vs previous 7 days</p>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span>📊</span> Key Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {analysis.keyMetrics.map((m, i) => (
                        <div key={i} className="bg-black/30 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{m.icon}</span>
                                <span className="text-gray-400 text-xs">{m.label}</span>
                            </div>
                            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Suggestions */}
            <div className="bg-gray-900/60 border border-white/5 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <span>💡</span> Actionable Suggestions
                </h3>
                <div className="space-y-3">
                    {analysis.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 bg-black/30 rounded-xl p-4 border border-yellow-500/10 hover:border-yellow-500/30 transition-colors duration-300">
                            <span className="text-2xl mt-0.5">{s.icon}</span>
                            <div>
                                <p className="text-white font-semibold text-sm">{s.title}</p>
                                <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Prediction + Motivation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-900/60 border border-blue-500/20 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                        <span>🔮</span> Prediction
                    </h3>
                    <p className="text-blue-300 text-sm leading-relaxed">{analysis.prediction}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/20 border border-yellow-500/20 rounded-2xl p-5">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                        <span>⚡</span> Motivation
                    </h3>
                    <p className="text-yellow-200 text-sm leading-relaxed italic">{analysis.motivation}</p>
                </div>
            </div>
        </div>
    );
};

export default AIAnalysis;
