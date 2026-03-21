import React from 'react';
import { motion } from 'framer-motion';

const techStack = [
    { name: 'React', color: '#61DAFB', icon: '⚛️' },
    { name: 'TypeScript', color: '#3178C6', icon: '📘' },
    { name: 'Vite', color: '#646CFF', icon: '⚡' },
    { name: 'TailwindCSS', color: '#06B6D4', icon: '🎨' },
    { name: 'Framer Motion', color: '#E10098', icon: '🎢' },
    { name: 'Lucide Icons', color: '#F7B500', icon: '🏷️' },
    { name: 'Node.js', color: '#339933', icon: '🟢' },
    { name: 'OpenRouter AI', color: '#000000', icon: '🧠' },
];

const TechStack = () => {
    return (
        <section id="tech-stack" className="py-24 bg-[#080808] border-t border-white/5 relative overflow-hidden">
             {/* Diagonal stripe of text moving background */}
             <div className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden pointer-events-none opacity-5">
                <div className="flex flex-col gap-12 rotate-[-15deg] scale-150">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-20 whitespace-nowrap animate-float" style={{ animationDelay: `${i * 1.5}s`, animationDuration: '20s' }}>
                            {[...Array(10)].map((_, j) => (
                                <span key={j} className="text-8xl font-black text-white uppercase tracking-tighter">
                                    Engineering Platform DSA Tracker Engineering Platform DSA Tracker
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
             </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter"
                    >
                        Built With <span className="text-gold">Modern Tech</span>
                    </motion.h2>
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '80px' }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="h-1 bg-gold mx-auto rounded-full"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6 max-w-4xl mx-auto">
                    {techStack.map((tech, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05, type: 'spring' }}
                            whileHover={{ y: -6, scale: 1.05 }}
                            className="px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3 hover:border-gold/30 hover:bg-gold/[0.05] transition-all group cursor-default shadow-lg backdrop-blur-sm"
                        >
                            <span className="text-2xl group-hover:animate-bounce transition-all">{tech.icon}</span>
                            <span className="text-white font-bold opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-[10px] sm:text-xs">
                                {tech.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TechStack;
