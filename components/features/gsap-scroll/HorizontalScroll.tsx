"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
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
    subtitle: "Tell us your vibe, budget & dates — our AI builds the perfect day-by-day plan in seconds.",
    accent: "from-blue-600/40 to-indigo-900/60",
    image: "/destinations/agra.png" // Taj Mahal
  },
  {
    id: "panel-2",
    title: "Temple Circuits",
    subtitle: "Curated spiritual routes across India — from Char Dham to the Jyotirlinga trail.",
    accent: "from-orange-600/40 to-amber-900/60",
    image: "/destinations/varanasi.png" // Varanasi Ghats/Temples
  },
  {
    id: "panel-3",
    title: "Hidden Gems",
    subtitle: "Go beyond the guidebook. Discover off-beat villages, secret waterfalls & local favorites.",
    accent: "from-emerald-600/40 to-teal-900/60",
    image: "/destinations/manali.png" // Mountains/Nature
  },
  {
    id: "panel-4",
    title: "Digital Passport",
    subtitle: "Collect stamps, earn badges & build a shareable travel logbook as you explore India.",
    accent: "from-purple-600/40 to-violet-900/60",
    image: "/destinations/jaipur.png" // Heritage
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
            className="horizontal-panel relative w-screen h-full flex flex-col justify-end px-4 sm:px-10 md:px-24 pb-16 sm:pb-24"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
               <Image 
                 src={panel.image} 
                 alt={panel.title}
                 fill
                 priority={index === 0}
                 className="object-cover"
                 sizes="100vw"
               />
               <div className={`absolute inset-0 bg-gradient-to-t ${panel.accent}`} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 max-w-3xl">
              {/* Panel Number */}
              <motion.span 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: false, amount: 0.5 }}
                className="inline-block mb-4 text-sm font-mono tracking-[0.3em] text-white/50 uppercase"
              >
                0{index + 1} / 0{panels.length}
              </motion.span>
              
              <motion.h2 
                initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1, ease: "easeOut" }}
                viewport={{ once: false, amount: 0.5 }}
                className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-3 sm:mb-4"
              >
                {panel.title}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 30, filter: "blur(5px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                viewport={{ once: false, amount: 0.5 }}
                className="text-sm sm:text-lg md:text-xl text-zinc-300 font-light max-w-xl"
              >
                {panel.subtitle}
              </motion.p>
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-8 left-10 right-10 z-10 hidden md:flex items-center gap-3">
              {panels.map((_, i) => (
                <div key={i} className={`h-[2px] flex-1 rounded-full transition-all duration-500 ${i === index ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
