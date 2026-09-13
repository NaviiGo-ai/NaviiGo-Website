'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import FullBleed from '@/components/layout/primitives/FullBleed';
import LineMask from '@/lib/motion/LineMask';

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Form staggered reveal
    gsap.from('.contact-input-wrapper', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 75%',
      },
      y: 60,
      opacity: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: 'power3.out',
    });

    // Arrow button reveal
    gsap.from('.contact-submit', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 60%',
      },
      scale: 0.8,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
    });
  }, { scope: containerRef });

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  return (
    <FullBleed className="bg-deep-charcoal text-warm-ivory py-32 lg:py-48 overflow-hidden">
      <div
        ref={containerRef}
        className="w-full max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-24 lg:gap-8"
      >
        {/* Left Editorial Section */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <LineMask>
              <p className="font-mono text-xs md:text-sm tracking-[0.2em] uppercase text-warm-ivory/50 mb-12">
                13 — Contact
              </p>
            </LineMask>

            <h2 className="text-7xl md:text-8xl lg:text-[10rem] font-serif leading-[0.85] tracking-tighter mb-16 -ml-1">
              <LineMask>Begin a</LineMask>
              <LineMask>conversation.</LineMask>
            </h2>

            <LineMask>
              <p className="text-xl md:text-2xl font-serif text-warm-ivory/60 max-w-md leading-relaxed">
                We design journeys of absolute distinction for a select clientele.
                Share your vision, and our private concierges will curate the extraordinary.
              </p>
            </LineMask>
          </div>

          <div className="mt-24 hidden lg:block space-y-4 text-warm-ivory/40 font-mono text-xs tracking-[0.2em] uppercase">
            <p className="hover:text-warm-ivory transition-colors duration-500 cursor-pointer">design@naviigo.com</p>
            <p className="hover:text-warm-ivory transition-colors duration-500 cursor-pointer">+1 (800) 555-0199</p>
            <p className="mt-12 pt-8 border-t border-warm-ivory/10 w-48 text-warm-ivory/30">
              London • New York • Tokyo
            </p>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="lg:col-span-6 lg:col-start-7 flex flex-col justify-center mt-12 lg:mt-0">
          <form
            className="space-y-12 lg:space-y-16"
            onSubmit={(e) => e.preventDefault()}
          >
            {[
              { id: 'name', label: 'Your Name', type: 'text' },
              { id: 'email', label: 'Email Address', type: 'email' },
              { id: 'phone', label: 'Phone Number', type: 'tel' }
            ].map((field) => (
              <div key={field.id} className="contact-input-wrapper relative pt-6 group">
                <label
                  htmlFor={field.id}
                  className="absolute left-0 top-0 font-mono text-xs tracking-[0.2em] uppercase text-warm-ivory/40 transition-all duration-500 group-focus-within:text-warm-ivory/80 group-focus-within:-translate-y-1 pointer-events-none"
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={field.type}
                  required
                  className="w-full bg-transparent border-b border-warm-ivory/15 pb-4 lg:pb-6 text-3xl lg:text-5xl font-serif text-warm-ivory focus:outline-none focus:border-warm-ivory/30 transition-colors duration-500 rounded-none shadow-none"
                />
                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-warm-ivory transition-all duration-700 ease-out group-focus-within:w-full"></span>
              </div>
            ))}

            <div className="contact-input-wrapper relative pt-6 group">
              <label
                htmlFor="message"
                className="absolute left-0 top-0 font-mono text-xs tracking-[0.2em] uppercase text-warm-ivory/40 transition-all duration-500 group-focus-within:text-warm-ivory/80 group-focus-within:-translate-y-1 pointer-events-none"
              >
                Where do you wish to explore?
              </label>
              <textarea
                id="message"
                rows={1}
                required
                className="w-full bg-transparent border-b border-warm-ivory/15 pb-4 lg:pb-6 text-3xl lg:text-5xl font-serif text-warm-ivory focus:outline-none focus:border-warm-ivory/30 transition-colors duration-500 resize-none overflow-hidden rounded-none shadow-none leading-tight"
                onChange={handleTextareaResize}
              />
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-warm-ivory transition-all duration-700 ease-out group-focus-within:w-full"></span>
            </div>

            <div className="contact-submit pt-8 flex justify-end lg:justify-start">
              <button
                type="submit"
                className="group flex items-center gap-6 cursor-pointer"
              >
                <span className="font-mono text-sm tracking-[0.2em] uppercase text-warm-ivory/60 group-hover:text-warm-ivory transition-colors duration-500">
                  Send Inquiry
                </span>
                <span className="w-20 h-20 lg:w-24 lg:h-24 rounded-full border border-warm-ivory/20 flex items-center justify-center group-hover:bg-warm-ivory group-hover:text-deep-charcoal transition-all duration-700 ease-out group-hover:border-warm-ivory">
                  <svg className="w-6 h-6 lg:w-8 lg:h-8 -rotate-45 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </button>
            </div>
          </form>

          {/* Mobile contact info */}
          <div className="mt-24 lg:hidden space-y-6 text-warm-ivory/40 font-mono text-xs tracking-[0.2em] uppercase text-center border-t border-warm-ivory/10 pt-12">
            <p className="hover:text-warm-ivory transition-colors duration-500 cursor-pointer">design@naviigo.com</p>
            <p className="hover:text-warm-ivory transition-colors duration-500 cursor-pointer">+1 (800) 555-0199</p>
            <p className="mt-8 pt-8 text-warm-ivory/30">London • New York • Tokyo</p>
          </div>
        </div>

      </div>
    </FullBleed>
  );
}
