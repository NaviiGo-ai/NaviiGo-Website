'use client';

import React, { useRef } from 'react';
import FullBleed from '@/components/layout/primitives/FullBleed';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ponytail: basic pinned scrub crossfade for high-end editorial feel
gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: "The royal treatment in Jaipur was unprecedented. A masterclass in unstinting luxury.",
    author: "C. Montgomery",
    location: "London, UK",
  },
  {
    quote: "Their private access to the Taj Mahal at dawn redefined what absolute exclusivity means.",
    author: "E. Rostova",
    location: "Geneva, CH",
  },
  {
    quote: "A meticulously curated passage through Kerala. Unscripted, untouched, unrepeatable.",
    author: "M. Rodriguez",
    location: "New York, NY",
  }
];

export default function Testimonials() {
  const containerRef = useRef<HTMLDivElement>(null);
  const quotesRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Pin container for 300% of height, crossfade smoothly through 3 quotes
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 1,
      }
    });

    const [q1, q2, q3] = quotesRef.current;
    if (!q1 || !q2 || !q3) return;

    // Timeline sequence (scrubbed over 300vh)
    tl.to(q1, { autoAlpha: 0, y: -40, duration: 1, delay: 0.5 })
      .fromTo(q2, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1 }, "+=0.2")
      .to(q2, { autoAlpha: 0, y: -40, duration: 1, delay: 0.5 })
      .fromTo(q3, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1 }, "+=0.2")
      .to(q3, { autoAlpha: 1, duration: 0.5 }); // buffer space at end

  }, { scope: containerRef });

  return (
    <FullBleed
      ref={containerRef as any}
      className="bg-deep-charcoal-950 text-warm-ivory flex items-center justify-center relative overscroll-none"
    >
      <div className="absolute top-12 left-6 md:left-12 flex items-center space-x-3 text-warm-ivory-600 text-[10px] md:text-xs tracking-[0.2em] uppercase font-mono z-10">
        <span>10</span>
        <span className="w-8 h-[1px] bg-warm-ivory-600 block" />
        <span>Client Voices</span>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 relative flex items-center h-full">
        {testimonials.map((t, i) => (
          <div
            key={i}
            ref={(el) => { quotesRef.current[i] = el; }}
            // Initial state: first is visible, others hidden
            className={`absolute left-6 right-6 md:left-12 md:right-12 top-1/2 -translate-y-1/2 ${
              i === 0 ? 'opacity-100 visible' : 'opacity-0 invisible translate-y-10'
            }`}
          >
            <h3 className="text-4xl md:text-6xl lg:text-[6rem] leading-[1.1] font-serif font-light tracking-tight mb-8 md:mb-12 text-balance">
              &ldquo;{t.quote}&rdquo;
            </h3>
            <div className="flex flex-col md:flex-row gap-2 md:gap-6 font-mono text-xs md:text-sm tracking-widest uppercase text-warm-ivory-600">
              <span className="text-saffron-500">{t.author}</span>
              <span className="hidden md:inline text-warm-ivory-800">—</span>
              <span>{t.location}</span>
            </div>
          </div>
        ))}
      </div>
    </FullBleed>
  );
}
