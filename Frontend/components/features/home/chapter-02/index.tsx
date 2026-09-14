'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import JourneyPathChapter02 from './JourneyPathChapter02';
import { TornPaperTransition } from '@/components/shared/TornPaper';

interface RouteCard {
  number: string;
  badge: number;
  name: string;
  category: string;
  region: string;
  narrative: string;
  primaryImage: string;
}

const ROUTES: RouteCard[] = [
  {
    number: '01',
    badge: 1,
    name: 'LADAKH',
    category: 'END-TO-END EXPEDITION MANAGEMENT',
    region: 'High Himalayas · 3,500m Plateau',
    narrative: 'Where winds carve red sandstone and high-altitude monasteries keep pace with centuries. Flights, transfers, itineraries — handled seamlessly.',
    primaryImage: '/api/places/photo?name=Nubra+Valley&city=Ladakh&w=1400&redirect=true',
  },
  {
    number: '02',
    badge: 2,
    name: 'VARANASI',
    category: '24/7 CLIENT ASSISTANCE',
    region: 'Sacred River Bend · Uttar Pradesh',
    narrative: 'Dawn oars cutting through river mist. The oldest continuous human ritual in motion, with real people always reachable.',
    primaryImage: '/api/places/photo?name=Dashashwamedh+Ghat&city=Varanasi&w=1600&redirect=true',
  },
  {
    number: '03',
    badge: 3,
    name: 'KERALA',
    category: 'BESPOKE CURATION & CARE',
    region: 'Vembanad Backwaters · Palm Canopy',
    narrative: 'Silent waterways where wooden kettuvallams drift under coconut groves at twilight, shaped around your rhythm.',
    primaryImage: '/api/places/photo?name=Vembanad+Lake&city=Kerala&w=1600&redirect=true',
  },
  {
    number: '04',
    badge: 4,
    name: 'UDAIPUR',
    category: 'UNFILTERED DISCOVERY',
    region: 'Lake Pichola · Mewar Heritage',
    narrative: 'Sun-drenched marble courtyards, private boat access, and living royal traditions preserved in quiet stillness.',
    primaryImage: '/api/places/photo?name=Lake+Pichola&city=Udaipur&w=1600&redirect=true',
  },
];

