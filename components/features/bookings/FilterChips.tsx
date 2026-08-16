'use client';

import React, { memo } from 'react';
import { Filter } from 'lucide-react';

interface Props {
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  options: string[];
}

export const FilterChips = memo(({ activeFilter, onSelectFilter, options }: Props) => {
  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      <span className="flex items-center gap-1 text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">
        <Filter className="w-3.5 h-3.5" /> Filter:
      </span>
      {options.map((opt) => {
        const isActive = activeFilter === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelectFilter(opt)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              isActive
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
});

FilterChips.displayName = 'FilterChips';
export default FilterChips;
