'use client';

import React, { useRef, useState } from 'react';
import LineMask from '@/lib/motion/LineMask';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FullBleed from '@/components/layout/primitives/FullBleed';
import PlaceImage from '@/components/shared/PlaceImage';

gsap.registerPlugin(ScrollTrigger);

// Photography resolves through the live Google Places pipeline; the Unsplash
// URLs below are only the honest fallback when a place has no served photo.
const stages = [
  {
    number: "01",
    title: "Discover",
    statement: "It begins with listening.",
    description: "We start by understanding your dreams, preferences, pace, and travel style. Every journey is a blank canvas, and we listen closely to design an expedition that resonates with your vision.",
    place: "Lake Pichola",
    city: "Udaipur",
    fallback: "https://images.unsplash.com/photo-1599661559132-7667a4d1a1d5?auto=format&fit=crop&w=1600&q=80",
  },
  {
    number: "02",
    title: "Design",
    statement: "Then it is drawn by hand.",
    description: "Our travel architects create a highly personalized itinerary tailored to your unique expectations, opening doors to private experiences and unfiltered destinations.",
    place: "Amber Fort",
    city: "Jaipur",
    fallback: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80",
  },
  {
    number: "03",
    title: "Manage",
    statement: "The logistics disappear.",
    description: "Flights, boutique hotels, exclusive transfers, and complex logistics are handled seamlessly before you even notice. All friction is removed.",
    place: "Kumarakom",
    city: "Kerala",
    fallback: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1600&q=80",
  },
  {
    number: "04",
    title: "Support",
    statement: "A voice, whenever you need one.",
    description: "From departure to your safe return, you have access to our 24/7 dedicated human concierge team. Quiet, highly-capable assistance, a call away.",
    place: "Umaid Bhawan Palace",
    city: "Jodhpur",
    fallback: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80",
  },
];

export default function ConciergeSupport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const [currentStage, setCurrentStage] = useState(0);

  useGSAP(() => {
    if (!triggerRef.current || !containerRef.current) return;

    // Set initial state
    const images = gsap.utils.toArray<HTMLElement>('.stage-image');
    const texts = gsap.utils.toArray<HTMLElement>('.stage-text-item');

    gsap.set(images[0], { clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.set(texts[0], { opacity: 1, y: 0 });

    for (let i = 1; i < stages.length; i++) {
      gsap.set(images[i], { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(texts[i], { opacity: 0, y: 30 });
    }

    // Create timelines for each stage (1-3)
    stages.forEach((_, i) => {
      if (i === 0) return;

      gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: `top top+=${(i-1)*25}%`,
          end: `top top+=${i*25}%`,
          scrub: true,
        }
      })
      .to(images[i], { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
      .to(texts[i-1], { opacity: 0, y: -30 }, 0)
      .to(texts[i], { opacity: 1, y: 0 }, 0);
    });

    // Progress indicator update
    ScrollTrigger.create({
      trigger: triggerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const progress = self.progress;
        const stageIndex = Math.min(3, Math.floor(progress * 4));
        setCurrentStage(stageIndex);
      }
    });
  }, { scope: triggerRef });

  return (
    <FullBleed ref={triggerRef} className="relative h-[400vh] bg-warm-ivory text-deep-charcoal-900 border-t border-deep-charcoal-200">

      {/* Sticky wrapper that stays in viewport for 400vh */}
      <div ref={containerRef} className="sticky top-0 h-screen w-full flex flex-col md:flex-row overflow-hidden">

        {/* Label Badge */}
        <div className="absolute top-8 md:top-12 left-6 md:left-16 z-20 mix-blend-difference flex flex-col pointer-events-none">
          <div className="flex items-center space-x-3 text-warm-ivory text-xs tracking-widest uppercase font-mono mb-4">
            <span>07</span>
            <span className="w-8 h-[1px] bg-warm-ivory/40" />
            <span>How We Support Your Journey</span>
          </div>
        </div>

        {/* Left Side: Masked Images */}
        <div className="relative w-full h-[50vh] md:h-full md:w-1/2 bg-deep-charcoal-900 overflow-hidden">
          {stages.map((stage, i) => (
            <div
              key={`img-${i}`}
              className="stage-image absolute inset-0"
              style={{
                clipPath: 'inset(100% 0% 0% 0%)', // GSAP overrides this
                zIndex: i + 1, // stack them so they reveal over each other
              }}
            >
              <PlaceImage
                name={stage.place}
                city={stage.city}
                width={1600}
                asBackground
                fallbackUrl={stage.fallback}
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ))}
          {/* Base image so bottom isn't empty on load */}
          <PlaceImage
            name={stages[0].place}
            city={stages[0].city}
            width={1600}
            asBackground
            fallbackUrl={stages[0].fallback}
            className="absolute inset-0 z-0 h-full w-full"
          />
        </div>

        {/* Right Side: Copy Flow */}
        <div className="relative w-full h-[50vh] md:h-full md:w-1/2 flex items-center justify-center p-8 md:p-16 lg:p-24 bg-warm-ivory">

          <div className="relative w-full max-w-lg h-full flex flex-col justify-center">
            {/* Main Headline */}
            <div className="absolute top-0 md:top-[15%] left-0 w-full z-20">
              <h2 className="text-3xl md:text-5xl lg:text-7xl font-serif leading-[1.05] tracking-tight">
                <span className="block italic font-light opacity-60 mb-2 md:mb-4 text-xl md:text-4xl">Every detail.</span>
                Before you<br/>even ask.
              </h2>
            </div>

            {/* Stages Text */}
            <div className="relative w-full h-[55%] mt-[42%] md:h-[60%] md:mt-[30%]">
              {stages.map((stage, i) => (
                <div
                  key={`text-${i}`}
                  className="stage-text-item absolute inset-0 flex flex-col justify-start opacity-0 translate-y-[30px]"
                >
                  <span className="text-saffron-600 text-xs md:text-sm tracking-widest uppercase font-mono mb-3 md:mb-6 block">
                    {stage.number} — {stage.title}
                  </span>

                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-serif text-deep-charcoal-900 leading-tight mb-3 md:mb-6">
                    {stage.statement}
                  </h3>

                  <p className="text-deep-charcoal-600 font-sans text-sm md:text-lg leading-relaxed max-w-md">
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress indicators */}
            <div className="absolute bottom-8 md:bottom-12 left-0 flex space-x-3">
              {stages.map((_, i) => (
                <div
                  key={`dot-${i}`}
                  className={`h-1.5 transition-all duration-300 rounded-full ${currentStage === i ? 'w-8 bg-saffron-600' : 'w-2 bg-deep-charcoal-200'}`}
                />
              ))}
            </div>
          </div>

        </div>

      </div>
    </FullBleed>
  );
}
