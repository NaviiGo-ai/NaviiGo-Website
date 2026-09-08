'use client';

import React, { memo } from 'react';
import { Compass, Sparkles } from 'lucide-react';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ExploreHero = memo(({ searchQuery, onSearchChange }: Props) => {
  return (
    <div className="relative py-16 px-4 text-center max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs mb-6">
        <Sparkles className="w-4 h-4" /> Discover Extraordinary India
      </div>
      <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight mb-4 leading-tight font-serif">
        Explore Destinations &amp; Hidden Gems
      </h1>
      <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-sans">
        Curated travel guides, offbeat trails, authentic cuisine, and local consensus insights across India.
      </p>

      <div className="relative max-w-xl mx-auto">
        <Compass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Varanasi, Jaipur, Kerala, offbeat gems..."
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-input border border-border text-foreground font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
});

ExploreHero.displayName = 'ExploreHero';
export default ExploreHero;
