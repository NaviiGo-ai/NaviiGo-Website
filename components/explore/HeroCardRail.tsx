"use client";

import { useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

export type HeroCard = {
  title: string;
  image: string;
};

type Props = {
  cards: HeroCard[];
};

/**
 * Custom Red Tag Icon
 * Matches the solid red tag with the white circular punch from your reference.
 */
function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" className="rotate-45">
      <path d="M2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82l-7.17 7.17a2 2 0 0 1-2.83 0L2 12z" />
      <circle cx="7" cy="7" r="2.5" fill="white" />
    </svg>
  );
}

/**
 * Indicators
 * Matches the 4-dot navigation style shown above the cards in your target UI.
 */
function Indicators() {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
    </div>
  );
}

export default function HeroCardRail({ cards }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const speedPx = 0.5; // Controls the smoothness of the auto-scroll

  // Triple the cards to create a seamless infinite loop
  const looped = [...cards, ...cards, ...cards];

  const tick = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;

    offsetRef.current -= speedPx;

    // Reset offset when one full set of cards has scrolled by
    const singleSetWidth = el.scrollWidth / 3;
    if (Math.abs(offsetRef.current) >= singleSetWidth) {
      offsetRef.current += singleSetWidth;
    }

    el.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    rafRef.current = requestAnimationFrame(tick);
  }, [speedPx]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tick]);

  return (
    <div
      className="relative w-full"
      style={{
        overflow: 'clip',
        // Edge-burn/Merging effect: Fades the cards into the background on the right
        WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 90%)',
        maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 90%)',
      }}
      data-hero-cards
    >
      <div
        ref={stripRef}
        className="flex w-max items-start gap-6 pb-4"
        style={{ willChange: 'transform' }}
        data-hero-cards-inner
      >
        {looped.map((card, idx) => (
          <article 
            key={`${card.title}-${idx}`} 
            className="flex shrink-0 flex-col gap-3"
            data-hero-card
          >
            {/* Card Header: Title & Dots above the card image */}
            <div className="flex items-center justify-between px-1 text-[14px] font-semibold tracking-wide text-white/95">
              <span>{card.title}</span>
              <Indicators />
            </div>

            {/* Card Body: Evenly sized with fixed dimensions */}
            <div className="relative h-[380px] w-[280px] overflow-hidden rounded-[20px] bg-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
              <Image 
                src={card.image} 
                alt={card.title} 
                fill 
                className="object-cover" 
                sizes="280px" 
              />
              
              {/* Bottom vignette for text contrast */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />

              {/* Red Tag Floating Button */}
              <button 
                type="button" 
                className="absolute right-3 top-3 z-10 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white"
                aria-label="Save destination"
              >
                <TagIcon />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}