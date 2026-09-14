'use client';

import React, { memo } from 'react';
import { Car, ChevronRight, ExternalLink } from 'lucide-react';

interface Props {
  c?: any;
  cab?: any;
  onBook?: (item: any) => void;
}

export const CabCard = memo(({ c, cab, onBook }: Props) => {
  const item = c || cab;
  if (!item) return null;

  return (
    <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-5 hover:border-brand-primary/50 transition-all flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-lg bg-paper-warm border border-[#EADFD4] text-naviigo-brown flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-naviigo-brown" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-base text-naviigo-brown group-hover:text-brand-primary transition-colors">{item.provider}</h4>
            <span className="font-mono text-xs text-naviigo-brown/60 uppercase">({item.type})</span>
          </div>
          <p className="font-mono text-xs text-naviigo-brown/70 mt-1">
            ETA: {item.eta || '15 mins'} {item.pax ? `· Capacity ${item.pax} Guests` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#EADFD4]">
        <div className="text-left md:text-right">
          <div className="font-mono text-lg font-bold text-naviigo-brown">{item.price}</div>
          {item.perKm && <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase">{item.perKm}</div>}
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

CabCard.displayName = 'CabCard';
export default CabCard;
