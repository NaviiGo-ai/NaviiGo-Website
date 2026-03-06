"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const panels = [
  {
    id: "panel-1",
    title: "AI Itineraries",
    subtitle: "Customized travel plans based on your vibe and duration.",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "panel-2",
    title: "Temple Circuits",
    subtitle: "Complete spiritual routes intelligently mapped for you.",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "panel-3",
    title: "Hidden Gems",
    subtitle: "Discover India's lesser-known cultural spots and off-beat escapes.",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "panel-4",
    title: "Digital Pilgrim Passport",
    subtitle: "Mark your journey and curate a digital log of all your visits.",
    image: "https://images.unsplash.com/photo-1515091943-9d5c0ad2084c?auto=format&fit=crop&w=1200&q=80"
  }
];

export default function HorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const panelsArray = gsap.utils.toArray(".horizontal-panel");
      
      gsap.to(panelsArray, {
        xPercent: -100 * (panelsArray.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (panelsArray.length - 1),
          end: () => "+=" + carouselRef.current?.offsetWidth,
        }
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-black text-white">
      <div 
        ref={carouselRef} 
        className="flex w-[400vw] h-full"
      >
        {panels.map((panel, index) => (
          <div 
            key={panel.id} 
            className="horizontal-panel relative w-screen h-full flex flex-col justify-center px-10 md:px-24"
          >
            <div className="absolute inset-0 z-0">
               <img 
                 src={panel.image} 
                 alt={panel.title}
                 className="w-full h-full object-cover opacity-40 mix-blend-overlay"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
            
            <div className="relative z-10 max-w-4xl">
              <motion.h2 
                initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: false, amount: 0.5 }}
                className="text-6xl md:text-8xl font-bold tracking-tighter mb-4"
              >
                {panel.title}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                viewport={{ once: false, amount: 0.5 }}
                className="text-xl md:text-3xl text-zinc-300 font-light"
              >
                {panel.subtitle}
              </motion.p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
