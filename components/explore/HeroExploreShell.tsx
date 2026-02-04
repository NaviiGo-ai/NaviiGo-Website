"use client";

import Image from 'next/image';

import CardStack, { HeroCard } from './CardStack';
import HeroExploreMotion from './HeroExploreMotion';
import { splitText } from '@/lib/motion/splitText';

const cards: HeroCard[] = [
  {
    title: 'Buddha temple, Thailand',
    tag: 'Popular',
    image: '/explore/destination-01.svg',
    accent: 'amber',
  },
  {
    title: 'Broken Beach, Bali',
    tag: 'Coast',
    image: '/explore/destination-02.svg',
    accent: 'blue',
  },
  {
    title: 'Kerala',
    tag: 'River',
    image: '/explore/destination-03.svg',
    accent: 'emerald',
  },
];

export default function HeroExploreShell() {
  const heroId = 'hero-explore';

  return (
    <section
      id={heroId}
      role="region"
      aria-label="Explore destinations carousel"
      className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-[0_22px_90px_rgba(0,0,0,0.28)]"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,196,140,0.16),transparent_45%),radial-gradient(circle_at_80%_18%,rgba(94,231,255,0.14),transparent_46%)]" />
        <div className="absolute inset-0 opacity-70" data-hero-bg data-hero-bg-img>
          <Image
            src="/explore/cover-main.svg"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,29,0.8)_0%,rgba(6,11,29,0.55)_60%,rgba(6,11,29,0.9)_100%)]" />
      </div>

      <div className="relative grid min-h-[88vh] grid-cols-1 gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:px-12 lg:py-14" data-hero-scene>
        <div className="relative flex flex-col justify-center gap-6 pr-6" data-hero-left>
          <div className="absolute -left-10 top-20 hidden flex-col items-center gap-4 text-white/60 md:flex" aria-hidden="true" data-hero-rail>
            <span className="text-[10px] font-semibold tracking-[0.3em]">01 / 04</span>
            <div className="flex flex-col items-center gap-3">
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  data-hero-dot
                  className={`h-2.5 w-2.5 rounded-full border border-white/40 ${idx === 0 ? 'bg-white' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/70" data-hero-kicker>
            Destinations
          </p>

          <h1
            className="text-balance text-5xl font-extrabold leading-[0.9] sm:text-6xl md:text-7xl"
            aria-label="Indonesia hero"
          >
            <span data-hero-title-line className="block overflow-hidden">
              <span data-hero-title className="block">
                {splitText('INDONESIA', {
                  mode: 'words',
                  innerClassName:
                    'inline-block will-change-transform will-change-opacity will-change-[filter] text-inherit',
                })}
              </span>
            </span>
          </h1>

          <p
            data-hero-sub
            className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg"
          >
            As the largest archipelagic country in the world, Indonesia is blessed with people, cultures, and landscapes that feel cinematic from dawn to dusk.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80" data-hero-tags>
            {['Bali', 'Borobudur', 'Flores'].map((tag) => (
              <span key={tag} className="glass rounded-full px-3 py-1">{tag}</span>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <a
              className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[rgb(var(--accent-primary-rgb))] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,102,204,0.35)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              href="#"
              data-hero-cta
            >
              Explore
              <span aria-hidden className="text-lg">→</span>
            </a>
            <span className="text-xs text-white/70">Cinematic entry — GSAP powered</span>
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-white/70" aria-hidden="true">
            <span>01</span>
            <span className="h-px w-10 bg-white/40" />
            <span className="text-white">09</span>
          </div>
        </div>

        <div className="relative flex flex-col items-end gap-4" data-hero-right>
          <div className="absolute -left-6 top-12 hidden rotate-90 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/60 md:block" aria-hidden="true">
            Scroll
          </div>

          <CardStack cards={cards} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40" aria-hidden="true">
        <span className="mx-2">01 — 09</span>
      </div>

      <HeroExploreMotion containerId={heroId} />
    </section>
  );
}
