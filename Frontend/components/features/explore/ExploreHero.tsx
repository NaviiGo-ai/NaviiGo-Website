'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  categoryIcons: Record<string, React.ReactNode>;
}

export const ExploreHero = memo(({
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onSelectCategory,
  categoryIcons,
}: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center"
    >
      <h1 className="text-3xl sm:text-5xl md:text-[5.5rem] font-bold text-foreground mb-4 sm:mb-6 leading-tight tracking-tight font-serif">
        Every corner of India.
        <span className="block text-saffron italic font-serif mt-1 sm:mt-2">Told differently.</span>
      </h1>
      <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-12 font-medium leading-relaxed px-4 whitespace-normal break-words w-full">
        Discover curated stays, hidden beaches, and ancient paths curated for the modern traveler.
      </p>

      {/* Search */}
      <div className="max-w-3xl mx-auto w-full px-1">
        <div className="relative group">
          <div className="relative flex items-center bg-card/70 backdrop-blur-md border border-border hover:border-saffron/50 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg overflow-visible">
            <Search className="relative z-10 ml-3 sm:ml-6 w-5 h-5 text-saffron shrink-0" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="relative z-10 flex-1 min-w-0 bg-transparent border-none outline-none px-3 sm:px-5 py-4 sm:py-5 text-foreground placeholder:text-muted-foreground text-sm sm:text-base font-medium"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="relative z-10 mr-3 sm:mr-5 text-muted-foreground hover:text-saffron text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md hover:bg-saffron/10 transition-colors flex items-center gap-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            ) : (
              <button className="relative z-10 mr-3 sm:mr-5 bg-saffron text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-saffron/90 hover:scale-105 active:scale-95 transition-transform shrink-0">
                Search
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center sm:overflow-visible">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => onSelectCategory(c)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors duration-200 whitespace-nowrap shrink-0 ${
                activeCategory === c
                  ? 'bg-saffron text-white shadow-sm'
                  : 'bg-transparent text-muted-foreground hover:text-saffron hover:bg-saffron/10 border border-transparent hover:border-saffron/30'
              }`}
            >
              {categoryIcons[c]} {c}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

ExploreHero.displayName = 'ExploreHero';
export default ExploreHero;
