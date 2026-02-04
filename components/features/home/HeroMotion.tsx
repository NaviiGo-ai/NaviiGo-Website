"use client";

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

type Props = {
  /**
   * We scope GSAP via gsap.context() to the closest [data-hero] section.
   * This keeps selectors local and avoids leaking animations across the page.
   */
  scopeSelector?: string;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function HeroMotion({ scopeSelector = '[data-hero]' }: Props) {
  const markerRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const marker = markerRef.current;
    const scopeEl = marker?.closest(scopeSelector) as HTMLElement | null;
    if (!scopeEl) return;

    // Accessibility + perf: skip heavy timelines when reduced motion is requested.
    if (prefersReducedMotion()) {
      const words = scopeEl.querySelectorAll<HTMLElement>('[data-split="word"]');
      gsap.set(words, { y: 0, opacity: 1, filter: 'blur(0px)' });
      gsap.set(scopeEl.querySelectorAll<HTMLElement>('[data-hero-bg]'), {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
      });
      gsap.set(scopeEl.querySelectorAll<HTMLElement>('[data-hero-tagline]'), {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      });
      return;
    }

    const ctx = gsap.context(() => {
      const bg = scopeEl.querySelector<HTMLElement>('[data-hero-bg]');
      const words = scopeEl.querySelectorAll<HTMLElement>('[data-split="word"]');
      const tagline = scopeEl.querySelector<HTMLElement>('[data-hero-tagline]');

      // Performance-safe: only transform/opacity/filter, no layout reads, no width/height.
      gsap.set(words, { y: 28, opacity: 0, filter: 'blur(10px)' });
      gsap.set(tagline, { y: 16, opacity: 0, filter: 'blur(10px)' });
      if (bg) gsap.set(bg, { scale: 1.08, opacity: 0, filter: 'blur(14px)' });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out', duration: 0.9 },
      });

      if (bg) {
        tl.to(bg, { opacity: 1, duration: 0.8 }, 0)
          .to(bg, { scale: 1, filter: 'blur(0px)', duration: 1.2 }, 0.05);
      }

      tl.to(words, {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        stagger: 0.045,
        duration: 0.75,
      }, 0.15);

      if (tagline) {
        tl.to(tagline, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8 }, 0.55);
      }

      // Ensure GSAP cleans up all inline styles/selectors on unmount.
      return () => tl.kill();
    }, scopeEl);

    return () => ctx.revert();
  }, [scopeSelector]);

  // Marker element is used only for scoping; it's visually hidden.
  return <span ref={markerRef} className="sr-only" aria-hidden="true" />;
}
