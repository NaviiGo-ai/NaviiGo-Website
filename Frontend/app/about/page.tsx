'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Compass } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// 7 Disconnected Travel Fragments in 3D Spatial Field
const SPATIAL_FRAGMENTS = [
  {
    id: 'search',
    label: 'SEARCH',
    snippet: '34.15°N · high pass rail status',
    startX: -32,
    startY: -85,
    startZ: 140,
    rotZ: -6,
    resolvedPhase: '01 / DISCOVER',
  },
  {
    id: 'photos',
    label: 'PHOTOS',
    snippet: 'specimen crop · ladakh pine mist',
    image: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=600&q=80',
    startX: 28,
    startY: -110,
    startZ: -80,
    rotZ: 5,
    resolvedPhase: '01 / DISCOVER',
  },
  {
    id: 'notes',
    label: 'NOTES',
    snippet: 'carry high-altitude permits & cash',
    startX: -42,
    startY: 25,
    startZ: 80,
    rotZ: -4,
    resolvedPhase: '02 / PLAN',
  },
  {
    id: 'itinerary',
    label: 'ITINERARY',
    snippet: 'Day 03 · 08:30 buffer for ghat aarti',
    startX: 32,
    startY: 15,
    startZ: 160,
    rotZ: 7,
    resolvedPhase: '02 / PLAN',
  },
  {
    id: 'maps',
    label: 'MAPS',
    snippet: 'offline contour · unpaved trail split',
    startX: -16,
    startY: 120,
    startZ: -60,
    rotZ: -3,
    resolvedPhase: '03 / EXPERIENCE',
  },
  {
    id: 'chats',
    label: 'CHATS',
    snippet: '“ask for the chai stall behind the bell”',
    startX: 18,
    startY: 105,
    startZ: 110,
    rotZ: 4,
    resolvedPhase: '03 / EXPERIENCE',
  },
  {
    id: 'bookings',
    label: 'BOOKINGS',
    snippet: 'train pass PNR: 4429-A confirmed',
    startX: -34,
    startY: 195,
    startZ: 50,
    rotZ: -5,
    resolvedPhase: '04 / MANAGE',
  },
];

const RESOLVED_PHASES = [
  {
    step: '01',
    title: 'DISCOVER',
    character: 'Visual / Open / Curious',
    desc: 'Sensing place before deciding routes. Unhurried cultural cartography and atmospheric inspiration.',
  },
  {
    step: '02',
    title: 'PLAN',
    character: 'Structured / Useful / Clear',
    desc: 'Spatial itineraries that breathe. Realistic distances, transit buffers, and zero cognitive exhaustion.',
  },
  {
    step: '03',
    title: 'EXPERIENCE',
    character: 'Alive / Contextual',
    desc: 'Real-time orientation that respects where you stand. Waypoints only when you need them.',
  },
  {
    step: '04',
    title: 'MANAGE',
    character: 'Calm / Organized',
    desc: 'Every transit pass, ticket, and multi-currency ledger consolidated in an offline-accessible wallet.',
  },
  {
    step: '05',
    title: 'REMEMBER',
    character: 'Reflective / Permanent',
    desc: 'The route becomes an enduring territorial archive long after you return home.',
  },
];

