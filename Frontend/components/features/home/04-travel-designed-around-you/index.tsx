'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import FullBleed from '@/components/layout/primitives/FullBleed';
import PlaceImage from '@/components/shared/PlaceImage';
import LineMask from '@/lib/motion/LineMask';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface BriefRow {
  /** A real Indian place — drives the Google Places photo lookup. */
  place: string;
  city: string;
  fallbackUrl: string;
  /** The traveller's words. */
  brief: string;
  /** What we arranged in response. */
  answer: string;
}

const ROWS: BriefRow[] = [
  {
    place: 'Lake Pichola',
    city: 'Udaipur',
    fallbackUrl:
      'https://images.unsplash.com/photo-1599661559132-7667a4dccf69?q=80&w=1600&auto=format&fit=crop',
    brief: 'Take us to the water palace — but not with ten thousand other people.',
    answer:
      'A private boat before sunrise, a silent approach while the city is still asleep, and breakfast on the lake as the palace turns gold.',
  },
  {
    place: 'Kumarakom',
    city: 'Kerala',
    fallbackUrl:
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?q=80&w=1600&auto=format&fit=crop',
    brief: 'We want to move slowly. Genuinely slowly.',
    answer:
      'A houseboat on the backwaters that docks wherever the morning looks best. No schedule, and a captain content to wait.',
  },
  {
    place: 'Amber Fort',
    city: 'Jaipur',
    fallbackUrl:
      'https://images.unsplash.com/photo-1599827552599-eadf5af3c6ce?q=80&w=1600&auto=format&fit=crop',
    brief: 'Our daughter has read about the fort for a year.',
    answer:
      'A closed-door walk of Amber Fort with an architectural historian, then an afternoon in the workshop of the family who restores its mirrorwork.',
  },
];

export default function TravelDesignedAroundYou() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      // Respect reduced motion: leave everything in its visible resting state.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const frames = gsap.utils.toArray<HTMLElement>('.tday-frame', root);
      const medias = gsap.utils.toArray<HTMLElement>('.tday-media', root);
      const copies = gsap.utils.toArray<HTMLElement>('.tday-copy', root);

      frames.forEach((frame, i) => {
        const media = medias[i];
        if (!media) return;

        // Asymmetric clip-path unfold: plates slide in from the margin they sit against.
        gsap.set(frame, {
          clipPath: i % 2 === 0 ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)',
        });
        gsap.set(media, { scale: 1.28 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: frame,
              start: 'top 82%',
              toggleActions: 'play none none reverse',
            },
          })
          .to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out' })
          .to(media, { scale: 1, duration: 1.5, ease: 'power3.out' }, '<');

        // Depth: the photograph drifts against the scroll.
        gsap.fromTo(
          media,
          { yPercent: -7 },
          {
            yPercent: 7,
            ease: 'none',
            scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: 1 },
          },
        );
      });

      // The brief → the answer, read in three beats.
      copies.forEach((copy) => {
        gsap.fromTo(
          copy.querySelectorAll('.tday-line'),
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: copy, start: 'top 82%' },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <FullBleed
      ref={sectionRef}
      className="border-t border-deep-charcoal-900/5 bg-warm-ivory-50 py-24 text-deep-charcoal-950 md:py-40"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-12">
        {/* ── Index + statement ─────────────────────────────────────────── */}
        <div className="mb-16 grid grid-cols-1 items-end gap-10 md:mb-24 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <div className="flex items-center space-x-3 font-mono text-xs uppercase tracking-widest text-deep-charcoal-400">
              <span>04</span>
              <span className="h-[1px] w-8 bg-deep-charcoal-400/40" />
              <span>Designed Around You</span>
            </div>
          </div>

          <h2 className="font-serif text-4xl leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:col-span-9 lg:text-[5.5rem]">
            <LineMask>Give us a sentence.</LineMask>
            <LineMask>
              <span className="block pl-8 font-light italic text-deep-charcoal-700 md:pl-24">
                We return a journey.
              </span>
            </LineMask>
          </h2>
        </div>

        <p className="mb-24 max-w-xl font-sans text-base leading-relaxed text-deep-charcoal-600 md:mb-40 md:text-lg lg:ml-[25%]">
          No two NaviiGo journeys begin alike. Yours starts as a conversation — a pace, a fear, a
          photograph someone once loved — and ends as a country rearranged around you.
        </p>

        {/* ── Briefs, one at a time ─────────────────────────────────────── */}
        <div className="flex flex-col gap-24 md:gap-40">
          {ROWS.map((row, i) => {
            const flip = i % 2 === 1;
            return (
              <div
                key={row.place}
                className="grid grid-cols-1 items-center gap-10 md:grid-cols-12 md:gap-16"
              >
                <div
                  className={`tday-frame relative overflow-hidden bg-deep-charcoal-100 md:col-span-6 ${
                    i === 1 ? 'aspect-[4/5] sm:aspect-[3/2]' : 'aspect-[4/5]'
                  } ${flip ? 'md:order-2 md:col-start-7' : 'md:order-1 md:col-start-1'}`}
                >
                  <div className="tday-media absolute inset-[-8%]">
                    <PlaceImage
                      name={row.place}
                      city={row.city}
                      width={1200}
                      asBackground
                      fallbackUrl={row.fallbackUrl}
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </div>

                <div
                  className={`tday-copy md:col-span-5 ${
                    flip ? 'md:order-1 md:col-start-1' : 'md:order-2 md:col-start-8'
                  }`}
                >
                  <span className="tday-line mb-4 block font-mono text-[11px] tracking-wide text-deep-charcoal-400">
                    the brief
                  </span>
                  <blockquote className="tday-line mb-8 font-serif text-2xl leading-snug italic text-deep-charcoal-900 md:text-3xl">
                    {row.brief}
                  </blockquote>
                  <div className="tday-line mb-8 h-[1px] w-10 bg-saffron-500" />
                  <span className="tday-line mb-4 block font-mono text-[11px] tracking-wide text-deep-charcoal-400">
                    our answer
                  </span>
                  <p className="tday-line max-w-md font-sans text-base leading-relaxed text-deep-charcoal-600 md:text-lg">
                    {row.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-24 flex justify-end md:mt-40">
          <Link
            href="/itinerary"
            className="font-mono text-xs uppercase tracking-widest text-deep-charcoal-900 underline decoration-deep-charcoal-300 underline-offset-8 transition-colors duration-500 hover:text-saffron-600 hover:decoration-saffron-500"
          >
            Read a finished itinerary
          </Link>
        </div>
      </div>
    </FullBleed>
  );
}
