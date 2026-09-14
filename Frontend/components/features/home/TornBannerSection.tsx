'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Rebuilt Editorial Cinematic Torn Paper Section
 * Faithful to Reference Image 1:
 * - Full-width cinematic scenic photography with subtle parallax
 * - Organic, asymmetric dark torn paper landmass plane with handcrafted fibrous Bézier edge
 * - Monumental hollow/outlined serif display typography integrated into the scene
 * - Delicate white cartographic contour & route vector linework
 * - Continuous visual hand-off into the next chapter
 */
export default function TornBannerSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const paperPlaneRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const lineworkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      // Parallax scroll depth between background photography and paper plane
      gsap.fromTo(
        photoRef.current,
        { y: -50, scale: 1.08 },
        {
          y: 70,
          scale: 1.0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        }
      );

      // Subtle float on the dark paper plane
      gsap.fromTo(
        paperPlaneRef.current,
        { y: 30 },
        {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            scrub: 1.0,
          },
        }
      );

      // Linework subtle rotation & opacity shift
      gsap.fromTo(
        lineworkRef.current,
        { opacity: 0.25, rotate: -2 },
        {
          opacity: 0.55,
          rotate: 3,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'bottom 30%',
            scrub: 1.5,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden select-none bg-[#141210] min-h-[780px] sm:min-h-[880px] lg:min-h-[960px] flex items-center justify-center"
    >
      {/* ── SVG Filter for Physical Rag Paper Torn Edge Fibers ─────── */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="torn-fibers-filter" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04 0.09" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* ── LAYER 0: CINEMATIC FULL-WIDTH BACKGROUND PHOTOGRAPHY ───── */}
      <div
        ref={photoRef}
        className="absolute inset-0 w-full h-[120%] -top-[10%] pointer-events-none will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/places/photo?name=Varkala+Beach&city=Kerala&w=1920&redirect=true"
          alt="Coastal Horizon, Varkala, India"
          className="w-full h-full object-cover object-center brightness-[0.78] contrast-[1.08] saturate-[1.1]"
          loading="lazy"
        />
        {/* Editorial color grade: cinematic dusk amber to obsidian */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70 pointer-events-none" />
      </div>

      {/* ── LAYER 1: ORGANIC TORN PAPER / LANDMASS PLANE ───────────── */}
      {/* Asymmetric sweeping dark paper sheet with realistic torn deckled top & bottom */}
      <div
        ref={paperPlaneRef}
        className="relative z-10 w-full max-w-[1720px] mx-auto pointer-events-none will-change-transform my-16 sm:my-24"
      >
        {/* Upper Handcrafted Torn Deckled Edge */}
        <div className="w-full overflow-hidden leading-none">
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="w-full h-16 sm:h-24 md:h-32 block text-[#141210]"
            style={{ filter: 'url(#torn-fibers-filter)' }}
          >
            <path
              d="M 0,120 L 0,48 C 65,42 120,54 185,40 C 255,26 320,12 390,16 C 460,20 520,38 590,52 C 670,68 740,74 820,60 C 890,48 950,28 1020,20 C 1100,10 1170,24 1240,42 C 1310,60 1375,54 1440,38 L 1440,120 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Paper Plane Body (Rich Deep Charcoal) */}
        <div className="relative w-full bg-[#141210] py-14 sm:py-20 md:py-28 px-6 sm:px-12 md:px-20 overflow-hidden shadow-2xl">
          {/* Subtle Gridlines (matching Reference Image 1) */}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-4 w-full h-full opacity-15" aria-hidden="true">
            <div className="border-r border-white/20 h-full" />
            <div className="border-r border-white/20 h-full" />
            <div className="border-r border-white/20 h-full" />
            <div className="h-full" />
          </div>

          {/* Right Quadrant: Delicate White Topographic Contour Linework */}
          <div
            ref={lineworkRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] md:w-[680px] h-[340px] sm:h-[500px] md:h-[680px] pointer-events-none opacity-40 select-none overflow-hidden will-change-transform"
            aria-hidden="true"
          >
            <svg viewBox="0 0 600 600" fill="none" className="w-full h-full">
              {/* Outer territorial contour */}
              <path
                d="M 440,50 C 470,80 490,120 500,160 C 510,200 540,220 550,260 C 560,300 530,350 500,390 C 470,430 480,470 450,510 C 420,540 370,550 330,560 C 290,570 250,590 210,580 C 170,570 150,530 130,500 C 110,470 140,430 150,400 C 160,370 150,330 130,310 C 110,290 80,300 65,270 C 50,240 80,210 95,180 C 110,150 140,140 170,110 C 200,80 230,60 270,40 C 310,20 400,15 440,50 Z"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.2"
                strokeDasharray="7 5"
              />
              {/* Inner concentric elevation lines */}
              <path
                d="M 460,110 C 480,140 490,180 495,220 C 500,260 480,300 460,340 C 440,380 445,420 420,450 C 395,480 350,495 315,505 C 280,515 240,520 210,505 C 180,490 190,450 195,420 C 200,390 180,360 165,340 C 150,320 125,320 115,295 C 105,270 130,245 140,220 C 150,195 180,180 205,155 C 230,130 260,110 295,95 C 330,80 430,75 460,110 Z"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
              />
              <path
                d="M 410,180 C 430,210 440,250 440,280 C 440,320 415,350 390,380 C 365,410 330,425 295,430 C 260,435 230,420 220,395 C 210,370 235,340 245,315 C 255,290 280,270 300,245 C 320,220 380,150 410,180 Z"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.9"
              />
              {/* Topographical reef nodes */}
              <circle cx="360" cy="270" r="16" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              <circle cx="410" cy="330" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" />
              <circle cx="290" cy="380" r="24" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
            </svg>
          </div>

          {/* ── GIANT HOLLOW OUTLINED SERIF DISPLAY TYPOGRAPHY ─────── */}
          {/* Integrated directly into the scene with genuine depth */}
          <div
            ref={headlineRef}
            className="relative z-20 max-w-5xl mx-auto text-center py-4 sm:py-8 flex flex-col items-center pointer-events-auto"
          >
            <h2
              className="font-display uppercase tracking-[0.04em] leading-[0.96] select-none text-transparent"
              style={{
                fontFamily: 'var(--font-epilogue), Georgia, serif',
                fontSize: 'clamp(2.3rem, 6.2vw, 6.4rem)',
                fontWeight: 300,
                WebkitTextStroke: '1.5px rgba(255, 255, 255, 0.9)',
                letterSpacing: '0.04em',
                textShadow: '0 4px 30px rgba(0,0,0,0.5)',
              }}
            >
              <span className="block whitespace-nowrap">EVERY JOURNEY DESERVES</span>
              <span className="block whitespace-nowrap mt-1 sm:mt-2">AN AUTHOR.</span>
            </h2>

            {/* Subtle editorial subtitle */}
            <p className="mt-8 font-mono text-[10px] sm:text-xs tracking-[0.35em] uppercase text-white/60">
              CUSTOM TERRITORIAL DESIGN · ARCHIVAL INTEGRITY · NAViiGO
            </p>

            {/* Minimalist Action Link */}
            <div className="mt-6 flex items-center gap-2 text-xs font-mono tracking-widest text-[#EC6426] uppercase hover:text-white transition-colors cursor-pointer">
              <span>EXPLORE THE METHODOLOGY</span>
              <span>→</span>
            </div>
          </div>

          {/* Lower Monogram Seal & Coordinates */}
          <div className="absolute bottom-6 left-6 sm:left-12 flex items-center gap-3 z-10 pointer-events-none">
            <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center font-mono text-[10px] text-white/60">
              NV
            </div>
            <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-white/40">
              FOLIO 2026 · THE CONNECTED COMPANION
            </span>
          </div>
        </div>

        {/* Lower Handcrafted Torn Deckled Edge (Visual Handoff into Next Chapter) */}
        <div className="w-full overflow-hidden leading-none -mt-[1px]">
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="w-full h-16 sm:h-24 md:h-32 block text-[#141210]"
            style={{ filter: 'url(#torn-fibers-filter)' }}
          >
            <path
              d="M 0,0 L 0,68 C 75,54 140,42 210,50 C 285,58 350,78 425,82 C 500,86 565,68 635,52 C 715,34 785,30 865,44 C 935,56 995,78 1065,86 C 1145,94 1215,80 1285,62 C 1355,44 1405,52 1440,64 L 1440,0 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
