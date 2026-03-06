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
    background:
      'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=2200&q=80',
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
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2200&q=80',
  },
  {
    name: 'KERALA',
    blurb:
      'Kerala offers serene backwaters, lush tea-covered hills, heritage architecture, and tropical beaches, creating a slower and deeply scenic travel experience along India’s southwestern coast.',
    background:
      'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=2200&q=80',
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
    title: 'Ganga Aarti, Varanasi',
    image:
      'https://images.unsplash.com/photo-1582283925565-d053709d3bdf?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Amer Fort, Jaipur',
    image:
      'https://images.unsplash.com/photo-1599661502283-a44ea24dfc74?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Tea Gardens, Munnar',
    image:
      'https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Spiti Valley, Himalayas',
    image:
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=80',
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
    const first = spotCards[activeSlide % spotCards.length] ?? spotCards[0];
    const second = spotCards[(activeSlide + 1) % spotCards.length] ?? spotCards[1] ?? spotCards[0];
    const third = spotCards[(activeSlide + 2) % spotCards.length] ?? spotCards[2] ?? spotCards[0];
    const fourth = spotCards[(activeSlide + 3) % spotCards.length] ?? spotCards[3] ?? spotCards[0];

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
          initial={{ opacity: 0.25, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.2, scale: 1.02 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
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
                className={`rounded-full transition ${
                  index === activeSlide
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

        <div className="grid w-full grid-cols-1 items-center gap-8 xl:grid-cols-[1.1fr_1fr]">
          
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
                    duration: 0.5, // Perfect speed for a mechanical 'roll'
                    ease: [0.22, 1, 0.36, 1] 
                  }}
                >
                  {currentSlide.name}
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* Subtext blurb */}
            <AnimatePresence mode="wait">
              <motion.p
                key={`blurb-${currentSlide.name}`}
                className="mt-5 max-w-xl text-sm leading-relaxed text-white/90 drop-shadow-md sm:text-base font-medium"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                {currentSlide.blurb}
              </motion.p>
            </AnimatePresence>

            <Link href="/explore" className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#0066cc] px-7 py-4 text-lg font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[#0066cc]/90">
              Explore
              <span aria-hidden>→</span>
            </Link>
          </div>

          {/* Right Column: Masked Card Rail */}
          <div 
            className="relative min-w-0 overflow-visible -mr-[50vw]"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%)',
              maskImage: 'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%)',
            }}
          >
            <motion.div
              key={`cards-${activeSlide}`}
              initial={{ x: 56, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex w-max items-start gap-6"
            >
              {visibleCards.map((card, idx) => (
                <article key={`${activeSlide}-${card.title}-${idx}`} className="flex shrink-0 flex-col gap-3">
                  
                  <div className="flex items-center justify-between px-1 text-[14px] font-semibold tracking-wide text-white/95">
                    <span>{card.title}</span>
                    <div className="flex gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    </div>
                  </div>
                  
                  <div className="relative h-[380px] w-[280px] overflow-hidden rounded-[20px] bg-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                    <Image src={card.image} alt={card.title} fill className="object-cover" sizes="280px" />
                    
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
                    
                    <button type="button" className="absolute right-3 top-3 z-10 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" className="rotate-45">
                        <path d="M2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82l-7.17 7.17a2 2 0 0 1-2.83 0L2 12z" />
                        <circle cx="7" cy="7" r="2.5" fill="white" />
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
