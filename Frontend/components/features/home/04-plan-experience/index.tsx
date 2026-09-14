'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { gsap } from 'gsap';

interface SensationsItem {
  id: string;
  category: string;
  categoryTag: string;
  destination: string;
  coordinates: string;
  journeyTitle: string;
  subtitle: string;
  tag: string;
  image: string;
  planSlug: string;
}

const CATEGORIES = [
  { id: 'ALL', label: 'ALL', count: '06' },
  { id: 'MOUNTAINS', label: 'MOUNTAINS', count: '02' },
  { id: 'COAST', label: 'COAST', count: '01' },
  { id: 'CULTURE', label: 'CULTURE', count: '02' },
  { id: 'DESERT', label: 'DESERT', count: '01' },
  { id: 'WILDLIFE', label: 'WILDLIFE', count: '01' },
  { id: 'SLOW TRAVEL', label: 'SLOW TRAVEL', count: '02' },
];

const DESTINATIONS: SensationsItem[] = [
  {
    id: 'ladakh-01',
    category: 'MOUNTAINS',
    categoryTag: 'HIGH HIMALAYAS',
    destination: 'LADAKH',
    coordinates: '34.15° N, 77.57° E',
    journeyTitle: 'THE TRANS-HIMALAYAN CORRIDOR',
    subtitle: 'Where ancient monasteries guard high mountain passes and silent glacier lakes at 3,500m.',
    tag: 'HIGH ALTITUDE · 3,500M',
    image: '/api/places/photo?name=Nubra+Valley&city=Ladakh&w=1600&redirect=true',
    planSlug: 'ladakh',
  },
  {
    id: 'varanasi-02',
    category: 'CULTURE',
    categoryTag: 'SACRED RIVER',
    destination: 'VARANASI',
    coordinates: '25.31° N, 82.97° E',
    journeyTitle: 'RIVER OF TIMELESS RITUAL',
    subtitle: 'Dawn oars slicing through river mist. The oldest continuous human sanctuary in living motion.',
    tag: 'SACRED GEOGRAPHY · GHATS',
    image: '/api/places/photo?name=Dashashwamedh+Ghat&city=Varanasi&w=1600&redirect=true',
    planSlug: 'varanasi',
  },
  {
    id: 'kerala-03',
    category: 'COAST',
    categoryTag: 'CANOPY WATERWAYS',
    destination: 'KERALA',
    coordinates: '9.49° N, 76.33° E',
    journeyTitle: 'VEMBANAD SILENT WATERS',
    subtitle: 'Drifting under palm canopies where wooden kettuvallams navigate serene tidal estuaries at twilight.',
    tag: 'COASTAL WATERWAY · SLOW DRIFT',
    image: '/api/places/photo?name=Vembanad+Lake&city=Kerala&w=1600&redirect=true',
    planSlug: 'kerala',
  },
  {
    id: 'rajasthan-04',
    category: 'DESERT',
    categoryTag: 'GOLDEN DUNES',
    destination: 'RAJASTHAN',
    coordinates: '26.91° N, 75.78° E',
    journeyTitle: 'CITADELS OF THE THAR DESERT',
    subtitle: 'Sandstone bastions rising above sunlit dunes and royal havelis carved in living stone.',
    tag: 'DESERT CITADEL · HERITAGE',
    image: '/api/places/photo?name=Jaisalmer+Fort&city=Rajasthan&w=1600&redirect=true',
    planSlug: 'rajasthan',
  },
  {
    id: 'kaziranga-05',
    category: 'WILDLIFE',
    categoryTag: 'FLOODPLAINS',
    destination: 'KAZIRANGA',
    coordinates: '26.57° N, 93.17° E',
    journeyTitle: 'THE BRAHMAPUTRA WETLANDS',
    subtitle: 'Tall elephant grass and mist-covered wetlands where rare wildlife roams undisturbed across the delta.',
    tag: 'NATIONAL RESERVE · BIOSPHERE',
    image: '/api/places/photo?name=Kaziranga+National+Park&city=Assam&w=1600&redirect=true',
    planSlug: 'kaziranga',
  },
  {
    id: 'spiti-06',
    category: 'SLOW TRAVEL',
    categoryTag: 'ALPINE RETREAT',
    destination: 'SPITI VALLEY',
    coordinates: '32.22° N, 77.18° E',
    journeyTitle: 'CEDAR TRAILS OF THE COLD DESERT',
    subtitle: 'Centuries-old stone hamlets and high passes where quiet mountain trails unfold at your own pace.',
    tag: 'COLD DESERT · RETREAT',
    image: '/api/places/photo?name=Spiti+Valley&city=Himachal&w=1600&redirect=true',
    planSlug: 'spiti',
  },
];

