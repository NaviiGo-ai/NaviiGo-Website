'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Award, Flame } from 'lucide-react';
import { PassportStats } from '@/lib/gamification';

interface Props {
  stats: PassportStats;
  levelTitle: string;
}

export const PassportHeader = memo(({ stats, levelTitle }: Props) => {
  return (
    <div className="bg-naviigo-brown text-white rounded-3xl p-8 sm:p-10 shadow-xl mb-10 max-w-6xl mx-auto border border-white/10 relative overflow-hidden">
      {/* Subtle paper grain / ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center relative p-3 shrink-0">
            <Image
              src="/brand/naviigo-mark-knockout.png"
              alt="NaviiGo Passport"
              fill
              sizes="80px"
              className="object-contain p-2"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-white/90 font-mono text-[11px] uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5 text-brand-secondary" /> Level {stats.level} · {levelTitle}
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight uppercase text-white">
              Traveler&apos;s Field Record
            </h1>
            <p className="text-white/70 font-sans text-xs sm:text-sm mt-1 font-light">
              Verified journey chronology, route milestones, and territorial coverage across India.
            </p>
          </div>
        </div>

        {/* Real Stats Telemetry */}
        <div className="flex items-center gap-4 sm:gap-6 bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 w-full md:w-auto justify-around">
          <div className="text-center px-2">
            <div className="font-mono text-[10px] text-white/60 uppercase tracking-wider">Milestones</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white">{stats.totalStamps}</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center px-2">
            <div className="font-mono text-[10px] text-white/60 uppercase tracking-wider">Trip XP</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-brand-secondary">{stats.totalXP}</div>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center px-2">
            <div className="font-mono text-[10px] text-white/60 uppercase tracking-wider flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-naviigo-orange" /> Streak
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white">{stats.streak}d</div>
          </div>
        </div>
      </div>
    </div>
  );
});

PassportHeader.displayName = 'PassportHeader';
export default PassportHeader;
