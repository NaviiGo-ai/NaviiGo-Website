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
  const headlineRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !coverRef.current || !headlineRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const isMobile = window.innerWidth < 768;
      // At rest (scroll 0), the headline starts small inside the torso of India:
      // ~0.34 on desktop, ~0.30 on mobile.
      const initialScale = isMobile ? 0.28 : 0.34;
      const origin = isMobile ? '50% 39%' : '47% 46%';

      // Color updater for outer UI controls adapting from soft paper to dark sunset photo
      const updateColors = (reveal: number) => {
        if (!containerRef.current) return;
        // Interpolate from warm charcoal rgb(44, 38, 35) to white rgb(255, 255, 255)
        const r = Math.round(44 + (255 - 44) * reveal);
        const g = Math.round(38 + (255 - 38) * reveal);
        const b = Math.round(35 + (255 - 35) * reveal);
        const priAlpha = 0.95 + 0.05 * reveal;
        const secAlpha = 0.75 + 0.15 * reveal;
        const dimAlpha = 0.45 + 0.05 * reveal;

        containerRef.current.style.setProperty('--hero-text-primary', `rgba(${r}, ${g}, ${b}, ${priAlpha})`);
        containerRef.current.style.setProperty('--hero-text-secondary', `rgba(${r}, ${g}, ${b}, ${secAlpha})`);
        containerRef.current.style.setProperty('--hero-text-dim', `rgba(${r}, ${g}, ${b}, ${dimAlpha})`);
        containerRef.current.style.setProperty(
          '--hero-text-shadow',
          reveal > 0.25 ? `0 2px 14px rgba(0,0,0,${(reveal * 0.75).toFixed(2)})` : 'none'
        );
      };

      // Set initial states
      gsap.set(coverRef.current, { scale: 1, opacity: 1, transformOrigin: origin });
      gsap.set(headlineRef.current, { scale: initialScale, transformOrigin: origin });
      updateColors(0);

      if (prefersReducedMotion) {
        gsap.set(coverRef.current, { opacity: 0 });
        gsap.set(headlineRef.current, { scale: 1 });
        updateColors(1);
        return;
      }

      // ── Pinned Scroll Sequence ───────────────────────────────────────
      // Responsive pin distance: Snappy on mobile (+85%), immersive on desktop (+130%)
      const pinDistance = isMobile ? '+=85%' : '+=130%';

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: pinDistance,
        pin: true,
        scrub: 0.8,
        refreshPriority: 10,
        onUpdate: (self) => {
          const progress = self.progress;

          // Scroll indicator fades out promptly on scroll
          if (indicatorRef.current) {
            gsap.set(indicatorRef.current, { opacity: Math.max(0, 1 - progress * 8) });
          }

          // 1. Zoom the India cutout cover
          if (coverRef.current) {
            const scale = 1 + Math.pow(progress, 1.25) * 8.5;
            // Soft background remains solid through initial scroll, then smoothly dissolves
            const opacity = Math.max(0, 1 - Math.pow(Math.max(0, (progress - 0.22) / 0.43), 1.4));

            gsap.set(coverRef.current, {
              scale: scale,
              opacity: opacity,
              transformOrigin: origin,
            });
          }

          // 2. Headline grows in sync with the map, then fixes itself at scale 1.0!
          if (headlineRef.current) {
            // textProgress runs from 0 to 1 as progress reaches 0.65
            const textProgress = Math.min(1, progress / 0.65);
            // Smooth natural growth curve
            const textScale = initialScale + Math.pow(textProgress, 1.1) * (1 - initialScale);

            gsap.set(headlineRef.current, {
              scale: textScale,
              transformOrigin: origin,
            });
          }

          // 3. Outer UI text smoothly adapts contrast as sunset photo is unveiled
          const photoReveal = Math.min(1, Math.max(0, (progress - 0.22) / 0.40));
          updateColors(photoReveal);
        },
      });
    }, containerRef);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[620px] sm:min-h-[720px] overflow-hidden select-none bg-[#FAF6F0]"
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
          LAYER 1: CENTER MONUMENTAL HEADLINE (GROWS ON SCROLL)
          Sits directly over the sunset photo.
          At rest: Scaled down inside the transparent torso of India.
          On scroll: Scales up smoothly in sync with the map, then fixes
          itself at scale 1.0 on the screen!
          ───────────────────────────────────────────────────────────── */}
      <div
        ref={headlineRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 flex items-center justify-center will-change-transform"
        style={{ transformOrigin: '50% 47%' }}
      >
        <div className="w-full text-center px-4 max-w-6xl mx-auto">
          <h1 className="font-display font-black text-3xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[5.75rem] tracking-tightest uppercase leading-[0.92] text-white drop-shadow-[0_4px_28px_rgba(0,0,0,0.85)]">
            <span className="block">TRAVEL SHOULD FEEL</span>
            <span className="block mt-1 sm:mt-2">LIKE A JOURNEY.</span>
            <span className="block text-[#EC6426] mt-1 sm:mt-2 drop-shadow-[0_4px_20px_rgba(236,100,38,0.5)]">
              NOT A PROJECT.
            </span>
          </h1>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 2: THE SOFT INDIA CUTOUT COVER (ZOOMS IN ON SCROLL)
          Outside India: Solid soft luxury paper tone (#FAF6F0).
          Inside India: Transparent hole peeks through at the sunset & headline.
          On scroll: Scales up from 1.0 to 9.5+, smoothly dissolving between
          progress 0.22 and 0.65 to reveal full-bleed sunset photo.
          Responsive: Mobile portrait uses tailored 9:19.5 cutout cover
          preventing Kashmir and Kanyakumari text overlap.
          ───────────────────────────────────────────────────────────── */}
      <div
        ref={coverRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none z-20 will-change-transform"
        style={{ transformOrigin: '50% 47%' }}
      >
        <picture className="w-full h-full">
          <source media="(max-width: 767px)" srcSet="/brand/india-cover-mobile.png" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/india-cover-full.png"
            alt=""
            className="w-full h-full object-cover min-w-full min-h-full"
            aria-hidden="true"
          />
        </picture>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 3: OUTER TELEMETRY, NARRATIVE & CONTROLS
          Sits above the cover (z-30) so it is always crisp and accessible.
          Text colors smoothly adapt from warm charcoal (#FAF6F0 background)
          to crisp white (dark sunset photo).
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-30 flex flex-col justify-between px-5 sm:px-12 pt-20 sm:pt-28 pb-6 sm:pb-12 pointer-events-none">
        {/* Top Telemetry & Folio */}
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <div
            className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] uppercase transition-colors duration-150 shrink-0"
            style={{ color: 'var(--hero-text-primary, #2C2623)', textShadow: 'var(--hero-text-shadow, none)' }}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#EC6426] shadow-[0_0_8px_#EC6426] shrink-0" />
            <span>28°36′N · 77°12′E</span>
            <span className="hidden sm:inline" style={{ color: 'var(--hero-text-dim, rgba(44,38,35,0.45))' }}>/</span>
            <span className="hidden sm:inline">AGRA · SUNSET EXPEDITION</span>
          </div>

          <div
            className="font-mono text-[10px] sm:text-xs uppercase tracking-widest transition-colors duration-150 shrink-0 text-right"
            style={{ color: 'var(--hero-text-secondary, rgba(44,38,35,0.75))', textShadow: 'var(--hero-text-shadow, none)' }}
          >
            <span className="hidden xs:inline">JOURNEY 01 · </span>IMMERSION
          </div>
        </div>

        {/* Bottom Bar: Human Support Copy & Primary CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-6 w-full pointer-events-auto">
          {/* Lower-Left Narrative */}
          <div className="max-w-xs sm:max-w-sm space-y-1 sm:space-y-1.5">
            <p
              className="font-display font-bold text-sm sm:text-lg uppercase tracking-tight transition-colors duration-150 leading-snug sm:leading-tight"
              style={{ color: 'var(--hero-text-primary, #2C2623)', textShadow: 'var(--hero-text-shadow, none)' }}
            >
              From wanting to go <br className="hidden sm:inline" />
              <span className="text-[#EC6426] drop-shadow-[0_2px_12px_rgba(236,100,38,0.3)]">to being on your way.</span>
            </p>
            <p
              className="font-sans text-[11px] sm:text-sm font-normal leading-relaxed transition-colors duration-150 line-clamp-2 sm:line-clamp-none"
              style={{ color: 'var(--hero-text-secondary, rgba(44,38,35,0.75))', textShadow: 'var(--hero-text-shadow, none)' }}
            >
              Intelligent routes, authentic distances, and genuine discovery across India.
            </p>
          </div>

          {/* Lower-Right Action */}
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/plan"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-[#EC6426] text-white font-mono text-[11px] sm:text-xs uppercase tracking-widest font-bold hover:bg-[#1B1715] transition-all duration-300 shadow-xl hover:translate-y-[-1px] touch-manipulation min-h-[44px]"
            >
              <span>EXPLORE JOURNEYS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/explore"
              className="inline-flex items-center justify-center font-mono text-[11px] sm:text-xs uppercase tracking-widest hover:text-[#EC6426] transition-colors py-2 px-2 touch-manipulation min-h-[44px]"
              style={{ color: 'var(--hero-text-secondary, rgba(44,38,35,0.75))', textShadow: 'var(--hero-text-shadow, none)' }}
            >
              Destinations →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Minimal Scroll Indicator ── */}
      <div
        ref={indicatorRef}
        className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] z-30 pointer-events-none transition-colors duration-150"
        style={{ color: 'var(--hero-text-secondary, rgba(44,38,35,0.75))' }}
      >
        <span>SCROLL TO ZOOM IN</span>
        <div
          className="w-[1px] h-5 transition-colors duration-150"
          style={{ backgroundColor: 'var(--hero-text-dim, rgba(44,38,35,0.45))' }}
        />
      </div>
    </div>
  );
}

