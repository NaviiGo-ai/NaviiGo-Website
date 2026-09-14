'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FullBleed from '@/components/layout/primitives/FullBleed';
import PlaceImage from '@/components/shared/PlaceImage';

gsap.registerPlugin(ScrollTrigger);

const UDAIPUR_FALLBACK =
  'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=2400&q=80';

export default function FullscreenCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !maskRef.current || !canvasRef.current) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion: land on the composed state, no masked build, no parallax.
    if (reduced) {
      gsap.set(maskRef.current, { clipPath: 'inset(0% 0% 0% 0%)' });
      gsap.set('.cta-line', { yPercent: 0, rotationX: 0, opacity: 1 });
      gsap.set(['.cta-rule', '.cta-sub', '.cta-actions'], { opacity: 1, clipPath: 'none', y: 0 });
      return;
    }

    // ── Entrance: the frame opens from a centred window to full bleed ─────────
    gsap.set(maskRef.current, { clipPath: 'inset(14% 14% 14% 14%)' });
    gsap.set(canvasRef.current, { scale: 1.18 });

    const intro = gsap.timeline({
      scrollTrigger: { trigger: containerRef.current, start: 'top 65%' },
      defaults: { ease: 'power4.out' },
    });

    intro
      // Portal unfold — clip-path, not a fade
      .to(maskRef.current, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power4.inOut' }, 0)
      .to(canvasRef.current, { scale: 1, duration: 2, ease: 'power3.out' }, 0)
      // 3D perspective headline: lines swing up from below the horizon
      .fromTo(
        '.cta-line',
        { yPercent: 118, rotationX: -55, opacity: 0, transformOrigin: '50% 100% -60px' },
        { yPercent: 0, rotationX: 0, opacity: 1, duration: 1.4, stagger: 0.14, ease: 'expo.out' },
        0.35
      )
      // Hairline draws itself across — a signature, not a fade
      .fromTo(
        '.cta-rule',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 1.2, ease: 'expo.out' },
        '-=0.7'
      )
      // Copy rises through a mask
      .fromTo('.cta-sub', { yPercent: 120 }, { yPercent: 0, duration: 1, ease: 'power3.out' }, '-=0.8')
      .fromTo(
        '.cta-actions',
        { clipPath: 'inset(0% 0% 100% 0%)', y: 24 },
        { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.1, ease: 'power3.out' },
        '-=0.7'
      );

    // ── Scroll-linked depth: the canvas drifts as the section passes through ──
    gsap.fromTo(
      canvasRef.current,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      }
    );
  }, { scope: containerRef });

  return (
    <FullBleed
      ref={containerRef}
      className="relative h-[100svh] min-h-[660px] flex items-center justify-center bg-deep-charcoal-950 text-warm-ivory overflow-hidden"
    >
      {/* Background canvas, revealed through a portal mask */}
      <div
        ref={maskRef}
        className="absolute inset-0 z-0 overflow-hidden"
        style={{ clipPath: 'inset(14% 14% 14% 14%)' }}
      >
        <div ref={canvasRef} className="absolute inset-x-0 -top-[10%] h-[120%] w-full">
          <PlaceImage
            name="City Palace Udaipur"
            city="Udaipur"
            width={2200}
            asBackground
            fallbackUrl={UDAIPUR_FALLBACK}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute inset-0 bg-deep-charcoal-950/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal-950 via-deep-charcoal-950/25 to-deep-charcoal-950/70" />
        </div>
      </div>

      {/* Section index */}
      <div className="absolute top-24 left-6 md:left-12 lg:left-24 z-20 mix-blend-difference pointer-events-none">
        <div className="flex items-center space-x-3 font-mono text-xs tracking-widest uppercase">
          <span>12</span>
          <span className="w-8 h-[1px] bg-current" />
          <span>The Invitation</span>
        </div>
      </div>

      {/* Composition */}
      <div
        className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-12 lg:px-24 flex flex-col items-center text-center"
        style={{ perspective: '1000px' }}
      >
        <h2 className="font-serif tracking-tighter leading-[0.95] flex flex-col items-center">
          <span className="overflow-hidden block">
            <span className="cta-line block text-[12vw] md:text-[8.5vw] lg:text-[7vw]">Your journey,</span>
          </span>
          <span className="overflow-hidden block">
            <span className="cta-line block italic font-light text-[12vw] md:text-[8.5vw] lg:text-[7vw]">
              composed.
            </span>
          </span>
        </h2>

        <div className="cta-rule h-[1px] w-full max-w-md bg-warm-ivory/25 my-10 md:my-12" />

        <div className="overflow-hidden">
          <p className="cta-sub font-sans text-base md:text-lg text-warm-ivory/75 max-w-xl leading-relaxed">
            No templates. No fixed departures. Tell us the shape of your escape and our private
            concierges will compose every detail — the palace, the wilderness, and the quiet in
            between.
          </p>
        </div>

        <div className="cta-actions mt-10 md:mt-14 flex flex-col sm:flex-row items-center gap-8 sm:gap-14">
          <Link
            href="/explore"
            className="group relative overflow-hidden inline-flex items-center justify-center border border-warm-ivory/30 px-10 py-5 text-xs font-mono tracking-[0.25em] uppercase text-warm-ivory transition-colors duration-500 hover:border-warm-ivory focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-saffron-400"
          >
            <span className="absolute inset-0 bg-warm-ivory origin-bottom scale-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100" />
            <span className="relative z-10 transition-colors duration-500 group-hover:text-deep-charcoal">
              Begin Your Journey
            </span>
          </Link>

          <Link
            href="/support"
            className="group inline-flex flex-col items-center gap-3 text-xs font-mono tracking-[0.25em] uppercase text-warm-ivory/70 transition-colors duration-500 hover:text-warm-ivory focus-visible:outline-none focus-visible:text-warm-ivory"
          >
            <span>Speak with a concierge</span>
            <span className="block h-[1px] w-8 bg-warm-ivory/40 transition-all duration-500 group-hover:w-full group-hover:bg-saffron-400" />
          </Link>
        </div>
      </div>
    </FullBleed>
  );
}
