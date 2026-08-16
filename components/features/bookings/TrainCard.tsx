'use client';

import React, { memo } from 'react';
import { Train, ChevronRight, ExternalLink } from 'lucide-react';

interface Props {
  t?: any;
  train?: any;
  onBook?: (item: any) => void;
}

export const TrainCard = memo(({ t, train, onBook }: Props) => {
  const item = t || train;
  if (!item) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold shrink-0">
          <Train className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">{item.name}</h4>
            <span className="text-xs text-zinc-400 font-mono">#{item.number}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {item.from} → {item.to} • {item.days || 'Daily'}
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
            <div className="text-lg font-black text-blue-500">{item.price}</div>
            {item.avail && <div className="text-[10px] text-emerald-500 font-semibold">{item.avail}</div>}
          </div>
          {onBook ? (
            <button
              onClick={() => onBook(item)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Book <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : item.deepLink ? (
            <a
              href={item.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Book <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
});

TrainCard.displayName = 'TrainCard';
export default TrainCard;
