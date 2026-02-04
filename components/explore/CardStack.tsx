"use client";

import Image from 'next/image';
import { animate, motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';

import { useEffect, useMemo, useRef, useState } from 'react';

export type HeroCard = {
  title: string;
  tag: string;
  image: string;
  accent?: 'amber' | 'blue' | 'emerald';
};

type Props = {
  cards: HeroCard[];
};

const accentMap: Record<NonNullable<HeroCard['accent']>, string> = {
  amber: 'from-amber-400/25',
  blue: 'from-sky-400/25',
  emerald: 'from-emerald-400/25',
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type StackCardProps = {
  card: HeroCard;
  index: number;
  progress: ReturnType<typeof useMotionValue<number>>;
  spacing: number;
  outerClassName: string;
  measureRef?: (el: HTMLElement | null) => void;
};

function StackCard({ card, index, progress, spacing, outerClassName, measureRef }: StackCardProps) {
  const d = useTransform(progress, (p) => index - p);
  const x = useTransform(d, (dist) => dist * spacing);

  const scale = useTransform(d, (dist) => {
    const ad = Math.abs(dist);
    const focus = clamp(1 - ad, 0, 1);
    return 0.92 + focus * 0.12;
  });

  const y = useTransform(d, (dist) => {
    const ad = Math.abs(dist);
    return clamp(ad, 0, 3) * 10;
  });

  const zIndex = useTransform(d, (dist) => Math.round(1000 - Math.abs(dist) * 200));

  const shadow = useTransform(d, (dist) => {
    const ad = Math.abs(dist);
    const focus = clamp(1 - ad, 0, 1);
    const a = 0.18 + focus * 0.22;
    const y = 18 + focus * 18;
    const blur = 55 + focus * 55;
    return `0 ${y}px ${blur}px rgba(0,0,0,${a.toFixed(3)})`;
  });

  const blur = useTransform(d, (dist) => {
    const ad = Math.abs(dist);
    return `${(clamp(ad, 0, 2.8) * 0.8).toFixed(2)}px`;
  });

  const opacity = useTransform(d, (dist) => {
    const ad = Math.abs(dist);
    return 0.85 + clamp(1 - ad * 0.22, 0, 1) * 0.15;
  });

  return (
    <motion.article
      ref={measureRef as any}
      className={outerClassName}
      style={{
        x,
        y,
        scale,
        zIndex,
        boxShadow: shadow,
        opacity,
        filter: useTransform(blur, (b) => `blur(${b})`),
      }}
      data-hero-card
      aria-hidden={false}
    >
      <div className="absolute inset-0" aria-hidden="true">
        <Image
          src={card.image}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 90vw, 420px"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/25 to-slate-950/80" />
        <div className={`absolute inset-0 bg-gradient-to-br ${accentMap[card.accent ?? 'blue']} to-transparent`} />
      </div>

      <div className="relative flex h-full flex-col justify-between p-5 text-white">
        <div className="space-y-2 text-sm font-semibold">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/85">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="max-w-[18ch] leading-snug">{card.title}</span>
          </div>
          <span className="inline-flex w-fit rounded-full bg-white/12 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-white/90 backdrop-blur">
            {card.tag}
          </span>
        </div>

        <div className="flex items-center justify-end" aria-hidden="true">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/12 text-white/90 backdrop-blur">
            🔖
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export default function CardStack({ cards }: Props) {
  const reduceMotion = useReducedMotion() || prefersReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const measureElRef = useRef<HTMLElement | null>(null);
  const activeAnimRef = useRef<ReturnType<typeof animate> | null>(null);

  const [metrics, setMetrics] = useState({ spacing: 220, cardW: 380, cardH: 320 });

  const x = useMotionValue(0);
  const xSmoothed = useSpring(x, { stiffness: 340, damping: 42, mass: 0.95 });
  const progress = useTransform(xSmoothed, (v) => -v / metrics.spacing);

  const bounds = useMemo(() => {
    const maxIndex = Math.max(0, cards.length - 1);
    const left = -maxIndex * metrics.spacing;
    return { left, right: 0 };
  }, [cards.length, metrics.spacing]);

  useEffect(() => {
    // Keep control value within new bounds.
    const current = x.get();
    x.set(clamp(current, bounds.left, bounds.right));
  }, [bounds.left, bounds.right, x]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const measured = measureElRef.current?.getBoundingClientRect();
      if (!measured) return;

      const cardW = Math.max(280, Math.min(460, measured.width));
      const cardH = Math.max(280, Math.min(420, measured.height));
      const spacing = Math.max(170, Math.min(320, cardW * 0.62));
      setMetrics({ spacing, cardW, cardH });
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    if (measureElRef.current) ro.observe(measureElRef.current);

    return () => ro.disconnect();
  }, [cards.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || reduceMotion) return;

    const stopAnim = () => {
      activeAnimRef.current?.stop();
      activeAnimRef.current = null;
    };

    let isDown = false;
    let startX = 0;
    let startValue = 0;
    let lastClientX = 0;
    let lastT = 0;
    let velocity = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isDown = true;
      startX = e.clientX;
      startValue = x.get();
      lastClientX = e.clientX;
      lastT = performance.now();
      velocity = 0;
      stopAnim();
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      const next = clamp(startValue + (e.clientX - startX), bounds.left, bounds.right);
      x.set(next);

      const now = performance.now();
      const dt = Math.max(10, now - lastT);
      const dx = e.clientX - lastClientX;
      velocity = (dx / dt) * 1000;
      lastClientX = e.clientX;
      lastT = now;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // no-op
      }

      stopAnim();
      activeAnimRef.current = animate(x, x.get(), {
        type: 'inertia',
        velocity,
        min: bounds.left,
        max: bounds.right,
        power: 0.8,
        timeConstant: 260,
        bounceStiffness: 420,
        bounceDamping: 40,
      });
    };

    const onWheel = (e: WheelEvent) => {
      // Keep page scroll intact unless the pointer is over the stack.
      if (!el.contains(e.target as Node)) return;
      stopAnim();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const next = clamp(x.get() - delta * 0.9, bounds.left, bounds.right);
      activeAnimRef.current = animate(x, next, {
        type: 'spring',
        stiffness: 320,
        damping: 40,
        mass: 0.9,
      });
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      stopAnim();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel as any);
    };
  }, [bounds.left, bounds.right, reduceMotion, x]);

  const outerClassName =
    'absolute left-1/2 top-0 isolate h-[360px] w-[min(88vw,440px)] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/14 bg-gradient-to-b from-white/6 to-white/0 backdrop-blur-md';

  return (
    <div
      ref={containerRef}
      className="glass-strong relative w-full max-w-[760px] select-none overflow-hidden rounded-[28px] border border-white/12 bg-white/5 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
      data-hero-cards
      aria-label="Drag or scroll to explore cards"
    >
      <div
        className="relative mx-auto h-[380px] w-full"
        data-hero-cards-inner
        style={{ height: metrics.cardH + 20 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.06),transparent_55%)]" aria-hidden="true" />

        {cards.map((card, idx) => (
          <StackCard
            key={`${card.title}-${idx}`}
            card={card}
            index={idx}
            progress={progress as any}
            spacing={metrics.spacing}
            outerClassName={outerClassName}
            measureRef={idx === 0 ? (el) => (measureElRef.current = el) : undefined}
          />
        ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-between px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
          <span>Drag</span>
          <span className="text-white/45">Scroll</span>
        </div>
      </div>
    </div>
  );
}
