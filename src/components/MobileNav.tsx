import React from 'react';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
}

interface Props {
    items: NavItem[];
}

import { NavLink, useLocation } from 'react-router-dom';

const MOBILE_IDS = ['overview', 'tasks', 'analytics', 'roadmap', 'profile'];

const MobileNav: React.FC<Props> = ({ items }) => {
    const mobileItems = items.filter(i => MOBILE_IDS.includes(i.id));
    const location = useLocation();

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            paddingBottom: 'env(safe-area-inset-bottom)',
            background: 'rgba(13,13,13,0.98)',
            borderTop: '1px solid rgba(212,175,55,0.15)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex',
            zIndex: 200,
        }}>
            {mobileItems.map(item => {
                const active = location.pathname === item.path;
                return (
                    <NavLink
                        key={item.id}
                        to={item.path}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '8px 4px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            position: 'relative',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {active && (
                            <span style={{
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '28px',
                                height: '2px',
                                background: 'linear-gradient(90deg, #D4AF37, #FFD700)',
                                borderRadius: '0 0 3px 3px',
                            }} />
                        )}

                        <span style={{
                            fontSize: '1.15rem',
                            lineHeight: 1,
                            color: active ? '#D4AF37' : '#3a3a3a',
                            filter: active ? 'drop-shadow(0 0 5px rgba(212,175,55,0.5))' : 'none',
                            transform: active ? 'scale(1.12)' : 'scale(1)',
                            transition: 'all 0.18s ease',
                        }}>
                            {item.icon}
                        </span>

                        <span style={{
                            fontSize: '0.58rem',
                            letterSpacing: '0.03em',
                            fontWeight: active ? 600 : 400,
                            color: active ? '#D4AF37' : '#3a3a3a',
                            transition: 'color 0.18s ease',
                        }}>
                            {item.label}
                        </span>
                    </NavLink>
                );
            })}
        </nav>
    );
};

export default MobileNav;
