'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Compass, Sparkles, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = {
  id: string;
  name: string;
  subtitle: string;
  blurb: string;
  tag: string;
};

const slides: Slide[] = [
  {
    id: 'varanasi',
    name: 'VARANASI',
    subtitle: 'Spiritual Capital',
    blurb: 'Experience the spiritual heart of India. Ancient riverfront ghats, deep cultural roots, and mesmerizing evening Ganga Aarti ceremonies.',
    tag: 'Holy Ghats & Heritage',
  },
  {
    id: 'rajasthan',
    name: 'RAJASTHAN',
    subtitle: 'Land of Kings',
    blurb: 'Step into royal history. Golden Thar sand dunes, majestic hill forts, opulent palaces, and vibrant cultural grandeur.',
    tag: 'Forts & Desert Safari',
  },
  {
    id: 'himalayas',
    name: 'HIMALAYAS',
    subtitle: 'Peak Serenity',
    blurb: 'Ascend to breathtaking heights. Snow-clad mountain ranges, serene monasteries, and thrilling high-altitude alpine trails.',
    tag: 'Mountain Trails & Valleys',
  },
  {
    id: 'kerala',
    name: 'KERALA',
    subtitle: "God's Own Country",
    blurb: 'Serene backwaters, lush emerald tea plantations, heritage architecture, and tranquil tropical palm-fringed coastlines.',
    tag: 'Backwaters & Spice Gardens',
  },
];

export default function HeroSlider() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [mounted, setMounted] = useState(false);

  const currentSlide = slides[activeSlide] ?? slides[0];

  useEffect(() => {
    setMounted(true);
    const ticker = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5500);

    return () => window.clearInterval(ticker);
  }, []);

  const goPrev = () => {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  if (!mounted) {
    return (
      <section className="relative min-h-[85vh] overflow-hidden text-foreground bg-background flex items-center justify-center border-b border-border font-sans">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground font-serif">
            NAViiGO
          </h1>
          <p className="mt-4 text-muted-foreground text-xl font-semibold">We Navigate, You Go</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[88vh] sm:min-h-dvh overflow-hidden text-foreground bg-background border-b border-border flex items-center justify-center font-sans">
      {/* Travel Map Background Image - High Visibility */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 dark:opacity-45 dark:invert dark:hue-rotate-180 mix-blend-multiply dark:mix-blend-luminosity pointer-events-none transition-all duration-500"
        style={{ backgroundImage: "url('/home_bg.png')" }}
      />
      {/* Soft Vignette Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/50 to-transparent dark:from-background/80 dark:via-background/45 dark:to-transparent pointer-events-none" />

      <div className="relative z-10 mx-auto flex min-h-[85vh] sm:min-h-dvh w-full max-w-7xl items-center px-4 sm:px-6 py-16 lg:px-8">
        
        {/* Left Vertical Counter Indicator */}
        <div className="mr-10 hidden h-[65vh] flex-col items-center justify-between py-6 lg:flex shrink-0">
          <div className="flex flex-col items-center gap-3.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === activeSlide
                    ? 'h-9 w-3 bg-primary shadow-xs'
                    : 'h-3 w-3 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div className="origin-bottom -rotate-90 text-sm font-bold tracking-[0.3em] text-muted-foreground font-mono">
            {(activeSlide + 1).toString().padStart(2, '0')}/{slides.length.toString().padStart(2, '0')}
          </div>
        </div>

        {/* Clean Hero Column with Enhanced Typography */}
        <div className="w-full max-w-3xl">
          <div className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm sm:text-base font-bold mb-6 backdrop-blur-xs">
            <Sparkles className="w-4 h-4" />
            <span>{currentSlide.tag}</span>
          </div>

          <div className="relative min-h-[140px] sm:min-h-[190px] w-full overflow-hidden">
            <motion.div
              key={currentSlide.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <span className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-[0.35em] text-primary block mb-2.5 font-mono">
                {currentSlide.subtitle}
              </span>
              <h1 className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-extrabold tracking-tight text-foreground font-serif leading-none">
                {currentSlide.name}
              </h1>
            </motion.div>
          </div>

          <motion.p
            key={`blurb-${activeSlide}`}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-6 sm:mt-8 max-w-2xl text-lg sm:text-xl md:text-2xl leading-relaxed text-muted-foreground font-sans font-medium"
          >
            {currentSlide.blurb}
          </motion.p>

          <div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-4.5">
            <Link
              href={`/explore?q=${encodeURIComponent(currentSlide.name)}`}
              className="inline-flex items-center gap-3.5 rounded-2xl bg-primary px-9 py-4.5 text-base sm:text-lg font-bold text-primary-foreground shadow-md transition-all hover:scale-[1.03] hover:bg-primary/90"
            >
              <Navigation className="w-5 h-5" />
              <span>Explore Destinations</span>
              <span className="text-xl">&rarr;</span>
            </Link>

            <Link
              href="/itinerary?new=true"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-card/90 border border-border px-7 py-4.5 text-base sm:text-lg font-bold text-card-foreground hover:bg-accent transition-all shadow-xs backdrop-blur-xs"
            >
              <Compass className="w-5 h-5 text-primary" />
              <span>Plan a Trip</span>
            </Link>
          </div>
        </div>

        {/* Floating Slide Navigation Controls */}
        <div className="absolute bottom-6 right-8 flex items-center gap-3">
          <button
            onClick={goPrev}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 backdrop-blur-xs border border-border text-foreground font-bold hover:bg-accent transition-colors shadow-xs"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goNext}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-card/90 backdrop-blur-xs border border-border text-foreground font-bold hover:bg-accent transition-colors shadow-xs"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
