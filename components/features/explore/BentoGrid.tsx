'use client';

import React, { memo } from 'react';
import Image from 'next/image';
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
          className={`group relative rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all cursor-pointer ${
            idx % 5 === 0 ? 'md:col-span-2 md:h-[400px]' : 'h-[360px]'
          }`}
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 border border-white/10">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {item.state}
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-black">{item.name}</h3>
              {item.rating && (
                <span className="flex items-center gap-1 text-xs font-bold bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {item.rating}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-300 line-clamp-2 mb-4 font-medium">{item.tagline}</p>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
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
