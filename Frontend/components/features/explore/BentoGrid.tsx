'use client';

import React, { memo } from 'react';
import PlaceImage from '@/components/shared/PlaceImage';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { DestinationExploreItem } from '@/types';

interface Props {
  destinations: DestinationExploreItem[];
  onSelectDestination: (id: string) => void;
}

export const BentoGrid = memo(({ destinations, onSelectDestination }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 my-12">
      {destinations.map((item, idx) => (
        <div
          key={item.id}
          onClick={() => onSelectDestination(item.id)}
          className={`group relative rounded-[2rem] overflow-hidden border border-border bg-card shadow-sm hover:shadow-2xl transition-all cursor-pointer ${
            idx % 5 === 0 ? 'md:col-span-2 md:h-[400px]' : 'h-[360px]'
          }`}
        >
          <PlaceImage
            name={item.name}
            city={item.state}
            fallbackUrl={item.image}
            asBackground
            className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-foreground flex items-center gap-1 border border-border">
            <MapPin className="w-3.5 h-3.5 text-primary" /> {item.state}
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold font-serif">{item.name}</h3>
              {item.rating && (
                <span className="flex items-center gap-1 text-xs font-bold bg-primary/20 text-primary-foreground px-2.5 py-1 rounded-full border border-primary/30">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" /> {item.rating}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground/90 line-clamp-2 mb-4 font-medium">{item.tagline}</p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary px-3 py-1.5 rounded-full group-hover:translate-x-1 transition-transform">
              Explore Deep Dive <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

BentoGrid.displayName = 'BentoGrid';
export default BentoGrid;
