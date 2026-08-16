'use client';

import React, { memo } from 'react';
import { Train, ExternalLink } from 'lucide-react';
import { TrainResult } from '@/types';

interface Props {
  train: TrainResult;
}

export const TrainCard = memo(({ train }: Props) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold shrink-0">
          <Train className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-zinc-900 dark:text-white">{train.name}</h4>
            <span className="text-xs text-zinc-400 font-mono">#{train.number}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {train.from} → {train.to} • {train.days || 'Daily'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center md:text-right">
          <div className="text-sm font-bold text-zinc-900 dark:text-white">
            {train.dep} - {train.arr}
          </div>
          <div className="text-xs text-zinc-400">{train.duration}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-black text-blue-500">{train.price}</div>
            {train.avail && <div className="text-[10px] text-emerald-500 font-semibold">{train.avail}</div>}
          </div>
          {train.deepLink && (
            <a
              href={train.deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              Book <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

TrainCard.displayName = 'TrainCard';
export default TrainCard;
