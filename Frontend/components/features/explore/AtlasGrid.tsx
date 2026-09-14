'use client';

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, Compass, Sparkles } from 'lucide-react';
import PlaceImage from '@/components/shared/PlaceImage';
import type { Destination } from '@/components/features/explore/exploreData';

export interface BentoLikeTarget {
  id?: number | string;
  name: string;
  state: string;
  image: string;
}

interface Props {
  destinations: Destination[];
  total: number;
  liked: Set<number | string>;
  onToggleLike: (destination: BentoLikeTarget) => void;
  onSelect: (name: string) => void;
  onLoadMore: () => void;
  searchQuery: string;
  onReset: () => void;
}

export const AtlasGrid = memo(({
  destinations,
  total,
  liked,
  onToggleLike,
  onSelect,
  onLoadMore,
  searchQuery,
  onReset,
}: Props) => {
  const router = useRouter();
  const [transitioningDest, setTransitioningDest] = useState<Destination | null>(null);

  const handleDestinationClick = (e: React.MouseEvent, dest: Destination) => {
    e.preventDefault();
    onSelect(dest.name);
    setTransitioningDest(dest);
    setTimeout(() => {
      router.push(`/explore/${encodeURIComponent(dest.name)}`);
    }, 850);
  };

  return (
    <div className="relative w-full">
      {/* ── Editorial Atlas Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#EADFD4] pb-6 mb-12 sm:mb-16">
        <div>
          <div className="flex items-center gap-2 text-brand-primary font-mono text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>TERRITORIES & REGIONAL PLATES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-naviigo-brown tracking-tight uppercase">
            Travel Atlas
          </h2>
        </div>
        <div className="mt-4 sm:mt-0 font-mono text-xs text-naviigo-brown/60 flex items-center gap-3">
          <span>CATALOGUE: {total.toString().padStart(2, '0')} PLATES</span>
          {searchQuery && (
            <button
              onClick={onReset}
              className="text-brand-primary hover:underline font-bold tracking-wider uppercase text-[11px]"
            >
              Reset Query
            </button>
          )}
        </div>
      </div>

      {destinations.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-[#EADFD4] rounded-3xl p-12 bg-paper-light">
          <p className="font-display font-bold text-2xl text-naviigo-brown uppercase mb-2">
            No coordinates found
          </p>
          <p className="font-sans text-sm text-naviigo-brown/70 mb-6 max-w-sm mx-auto font-light">
            We couldn&apos;t find matching plates for &ldquo;{searchQuery}&rdquo;. Try another province, climate, or keyword.
          </p>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white text-xs font-mono font-bold tracking-widest uppercase rounded-full hover:bg-naviigo-brown transition-colors"
          >
            Show All Destinations
          </button>
        </div>
      ) : (
        /* ── Asymmetric Editorial Atlas Flow ── */
        <div className="relative space-y-16 sm:space-y-24">
          {/* Subtle connecting Journey Line spine through atlas plates */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-10 bottom-10 w-[1px] bg-gradient-to-b from-brand-primary/40 via-naviigo-brown/15 to-transparent pointer-events-none z-0" />

          {destinations.map((d, i) => {
            const indexFormatted = (i + 1).toString().padStart(2, '0');
            const pattern = i % 5;
            const isLiked = liked.has(d.id) || liked.has(String(d.id)) || liked.has(d.name);

            // Pattern 0: 65% Large Landscape offset left
            if (pattern === 0) {
              return (
                <article
                  key={d.id || d.name}
                  className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center group"
                >
                  <div className="lg:col-span-8">
                    <div
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="relative aspect-[16/10] sm:aspect-[16/9] rounded-3xl overflow-hidden cursor-pointer shadow-lg group-hover:shadow-2xl transition-all duration-500 bg-paper-dark border border-[#EADFD4]"
                    >
                      <PlaceImage
                        name={d.name}
                        city={d.state}
                        fallbackUrl={d.image}
                        asBackground
                        className="absolute inset-0 w-full h-full group-hover:scale-104 transition-transform duration-700 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                      {/* Top Plate Meta */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/95 backdrop-blur-md text-naviigo-brown rounded-full shadow-sm">
                          PLATE {indexFormatted} · {d.category}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(d);
                          }}
                          aria-label={`Save ${d.name} to bucket list`}
                          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isLiked ? 'fill-brand-primary text-brand-primary' : 'text-white'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Bottom Title on Image for Mobile */}
                      <div className="lg:hidden absolute bottom-5 left-5 right-5 text-white">
                        <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-1">
                          {d.name}
                        </h3>
                        <p className="font-mono text-xs text-white/80 uppercase">{d.state} · INDIA</p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Editorial Typographic Annotation */}
                  <div className="hidden lg:flex lg:col-span-4 flex-col justify-center pl-4">
                    <span className="font-mono text-xs font-bold text-brand-primary uppercase tracking-[0.25em] mb-2">
                      {indexFormatted} / REGIONAL FEATURE
                    </span>
                    <h3
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="font-display font-black text-4xl xl:text-5xl text-naviigo-brown uppercase tracking-tight group-hover:translate-x-2 transition-transform duration-300 cursor-pointer"
                    >
                      {d.name}
                    </h3>
                    <p className="font-mono text-xs text-naviigo-brown/60 uppercase tracking-widest mt-1 mb-4">
                      {d.state} · INDIA
                    </p>
                    <p className="font-sans text-sm text-naviigo-brown/75 font-light leading-relaxed mb-6 max-w-sm">
                      {d.tagline}. Best navigated during {d.bestTime}. Ideal window: {d.duration}.
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => handleDestinationClick(e, d)}
                        className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-primary hover:text-naviigo-brown transition-colors group-hover:gap-3"
                      >
                        EXPLORE PLATE <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            // Pattern 1: Small Portrait offset right (col-start-7 col-span-5)
            if (pattern === 1) {
              return (
                <article
                  key={d.id || d.name}
                  className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center group"
                >
                  <div className="hidden lg:flex lg:col-span-6 flex-col justify-center text-right pr-6">
                    <span className="font-mono text-xs font-bold text-naviigo-brown/50 uppercase tracking-[0.25em] mb-2">
                      {indexFormatted} / SANCTUARY
                    </span>
                    <h3
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="font-display font-black text-3xl xl:text-4xl text-naviigo-brown uppercase tracking-tight group-hover:-translate-x-2 transition-transform duration-300 cursor-pointer"
                    >
                      {d.name}
                    </h3>
                    <p className="font-mono text-xs text-brand-primary uppercase tracking-widest mt-1 mb-3">
                      {d.state}
                    </p>
                    <p className="font-sans text-sm text-naviigo-brown/75 font-light leading-relaxed ml-auto max-w-xs mb-4">
                      {d.tagline}
                    </p>
                    <button
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-naviigo-brown hover:text-brand-primary ml-auto transition-colors"
                    >
                      EXPLORE →
                    </button>
                  </div>

                  <div className="lg:col-span-5 lg:col-start-7">
                    <div
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="relative aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-hidden cursor-pointer shadow-md group-hover:shadow-xl transition-all duration-500 bg-paper-dark border border-[#EADFD4]"
                    >
                      <PlaceImage
                        name={d.name}
                        city={d.state}
                        fallbackUrl={d.image}
                        asBackground
                        className="absolute inset-0 w-full h-full group-hover:scale-104 transition-transform duration-700 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(d);
                          }}
                          aria-label={`Save ${d.name} to bucket list`}
                          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isLiked ? 'fill-brand-primary text-brand-primary' : 'text-white'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="lg:hidden absolute bottom-5 left-5 right-5 text-white">
                        <span className="font-mono text-[10px] text-brand-primary uppercase tracking-widest block mb-1">
                          {indexFormatted} · {d.category}
                        </span>
                        <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-1">
                          {d.name}
                        </h3>
                        <p className="font-mono text-xs text-white/80 uppercase">{d.state}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            // Pattern 2: Wide 48% card offset left (col-span-7)
            if (pattern === 2) {
              return (
                <article
                  key={d.id || d.name}
                  className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center group"
                >
                  <div className="lg:col-span-7">
                    <div
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="relative aspect-[16/10] rounded-3xl overflow-hidden cursor-pointer shadow-md group-hover:shadow-xl transition-all duration-500 bg-paper-dark border border-[#EADFD4]"
                    >
                      <PlaceImage
                        name={d.name}
                        city={d.state}
                        fallbackUrl={d.image}
                        asBackground
                        className="absolute inset-0 w-full h-full group-hover:scale-104 transition-transform duration-700 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-white/95 backdrop-blur-md text-naviigo-brown rounded-full shadow-sm">
                          {indexFormatted} · {d.state}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(d);
                          }}
                          aria-label={`Save ${d.name} to bucket list`}
                          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isLiked ? 'fill-brand-primary text-brand-primary' : 'text-white'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="lg:hidden absolute bottom-5 left-5 right-5 text-white">
                        <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-1">
                          {d.name}
                        </h3>
                        <p className="font-sans text-xs text-white/80 font-light">{d.tagline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:col-span-5 flex-col justify-center pl-4">
                    <span className="font-mono text-xs font-bold text-brand-primary uppercase tracking-[0.25em] mb-2">
                      {indexFormatted} / EXPEDITION
                    </span>
                    <h3
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="font-display font-black text-3xl xl:text-4xl text-naviigo-brown uppercase tracking-tight group-hover:translate-x-2 transition-transform duration-300 cursor-pointer"
                    >
                      {d.name}
                    </h3>
                    <p className="font-mono text-xs text-naviigo-brown/60 uppercase tracking-widest mt-1 mb-3">
                      {d.state} · {d.category}
                    </p>
                    <p className="font-sans text-sm text-naviigo-brown/75 font-light leading-relaxed mb-4">
                      {d.tagline}. Estimated allocation: {d.budget}.
                    </p>
                    <button
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-primary hover:text-naviigo-brown transition-colors"
                    >
                      EXPLORE →
                    </button>
                  </div>
                </article>
              );
            }

            // Pattern 3: Smaller tactile card offset right
            if (pattern === 3) {
              return (
                <article
                  key={d.id || d.name}
                  className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center group"
                >
                  <div className="hidden lg:flex lg:col-span-5 lg:col-start-3 flex-col justify-center text-right pr-6">
                    <span className="font-mono text-xs font-bold text-naviigo-brown/40 uppercase tracking-[0.25em] mb-2">
                      {indexFormatted} / RETREAT
                    </span>
                    <h3
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="font-display font-black text-3xl text-naviigo-brown uppercase tracking-tight group-hover:-translate-x-2 transition-transform duration-300 cursor-pointer"
                    >
                      {d.name}
                    </h3>
                    <p className="font-mono text-xs text-brand-primary uppercase tracking-widest mt-1 mb-3">
                      {d.state}
                    </p>
                    <p className="font-sans text-sm text-naviigo-brown/75 font-light leading-relaxed ml-auto max-w-xs mb-4">
                      {d.tagline}
                    </p>
                    <button
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-primary ml-auto transition-colors"
                    >
                      EXPLORE →
                    </button>
                  </div>

                  <div className="lg:col-span-5">
                    <div
                      onClick={(e) => handleDestinationClick(e, d)}
                      className="relative aspect-[4/3] rounded-3xl overflow-hidden cursor-pointer shadow-md group-hover:shadow-xl transition-all duration-500 bg-paper-dark border border-[#EADFD4]"
                    >
                      <PlaceImage
                        name={d.name}
                        city={d.state}
                        fallbackUrl={d.image}
                        asBackground
                        className="absolute inset-0 w-full h-full group-hover:scale-104 transition-transform duration-700 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLike(d);
                          }}
                          aria-label={`Save ${d.name} to bucket list`}
                          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isLiked ? 'fill-brand-primary text-brand-primary' : 'text-white'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="lg:hidden absolute bottom-5 left-5 right-5 text-white">
                        <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-1">
                          {d.name}
                        </h3>
                        <p className="font-mono text-xs text-white/80 uppercase">{d.state}</p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }

            // Pattern 4: Large Immersive feature plate (Full row)
            return (
              <article
                key={d.id || d.name}
                className="relative z-10 w-full group"
              >
                <div
                  onClick={(e) => handleDestinationClick(e, d)}
                  className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden cursor-pointer shadow-xl group-hover:shadow-2xl transition-all duration-700 bg-paper-dark border border-[#EADFD4]"
                >
                  <PlaceImage
                    name={d.name}
                    city={d.state}
                    fallbackUrl={d.image}
                    asBackground
                    className="absolute inset-0 w-full h-full group-hover:scale-103 transition-transform duration-1000 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

                  {/* Top Bar */}
                  <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
                    <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] px-4 py-1.5 bg-white/95 backdrop-blur-md text-naviigo-brown rounded-full shadow-sm">
                      PANORAMIC HORIZON · {indexFormatted}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike(d);
                      }}
                      aria-label={`Save ${d.name} to bucket list`}
                      className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          isLiked ? 'fill-brand-primary text-brand-primary' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Bottom Masthead on Image */}
                  <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 right-6 sm:right-12 z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs sm:text-sm font-bold text-brand-primary uppercase tracking-[0.25em] block mb-1">
                        {d.state} · INDIA
                      </span>
                      <h3 className="font-display font-black text-3xl sm:text-5xl md:text-6xl text-white uppercase tracking-tight group-hover:translate-x-2 transition-transform duration-300">
                        {d.name}
                      </h3>
                      <p className="font-sans text-sm sm:text-base text-white/80 font-light max-w-xl mt-2">
                        {d.tagline}. High-altitude air and unhurried paths.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full group-hover:bg-white group-hover:text-naviigo-brown transition-all">
                        EXPLORE HORIZON <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ── Pagination / Infinite Trigger ── */}
      {destinations.length < total && (
        <div className="pt-16 pb-8 text-center">
          <button
            onClick={onLoadMore}
            className="inline-flex items-center gap-3 px-8 py-4 border-2 border-naviigo-brown/20 hover:border-brand-primary text-naviigo-brown hover:text-brand-primary rounded-full font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all"
          >
            <span>LOAD MORE ATLAS PLATES</span>
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
          </button>
        </div>
      )}

      {/* ── Editorial Destination Transition Overlay ── */}
      <AnimatePresence>
        {transitioningDest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-paper-warm text-naviigo-brown pointer-events-auto"
          >
            {/* Sliding cream paper surface */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 bg-paper-warm flex flex-col items-center justify-center p-8 text-center"
            >
              {/* Journey Line targeting waypoint */}
              <div className="w-16 h-1 bg-brand-primary rounded-full mb-8 animate-pulse" />

              <span className="font-mono text-xs sm:text-sm font-bold tracking-[0.3em] uppercase text-brand-primary mb-3">
                OPENING REGIONAL DOSSIER
              </span>

              <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tightest mb-4">
                {transitioningDest.name}
              </h2>

              <p className="font-mono text-sm uppercase tracking-widest text-naviigo-brown/60">
                {transitioningDest.state} · INDIA
              </p>

              <div className="mt-12 flex items-center gap-3 text-xs font-mono text-naviigo-brown/40">
                <Sparkles className="w-4 h-4 text-brand-primary animate-spin" />
                <span>CALIBRATING WAYPOINTS & LOCAL TRAILS</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AtlasGrid.displayName = 'AtlasGrid';
export default AtlasGrid;
