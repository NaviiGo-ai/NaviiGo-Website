'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LineMask from '@/lib/motion/LineMask';

gsap.registerPlugin(ScrollTrigger);

interface Stat {
  number: string;
  label: string;
  suffix?: string;
  note: string;
}

// Figures are consistent with the brand's "Est. 2026" positioning in section 01 —
// no tenure claim the hero contradicts.
const stats: Stat[] = [
  { number: '98', suffix: '%', label: 'Client Retention', note: 'Travellers who return to plan again' },
  { number: '24/7', label: 'Human Concierge', note: 'A named contact, never a queue' },
  { number: '40', suffix: '+', label: 'Indian Destinations', note: 'From Ladakh passes to Kerala backwaters' },
  { number: '72', suffix: 'h', label: 'First Itinerary', note: 'From your brief to a drafted journey' },
];

export default function NumbersTrust() {
  const containerRef = useRef<HTMLElement>(null);
  const statRefs = useRef<(HTMLDivElement | null)[]>(Array(stats.length).fill(null));

  useGSAP(() => {
    stats.forEach((stat, index) => {
      const el = statRefs.current[index];
      if (!el) return;

      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          delay: index * 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        }
      );

      // Non-numeric figures (24/7) only fade; the rest count up.
      if (stat.number.includes('/')) return;

      const target = parseFloat(stat.number);
      const proxy = { val: 0 };
      const valueEl = el.querySelector('.stat-number');

      gsap.to(proxy, {
        val: target,
        duration: 2.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => {
          if (valueEl) valueEl.textContent = `${proxy.val.toFixed(0)}${stat.suffix ?? ''}`;
        },
      });
    });
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative bg-warm-ivory-50 py-28 md:py-40 px-6 md:px-12 lg:px-24"
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Index label */}
        <div className="mb-10 flex items-center space-x-3 font-mono text-xs uppercase tracking-widest text-deep-charcoal-400">
          <span>09</span>
          <span className="h-[1px] w-8 bg-deep-charcoal-400/40" />
          <span>Why Travellers Stay</span>
        </div>

        {/* Heading — restrained, not the previous text-9xl */}
        <h2 className="mb-16 max-w-3xl font-serif text-3xl leading-[1.1] tracking-tight text-deep-charcoal-900 md:mb-24 md:text-5xl lg:text-6xl">
          <LineMask>Trust is quiet.</LineMask>
          <LineMask>
            <span className="italic font-light opacity-80">It shows up in the numbers.</span>
          </LineMask>
        </h2>

        {/* Hairline-separated columns — no cards, no boxes, no shadows */}
        <div className="grid grid-cols-1 border-t border-deep-charcoal-900/15 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              ref={(el) => {
                statRefs.current[index] = el;
              }}
              className="flex flex-col border-b border-deep-charcoal-900/15 py-10 opacity-0 lg:border-b-0 lg:border-r lg:py-12 lg:pr-8 lg:last:border-r-0 lg:[&:not(:first-child)]:pl-8"
            >
              <span className="stat-number mb-5 font-serif text-5xl tracking-tighter text-deep-charcoal-900 md:text-6xl lg:text-7xl">
                {stat.number.includes('/') ? stat.number : '0'}
                {stat.suffix ?? ''}
              </span>
              <p className="mb-2 font-mono text-xs uppercase tracking-widest text-deep-charcoal-900">
                {stat.label}
              </p>
              <p className="max-w-[24ch] font-sans text-sm leading-relaxed text-deep-charcoal-600">
                {stat.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
