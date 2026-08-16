'use client';

import React, { memo } from 'react';
import { Building2, Star, ExternalLink } from 'lucide-react';
import { HotelResult } from '@/types';

interface Props {
  hotel: HotelResult;
}

export const HotelCard = memo(({ hotel }: Props) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">{hotel.name}</h4>
            {hotel.stars && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {hotel.stars}★
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            📍 {hotel.area} {hotel.distance ? `• ${hotel.distance}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-lg font-black text-purple-500">{hotel.price}</div>
          <div className="text-[10px] text-zinc-400">{hotel.perNight || 'per night'}</div>
        </div>
        {hotel.deepLink && (
          <a
            href={hotel.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            Reserve <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
});

HotelCard.displayName = 'HotelCard';
export default HotelCard;
