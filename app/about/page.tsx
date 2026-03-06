"use client";

import { motion } from "framer-motion";
import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function AboutPage() {
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let ctx = gsap.context(() => {
      const texts = gsap.utils.toArray<HTMLElement>(".reveal-text");
      texts.forEach((text) => {
        gsap.fromTo(text, 
          { y: 100, opacity: 0 }, 
          { 
            y: 0, opacity: 1, 
            duration: 1.2, 
            ease: "expo.out",
            scrollTrigger: {
              trigger: text,
              start: "top 90%",
            }
          }
        );
      });
    }, textRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#050505] pt-32 text-black dark:text-white pb-32">
      <div className="max-w-6xl mx-auto px-6" ref={textRef}>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full h-[60vh] rounded-[2rem] overflow-hidden relative mb-24"
        >
          <img 
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2000&auto=format&fit=crop" 
            alt="Aircraft wing in flight"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h1 className="text-white text-5xl md:text-8xl font-bold tracking-tighter">We are NaviiGo.</h1>
          </div>
        </motion.div>

        <div className="space-y-32">
          <div className="reveal-text grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight">
              Redefining <br/> The Way You <span className="text-blue-600 dark:text-blue-500 italic font-serif">Travel.</span>
            </h2>
            <p className="text-lg md:text-2xl text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
              NaviiGo is a TravelTech startup focused on building a smart travel assistance platform that simplifies how people navigate and experience new places across India. It uses intelligent, data-driven technology to help travelers make better decisions, optimize their movement, and enjoy smoother, more personalized travel experiences. NaviiGo aims to reduce travel friction and make exploring Indian cities easier, smarter, and more intuitive. 
            </p>
          </div>

          <div className="reveal-text grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <p className="text-lg md:text-2xl text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
                We solve the problem of fragmented, time-consuming, and inefficient trip planning. With our platform, you receive personalized, data-driven itineraries that adapt to your preferences, budget, and time.
              </p>
            </div>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight order-1 md:order-2">
              Fragmented Planning. <br/> <span className="text-orange-500 dark:text-orange-400 italic font-serif">Solved.</span>
            </h2>
          </div>
        </div>

      </div>
    </div>
  );
}
