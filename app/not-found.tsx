'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';


export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Stars canvas ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const STARS = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.1 + 0.2,
      base: Math.random() * 0.4 + 0.05,
      speed: Math.random() * 0.0004 + 0.0001,
      phase: Math.random() * Math.PI * 2,
    }));

    const SPARKLES = Array.from({ length: 28 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.8 + 0.6,
      max: Math.random() * 0.28 + 0.04,
      speed: Math.random() * 0.007 + 0.002,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.5 ? [251, 146, 60] : [96, 165, 250] as [number, number, number],
    }));

    let f = 0;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      f++;

      STARS.forEach(s => {
        const a = s.base * (0.5 + (Math.sin(f * s.speed * 60 + s.phase) * 0.5 + 0.5) * 0.5);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${a.toFixed(3)})`;
        ctx.fill();
      });

      SPARKLES.forEach(s => {
        const p = (Math.sin(f * s.speed * 60 + s.phase) + 1) / 2;
        const a = (s.max * p).toFixed(3);
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r * (0.7 + p * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color[0]},${s.color[1]},${s.color[2]},${a})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: '#070c16', color: '#e2e8f0', zIndex: 40 }}>

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-260px] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(0,102,204,0.13)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-80px] left-[35%] w-[460px] h-[460px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.07)_0%,transparent_70%)]" />
      </div>

      {/* Stars canvas */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" />

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">

        {/* 404 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
          className="font-black leading-none tracking-[-0.05em] mb-5"
          style={{
            fontSize: 'clamp(8rem,25vw,16rem)',
            background: 'linear-gradient(135deg, #1e40af 0%, #0066CC 35%, #7c3aed 65%, #db2777 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </motion.div>

        {/* Spinning compass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 0.61, 0.36, 1] }}
          className="mb-6"
        >
          <div className="relative w-16 h-16 rounded-full border border-blue-500/30 bg-blue-600/[0.06] backdrop-blur-sm flex items-center justify-center">
            {/* Dashed outer ring */}
            <div className="absolute inset-[-10px] rounded-full border border-dashed border-blue-500/10 animate-spin" style={{ animationDuration: '18s' }} />
            {/* Spinning compass SVG */}
            <svg
              className="w-7 h-7 text-blue-400 animate-spin"
              style={{ animationDuration: '8s' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" opacity="0.55" />
            </svg>
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 0.61, 0.36, 1] }}
          className="text-[0.65rem] font-bold tracking-[0.25em] uppercase text-blue-400 mb-3"
        >
          Lost on the Map
        </motion.p>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
          className="text-[clamp(1.5rem,4vw,2.5rem)] font-extrabold tracking-tight mb-3 max-w-[540px]" style={{ color: '#f1f5f9' }}
        >
          This trail leads{' '}
          <em
            className="not-italic font-extrabold"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              background: 'linear-gradient(to right, #f97316, #e11d48)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            nowhere.
          </em>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
          className="text-[0.9375rem] max-w-[480px] leading-relaxed mb-8" style={{ color: '#64748b' }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[0.875rem] bg-[#0066CC] text-white font-bold text-sm shadow-[0_8px_28px_rgba(0,102,204,0.28)] hover:bg-[#0077ee] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,102,204,0.38)] transition-all duration-200"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Home
          </Link>
        </motion.div>

      </main>
    </div>
  );
}
