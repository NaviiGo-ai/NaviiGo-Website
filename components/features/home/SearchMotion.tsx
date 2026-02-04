"use client";

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SearchMotion() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      gsap.set(root, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }

    const ctx = gsap.context(() => {
      // Perf-safe entrance: transform/opacity/filter only.
      gsap.fromTo(
        root,
        { y: 14, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power2.out', delay: 0.35 }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  const handleFocus = () => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    // Micro-interaction on focus: transform + subtle filter only.
    gsap.to(root, { scale: 1.01, filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.12))', duration: 0.25, ease: 'power2.out' });
  };

  const handleBlur = () => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    gsap.to(root, { scale: 1, filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))', duration: 0.25, ease: 'power2.out' });
  };

  return (
    <div
      ref={rootRef}
      className="glass-strong rounded-2xl p-4 sm:p-5"
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">From</span>
          <input
            className="h-11 rounded-xl bg-white/50 px-3 text-sm text-slate-900 outline-none ring-1 ring-black/10 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 dark:bg-slate-950/30 dark:text-slate-100 dark:ring-white/10 dark:placeholder:text-slate-500"
            placeholder="DEL"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">To</span>
          <input
            className="h-11 rounded-xl bg-white/50 px-3 text-sm text-slate-900 outline-none ring-1 ring-black/10 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 dark:bg-slate-950/30 dark:text-slate-100 dark:ring-white/10 dark:placeholder:text-slate-500"
            placeholder="BOM"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Depart</span>
          <input
            type="date"
            className="h-11 rounded-xl bg-white/50 px-3 text-sm text-slate-900 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-primary/50 dark:bg-slate-950/30 dark:text-slate-100 dark:ring-white/10"
          />
        </label>

        <div className="grid items-end">
          <motion.button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm ring-1 ring-black/5"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            aria-label="Search (placeholder)"
          >
            <Search className="h-4 w-4" />
            Search
          </motion.button>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        No search logic yet — this is a motion+layout scaffold.
      </p>
    </div>
  );
}
