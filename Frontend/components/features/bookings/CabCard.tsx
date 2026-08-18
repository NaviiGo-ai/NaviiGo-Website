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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shrink-0">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">{item.provider}</h4>
            <span className="text-xs text-zinc-400">({item.type})</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            ETA: {item.eta || '15 mins'} {item.pax ? `• Max ${item.pax} Seats` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-lg font-black text-amber-500">{item.price}</div>
          {item.perKm && <div className="text-[10px] text-zinc-400">{item.perKm}</div>}
        </div>
        {onBook ? (
          <button
            onClick={() => onBook(item)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            Book <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : item.deepLink ? (
          <a
            href={item.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            Book <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : null}
      </div>
    </div>
  );
});

CabCard.displayName = 'CabCard';
export default CabCard;