export default function Chapter02Discover() {
  const chapterRef = useRef<HTMLElement>(null);

  // Dedicated refs for the 4 badges to calculate exact SVG curve points dynamically
  const badge1Ref = useRef<HTMLDivElement>(null);
  const badge2Ref = useRef<HTMLDivElement>(null);
  const badge3Ref = useRef<HTMLDivElement>(null);
  const badge4Ref = useRef<HTMLDivElement>(null);

  const badgeRefs = [badge1Ref, badge2Ref, badge3Ref, badge4Ref];

  return (
    <section
      ref={chapterRef}
      id="how-we-support-section"
      className="relative w-full bg-paper-warm text-naviigo-brown overflow-hidden select-none py-28 sm:py-36 md:py-44"
    >
      {/* Global CSS for dynamic badge illumination when reached by the journey line */}
      <style jsx global>{`
        .badge-node {
          background-color: #241A15;
          color: #FAF6F0;
          border-color: rgba(255, 255, 255, 0.25);
          transition: background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .badge-node.badge-illuminated {
          background-color: #EC6426 !important;
          color: #FFFFFF !important;
          border-color: #FFFFFF !important;
          transform: scale(1.18) !important;
          box-shadow: 0 0 24px rgba(236, 100, 38, 0.7), 0 4px 14px rgba(0, 0, 0, 0.35) !important;
        }
      `}</style>

      {/* ── Photo to Paper Transition Rising into Chapter 02 ─────── */}
      <TornPaperTransition
        color="#FAF6F0"
        variant={0}
        className="absolute top-0 left-0 w-full z-20 pointer-events-none"
      />

      {/* ── Background Editorial Grid Lines ────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
        <div className="w-full h-full max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 border-l border-r border-[#2D1810]/10">
          <div className="border-r border-[#2D1810]/10 h-full" />
          <div className="border-r border-[#2D1810]/10 h-full" />
          <div className="border-r border-[#2D1810]/10 h-full hidden md:block" />
          <div className="h-full hidden md:block" />
        </div>
      </div>

      {/* ── Topographic Contour Map Lines ─────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-25"
        viewBox="0 0 1000 1200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 60,140 C 200,120 310,240 460,190 C 620,140 760,220 950,160 M 40,400 C 190,360 290,480 430,420 C 590,360 720,460 960,390 M 80,700 C 220,660 360,760 510,710 C 670,660 810,770 960,720 M 50,1000 C 200,960 340,1060 480,1010 C 640,960 780,1060 940,1020"
          fill="none"
          stroke="#2D1810"
          strokeWidth="0.8"
          strokeDasharray="4 6"
        />
        {/* Subtle coastline contour flourishes */}
        <path
          d="M 720,120 C 760,150 820,180 860,140 C 890,110 930,130 960,160 M 120,440 C 150,470 200,490 230,460 C 260,430 300,450 330,480"
          fill="none"
          stroke="#2D1810"
          strokeWidth="0.6"
          opacity="0.6"
        />
      </svg>

      {/* ── ONE DYNAMIC CHAPTER-LEVEL SVG OVERLAY JOURNEY LINE ─────── */}
      <JourneyPathChapter02
        sectionRef={chapterRef}
        badgeRefs={badgeRefs}
      />

      {/* ── SECTION HEADER (Matches Reference Screenshot 1 & 2) ───── */}
      <div className="text-center max-w-4xl mx-auto mb-20 sm:mb-28 md:mb-36 px-6 relative z-20">
        <div className="font-mono text-[10px] md:text-xs tracking-[0.35em] uppercase text-naviigo-brown/60 mb-4">
          02 / DISCOVER · THE CONNECTED JOURNEY
        </div>
        <h2 className="font-serif font-light text-4xl sm:text-6xl md:text-7xl tracking-tight uppercase text-naviigo-brown leading-[0.95]">
          HOW WE SUPPORT <br />
          <span className="font-semibold text-naviigo-brown">EVERY JOURNEY</span>
        </h2>
        <p className="mt-5 font-sans text-base sm:text-lg text-naviigo-brown/70 font-light leading-relaxed max-w-xl mx-auto">
          We travel the routes before proposing them. Every destination is selected for character, rhythm, and quiet authenticity.
        </p>
      </div>

      {/* ── ALTERNATING DESTINATION CARDS CONTAINER ────────────────── */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-12 relative z-20">
        
        {/* ── CARD 1: RIGHT SIDE (Ladakh) ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 mb-36 sm:mb-44 md:mb-52 items-start">
          <div className="md:col-start-7 md:col-span-6 lg:col-start-8 lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-visible shadow-xl bg-paper-light border border-[#EADFD4] group">
              <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ROUTES[0].primaryImage}
                  alt={ROUTES[0].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/places/photo?name=Thiksey+Monastery&city=Ladakh&w=1200&redirect=true';
                  }}
                />
              </div>

              {/* Circular Badge 1 pinned to top-right corner of card */}
              <div
                ref={badge1Ref}
                id="badge-card-1"
                className="badge-node absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono text-xs sm:text-sm font-bold shadow-lg z-30 border-2"
              >
                1
              </div>
            </div>

            {/* Editorial Route Info */}
            <div className="mt-6 space-y-2">
              <div className="font-mono text-[11px] text-brand-primary uppercase tracking-[0.2em] font-semibold">
                {ROUTES[0].category}
              </div>
              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-naviigo-brown uppercase tracking-tight">
                {ROUTES[0].name}
              </h3>
              <p className="text-sm sm:text-base text-naviigo-brown/75 font-sans font-light leading-relaxed">
                {ROUTES[0].narrative}
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-brand-primary font-bold hover:translate-x-1 transition-transform pt-2"
              >
                <span>EXPLORE ROUTE DOSSIER</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── CARD 2: LEFT SIDE (Varanasi) ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 mb-36 sm:mb-44 md:mb-52 items-start">
          <div className="md:col-start-1 md:col-span-6 lg:col-start-1 lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-visible shadow-xl bg-paper-light border border-[#EADFD4] group">
              <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ROUTES[1].primaryImage}
                  alt={ROUTES[1].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/places/photo?name=Ganges+River&city=Varanasi&w=1200&redirect=true';
                  }}
                />
              </div>

              {/* Circular Badge 2 pinned to top-right corner of card */}
              <div
                ref={badge2Ref}
                id="badge-card-2"
                className="badge-node absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono text-xs sm:text-sm font-bold shadow-lg z-30 border-2"
              >
                2
              </div>
            </div>

            {/* Editorial Route Info */}
            <div className="mt-6 space-y-2">
              <div className="font-mono text-[11px] text-brand-primary uppercase tracking-[0.2em] font-semibold">
                {ROUTES[1].category}
              </div>
              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-naviigo-brown uppercase tracking-tight">
                {ROUTES[1].name}
              </h3>
              <p className="text-sm sm:text-base text-naviigo-brown/75 font-sans font-light leading-relaxed">
                {ROUTES[1].narrative}
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-brand-primary font-bold hover:translate-x-1 transition-transform pt-2"
              >
                <span>EXPLORE ROUTE DOSSIER</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── CARD 3: RIGHT SIDE (Kerala) ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 mb-36 sm:mb-44 md:mb-52 items-start">
          <div className="md:col-start-7 md:col-span-6 lg:col-start-8 lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-visible shadow-xl bg-paper-light border border-[#EADFD4] group">
              <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ROUTES[2].primaryImage}
                  alt={ROUTES[2].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/places/photo?name=Alleppey+Backwaters&city=Kerala&w=1200&redirect=true';
                  }}
                />
              </div>

              {/* Circular Badge 3 pinned to top-right corner of card */}
              <div
                ref={badge3Ref}
                id="badge-card-3"
                className="badge-node absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono text-xs sm:text-sm font-bold shadow-lg z-30 border-2"
              >
                3
              </div>
            </div>

            {/* Editorial Route Info */}
            <div className="mt-6 space-y-2">
              <div className="font-mono text-[11px] text-brand-primary uppercase tracking-[0.2em] font-semibold">
                {ROUTES[2].category}
              </div>
              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-naviigo-brown uppercase tracking-tight">
                {ROUTES[2].name}
              </h3>
              <p className="text-sm sm:text-base text-naviigo-brown/75 font-sans font-light leading-relaxed">
                {ROUTES[2].narrative}
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-brand-primary font-bold hover:translate-x-1 transition-transform pt-2"
              >
                <span>EXPLORE ROUTE DOSSIER</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── CARD 4: LEFT SIDE (Udaipur) ─────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 mb-20 items-start">
          <div className="md:col-start-1 md:col-span-6 lg:col-start-1 lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-visible shadow-xl bg-paper-light border border-[#EADFD4] group">
              <div className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ROUTES[3].primaryImage}
                  alt={ROUTES[3].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/places/photo?name=City+Palace&city=Udaipur&w=1200&redirect=true';
                  }}
                />
              </div>

              {/* Circular Badge 4 pinned to top-right corner of card */}
              <div
                ref={badge4Ref}
                id="badge-card-4"
                className="badge-node absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-mono text-xs sm:text-sm font-bold shadow-lg z-30 border-2"
              >
                4
              </div>
            </div>

            {/* Editorial Route Info */}
            <div className="mt-6 space-y-2">
              <div className="font-mono text-[11px] text-brand-primary uppercase tracking-[0.2em] font-semibold">
                {ROUTES[3].category}
              </div>
              <h3 className="font-serif font-bold text-2xl sm:text-3xl text-naviigo-brown uppercase tracking-tight">
                {ROUTES[3].name}
              </h3>
              <p className="text-sm sm:text-base text-naviigo-brown/75 font-sans font-light leading-relaxed">
                {ROUTES[3].narrative}
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-brand-primary font-bold hover:translate-x-1 transition-transform pt-2"
              >
                <span>EXPLORE ROUTE DOSSIER</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
