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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0">
          <Plane className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">{item.airline}</h4>
            <span className="text-xs text-zinc-400 font-mono">{item.code}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase">
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {item.from} → {item.to} • {item.stops === 0 ? 'Non-stop' : `${item.stops || 'Non-stop'}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center md:text-right">
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            {item.dep} - {item.arr}
          </div>
          <div className="text-xs text-zinc-400">{item.duration}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-black text-emerald-500">{item.price}</div>
            {item.class && <div className="text-[10px] text-zinc-400">{item.class}</div>}
          </div>
          {onBook ? (
            <button
              onClick={() => onBook(item)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Book <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : item.deepLink ? (
            <a
              href={item.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Book <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
});

FlightCard.displayName = 'FlightCard';
export default FlightCard;
