'use client';

import React, { memo } from 'react';
import { Award, Flame, MapPin } from 'lucide-react';
import { PassportStats } from '@/lib/gamification';

interface Props {
  stats: PassportStats;
  levelTitle: string;
}

export const PassportHeader = memo(({ stats, levelTitle }: Props) => {
  return (
    <div className="bg-gradient-to-r from-jungle-green-600 to-deep-sea-700 rounded-[2.5rem] p-8 text-white shadow-xl mb-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl shadow-inner">
            📜
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" /> Level {stats.level} • {levelTitle}
            </div>
            <h1 className="text-3xl font-black">Digital Pilgrim Passport</h1>
            <p className="text-jungle-green-100 text-sm mt-1">Verified check-ins, stamps, and state coverage across India</p>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <div className="text-center px-2">
            <div className="text-xs text-jungle-green-100 font-medium">Stamps</div>
            <div className="text-2xl font-black">{stats.totalStamps}</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center px-2">
            <div className="text-xs text-jungle-green-100 font-medium">Total XP</div>
            <div className="text-2xl font-black text-saffron-300">{stats.totalXP}</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center px-2">
            <div className="text-xs text-jungle-green-100 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-saffron-400" /> Streak
            </div>
            <div className="text-2xl font-black">{stats.streak} Days</div>
          </div>
        </div>
      </div>
    </div>
  );
});

PassportHeader.displayName = 'PassportHeader';
export default PassportHeader;
