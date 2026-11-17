import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const COLORS = ['#ff3d81', '#00d4ff', '#ffd60a', '#7cff4d', '#b44dff', '#ff7a00', '#ffffff'];

// Canvas de confeti. Se controla con ref.current.burst(x, y, n) y ref.current.rain(ms)
const Confetti = forwardRef((_, ref) => {
  const canvasRef = useRef(null);
  const parts = useRef([]);
  const raf = useRef(0);
  const rainUntil = useRef(0);

  const loop = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const now = performance.now();
    if (now < rainUntil.current && Math.random() < 0.7) {
      for (let i = 0; i < 3; i++) {
        parts.current.push(make(Math.random() * cv.width, -10, 0, 2 + Math.random() * 3, 0.5));
      }
    }
    ctx.clearRect(0, 0, cv.width, cv.height);
    parts.current = parts.current.filter((p) => p.life > 0 && p.y < cv.height + 30);
    for (const p of parts.current) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99;
      p.rot += p.vr; p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.color;
      if (p.shape === 0) ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      else { ctx.beginPath(); ctx.arc(0, 0, p.s / 2.5, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    if (parts.current.length > 0 || now < rainUntil.current) raf.current = requestAnimationFrame(loop);
    else raf.current = 0;
  };

  const make = (x, y, vx, vy, g) => ({
    x, y, vx, vy, g,
    s: 8 + Math.random() * 8,
    rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: Math.random() < 0.6 ? 0 : 1,
    life: 90 + Math.random() * 60,
  });

  const start = () => { if (!raf.current) raf.current = requestAnimationFrame(loop); };

  useImperativeHandle(ref, () => ({
    burst(x, y, n = 70) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 4 + Math.random() * 9;
        parts.current.push(make(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 4, 0.25));
      }
      start();
    },
    rain(ms = 6000) { rainUntil.current = performance.now() + ms; start(); },
  }));

  useEffect(() => {
    const resize = () => {
      const cv = canvasRef.current;
      if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf.current); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
});

export default Confetti;
