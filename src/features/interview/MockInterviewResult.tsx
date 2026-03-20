import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MockInterviewResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const result = location.state?.result;

    if (!result) {
        return (
            <div className="text-center mt-20 flex flex-col gap-4 items-center">
                <div className="text-red-500">No interview result found.</div>
                <button onClick={() => navigate('/interview')} className="bg-white/10 px-4 py-2 rounded-lg text-white">Back to start</button>
            </div>
        );
    }

    const { score, feedback, topic, question } = result;

    const getColor = (val: number) => {
        if (val >= 80) return 'text-green-500';
        if (val >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="max-w-4xl mx-auto section-gap">
            <div className="text-center mb-10">
                <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">{topic} Interview Completed</span>
                <h2 className="text-4xl font-black text-white mb-2">Performance Report</h2>
                <p className="text-gray-400">AI-generated evaluation of your response.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Overall', val: score.overallScore },
                    { label: 'Correctness', val: score.correctness },
                    { label: 'Optimization', val: score.optimization },
                    { label: 'Clarity', val: score.clarity },
                ].map(s => (
                    <div key={s.label} className="card-dark p-6 text-center">
                        <div className="text-gray-400 text-sm font-semibold mb-2">{s.label}</div>
                        <div className={`text-3xl font-bold font-mono ${getColor(s.val)}`}>{s.val}/100</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="card-dark p-6 border-t-4 border-green-500">
                    <h3 className="text-lg font-bold text-white mb-4">Strong Points 💪</h3>
                    <ul className="space-y-2 text-sm text-gray-300 list-disc ml-5">
                        {feedback.strengths.map((str: string, i: number) => <li key={i}>{str}</li>)}
                    </ul>
                </div>
                
                <div className="card-dark p-6 border-t-4 border-red-500">
                    <h3 className="text-lg font-bold text-white mb-4">Weaknesses 🚨</h3>
                    <ul className="space-y-2 text-sm text-gray-300 list-disc ml-5">
                        {feedback.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            </div>

            <div className="card-dark p-6 mb-6 border-t-4 border-blue-500">
                <h3 className="text-lg font-bold text-white mb-4">Areas to Improve 🚀</h3>
                <ul className="space-y-2 text-sm text-gray-300 list-disc ml-5">
                    {feedback.improvements.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                </ul>
            </div>

            <div className="card-dark p-6 mb-10">
                <h3 className="text-lg font-bold text-[#D4AF37] mb-2">Ideal Answer</h3>
                <p className="text-sm text-gray-400 bg-[#111] p-4 rounded-xl leading-relaxed whitespace-pre-wrap font-mono">
                    {feedback.idealAnswer}
                </p>
            </div>

            <div className="text-center">
                <button onClick={() => navigate('/interview')} className="bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-lg hover:bg-white transition-colors">
                    Take Another Interview
                </button>
            </div>
        </motion.div>
    );
};

export default MockInterviewResult;
