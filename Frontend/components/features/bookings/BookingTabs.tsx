'use client';

import React, { memo } from 'react';
import { Plane, Train, Car, Building2 } from 'lucide-react';

export type BookingTabType = 'flights' | 'trains' | 'cabs' | 'hotels';

interface Props {
  activeTab: BookingTabType;
  onTabChange: (tab: BookingTabType) => void;
}

const TABS: { id: BookingTabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'flights', label: 'Flights', icon: Plane },
  { id: 'trains', label: 'Trains', icon: Train },
  { id: 'cabs', label: 'Cabs', icon: Car },
  { id: 'hotels', label: 'Hotels', icon: Building2 },
];

export const BookingTabs = memo(({ activeTab, onTabChange }: Props) => {
  return (
    <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit mx-auto mb-8 border border-zinc-200 dark:border-zinc-800">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isActive
                ? 'bg-white dark:bg-zinc-800 text-emerald-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
});

BookingTabs.displayName = 'BookingTabs';
export default BookingTabs;
