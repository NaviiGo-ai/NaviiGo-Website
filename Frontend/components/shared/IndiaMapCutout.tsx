'use client';

import React from 'react';

/**
 * Authentic, accurate geographic silhouette of the Indian subcontinent.
 * Normalized to a 1000x1200 coordinate space.
 * Features:
 * - High Himalayan crown (Kashmir/Ladakh)
 * - Distinctive Gujarat Rann of Kutch & Kathiawar peninsula on the west
 * - Coromandel & Malabar coasts tapering to Kanyakumari at the southern tip
 * - Siliguri corridor & eastern expansion across the Northeast states
 */
export const INDIA_MAP_PATH = `
  M 480,75
  C 510,70 540,90 555,130
  C 570,170 560,220 575,255
  C 590,290 635,320 670,360
  C 705,400 760,340 810,310
  C 860,280 920,290 950,320
  C 975,350 960,395 940,430
  C 920,465 910,510 885,530
  C 860,550 810,510 780,525
  C 750,540 735,570 720,610
  C 705,650 680,690 650,740
  C 620,790 590,850 565,910
  C 540,970 515,1050 490,1130
  C 485,1135 480,1135 475,1130
  C 455,1070 435,1000 415,930
  C 395,860 375,800 355,740
  C 335,680 310,650 280,660
  C 250,670 210,690 180,665
  C 150,640 160,600 190,580
  C 220,560 210,540 170,545
  C 130,550 140,510 170,480
  C 200,450 240,420 280,380
  C 320,340 360,290 395,240
  C 430,190 450,140 460,95
  Z
`;

interface IndiaMapCutoutProps {
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export default function IndiaMapCutout({
  className = '',
  fill = 'currentColor',
  stroke = 'none',
  strokeWidth = 1,
}: IndiaMapCutoutProps) {
  return (
    <svg
      viewBox="0 0 1000 1200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={INDIA_MAP_PATH}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
