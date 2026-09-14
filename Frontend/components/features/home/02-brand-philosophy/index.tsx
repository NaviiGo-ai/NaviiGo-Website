'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LineMask from '@/lib/motion/LineMask';

gsap.registerPlugin(ScrollTrigger);

export default function BrandPhilosophy() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!sectionRef.current) return;

    const texts = gsap.utils.toArray<HTMLElement>('.fade-text', sectionRef.current);

    gsap.fromTo(
      texts,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        delay: 0.4,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        }
      }
    );
  }, { scope: sectionRef });

  return (
    <section
      id="brand-philosophy"
      ref={sectionRef}
      className="relative py-24 md:py-40 px-6 md:px-16 lg:px-24 bg-warm-ivory-50"
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

          {/* Label / Index - aligned to top left */}
          <div className="lg:col-span-3 flex flex-col">
             <div className="flex items-center space-x-3 text-deep-charcoal-400 text-xs tracking-widest uppercase font-mono">
              <span>02</span>
              <span className="w-8 h-[1px] bg-deep-charcoal-400/40" />
              <span>Brand Philosophy</span>
            </div>
          </div>

          {/* Large Typographic Statement */}
          <div className="lg:col-span-9">
            <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-deep-charcoal-900 leading-[1.05] tracking-tight flex flex-col space-y-1 sm:space-y-3">
              {/* Each line is short enough to never re-wrap — a wrapped line
                  would orphan a word and break its mask reveal. */}
              <LineMask>Luxury is not</LineMask>
              <LineMask>synonymous with excess.</LineMask>
              <LineMask>It is the quiet presence</LineMask>
              <LineMask>
                <span className="italic font-light opacity-95">of perfectly orchestrated</span>
              </LineMask>
              <LineMask>
                <span className="italic font-light opacity-95">details.</span>
              </LineMask>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mt-16 lg:mt-24">
              <p className="fade-text opacity-0 text-base lg:text-lg text-deep-charcoal-600 font-sans leading-relaxed">
                We design travel around the human experience. It is not about simply ticking off landmarks, but about connecting deeply with a place, its culture, and the people who give it life.
              </p>
              <p className="fade-text opacity-0 text-base lg:text-lg text-deep-charcoal-600 font-sans leading-relaxed">
                By removing the friction of logistics, we create the space for spontaneity and wonder. Every itinerary is a blank canvas, painted with your expectations and our expertise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
