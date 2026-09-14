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
    <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-5 hover:border-brand-primary/50 transition-all flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-lg bg-paper-warm border border-[#EADFD4] text-naviigo-brown flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-naviigo-brown" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-base text-naviigo-brown group-hover:text-brand-primary transition-colors">{item.name}</h4>
            {item.stars && (
              <span className="flex items-center gap-0.5 font-mono text-xs text-brand-primary font-bold">
                <Star className="w-3 h-3 fill-brand-primary text-brand-primary" /> {item.stars}★
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-naviigo-brown/70 mt-1">
            {item.area} {item.distance ? `· ${item.distance}` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#EADFD4]">
        <div className="text-left md:text-right">
          <div className="font-mono text-lg font-bold text-naviigo-brown">{item.price}</div>
          <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase">{item.perNight || 'per night'}</div>
        </div>

        <div>
          {onBook ? (
            <button
              onClick={() => onBook(item)}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow-sm"
            >
              Reserve <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : item.deepLink ? (
            <a
              href={item.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 shadow-sm"
            >
              Reserve <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
});

HotelCard.displayName = 'HotelCard';
export default HotelCard;
