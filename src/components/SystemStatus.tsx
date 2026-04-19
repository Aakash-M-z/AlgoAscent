/**
 * SystemStatus.tsx
 * Shows backend connectivity status with colour-coded indicator.
 * Used in AdminPanel and optionally in the header.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../api/config';

type Status = 'checking' | 'online' | 'degraded' | 'offline';

interface StatusInfo {
    status: Status;
    dbStatus: string;
    latencyMs?: number;
    lastChecked: Date;
}

const STATUS_CONFIG: Record<Status, { color: string; bg: string; border: string; dot: string; label: string }> = {
    checking: { color: '#888', bg: 'rgba(136,136,136,0.08)', border: 'rgba(136,136,136,0.2)', dot: 'bg-gray-500', label: 'Checking...' },
    online: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', dot: 'bg-green-500', label: 'All Systems Operational' },
    degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', dot: 'bg-yellow-500', label: 'Degraded — Using Fallback Data' },
    offline: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', dot: 'bg-red-500', label: 'Backend Unreachable' },
};

async function checkHealth(): Promise<StatusInfo> {
    const start = Date.now();
    try {
        const res = await fetch(`${API_BASE}/api/health/details`, {
            signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - start;

        if (!res.ok) {
            return { status: 'offline', dbStatus: 'HTTP error', latencyMs, lastChecked: new Date() };
        }

        const data = await res.json();
        const isDegraded = data.isFallback || data.dbStatus?.includes('Disconnected') || data.dbStatus?.includes('Fallback');

        return {
            status: isDegraded ? 'degraded' : 'online',
            dbStatus: data.dbStatus ?? 'Unknown',
            latencyMs,
            lastChecked: new Date(),
        };
    } catch {
        return {
            status: 'offline',
            dbStatus: 'Unreachable',
            latencyMs: Date.now() - start,
            lastChecked: new Date(),
        };
    }
}

interface Props {
    /** If true, only shows when not online (saves space when all good) */
    hideWhenOnline?: boolean;
    /** Auto-refresh interval in ms. Default 60s. Set 0 to disable. */
    refreshInterval?: number;
}

const SystemStatus: React.FC<Props> = ({ hideWhenOnline = false, refreshInterval = 60_000 }) => {
    const [info, setInfo] = useState<StatusInfo>({
        status: 'checking',
        dbStatus: '',
        lastChecked: new Date(),
    });

    const refresh = useCallback(async () => {
        const result = await checkHealth();
        setInfo(result);
    }, []);

    useEffect(() => {
        refresh();
        if (refreshInterval > 0) {
            const id = setInterval(refresh, refreshInterval);
            return () => clearInterval(id);
        }
    }, [refresh, refreshInterval]);

    if (hideWhenOnline && info.status === 'online') return null;

    const cfg = STATUS_CONFIG[info.status];

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 14px', borderRadius: '10px',
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            fontSize: '0.78rem',
        }}>
            {/* Dot */}
            <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: cfg.color, flexShrink: 0,
                boxShadow: info.status === 'online' ? `0 0 6px ${cfg.color}` : 'none',
                animation: info.status === 'online' ? 'pulse 2s infinite' : 'none',
            }} />

            {/* Label */}
            <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>

            {/* Latency */}
            {info.latencyMs !== undefined && info.status !== 'checking' && (
                <span style={{ color: '#555', marginLeft: '4px' }}>
                    {info.latencyMs}ms
                </span>
            )}

            {/* Manual refresh */}
            <button
                onClick={refresh}
                title="Refresh status"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#444', fontSize: '0.75rem', padding: '0 2px',
                    marginLeft: 'auto', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = cfg.color}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#444'}
            >
                ↻
            </button>
        </div>
    );
};

export default SystemStatus;
