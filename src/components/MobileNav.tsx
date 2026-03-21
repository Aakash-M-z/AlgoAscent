import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
}

interface Props {
    items: NavItem[];
}

const MOBILE_IDS = ['overview', 'tasks', 'analytics', 'roadmap', 'profile'];

const MobileNav: React.FC<Props> = ({ items }) => {
    const mobileItems = items.filter(i => MOBILE_IDS.includes(i.id));
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/95 border-t border-gold/15 backdrop-blur-xl flex z-[200] pb-[env(safe-area-inset-bottom)] md:hidden pointer-events-auto">
            {mobileItems.map(item => {
                const active = location.pathname === item.path;
                return (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-all active:scale-95"
                    >
                        {active && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gradient-to-r from-gold to-yellow-400 rounded-b" />
                        )}

                        <span className={`text-xl transition-all duration-200 ${active ? 'text-gold scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'text-white/30'}`}>
                            {item.icon}
                        </span>

                        <span className={`text-[10px] uppercase font-bold tracking-tighter transition-all duration-200 ${active ? 'text-gold' : 'text-white/20'}`}>
                            {item.label}
                        </span>
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default MobileNav;
