"use client";

import { motion } from "framer-motion";
import { useRef, useLayoutEffect } from "react";
import Image from "next/image";
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
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#050505] pt-24 sm:pt-32 text-black dark:text-white pb-32">
      <div className="max-w-6xl mx-auto px-6" ref={textRef}>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full h-[60vh] rounded-[2rem] overflow-hidden relative mb-24"
        >
          <Image 
            src="https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80" 
            alt="The majestic Taj Mahal at sunrise"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h1 className="text-white text-3xl sm:text-5xl md:text-8xl font-bold tracking-tighter">We are NaviiGo.</h1>
          </div>
        </motion.div>

        <div className="space-y-32">
          <div className="reveal-text grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight">
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
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight order-1 md:order-2">
              Fragmented Planning. <br/> <span className="text-orange-500 dark:text-orange-400 italic font-serif">Solved.</span>
            </h2>
          </div>
        </div>

        {/* Team Section */}
        <div className="mt-40 reveal-text">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight">
              Meet the <span className="text-blue-600 dark:text-blue-500 italic font-serif">Visionaries.</span>
            </h2>
            <p className="mt-6 text-lg md:text-xl text-zinc-600 dark:text-zinc-400 font-light max-w-2xl mx-auto">
              We are a team of passionate engineers, designers, and travelers dedicated to building the future of travel tech in India.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/50 p-6 transition-all hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-blue-900/20">
              <div className="aspect-square w-full rounded-3xl overflow-hidden mb-6 relative flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-950" role="img" aria-label="Param Nainani">
                <span aria-hidden="true" className="text-5xl font-black tracking-tight text-white/90 select-none transition-transform duration-700 group-hover:scale-110">PN</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Param Nainani</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">CEO</p>
            </div>

            {/* Team Member 2 */}
            <div className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/50 p-6 transition-all hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-blue-900/20">
              <div className="aspect-square w-full rounded-3xl overflow-hidden mb-6 relative flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 dark:from-indigo-800 dark:to-purple-950" role="img" aria-label="Manpreet Singh">
                <span aria-hidden="true" className="text-5xl font-black tracking-tight text-white/90 select-none transition-transform duration-700 group-hover:scale-110">MS</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Manpreet Singh</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">COO</p>
            </div>

            {/* Team Member 3 */}
            <div className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/50 p-6 transition-all hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-blue-900/20">
              <div className="aspect-square w-full rounded-3xl overflow-hidden mb-6 relative flex items-center justify-center bg-gradient-to-br from-sky-600 to-blue-800 dark:from-sky-800 dark:to-blue-950" role="img" aria-label="Ojaswee Upadhyay">
                <span aria-hidden="true" className="text-5xl font-black tracking-tight text-white/90 select-none transition-transform duration-700 group-hover:scale-110">OU</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Ojaswee Upadhyay</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">CTO</p>
            </div>

            {/* Team Member 4 */}
            <div className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/50 p-6 transition-all hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-blue-900/20">
              <div className="aspect-square w-full rounded-3xl overflow-hidden mb-6 relative flex items-center justify-center bg-gradient-to-br from-violet-600 to-fuchsia-700 dark:from-violet-800 dark:to-fuchsia-950" role="img" aria-label="Lavish Sharma">
                <span aria-hidden="true" className="text-5xl font-black tracking-tight text-white/90 select-none transition-transform duration-700 group-hover:scale-110">LS</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Lavish Sharma</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">CFO</p>
            </div>

            {/* Team Member 5 */}
            <div className="group relative rounded-[2rem] overflow-hidden bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800/50 p-6 transition-all hover:-translate-y-2 hover:shadow-2xl dark:hover:shadow-blue-900/20">
              <div className="aspect-square w-full rounded-3xl overflow-hidden mb-6 relative flex items-center justify-center bg-gradient-to-br from-cyan-600 to-teal-700 dark:from-cyan-800 dark:to-teal-950" role="img" aria-label="Nikhil Bhatt">
                <span aria-hidden="true" className="text-5xl font-black tracking-tight text-white/90 select-none transition-transform duration-700 group-hover:scale-110">NB</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">Nikhil Bhatt</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">CMO</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
