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
      const rail = container.querySelector<HTMLElement>('[data-hero-rail]');
      const dots = container.querySelectorAll<HTMLElement>('[data-hero-dot]');
      const cta = container.querySelector<HTMLElement>('[data-hero-cta]');
      const ctaWrap = container.querySelector<HTMLElement>('[data-hero-cta-wrap]');
      const cards = container.querySelectorAll<HTMLElement>('[data-hero-card]');
      const cardsInner = container.querySelector<HTMLElement>('[data-hero-cards-inner]');
      const nav = container.querySelector<HTMLElement>('[data-hero-nav]');
      const bgImg = container.querySelector<HTMLElement>('[data-hero-bg-img]');
      const left = container.querySelector<HTMLElement>('[data-hero-left]');
      const right = container.querySelector<HTMLElement>('[data-hero-right]');
      const ghost = container.querySelector<HTMLElement>('[data-hero-ghost]');

      if (reduce) {
        gsap.set([
          bg,
          bgImg,
          left,
          right,
          ...titleLines,
          ...Array.from(titleWords),
          sub,
          rail,
          ...Array.from(dots),
          cta,
          ctaWrap,
          ...Array.from(cards),
          cardsInner,
          nav,
          ghost,
        ], { clearProps: 'all', opacity: 1 });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Slide-in whole scene (text + cards + bg) on load.
      const enterX = 6;
      tl.fromTo(
        [left, right].filter(Boolean),
        { xPercent: enterX, opacity: 0, filter: 'blur(8px)' },
        { xPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.45, stagger: 0.06 },
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
        ghost,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        0.1
      );

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
        0.36
      );

      tl.fromTo(
        dots,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.05 },
        0.28
      );

      tl.fromTo(ctaWrap, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, 0.42);

      tl.fromTo(cta, { scale: 0.96 }, { scale: 1, duration: 0.45 }, 0.44);

      tl.fromTo(
        cards,
        { opacity: 0, filter: 'blur(8px)' },
        {
          opacity: 1,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power3.out',
          stagger: { each: 0.08, from: 'center' },
        },
        0.28
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

      // Note: Slide changes are handled by the parent. This motion layer focuses on scene transitions + ambiance.

      let slideTimeline: gsap.core.Timeline | null = null;
      let slideDirection: -1 | 1 = 1;

      const animateSlideOut = () => {
        if (reduce) return;

        slideTimeline?.kill();
        const scene = container.querySelector<HTMLElement>('[data-hero-scene]');
        if (!scene) return;

        slideTimeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
        slideTimeline.to(scene, {
          opacity: 0,
          xPercent: -4 * slideDirection,
          duration: 0.2,
        }, 0);

        if (bgImg) {
          slideTimeline.to(bgImg, { opacity: 0.35, duration: 0.22 }, 0);
        }
      };

      const animateSlideIn = () => {
        if (reduce) return;

        slideTimeline?.kill();

        const nextScene = container.querySelector<HTMLElement>('[data-hero-scene]');
        const nextCards = container.querySelectorAll<HTMLElement>('[data-hero-card]');
        const nextBgImg = container.querySelector<HTMLElement>('[data-hero-bg-img]');
        if (!nextScene) return;

        gsap.set(nextScene, { opacity: 0, xPercent: 7 * slideDirection });
        gsap.set(ghost, { opacity: 0, y: 12 });
        gsap.set(nextCards, { opacity: 0, filter: 'blur(8px)' });

        if (nextBgImg) {
          gsap.set(nextBgImg, { opacity: 0.35, scale: 1.02 });
        }

        slideTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (nextBgImg) {
          slideTimeline.to(nextBgImg, { opacity: 1, scale: 1, duration: 0.55 }, 0);
        }

        slideTimeline.to(nextScene, { opacity: 1, xPercent: 0, duration: 0.45 }, 0);

        if (ghost) {
          slideTimeline.to(ghost, { opacity: 1, y: 0, duration: 0.4 }, 0.1);
        }

        slideTimeline.to(
          nextCards,
          {
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.5,
            stagger: { each: 0.06, from: 'center' },
          },
          0.06
        );
      };

      const onWillChange = (event: Event) => {
        const detail = (event as CustomEvent<{ direction?: number }>).detail;
        slideDirection = detail?.direction === -1 ? -1 : 1;
        animateSlideOut();
      };

      const onDidChange = () => {
        // Wait a frame to ensure Next/React has committed updated content.
        requestAnimationFrame(() => animateSlideIn());
      };

      container.addEventListener('naviigo:exploreHero:will-change', onWillChange as EventListener);
      container.addEventListener('naviigo:exploreHero:did-change', onDidChange as EventListener);
      cleanups.push(() => {
        container.removeEventListener('naviigo:exploreHero:will-change', onWillChange as EventListener);
        container.removeEventListener('naviigo:exploreHero:did-change', onDidChange as EventListener);
        slideTimeline?.kill();
      });

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
