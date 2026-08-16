'use client';

import React, { memo } from 'react';
import { Plane, ArrowRight, ExternalLink } from 'lucide-react';
import { FlightResult } from '@/types';

interface Props {
  flight: FlightResult;
}

export const FlightCard = memo(({ flight }: Props) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0">
          <Plane className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">{flight.airline}</h4>
            <span className="text-xs text-zinc-400 font-mono">{flight.code}</span>
            {flight.badge && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                {flight.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {flight.from} → {flight.to} • {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center md:text-right">
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            {flight.dep} - {flight.arr}
          </div>
          <div className="text-xs text-zinc-400">{flight.duration}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-black text-emerald-500">{flight.price}</div>
            {flight.class && <div className="text-[10px] text-zinc-400">{flight.class}</div>}
          </div>
          {flight.deepLink && (
            <a
              href={flight.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Book <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

FlightCard.displayName = 'FlightCard';
export default FlightCard;
