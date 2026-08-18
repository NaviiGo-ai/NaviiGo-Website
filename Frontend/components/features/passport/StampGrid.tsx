'use client';

import React, { memo } from 'react';
import { Calendar, MapPin, Award } from 'lucide-react';
import { PassportStamp } from '@/lib/gamification';

interface Props {
  stamps: PassportStamp[];
  onSelectStamp: (stamp: PassportStamp) => void;
}

export const StampGrid = memo(({ stamps, onSelectStamp }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {stamps.map((stamp, idx) => (
        <div
          key={idx}
          onClick={() => onSelectStamp(stamp)}
          className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
                {stamp.icon || '📍'}
              </span>
              <span className="px-3 py-1 text-xs font-black rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                +{stamp.xpEarned} XP
              </span>
            </div>

            <h3 className="font-black text-xl text-zinc-900 dark:text-white mb-1">{stamp.name}</h3>
            <p className="text-xs font-semibold text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {stamp.location}, {stamp.state}
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {stamp.visitedDate}
            </span>
            <span className="font-bold text-emerald-500">Verified Stamp ✓</span>
          </div>
        </div>
      ))}
    </div>
  );
});

StampGrid.displayName = 'StampGrid';
export default StampGrid;
