"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { Compass, Sparkles, MapPin, Award } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const panels = [
  {
    id: "panel-1",
    title: "AI Itineraries",
    subtitle: "Tell us your vibe, budget & dates — our AI builds the perfect day-by-day plan in seconds.",
    icon: Compass,
    iconLabel: "Intelligent Route Planning",
  },
  {
    id: "panel-2",
    title: "Temple Circuits",
    subtitle: "Curated spiritual routes across India — from Char Dham to the Jyotirlinga trail.",
    icon: Sparkles,
    iconLabel: "Spiritual Heritage Trails",
  },
  {
    id: "panel-3",
    title: "Hidden Gems",
    subtitle: "Go beyond the guidebook. Discover off-beat villages, secret waterfalls & local favorites.",
    icon: MapPin,
    iconLabel: "Off-beat Explorations",
  },
  {
    id: "panel-4",
    title: "Digital Passport",
    subtitle: "Collect stamps, earn badges & build a shareable travel logbook as you explore India.",
    icon: Award,
    iconLabel: "Gamified Passport Stamps",
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
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-card border-y border-border text-card-foreground">
      <div 
        ref={carouselRef} 
        className="flex w-[400vw] h-full"
      >
        {panels.map((panel, index) => {
          const IconComp = panel.icon;
          return (
            <div 
              key={panel.id} 
              className="horizontal-panel relative w-screen h-full flex flex-col justify-end px-6 sm:px-12 md:px-24 pb-16 sm:pb-24 border-r border-border/50"
            >
              {/* Decorative Vector Motif */}
              <div className="absolute top-1/3 right-12 md:right-24 -translate-y-1/2 opacity-10 pointer-events-none">
                <IconComp className="w-64 h-64 sm:w-96 sm:h-96 text-primary" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 max-w-3xl">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: false, amount: 0.5 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 font-mono"
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{panel.iconLabel}</span>
                  <span className="ml-2 opacity-60">0{index + 1} / 0{panels.length}</span>
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: false, amount: 0.5 }}
                  className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight font-serif mb-4 text-card-foreground"
                >
                  {panel.title}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  viewport={{ once: false, amount: 0.5 }}
                  className="text-base sm:text-xl text-muted-foreground font-sans max-w-xl leading-relaxed"
                >
                  {panel.subtitle}
                </motion.p>
              </div>

              {/* Bottom Progress Bar */}
              <div className="absolute bottom-8 left-12 right-12 z-10 hidden md:flex items-center gap-3">
                {panels.map((_, i) => (
                  <div key={i} className={`h-[2px] flex-1 rounded-full transition-all duration-500 ${i === index ? 'bg-primary' : 'bg-border'}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
