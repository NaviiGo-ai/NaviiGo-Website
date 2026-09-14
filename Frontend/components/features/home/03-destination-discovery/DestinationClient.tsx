'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FullBleed from '@/components/layout/primitives/FullBleed';

gsap.registerPlugin(ScrollTrigger);

export interface Destination {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  query: string;
  fallback: string;
  image: string;
}

export default function DestinationClient({ destinations }: { destinations: Destination[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !trackRef.current) return;

    const cards = gsap.utils.toArray('.dest-3d-card', trackRef.current);
    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: () => `+=${window.innerWidth * cards.length}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        }
      });

      tl.to(trackRef.current, {
        xPercent: -100 * (cards.length - 1),
        ease: 'none'
      });

      // 3D Parallax distortion for cards during scroll
      cards.forEach((card: any) => {
        const imageWrap = card.querySelector('.img-wrap');
        const contentInfo = card.querySelector('.content-wrap');

        gsap.to(imageWrap, {
          rotationY: -15, // leans back
          scale: 0.9,     // shrinks slightly
          z: -100,        // pushes into screen
          ease: 'power1.inOut',
          scrollTrigger: {
            trigger: card,
            containerAnimation: tl,
            start: 'left center',
            end: 'right center',
            scrub: true,
          }
        });

        // Inverse text parallax
        gsap.to(contentInfo, {
          x: 100,
          opacity: 0,
          ease: 'power2.in',
          scrollTrigger: {
            trigger: card,
            containerAnimation: tl,
            start: 'center center',
            end: 'right left',
            scrub: true,
          }
        });
      });
    });

    // Mobile has no horizontal track, so it gets its own reveal: the frame
    // unfolds and the copy rises as each card enters.
    mm.add("(max-width: 767px)", () => {
      const root = mobileRef.current;
      if (!root) return;

      root.querySelectorAll<HTMLElement>('.dest-mobile-card').forEach((card) => {
        gsap.fromTo(
          card.querySelector('.dest-mobile-img'),
          { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.12 },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            duration: 1.4,
            ease: 'expo.out',
            scrollTrigger: { trigger: card, start: 'top 80%', once: true },
          }
        );

        gsap.fromTo(
          card.querySelectorAll('span, h3, p, a'),
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.07,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 72%', once: true },
          }
        );
      });
    });

  }, { scope: containerRef });

  return (
    <>
      <FullBleed
        ref={containerRef}
        className="relative h-[100svh] bg-deep-charcoal text-warm-ivory-50 overflow-hidden hidden md:block"
      >
        {/* Absolute Header Overlay */}
        <div className="absolute top-0 left-0 w-full z-20 px-6 md:px-12 lg:px-24 pt-24 md:pt-32 pointer-events-none mix-blend-exclusion text-warm-ivory-50">
          <div className="flex items-center space-x-3 text-xs tracking-widest uppercase font-mono mb-4 text-warm-ivory-50/80">
            <span>03</span>
            <span className="w-8 h-[1px] bg-warm-ivory-50/40" />
            <span>Curated Indian Destinations</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif leading-[1.05] tracking-tight max-w-2xl text-warm-ivory-50">
            Horizons designed for the discerning traveler.
          </h2>
        </div>

        {/* 3D Track Container */}
        <div
          ref={trackRef}
          className="flex h-full w-full"
          style={{ perspective: '1500px' }}
        >
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="dest-3d-card w-full h-full flex-shrink-0 flex items-center justify-center relative overflow-hidden"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* The 3D Image Wrapper */}
              <div
                className="img-wrap absolute inset-0 w-full h-full origin-left"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${dest.image}')` }}
                />
                <div className="absolute inset-0 bg-deep-charcoal-950/20" />
              </div>

              {/* The Text Block Overlaid */}
              <div
                className="content-wrap relative z-10 w-full px-6 md:px-12 lg:px-24 max-w-[1400px] flex items-end h-full pb-24 md:pb-32"
                style={{ transform: 'translateZ(50px)' }}
              >
                <div className="max-w-xl text-warm-ivory-50">
                  <span className="text-saffron-300 text-xs tracking-[0.2em] uppercase font-mono block mb-4">
                    {dest.subtitle}
                  </span>
                  <h3 className="text-6xl md:text-8xl font-serif leading-[0.9] tracking-tighter mb-6 uppercase">
                    {dest.title}
                  </h3>
                  <p className="font-sans text-lg md:text-xl font-light opacity-90 leading-relaxed drop-shadow-xl text-warm-ivory-50">
                    {dest.description}
                  </p>
                  <div className="mt-10">
                    <Link href="/explore" className="group relative inline-flex items-center text-xs tracking-[0.2em] font-mono uppercase hover:text-saffron-300 transition-colors">
                      <span>Explore Canvas</span>
                      <span className="ml-4 w-12 h-[1px] bg-current transition-all group-hover:w-20" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FullBleed>

      {/* Mobile Fallback: Vertical scroll sequence */}
      <section ref={mobileRef} className="block md:hidden bg-deep-charcoal-950 py-24 px-6 text-warm-ivory-50">
        <div className="flex items-center space-x-3 text-xs tracking-widest uppercase font-mono mb-8 opacity-80">
          <span>03</span>
          <span className="w-8 h-[1px] bg-current" />
          <span>Curated Destinations</span>
        </div>
        <h2 className="text-4xl font-serif leading-tight tracking-tight mb-16">
          Horizons designed for the discerning traveler.
        </h2>
        <div className="space-y-24">
          {destinations.map((dest) => (
            <div key={dest.id} className="dest-mobile-card flex flex-col">
              <div className="w-full aspect-[4/5] overflow-hidden mb-8">
                <div
                  className="dest-mobile-img w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${dest.image}')` }}
                />
              </div>
              <span className="text-saffron-300 text-xs tracking-[0.2em] uppercase font-mono block mb-3">
                {dest.subtitle}
              </span>
              <h3 className="text-5xl font-serif leading-none tracking-tighter mb-4 uppercase">
                {dest.title}
              </h3>
              <p className="font-sans text-base font-light opacity-90 leading-relaxed mb-8">
                {dest.description}
              </p>
              <Link href="/explore" className="inline-flex items-center text-xs tracking-[0.2em] font-mono uppercase text-saffron-300">
                <span>Explore Canvas</span>
                <span className="ml-4 w-8 h-[1px] bg-current" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
