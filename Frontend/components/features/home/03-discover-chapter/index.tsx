'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface RouteItem {
  number: string;
  name: string;
  region: string;
  coordinates: string;
  narrative: string;
  primaryImage: string;
  secondaryImage?: string;
  proportion: 'portrait' | 'landscape' | 'wide';
}

const ROUTES: RouteItem[] = [
  {
    number: '01',
    name: 'LADAKH',
    region: 'High Himalayas · 3,500m Plateau',
    coordinates: '34.15° N, 77.57° E',
    narrative: 'Where winds carve red sandstone and high-altitude monasteries keep pace with centuries.',
    primaryImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1400&q=85',
    secondaryImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=85',
    proportion: 'portrait',
  },
  {
    number: '02',
    name: 'VARANASI',
    region: 'Uttar Pradesh · Sacred River Bend',
    coordinates: '25.31° N, 82.97° E',
    narrative: 'Dawn oars cutting through river mist. The oldest continuous human ritual in motion.',
    primaryImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=85',
    proportion: 'landscape',
  },
  {
    number: '03',
    name: 'KERALA',
    region: 'Vembanad Backwaters · Palm Canopy',
    coordinates: '9.49° N, 76.33° E',
    narrative: 'Silent waterways where wooden kettuvallams drift under coconut groves at twilight.',
    primaryImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=85',
    secondaryImage: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=85',
    proportion: 'wide',
  },
];

export default function DiscoverChapter() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      id="discover"
      className="relative w-full bg-paper-light text-naviigo-text py-28 md:py-40 overflow-hidden"
    >
      {/* ── Continuous Naviigo Journey Line Weaving Behind Cards ─ */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 hidden lg:block">
        <svg
          viewBox="0 0 1440 1800"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Journey Line: loops gracefully across the negative space */}
          <path
            d="M 280,100 C 350,300 750,220 850,550 S 400,900 320,1150 S 900,1400 950,1750"
            stroke="#EC6426"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="6 8"
            strokeOpacity="0.4"
          />

          {/* Background Cartographic Depth Wave */}
          <path
            d="M 100,200 C 450,150 600,450 1100,320 S 1350,600 1500,500"
            stroke="#632713"
            strokeWidth="0.75"
            strokeOpacity="0.08"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* ── Section Title & Asymmetric Header ─────────────────── */}
        <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-naviigo-text/50 mb-4">
          <span className="text-naviigo-orange font-bold">02</span>
          <span className="w-8 h-[1px] bg-naviigo-brown/20" />
          <span>CHAPTER / DISCOVER</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-20 md:mb-28">
          <div className="md:col-span-8">
            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.98] tracking-tightest uppercase text-naviigo-brown">
              Curated Horizons.
              <span className="block text-naviigo-orange font-normal mt-1">Routes We Know Personally.</span>
            </h2>
          </div>
          <div className="md:col-span-4">
            <p className="font-sans text-sm md:text-base text-naviigo-text/75 leading-relaxed font-light">
              We travel the routes before proposing them. Every destination is selected for character, rhythm, and quiet authenticity.
            </p>
          </div>
        </div>

        {/* ── Custom Naviigo Route Gallery Spreads ───────────────── */}

        {/* Route 01: Ladakh (Asymmetric Vertical Focus) */}
        <div className="relative mb-28 md:mb-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Primary Portrait Image */}
            <div className="lg:col-span-7 relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-naviigo-brown/10 bg-paper-warm border border-naviigo-brown/10 z-20 group">
              <Image
                src={ROUTES[0].primaryImage}
                alt={ROUTES[0].name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover group-hover:scale-103 transition-transform duration-700"
              />
              <div className="absolute top-6 left-6 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md font-mono text-[10px] tracking-widest uppercase text-naviigo-brown font-bold shadow-sm">
                WAYPOINT {ROUTES[0].number} · {ROUTES[0].coordinates}
              </div>
            </div>

            {/* Editorial Context & Secondary Image */}
            <div className="lg:col-span-5 flex flex-col justify-between pl-0 lg:pl-6 space-y-6 z-20">
              {ROUTES[0].secondaryImage && (
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-md border border-naviigo-brown/10 w-4/5 hidden sm:block">
                  <Image
                    src={ROUTES[0].secondaryImage}
                    alt="Ladakh monastery detail"
                    fill
                    sizes="350px"
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-naviigo-orange font-semibold mb-2">
                  {ROUTES[0].region}
                </p>
                <h3 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-naviigo-brown mb-4">
                  {ROUTES[0].name}
                </h3>
                <p className="font-sans text-sm sm:text-base text-naviigo-text/75 font-light leading-relaxed mb-6">
                  {ROUTES[0].narrative}
                </p>

                <Link
                  href="/explore?q=ladakh"
                  className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-naviigo-orange hover:text-naviigo-brown transition-colors group"
                >
                  <span>Examine Field Route</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Route 02: Varanasi (Wide Cinematic Spread) */}
        <div className="relative mb-28 md:mb-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Context Left */}
            <div className="lg:col-span-5 order-2 lg:order-1 pr-0 lg:pr-6 space-y-4 z-20">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest uppercase text-naviigo-brown/60">
                <span className="w-2 h-2 rounded-full bg-naviigo-orange" />
                <span>WAYPOINT {ROUTES[1].number} · {ROUTES[1].coordinates}</span>
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-naviigo-orange font-semibold">
                {ROUTES[1].region}
              </p>
              <h3 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-naviigo-brown">
                {ROUTES[1].name}
              </h3>
              <p className="font-sans text-sm sm:text-base text-naviigo-text/75 font-light leading-relaxed mb-6">
                {ROUTES[1].narrative}
              </p>
              <Link
                href="/explore?q=varanasi"
                className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-naviigo-orange hover:text-naviigo-brown transition-colors group"
              >
                <span>Examine Field Route</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            {/* Primary Image Right */}
            <div className="lg:col-span-7 order-1 lg:order-2 relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl shadow-naviigo-brown/10 bg-paper-warm border border-naviigo-brown/10 z-20 group">
              <Image
                src={ROUTES[1].primaryImage}
                alt={ROUTES[1].name}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover group-hover:scale-103 transition-transform duration-700"
              />
            </div>
          </div>
        </div>

        {/* Route 03: Kerala (Panoramic Staggered Finish) */}
        <div className="relative">
          <div className="relative aspect-[21/9] sm:aspect-[24/10] rounded-3xl overflow-hidden shadow-2xl shadow-naviigo-brown/10 bg-paper-warm border border-naviigo-brown/10 z-20 group mb-8">
            <Image
              src={ROUTES[2].primaryImage}
              alt={ROUTES[2].name}
              fill
              sizes="100vw"
              className="object-cover group-hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8 text-white">
              <span className="font-mono text-[10px] sm:text-xs tracking-widest uppercase text-brand-secondary font-bold block mb-1">
                WAYPOINT {ROUTES[2].number} · {ROUTES[2].coordinates}
              </span>
              <h3 className="font-display font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight">
                {ROUTES[2].name}
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <p className="font-sans text-sm md:text-base text-naviigo-text/75 font-light max-w-2xl">
              {ROUTES[2].narrative}
            </p>
            <Link
              href="/explore?q=kerala"
              className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-naviigo-orange hover:text-naviigo-brown transition-colors shrink-0 group"
            >
              <span>Examine Field Route</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
