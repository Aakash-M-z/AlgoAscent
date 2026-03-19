import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    radius: number;
    alpha: number;
}

interface Props {
    className?: string;
    particleCount?: number;
    particleColor?: string;   // base rgb e.g. "212,175,55"
    lineColor?: string;       // full rgba string
    particleSpeed?: number;
    lineDistance?: number;
}

/**
 * Optimised canvas particle network.
 * - DPR-aware (crisp on retina / mobile)
 * - Reduced count on mobile automatically
 * - Touch + mouse repulsion
 * - No per-particle shadowBlur (major perf win)
 * - Single glow pass via radial gradient drawn once per frame
 *
 * particleColor accepts either:
 *   "212,175,55"           — raw RGB channels (preferred)
 *   "rgba(212,175,55,0.5)" — full rgba string (legacy, normalised internally)
 */
const ParticleBackground: React.FC<Props> = ({
    className = '',
    particleCount = 70,
    particleColor = '212,175,55',
    lineColor = 'rgba(212,175,55,0.07)',
    particleSpeed = 0.28,
    lineDistance = 130,
}) => {
    // Normalise: if caller passed a full rgba/rgb string, extract the R,G,B channels
    const rgbChannels = (() => {
        const trimmed = particleColor.trim();
        // Already raw channels e.g. "212,175,55"
        if (/^\d/.test(trimmed)) return trimmed;
        // rgba(r,g,b,a) or rgb(r,g,b)
        const m = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (m) return `${m[1]},${m[2]},${m[3]}`;
        return '212,175,55'; // safe fallback
    })();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const pointerRef = useRef({ x: -9999, y: -9999 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Particle[] = [];
        let W = 0, H = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const isMobile = () => window.innerWidth < 768;
        const count = () => isMobile() ? Math.floor(particleCount * 0.45) : particleCount;

        const resize = () => {
            W = canvas.offsetWidth;
            H = canvas.offsetHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.scale(dpr, dpr);
            init();
        };

        const init = () => {
            particles = Array.from({ length: count() }, () => ({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * particleSpeed,
                vy: (Math.random() - 0.5) * particleSpeed,
                radius: Math.random() * 1.4 + 0.6,
                alpha: Math.random() * 0.5 + 0.4,
            }));
        };

        const lineDist2 = lineDistance * lineDistance;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            const px = pointerRef.current.x;
            const py = pointerRef.current.y;

            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > W) p.vx *= -1;
                if (p.y < 0 || p.y > H) p.vy *= -1;

                const dx = p.x - px;
                const dy = p.y - py;
                const d2 = dx * dx + dy * dy;
                if (d2 < 8000 && d2 > 0) {
                    const d = Math.sqrt(d2);
                    const force = (90 - d) / 90;
                    if (force > 0) {
                        p.x += (dx / d) * force * 2.5;
                        p.y += (dy / d) * force * 2.5;
                    }
                }
            }

            // Draw lines
            ctx.save();
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < lineDist2) {
                        ctx.globalAlpha = (1 - d2 / lineDist2) * 0.55;
                        ctx.strokeStyle = lineColor;
                        ctx.lineWidth = 0.7;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();

            // Draw particles
            ctx.save();
            for (const p of particles) {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = `rgba(${rgbChannels},1)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // Ambient glow pass
            ctx.save();
            ctx.globalAlpha = 0.018;
            for (const p of particles) {
                const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 14);
                g.addColorStop(0, `rgba(${rgbChannels},1)`);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 14, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            rafRef.current = requestAnimationFrame(draw);
        };

        // ── Pointer tracking (mouse + touch) ─────────────────────
        const onMouseMove = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect();
            pointerRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
        };
        const onTouchMove = (e: TouchEvent) => {
            const r = canvas.getBoundingClientRect();
            const t = e.touches[0];
            pointerRef.current = { x: t.clientX - r.left, y: t.clientY - r.top };
        };
        const onPointerLeave = () => { pointerRef.current = { x: -9999, y: -9999 }; };

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('mouseleave', onPointerLeave);
        draw();

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('mouseleave', onPointerLeave);
        };
    }, [particleCount, rgbChannels, lineColor, particleSpeed, lineDistance]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full ${className}`}
            style={{ pointerEvents: 'none', display: 'block' }}
        />
    );
};

export default ParticleBackground;
