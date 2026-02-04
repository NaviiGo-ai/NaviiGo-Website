"use client";

import { useEffect, useRef } from 'react';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  containerId: string;
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export default function HeroExploreMotion({ containerId }: Props) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId) as HTMLElement | null;
    containerRef.current = container;
    if (!container) return;

    const reduce = prefersReducedMotion();

    const cleanups: Array<() => void> = [];

    const ctx = gsap.context(() => {
      const startVelocityBlur = (
        elements: Array<HTMLElement | null | undefined>,
        options?: {
          maxBlurPx?: number;
          strength?: number;
          smoothing?: number;
          minSpeed?: number;
        }
      ) => {
        const targets = elements.filter(Boolean) as HTMLElement[];
        if (!targets.length) return;

        const maxBlurPx = options?.maxBlurPx ?? 10;
        const strength = options?.strength ?? 0.28;
        const smoothing = options?.smoothing ?? 0.18;
        const minSpeed = options?.minSpeed ?? 0.15;

        const state = new Map<HTMLElement, { x: number; y: number; blur: number; setFilter: (v: string) => void }>();

        targets.forEach((el) => {
          el.style.willChange = 'transform, filter';
          const x = toNumber(gsap.getProperty(el, 'x'));
          const y = toNumber(gsap.getProperty(el, 'y'));
          state.set(el, {
            x,
            y,
            blur: 0,
            setFilter: gsap.quickSetter(el, 'filter') as (v: string) => void,
          });
        });

        const tick = () => {
          targets.forEach((el) => {
            const s = state.get(el);
            if (!s) return;

            const x = toNumber(gsap.getProperty(el, 'x'));
            const y = toNumber(gsap.getProperty(el, 'y'));
            const speed = Math.hypot(x - s.x, y - s.y);
            const targetBlur = speed < minSpeed ? 0 : Math.min(maxBlurPx, speed * strength);
            s.blur += (targetBlur - s.blur) * smoothing;

            // Small snap-to-zero to avoid lingering blur.
            const blur = s.blur < 0.02 ? 0 : s.blur;
            s.setFilter(`blur(${blur.toFixed(2)}px)`);

            s.x = x;
            s.y = y;
          });
        };

        gsap.ticker.add(tick);
        cleanups.push(() => {
          gsap.ticker.remove(tick);
          targets.forEach((el) => {
            gsap.set(el, { clearProps: 'filter' });
            el.style.willChange = '';
          });
        });
      };

      const bg = container.querySelector<HTMLElement>('[data-hero-bg]');
      const titleLines = container.querySelectorAll<HTMLElement>('[data-hero-title-line]');
      const titleWords = container.querySelectorAll<HTMLElement>('[data-hero-title] [data-split="word"]');
      const sub = container.querySelector<HTMLElement>('[data-hero-sub]');
      const kicker = container.querySelector<HTMLElement>('[data-hero-kicker]');
      const rail = container.querySelector<HTMLElement>('[data-hero-rail]');
      const dots = container.querySelectorAll<HTMLElement>('[data-hero-dot]');
      const tags = container.querySelector<HTMLElement>('[data-hero-tags]');
      const cta = container.querySelector<HTMLElement>('[data-hero-cta]');
      const cards = container.querySelectorAll<HTMLElement>('[data-hero-card]');
      const cardsInner = container.querySelector<HTMLElement>('[data-hero-cards-inner]');
      const nav = container.querySelector<HTMLElement>('[data-hero-nav]');
      const bgImg = container.querySelector<HTMLElement>('[data-hero-bg-img]');
      const left = container.querySelector<HTMLElement>('[data-hero-left]');
      const right = container.querySelector<HTMLElement>('[data-hero-right]');

      if (reduce) {
        gsap.set([
          bg,
          bgImg,
          left,
          right,
          ...titleLines,
          ...Array.from(titleWords),
          sub,
          kicker,
          rail,
          ...Array.from(dots),
          tags,
          cta,
          ...Array.from(cards),
          cardsInner,
          nav,
        ], { clearProps: 'all', opacity: 1 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Slide-in whole scene (text + cards + bg) on load.
      const enterX = 12;
      tl.fromTo(
        [left, right].filter(Boolean),
        { xPercent: enterX, opacity: 0, filter: 'blur(10px)' },
        { xPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.5, stagger: 0.06 },
        0
      );
      if (bgImg) {
        tl.fromTo(
          bgImg,
          { xPercent: enterX * 0.5, opacity: 0.4, scale: 1.06, filter: 'blur(14px)' },
          { xPercent: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9 },
          0
        );
      }

      tl.fromTo(
        titleLines,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, stagger: 0.08 },
        0.08
      );

      tl.fromTo(
        titleWords,
        { yPercent: 110, opacity: 0, filter: 'blur(8px)' },
        { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.06 },
        0.14
      );

      tl.fromTo(
        sub,
        { y: 24, opacity: 0, filter: 'blur(8px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 0.72 },
        0.32
      );

      tl.fromTo(
        kicker,
        { y: -10, opacity: 0 },
        { y: 0, opacity: 0.8, duration: 0.45 },
        0.2
      );

      tl.fromTo(
        dots,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.05 },
        0.28
      );

      tl.fromTo(
        [tags, cta],
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.1 },
        0.36
      );

      tl.fromTo(
        cards,
        { x: 80, y: 10, scale: 0.96, opacity: 0 },
        {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: { each: 0.08, from: 'center' },
        },
        0.32
      );

      tl.fromTo(
        nav,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 },
        0.55
      );

      // Start smooth motion blur after intro finishes (keeps initial filter tweens intact).
      tl.eventCallback('onComplete', () => {
        startVelocityBlur([...Array.from(cards), bgImg], {
          maxBlurPx: 12,
          strength: 0.32,
          smoothing: 0.2,
          minSpeed: 0.12,
        });
      });

      // Subtle breathing on background
      if (bgImg) {
        const breathe = gsap.to(bgImg, {
          scale: 1.02,
          duration: 8,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
        tl.eventCallback('onComplete', () => {
          breathe.play();
        });
        const pauseBreathe = () => breathe.pause();
        const resumeBreathe = () => breathe.resume();
        container.addEventListener('pointerenter', pauseBreathe);
        container.addEventListener('pointerleave', resumeBreathe);
        container.addEventListener('focusin', pauseBreathe);
        container.addEventListener('focusout', resumeBreathe);

        cleanups.push(() => {
          breathe.kill();
          container.removeEventListener('pointerenter', pauseBreathe);
          container.removeEventListener('pointerleave', resumeBreathe);
          container.removeEventListener('focusin', pauseBreathe);
          container.removeEventListener('focusout', resumeBreathe);
        });
      }

      // Note: Slide changes are handled by the parent. This motion layer focuses on scene transitions + ambiance.

      // ScrollTrigger parallax
      if (bg) {
        gsap.fromTo(
          bg,
          { yPercent: -4 },
          {
            yPercent: 4,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top top',
              end: 'bottom+=200 top',
              scrub: 0.2,
            },
          }
        );
      }

      const reveals = container.querySelectorAll<HTMLElement>('[data-reveal]');
      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 26, opacity: 0, clipPath: 'inset(10% 0 10% 0)' },
          {
            y: 0,
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              once: true,
            },
          }
        );
      });

      // No additional cleanup needed here beyond what is registered above.
    }, container);

    return () => {
      cleanups.forEach((fn) => fn());
      ctx.revert();
    };
  }, [containerId]);

  return null;
}
