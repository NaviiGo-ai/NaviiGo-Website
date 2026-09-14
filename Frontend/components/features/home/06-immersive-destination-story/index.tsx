'use client';

import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FullBleed from '@/components/layout/primitives/FullBleed';
import { StoryGround, StoryTitleFrame, StoryEditorialFrame } from './StoryFrames';

gsap.registerPlugin(ScrollTrigger);

export default function ImmersiveDestinationStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);

  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);

  const copyRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);

  const wipeRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Honour prefers-reduced-motion by showing both frames as static editorial blocks.
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  useGSAP(
    () => {
      if (reduced) return;
      if (
        !containerRef.current ||
        !groundRef.current ||
        !veilRef.current ||
        !line1Ref.current ||
        !line2Ref.current ||
        !localeRef.current ||
        !copyRef.current ||
        !cardRef.current ||
        !cardInnerRef.current ||
        !wipeRef.current ||
        !progressRef.current
      ) {
        return;
      }

      // Seed the "before" state so nothing flashes before the scrub begins.
      gsap.set([line1Ref.current, line2Ref.current], {
        opacity: 0,
        yPercent: 60,
        rotateX: 82,
        transformOrigin: '50% 100%',
        transformPerspective: 1200,
      });
      gsap.set(localeRef.current, { opacity: 0, y: 24 });
      gsap.set(copyRef.current, {
        opacity: 0,
        xPercent: -10,
        rotateY: 16,
        transformOrigin: '0% 50%',
        transformPerspective: 1000,
      });
      gsap.set(cardRef.current, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(cardInnerRef.current, { scale: 1.3 });
      gsap.set(wipeRef.current, { scaleX: 0, opacity: 0 });
      gsap.set(progressRef.current, { scaleX: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=320%',
          pin: true,
          // `fixed` pin breaks when an ancestor has a CSS transform (ScrollTrigger
          // will otherwise pin using fixed positioning, which can appear off-screen).
          // For this section we force transform-based pinning.
          pinType: 'transform',
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // A. A slow push-in holds the whole sequence together.
      tl.fromTo(groundRef.current, { scale: 1.12 }, { scale: 1.24, duration: 1 }, 0);
      tl.fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);

      // B. Frame one: the title unfolds out of 3D depth.
      tl.to(line1Ref.current, { opacity: 1, yPercent: 0, rotateX: 0, duration: 0.2, ease: 'power3.out' }, 0.02);
      tl.to(line2Ref.current, { opacity: 1, yPercent: 0, rotateX: 0, duration: 0.2, ease: 'power3.out' }, 0.08);
      tl.to(localeRef.current, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.15);

      // C. The cut: title folds away, a hairline wipes the frame, ground dims.
      tl.to(
        [line1Ref.current, line2Ref.current],
        { opacity: 0, yPercent: -42, rotateX: -58, duration: 0.14, stagger: 0.03, ease: 'power2.in' },
        0.36
      );
      tl.to(localeRef.current, { opacity: 0, y: -18, duration: 0.1, ease: 'power2.in' }, 0.38);
      tl.to(veilRef.current, { opacity: 0.55, duration: 0.2, ease: 'power1.in' }, 0.4);
      tl.fromTo(
        wipeRef.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.12, ease: 'power3.inOut' },
        0.4
      );
      tl.to(wipeRef.current, { opacity: 0, duration: 0.12, ease: 'power1.out' }, 0.55);

      // D. Frame two: the detail clip-unfolds, the copy arrives in perspective.
      tl.to(cardRef.current, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.24, ease: 'power3.out' }, 0.5);
      tl.to(cardInnerRef.current, { scale: 1, duration: 0.34, ease: 'power3.out' }, 0.5);
      tl.to(copyRef.current, { opacity: 1, xPercent: 0, rotateY: 0, duration: 0.24, ease: 'power3.out' }, 0.55);

      // E. A quiet release into the next section.
      tl.to(copyRef.current, { opacity: 0, yPercent: -6, duration: 0.1, ease: 'power2.in' }, 0.9);
      tl.to(cardRef.current, { opacity: 0, yPercent: -6, duration: 0.1, ease: 'power2.in' }, 0.9);
      tl.to(veilRef.current, { opacity: 0.85, duration: 0.1, ease: 'power1.in' }, 0.9);
    },
    { scope: containerRef, dependencies: [reduced] }
  );

  if (reduced) {
    return (
      <FullBleed ref={containerRef} className="relative bg-deep-charcoal-950 text-warm-ivory-50">
        <section aria-label="The Echoes of Empire — Jaipur, Rajasthan">
          <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
            <StoryGround />
            <StoryTitleFrame line1Ref={line1Ref} line2Ref={line2Ref} metaRef={localeRef} />
          </div>
          <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden border-t border-warm-ivory-50/10">
            <StoryEditorialFrame copyRef={copyRef} cardRef={cardRef} innerRef={cardInnerRef} />
          </div>
        </section>
      </FullBleed>
    );
  }

  return (
    <FullBleed
      ref={containerRef}
      className="relative h-[100svh] overflow-hidden bg-deep-charcoal-950 text-warm-ivory-50"
    >
      <StoryGround imageRef={groundRef} veilRef={veilRef} />

      {/* Letterbox hairlines and the section index — the film's editorial frame. */}
      <div className="pointer-events-none absolute inset-x-6 top-6 z-30 h-px bg-warm-ivory-50/15 md:inset-x-16 md:top-8" />
      <div className="pointer-events-none absolute inset-x-6 bottom-6 z-30 h-px bg-warm-ivory-50/15 md:inset-x-16 md:bottom-8" />
      <div className="pointer-events-none absolute left-6 top-10 z-30 flex items-center space-x-3 font-mono text-[10px] uppercase tracking-widest text-warm-ivory-50/80 md:left-16 md:top-14">
        <span>06</span>
        <span className="h-px w-8 bg-warm-ivory-50/40" />
        <span>Immersive Story</span>
      </div>

      {/* Hairline wipe that carries the cut between the two frames. */}
      <div ref={wipeRef} className="absolute inset-x-0 top-1/2 z-30 h-px origin-left bg-saffron-400/70" />

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <StoryTitleFrame line1Ref={line1Ref} line2Ref={line2Ref} metaRef={localeRef} />
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <StoryEditorialFrame copyRef={copyRef} cardRef={cardRef} innerRef={cardInnerRef} />
      </div>

      {/* The pin always shows its progress. */}
      <div className="absolute inset-x-0 bottom-0 z-30 h-px bg-warm-ivory-50/10">
        <div ref={progressRef} className="h-full w-full origin-left bg-saffron-400" />
      </div>
    </FullBleed>
  );
}
