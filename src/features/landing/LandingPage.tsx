import React, { useEffect, useState, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorks from './components/HowItWorks';
import TechStack from './components/TechStack';
import Footer from './components/Footer';
import IntroScreen from '../../components/IntroScreen';
import ParticleBackground from '../../components/ParticleBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    // Track whether content has mounted to trigger smooth fade-in
    const [contentVisible, setContentVisible] = useState(false);
    const navigate = useNavigate();
    // Prevent double-fire of handleGetStarted
    const loadingRef = useRef(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        // Slight delay before showing content for smooth entry
        const t = requestAnimationFrame(() => setContentVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleGetStarted = useCallback(() => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setIsLoading(true);
    }, []);

    const handleLoadingComplete = useCallback(() => {
        navigate('/dashboard', { state: { fromGetStarted: true } });
    }, [navigate]);

    return (
        <>
            {/* Intro screen renders on top — completely separate from page content */}
            <AnimatePresence>
                {isLoading && (
                    <IntroScreen key="loader" onDone={handleLoadingComplete} duration={2000} />
                )}
            </AnimatePresence>

            {/* Page content — always mounted, fades in on load */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: contentVisible ? 1 : 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="bg-[#080808] min-h-screen selection:bg-gold selection:text-black scroll-smooth relative"
            >
                {/* Reduced particle count for performance — 80 instead of 140 */}
                <ParticleBackground
                    particleCount={80}
                    particleColor="210, 210, 210"
                    lineColor="rgba(210, 210, 210, 0.18)"
                    particleSpeed={0.3}
                    className="z-[5] opacity-60"
                />

                <Navbar />

                <main>
                    <HeroSection onGetStarted={handleGetStarted} />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <FeaturesSection />
                    </motion.div>

                    <div className="relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <HowItWorks />
                        </motion.div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <TechStack />
                    </motion.div>
                </main>

                <Footer />

                <style>{`
                    html { scroll-behavior: smooth; }
                    ::selection { background: #D4AF37; color: #000; }
                    body::-webkit-scrollbar { width: 8px; }
                    body::-webkit-scrollbar-track { background: #080808; }
                    body::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.4); border-radius: 4px; }
                    body::-webkit-scrollbar-thumb:hover { background: #D4AF37; }
                `}</style>
            </motion.div>
        </>
    );
};

export default LandingPage;
