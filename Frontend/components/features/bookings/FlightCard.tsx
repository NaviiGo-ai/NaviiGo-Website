'use client';

import React, { memo } from 'react';
import { Plane, ChevronRight, ExternalLink } from 'lucide-react';

interface Props {
  f?: any;
  flight?: any;
  onBook?: (item: any) => void;
}

export const FlightCard = memo(({ f, flight, onBook }: Props) => {
  const item = f || flight;
  if (!item) return null;

  return (
    <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-5 hover:border-brand-primary/50 transition-all flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm group">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-11 h-11 rounded-lg bg-paper-warm border border-[#EADFD4] text-naviigo-brown flex items-center justify-center shrink-0">
          <Plane className="w-5 h-5 text-brand-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-base text-naviigo-brown group-hover:text-brand-primary transition-colors">{item.airline}</h4>
            <span className="font-mono text-xs text-naviigo-brown/60 uppercase">{item.code}</span>
            {item.badge && (
              <span className="px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider rounded bg-paper-warm text-brand-primary border border-[#EADFD4]">
                {item.badge}
              </span>
            )}
          </div>
          <p className="font-mono text-xs text-naviigo-brown/70 mt-1">
            {item.from} → {item.to} · {item.stops === 0 ? 'Direct Route' : `${item.stops} Stop${item.stops > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end pt-3 md:pt-0 border-t md:border-t-0 border-[#EADFD4]">
        <div className="text-left md:text-right">
          <div className="font-mono text-sm font-bold text-naviigo-brown">
            {item.dep} — {item.arr}
          </div>
          <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase">{item.duration} duration</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-naviigo-brown">{item.price}</div>
            {item.class && <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase">{item.class}</div>}
          </div>
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

FlightCard.displayName = 'FlightCard';
export default FlightCard;
