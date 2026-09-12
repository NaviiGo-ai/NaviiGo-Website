"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
import { motion, AnimatePresence } from "framer-motion";

type WidgetState = "loading" | "loaded" | "failed";

// ── Skeleton pulse animation via inline style (no Tailwind plugin needed) ──────
const pulse = `@keyframes skeletonPulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.9; }
}`;

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`bg-muted-700 rounded-xl ${className ?? ""}`}
      style={{ animation: "skeletonPulse 1.4s ease-in-out infinite" }}
    />
  );
}

/** Skeleton that mimics the TravelPayouts flight search form */
function SearchWidgetSkeleton() {
  return (
    <div className="w-full bg-[#0c0c0e]/80 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      {/* Tab row */}
      <div className="flex gap-3 mb-6">
        <SkeletonBlock className="h-9 w-24 rounded-full" />
        <SkeletonBlock className="h-9 w-20 rounded-full" />
        <SkeletonBlock className="h-9 w-20 rounded-full" />
      </div>
      {/* Input row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <SkeletonBlock className="h-14 rounded-2xl col-span-1" />
        <SkeletonBlock className="h-14 rounded-2xl col-span-1" />
        <SkeletonBlock className="h-14 rounded-2xl col-span-1" />
        <SkeletonBlock className="h-14 rounded-2xl col-span-1" />
      </div>
      {/* Search button */}
      <SkeletonBlock className="h-12 w-48 rounded-2xl" />
    </div>
  );
}

/** Skeleton that mimics a row of deal/ticket cards */
function TicketsSkeleton() {
  return (
    <div className="space-y-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-full bg-[#0c0c0e]/80 border border-white/5 rounded-2xl p-5 flex items-center gap-5"
        >
          <SkeletonBlock className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-2/5 rounded-lg" />
            <SkeletonBlock className="h-3 w-1/3 rounded-lg" />
          </div>
          <div className="space-y-2 items-end flex flex-col shrink-0">
            <SkeletonBlock className="h-5 w-24 rounded-lg" />
            <SkeletonBlock className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Fallback shown when TravelPayouts widget never renders */
function WidgetFallback() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="w-full bg-[#0c0c0e]/80 border border-saffron-500/20 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl text-center">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-saffron-500/10 flex items-center justify-center text-3xl">
          ✈️
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Deals engine is warming up</h2>
        <p className="text-muted-400 text-sm mb-8 max-w-md mx-auto">
          Our metasearch partner widget is taking longer than usual to load. Try
          refreshing the page, or browse deals directly on our partner platforms
          below.
        </p>

        {/* Partner CTA links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            { name: "Skyscanner", emoji: "🔵", desc: "Flights & Hotels", href: "https://www.skyscanner.net" },
            { name: "MakeMyTrip", emoji: "🟠", desc: "India Specialist", href: "https://www.makemytrip.com" },
            { name: "Goibibo", emoji: "🟢", desc: "Trains & Stays", href: "https://www.goibibo.com" },
          ].map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-saffron-500/40 hover:bg-saffron-500/5 transition-all group"
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-white font-semibold text-sm group-hover:text-saffron-400 transition-colors">
                {p.name}
              </span>
              <span className="text-muted-500 text-xs">{p.desc}</span>
            </a>
          ))}
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2.5 rounded-xl bg-saffron-500/10 border border-saffron-500/30 text-saffron-400 text-sm font-semibold hover:bg-saffron-500/20 transition-colors"
        >
          ↺ Retry
        </button>
      </div>
    </motion.div>
  );
}

export default function MetasearchDealsPage() {
  const [widgetState, setWidgetState] = useState<WidgetState>("loading");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const searchRef = useRef<HTMLDivElement>(null);
  const ticketsRef = useRef<HTMLDivElement>(null);

  // After mount, wait 3s minimum then poll for up to 8s before declaring failed
  useEffect(() => {
    // Scroll skeleton into view so it's immediately visible
    window.scrollTo({ top: 320, behavior: 'smooth' });

    const MIN_SKELETON_MS = 3000; // always show skeleton for at least 3s
    const CHECK_INTERVAL  = 500;
    const TIMEOUT         = 8000; // give up after 8s total
    let elapsed = 0;
    let minElapsed = false;

    // After 3s, allow the poll to resolve
    const minTimer = setTimeout(() => { minElapsed = true; }, MIN_SKELETON_MS);

    const timer = setInterval(() => {
      elapsed += CHECK_INTERVAL;
      const searchHasContent  = (searchRef.current?.childElementCount  ?? 0) > 0;
      const ticketsHasContent = (ticketsRef.current?.childElementCount ?? 0) > 0;

      if (minElapsed && (searchHasContent || ticketsHasContent)) {
        setWidgetState("loaded");
        clearInterval(timer);
      } else if (elapsed >= TIMEOUT) {
        setWidgetState("failed");
        clearInterval(timer);
      }
    }, CHECK_INTERVAL);

    return () => { clearInterval(timer); clearTimeout(minTimer); };
  }, []);

  return (
    <>
      <style>{pulse}</style>
      <div className="min-h-screen bg-background text-foreground pt-20 sm:pt-28 pb-12 relative overflow-hidden font-sans">
        {/* Background Ornaments */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
              Global MetaSearch Partner
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-6 uppercase tracking-tight leading-[1.1] font-serif">
              Global Travel
              <br />
              <span className="text-primary">
                Deals &amp; Aggregator
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Compare prices across 500+ airlines and top hotels. Engineered by TravelPayouts &amp; NaviiGo.
            </p>

            {/* Loading indicator pill */}
            <AnimatePresence>
              {widgetState === "loading" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="inline-flex items-center gap-2 mt-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-400 text-xs"
                >
                  <span
                    className="w-2 h-2 rounded-full bg-saffron-400"
                    style={{ animation: "skeletonPulse 1s ease-in-out infinite" }}
                  />
                  Loading deals engine…
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Widget area ─────────────────────────────────────────────── */}
          {mounted && (
            <div className="space-y-12">

              {/* Search widget zone */}
              <AnimatePresence mode="wait">
                {widgetState === "loading" && (
                  <motion.div key="search-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SearchWidgetSkeleton />
                  </motion.div>
                )}
                {widgetState === "failed" && (
                  <motion.div key="fallback" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <WidgetFallback />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Real widget containers — always in DOM so scripts can populate them */}
              <div
                className={widgetState === "loaded" ? "w-full bg-[#0c0c0e]/80 border border-white/5 rounded-3xl p-4 md:p-8 backdrop-blur-xl shadow-2xl" : "hidden"}
              >
                <div id="tpwl-search" ref={searchRef} />
              </div>

              {/* Tickets widget zone */}
              <AnimatePresence mode="wait">
                {widgetState === "loading" && (
                  <motion.div key="tickets-skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <TicketsSkeleton />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className={widgetState === "loaded" ? "w-full" : "hidden"}>
                <div id="tpwl-tickets" ref={ticketsRef} />
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
}
