'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface MemoryCard {
  id: string;
  image: string;
  place: string;
  date: string;
  coordinates: string;
  note: string;
  aspect: string;
  speed: number;
  layoutClass: string;
}

const MEMORIES: MemoryCard[] = [
  {
    id: 'mem-1',
    image: '/api/places/photo?name=Thiksey+Monastery&city=Ladakh&w=1200&redirect=true',
    place: 'Thiksey Gompa, Ladakh',
    date: '14 OCT 2025 • 06:30',
    coordinates: '34.0542° N, 77.6667° E',
    note: 'Dawn conch shell echoing across the Indus valley mist.',
    aspect: 'aspect-[3/4]',
    speed: 0.8,
    layoutClass: 'col-span-12 md:col-span-5 md:translate-y-8',
  },
  {
    id: 'mem-2',
    image: '/api/places/photo?name=Dashashwamedh+Ghat&city=Varanasi&w=1200&redirect=true',
    place: 'Dashashwamedh Ghat, Varanasi',
    date: '19 OCT 2025 • 18:45',
    coordinates: '25.3076° N, 83.0107° E',
    note: 'Brass lamps in circular rhythm; camphor smoke over dark water.',
    aspect: 'aspect-[16/10]',
    speed: 1.2,
    layoutClass: 'col-span-12 md:col-span-7',
  },
  {
    id: 'mem-3',
    image: '/api/places/photo?name=Ganges+River&city=Varanasi&w=1000&redirect=true',
    place: 'Old City Alleys, Varanasi',
    date: '20 OCT 2025 • 11:15',
    coordinates: '25.3112° N, 83.0134° E',
    note: 'Clay cups resting on limestone benches while bells toll.',
    aspect: 'aspect-square',
    speed: 1.5,
    layoutClass: 'col-span-12 md:col-span-4 md:-translate-y-12',
  },
  {
    id: 'mem-4',
    image: '/api/places/photo?name=Amber+Fort&city=Jaipur&w=1200&redirect=true',
    place: 'Sheesh Mahal, Jaipur',
    date: '24 OCT 2025 • 16:20',
    coordinates: '26.9855° N, 75.8513° E',
    note: 'Mirrored plaster reflecting a single candle into a thousand stars.',
    aspect: 'aspect-[4/5]',
    speed: 0.9,
    layoutClass: 'col-span-12 md:col-span-4 md:translate-y-6',
  },
  {
    id: 'mem-5',
    image: '/api/places/photo?name=Vembanad+Lake&city=Kerala&w=1400&redirect=true',
    place: 'Vembanad Lake, Kerala',
    date: '02 NOV 2025 • 17:50',
    coordinates: '9.5916° N, 76.4383° E',
    note: 'Silent water ripples gold before monsoon clouds gather.',
    aspect: 'aspect-[16/9]',
    speed: 1.1,
    layoutClass: 'col-span-12 md:col-span-4 md:translate-y-16',
  },
];

export default function RememberMemoryField() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      // Restrained Parallax Depth
      const cards = cardsRef.current?.querySelectorAll('.memory-card-wrapper') || [];
      cards.forEach((card, i) => {
        const speed = MEMORIES[i]?.speed || 1;
        gsap.to(card, {
          yPercent: (speed - 1) * 30,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="remember"
      className="relative w-full bg-paper-light text-naviigo-text py-28 md:py-44 px-6 md:px-12 border-b border-naviigo-brown/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* ── Section Header ───────────────────────────────────── */}
        <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-naviigo-text/50 mb-4">
          <span className="text-naviigo-orange font-bold">06</span>
          <span className="w-8 h-[1px] bg-naviigo-brown/20" />
          <span>CHAPTER / REMEMBER</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-20 md:mb-28">
          <div className="md:col-span-8">
            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.96] tracking-tightest uppercase text-naviigo-brown">
              EVERY JOURNEY
              <span className="block text-naviigo-orange ml-[3%] sm:ml-[6%]">
                LEAVES A TRAIL.
              </span>
            </h2>
          </div>
          <div className="md:col-span-4">
            <p className="font-sans text-sm md:text-base text-naviigo-text/75 leading-relaxed">
              Coordinates, timestamps, and unspoken observations. Keep the memory intact, making the next departure lighter and more intuitive.
            </p>
          </div>
        </div>

        {/* ── Asymmetric Memory Field (Varying Weights & Ratios) ── */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start"
        >
          {MEMORIES.map((item) => (
            <div
              key={item.id}
              className={`memory-card-wrapper ${item.layoutClass} will-change-transform group`}
            >
              <div className="bg-paper-warm p-4 sm:p-5 rounded-2xl shadow-paper border border-naviigo-brown/10 transition-transform duration-500 group-hover:-translate-y-1">
                {/* Image Frame */}
                <div className={`relative w-full ${item.aspect} rounded-xl overflow-hidden bg-paper-bone`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.place}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                </div>

                {/* Restrained Metadata */}
                <div className="mt-4 flex flex-col justify-between">
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="font-semibold text-naviigo-brown font-display text-base">
                      {item.place}
                    </span>
                    <span className="text-naviigo-text/50 text-[10px]">
                      {item.date}
                    </span>
                  </div>

                  <p className="font-sans text-xs text-naviigo-text/70 mt-1.5 leading-relaxed italic">
                    “{item.note}”
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-naviigo-brown/10 flex items-center justify-between text-[10px] font-mono text-naviigo-text/50">
                    <span>{item.coordinates}</span>
                    <span className="text-naviigo-orange font-semibold">JOURNEY SAVED</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