export default function AboutPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spatialStageRef = useRef<HTMLDivElement>(null);
  const fragmentsGroupRef = useRef<HTMLDivElement>(null);
  const resolvedGroupRef = useRef<HTMLDivElement>(null);
  const journeyLineRef = useRef<SVGPathElement>(null);

  // Subtle pointer perspective shift
  useEffect(() => {
    const stage = spatialStageRef.current;
    if (!stage) return;

    let targetRotY = 0;
    let targetRotX = 0;
    let curRotY = 0;
    let curRotX = 0;
    let animId: number;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = nx * 8;
      targetRotX = ny * 6;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    const updateTilt = () => {
      animId = requestAnimationFrame(updateTilt);
      curRotY += (targetRotY - curRotY) * 0.05;
      curRotX += (targetRotX - curRotX) * 0.05;
      if (fragmentsGroupRef.current) {
        fragmentsGroupRef.current.style.transform = `rotateY(${curRotY}deg) rotateX(${curRotX}deg)`;
      }
    };
    updateTilt();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);

  // GSAP ScrollTrigger: Fragmentation to Continuity Convergence
  useEffect(() => {
    if (!spatialStageRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      ScrollTrigger.create({
        trigger: spatialStageRef.current,
        start: 'top top',
        end: '+=160%',
        pin: true,
        scrub: 1.2,
        refreshPriority: 10,
        onUpdate: (self) => {
          const progress = self.progress;

          // 1. Chaotic fragments converge: collapse Z-depth and rotation to 0
          const items = document.querySelectorAll('.spatial-fragment-item');
          items.forEach((item, idx) => {
            const frag = SPATIAL_FRAGMENTS[idx];
            if (!frag) return;

            // Ease towards alignment as progress approaches 0.65
            const factor = Math.max(0, 1 - progress * 1.5);
            const z = frag.startZ * factor;
            const rz = frag.rotZ * factor;
            const opacity = Math.max(0, 1 - progress * 1.8);

            gsap.set(item, {
              z: z,
              rotationZ: rz,
              opacity: opacity,
            });
          });

          // 2. Journey Line animates and draws through
          if (journeyLineRef.current) {
            const len = journeyLineRef.current.getTotalLength?.() || 800;
            gsap.set(journeyLineRef.current, {
              strokeDasharray: len,
              strokeDashoffset: len * (1 - progress * 1.2),
            });
          }

          // 3. Resolved Continuity Group reveals as chaotic fragments collapse
          if (resolvedGroupRef.current) {
            const resolvedProgress = Math.max(0, (progress - 0.45) / 0.55);
            gsap.set(resolvedGroupRef.current, {
              opacity: resolvedProgress,
              y: (1 - resolvedProgress) * 40,
            });
          }
        },
      });
    }, spatialStageRef);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-paper-warm text-naviigo-brown font-sans selection:bg-brand-primary selection:text-white pt-24 pb-32">
      
      {/* ── CHAPTER 00: SPATIAL FRAGMENTATION TO CONTINUITY OPENING ─ */}
      <section
        ref={spatialStageRef}
        className="relative w-full h-screen min-h-[700px] overflow-hidden flex flex-col justify-between px-6 md:px-12 py-8 select-none border-b border-[#EADFD4]"
        style={{ perspective: '1200px' }}
      >
        {/* Top Folio Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 z-30 pointer-events-auto">
          <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-naviigo-brown/60">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            <span>ABOUT NAVIIGO</span>
            <span className="text-naviigo-brown/30">/</span>
            <span>JOURNEY 00</span>
          </div>
          <div className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-naviigo-brown/50">
            SPATIAL CONTINUITY ARCHITECTURE
          </div>
        </div>

        {/* Center Stage: Floating 3D Fragmented Field */}
        <div className="relative flex-1 w-full flex items-center justify-center pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          
          {/* Background Display Watermark */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-10 pointer-events-none">
            <span className="font-display font-black text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] tracking-tightest uppercase text-naviigo-brown">
              CONTINUITY
            </span>
          </div>

          {/* 3D Scattered Fragments Group (Collapses on Scroll) */}
          <div
            ref={fragmentsGroupRef}
            className="absolute inset-0 flex items-center justify-center will-change-transform"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {SPATIAL_FRAGMENTS.map((frag, idx) => (
              <div
                key={frag.id}
                className="spatial-fragment-item absolute will-change-transform transition-opacity duration-300"
                style={{
                  transform: `translate3d(${frag.startX * 12}px, ${frag.startY * 2}px, ${frag.startZ}px) rotateZ(${frag.rotZ}deg)`,
                }}
              >
                {/* Raw editorial fragment scrap (Not a generic card) */}
                <div className="p-4 bg-paper-light border border-[#EADFD4] rounded-lg shadow-sm max-w-[220px] sm:max-w-[260px] space-y-1.5 backdrop-blur-xs">
                  <div className="flex items-baseline justify-between border-b border-[#EADFD4]/60 pb-1">
                    <span className="font-mono text-[9px] text-brand-primary font-bold uppercase tracking-widest">
                      FRAGMENT // 0{idx + 1}
                    </span>
                    <span className="font-mono text-[8px] text-naviigo-brown/40 uppercase">
                      DISPERSED
                    </span>
                  </div>

                  <div className="font-display font-black text-base sm:text-lg text-naviigo-brown tracking-tight uppercase">
                    {frag.label}
                  </div>

                  {frag.image && (
                    <div className="relative w-full h-16 rounded overflow-hidden grayscale contrast-105 my-1">
                      <Image src={frag.image} alt="Specimen" fill className="object-cover" sizes="200px" />
                    </div>
                  )}

                  <p className="font-sans text-[11px] text-naviigo-brown/70 font-light italic">
                    {frag.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Resolved 5-Phase Continuity Thread (Appears on Scroll) */}
          <div
            ref={resolvedGroupRef}
            className="relative z-20 w-full max-w-6xl mx-auto px-4 opacity-0 will-change-transform pointer-events-auto"
          >
            <div className="text-center mb-8">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold block mb-2">
                RESOLVED SPATIAL CONTINUITY
              </span>
              <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-naviigo-brown uppercase tracking-tight">
                One Single Journey.
              </h2>
            </div>

            {/* 5 Continuous Pillars along the Journey Line */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {RESOLVED_PHASES.map((phase) => (
                <div
                  key={phase.step}
                  className="p-5 rounded-2xl bg-paper-light border border-[#EADFD4] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white font-mono text-xs font-bold flex items-center justify-center mb-4">
                      {phase.step}
                    </div>
                    <h4 className="font-display font-black text-xl text-naviigo-brown uppercase tracking-tight mb-1">
                      {phase.title}
                    </h4>
                    <p className="font-mono text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-2">
                      {phase.character}
                    </p>
                    <p className="text-xs text-naviigo-brown/70 font-sans leading-relaxed">
                      {phase.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Editorial Scroll Cue */}
        <div className="flex items-center justify-between font-mono text-xs text-naviigo-brown/60 z-30 pointer-events-auto">
          <div>PHILOSOPHICAL VECTOR: 7 DISCONNECTED TOOLS → 1 THREAD</div>
          <div className="text-brand-primary font-semibold">SCROLL TO CONVERGE FRAGMENTS ↓</div>
        </div>
      </section>

      {/* ── CHAPTER 01: MANIFESTO ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-28 md:py-40 border-b border-[#EADFD4]">
        <div className="max-w-5xl">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-8">
            01 / MANIFESTO
          </div>

          <blockquote className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl uppercase leading-[0.94] tracking-tightest text-naviigo-brown mb-12">
            WE DON’T WANT <br />
            TO ADD ANOTHER <br />
            TRAVEL TOOL. <br />
            <span className="text-brand-primary">WE WANT THE TOOLS</span> <br />
            TO FEEL LIKE <br />
            ONE JOURNEY.
          </blockquote>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-naviigo-brown/80 font-sans text-base md:text-lg font-light leading-relaxed border-t border-[#EADFD4] pt-8">
            <p>
              Travel is sensory, human, and transformative. You step into a mountain train carriage at dawn, breathe in the roasted cardamom and cold cedar mist, and feel entirely alive.
            </p>
            <p>
              When software reduces that experience to scattered booking codes, isolated tabs, and rigid spreadsheets, the wonder evaporates. We craft Naviigo to be transparent — a quiet companion that stays in the background until needed.
            </p>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 02: ADAPTIVE POSTURE ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-36 border-b border-[#EADFD4]">
        <div className="max-w-3xl mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-3">
            02 / ADAPTIVE POSTURE
          </div>
          <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-naviigo-brown mb-6">
            The Product Changes <br />
            <span className="text-brand-primary">With Where You Stand.</span>
          </h2>
          <p className="text-naviigo-brown/75 font-sans text-base md:text-lg font-light leading-relaxed">
            A traveller planning at a desk needs structural clarity and spatial pacing. The same traveller standing in an overcrowded junction at 21:00 needs calm, high-contrast, zero-noise direction. Naviigo shifts density effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              phase: 'DISCOVER',
              posture: 'Visual / Open / Curious',
              behavior: 'Generous photography, geographic context, and ambient cultural depth.',
              density: 'LOW · ROOM TO DREAM',
            },
            {
              phase: 'PLAN',
              posture: 'Structured / Useful / Clear',
              behavior: 'Spatial timelines, route pacing, transit options, and expense forecasting.',
              density: 'MODERATE · HIGH PRECISION',
            },
            {
              phase: 'EXPERIENCE',
              posture: 'Alive / Contextual',
              behavior: 'Immediate next waypoint, local etiquette notes, and weather contingencies.',
              density: 'GLANCEABLE · INSTANT ACCESS',
            },
            {
              phase: 'MANAGE',
              posture: 'Calm / Organized',
              behavior: 'Confirmed documents, offline QR keys, tickets, and multi-currency ledgers.',
              density: 'COMPACT · HIGH UTILITY',
            },
            {
              phase: 'REMEMBER',
              posture: 'Reflective / Permanent',
              behavior: 'Territorial coverage maps, expedition stamps, and unvarnished logs.',
              density: 'EDITORIAL · ARCHIVAL PERMANENCE',
            },
          ].map((item, index) => (
            <div
              key={item.phase}
              className="bg-paper-light border border-[#EADFD4] rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-brand-primary/50 transition-colors"
            >
              <div>
                <div className="flex items-baseline justify-between mb-4 pb-2 border-b border-[#EADFD4]">
                  <span className="font-mono text-[10px] text-brand-primary font-bold">STATE 0{index + 1}</span>
                  <span className="font-mono text-[9px] text-naviigo-brown/40">NV-CORE</span>
                </div>
                <h4 className="font-display font-black text-2xl text-naviigo-brown uppercase tracking-tight mb-1">
                  {item.phase}
                </h4>
                <p className="font-mono text-[10px] font-bold text-brand-primary uppercase mb-3">
                  {item.posture}
                </p>
                <p className="font-sans text-xs text-naviigo-brown/70 leading-relaxed">
                  {item.behavior}
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-[#EADFD4] font-mono text-[9px] text-naviigo-brown/50 uppercase tracking-wider">
                {item.density}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CHAPTER 03: HUMAN TRUTH ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-36 border-b border-[#EADFD4]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-4">
              03 / HUMAN TRUTH
            </div>
            <h2 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl uppercase leading-[0.92] tracking-tightest text-naviigo-brown mb-8">
              THE PRODUCT <br />
              IS DIGITAL. <br />
              <span className="text-brand-primary">THE JOURNEY</span> <br />
              ISN’T.
            </h2>
            <div className="space-y-4 text-naviigo-brown/80 font-sans text-base md:text-lg font-light leading-relaxed max-w-lg">
              <p>
                No algorithm can replace the warmth of an earthen clay cup of masala chai handed to you at dawn, or the thrill of your first glimpse of the snowline breaking through the clouds.
              </p>
              <p>
                We build software so you can put the phone back in your pocket and look out the train window.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#EADFD4] bg-paper-light shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=1400&q=80"
                  alt="Dawn riverboats and morning light on the Ganges, Varanasi"
                  fill
                  className="object-cover contrast-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] text-naviigo-brown/60 uppercase">
                <span>RIVERSIDE DAWN · VARANASI</span>
                <span>05:40 AM · GANGES CORRIDOR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 04: BRAND PROMISE ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-36 border-b border-[#EADFD4]">
        <div className="max-w-4xl mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-3">
            04 / BRAND PROMISE
          </div>
          <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase leading-[0.92] tracking-tightest text-naviigo-brown mb-6">
            BUILT AROUND <br />
            <span className="text-brand-primary">THE TRAVELLER.</span>
          </h2>
          <div className="space-y-3 text-naviigo-brown/80 font-sans text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
            <p className="font-medium text-naviigo-brown">
              The places were never the problem.
            </p>
            <p>
              Everything between wanting to go and actually getting there was.
            </p>
          </div>
        </div>

        {/* 5-Phase Continuous Ledger along the Journey Line */}
        <div className="border-t border-b border-[#EADFD4] divide-y divide-[#EADFD4]">
          {[
            {
              step: '01',
              title: 'DISCOVER',
              subtitle: 'CURIOSITY OVER ALGORITHMS',
              description: 'Authentic cultural cartography and atmospheric inspiration. We curate India’s depth, not generic tourism checklists.',
            },
            {
              step: '02',
              title: 'PLAN',
              subtitle: 'SPATIAL ITINERARY HARNESS',
              description: 'Real distances, realistic mountain buffers, and seamless rail connections without mental exhaustion.',
            },
            {
              step: '03',
              title: 'EXPERIENCE',
              subtitle: 'CONTEXTUAL ORIENTATION',
              description: 'Quiet, glanceable guidance in chaotic railway junctions, mountain trails, and ancient labyrinthine bazars.',
            },
            {
              step: '04',
              title: 'MANAGE',
              subtitle: 'ONE TRANQUILLITY WALLET',
              description: 'All transit passes, offline credentials, tickets, and multi-currency ledgers consolidated in one place.',
            },
            {
              step: '05',
              title: 'REMEMBER',
              subtitle: 'PERMANENT ARCHIVE',
              description: 'Your route becomes an enduring territorial ledger — memories that remain long after the dust settles.',
            },
          ].map((pillar) => (
            <div
              key={pillar.title}
              className="py-8 sm:py-10 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-baseline group hover:bg-paper-light/60 transition-colors px-2 rounded-lg"
            >
              <div className="md:col-span-1 font-mono text-xs text-brand-primary font-bold">
                {pillar.step}
              </div>
              <div className="md:col-span-4">
                <h3 className="font-display font-black text-2xl sm:text-3xl text-naviigo-brown uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                  {pillar.title}
                </h3>
                <span className="font-mono text-[10px] text-naviigo-brown/50 uppercase tracking-widest mt-1 block">
                  {pillar.subtitle}
                </span>
              </div>
              <div className="md:col-span-7 text-sm sm:text-base text-naviigo-brown/75 font-sans font-light leading-relaxed">
                {pillar.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CHAPTER 05: DESTINATION & EXITING JOURNEY LINE ─────────── */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-24 md:pt-36 pb-12">
        <div className="relative overflow-hidden bg-paper-light border border-[#EADFD4] rounded-3xl p-8 sm:p-14 md:p-20 shadow-sm">
          <div className="max-w-3xl">
            <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-4">
              05 / DESTINATION
            </div>

            <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase leading-[0.92] tracking-tightest text-naviigo-brown mb-6">
              FROM <br />
              “I WANT TO GO” <br />
              <span className="text-brand-primary">TO “I’M ON MY WAY.”</span>
            </h2>

            <p className="font-sans text-base md:text-lg text-naviigo-brown/75 font-light leading-relaxed mb-10 max-w-xl">
              Travel intent shouldn&apos;t stall in your notes app or group chats. Turn your inspiration into a structured, living journey in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <Link
                href="/plan"
                className="group inline-flex items-center gap-4 px-8 py-4 rounded-xl bg-naviigo-brown hover:bg-brand-primary text-white font-mono text-xs uppercase tracking-widest font-bold shadow-md transition-all duration-300"
              >
                <span>PLAN A JOURNEY</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href="/explore"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-naviigo-brown/70 hover:text-brand-primary font-semibold transition-colors"
              >
                <span>Or explore the digital atlas</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
