'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type Slide = {
  name: string;
  blurb: string;
  background: string;
};

type SpotCard = {
  title: string;
  image: string;
};

const slides: Slide[] = [
  {
    name: 'VARANASI',
    blurb:
      'Experience the spiritual heart of India. Varanasi, one of the oldest living cities, offers deep cultural roots, ancient ghats, and mesmerizing Ganga Aarti ceremonies.',
    background: '/assets/varanasi-bg.jpg',
  },
  {
    name: 'RAJASTHAN',
    blurb:
      'Step into the land of Kings. Rajasthan features golden deserts, majestic forts, opulent palaces, and a vibrant culture that echoes tales of historic grandeur.',
    background:
      'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2200&q=80',
  },
  {
    name: 'HIMALAYAS',
    blurb:
      'Ascend to the breathtaking peaks. The Indian Himalayas offer snow-clad mountains, spiritual retreats, and thrilling adventures in a landscape of pristine beauty.',
    background:
      'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?auto=format&fit=crop&w=2200&q=80',
  },
  {
    name: 'KERALA',
    blurb:
      'Kerala offers serene backwaters, lush tea-covered hills, heritage architecture, and tropical beaches, creating a slower and deeply scenic travel experience along India’s southwestern coast.',
    background:
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2200&q=80',
  },
];

const fallbackSlide: Slide = {
  name: 'INDIA',
  blurb: 'Discover the diverse, deeply spiritual, and culturally rich landscapes of India.',
  background:
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=2200&q=80',
};

const spotCards: SpotCard[] = [
  {
    title: 'Ganges Boat Ride, Varanasi',
    image: '/assets/varanasi-spot-card.jpg',
  },
  {
    title: 'Hawa Mahal, Jaipur',
    image:
      'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Himalayan Peaks',
    image:
      'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Backwaters, Kerala',
    image:
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=80',
  },
];

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const currentSlide = slides[activeSlide] ?? slides[0] ?? fallbackSlide;

  useEffect(() => {
    const ticker = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(ticker);
  }, []);

  const visibleCards = useMemo(() => {
    // Show cards starting from the NEXT slide to emphasize what's coming
    const first = spotCards[(activeSlide + 1) % spotCards.length];
    const second = spotCards[(activeSlide + 2) % spotCards.length];
    const third = spotCards[(activeSlide + 3) % spotCards.length];
    const fourth = spotCards[(activeSlide + 4) % spotCards.length];

    return [first, second, third, fourth].filter(Boolean) as SpotCard[];
  }, [activeSlide]);

  const goPrev = () => {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  return (
    <section className="relative min-h-dvh overflow-hidden text-white">
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide.name}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <Image
            src={currentSlide.background}
            alt={`${currentSlide.name} landscape`}
            fill
            priority
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Background with darker gradient overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-slate-950/20 backdrop-blur-[2px]" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[1500px] items-center px-6 py-10 lg:px-10">

        {/* Left Pagination Sidebar */}
        <div className="mr-6 hidden h-[78vh] items-center gap-4 lg:flex">
          <div className="flex h-full flex-col items-center justify-between py-4">
            {slides.map((slide, index) => (
              <span
                key={slide.name}
                className={`rounded-full transition ${index === activeSlide
                  ? 'h-5 w-5 border border-white/70 bg-white/30'
                  : 'h-2 w-2 bg-white/60'
                  }`}
              />
            ))}
          </div>
          <span className="h-full w-px bg-white/30" />
          <span className="origin-bottom -rotate-90 text-xs tracking-[0.28em] text-white/75">
            {(activeSlide + 1).toString().padStart(2, '0')}/{slides.length.toString().padStart(2, '0')}
          </span>
        </div>

        <div className="grid w-full grid-cols-1 items-center gap-16 xl:grid-cols-[1.1fr_1fr]">

          <div className="max-w-2xl">
            {/* Heading: Simultaneous Box Roll Effect */}
            <div className="relative h-[72px] w-full sm:h-[84px] lg:h-[108px] overflow-hidden">
              {/* Removed mode="wait" to allow the old text and new text to move at the same time */}
              <AnimatePresence>
                <motion.h1
                  key={currentSlide.name}
                  // Restored 'absolute' so the text lines overlap perfectly during the transition
                  className="absolute left-0 top-0 text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl leading-none drop-shadow-2xl"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{
                    duration: 0.8, // Perfect speed for a mechanical 'roll'
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  {currentSlide.name}
                </motion.h1>
              </AnimatePresence>
            </div>

            <motion.p
              key={`blurb-${activeSlide}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-lg text-sm leading-relaxed text-white/60 sm:text-base font-light"
            >
              {currentSlide.blurb}
            </motion.p>
            <Link
              href="/explore"
              className="mt-10 inline-flex items-center gap-4 rounded-xl bg-blue-600/90 px-10 py-4 text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.05] hover:bg-blue-600"
            >
              Explore
              <span className="text-xl">→</span>
            </Link>
          </div>

          {/* Right Column: Masked Card Rail */}
          <div
            className="relative min-w-0"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
            }}
          >
            <motion.div
              key={`cards-${activeSlide}`}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex w-max items-start gap-12"
            >
              {visibleCards.map((card, idx) => (
                <article
                  key={`${activeSlide}-${card.title}-${idx}`}
                  className="flex shrink-0 flex-col gap-6 transition-all duration-1000"
                  style={{
                    filter: `blur(${idx * 4}px)`,
                    transform: `scale(${1 - idx * 0.1})`,
                    opacity: 1 - idx * 0.3,
                    zIndex: 20 - idx,
                  }}
                >
                  <div className={`flex flex-col gap-3 transition-all duration-700 ${idx === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                    <span className="text-sm font-semibold tracking-wide text-white/95">
                      {card.title}
                    </span>
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            i === 0 ? 'bg-white' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className={`relative h-[380px] w-[280px] overflow-hidden rounded-[28px] bg-slate-800 transition-shadow duration-1000 ${
                    idx === 0 ? 'shadow-[0_40px_100px_rgba(0,0,0,0.6)]' : 'shadow-none'
                  }`}>
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      className="object-cover"
                      sizes="280px"
                    />
                    
                    {/* Shadow Overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/60" />

                    {/* Bookmark Icon */}
                    <button
                      type="button"
                      className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur-md transition hover:bg-white/30"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-3 lg:flex">
          <button
            onClick={goPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-lg transition hover:bg-white/45"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/30 text-lg transition hover:bg-white/45"
            aria-label="Next slide"
          >
            ›
          </button>
        </div>

        {/* Pagination Counter */}
        <div className="absolute bottom-9 right-10 hidden items-center gap-8 text-xs tracking-[0.3em] text-white/70 lg:flex">
          <span>{(activeSlide + 1).toString().padStart(2, '0')}</span>
          <span className="h-px w-12 bg-white/40" />
          <span>{slides.length.toString().padStart(2, '0')}</span>
        </div>
      </div>
    </section>
  );
}
