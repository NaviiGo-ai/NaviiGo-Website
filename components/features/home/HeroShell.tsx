import HeroMotion from './HeroMotion';
import SearchMotion from './SearchMotion';
import ScrollScenes from './ScrollScenes';
import { splitText } from '../../../lib/motion/splitText';
import { AuroraBackground } from '../../ui/AuroraBackground';

export default function HeroShell() {
  return (
    <div className="relative">
      {/* Hero */}
      <section
        data-hero
        className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 dark:ring-white/10"
      >
        <AuroraBackground className="h-auto w-full min-h-[600px] justify-start items-stretch pt-0 pb-0 bg-transparent dark:bg-transparent">
          <div className="relative px-6 py-14 sm:px-10 sm:py-20 z-10">
          <div className="max-w-3xl">
            <p className="text-xs font-medium tracking-[0.22em] text-slate-600 dark:text-slate-300">
              NAVIIGO • TRAVEL AGGREGATOR
            </p>

            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
              {splitText('We navigate the world so you can go.', { mode: 'words' })}
            </h1>

            <p
              data-hero-tagline
              className="mt-5 max-w-2xl text-pretty text-base text-slate-700 sm:text-lg dark:text-slate-200"
            >
              <span className="font-medium">We Navigate, You Go</span>
            </p>

            <div className="mt-10">
              <SearchMotion />
            </div>
          </div>
        </div>
        </AuroraBackground>


        {/* GSAP hero timeline (isolated client component) */}
        <HeroMotion />
      </section>

      {/* Scroll-based scenes (isolated client component) */}
      <ScrollScenes />

      {/* Storytelling sections */}
      <section className="mt-10 grid gap-6 md:grid-cols-3">
        <div
          data-reveal
          className="glass rounded-2xl p-6"
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Compare across partners
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Editorial, calm UI that helps you decide faster.
          </p>
        </div>

        <div
          data-reveal
          className="glass rounded-2xl p-6"
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Story-driven discovery
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Parallax-lite scenes and reveals — smooth, not gimmicky.
          </p>
        </div>

        <div
          data-reveal
          className="glass rounded-2xl p-6"
        >
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Affiliate-only booking
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            When you’re ready, we redirect you to book with partners.
          </p>
        </div>
      </section>

      {/* Parallax background accents */}
      <div className="pointer-events-none absolute -bottom-24 left-0 right-0 -z-10">
        <div
          data-parallax
          className="mx-auto h-48 w-[min(100%,980px)] rounded-full bg-primary/20 blur-3xl dark:bg-primary/10"
        />
      </div>
    </div>
  );
}
