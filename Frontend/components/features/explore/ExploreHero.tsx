'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import Image from 'next/image';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

export const ExploreHero = memo(({
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onSelectCategory,
  categoryCounts = {},
}: Props) => {
  return (
    <div className="relative w-full overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-20 border-b border-[#EADFD4] bg-paper-warm text-naviigo-brown transition-colors">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12">
        {/* ── Top Monogram & Coordinates ────────────────────────────── */}
        <div className="flex items-center justify-between font-mono text-[10px] sm:text-xs tracking-[0.25em] uppercase text-naviigo-brown/60 mb-8 sm:mb-12">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            <span className="font-bold text-naviigo-brown">01 / DISCOVER</span>
            <span className="hidden sm:inline text-naviigo-brown/30">|</span>
            <span className="hidden sm:inline">DIGITAL TRAVEL ATLAS</span>
          </div>
          <div className="tracking-widest font-medium">
            28°36&apos;N · 77°12&apos;E
          </div>
        </div>

        {/* ── Asymmetric Hero Composition ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16 sm:mb-20">
          {/* Left Column: Monumental Headline crossing near the image edge */}
          <div className="lg:col-span-6 z-10">
            <h1 className="font-display font-black text-3xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.94] sm:leading-[0.92] tracking-tightest uppercase text-naviigo-brown mb-6">
              WHERE DO
              <span className="block text-brand-primary">YOU WANT</span>
              <span className="block">TO DISAPPEAR</span>
              <span className="block text-naviigo-brown/30">TO?</span>
            </h1>

            <p className="font-sans text-sm sm:text-base md:text-lg text-naviigo-brown/75 font-light max-w-lg leading-relaxed mb-8">
              Open the roadbook. Authenticated passes, secluded temple ghats, and coastal backwaters documented in person across the Indian subcontinent.
            </p>

            {/* Editorial Underlined Search */}
            <div className="max-w-xl">
              <label
                htmlFor="atlas-search-input"
                className="block font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-brand-primary font-bold mb-3"
              >
                WHERE ARE YOU THINKING?
              </label>
              <div className="relative flex items-center border-b-2 border-naviigo-brown/20 focus-within:border-brand-primary pb-2 transition-colors">
                <input
                  id="atlas-search-input"
                  type="text"
                  placeholder="Start typing a place, region, or landscape..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full bg-transparent border-none outline-none font-display font-bold text-base sm:text-xl md:text-2xl text-naviigo-brown placeholder:text-naviigo-brown/30 placeholder:font-sans placeholder:font-light min-h-[44px]"
                />
                {searchQuery ? (
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-2 text-xs font-mono text-naviigo-brown/50 hover:text-brand-primary uppercase shrink-0 px-2 py-2 min-h-[44px] flex items-center justify-center touch-manipulation"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <ArrowRight className="ml-2 w-5 h-5 text-brand-primary shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 60% Visual Anchor (Asymmetric Destination Imagery) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-naviigo-brown/15 border border-[#EADFD4] group">
              <Image
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85"
                alt="Nubra Valley High Pass"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-103 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Geographic Plate Overlay */}
              <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 text-white flex items-end justify-between">
                <div>
                  <span className="font-mono text-[10px] tracking-widest uppercase text-brand-secondary font-bold block mb-1">
                    FEATURED HORIZON · 3,500M ALTITUDE
                  </span>
                  <div className="font-display font-black text-lg sm:text-3xl uppercase tracking-tight">
                    Nubra &amp; Pangong Tso
                  </div>
                  <div className="font-mono text-xs text-white/80 mt-0.5">
                    Ladakh, India
                  </div>
                </div>
                <div className="hidden sm:block font-mono text-xs text-white/60 text-right">
                  AUTUMN RUN<br />07 DAYS
                </div>
              </div>
            </div>

            {/* Subtle floating coordinate stamp */}
            <div className="absolute -top-4 -right-4 bg-paper-light px-4 py-2 rounded-xl border border-[#EADFD4] shadow-sm font-mono text-[10px] uppercase tracking-wider text-naviigo-brown hidden md:block">
              INDEX REF // 01-ATLAS
            </div>
          </div>
        </div>

        {/* ── Lightweight Editorial Index ──────────────────────────── */}
        <div className="pt-6 border-t border-[#EADFD4]">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-naviigo-brown/50">
              FILTER REGIONAL HORIZONS
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs sm:text-sm tracking-wider uppercase">
            {categories.map((c) => {
              const isActive = activeCategory === c;
              const count = categoryCounts[c] ?? 0;
              const formattedCount = String(count).padStart(2, '0');

              return (
                <button
                  key={c}
                  onClick={() => onSelectCategory(c)}
                  className={`group relative py-2.5 transition-all duration-200 flex items-center gap-2 min-h-[44px] touch-manipulation ${
                    isActive
                      ? 'text-brand-primary font-bold'
                      : 'text-naviigo-brown/70 hover:text-naviigo-brown'
                  }`}
                >
                  <span>{c}</span>
                  <span className={`text-[10px] ${isActive ? 'text-brand-primary' : 'text-naviigo-brown/40'}`}>
                    / {formattedCount}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

ExploreHero.displayName = 'ExploreHero';
export default ExploreHero;
