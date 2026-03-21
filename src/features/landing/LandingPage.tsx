import React, { useEffect, useState } from 'react';
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
    const navigate = useNavigate();

    useEffect(() => {
        // smooth scroll polyfill if needed
        window.scrollTo(0, 0);
    }, []);

    const handleGetStarted = () => {
        setIsLoading(true);
    };

    const handleLoadingComplete = () => {
        navigate('/dashboard', { state: { fromGetStarted: true } });
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <IntroScreen key="loader" onDone={handleLoadingComplete} duration={2600} />
            )}
            
            {!isLoading && (
                <motion.div
                    key="content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="bg-[#080808] min-h-screen selection:bg-gold selection:text-black scroll-smooth relative"
                >
                {/* Silver Particle Background - covers landing */}
                <ParticleBackground 
                    particleCount={140} 
                    particleColor="210, 210, 210" 
                    lineColor="rgba(210, 210, 210, 0.25)"
                    particleSpeed={0.4}
                    className="z-[5] opacity-80"
                />

                <Navbar />
                
                <main>
                    <HeroSection onGetStarted={handleGetStarted} />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <FeaturesSection />
                    </motion.div>

                    <div className="relative">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
                        <HowItWorks />
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
                    </div>

                    <TechStack />
                </main>

                <Footer />

                
                {/* Global styles for smooth scrolling and scrollbar customization */}
                <style>{`
                    html {
                        scroll-behavior: smooth;
                    }
                    ::selection {
                        background: #D4AF37;
                        color: #000;
                    }
                    body::-webkit-scrollbar {
                        width: 8px;
                    }
                    body::-webkit-scrollbar-track {
                        background: #080808;
                    }
                    body::-webkit-scrollbar-thumb {
                        background: rgba(212, 175, 55, 0.4);
                        border-radius: 4px;
                    }
                    body::-webkit-scrollbar-thumb:hover {
                        background: #D4AF37;
                    }
                `}</style>
            </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LandingPage;
