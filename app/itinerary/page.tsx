'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ItineraryPage() {
  const [step, setStep] = useState(1);
  return (
    <div className="min-h-screen relative bg-zinc-50 dark:bg-black pt-32 pb-24 px-6 md:px-12 flex items-center justify-center overflow-hidden">
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 md:p-12 relative z-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Travel <span className="italic text-emerald-500">Planner</span></h1>
          <p className="text-zinc-500 dark:text-zinc-400">Tell us your spiritual calling, and we'll map the path.</p>
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Destination (City or Temple)</label>
              <input type="text" placeholder="e.g. Varanasi, Rameswaram, Rishikesh..." className="w-full bg-zinc-100 dark:bg-black border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration (Days)</label>
              <input type="number" placeholder="e.g. 3" className="w-full bg-zinc-100 dark:bg-black border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-emerald-600 text-white font-semibold rounded-xl py-4 hover:bg-emerald-500 transition-colors mt-4">
              Next Step
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 text-center">
            <div className="w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold">Summoning the AI Oracles...</h2>
            <p className="text-zinc-500">Curating the perfect darshan timings, hidden gems, and optimal routes for you.</p>
            <button onClick={() => setStep(1)} className="text-zinc-400 mt-4 underline text-sm">Cancel</button>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
