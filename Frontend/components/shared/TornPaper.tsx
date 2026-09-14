'use client';

import React from 'react';

/**
 * Handcrafted Natural Torn Paper SVG Contours.
 * Non-repeating, non-sinusoidal Bézier paths simulating 300gsm deckled-edge cotton rag paper.
 * Features broad natural shifts, asymmetrical peaks, and delicate fibrous variations.
 */

export const TORN_PATHS_TOP = [
  // Variant A: Gentle crest with slight mid-right plateau
  `M 0,56
   C 42,52 78,61 124,54
   C 158,49 194,42 238,46
   C 272,49 308,58 352,53
   C 398,47 438,36 486,40
   C 522,43 552,51 594,48
   C 638,44 676,33 724,37
   C 768,41 802,54 850,49
   C 896,44 934,35 982,39
   C 1024,43 1058,56 1104,51
   C 1148,46 1188,38 1238,43
   C 1284,47 1326,59 1378,52
   C 1406,48 1428,44 1440,46
   L 1440,120 L 0,120 Z`,

  // Variant B: Asymmetrical dip on the left, high shelf on the right
  `M 0,42
   C 48,46 92,38 140,44
   C 176,49 214,62 260,58
   C 304,54 344,41 392,45
   C 432,49 468,60 514,56
   C 558,52 596,39 644,42
   C 684,45 718,55 762,51
   C 812,46 852,34 902,38
   C 944,42 980,52 1026,48
   C 1074,43 1116,35 1168,40
   C 1212,44 1252,54 1300,50
   C 1348,45 1394,38 1440,41
   L 1440,120 L 0,120 Z`,

  // Variant C: Broader editorial sweep with micro-serrations
  `M 0,50
   C 36,46 72,55 112,49
   C 152,43 186,34 228,37
   C 272,41 310,53 356,48
   C 402,43 444,32 492,36
   C 536,40 572,51 618,47
   C 666,42 706,31 754,35
   C 796,39 832,49 876,46
   C 924,42 966,33 1014,37
   C 1058,41 1094,52 1140,48
   C 1186,43 1228,34 1276,38
   C 1324,42 1368,53 1414,47
   C 1428,45 1436,44 1440,45
   L 1440,120 L 0,120 Z`,
];

export const TORN_PATHS_BOTTOM = [
  // Variant A: Counterpart to Top A
  `M 0,0
   L 1440,0
   L 1440,48
   C 1412,44 1378,57 1332,51
   C 1286,45 1246,34 1198,39
   C 1154,43 1118,55 1072,50
   C 1026,45 988,34 940,38
   C 898,42 862,54 816,49
   C 768,44 730,33 682,37
   C 640,41 604,52 558,48
   C 512,43 472,32 424,36
   C 380,40 344,53 298,48
   C 252,43 214,33 166,37
   C 124,41 88,54 42,48
   C 24,45 10,43 0,44
   Z`,

  // Variant B: Contrasting bottom tear
  `M 0,0
   L 1440,0
   L 1440,38
   C 1396,34 1354,46 1306,42
   C 1260,37 1220,49 1172,45
   C 1124,41 1084,52 1038,47
   C 990,42 950,33 902,37
   C 858,41 820,53 774,48
   C 726,43 686,34 638,38
   C 594,42 556,53 510,49
   C 462,44 424,35 376,39
   C 330,43 292,54 246,50
   C 198,45 160,36 112,40
   C 68,44 32,56 0,52
   Z`,
];

interface TornPaperMaskProps {
  variant?: 0 | 1 | 2;
  color?: string;
  className?: string;
  subtleDepth?: boolean;
}

/**
 * Reusable Torn Paper Top Mask
 * Renders an irregular deckled upper paper edge spanning the full viewport.
 */
