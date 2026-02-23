"use client";

import Image from 'next/image';

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type HeroCard } from './CardStack';
import HeroCardRail from './HeroCardRail';
import HeroExploreMotion from './HeroExploreMotion';
import { splitText } from '@/lib/motion/splitText';

type HeroSlide = {
  name: string;
  blurb: string;
  primaryImage: string;
  accentA: string; // rgb triple string: "r g b"
  accentB: string; // rgb triple string: "r g b"
  cards: HeroCard[];
};

const slides: HeroSlide[] = [
  {
    name: 'Indonesia',
    blurb:
      'As the largest archipelagic country in the world, Indonesia is blessed with so many different people, cultures, customs, traditions, artworks, food, animals, plants, landscapes, and everything that made it almost like 100 (or even 200) countries melted beautifully into one.',
    primaryImage: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1920&q=80',
    accentA: '255 196 140',
    accentB: '94 231 255',
    cards: [
      { title: 'Buddha temple, Thailand', tag: 'Thailand', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=900&q=80', accent: 'amber' },
      { title: 'Broken Beach, Bali', tag: 'Bali', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=80', accent: 'blue' },
      { title: 'Kerala', tag: 'India', image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=900&q=80', accent: 'emerald' },
    ],
  },
  {
    name: 'Thailand',
    blurb:
      'Thailand moves from golden temples to emerald bays with a rhythm of night markets, riverfront skylines, and island sunsets.',
    primaryImage: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1920&q=80',
    accentA: '255 153 0',
    accentB: '0 102 204',
    cards: [
      { title: 'Wat Arun', tag: 'Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=80', accent: 'amber' },
      { title: 'Phi Phi Viewpoint', tag: 'Krabi', image: 'https://images.unsplash.com/photo-1526481280695-3c4691d7f5d1?auto=format&fit=crop&w=900&q=80', accent: 'blue' },
      { title: 'Doi Suthep', tag: 'Chiang Mai', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=900&q=80', accent: 'emerald' },
    ],
  },
  {
    name: 'Bali',
    blurb:
      'Bali pairs jungle temples, dramatic cliffs, and calm rice valleys with sunrise-to-sunset experiences in every direction.',
    primaryImage: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1920&q=80',
    accentA: '255 153 0',
    accentB: '34 211 238',
    cards: [
      { title: 'Tegallalang Rice Terrace', tag: 'Ubud', image: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=900&q=80', accent: 'emerald' },
      { title: 'Uluwatu Temple', tag: 'Pecatu', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80', accent: 'amber' },
      { title: 'Sekumpul Falls', tag: 'Buleleng', image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=900&q=80', accent: 'blue' },
    ],
  },
  {
    name: 'Kerala',
    blurb:
      'Kerala weaves palm-lined backwaters, misty tea estates, and heritage coast towns into a calm and cinematic southern trail.',
    primaryImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1920&q=80',
    accentA: '0 102 204',
    accentB: '34 197 94',
    cards: [
      { title: 'Alleppey Backwaters', tag: 'Houseboats', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=80', accent: 'blue' },
      { title: 'Eravikulam National Park', tag: 'Munnar', image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=900&q=80', accent: 'amber' },
      { title: 'Fort Kochi Waterfront', tag: 'Kochi', image: 'https://images.unsplash.com/photo-1621330396167-b3d451b9b83b?auto=format&fit=crop&w=900&q=80', accent: 'emerald' },
    ],
  },
];

export default function HeroExploreShell() {
  const heroId = 'hero-explore';
  const total = slides.length;
  const [active, setActive] = useState(0);
  const transitioningRef = useRef(false);
  const queuedRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  const hero = useMemo(() => slides[active]!, [active]);
  const ghostName = useMemo(() => slides[(active + 1) % total]?.name ?? '', [active, total]);

  const meta = useMemo(() => {
    const a = String(active + 1).padStart(2, '0');
    const b = String(total).padStart(2, '0');
    return `${a} / ${b}`;
  }, [active, total]);

  const dispatch = useCallback(
    (type: 'will-change' | 'did-change', detail?: Record<string, unknown>) => {
      const root = document.getElementById(heroId);
      if (!root) return;
      root.dispatchEvent(
        new CustomEvent(`naviigo:exploreHero:${type}`, {
          bubbles: false,
          detail,
        })
      );
    },
    [heroId]
  );

  const requestSlide = useCallback(
    (next: number, direction: -1 | 1 = 1) => {
      const normalized = ((next % total) + total) % total;
      if (normalized === active) return;

      if (transitioningRef.current) {
        queuedRef.current = normalized;
        return;
      }

      transitioningRef.current = true;
      queuedRef.current = null;

      dispatch('will-change', { nextIndex: normalized, direction });
      window.setTimeout(() => {
        setActive(normalized);
      }, 240);
    },
    [active, dispatch, total]
  );

  const onPrev = useCallback(() => requestSlide(active - 1, -1), [active, requestSlide]);
  const onNext = useCallback(() => requestSlide(active + 1, 1), [active, requestSlide]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    dispatch('did-change', { activeIndex: active });
    const unlock = window.setTimeout(() => {
      transitioningRef.current = false;
      if (queuedRef.current != null) {
        const next = queuedRef.current;
        queuedRef.current = null;
        requestSlide(next);
      }
    }, 520);

    return () => window.clearTimeout(unlock);
  }, [active, dispatch, requestSlide]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onNext, onPrev]);

  return (
    <section
      id={heroId}
      role="region"
      aria-label="Explore destinations carousel"
      className="relative isolate -mt-24 h-dvh w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_22px_90px_rgba(0,0,0,0.28)]"
      style={
        {
          overflow: 'hidden',
          ['--hero-accent-a-rgb' as any]: hero.accentA,
          ['--hero-accent-b-rgb' as any]: hero.accentB,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        data-hero-bg
      >
        <div className="absolute inset-0 bg-[radial-gradient(1100px_circle_at_18%_18%,rgb(var(--hero-accent-a-rgb)/0.22),transparent_55%),radial-gradient(1100px_circle_at_82%_16%,rgb(var(--hero-accent-b-rgb)/0.18),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.84]" data-hero-bg-img>
          <Image
            src={hero.primaryImage}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,29,0.62)_0%,rgba(6,11,29,0.4)_56%,rgba(6,11,29,0.68)_100%)]" />
      </div>

      <div className="relative h-full pl-4 pr-0 pb-10 pt-24 sm:pl-8 lg:pl-10" data-hero-scene>
        <div className="relative grid h-full grid-cols-1 items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative flex flex-col justify-center gap-6 pr-0 lg:pr-3" data-hero-left>
          <div className="absolute -left-5 top-5 hidden h-[76%] flex-col items-center justify-between text-white/60 md:flex" aria-hidden="true" data-hero-rail>
            <span className="h-full w-px bg-white/24" />
            <div className="absolute top-6 flex flex-col items-center gap-5">
              {Array.from({ length: total }).map((_, idx) => (
                <span
                  key={idx}
                  data-hero-dot
                  className={`h-3 w-3 rounded-full border border-white/40 transition ${idx === active ? 'bg-white' : 'bg-white/20 hover:bg-white/35'}`}
                />
              ))}
            </div>
            <span className="absolute -left-3 bottom-0 -rotate-90 text-[10px] font-semibold tracking-[0.34em] text-white/70">
              {meta}
            </span>
          </div>

          <h1 className="text-balance text-5xl font-extrabold leading-[0.86] sm:text-6xl md:text-7xl lg:text-[96px]" aria-label={`${hero.name} hero`}>
            <span data-hero-title-line className="block overflow-hidden">
              <span data-hero-title className="block">
                {splitText(hero.name.toUpperCase(), {
                  mode: 'words',
                  innerClassName:
                    'inline-block will-change-transform will-change-opacity will-change-[filter] text-inherit',
                })}
              </span>
            </span>
          </h1>

          <p
            data-hero-sub
            className="max-w-[580px] text-[12px] leading-relaxed text-white/82 sm:text-[13px]"
          >
            {hero.blurb}
          </p>

          <div className="flex items-center gap-4 pt-2" data-hero-cta-wrap>
            <a
              className="inline-flex h-[54px] items-center justify-center gap-3 rounded-xl bg-[rgb(var(--accent-primary-rgb))] px-7 text-[22px] font-semibold leading-none text-white shadow-[0_16px_40px_rgba(0,102,204,0.35)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              href="#"
              data-hero-cta
            >
              Explore
              <span aria-hidden className="text-xl">→</span>
            </a>
          </div>

          <span
            className="pointer-events-none absolute -bottom-8 left-0 text-6xl font-bold uppercase leading-none text-white/8 sm:text-7xl md:text-8xl"
            aria-hidden="true"
            data-hero-ghost
          >
            {ghostName}
          </span>
        </div>

        <div className="relative flex min-w-0 items-center -mr-4 sm:-mr-8 lg:-mr-10" data-hero-right>
          <HeroCardRail cards={hero.cards} />
        </div>

        {/* Bottom progress (matches reference: simple, left-aligned) */}
        <div
          className="pointer-events-none absolute bottom-10 right-4 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/70 sm:right-10 lg:right-14"
          aria-hidden="true"
        >
          <span>01</span>
          <span className="h-px w-10 bg-white/35" />
          <span className="text-white/80">09</span>
        </div>

        <div
          className="pointer-events-auto absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
          data-hero-nav
        >
          <button
            type="button"
            onClick={onPrev}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white/75 backdrop-blur transition hover:bg-white/16"
            aria-label="Previous slide"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white/75 backdrop-blur transition hover:bg-white/16"
            aria-label="Next slide"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
        </div>
      </div>

      <HeroExploreMotion containerId={heroId} />
    </section>
  );
}
