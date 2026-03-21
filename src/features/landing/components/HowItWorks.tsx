import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, BookOpen, BrainCircuit, Trophy } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus className="text-gold" size={32} />,
    title: 'Initialize Account',
    description: 'Quickly set up your profile and choose your focus areas like Arrays, Graphs, or DP.'
  },
  {
    icon: <BookOpen className="text-gold" size={32} />,
    title: 'Start Solving',
    description: 'Solve curated problems and track every session with our automated logging system.'
  },
  {
    icon: <BrainCircuit className="text-gold" size={32} />,
    title: 'AI Consultation',
    description: 'Stuck? Ask the AI assistant for hints or a conceptual breakdown of the problem.'
  },
  {
    icon: <Trophy className="text-gold" size={32} />,
    title: 'Track Success',
    description: 'Watch your progress stats grow and perfect your skills with mock interviews.'
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter"
          >
            The <span className="text-gold">Workflow</span>
          </motion.h2>
          <div className="w-24 h-1 bg-gold mx-auto rounded-full" />
        </div>

        <div className="relative group">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-white/[0.05]" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="text-center flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full bg-[#080808] border border-white/10 flex items-center justify-center mb-8 shadow-xl hover:border-gold/30 hover:shadow-gold/10 transition-all duration-300 relative">
                  <span className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gold flex items-center justify-center text-black font-black text-sm z-20">
                    {idx + 1}
                  </span>
                  {step.icon}
                </div>
                <h3 className="text-white font-bold text-xl mb-4 uppercase tracking-wide px-4">
                    {step.title}
                </h3>
                <p className="text-white/30 text-sm leading-relaxed max-w-xs">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
