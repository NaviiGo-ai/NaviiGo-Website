'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FullBleed from '@/components/layout/primitives/FullBleed';
import PlaceImage from '@/components/shared/PlaceImage';

gsap.registerPlugin(ScrollTrigger);

export default function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const kenRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.inOut' } });

      // 1. "Flow in" — the still unfolds from a centred window to full bleed
      tl.fromTo(
        mediaRef.current,
        { clipPath: 'inset(22% 14%)', scale: 1.18 },
        { clipPath: 'inset(0%)', scale: 1, duration: 2.1, ease: 'power4.inOut' }
      )
        // 2. Editorial index settles in
        .fromTo(
          labelRef.current,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out' },
          '-=1.3'
        )
        .fromTo(
          [descRef.current, ctaRef.current],
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 1, stagger: 0.16, ease: 'power2.out' },
          '-=1.0'
        )
        // 3. 3D perspective read-in of the headline, masked line by line
        .fromTo(
          '.hero-title-line',
          { yPercent: 120, rotationX: -55, autoAlpha: 0, transformPerspective: 1200, transformOrigin: '50% 100%' },
          { yPercent: 0, rotationX: 0, autoAlpha: 1, duration: 1.7, stagger: 0.14, ease: 'expo.out' },
          '-=1.0'
        )
        // 4. Hairline rule draws across, tying the composition together
        .fromTo(
          ruleRef.current,
          { scaleX: 0, autoAlpha: 0 },
          { scaleX: 1, autoAlpha: 1, duration: 1.6, ease: 'expo.out' },
          '-=1.4'
        );

      // Slow, continuous Ken Burns drift so the still never reads as a frozen photo
      gsap.fromTo(
        kenRef.current,
        { scale: 1.14 },
        { scale: 1, duration: 24, ease: 'none', repeat: -1, yoyo: true }
      );

      // Scroll-linked departure: image parallaxes out while the type lifts away
      gsap
        .timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        })
        .to(mediaRef.current, { yPercent: 12, ease: 'none' }, 0)
        .to(contentRef.current, { yPercent: -14, autoAlpha: 0, ease: 'none' }, 0);
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(mediaRef.current, { clipPath: 'inset(0%)', scale: 1 });
    });

    return () => mm.revert();
  }, { scope: containerRef });

  return (
    <FullBleed
      ref={containerRef}
      className="relative flex flex-col justify-between h-[100svh] !min-h-[600px] w-full pt-28 md:pt-32 pb-10 md:pb-14 bg-deep-charcoal-950 overflow-hidden"
    >
      {/* Cinematic still — Google Places photo, clipped taller than the frame so the
          scroll parallax never reveals an edge */}
      <div
        ref={mediaRef}
        className="absolute left-0 -top-[10%] h-[120%] w-full z-0 origin-center will-change-transform pointer-events-none"
      >
        <div ref={kenRef} className="absolute inset-0 will-change-transform">
          <PlaceImage
            name="Amber Fort"
            city="Jaipur"
            width={2400}
            asBackground
            className="absolute inset-0 w-full h-full"
            fallbackUrl="https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=2400&q=80"
          />
        </div>
        {/* Scrim: guarantees type contrast over any frame, no blend modes required */}
        <div className="absolute inset-0 bg-gradient-to-b from-deep-charcoal-950/80 via-deep-charcoal-950/35 to-deep-charcoal-950/95" />
        <div className="absolute inset-0 bg-deep-charcoal-950/20" />
      </div>

      {/* Top editorial index */}
      <div
        ref={labelRef}
        className="relative z-10 w-full px-6 md:px-12 lg:px-24 mt-4 md:mt-8 flex justify-between items-start text-warm-ivory-50"
      >
        <div className="flex items-center space-x-3 font-mono text-[10px] md:text-xs uppercase tracking-[0.25em]">
          <span>01</span>
          <span className="block w-8 h-[1px] bg-warm-ivory-50/40" />
          <span>Soul of India</span>
        </div>
        <div className="hidden md:block font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] text-warm-ivory-50/60">
          Private Travel Atelier
        </div>
      </div>

      {/* Oversized editorial statement */}
      <div ref={contentRef} className="relative z-10 w-full px-6 md:px-12 lg:px-24 mt-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-end">
          <div className="lg:col-span-9 flex flex-col">
            <h1 className="font-serif uppercase text-[15vw] lg:text-[11vw] leading-[0.78] tracking-tighter text-warm-ivory-50 flex flex-col">
              <span className="overflow-hidden pb-1 lg:pb-2">
                <span className="hero-title-line block">Crown</span>
              </span>
              <span className="overflow-hidden pb-3 lg:pb-5">
                <span className="hero-title-line block italic font-light ml-[14%] text-saffron-300 pr-12">
                  Jewel
                </span>
              </span>
            </h1>
          </div>

          <div className="lg:col-span-3 flex flex-col lg:items-end justify-end space-y-8 lg:text-right pb-4 lg:pb-6">
            <p
              ref={descRef}
              className="text-warm-ivory-50/90 font-sans text-sm md:text-base leading-relaxed font-light max-w-xs"
            >
              Immersive, uncompromising exploration of India&apos;s most extraordinary palaces,
              wilderness and sanctuaries. Unapologetically luxurious.
            </p>

            <a
              ref={ctaRef}
              href="#brand-philosophy"
              className="group inline-flex flex-col items-start lg:items-end gap-2 text-warm-ivory-50 text-xs md:text-sm uppercase tracking-[0.18em] font-mono hover:text-saffron-400 transition-colors duration-500"
            >
              <span>Discover</span>
              <span className="block h-[1px] w-16 bg-warm-ivory-50/40 origin-right transition-colors duration-500 group-hover:bg-saffron-400" />
            </a>
          </div>
        </div>

        {/* Hairline + meta line */}
        <div ref={ruleRef} className="mt-10 md:mt-14 h-[1px] w-full bg-warm-ivory-50/20 origin-left" />
        <div className="mt-4 flex justify-between font-mono text-[10px] md:text-xs uppercase tracking-[0.25em] text-warm-ivory-50/50">
          <span>Amber Fort, Jaipur</span>
          <span className="hidden sm:block">26.9855° N&nbsp;&nbsp;75.8513° E</span>
        </div>
      </div>
    </FullBleed>
  );
}
