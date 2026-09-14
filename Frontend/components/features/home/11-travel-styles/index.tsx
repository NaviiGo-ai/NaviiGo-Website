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

// Every place is a real Indian location so the Google Places photo pipeline
// resolves a genuine image; the Unsplash URL is only a last-resort fallback.
const STYLES = [
  {
    title: 'Wilderness',
    region: 'Ranthambore',
    place: 'Ranthambore National Park',
    city: 'Sawai Madhopur',
    fallback:
      'https://images.unsplash.com/photo-1549479361-ec85387d8a68?q=80&w=2000&auto=format&fit=crop',
  },
  {
    title: 'Heritage',
    region: 'Jaipur',
    place: 'Amber Fort',
    city: 'Jaipur',
    fallback:
      'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=2000&auto=format&fit=crop',
  },
  {
    title: 'Wellness',
    region: 'Kerala Backwaters',
    place: 'Kumarakom Lake Resort',
    city: 'Kumarakom',
    fallback:
      'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?q=80&w=2000&auto=format&fit=crop',
  },
  {
    title: 'Culinary',
    region: 'Kochi',
    place: 'Mattancherry Spice Market',
    city: 'Kochi',
    fallback:
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=2000&auto=format&fit=crop',
  },
];

export default function TravelStyles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeRef = useRef(0);

  // Imperative, re-render-free: hovering or focusing a row drives the image
  // window. The active image unfolds from the bottom via a clip-path wipe.
  const activate = (idx: number) => {
    if (idx === activeRef.current) return;
    activeRef.current = idx;

    layerRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { zIndex: i === idx ? 1 : 0 });
      if (i === idx) {
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.12, opacity: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, opacity: 1, duration: 1.15, ease: 'power3.out' }
        );
      } else {
        gsap.to(el, { opacity: 0, duration: 0.6, ease: 'power2.out', overwrite: true });
      }
    });
  };

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        if (windowRef.current) gsap.set(windowRef.current, { clipPath: 'inset(0% 0% 0% 0%)' });
        return;
      }

      const rows = Array.from(containerRef.current.querySelectorAll<HTMLElement>('.ts-row'));

      const tl = gsap.timeline({
        scrollTrigger: { trigger: containerRef.current, start: 'top 72%' },
      });

      // Image window unfurls from the bottom, then settles out of a slight zoom.
      if (windowRef.current) {
        tl.fromTo(
          windowRef.current,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' },
          0
        ).fromTo(windowRef.current, { scale: 1.18 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0);
      }

      // Rows tip up into place from a 3D perspective rather than fading in.
      tl.from(
        rows,
        {
          yPercent: 55,
          rotationX: -38,
          opacity: 0,
          transformOrigin: 'top center',
          transformPerspective: 1000,
          duration: 1.1,
          stagger: 0.08,
          ease: 'power3.out',
        },
        0.2
      );
    },
    { scope: containerRef }
  );

  return (
    <FullBleed
      ref={containerRef}
      className="relative flex items-center bg-deep-charcoal text-warm-ivory-50"
    >
      {/* ── Image window (desktop) ─────────────────────────────── */}
      <div
        ref={windowRef}
        className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[42%] overflow-hidden md:block"
        style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      >
        {STYLES.map((style, i) => (
          <div
            key={style.title}
            ref={(el) => {
              layerRefs.current[i] = el;
            }}
            className="absolute inset-0"
            style={{ opacity: i === 0 ? 1 : 0, zIndex: i === 0 ? 1 : 0 }}
          >
            <PlaceImage
              name={style.place}
              city={style.city}
              width={1600}
              asBackground
              fallbackUrl={style.fallback}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ))}
        {/* Tonal scrim keeps the type side deep and lets the image breathe right */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-deep-charcoal from-[15%] via-deep-charcoal/60 via-[60%] to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-deep-charcoal/60 via-transparent to-transparent" />
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative z-10 w-full px-6 py-28 md:px-12 md:py-40">
        <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="mb-6 flex items-center space-x-3 font-mono text-[10px] uppercase tracking-[0.2em] opacity-80 md:text-xs">
              <span>11</span>
              <span className="block h-[1px] w-8 bg-warm-ivory-50/40" />
              <span>Travel Styles</span>
            </div>

            <div className="mb-14 max-w-md md:mb-20">
              <LineMask>
                <h2 className="font-serif text-3xl leading-[1.05] tracking-tight md:text-4xl">
                  Four ways into India, each drawn from scratch.
                </h2>
              </LineMask>
              <p className="mt-6 font-sans text-sm leading-relaxed text-warm-ivory-50/50 md:text-base">
                Bring us the pace you keep and the company you keep it with. We shape the rest.
              </p>
            </div>

            <div className="flex flex-col border-t border-warm-ivory-50/10">
              {STYLES.map((style, i) => (
                <Link
                  key={style.title}
                  href="/explore"
                  onMouseEnter={() => activate(i)}
                  onFocus={() => activate(i)}
                  aria-label={`Explore ${style.title} journeys in ${style.region}`}
                  className="ts-row group block border-b border-warm-ivory-50/10 py-7 will-change-transform md:py-9"
                >
                  <div className="flex items-baseline justify-between gap-6">
                    <h3 className="font-serif text-5xl uppercase leading-[0.85] tracking-tight transition-transform duration-700 ease-out group-hover:translate-x-4 group-focus-visible:translate-x-4 lg:text-6xl xl:text-7xl 2xl:text-8xl">
                      {style.title}
                    </h3>
                    <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-warm-ivory-50/40 transition-colors duration-700 group-hover:text-saffron-300 group-focus-visible:text-saffron-300 md:block">
                      {style.region}
                    </span>
                  </div>

                  {/* Tap devices get the image inline — no hover required */}
                  <div className="relative mt-6 h-[52vw] w-full overflow-hidden md:hidden">
                    <PlaceImage
                      name={style.place}
                      city={style.city}
                      width={1200}
                      asBackground
                      fallbackUrl={style.fallback}
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FullBleed>
  );
}
