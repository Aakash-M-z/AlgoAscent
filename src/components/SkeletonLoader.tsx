import React from 'react';

const Bone: React.FC<{ w?: string; h?: string; radius?: string; style?: React.CSSProperties }> = ({
    w = '100%', h = '16px', radius = '6px', style,
}) => (
    <div style={{
        width: w, height: h, borderRadius: radius,
        background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
        backgroundSize: '400% 100%',
        animation: 'skeletonShimmer 1.6s ease-in-out infinite',
        ...style,
    }} />
);

export const SkeletonCard: React.FC = () => (
    <div className="card-dark p-5" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Bone w="40%" h="12px" />
        <Bone h="28px" />
        <Bone w="60%" h="12px" />
    </div>
);

export const SkeletonStatRow: React.FC = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[0, 1, 2, 3].map(i => (
            <div key={i} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Bone w="32px" h="32px" radius="8px" />
                <Bone w="50%" h="24px" />
                <Bone w="70%" h="10px" />
            </div>
        ))}
    </div>
);

export const SkeletonTaskList: React.FC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
                background: '#161616', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '14px',
            }}>
                <Bone w="20px" h="20px" radius="6px" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Bone w={`${60 + i * 10}%`} h="14px" />
                    <Bone w="30%" h="10px" />
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonChart: React.FC = () => (
    <div className="card-dark p-5">
        <Bone w="40%" h="12px" style={{ marginBottom: '20px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
            {[60, 40, 80, 30, 90, 50, 70].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <Bone h={`${h}%`} radius="4px 4px 0 0" />
                    <Bone w="24px" h="8px" />
                </div>
            ))}
        </div>
    </div>
);

export default Bone;
