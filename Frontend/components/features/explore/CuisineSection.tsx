'use client';

import React, { memo } from 'react';
import PlaceImage from '@/components/shared/PlaceImage';
import { Utensils } from 'lucide-react';
import { CuisineTrailItem } from '@/types';

interface Props {
  cuisineTrails: CuisineTrailItem[];
}

export const CuisineSection = memo(({ cuisineTrails }: Props) => {
  return (
    <div className="max-w-7xl mx-auto px-4 my-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary font-bold">
          <Utensils className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-foreground font-serif">Regional Cuisine Trails</h2>
          <p className="text-muted-foreground text-sm">Must-try food experiences curated from local foodies across India</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cuisineTrails.map((trail, i) => (
          <div
            key={i}
            className="bg-card border border-border text-card-foreground rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 rounded-2xl overflow-hidden mb-4 border border-border">
                <PlaceImage
                  name={trail.dishes[0] ? `${trail.dishes[0]} ${trail.region}` : trail.region}
                  fallbackUrl={trail.image}
                  asBackground
                  className="absolute inset-0 w-full h-full"
                  width={600}
                />
                <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-foreground border border-border">
                  {trail.icon} {trail.region}
                </div>
              </div>
              <h3 className="font-bold text-xl text-foreground font-serif mb-2">{trail.region} Flavor Trail</h3>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {trail.dishes.map((dish, dIdx) => (
                  <span
                    key={dIdx}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground border border-border"
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
