import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight, Github, Terminal } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Tech Stack', href: '#tech-stack' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-4 bg-black/80 backdrop-blur-xl border-b border-white/5' : 'py-6 bg-black/60 backdrop-blur-md border-b border-white/5'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        <Terminal size={20} className="text-gold" />
                    </div>
                    <span className="text-2xl font-black text-white group-hover:text-gold transition-colors tracking-tighter uppercase">
                        PrepTrack <span className="text-gold">AI</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-12">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-white/40 hover:text-white font-bold text-xs uppercase tracking-[0.2em] transition-colors"
                        >
                            {link.name}
                        </a>
                    ))}
                </div>

                <div className="hidden lg:flex items-center gap-6">
                    <a href="https://github.com/Aakash-M-z/Progress_tracker" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-gold/30 hover:bg-gold/5 transition-all">
                        <Github size={18} className="text-white/40 group-hover:text-gold" />
                    </a>
                    <Link
                        to={isAuthenticated ? "/dashboard" : "/dashboard"}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gold text-black font-black text-xs uppercase tracking-widest hover:bg-white transition-colors"
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Open Platform'}
                        <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden text-white p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden bg-[#0c0c0c] border-b border-white/5 overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-white/40 hover:text-gold font-bold text-sm uppercase tracking-widest transition-colors"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <Link
                                to="/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gold text-black font-black text-xs uppercase tracking-widest"
                            >
                                Get Started <ArrowRight size={14} />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
