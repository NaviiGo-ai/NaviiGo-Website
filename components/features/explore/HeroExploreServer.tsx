import Image from 'next/image';

import { splitText } from '@/lib/motion/splitText';

type FeatureCard = {
  title: string;
  image: string;
  badge?: string;
  align?: 'up' | 'down' | 'flat';
};

type HeroSlide = {
  name: string;
  meta: string;
  blurb: string;
  primary: string;
  cards: FeatureCard[];
  tags: string[];
};

const heroSlide: HeroSlide = {
  name: 'Varanasi',
  meta: '01 / 04',
  blurb:
    'Experience the spiritual heart of India. Varanasi, one of the oldest living cities, offers deep cultural roots, ancient ghats, and mesmerizing Ganga Aarti ceremonies.',
  primary: '/explore/cover-main.svg',
  tags: ['Ghats', 'Spirituality', 'Temples'],
  cards: [
    { title: 'Ganga Aarti', image: '/explore/destination-01.svg', badge: 'Popular', align: 'down' },
    { title: 'Kashi Vishwanath', image: '/explore/destination-02.svg', badge: 'Holy', align: 'flat' },
    { title: 'Assi Ghat', image: '/explore/destination-03.svg', badge: 'River', align: 'up' },
  ],
};

export default function HeroExploreServer({ heroId }: { heroId: string }) {
  const hero = heroSlide;

  return (
    <section
      id={heroId}
      data-explore-hero
      className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_22px_90px_rgba(0,0,0,0.18)]"
    >
      <div
        data-explore-bg
        className="mask-vignette pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <Image src={hero.primary} alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_18%_20%,rgb(var(--accent-primary-rgb)/0.30),transparent_55%),radial-gradient(1200px_circle_at_80%_16%,rgb(var(--accent-secondary-rgb)/0.18),transparent_55%),linear-gradient(to_bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.55))]" />
      </div>

      <div className="relative grid min-h-[86vh] grid-cols-1 gap-10 px-4 py-8 sm:px-10 sm:py-12 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 md:flex">
          <div className="flex flex-col items-center gap-3 text-white/70">
            <span className="h-10 w-px bg-white/30" />
            {[1, 2, 3, 4].map((idx) => (
              <span
                key={idx}
                className={`h-2.5 w-2.5 rounded-full border border-white/50 ${idx === 1 ? 'bg-white' : 'bg-white/20'}`}
              />
            ))}
            <span className="h-16 w-px bg-white/30" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
              {hero.meta}
            </span>
          </div>
        </aside>

        <div className="relative z-10 flex flex-col justify-center gap-6 text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.45)]">
          <p
            data-explore-tagline
            className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75"
          >
            Destinations
          </p>

          <h1
            className="text-balance text-5xl font-extrabold leading-[0.95] sm:text-6xl md:text-7xl"
            aria-label={`${hero.name} entry hero`}
          >
            <span data-explore-title-line className="block overflow-hidden">
              <span data-explore-title className="block">
                {splitText(hero.name.toUpperCase(), {
                  mode: 'words',
                  innerClassName:
                    'inline-block will-change-transform will-change-opacity will-change-[filter]',
                })}
              </span>
            </span>
          </h1>

          <p
            data-explore-subheading
            className="max-w-xl text-sm leading-relaxed text-white/80 sm:text-base"
          >
            {hero.blurb}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">
            {hero.tags.map((tag) => (
              <span
                key={tag}
                data-explore-chip
                className="glass rounded-full px-3 py-1 text-white/85"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <a
              className="inline-flex h-12 items-center justify-center gap-3 rounded-xl bg-[rgb(var(--accent-primary-rgb))] px-5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(0,102,204,0.35)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/30"
              href="#"
              data-explore-search
            >
              Explore
              <span aria-hidden className="text-lg">
                →
              </span>
            </a>
            <span className="text-xs text-white/75">Cinematic entry — GSAP powered</span>
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-end gap-3 lg:gap-4">
          <div className="absolute -left-10 bottom-6 hidden text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 sm:block">
            Scroll
          </div>

          <div className="glass-strong relative grid w-full max-w-[720px] grid-cols-1 gap-3 rounded-3xl bg-white/4 p-4 backdrop-blur lg:grid-cols-3">
            {hero.cards.map((card) => (
              <article
                key={card.title}
                data-explore-card
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_48px_rgba(0,0,0,0.28)] ${
                  card.align === 'up' ? 'lg:-translate-y-2' : ''
                } ${card.align === 'down' ? 'lg:translate-y-3' : ''}`}
              >
                <div className="absolute inset-0" aria-hidden="true">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.55))]" />
                </div>

                <div className="relative flex h-72 flex-col justify-between p-4 text-white">
                  <div className="space-y-1 text-sm font-semibold">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span>{card.title}</span>
                    </div>
                    {card.badge ? (
                      <span className="inline-flex w-fit rounded-full bg-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                        {card.badge}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-end">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                      <span aria-hidden>🔖</span>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <footer className="relative col-span-full flex items-center justify-between text-white/80">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
            <span className="text-white/60">01</span>
            <span className="h-px w-8 bg-white/40" />
            <span className="text-white">09</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white/70 backdrop-blur transition hover:bg-white/20" aria-label="Previous slide">
              <span aria-hidden>←</span>
            </button>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white/70 backdrop-blur transition hover:bg-white/20" aria-label="Next slide">
              <span aria-hidden>→</span>
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
