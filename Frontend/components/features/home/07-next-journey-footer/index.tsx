'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

export default function NextJourneyFooter() {
  const [destinationInput, setDestinationInput] = useState('');
  const router = useRouter();

  const handleStartTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (destinationInput.trim()) {
      router.push(`/itinerary?new=true&query=${encodeURIComponent(destinationInput.trim())}`);
    } else {
      router.push('/itinerary?new=true');
    }
  };

  return (
    <footer
      id="next-journey"
      className="relative w-full bg-paper-dark text-white pt-24 md:pt-36 pb-12 px-6 md:px-12 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col justify-between min-h-[70vh]">
        {/* ── Top Final Waypoint ───────────────────────────────── */}
        <div className="flex items-center justify-between font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-white/50 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-naviigo-orange font-bold">07</span>
            <span className="w-8 h-[1px] bg-white/30" />
            <span>FINAL SCENE / NEXT JOURNEY</span>
          </div>
          <div className="hidden sm:block text-white/40">
            CONNECTING DISCOVERY TO LIFE
          </div>
        </div>

        {/* ── Oversized Editorial Statement ────────────────────── */}
        <div className="my-12 md:my-16 max-w-5xl">
          <h2 className="font-display font-black text-4xl sm:text-6xl md:text-7xl lg:text-[6.8rem] leading-[0.92] tracking-tightest uppercase text-white flex flex-col">
            <span>FROM &lsquo;I WANT TO GO&rsquo;</span>
            <span className="ml-[4%] sm:ml-[8%] md:ml-[14%] text-naviigo-orange mt-2">
              TO &lsquo;I&apos;M ON MY WAY.&rsquo;
            </span>
          </h2>
        </div>

        {/* ── Journey Line Resolving into the Next Action ───────── */}
        <div className="w-full h-8 mb-8 overflow-visible">
          <svg viewBox="0 0 1000 32" fill="none" className="w-full h-full preserve-3d">
            <path
              d="M 0 16 C 300 32, 700 0, 1000 16"
              stroke="#EC6426"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ── Editorial Action Form (Clean, Visible Labels) ─────── */}
        <div className="w-full max-w-3xl bg-paper-charcoal/90 border border-white/15 p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-2xl mb-16">
          <form onSubmit={handleStartTrip} className="flex flex-col gap-4">
            <label
              htmlFor="next-destination-input"
              className="font-mono text-xs uppercase tracking-[0.2em] text-naviigo-yellow font-semibold"
            >
              WHERE WOULD YOU LIKE TO WAKE UP NEXT?
            </label>

            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <input
                id="next-destination-input"
                type="text"
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                placeholder="e.g. Spiti Valley, Kyoto, Kashmir, Varanasi..."
                className="flex-1 bg-white/5 border border-white/20 rounded-full px-6 py-3.5 text-white placeholder-white/40 text-sm md:text-base font-sans focus:outline-none focus:border-naviigo-orange focus:ring-1 focus:ring-naviigo-orange transition-all"
              />

              <button
                type="submit"
                data-cursor="GO"
                className="group px-7 py-3.5 rounded-full bg-naviigo-orange text-white font-sans text-xs md:text-sm font-semibold tracking-wider uppercase hover:bg-naviigo-orange/90 transition-all duration-300 flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-naviigo-orange/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>Begin Next Trip</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* Quick destination tags */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono text-white/50">
              <span className="text-white/30">QUICK DISCOVERY:</span>
              {['Ladakh', 'Kyoto', 'Kerala', 'Varanasi', 'Jaipur'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDestinationInput(item)}
                  className="px-2.5 py-1 rounded-full border border-white/10 text-white/70 hover:text-naviigo-yellow hover:border-naviigo-yellow/40 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* ── Navigation Links & Architectural Base Lockup ──────── */}
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          {/* Brand Mark and Identity */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 relative shrink-0">
              <Image
                src="/brand/naviigo-mark-knockout.png"
                alt="Naviigo"
                width={40}
                height={40}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-white tracking-tight">Naviigo</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                Connected Travel Companion
              </div>
            </div>
          </div>

          {/* Minimal Navigation Grid */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-mono uppercase tracking-wider text-white/70">
            <Link href="/explore" className="hover:text-naviigo-orange transition-colors">
              01 Discover
            </Link>
            <Link href="/itinerary" className="hover:text-naviigo-orange transition-colors">
              02 Planner
            </Link>
            <Link href="/passport" className="hover:text-naviigo-orange transition-colors">
              03 Passport
            </Link>
            <Link href="/bookings" className="hover:text-naviigo-orange transition-colors">
              04 Bookings
            </Link>
            <Link href="/about" className="hover:text-naviigo-orange transition-colors">
              05 About
            </Link>
            <Link href="/support" className="hover:text-naviigo-orange transition-colors">
              06 Support
            </Link>
          </nav>
        </div>

        {/* ── Giant Architectural Naviigo Wordmark ─────────────── */}
        <div className="mt-16 md:mt-24 select-none pointer-events-none opacity-15 overflow-hidden">
          <div className="font-display font-black text-[18vw] leading-none uppercase tracking-tighter text-white whitespace-nowrap">
            NAVIIGO
          </div>
        </div>

        {/* ── Legal & Copyright ────────────────────────────────── */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-white/40 tracking-wider">
          <div>© 2026 NAVIIGO TECHNOLOGIES. ALL RIGHTS RESERVED.</div>
          <div className="flex flex-wrap gap-6 items-center">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">
              PRIVACY POLICY
            </Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">
              TERMS OF SERVICE
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('naviigo:open-cookie-preferences'));
                }
              }}
              className="hover:text-white/70 transition-colors uppercase cursor-pointer"
            >
              COOKIE PREFERENCES
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
