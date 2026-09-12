'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils } from 'lucide-react';
import PlaceImage from '@/components/shared/PlaceImage';

export interface CuisineDishItem {
  name: string;
  city?: string;
  note: string;
}

export interface CuisineItem {
  region: string;
  dishes: CuisineDishItem[];
  icon: string;
  states: string;
  image: string;
  gradient?: string;
}

interface Props {
  cuisines: CuisineItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onExplore: (region: string) => void;
}

export const CuisineSection = memo(({ cuisines, selectedIndex, onSelect, onExplore }: Props) => {
  const activeCuisine = cuisines[selectedIndex];
  if (!activeCuisine) return null;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
        <div>
          <div className="flex items-center gap-2 text-saffron text-xs font-semibold tracking-widest uppercase mb-3">
            <Utensils className="w-4 h-4" /> A culinary journey
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground tracking-tight font-serif">Cuisines of India</h2>
          <p className="text-base text-muted-foreground mt-2 font-medium">Every region. Every flavor. One incredible subcontinent.</p>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-8 border-b border-border pb-4 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
        {cuisines.map((c, i) => (
          <button
            key={c.region}
            onClick={() => onSelect(i)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 border whitespace-nowrap shrink-0 ${
              selectedIndex === i
                ? 'bg-saffron text-white border-transparent shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-saffron/50 hover:text-saffron'
            }`}
          >
            {c.region}
          </button>
        ))}
      </div>

      {/* Active cuisine detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col lg:flex-row bg-card rounded-2xl overflow-hidden border border-border shadow-sm relative"
        >
          {/* Image side — the region gradient sits behind the photo so each
              cuisine keeps its own colour identity when the image is slow,
              blocked, or missing (every CUISINES entry ships image: ''). */}
          <div className={`relative lg:w-1/2 h-72 lg:h-auto min-h-[300px] overflow-hidden bg-gradient-to-br ${activeCuisine.gradient ?? 'from-saffron via-marigold to-temple-red'}`}>
            <PlaceImage
              name={activeCuisine.dishes?.[0]?.name || activeCuisine.region}
              city={activeCuisine.dishes?.[0]?.city || ''}
              fallbackUrl={activeCuisine.image || ''}
              asBackground
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl bg-white/20 backdrop-blur-md p-2 rounded-lg">{activeCuisine.icon}</span>
              </div>
              <h3 className="text-3xl font-bold text-white tracking-tight font-serif">{activeCuisine.region}</h3>
              <p className="text-sm font-medium text-white/80 mt-1">{activeCuisine.states}</p>
            </div>
          </div>
          {/* Dishes */}
          <div className="flex-1 p-6 lg:p-8 flex flex-col justify-center">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-5">Signature Dishes</h4>
            <div className="space-y-4">
              {activeCuisine.dishes.map((dish, di) => (
                <div key={dish.name} className="flex items-start gap-4 p-3 rounded-xl hover:bg-saffron/5 transition-colors border border-transparent hover:border-saffron/20">
                  <div className="w-10 h-10 rounded-lg bg-saffron/10 text-saffron flex items-center justify-center text-sm font-bold shrink-0 shadow-sm border border-saffron/20">
                    {di + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h5 className="font-bold text-card-foreground text-base">{dish.name}</h5>
                      {dish.city && (
                        <span className="text-[10px] font-bold text-saffron bg-saffron/10 px-1.5 py-0.5 rounded">{dish.city}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{dish.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onExplore(activeCuisine.region)}
              className="mt-8 bg-saffron text-white py-3 px-6 rounded-xl font-bold text-sm hover:bg-saffron/90 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-sm w-full md:w-auto"
            >
              <Utensils className="w-4 h-4" /> Explore {activeCuisine.region} Menus
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
});

CuisineSection.displayName = 'CuisineSection';
export default CuisineSection;
