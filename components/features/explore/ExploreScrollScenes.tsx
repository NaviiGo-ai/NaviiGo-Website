'use client';

import { useEffect } from 'react';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ExploreScrollScenes({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    const reduce = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-explore-reveal]'));
      const parallax = Array.from(root.querySelectorAll<HTMLElement>('[data-explore-parallax]'));

      if (reduce) {
        gsap.set(reveals, { opacity: 1, y: 0, filter: 'blur(0px)' });
        gsap.set(parallax, { y: 0 });
        return;
      }

      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 26, opacity: 0, filter: 'blur(10px)' },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              once: true,
            },
          }
        );
      });

      parallax.forEach((el) => {
        gsap.fromTo(
          el,
          { y: -18 },
          {
            y: 18,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.25,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    }, root);

    return () => {
      ctx.revert();
    };
  }, [rootId]);

  return null;
}
