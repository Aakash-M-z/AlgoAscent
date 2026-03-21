import { Github, Twitter, Linkedin, Briefcase, Code, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="pt-24 pb-12 bg-black border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-xl">
                                <Shield size={20} className="text-gold" />
                            </div>
                            <span className="text-2xl font-black text-white hover:text-gold transition-colors tracking-tighter uppercase">
                                PrepTrack <span className="text-gold">AI</span>
                            </span>
                        </div>
                        <p className="text-white/40 max-w-sm leading-relaxed mb-10 text-lg">
                            An intelligent ecosystem built to help you bridge the gap between learning and getting hired.
                        </p>
                        <div className="flex items-center gap-6">
                            <a href="https://github.com/Aakash-M-z/Progress_tracker" className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-gold hover:border-gold/30 transition-all hover:scale-110">
                                <Github size={20} />
                            </a>
                            <a href="#" className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-gold hover:border-gold/30 transition-all hover:scale-110" style={{ animationDelay: '0.1s' }}>
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-gold hover:border-gold/30 transition-all hover:scale-110" style={{ animationDelay: '0.2s' }}>
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>

                    <div className="col-span-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Explore</h4>
                        <ul className="space-y-4">
                            <li><Link to="/dashboard" className="text-white/30 hover:text-gold transition-colors text-sm">Dashboard</Link></li>
                            <li><Link to="/dashboard/roadmap" className="text-white/30 hover:text-gold transition-colors text-sm">Roadmap</Link></li>
                            <li><Link to="/dashboard/interview" className="text-white/30 hover:text-gold transition-colors text-sm">Mock Interviews</Link></li>
                            <li><Link to="/dashboard/resources" className="text-white/30 hover:text-gold transition-colors text-sm">Resources</Link></li>
                        </ul>
                    </div>

                    <div className="col-span-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Developer</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-2 group cursor-pointer">
                                <Code size={14} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-white/30 hover:text-gold transition-colors text-sm">Aakash M</span>
                            </li>
                            <li className="flex items-center gap-2 group cursor-pointer">
                                <Briefcase size={14} className="text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="text-white/30 hover:text-gold transition-colors text-sm">SDE Portfolio</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col md:row items-center justify-between pt-12 border-t border-white/5 gap-6">
                    <p className="text-white/20 text-xs font-medium uppercase tracking-[0.2em]">
                        &copy; 2026 DSATracker AI Platform. Created with passion for learners.
                    </p>
                    <div className="flex items-center gap-8 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                        <a href="#" className="hover:text-gold/50 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-gold/50 transition-colors">Terms of Use</a>
                        <a href="#" className="hover:text-gold/50 transition-colors">API Docs</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