export default function EditorialSensationsCarousel() {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentTranslateRef = useRef(0);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Filter items based on selected category
  const filteredItems = activeCategory === 'ALL'
    ? DESTINATIONS
    : DESTINATIONS.filter((item) =>
        activeCategory === 'SLOW TRAVEL'
          ? item.category === 'SLOW TRAVEL' || item.category === 'COAST'
          : item.category === activeCategory
      );

  // Keep active index within bounds when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [activeCategory]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
  };

  // Drag / Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const endX = e.changedTouches[0].clientX;
    const diff = startXRef.current - endX;
    if (diff > 50) handleNext();
    else if (diff < -50) handlePrev();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = startXRef.current - e.clientX;
    if (diff > 60) handleNext();
    else if (diff < -60) handlePrev();
  };

  return (
    <section className="relative w-full bg-[#FAF6F0] py-24 sm:py-32 overflow-hidden select-none">
      
      {/* ── SECTION HEADER ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 mb-12 sm:mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#EADFD4]">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase text-naviigo-brown/60 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#EC6426]" />
              <span>03 / EXPEDITIONS</span>
              <span className="text-naviigo-brown/30">/</span>
              <span>TERRITORIES</span>
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl md:text-6xl uppercase tracking-tight text-naviigo-brown">
              TRAVEL <span className="text-[#EC6426]">SENSATIONS.</span>
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-naviigo-brown/50 uppercase tracking-widest hidden sm:inline">
              {String(activeIndex + 1).padStart(2, '0')} / {String(filteredItems.length).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                aria-label="Previous destination"
                className="w-10 h-10 rounded-full border border-[#EADFD4] bg-white flex items-center justify-center text-naviigo-brown hover:bg-naviigo-brown hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next destination"
                className="w-10 h-10 rounded-full border border-[#EADFD4] bg-white flex items-center justify-center text-naviigo-brown hover:bg-naviigo-brown hover:text-white transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── REFINED TYPOGRAPHY-BASED CATEGORY NAVIGATION ───────────── */}
        {/* No chunky pills: pure editorial typography with subtle orange active indicator */}
        <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto pt-6 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative pb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors whitespace-nowrap ${
                  isActive ? 'text-[#EC6426] font-bold' : 'text-naviigo-brown/60 hover:text-naviigo-brown'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] text-naviigo-brown/40">/{cat.count}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#EC6426]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EDITORIAL CAROUSEL STAGE ───────────────────────────────── */}
      <div
        ref={carouselTrackRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing px-4 sm:px-8 py-4"
      >
        <div className="flex items-center justify-center min-h-[520px] sm:min-h-[580px] relative">
          {filteredItems.map((item, index) => {
            const diff = index - activeIndex;
            const isActive = diff === 0;
            const isPrev = diff === -1 || (activeIndex === 0 && index === filteredItems.length - 1);
            const isNext = diff === 1 || (activeIndex === filteredItems.length - 1 && index === 0);

            // Hide cards that are far away
            if (!isActive && !isPrev && !isNext) return null;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isPrev) handlePrev();
                  if (isNext) handleNext();
                }}
                className={`transition-all duration-700 ease-out absolute ${
                  isActive
                    ? 'z-20 w-[88vw] sm:w-[74vw] max-w-[880px] h-[500px] sm:h-[580px] scale-100 opacity-100'
                    : isPrev
                    ? 'z-10 w-[78vw] sm:w-[62vw] max-w-[760px] h-[440px] sm:h-[500px] scale-[0.88] opacity-40 -translate-x-[55%] sm:-translate-x-[62%]'
                    : 'z-10 w-[78vw] sm:w-[62vw] max-w-[760px] h-[440px] sm:h-[500px] scale-[0.88] opacity-40 translate-x-[55%] sm:translate-x-[62%]'
                }`}
              >
                <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-[#1B1715] group">
                  {/* Destination Photography */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.destination}
                    className="w-full h-full object-cover object-center brightness-[0.92] contrast-[1.04] transition-transform duration-1000 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Editorial Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                  {/* Top Metadata Badges */}
                  <div className="absolute top-6 sm:top-8 left-6 sm:left-8 right-6 sm:right-8 flex items-center justify-between pointer-events-none z-10">
                    <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/80 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                      {item.tag}
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs text-white/70">
                      {item.coordinates}
                    </span>
                  </div>

                  {/* Active Card Bottom Editorial Content */}
                  <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 z-10">
                    <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#EC6426] mb-1.5 font-bold">
                      {item.destination} · {item.categoryTag}
                    </p>

                    <h3 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight leading-[0.98] mb-3">
                      {item.journeyTitle}
                    </h3>

                    <p className="font-sans text-xs sm:text-sm text-white/75 font-light max-w-xl line-clamp-2 leading-relaxed mb-6">
                      {item.subtitle}
                    </p>

                    <Link
                      href={`/plan?destination=${encodeURIComponent(item.destination)}`}
                      className="inline-flex items-center gap-3 px-5 sm:px-6 py-2.5 rounded-lg bg-[#EC6426] text-white font-mono text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-naviigo-brown transition-all duration-300 shadow-md"
                    >
                      <span>BUILD THIS ROUTE</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
