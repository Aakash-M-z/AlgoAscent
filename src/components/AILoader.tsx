import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "Analyzing your progress...",
  "Preparing your dashboard...",
  "Loading AI insights...",
  "Optimizing your learning paths...",
  "Syncing with PrepTrack AI..."
];

interface AILoaderProps {
  onComplete: () => void;
}

const AILoader: React.FC<AILoaderProps> = ({ onComplete }) => {
  const [msgIdx, setMsgIdx] = useState(0);

    useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % messages.length);
    }, 150);

    const timer = setTimeout(() => {
      onComplete();
    }, 1000);

    return () => {
      clearInterval(msgInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center"
    >
      <div className="relative w-48 h-48 mb-12">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-0 border-4 border-gold/20 rounded-full"
        />
        <motion.div
          animate={{ 
            rotate: -360,
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 border-t-4 border-gold rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🤖</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-gold font-bold uppercase tracking-[0.3em] text-sm text-center px-6"
        >
          {messages[msgIdx]}
        </motion.p>
      </AnimatePresence>

      <div className="mt-12 w-64 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="h-full bg-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
        />
      </div>
    </motion.div>
  );
};

export default AILoader;
