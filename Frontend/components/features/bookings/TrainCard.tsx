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
    <div className="bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-deep-sea-50 dark:bg-deep-sea-500/10 text-deep-sea-500 flex items-center justify-center font-bold shrink-0">
          <Train className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-muted-900 dark:text-white">{item.name}</h4>
            <span className="text-xs text-muted-400 font-mono">#{item.number}</span>
          </div>
          <p className="text-xs text-muted-500 mt-1">
            {item.from} → {item.to} • {item.days || 'Daily'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center md:text-right">
          <div className="text-sm font-bold text-muted-900 dark:text-white">
            {item.dep} - {item.arr}
          </div>
          <div className="text-xs text-muted-400">{item.duration}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-black text-deep-sea-500">{item.price}</div>
            {item.avail && <div className="text-[10px] text-jungle-green-500 font-semibold">{item.avail}</div>}
          </div>
          {onBook ? (
            <button
              onClick={() => onBook(item)}
              className="px-4 py-2 bg-deep-sea-500 hover:bg-deep-sea-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Book <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : item.deepLink ? (
            <a
              href={item.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-deep-sea-500 hover:bg-deep-sea-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
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
