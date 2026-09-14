'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LineMask from '@/lib/motion/LineMask';

gsap.registerPlugin(ScrollTrigger);

interface FooterLink {
  label: string;
  href: string;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

const groups: FooterGroup[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Destinations', href: '/explore' },
      { label: 'Itineraries', href: '/itinerary' },
      { label: 'Offers', href: '/deals' },
    ],
  },
  {
    title: 'Concierge',
    links: [
      { label: 'Concierge', href: '/support' },
      { label: 'Bookings', href: '/bookings' },
      { label: 'Passport', href: '/passport' },
    ],
  },
  {
    title: 'House',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Saved Journeys', href: '/saved' },
    ],
  },
];

const legal: FooterLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function OversizedFooter() {
  const containerRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const root = containerRef.current;
      if (!root) return;

      // 1. Hairline rule draws across the masthead.
      gsap.fromTo(
        root.querySelectorAll('.footer-rule'),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.6,
          ease: 'expo.out',
          transformOrigin: 'left center',
          scrollTrigger: { trigger: root, start: 'top 85%' },
        }
      );

      // 2. Editorial link columns unfold via clip-path — not a fade-up.
      gsap.fromTo(
        root.querySelectorAll('.footer-link'),
        { clipPath: 'inset(0% 0% 100% 0%)', yPercent: 40 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          yPercent: 0,
          duration: 1.1,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: { trigger: root, start: 'top 78%' },
        }
      );

      // 3. The wordmark rises out of the fold and settles as the page ends.
      gsap.fromTo(
        wordmarkRef.current,
        { yPercent: 100, scale: 1.06 },
        {
          yPercent: 0,
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top 65%',
            end: 'bottom bottom',
            scrub: 1,
          },
        }
      );
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return (
    <footer
      ref={containerRef}
      className="relative min-h-screen bg-deep-charcoal-950 text-warm-ivory overflow-hidden flex flex-col justify-end pt-32 md:pt-48"
    >
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="footer-rule h-[1px] w-full bg-warm-ivory/15" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-16 lg:gap-x-8 pt-12 md:pt-16">
          {/* Masthead */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-x-3 font-mono text-xs tracking-widest uppercase text-warm-ivory/40">
              <span>14</span>
              <span className="w-8 h-[1px] bg-current" />
              <span>NaviiGo</span>
            </div>

            <h2 className="mt-10 text-5xl md:text-6xl lg:text-7xl font-serif leading-[0.95] tracking-tight">
              <LineMask>Soul of India,</LineMask>
              <LineMask>privately guided.</LineMask>
            </h2>

            <p className="mt-8 max-w-sm text-sm md:text-base font-sans text-warm-ivory/50 leading-relaxed">
              A private travel house designing singular journeys across Rajasthan,
              Kerala, Ladakh and the Andamans.
            </p>

            <Link href="/bookings" className="group mt-12 inline-flex items-center gap-6">
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-warm-ivory/50 group-hover:text-warm-ivory transition-colors duration-500">
                Plan your journey
              </span>
              <span className="w-14 h-14 rounded-full border border-warm-ivory/20 flex items-center justify-center group-hover:bg-warm-ivory group-hover:text-deep-charcoal group-hover:border-warm-ivory transition-all duration-700 ease-out">
                <svg
                  className="w-4 h-4 -rotate-45 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Footer"
            className="lg:col-span-6 lg:col-start-7 grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8"
          >
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="font-mono text-[10px] tracking-[0.25em] uppercase text-warm-ivory/35 mb-6">
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="footer-link inline-block text-xl md:text-2xl font-serif text-warm-ivory/70 hover:text-saffron transition-colors duration-500"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Oversized wordmark — rises out of the fold on scroll */}
      <div className="relative mt-24 md:mt-32">
        <div className="overflow-hidden">
          <div ref={wordmarkRef}>
            <span className="block w-full text-[25vw] md:text-[23vw] font-serif leading-[0.75] tracking-tighter text-center select-none text-warm-ivory pointer-events-none whitespace-nowrap">
              NAVIIGO
            </span>
          </div>
        </div>
      </div>

      {/* Legal row */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24">
        <div className="mt-8 pt-6 border-t border-warm-ivory/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] md:text-xs font-mono tracking-widest uppercase text-warm-ivory/40">
          <span>© 2026 NaviiGo. Soul of India.</span>
          <div className="flex items-center gap-x-8">
            {legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-warm-ivory transition-colors duration-500"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="h-6" />
      </div>
    </footer>
  );
}
