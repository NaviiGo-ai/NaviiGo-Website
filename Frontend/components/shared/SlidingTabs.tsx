'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export interface TabItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface SlidingTabsProps {
  items: TabItem[];
  bareContainer?: boolean;
}

export default function SlidingTabs({ items, bareContainer = false }: SlidingTabsProps) {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className={`relative flex items-center ${bareContainer ? 'p-0.5' : 'p-1.5 rounded-full bg-card/60 backdrop-blur-md border border-border shadow-xs'}`}>
      {items.map((item, index) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
        const isHovered = hoveredIndex === index;

        return (
          <Link
            key={item.name}
            href={item.href}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`relative flex items-center gap-2.5 px-5 py-3 text-base font-extrabold rounded-full transition-colors duration-200 z-10 ${
              isActive
                ? 'text-primary-foreground font-extrabold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {/* Active Pill (Background slider) */}
            {isActive && (
              <motion.div
                layoutId="activeTabSlider"
                className="absolute inset-0 bg-primary rounded-full shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{ zIndex: -1 }}
              />
            )}

            {/* Hover Underline Line */}
            {!isActive && isHovered && (
              <motion.div
                layoutId="hoverTabLine"
                className="absolute bottom-1 left-4 right-4 h-[2.5px] bg-primary rounded-full shadow-xs"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}

            {item.icon && <span className="w-4.5 h-4.5 flex items-center justify-center">{item.icon}</span>}
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
