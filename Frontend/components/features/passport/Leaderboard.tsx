'use client';

import React, { memo } from 'react';
import { Trophy, Award } from 'lucide-react';
import { LeaderboardEntry } from '@/lib/leaderboard';

interface Props {
  leaderboard: LeaderboardEntry[];
}

export const Leaderboard = memo(({ leaderboard }: Props) => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-saffron-500" />
        <h2 className="text-2xl font-black text-muted-900 dark:text-white">Global Explorer Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, idx) => (
          <div
            key={entry.uid || idx}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              idx === 0
                ? 'bg-saffron-500/10 border-saffron-500/30'
                : idx === 1
                ? 'bg-muted-100 dark:bg-muted-800/80 border-muted-300 dark:border-muted-700'
                : idx === 2
                ? 'bg-saffron-500/10 border-saffron-500/20'
                : 'bg-muted-50 dark:bg-muted-900/50 border-muted-200 dark:border-muted-800'
            }`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                  idx === 0
                    ? 'bg-saffron-500 text-white'
                    : idx === 1
                    ? 'bg-muted-400 text-white'
                    : idx === 2
                    ? 'bg-saffron-500 text-white'
                    : 'text-muted-500'
                }`}
              >
                #{idx + 1}
              </span>
              <div>
                <div className="font-bold text-muted-900 dark:text-white">{entry.displayName}</div>
                <div className="text-xs text-muted-400">Level {entry.level} • {entry.totalStamps} Stamps</div>
              </div>
            </div>

            <div className="font-black text-jungle-green-500 text-base">{entry.totalXP} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
});

Leaderboard.displayName = 'Leaderboard';
export default Leaderboard;
