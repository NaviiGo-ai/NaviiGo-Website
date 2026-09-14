'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import PlaceImage from '@/components/shared/PlaceImage';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// A real route, in order — the numbering is the itinerary, not decoration.
const ROUTE = [
  { no: '01', place: 'Udaipur', nights: '4 nights', detail: 'Lake Palace, City Palace' },
  { no: '02', place: 'Jodhpur', nights: '3 nights', detail: 'Mehrangarh, Umaid Bhawan' },
  { no: '03', place: 'Jaipur', nights: '4 nights', detail: 'Amber Fort, Rambagh Palace' },
  { no: '04', place: 'Ranthambore', nights: '3 nights', detail: 'Aman-i-Khas, Tiger Reserve' },
];

const DETAILS = [
  { label: 'Duration', value: '14 Days' },
  { label: 'Pace', value: 'Leisurely' },
  { label: 'Palaces', value: 'Eleven' },
  { label: 'Season', value: 'Oct — Mar' },
];

export default function FeaturedJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (
      !sectionRef.current ||
      !imageRef.current ||
      !contentRef.current ||
      !titleRef.current ||
      !routeRef.current ||
      !lineRef.current
    ) {
      return;
    }

    // Everything below is decorative motion. Without it the section reads
    // exactly the same — just still.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // 1. The photograph unfolds downward from a hard edge.
    gsap.fromTo(
      imageRef.current,
      { clipPath: 'inset(100% 0% 0% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.6,
        ease: 'expo.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
      }
    );

    // 2. Depth on the ground layer — the frame drifts as the section passes.
    gsap.fromTo(
      imageRef.current,
      { yPercent: -6, scale: 1.08 },
      {
        yPercent: 6,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );

    // 3. The editorial block flows in on a 3D plane — perspective + rotationX.
    gsap.fromTo(
      contentRef.current,
      { rotationX: 14, y: 70, opacity: 0, transformOrigin: '50% 100%' },
      {
        rotationX: 0,
        y: 0,
        opacity: 1,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      }
    );

    // 4. The title is curtained in from below, after the plane settles.
    gsap.fromTo(
      titleRef.current,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.2,
        delay: 0.25,
        ease: 'expo.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 72%', once: true },
      }
    );

    // 5. The route draws itself as you scroll, each station arriving in turn.
    const stops = gsap.utils.toArray<HTMLElement>('.route-stop');
    gsap
      .timeline({
        scrollTrigger: {
          trigger: routeRef.current,
          start: 'top 92%',
          end: 'bottom 55%',
          scrub: 1,
        },
      })
      .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)
      .fromTo(
        stops,
        { opacity: 0.15, y: 28 },
        { opacity: 1, y: 0, ease: 'none', duration: 0.4, stagger: 0.22 },
        0.06
      );
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen bg-deep-charcoal-950 text-warm-ivory overflow-hidden flex flex-col"
    >
      {/* Ground: the palace photograph, curtained in and drifting */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div ref={imageRef} className="absolute inset-0 w-full h-[125%] -top-[12.5%]">
          <PlaceImage
            name="Umaid Bhawan Palace"
            city="Jodhpur"
            width={2000}
            asBackground
            fallbackUrl="https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=2574&auto=format&fit=crop"
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute inset-0 bg-deep-charcoal-950/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal-950 via-deep-charcoal-950/40 to-deep-charcoal-950/10" />
        </div>
      </div>

      {/* Content plane */}
      <div
        className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 pt-28 md:pt-32 pb-14 md:pb-20 flex flex-col min-h-screen"
        style={{ perspective: '1400px' }}
      >
        {/* Section index + the one way out */}
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center space-x-3 font-mono text-xs tracking-widest uppercase text-warm-ivory/60">
            <span>08</span>
            <span className="w-8 h-[1px] bg-current" />
            <span>Signature Itinerary</span>
          </div>

          <Link
            href="/itinerary"
            className="group flex items-center gap-4 text-xs font-sans tracking-[0.2em] uppercase text-warm-ivory hover:text-saffron-400 transition-colors shrink-0"
          >
            <span>View Full Itinerary</span>
            <span className="w-12 h-[1px] bg-warm-ivory/50 transition-all duration-500 group-hover:w-16 group-hover:bg-saffron-400" />
          </Link>
        </div>

        {/* Everything below the label sits on one 3D plane */}
        <div ref={contentRef} className="mt-auto w-full" style={{ transformStyle: 'preserve-3d' }}>
          <h2
            ref={titleRef}
            className="font-serif tracking-tighter leading-[0.92] text-warm-ivory text-5xl md:text-6xl lg:text-[6.5rem]"
          >
            The Royal
            <br />
            <span className="italic font-light text-saffron-400">Rajasthan</span> Circuit
          </h2>

          <p className="mt-6 md:mt-8 max-w-xl font-sans text-sm md:text-base leading-relaxed text-warm-ivory/65">
            Fourteen unhurried days across the Aravalli — lake palaces at first light, desert forts
            at dusk, and a private tented camp on the edge of tiger country.
          </p>

          {/* The route, drawn left to right */}
          <div ref={routeRef} className="mt-12 md:mt-16">
            <div className="relative h-[1px] w-full bg-warm-ivory/20">
              <div
                ref={lineRef}
                className="absolute inset-0 origin-left bg-saffron-500"
              />
            </div>

            <div className="mt-0 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
              {ROUTE.map((stop) => (
                <div key={stop.no} className="route-stop flex flex-col">
                  <span className="block w-[1px] h-5 bg-warm-ivory/25" />
                  <span className="mt-4 font-mono text-[10px] tracking-[0.3em] text-warm-ivory/45">
                    {stop.no}
                  </span>
                  <span className="mt-3 font-serif text-2xl md:text-3xl lg:text-4xl leading-none text-warm-ivory">
                    {stop.place}
                  </span>
                  <span className="mt-3 font-sans text-xs text-warm-ivory/50">{stop.nights}</span>
                  <span className="mt-1 font-sans text-sm text-warm-ivory/70">{stop.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* The numbers behind the itinerary */}
          <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-warm-ivory/15 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8">
            {DETAILS.map((item) => (
              <div key={item.label} className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-warm-ivory/45">
                  {item.label}
                </span>
                <span className="mt-3 block h-[1px] w-full bg-warm-ivory/10" />
                <span className="mt-3 font-serif text-2xl md:text-3xl text-warm-ivory">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
