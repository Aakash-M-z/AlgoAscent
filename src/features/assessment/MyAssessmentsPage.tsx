/**
 * src/features/assessment/MyAssessmentsPage.tsx
 * Candidate Dashboard View for Assigned & Completed Assessments
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Layers, Clock, Trophy, ArrowRight, Play, CheckCircle2,
    Calendar, ShieldCheck, AlertCircle, FileText
} from 'lucide-react';
import { assessmentApi } from '../../api/assessmentApi';
import { useAuth } from '../../contexts/AuthContext';

const MyAssessmentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [assessments, setAssessments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            setIsLoading(true);
            try {
                const res = await assessmentApi.getMyAssessments();
                setAssessments(res.assessments || []);
            } catch (err) {
                console.error('Failed to load my assessments:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    return (
        <div className="section-gap animate-fadeIn pb-12 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                    <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
                        <span className="text-[#FF3B1F]">◈</span> My Assigned Assessments
                    </h2>
                    <p className="text-zinc-400 mt-1 text-xs">
                        View and take technical assessments, campus placements, and mock coding rounds assigned to you.
                    </p>
                </div>
            </div>

            {/* Assessment List */}
            {isLoading ? (
                <div className="py-20 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#FF3B1F] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium tracking-wide">Loading your assessments...</span>
                </div>
            ) : assessments.length === 0 ? (
                <div className="p-16 text-center border border-white/10 rounded-2xl bg-white/[0.01]">
                    <Layers className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
                    <h4 className="text-sm font-medium text-zinc-200 mb-1">No Assessments Assigned</h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        When an administrator assigns you an evaluation or placement test, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assessments.map(a => (
                        <div
                            key={a.id}
                            className="p-5 rounded-2xl bg-[#0E0E14] border border-white/10 hover:border-[#FF3B1F]/40 transition-all flex flex-col justify-between shadow-lg space-y-4"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                    <span className={`px-2.5 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider ${
                                        a.attemptStatus === 'completed'
                                            ? a.attemptPassed
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : a.attemptStatus === 'in_progress'
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : 'bg-[#FF3B1F]/15 text-[#FF3B1F] border border-[#FF3B1F]/30'
                                    }`}>
                                        {a.attemptStatus === 'completed'
                                            ? a.attemptPassed ? 'Passed' : 'Needs Improvement'
                                            : a.attemptStatus === 'in_progress' ? 'In Progress' : 'Ready to Start'}
                                    </span>

                                    {a.attemptScore !== null && (
                                        <span className="text-xs font-bold text-[#FF3B1F]">
                                            Score: {a.attemptScore}%
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-base font-bold text-white line-clamp-1">{a.title}</h3>
                                <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed">
                                    {a.description || 'Comprehensive technical assessment.'}
                                </p>

                                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-[0.7rem] text-white/50 font-mono">
                                    <div>
                                        <span className="block text-[0.6rem] font-bold uppercase text-white/40">Duration</span>
                                        <strong className="text-white font-sans">{a.duration} Mins</strong>
                                    </div>
                                    <div>
                                        <span className="block text-[0.6rem] font-bold uppercase text-white/40">Questions</span>
                                        <strong className="text-white font-sans">{a.questionCount} Total</strong>
                                    </div>
                                    <div>
                                        <span className="block text-[0.6rem] font-bold uppercase text-white/40">Passing</span>
                                        <strong className="text-emerald-400 font-sans">{a.passingScore}%</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-3 border-t border-white/5">
                                {a.attemptStatus === 'completed' ? (
                                    <button
                                        onClick={() => navigate(`/assessment/${a.shareToken}/result`, {
                                            state: { attemptId: a.attemptId }
                                        })}
                                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> View Detailed Scorecard
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/assessment/${a.shareToken}`)}
                                        className="rig-chamfer-btn w-full py-2.5 bg-[#FF3B1F] text-black font-bold text-xs hover:bg-[#E63219] shadow-lg shadow-[#FF3B1F]/20 flex items-center justify-center gap-1.5 transition-all"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        {a.attemptStatus === 'in_progress' ? 'Resume Assessment' : 'Start Assessment'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyAssessmentsPage;
