'use client';

import { useEffect } from 'react';

import { gsap } from 'gsap';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function HeroExploreMotion({ heroId }: { heroId: string }) {
  useEffect(() => {
    const root = document.getElementById(heroId);
    if (!root) return;

    const reduce = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const bg = root.querySelector<HTMLElement>('[data-explore-bg]');
      const titleLines = Array.from(
        root.querySelectorAll<HTMLElement>('[data-explore-title-line]')
      );
      const titleWords = Array.from(
        root.querySelectorAll<HTMLElement>('[data-explore-title] [data-split="word"]')
      );
      const lede = root.querySelector<HTMLElement>('[data-explore-lede]');
      const cta = root.querySelector<HTMLElement>('[data-explore-cta]');
      const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-explore-card]'));
      const rail = root.querySelector<HTMLElement>('[data-explore-rail]');

      if (reduce) {
        gsap.set([bg, ...titleLines, ...titleWords, lede, cta, ...cards, rail], {
          clearProps: 'all',
        });
        gsap.set([lede, cta, ...cards, rail], { opacity: 1 });
        gsap.set(titleWords, { opacity: 1, yPercent: 0, filter: 'blur(0px)' });
        gsap.set(titleLines, { clipPath: 'inset(0% 0% 0% 0%)' });
        gsap.set(bg, { opacity: 1, scale: 1, filter: 'blur(0px)' });
        return;
      }

      if (bg) {
        gsap.set(bg, { transformOrigin: '50% 30%' });
      }

      gsap.set(titleLines, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(titleWords, { yPercent: 115, opacity: 0, filter: 'blur(10px)' });
      gsap.set(lede, { y: 18, opacity: 0, filter: 'blur(10px)' });
      gsap.set(cta, { y: 18, opacity: 0, filter: 'blur(8px)', scale: 0.98 });
      gsap.set(cards, { y: 30, opacity: 0, filter: 'blur(12px)', rotateX: -8 });
      gsap.set(rail, { opacity: 0, y: 10 });

      const tl = gsap.timeline({
        defaults: { duration: 0.9, ease: 'power3.out' },
      });

      if (bg) {
        tl.fromTo(
          bg,
          { opacity: 0, scale: 1.08, filter: 'blur(12px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.15, ease: 'power2.out' },
          0
        );
      }

      tl.to(
        titleLines,
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.85,
          ease: 'power2.out',
          stagger: 0.08,
        },
        0.15
      );

      tl.to(
        titleWords,
        {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.9,
          stagger: 0.02,
        },
        0.22
      );

      tl.to(
        rail,
        {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: 'power2.out',
        },
        0.32
      );

      tl.to(
        lede,
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.7,
        },
        0.4
      );

      tl.to(
        cta,
        {
          y: 0,
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.65,
        },
        0.5
      );

      tl.to(
        cards,
        {
          y: 0,
          opacity: 1,
          filter: 'blur(0px)',
          rotateX: 0,
          duration: 0.9,
          stagger: 0.08,
        },
        0.48
      );
    }, root);

    return () => {
      ctx.revert();
    };
  }, [heroId]);

  return null;
}
