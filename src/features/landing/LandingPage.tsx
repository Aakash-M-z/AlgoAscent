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
    const [contentVisible, setContentVisible] = useState(false);
    // Fade out the landing page content while intro plays — prevents flash
    const [contentFading, setContentFading] = useState(false);
    const navigate = useNavigate();
    const loadingRef = useRef(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const t = requestAnimationFrame(() => setContentVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleGetStarted = useCallback(() => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        // Fade out landing content immediately so it doesn't show through
        setContentFading(true);
        setIsLoading(true);
    }, []);

    const handleLoadingComplete = useCallback(() => {
        // Navigate — landing page is already invisible so no flash
        navigate('/dashboard', { state: { fromGetStarted: true } });
    }, [navigate]);

    return (
        <>
            {/* Intro screen — full screen overlay, z-index above everything */}
            <AnimatePresence>
                {isLoading && (
                    <IntroScreen key="loader" onDone={handleLoadingComplete} duration={2000} />
                )}
            </AnimatePresence>

            {/* Landing page content — fades out when intro starts */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: contentFading ? 0 : contentVisible ? 1 : 0 }}
                transition={{ duration: contentFading ? 0.3 : 0.6, ease: 'easeOut' }}
                className="bg-[#080808] min-h-screen selection:bg-gold selection:text-black scroll-smooth relative"
                style={{ pointerEvents: contentFading ? 'none' : 'all' }}
            >
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
