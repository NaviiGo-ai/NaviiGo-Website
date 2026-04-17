"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MetasearchDealsPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md">
            Global MetaSearch Partner
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 uppercase tracking-tight leading-[1.1]">
            Global Travel
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              Deals & Aggregator
            </span>
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
            Compare prices across 500+ airlines and top hotels. Engineered by TravelPayouts & NaviiGo.
          </p>
        </motion.div>

        {isMounted && (
          <div className="space-y-12">
            {/* White Label Widget Inject Containers */}
            
            <div className="w-full bg-[#0c0c0e]/80 border border-white/5 rounded-3xl p-4 md:p-8 backdrop-blur-xl shadow-2xl relative">
              <div id="tpwl-search"></div>
            </div>

            <div className="w-full">
              <div id="tpwl-tickets"></div>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
