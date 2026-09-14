'use client';

import React from 'react';
import { TORN_PATHS_TOP, TORN_PATHS_BOTTOM } from './TornPaper';

interface TornPaperEdgeProps {
  position?: 'top' | 'bottom';
  color?: string; // Hex or CSS color, defaults to paper warm #FAF6F0
  className?: string;
  shadow?: boolean;
  variant?: 0 | 1 | 2;
}

/**
 * Natural organic torn paper edge SVG paths.
 * Generates natural rag-paper deckled tear lines with realistic fibrous irregularity.
 */
export default function TornPaperEdge({
  position = 'top',
  color = '#FAF6F0',
  className = '',
  shadow = true,
  variant = 0,
}: TornPaperEdgeProps) {
  const isTop = position === 'top';
  const path = isTop
    ? TORN_PATHS_TOP[variant % TORN_PATHS_TOP.length]
    : TORN_PATHS_BOTTOM[variant % TORN_PATHS_BOTTOM.length];

  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none select-none z-20 ${className}`}
      style={{
        height: '56px',
        marginTop: isTop ? '-55px' : '0',
        marginBottom: !isTop ? '-55px' : '0',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-full block"
        style={{
          filter: shadow
            ? isTop
              ? 'drop-shadow(0 -4px 10px rgba(30, 20, 15, 0.05))'
              : 'drop-shadow(0 4px 10px rgba(30, 20, 15, 0.05))'
            : 'none',
        }}
      >
        <path d={path} fill={color} />
        {/* Subtle fiber texture highlights */}
        <path
          d={path}
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="0.75"
        />
      </svg>
    </div>
  );
}
export { TORN_PATHS_TOP, TORN_PATHS_BOTTOM };
