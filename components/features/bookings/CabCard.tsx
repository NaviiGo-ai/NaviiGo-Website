'use client';

import React, { memo } from 'react';
import { Car, ExternalLink } from 'lucide-react';
import { CabResult } from '@/types';

interface Props {
  cab: CabResult;
}

export const CabCard = memo(({ cab }: Props) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">{cab.provider}</h4>
            <span className="text-xs text-zinc-400">({cab.type})</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            ETA: {cab.eta || '15 mins'} {cab.pax ? `• Max ${cab.pax} Seats` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-lg font-black text-amber-500">{cab.price}</div>
          {cab.perKm && <div className="text-[10px] text-zinc-400">{cab.perKm}</div>}
        </div>
        {cab.deepLink && (
          <a
            href={cab.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            Book <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
});

CabCard.displayName = 'CabCard';
export default CabCard;
