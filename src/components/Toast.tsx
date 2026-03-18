import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
};

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
    success: { border: 'rgba(34,197,94,0.4)', icon: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    error: { border: 'rgba(239,68,68,0.4)', icon: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    info: { border: 'rgba(212,175,55,0.4)', icon: '#D4AF37', bg: 'rgba(212,175,55,0.08)' },
    warning: { border: 'rgba(245,158,11,0.4)', icon: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
};

const ToastItem: React.FC<{ item: ToastItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
    const [visible, setVisible] = useState(false);
    const c = COLORS[item.type];

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => setVisible(true));
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onRemove(item.id), 300);
        }, item.duration ?? 3500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px',
                background: '#111',
                border: `1px solid ${c.border}`,
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                minWidth: '280px', maxWidth: '380px',
                transform: visible ? 'translateX(0)' : 'translateX(120%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
                cursor: 'pointer',
            }}
            onClick={() => { setVisible(false); setTimeout(() => onRemove(item.id), 300); }}
        >
            <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: c.bg, border: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', color: c.icon, fontWeight: 700, flexShrink: 0,
            }}>
                {ICONS[item.type]}
            </div>
            <span style={{ fontSize: '0.875rem', color: '#EAEAEA', lineHeight: 1.4, flex: 1 }}>{item.message}</span>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
        const id = Date.now().toString();
        setToasts(t => [...t, { id, message, type, duration }]);
    }, []);

    const remove = useCallback((id: string) => {
        setToasts(t => t.filter(x => x.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div style={{
                position: 'fixed', bottom: '24px', right: '24px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                zIndex: 9999, pointerEvents: 'none',
            }}>
                {toasts.map(t => (
                    <div key={t.id} style={{ pointerEvents: 'all' }}>
                        <ToastItem item={t} onRemove={remove} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
