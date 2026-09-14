'use client';

import React, { useEffect, useState } from 'react';
import { Compass, Sparkles } from 'lucide-react';

const WAITING_MESSAGES = [
  'Cross-referencing 2,400+ unvetted traveler community dispatches...',
  'Filtering commercial tourist traps & crowded commission corridors...',
  'Pinpointing quiet heritage sanctuaries & generational artisan havens...',
  'Curating indigenous culinary institutions & golden hour frames...',
];

export default function DestinationLoading() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % WAITING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-28 pb-20 px-4 sm:px-6 md:px-10 selection:bg-brand-primary selection:text-white">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* ── MASTHEAD SKELETON & TELEMETRY ── */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-paper-light border border-[#EADFD4] font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-brand-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping" />
            <span>02 / FIELD DOSSIER STANDBY</span>
          </div>

          <div className="h-10 sm:h-14 w-64 sm:w-96 bg-[#EADFD4]/60 rounded-2xl mx-auto animate-pulse" />
          <div className="h-4 w-48 sm:w-64 bg-[#EADFD4]/40 rounded-full mx-auto animate-pulse" />
        </div>

        {/* ── LUXURY ASTROLABE COMPASS LOADER ── */}
        <div className="flex flex-col items-center justify-center py-10 sm:py-14">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            {/* Outer Rotating Compass Ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-brand-primary/40 animate-spin [animation-duration:16s]" />
            <div className="absolute inset-2 rounded-full border border-[#EADFD4] animate-spin [animation-duration:24s] [animation-direction:reverse]" />
            
            {/* Pulsing Core */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-paper-light border border-[#EADFD4] shadow-md flex items-center justify-center">
              <Compass className="w-7 h-7 sm:w-8 sm:h-8 text-brand-primary animate-pulse" />
            </div>
          </div>

          {/* Dynamic Status Text */}
          <div className="mt-6 text-center max-w-md px-4">
            <div className="font-mono text-xs uppercase tracking-widest text-brand-primary font-bold mb-1 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesizing Local Intel</span>
            </div>
            <p className="font-sans text-xs sm:text-sm text-naviigo-brown/70 transition-all duration-300 min-h-[40px]">
              {WAITING_MESSAGES[msgIndex]}
            </p>
          </div>
        </div>

        {/* ── SKELETON CONTENT CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 h-44 rounded-2xl bg-paper-light border border-[#EADFD4] p-6 animate-pulse space-y-3">
            <div className="h-4 w-48 bg-[#EADFD4]/70 rounded-full" />
            <div className="h-3 w-full bg-[#EADFD4]/50 rounded-full" />
            <div className="h-3 w-4/5 bg-[#EADFD4]/50 rounded-full" />
          </div>
          <div className="h-64 rounded-2xl bg-paper-light border border-[#EADFD4] p-6 animate-pulse space-y-4">
            <div className="h-5 w-36 bg-[#EADFD4]/70 rounded-full" />
            <div className="h-3 w-full bg-[#EADFD4]/50 rounded-full" />
            <div className="h-3 w-5/6 bg-[#EADFD4]/50 rounded-full" />
          </div>
          <div className="h-64 rounded-2xl bg-paper-light border border-[#EADFD4] p-6 animate-pulse space-y-4">
            <div className="h-5 w-36 bg-[#EADFD4]/70 rounded-full" />
            <div className="h-3 w-full bg-[#EADFD4]/50 rounded-full" />
            <div className="h-3 w-5/6 bg-[#EADFD4]/50 rounded-full" />
          </div>
        </div>

      </div>
    </div>
  );
}
