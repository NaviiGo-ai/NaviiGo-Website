'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ArrivalHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !coverRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        gsap.set(coverRef.current, { scale: 1, opacity: 1 });
        return;
      }

      // ── Pinned Scroll Sequence ───────────────────────────────────────
      // The hero sunset image and the text STAY WHERE THEY ARE.
      // ONLY the white cutout cover zooms in.
      // As the user scrolls down:
      // The white cover expands outward, revealing more and more of the text
      // and full-bleed sunset photo, until the white cover completely leaves
      // the viewport and fades out, leaving 100% full immersion.
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.8,
        refreshPriority: 10,
        onUpdate: (self) => {
          const progress = self.progress;

          if (indicatorRef.current) {
            gsap.set(indicatorRef.current, { opacity: Math.max(0, 1 - progress * 10) });
          }

          if (coverRef.current) {
            // Zoom the white cover: from scale 1.0 up to 10.5
            const scale = 1 + Math.pow(progress, 1.2) * 9.5;
            // Fade out the white cover and ambient tricolor glows as aperture reaches screen bounds (completely gone by progress 0.68)
            const opacity = Math.max(0, 1 - Math.max(0, (progress - 0.38) * 3.33));

            gsap.set(coverRef.current, {
              scale: scale,
              opacity: opacity,
              transformOrigin: '50% 50%',
            });
          }
        },
      });
    }, containerRef);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[720px] overflow-hidden select-none bg-[#141210]"
    >
      {/* ─────────────────────────────────────────────────────────────
          LAYER 0: FULL-BLEED SUNSET HERO PHOTOGRAPHY
          Stays exactly where it is — not shrunken or fitted into map.
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/places/photo?name=Taj+Yamuna+Sunset&w=1920&redirect=true"
          alt="Golden Hour Sunset over Taj Mahal and Yamuna River, India"
          className="w-full h-full object-cover object-center brightness-[0.95] contrast-[1.06] saturate-[1.2]"
          onError={(e) => {
            // Fallback to Dal Lake sunset if needed
            (e.target as HTMLImageElement).src = '/api/places/photo?name=Dal+Lake+Sunset&city=Srinagar&w=1920&redirect=true';
          }}
        />
        {/* Subtle photographic warmth grade ensuring text contrast while keeping the sunset vivid */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/35 pointer-events-none" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: FULL HERO TYPOGRAPHY & CONTROLS
          Stays exactly where it is — covered by the white cutout at rest,
          then revealed as the white cover zooms in.
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-10 flex flex-col justify-between px-6 sm:px-12 py-8 sm:py-12 pointer-events-auto">
        {/* Top Telemetry & Folio */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 font-mono text-[10px] sm:text-xs tracking-[0.25em] uppercase text-white/90 drop-shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#EC6426] shadow-[0_0_8px_#EC6426]" />
            <span>28°36′N · 77°12′E</span>
            <span className="text-white/40">/</span>
            <span>AGRA · SUNSET EXPEDITION</span>
          </div>

          <div className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-white/70 drop-shadow-sm">
            JOURNEY 01 · IMMERSION
          </div>
        </div>

        {/* Center Monumental Headline */}
        <div className="w-full text-center px-4 my-auto">
          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[5.75rem] tracking-tightest uppercase leading-[0.92] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
            <span className="block">TRAVEL SHOULD FEEL</span>
            <span className="block mt-1 sm:mt-2">LIKE A JOURNEY.</span>
            <span className="block text-[#EC6426] mt-1 sm:mt-2 drop-shadow-[0_4px_20px_rgba(236,100,38,0.4)]">
              NOT A PROJECT.
            </span>
          </h1>
        </div>

        {/* Bottom Bar: Human Support Copy & Primary CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 w-full">
          {/* Lower-Left Narrative */}
          <div className="max-w-xs sm:max-w-sm space-y-1.5 drop-shadow-md">
            <p className="font-display font-bold text-base sm:text-lg text-white uppercase tracking-tight">
              From wanting to go <br />
              <span className="text-[#EC6426]">to being on your way.</span>
            </p>
            <p className="font-sans text-xs sm:text-sm text-white/80 font-light leading-relaxed">
              Intelligent routes, authentic distances, and genuine discovery across India.
            </p>
          </div>

          {/* Lower-Right Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/plan"
              className="inline-flex items-center gap-3 px-6 sm:px-7 py-3 rounded-lg bg-[#EC6426] text-white font-mono text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-[#1B1715] transition-all duration-300 shadow-xl hover:translate-y-[-1px]"
            >
              <span>EXPLORE JOURNEYS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/explore"
              className="font-mono text-xs uppercase tracking-widest text-white/80 hover:text-[#EC6426] transition-colors py-2 drop-shadow-sm"
            >
              Destinations →
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 2: THE WHITE CUTOUT COVER (ZOOMS IN ON SCROLL)
          Sits ON TOP of the text and hero image.
          Outside India: Solid pure white covers the text and photo.
          Inside India: Transparent hole peeks through at the sunset & text.
          On scroll: Scales up from 1.0 to 9.5+, revealing the full text
          and full hero image, until the white cover is completely gone.
          ───────────────────────────────────────────────────────────── */}
      <div
        ref={coverRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-20 will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/india-cover-full.png"
          alt=""
          className="w-full h-full object-cover min-w-full min-h-full"
          aria-hidden="true"
        />
      </div>

      {/* ── Minimal Scroll Indicator ── */}
      <div
        ref={indicatorRef}
        className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 text-white/60 font-mono text-[9px] uppercase tracking-[0.25em] z-30 pointer-events-none"
      >
        <span>SCROLL TO ZOOM IN</span>
        <div className="w-[1px] h-5 bg-white/40" />
      </div>
    </div>
  );
}
