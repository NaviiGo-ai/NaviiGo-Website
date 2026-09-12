'use client';

import React, { memo } from 'react';
import { Building2, Star, ChevronRight, ExternalLink } from 'lucide-react';

interface Props {
  h?: any;
  hotel?: any;
  onBook?: (item: any) => void;
}

export const HotelCard = memo(({ h, hotel, onBook }: Props) => {
  const item = h || hotel;
  if (!item) return null;

  return (
    <div className="bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold shrink-0">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-muted-900 dark:text-white">{item.name}</h4>
            {item.stars && (
              <span className="flex items-center gap-1 text-xs text-saffron-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-saffron-500 text-saffron-500" /> {item.stars}★
              </span>
            )}
          </div>
          <p className="text-xs text-muted-500 mt-1">
            📍 {item.area} {item.distance ? `• ${item.distance}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-lg font-black text-indigo-500">{item.price}</div>
          <div className="text-[10px] text-muted-400">{item.perNight || 'per night'}</div>
        </div>
        {onBook ? (
          <button
            onClick={() => onBook(item)}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            Reserve <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : item.deepLink ? (
          <a
            href={item.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            Reserve <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
});

HotelCard.displayName = 'HotelCard';
export default HotelCard;
