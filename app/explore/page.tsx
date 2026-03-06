"use client";

import { useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from 'next/link';

const destinations = [
  { id: 1, title: "Rishikesh, Uttarakhand", price: "$1,200", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop" },
  { id: 2, title: "Hampi, Karnataka", price: "$950", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ce142?q=80&w=800&auto=format&fit=crop" },
  { id: 3, title: "Munnar, Kerala", price: "$1,800", image: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?q=80&w=800&auto=format&fit=crop" },
  { id: 4, title: "Varanasi, UP", price: "$1,050", image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800&auto=format&fit=crop" },
];

export default function ExplorePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    let ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal-card").forEach((card, i) => {
        gsap.fromTo(card,
          { opacity: 0, y: 150, rotateX: 10 },
          {
            opacity: 1, y: 0, rotateX: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
            }
          }
        );
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-[#070c16] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-24 flex flex-col justify-center items-center text-center"
        >
          <h1 className="text-6xl md:text-[8vw] leading-none font-bold tracking-tighter text-black dark:text-white mb-8">
            Explore <br/><span className="text-zinc-300 dark:text-zinc-700 italic font-serif">India.</span>
          </h1>
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl justify-center items-center">
            <Link href="/itinerary">
               <button className="bg-emerald-600 text-white rounded-full px-10 py-5 text-lg font-medium hover:scale-105 hover:bg-emerald-500 transition-all duration-300 shadow-xl flex items-center gap-3">
                 <span>✨</span> Create Personalized AI Itinerary
               </button>
            </Link>
            <button className="bg-black dark:bg-white text-white dark:text-black rounded-full px-10 py-5 text-lg font-medium hover:scale-105 transition-transform duration-300 shadow-xl">
               Browse Destinations
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 pl-0 md:pl-10">
          {destinations.map((dest, i) => (
            <div key={dest.id} className={`reveal-card relative group overflow-hidden rounded-[2rem] ${i % 2 !== 0 ? 'md:mt-32' : ''} h-[600px] shadow-2xl`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 z-10" />
              <img src={dest.image} alt={dest.title} className="w-full h-full object-cover transform scale-100 group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
              
              <div className="absolute top-6 right-6 z-20">
                 <button className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white hover:bg-white hover:text-black transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                 </button>
              </div>

              <div className="absolute bottom-0 left-0 p-10 z-20 w-full flex flex-col justify-end">
                <div className="overflow-hidden">
                  <h3 className="text-4xl font-bold tracking-tight text-white translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out">{dest.title}</h3>
                </div>
                <div className="overflow-hidden mt-4 flex justify-between items-end">
                  <div className="translate-y-12 group-hover:translate-y-0 transition-transform duration-500 delay-75 ease-out flex flex-col">
                     <span className="text-sm text-zinc-300 uppercase letter-spacing-2 font-medium">Flights + Hotel</span>
                     <span className="text-2xl font-light text-white">{dest.price}</span>
                  </div>
                  <button className="bg-white text-black font-semibold rounded-full px-6 py-3 opacity-0 group-hover:opacity-100 translate-y-12 group-hover:translate-y-0 transition-all duration-500 delay-150 ease-out hover:scale-105">
                    Book Trip
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
