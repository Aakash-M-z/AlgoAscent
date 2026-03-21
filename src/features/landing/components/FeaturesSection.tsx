import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu, Database, Layout, ArrowRight, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: <Cpu className="text-gold" size={24} />,
    title: 'AI-Powered Assistance',
    description: 'Get real-time hints and optimized solutions for DSA problems using our integrated AI engineer.'
  },
  {
    icon: <Terminal className="text-gold" size={24} />,
    title: 'Mock Interview System',
    description: 'Realistic technical interviews with follow-up questions and performance evaluation.'
  },
  {
    icon: <Database className="text-gold" size={24} />,
    title: 'Progress Analytics',
    description: 'Visualize your growth with detailed heatmaps, streak trackers, and category-wise breakdowns.'
  },
  {
    icon: <Layout className="text-gold" size={24} />,
    title: 'Core CS Mastery',
    description: 'Specialized modules for Operating Systems, DBMS, Computer Networks, and OOPS to ace technical rounds.'
  },
  {
    icon: <Zap className="text-gold" size={24} />,
    title: 'Smart Roadmaps',
    description: 'Structured learning paths for Arrays, DP, Graphs, and beyond to keep you on the right track.'
  },
  {
    icon: <Shield className="text-gold" size={24} />,
    title: 'Admin Mastery',
    description: 'A powerful management panel to oversee users, activity logs, and system health.'
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-[#080808] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter"
          >
            Engineering <span className="text-gold">Success</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-white/40 max-w-2xl mx-auto text-lg"
          >
            A comprehensive suite of tools designed to transform you into a top-tier candidate for FAANG and beyond.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-gold/30 hover:bg-gold/[0.02] transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mb-6 border border-gold/10 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-white/40 leading-relaxed mb-6">
                {feature.description}
              </p>
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-gold text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
