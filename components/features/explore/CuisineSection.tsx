'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Utensils } from 'lucide-react';
import { CuisineTrailItem } from '@/types';

interface Props {
  cuisineTrails: CuisineTrailItem[];
}

export const CuisineSection = memo(({ cuisineTrails }: Props) => {
  return (
    <div className="max-w-7xl mx-auto px-4 my-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 font-bold">
          <Utensils className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Regional Cuisine Trails</h2>
          <p className="text-zinc-500 text-sm">Must-try food experiences curated from local foodies across India</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cuisineTrails.map((trail, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 rounded-2xl overflow-hidden mb-4">
                <Image
                  src={trail.image}
                  alt={trail.region}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white">
                  {trail.icon} {trail.region}
                </div>
              </div>
              <h3 className="font-bold text-xl text-zinc-900 dark:text-white mb-2">{trail.region} Flavor Trail</h3>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {trail.dishes.map((dish, dIdx) => (
                  <span
                    key={dIdx}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    🍲 {dish}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

CuisineSection.displayName = 'CuisineSection';
export default CuisineSection;
