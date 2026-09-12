'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Heart, ChevronRight } from 'lucide-react';
import PlaceImage from '@/components/shared/PlaceImage';
import { BENTO_DEST, type Destination } from '@/components/features/explore/exploreData';

export interface BentoLikeTarget {
  id?: number | string;
  name: string;
  state: string;
  image: string;
}

interface Props {
  /** The slice of destinations currently visible (already paginated by the page). */
  destinations: Destination[];
  /** Total number of destinations matching the active search/category filters. */
  total: number;
  liked: Set<number | string>;
  onToggleLike: (destination: BentoLikeTarget) => void;
  onSelect: (name: string) => void;
  onLoadMore: () => void;
  searchQuery: string;
  onReset: () => void;
}

export const BentoGrid = memo(({
  destinations,
  total,
  liked,
  onToggleLike,
  onSelect,
  onLoadMore,
  searchQuery,
  onReset,
}: Props) => {
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1 sm:mb-2 font-serif">Destinations</h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">{total} places to discover</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 auto-rows-[200px] sm:auto-rows-[220px] md:auto-rows-[200px] gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {destinations.map((d, i) => {
            const bentoClass = BENTO_DEST[i % BENTO_DEST.length] || '';
            const isLarge = bentoClass.includes('col-span-2') && bentoClass.includes('row-span-2');
            const isTall = !isLarge && bentoClass.includes('row-span-2');
            return (
              <Link
                key={d.id}
                href={`/explore/${encodeURIComponent(d.name)}`}
                onClick={() => onSelect(d.name)}
                className={`block ${bentoClass}`}
              >
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(i, 12) * 0.03, duration: 0.35, ease: 'easeOut' }}
                  className="group relative h-full w-full rounded-xl overflow-hidden cursor-pointer bg-black shadow-sm ring-1 ring-border hover:shadow-lg transition-shadow duration-300"
                >
                  <PlaceImage
                    name={d.name}
                    city={d.state}
                    fallbackUrl={d.image}
                    asBackground
                    className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10 transition-opacity duration-300 group-hover:opacity-90" />

                  {/* Like btn */}
                  <button
                    onClick={e => { e.stopPropagation(); onToggleLike(d); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center z-10 transition-colors"
                  >
                    <Heart className={`w-4 h-4 transition-all ${liked.has(d.id) || liked.has(String(d.id)) ? 'fill-rose-500 text-rose-500' : 'text-white/90'}`} />
                  </button>

                  {/* Category badge - top left */}
                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md border border-white/10 text-white px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wide z-10">{d.category}</div>

                  {/* Content overlay - bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Star className="w-3.5 h-3.5 text-marigold fill-marigold" />
                      <span className="text-xs font-semibold text-white/90">{d.rating}</span>
                      <span className="text-xs text-white/50 font-normal ml-1 border-l border-white/20 pl-1">Popular</span>
                    </div>
                    <h3 className={`font-serif font-bold text-white mb-0.5 tracking-tight leading-tight ${isLarge ? 'text-xl sm:text-3xl lg:text-4xl' : isTall ? 'text-lg sm:text-2xl' : 'text-base sm:text-xl md:text-lg'}`}>{d.name}</h3>
                    <p className={`text-white/70 font-medium truncate ${isLarge ? 'text-xs sm:text-sm' : 'text-xs'}`}>{d.state}</p>

                    {/* Details row - always visible on mobile, conditional on desktop */}
                    <div className={`flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/10 ${!isLarge && !isTall ? 'md:hidden' : ''}`}>
                      <span className="text-xs text-white/80 font-medium">{d.bestTime}</span>
                      <span className="text-xs text-white/30">•</span>
                      <span className="text-xs text-white/80 font-medium">{d.duration}</span>
                      <div className="ml-auto text-xs font-bold text-white">{d.budget}</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Load More button */}
      {destinations.length < total && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-saffron text-white text-sm font-bold hover:bg-saffron/90 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm"
          >
            <MapPin className="w-4 h-4" />
            Load More ({total - destinations.length} remaining)
            <ChevronRight className="w-4 h-4 rotate-90 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {total === 0 && (
        <div className="text-center py-20">
          <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium mb-3">No results for &ldquo;{searchQuery}&rdquo;</p>
          <button
            onClick={onReset}
            className="bg-saffron text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-saffron/90 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </>
  );
});

BentoGrid.displayName = 'BentoGrid';
export default BentoGrid;
