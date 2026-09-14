'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import TornPaperEdge from '@/components/shared/TornPaperEdge';
import { TornPaperTransition } from '@/components/shared/TornPaper';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function QuietPhilosophy() {
  const sectionRef = useRef<HTMLElement>(null);
  const journeyPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      // Subtle reveal for the restrained headline
      gsap.fromTo(
        '.quiet-word',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Journey line scroll progress
      if (journeyPathRef.current) {
        const length = journeyPathRef.current.getTotalLength?.() || 400;
        gsap.set(journeyPathRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });

        gsap.to(journeyPathRef.current, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 65%',
            end: 'bottom 45%',
            scrub: 1,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="discover"
      className="relative w-full bg-paper-warm text-naviigo-brown pt-36 md:pt-48 pb-32 md:pb-44 px-6 md:px-16 lg:px-24 overflow-hidden"
    >
      {/* ── Photo to Paper Transition (Torn cream deckled edge rising into hero photo) ── */}
      <TornPaperTransition
        color="#FAF6F0"
        variant={0}
        className="absolute top-0 left-0 w-full z-20"
      />

      {/* ── Background Topographic Wire Contours ─────────────────── */}
      <div className="absolute inset-0 pointer-events-none opacity-20 select-none">
        <svg
          viewBox="0 0 1440 800"
          fill="none"
          className="w-full h-full object-cover"
        >
          <path
            d="M -100,200 C 300,100 600,350 1000,150 S 1400,300 1600,200"
            stroke="#632713"
            strokeWidth="0.75"
            strokeDasharray="4 8"
            strokeOpacity="0.3"
          />
          <path
            d="M -100,380 C 250,260 700,480 1100,320 S 1450,420 1600,360"
            stroke="#632713"
            strokeWidth="0.5"
            strokeOpacity="0.2"
          />
        </svg>
      </div>

      {/* ── Winding Journey Line Leading Down (Continuation of 3D route) ── */}
      <div className="absolute top-0 right-12 md:right-32 w-24 h-full pointer-events-none hidden sm:block">
        <svg viewBox="0 0 100 800" fill="none" className="w-full h-full">
          <path
            ref={journeyPathRef}
            d="M 50,0 Q 80,200 30,400 T 60,800"
            stroke="#EC6426"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Waypoint Dot 01 */}
          <circle cx="30" cy="400" r="12" fill="#FAF6F0" stroke="#EC6426" strokeWidth="1.5" />
          <circle cx="30" cy="400" r="5" fill="#EC6426" />
        </svg>
      </div>

      {/* ── Quiet Content Canvas with Generous Whitespace ────────── */}
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Small Chapter Marker */}
        <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.3em] uppercase text-naviigo-brown/60 mb-12">
          <span className="w-2 h-2 rounded-full bg-brand-primary" />
          <span>01 / DISCOVER</span>
          <span className="text-naviigo-brown/30">/</span>
          <span>ORIENTATION</span>
        </div>

        {/* Asymmetric Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Restrained, Strong Statement */}
          <div className="lg:col-span-7">
            <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tightest uppercase text-naviigo-brown leading-[0.92]">
              <span className="block overflow-hidden">
                <span className="quiet-word inline-block">START</span>
              </span>
              <span className="block overflow-hidden mt-1 sm:mt-2">
                <span className="quiet-word inline-block text-brand-primary">
                  SOMEWHERE.
                </span>
              </span>
            </h2>

            <div className="mt-10 sm:mt-14 space-y-4 max-w-lg">
              <p className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-naviigo-brown">
                Places worth going. Plans worth keeping.
              </p>
              <p className="font-sans text-base sm:text-lg text-naviigo-brown/75 font-light leading-relaxed">
                The world does not need another booking engine. It needs a quieter way to move through unfamiliar ground without mental exhaustion.
              </p>
            </div>
          </div>

          {/* Right Column: One Single Editorial Specimen Photo */}
          <div className="lg:col-span-5 lg:pt-4 space-y-4">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-[#EADFD4] bg-paper-light shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1200&q=80"
                alt="Morning boats on the holy riverfront, Varanasi"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover contrast-105"
              />
              <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-xs text-white/90 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                SPECIMEN 01 · GANGES DAWN
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-naviigo-brown/50 uppercase tracking-wider px-1">
              <span>WAYPOINT 01</span>
              <span>25°18′N, 83°01′E</span>
            </div>
          </div>

        </div>

      </div>

      {/* ── Torn Paper Bottom Edge ─────────────────────────────── */}
      <TornPaperEdge
        position="bottom"
        color="#FDFBF7"
        variant={2}
        className="absolute bottom-0 left-0 w-full z-20"
      />
    </section>
  );
}