export function TornPaperMaskTop({
  variant = 0,
  color = '#FAF6F0',
  className = '',
  subtleDepth = true,
}: TornPaperMaskProps) {
  const path = TORN_PATHS_TOP[variant % TORN_PATHS_TOP.length];

  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none select-none z-20 ${className}`}
      style={{
        height: '60px',
        marginTop: '-59px',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-full block"
        style={{
          filter: subtleDepth ? 'drop-shadow(0 -4px 12px rgba(30, 20, 15, 0.05))' : 'none',
        }}
      >
        <path d={path} fill={color} />
        {/* Subtle exposed deckle fiber highlight */}
        <path
          d={path}
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}

/**
 * Reusable Torn Paper Bottom Mask
 * Renders an irregular deckled lower paper edge spanning the full viewport.
 */
export function TornPaperMaskBottom({
  variant = 0,
  color = '#FAF6F0',
  className = '',
  subtleDepth = true,
}: TornPaperMaskProps) {
  const path = TORN_PATHS_BOTTOM[variant % TORN_PATHS_BOTTOM.length];

  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none select-none z-20 ${className}`}
      style={{
        height: '60px',
        marginBottom: '-59px',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-full block"
        style={{
          filter: subtleDepth ? 'drop-shadow(0 4px 12px rgba(30, 20, 15, 0.05))' : 'none',
        }}
      >
        <path d={path} fill={color} />
        {/* Subtle exposed deckle fiber highlight */}
        <path
          d={path}
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}

interface TornPaperSheetProps {
  children?: React.ReactNode;
  bgColor?: string; // e.g. '#1A1614' for dark charcoal, '#FAF6F0' for warm cream
  topVariant?: 0 | 1 | 2;
  bottomVariant?: 0 | 1;
  className?: string;
  hasTopTear?: boolean;
  hasBottomTear?: boolean;
}

/**
 * Large Continuous Sheet of Torn Editorial Paper
 * Spans full width with irregular deckled top/bottom tears and clean flat body.
 */
export function TornPaperSheet({
  children,
  bgColor = '#1A1614',
  topVariant = 0,
  bottomVariant = 0,
  className = '',
  hasTopTear = true,
  hasBottomTear = true,
}: TornPaperSheetProps) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Top Deckled Edge */}
      {hasTopTear && (
        <div
          className="relative w-full pointer-events-none z-20 overflow-hidden"
          style={{ height: '54px', marginBottom: '-2px' }}
        >
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="w-full h-full block"
            style={{ filter: 'drop-shadow(0 -3px 8px rgba(30, 20, 15, 0.04))' }}
          >
            <path d={TORN_PATHS_TOP[topVariant % TORN_PATHS_TOP.length]} fill={bgColor} />
            <path
              d={TORN_PATHS_TOP[topVariant % TORN_PATHS_TOP.length]}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.7"
            />
          </svg>
        </div>
      )}

      {/* Clean Flat Sheet Body */}
      <div
        className="relative w-full z-10"
        style={{ backgroundColor: bgColor }}
      >
        {children}
      </div>

      {/* Bottom Deckled Edge */}
      {hasBottomTear && (
        <div
          className="relative w-full pointer-events-none z-20 overflow-hidden"
          style={{ height: '54px', marginTop: '-2px' }}
        >
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="w-full h-full block"
            style={{ filter: 'drop-shadow(0 4px 10px rgba(30, 20, 15, 0.05))' }}
          >
            <path d={TORN_PATHS_BOTTOM[bottomVariant % TORN_PATHS_BOTTOM.length]} fill={bgColor} />
            <path
              d={TORN_PATHS_BOTTOM[bottomVariant % TORN_PATHS_BOTTOM.length]}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.7"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

interface TornPaperTransitionProps {
  color?: string; // Target paper color, e.g. '#FAF6F0'
  variant?: 0 | 1 | 2;
  className?: string;
}

/**
 * Photo to Paper Transition
 * Clean full-bleed photography transitioning into warm cream paper with a single natural torn deckle edge.
 */
export function TornPaperTransition({
  color = '#FAF6F0',
  variant = 1,
  className = '',
}: TornPaperTransitionProps) {
  const path = TORN_PATHS_TOP[variant % TORN_PATHS_TOP.length];

  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none select-none z-20 ${className}`}
      style={{
        height: '64px',
        marginTop: '-63px',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-full block"
        style={{
          filter: 'drop-shadow(0 -4px 12px rgba(30, 20, 15, 0.06))',
        }}
      >
        <path d={path} fill={color} />
        {/* Subtle fiber line */}
        <path
          d={path}
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="0.75"
        />
      </svg>
    </div>
  );
}
