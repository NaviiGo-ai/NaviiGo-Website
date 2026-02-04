"use client";

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ScrollScenes() {
  const scopeRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;

    if (prefersReducedMotion()) {
      // Make sure content is visible even when animations are disabled.
      gsap.set(document.querySelectorAll<HTMLElement>('[data-reveal]'), {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // ScrollTrigger perf tuning: avoids expensive recalcs on mobile URL bar changes.
      ScrollTrigger.config({ ignoreMobileResize: true });

      // Section reveals: no per-pixel scrubbing; we use trigger hooks.
      const revealEls = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      revealEls.forEach((el) => {
        gsap.set(el, { opacity: 0, y: 18, filter: 'blur(10px)' });

        gsap.to(el, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            end: 'top 55%',
            scrub: false,
            toggleActions: 'play none none reverse',
          },
        });
      });

      // Parallax-lite background accents: small scrub value for smoothing (not per-pixel snapping).
      const parallaxEls = gsap.utils.toArray<HTMLElement>('[data-parallax]');
      parallaxEls.forEach((el) => {
        gsap.to(el, {
          y: -24,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.25,
          },
        });
      });

      // Cleanup is handled by ctx.revert().
    }, scope);

    return () => ctx.revert();
  }, []);

  // Scope node: keeps GSAP selectors local and avoids document-wide leaks.
  return <div ref={scopeRef} className="sr-only" aria-hidden="true" />;
}
