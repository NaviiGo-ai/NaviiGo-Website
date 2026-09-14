'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface JourneyPathChapter02Props {
  sectionRef: React.RefObject<HTMLElement | null>;
  badgeRefs: React.RefObject<HTMLDivElement | null>[];
}

export default function JourneyPathChapter02({
  sectionRef,
  badgeRefs,
}: JourneyPathChapter02Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const headDotRef = useRef<SVGCircleElement>(null);
  const [pathD, setPathD] = useState<string>('');
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1440,
    height: 3200,
  });

  // Calculate pixel-accurate cubic Bézier curve passing through each badge
  const calculatePath = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const sRect = section.getBoundingClientRect();
    const sWidth = Math.round(section.offsetWidth || sRect.width || 1440);
    const sHeight = Math.round(section.offsetHeight || sRect.height || 3200);

    setDimensions({ width: sWidth, height: sHeight });

    // Measure centers of each badge relative to the section element
    const pts = badgeRefs.map((ref) => {
      if (!ref.current) return null;
      const bRect = ref.current.getBoundingClientRect();
      return {
        x: Math.round(bRect.left + bRect.width / 2 - sRect.left),
        y: Math.round(bRect.top + bRect.height / 2 - sRect.top),
      };
    });

    const validPts = pts.filter((p): p is { x: number; y: number } => p !== null);
    if (validPts.length < 3) return;

    const [p1, p2, p3] = validPts;
    const p4 = validPts.length >= 4 ? validPts[3] : null;

    // ── 1. Origin: Starts inside Section 2, above Card 1 ─────────
    // Directly matching reference Screenshot 2: starts above Card 1,
    // descends in an organic, gentle S-curve straight into Badge 1.
    const x0 = Math.round(p1.x - 55);
    const y0 = Math.max(40, Math.round(p1.y - 240));

    // Segment 0: (x0, y0) -> Badge 1 (Card 1, Right)
    const seg0 = `M ${x0},${y0} C ${x0 + 40},${y0 + 80} ${p1.x - 20},${p1.y - 80} ${p1.x},${p1.y}`;

    // Segment 1: Badge 1 -> Badge 2 (Card 2, Left)
    // Directly matching reference Screenshot 4: leaves Card 1 going leftwards,
    // arches smoothly across center, and swoops down into Badge 2.
    const dx12 = p1.x - p2.x;
    const dy12 = p2.y - p1.y;
    const seg1 = `C ${Math.round(p1.x - dx12 * 0.45)},${Math.round(p1.y + dy12 * 0.15)} ${Math.round(p2.x + dx12 * 0.35)},${Math.round(p2.y - dy12 * 0.35)} ${p2.x},${p2.y}`;

    // Segment 2: Badge 2 -> Badge 3 (Card 3, Right)
    // Directly matching reference Screenshot 5: leaves Card 2 going rightwards,
    // arches smoothly across center, and swoops down into Badge 3.
    const dx23 = p3.x - p2.x;
    const dy23 = p3.y - p2.y;
    const seg2 = `C ${Math.round(p2.x + dx23 * 0.45)},${Math.round(p2.y + dy23 * 0.15)} ${Math.round(p3.x - dx23 * 0.35)},${Math.round(p3.y - dy23 * 0.35)} ${p3.x},${p3.y}`;

    let fullD = `${seg0} ${seg1} ${seg2}`;

    if (p4) {
      // Segment 3: Badge 3 -> Badge 4 (Card 4, Left)
      const dx34 = p3.x - p4.x;
      const dy34 = p4.y - p3.y;
      const seg3 = `C ${Math.round(p3.x - dx34 * 0.45)},${Math.round(p3.y + dy34 * 0.15)} ${Math.round(p4.x + dx34 * 0.35)},${Math.round(p4.y - dy34 * 0.35)} ${p4.x},${p4.y}`;
      
      // Exit Swoop: Leaves Badge 4 down towards bottom center
      const exitX = Math.round(p4.x + 90);
      const exitY = Math.min(sHeight - 30, Math.round(p4.y + 190));
      const segExit = `C ${p4.x + 40},${p4.y + 80} ${exitX},${exitY - 40} ${exitX},${exitY}`;
      fullD = `${seg0} ${seg1} ${seg2} ${seg3} ${segExit}`;
    } else {
      // Exit Swoop after Badge 3
      const exitX = Math.round(p3.x - 100);
      const exitY = Math.min(sHeight - 30, Math.round(p3.y + 200));
      const segExit = `C ${p3.x - 40},${p3.y + 80} ${exitX},${exitY - 40} ${exitX},${exitY}`;
      fullD = `${seg0} ${seg1} ${seg2} ${segExit}`;
    }

    setPathD(fullD);
  }, [sectionRef, badgeRefs]);

  // Recalculate on mount, window resize, and image loads
  useEffect(() => {
    // Initial measurement after mount
    const timer1 = setTimeout(calculatePath, 60);
    const timer2 = setTimeout(calculatePath, 300);
    const timer3 = setTimeout(calculatePath, 1000);

    window.addEventListener('resize', calculatePath);
    window.addEventListener('load', calculatePath);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', calculatePath);
      window.removeEventListener('load', calculatePath);
    };
  }, [calculatePath]);

  // GSAP ScrollTrigger to reveal the hidden path as the user scrolls
  useEffect(() => {
    const section = sectionRef.current;
    const pathEl = pathRef.current;
    if (!section || !pathEl || !pathD) return;

    const ctx = gsap.context(() => {
      const totalLen = pathEl.getTotalLength() || 2400;

      // Ensure path is 100% hidden ahead of time
      gsap.set(pathEl, {
        strokeDasharray: totalLen,
        strokeDashoffset: totalLen,
      });

      // Sample path to calculate exact progress fractions where badges are reached
      const sRect = section.getBoundingClientRect();
      const validBadgePts: { x: number; y: number }[] = [];
      badgeRefs.forEach((ref) => {
        if (!ref.current) return;
        const bRect = ref.current.getBoundingClientRect();
        validBadgePts.push({
          x: Math.round(bRect.left + bRect.width / 2 - sRect.left),
          y: Math.round(bRect.top + bRect.height / 2 - sRect.top),
        });
      });

      const sampleCount = 300;
      const badgeFractions: number[] = [];
      validBadgePts.forEach((pt) => {
        let closestFraction = 0;
        let minDistance = Infinity;
        for (let i = 0; i <= sampleCount; i++) {
          const frac = i / sampleCount;
          const sampled = pathEl.getPointAtLength(frac * totalLen);
          const dist = Math.hypot(sampled.x - pt.x, sampled.y - pt.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestFraction = frac;
          }
        }
        badgeFractions.push(closestFraction);
      });

      // ScrollTrigger scrub animation
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 85%',
        scrub: 1,
        refreshPriority: 6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;

          // Reveal path up to current scroll progress
          const currentOffset = totalLen * (1 - p);
          gsap.set(pathEl, { strokeDashoffset: currentOffset });

          // Position explorer leading head dot at the tip of the revealed line
          if (headDotRef.current) {
            const currentLen = Math.min(totalLen, Math.max(0, p * totalLen));
            const pt = pathEl.getPointAtLength(currentLen);
            headDotRef.current.setAttribute('cx', String(pt.x));
            headDotRef.current.setAttribute('cy', String(pt.y));
            headDotRef.current.style.opacity = p > 0.015 && p < 0.985 ? '1' : '0';
          }

          // Illuminate badges as the line arrives at each node
          badgeRefs.forEach((ref, idx) => {
            if (!ref.current) return;
            const triggerFrac = (badgeFractions[idx] ?? 0) - 0.01;
            if (p >= triggerFrac) {
              ref.current.classList.add('badge-illuminated');
            } else {
              ref.current.classList.remove('badge-illuminated');
            }
          });
        },
      });
    }, section);

    ScrollTrigger.refresh();

    return () => ctx.revert();
  }, [sectionRef, badgeRefs, pathD]);

  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none select-none z-25 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="w-full h-full"
        style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}
        preserveAspectRatio="none"
      >
        {/* Animated Drawing Orange Journey Line:
            - Path ahead is 100% hidden (NO background line).
            - Draws progressively forward as user scrolls down.
            - Intersects directly through Badge 1, Badge 2, Badge 3, Badge 4.
        */}
        {pathD && (
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke="#EC6426"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              vectorEffect: 'non-scaling-stroke',
              filter: 'drop-shadow(0 0 6px rgba(236, 100, 38, 0.5))',
            }}
          />
        )}

        {/* Glowing explorer tip dot at the leading head of the drawn line */}
        <circle
          ref={headDotRef}
          r="6"
          fill="#EC6426"
          stroke="#FAF6F0"
          strokeWidth="2.5"
          className="transition-opacity duration-200 pointer-events-none"
          style={{
            opacity: 0,
            filter: 'drop-shadow(0 0 10px #EC6426)',
          }}
        />
      </svg>
    </div>
  );
}
