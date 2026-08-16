'use client';

import React, { memo } from 'react';
import { ArrowUpDown } from 'lucide-react';

interface Props {
  sortOption: string;
  onSortChange: (option: string) => void;
  options: string[];
}

export const SortBar = memo(({ sortOption, onSortChange, options }: Props) => {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-zinc-400" />
      <select
        value={sortOption}
        onChange={(e) => onSortChange(e.target.value)}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
});

SortBar.displayName = 'SortBar';
export default SortBar;
