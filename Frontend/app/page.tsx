'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Sparkles,
  Navigation,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  BookOpen,
  Search,
  Plane,
  Train,
  Building2,
  Car,
  Bot,
  CheckCircle2,
  Clock,
  Sun,
  Users,
  Utensils,
  Mountain,
  Waves,
  Landmark,
  ExternalLink,
  Milestone
} from 'lucide-react';
import { useAI } from '@/context/AIContext';

// Fade in animation helper
const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' }
  })
};

export default function Home() {
  const { openAI } = useAI();
  const [selectedVibe, setSelectedVibe] = useState('Spiritual');

  const travelVibes = [
    { name: 'Spiritual', icon: Sparkles, detail: 'Ghats, Aarti & Sacred Temples' },
    { name: 'Adventure', icon: Mountain, detail: 'High-Altitude Trails & Valleys' },
    { name: 'Heritage', icon: Landmark, detail: 'Palaces, Forts & History' },
    { name: 'Coastal', icon: Waves, detail: 'Backwaters, Palms & Beaches' }
  ];

  return (
    <main className="relative min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

      {/* —————————————————————————————————————————————————────────────────
          SECTION 01 — HERO
         ————————————————————————————————————————————————───────────────── */}
      <section className="relative min-h-screen min-h-dvh flex items-center justify-center border-b border-border overflow-hidden">
        {/* Mobile Background Wash — self-contained gradient, no image asset required */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-500 sm:hidden"
          style={{
            background:
              'radial-gradient(900px 520px at 78% 12%, rgba(255,153,51,0.22), transparent 62%), radial-gradient(720px 460px at 12% 86%, rgba(75,0,130,0.20), transparent 62%)',
          }}
        />

        {/* Desktop / Tablet Background Wash */}
        <div
          className="hidden sm:block absolute inset-0 pointer-events-none transition-all duration-500 dark:opacity-70"
          style={{
            background:
              'radial-gradient(1200px 620px at 72% 18%, rgba(255,153,51,0.20), transparent 62%), radial-gradient(980px 540px at 18% 82%, rgba(75,0,130,0.18), transparent 62%), radial-gradient(760px 420px at 92% 88%, rgba(46,139,87,0.14), transparent 62%)',
          }}
        />
        {/* Ultra-Light Vignette Mask for Maximum Android Background Visibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-warm-ivory/35 via-warm-ivory/15 to-transparent sm:from-warm-ivory/75 sm:via-warm-ivory/45 dark:from-warm-ivory/45 dark:via-warm-ivory/20 pointer-events-none" />

        {/* Dotted Flight Paths & Animated Plane Icons (Mobile Only — Hidden on Desktop View) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5] sm:hidden">
          <svg className="w-full h-full opacity-55 dark:opacity-35" viewBox="0 0 1200 800" fill="none">
            {/* Dotted Flight Path 1 */}
            <path d="M-50 420 C 250 180, 550 520, 1250 220" stroke="currentColor" strokeWidth="2.5" strokeDasharray="8 8" className="text-saffron/75" />
            {/* Dotted Flight Path 2 */}
            <path d="M80 720 C 380 380, 780 620, 1150 120" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" className="text-indigo/65" />
          </svg>
          {/* Floating Plane Icon 1 */}
          <div className="absolute top-[22%] right-[12%] text-saffron animate-pulse transform rotate-45">
            <Plane className="w-6 h-6 drop-shadow-md" />
          </div>
          {/* Floating Plane Icon 2 */}
          <div className="absolute bottom-[28%] left-[6%] text-indigo transform -rotate-12">
            <Plane className="w-5 h-5 drop-shadow-sm" />
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-20 sm:pt-24 lg:pt-28 pb-12 sm:pb-12 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10">
            
            {/* Hero Left Column — Messaging */}
            <div className="lg:col-span-7">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight text-foreground font-serif leading-[1.02]">
                Your Journey.{' '}
                <span className="text-saffron block sm:inline">Intelligently Navigated.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-7 sm:mt-10 max-w-xl text-lg sm:text-xl leading-relaxed text-muted-foreground font-sans font-semibold">
                Plan complete trips in 60 seconds with AI, compare 500+ travel deals, and navigate India like a local.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-7 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-4">
                <Link href="/itinerary?new=true" className="inline-flex items-center justify-center gap-3.5 rounded-2xl bg-saffron px-7 sm:px-8 py-3.5 text-lg sm:text-xl font-extrabold text-white shadow-md transition-all hover:scale-[1.02] hover:bg-saffron/90">
                  <Navigation className="w-5.5 h-5.5" />
                  <span>Plan My Journey</span>
                </Link>

                <Link href="/explore" className="inline-flex items-center justify-center gap-3 rounded-2xl bg-warm-ivory/90 border border-border px-7 py-3.5 text-lg sm:text-xl font-extrabold text-saffron hover:bg-saffron/20 transition-all shadow-xs backdrop-blur-xs">
                  <Compass className="w-5.5 h-5.5 text-saffron" />
                  <span>Explore India</span>
                </Link>
              </motion.div>

              {/* Ecosystem Quick Indicators — 2 Above, 1 Below on Desktop */}
              <div className="mt-8 sm:mt-7 flex flex-col gap-4 sm:gap-3.5 pt-6 border-t border-border/60">
                {/* Top Row: 2 items side-by-side on desktop */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-8">
                  <div className="flex items-center gap-3 text-base sm:text-lg font-extrabold text-saffron tracking-wide">
                    <div className="w-7 h-7 rounded-full bg-saffron/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4.5 h-4.5 text-saffron" />
                    </div>
                    <span>60s AI Itineraries</span>
                  </div>
                  <div className="flex items-center gap-3 text-base sm:text-lg font-extrabold text-saffron tracking-wide">
                    <div className="w-7 h-7 rounded-full bg-saffron/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4.5 h-4.5 text-saffron" />
                    </div>
                    <span>500+ OTA Comparison</span>
                  </div>
                </div>

                {/* Bottom Row: 1 item below on desktop */}
                <div className="flex items-center gap-3 text-base sm:text-lg font-extrabold text-saffron tracking-wide">
                  <div className="w-7 h-7 rounded-full bg-saffron/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4.5 h-4.5 text-saffron" />
                  </div>
                  <span>Digital Pilgrim Passport</span>
                </div>
              </div>
            </div>

            {/* Hero Right Column — Layered Product Interface Mockup (Desktop/Tablet Only) */}
            <div className="lg:col-span-5 relative hidden sm:block -mt-4 sm:-mt-8 lg:-mt-12 w-full max-w-md mx-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative mx-auto max-w-md">
                
                {/* Main Product Card Preview */}
                <div className="rounded-[32px] border-2 border-saffron/25 bg-card backdrop-blur-xl p-5 sm:p-7 pb-8 sm:pb-9 shadow-2xl shadow-saffron/10 flex flex-col justify-between gap-4 sm:gap-5 hover:border-saffron/40 transition-all duration-300 relative z-10">
                  
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-saffron text-white flex items-center justify-center font-bold shadow-md shrink-0">
                        <MapPin className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-saffron font-mono">NEXT TRIP PREVIEW</div>
                        <div className="text-lg sm:text-2xl font-extrabold text-card-foreground font-serif leading-snug">Varanasi Heritage Circuit</div>
                      </div>
                    </div>
                    <span className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-extrabold border border-secondary/30 shadow-xs shrink-0 dark:bg-white dark:text-slate-950 dark:border-white/90">3 Days</span>
                  </div>

                  {/* Middle Item Box */}
                  <div className="p-3.5 sm:p-4.5 rounded-2xl bg-muted/40 border border-border/80 space-y-1.5 text-card-foreground shadow-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-foreground text-xs sm:text-base font-bold">Day 01 • Evening Aarti</span>
                      <span className="text-saffron text-[11px] sm:text-sm font-mono font-bold">18:00 IST</span>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed font-medium">Dashashwamedh Ghat Ganga Aarti ceremony with reserved boat viewing.</p>
                  </div>

                  {/* Passport Stamp Badge Preview */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-card-foreground">
                      <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-saffron shrink-0" />
                      <span>Kashi Vishwanath Stamp</span>
                    </div>
                    <span className="text-xs sm:text-sm font-mono font-bold text-saffron bg-saffron/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-saffron/20">+150 XP</span>
                  </div>
                </div>

                {/* Floating AI Bubble Pill */}
                <div className="absolute -bottom-5 -left-2 sm:-left-4 rounded-2xl border-2 border-saffron/30 bg-saffron text-white p-3 sm:p-4 shadow-2xl shadow-saffron/30 flex items-center gap-3 backdrop-blur-md z-20 max-w-[calc(100%-16px)]">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold tracking-wide text-white">Ask NaviiGo AI</div>
                    <div className="text-white/90 text-[11px] sm:text-xs font-medium truncate">&quot;Best time for Morning Boat Ride?&quot;</div>
                  </div>
                </div>

              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 02 — THE PROBLEM (FRAGMENTED vs UNIFIED)
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-card border-b border-border">
        <div className="max-w-6xl mx-auto text-center">
          <motion.span initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">
            THE FRAGMENTATION PROBLEM
          </motion.span>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif max-w-3xl mx-auto">
            Travel shouldn&apos;t feel like a research project.
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2} className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            One trip currently means dozens of browser tabs, scattered train apps, unverified dhabas, and conflicting advice.
          </motion.p>

          {/* Problem vs Solution Visual Flow */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch text-left">
            {/* The Old Fragmented Way */}
            <div className="rounded-3xl border border-destructive/20 bg-background/50 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-destructive font-mono">OLD FRAGMENTED WAY</span>
                <span className="text-xs text-muted-foreground">10+ Tabs Open</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">Google Search</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">Instagram Reels</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">Maps App</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">IRCTC Train App</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">Hotel Booking</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">Cab App</span>
                <span className="px-3 py-1.5 rounded-lg bg-muted border border-border">Notes App</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border/40 leading-relaxed">
                Result: Confusion, missed Aarti timings, price inflation, and zero travel memories saved.
              </p>
            </div>

            {/* The NaviiGo Unified Way */}
            <div className="rounded-3xl border border-saffron/40 bg-saffron/5 p-6 sm:p-8 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-saffron font-mono">THE NAVIIGO UNIFIED WAY</span>
                <span className="text-xs font-bold text-saffron">1 Intelligent Platform</span>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-card-foreground font-serif">
                  <Sparkles className="w-4 h-4 text-saffron" />
                  <span>Discover → Plan → Book → Navigate → Remember</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your entire journey unified into one intelligent dashboard with AI timing accuracy and digital passport stamps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 03 — THE NAVIIGO PROMISE (FIVE INTELLIGENT LAYERS)
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">THE NAVIIGO PROMISE</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif">
              One journey. Five intelligent layers.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6">
            {[
              { num: '01', title: 'DISCOVER', desc: 'Find places worth going with verified local intelligence.', link: '/explore' },
              { num: '02', title: 'PLAN', desc: 'Build 60s day-by-day itineraries tailored to your vibe.', link: '/itinerary?new=true' },
              { num: '03', title: 'BOOK', desc: 'Compare flights, IRCTC trains, cabs & stays across 500+ OTAs.', link: '/bookings' },
              { num: '04', title: 'NAVIGATE', desc: 'Contextual AI assistance when weather or timings change.', link: '/support' },
              { num: '05', title: 'REMEMBER', desc: 'Collect digital stamps and XP badges in your Passport.', link: '/passport' },
            ].map((layer, idx) => (
              <Link href={layer.link} key={layer.num} className="group">
                <div className="h-full rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-saffron/50 transition-all duration-300 shadow-xs">
                  <div>
                    <span className="text-xs font-mono font-bold text-saffron block mb-3">{layer.num}</span>
                    <h3 className="text-lg font-bold text-card-foreground font-serif mb-2 group-hover:text-saffron transition-colors">{layer.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-saffron font-bold mt-6">
                    Learn More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 04 — AI ITINERARY EXPERIENCE
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">AI TRAVEL ORCHESTRATION</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-saffron font-serif leading-tight">
                Tell us where you want to go.{' '}
                <span className="text-saffron">We&apos;ll figure out the journey.</span>
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                Select your travel style and let our cultural AI engine build an optimized itinerary complete with temple Aarti timings, local food spots, and weather windows.
              </p>

              {/* Vibe Selectors */}
              <div className="mt-8 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Select Travel Vibe:</div>
                {travelVibes.map((vibe) => {
                  const VIcon = vibe.icon;
                  const isSel = selectedVibe === vibe.name;
                  return (
                    <button
                      key={vibe.name}
                      onClick={() => setSelectedVibe(vibe.name)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSel
                          ? 'border-saffron bg-saffron/10 text-saffron font-bold shadow-xs'
                          : 'border-border bg-card text-card-foreground hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <VIcon className="w-4 h-4" />
                        <span className="text-sm">{vibe.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-normal">{vibe.detail}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <Link href="/itinerary?new=true" className="inline-flex items-center gap-3 rounded-2xl bg-saffron px-8 py-4 text-base font-bold text-white shadow-md hover:bg-saffron/90 transition-all">
                  <span>Build My Itinerary</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Generated Result Preview */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <span className="text-xs font-mono font-bold text-saffron uppercase">GENERATED ITINERARY</span>
                    <h3 className="text-2xl font-bold text-card-foreground font-serif">{selectedVibe} Exploration Circuit</h3>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-saffron/10 text-saffron text-xs font-bold border border-saffron/20">
                    60s AI Generation
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-saffron">
                      <span>DAY 01 • ARRIVAL & HERITAGE WALK</span>
                      <span>09:00 AM</span>
                    </div>
                    <p className="text-sm font-semibold text-card-foreground">Morning Ghat Walk &amp; Traditional Kachori Breakfast</p>
                    <p className="text-xs text-muted-foreground">Explore 300-year-old narrow heritage lanes guided by local cultural notes.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-saffron">
                      <span>DAY 02 • SACRED CEREMONIES</span>
                      <span>05:30 PM</span>
                    </div>
                    <p className="text-sm font-semibold text-card-foreground">Dashashwamedh Ghat Evening Aarti</p>
                    <p className="text-xs text-muted-foreground">Reserved riverboat position for optimal ceremonial viewing and photo lighting.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 05 — INDIA THROUGH NAVIIGO (EDITORIAL REGIONS)
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">CULTURAL DIVERSITY</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif max-w-3xl mx-auto">
              India changes with every journey.{' '}
              <span className="text-saffron">NaviiGo understands the difference.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[
              { title: 'Spiritual India', desc: 'Varanasi, Haridwar, Rishikesh', tag: 'Aarti & Ghats', link: '/explore/Varanasi' },
              { title: 'Himalayan India', desc: 'Manali, Himachal, Ladakh', tag: 'Peak Trails', link: '/explore/Himalayas' },
              { title: 'Heritage India', desc: 'Jaipur, Rajasthan, Amber', tag: 'Forts & Palaces', link: '/explore/Rajasthan' },
              { title: 'Coastal India', desc: 'Kerala, Backwaters, Varkala', tag: 'Palms & Waters', link: '/explore/Kerala' },
              { title: 'Northeast India', desc: 'Meghalaya, Sikkim, Tawang', tag: 'Living Roots', link: '/explore' },
            ].map((region, i) => (
              <Link href={region.link} key={region.title} className="group">
                <div className="h-56 rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-saffron/50 transition-all duration-300 shadow-xs">
                  <span className="text-xs font-bold text-saffron uppercase tracking-wider">{region.tag}</span>
                  <div>
                    <h3 className="text-xl font-bold text-card-foreground font-serif mb-1 group-hover:translate-x-1 transition-transform">{region.title}</h3>
                    <p className="text-xs text-muted-foreground">{region.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 06 — DEEP DESTINATION INTELLIGENCE
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">DESTINATION INTELLIGENCE</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif">
                Don&apos;t just know where to go.{' '}
                <span className="text-saffron block sm:inline">Know what it feels like to be there.</span>
              </h2>
            </div>
            <Link href="/explore" className="px-7 py-3 rounded-full bg-saffron text-white font-bold text-sm hover:bg-saffron/90 transition-all shrink-0">
              Explore All Destinations &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'RISHIKESH',
                vibe: 'Adventure • Spirituality • Nature',
                window: 'October — March',
                highlight: 'Triveni Ghat Evening Aarti',
                tip: 'Start early at 06:00 AM for quiet riverbank trails.'
              },
              {
                name: 'VARANASI',
                vibe: 'Heritage • Culture • Ghats',
                window: 'November — February',
                highlight: 'Kashi Vishwanath Corridor',
                tip: 'Book wooden boat rides at sunrise for morning prayers.'
              },
              {
                name: 'JAIPUR',
                vibe: 'Royal Forts • Food • Architecture',
                window: 'October — March',
                highlight: 'Amber Fort Elephant Ramparts',
                tip: 'Visit Hawa Mahal during morning light for best photos.'
              }
            ].map((card) => (
              <div key={card.name} className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-4 shadow-xs hover:border-saffron/50 transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-card-foreground font-serif">{card.name}</h3>
                  <span className="text-xs font-bold text-saffron bg-saffron/10 px-3 py-1 rounded-full">{card.window}</span>
                </div>
                <div className="text-xs text-muted-foreground font-semibold">{card.vibe}</div>
                <div className="pt-3 border-t border-border/50 space-y-2 text-xs">
                  <div><strong className="text-card-foreground">Must Experience:</strong> {card.highlight}</div>
                  <div><strong className="text-card-foreground">Local Insight:</strong> {card.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 07 — UNIVERSAL BOOKING ENGINE
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">UNIVERSAL BOOKING ENGINE</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif">
              From &quot;Let&apos;s go&quot; to &quot;Booked.&quot;
            </h2>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">
              Compare flights, IRCTC train options, intercity cabs and hotels across 500+ OTA platforms in one search window.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Plane, label: 'Flights', desc: 'Direct & Layover Price Match' },
              { icon: Train, label: 'IRCTC Trains', desc: 'Tatkal & Route Availability' },
              { icon: Building2, label: 'Hotels & Stays', desc: 'Heritage Havellis & Resorts' },
              { icon: Car, label: 'Intercity Cabs', desc: 'Verified Drivers & Flat Rates' }
            ].map((item) => {
              const BIcon = item.icon;
              return (
                <div key={item.label} className="rounded-3xl border border-border bg-card p-6 space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center mx-auto">
                    <BIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground font-serif">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link href="/bookings" className="inline-flex items-center gap-3 px-9 py-4 rounded-2xl bg-saffron text-white font-bold text-base hover:bg-saffron/90 transition-all shadow-md">
              <span>Find My Way There</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 08 — DIGITAL PILGRIM / TRAVEL PASSPORT
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">GAMIFIED EXPLORATION</span>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif leading-tight">
                Your journeys deserve a passport of their own.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                Collect digital stamps when visiting temples, national parks and mountain passes. Earn XP, climb leaderboards and unlock exclusive rewards.
              </p>

              {/* Progression Levels */}
              <div className="mt-8 space-y-3">
                {['Explorer', 'Trail Seeker', 'Journey Maker', 'Master Navigator'].map((lvl, idx) => (
                  <div key={lvl} className="flex items-center gap-3 text-xs sm:text-sm font-bold text-card-foreground">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${idx === 0 ? 'bg-saffron text-white' : 'bg-muted text-muted-foreground'}`}>
                      {idx + 1}
                    </div>
                    <span>{lvl}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/passport" className="inline-flex items-center gap-3 rounded-2xl bg-saffron px-8 py-4 text-base font-bold text-white shadow-md hover:bg-saffron/90 transition-all">
                  <span>Start My Passport</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Digital Passport UI Card */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <div className="text-xs font-mono font-bold text-saffron">NAVIIGO DIGITAL PASSPORT</div>
                    <div className="text-xl font-extrabold text-card-foreground font-serif">Explorer ID #8492</div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-full bg-saffron/10 text-saffron text-xs font-bold">
                    Level 07 • 2,480 XP
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { stamp: '🛕 Varanasi', place: 'Kashi Vishwanath' },
                    { stamp: '🏔️ Manali', place: 'Solang Pass' },
                    { stamp: '🌊 Kerala', place: 'Alleppey Backwaters' },
                    { stamp: '🏛️ Jaipur', place: 'Amber Fort' }
                  ].map((s) => (
                    <div key={s.stamp} className="p-3 rounded-2xl bg-background border border-border space-y-1">
                      <div className="text-base font-bold text-card-foreground">{s.stamp}</div>
                      <div className="text-[10px] text-muted-foreground">{s.place}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 09 — FLOATING AI COMPANION
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-background">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">CONTEXTUAL AI ASSISTANCE</span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif max-w-3xl mx-auto">
            And when plans change, NaviiGo changes with you.
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                q: '"My train is delayed by 2 hours."',
                ans: 'Your arrival is now 2 hours later. I have adjusted your evening Aarti timing accordingly.'
              },
              {
                q: '"It started raining in Manali."',
                ans: 'Skipping outdoor trekking trails. Here is a nearby heritage café & indoor museum route.'
              },
              {
                q: '"Where can I get authentic food nearby?"',
                ans: 'Found 3 verified local dhabas within 800m serving fresh local thalis.'
              }
            ].map((scen, idx) => (
              <div key={idx} className="rounded-3xl border border-border bg-card p-6 space-y-4 shadow-xs">
                <div className="text-sm font-bold text-saffron font-mono">{scen.q}</div>
                <div className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/50">
                  <strong className="text-card-foreground block mb-1">NaviiGo AI Response:</strong>
                  {scen.ans}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <button onClick={openAI} className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-saffron text-white font-bold text-base hover:bg-saffron/90 transition-all shadow-md">
              <Bot className="w-5 h-5" />
              <span>Ask NaviiGo</span>
            </button>
          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 11 — TRUST & PRODUCT PRINCIPLES
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-saffron mb-3 block">OUR PRINCIPLES</span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground font-serif">
              Built for the way India travels.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Cultural Intelligence', desc: 'Understands temple darshan schedules, regional festivals & local etiquette.' },
              { title: 'Transparent Planning', desc: 'No hidden booking markups or artificial price inflation.' },
              { title: 'Smarter Discovery', desc: 'Highlighting authentic local experiences alongside major landmarks.' },
              { title: 'Human-Centered AI', desc: 'Assists your journey without taking away the joy of real exploration.' }
            ].map((prin) => (
              <div key={prin.title} className="rounded-3xl border border-border bg-card p-6 space-y-3 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-saffron/10 text-saffron flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-card-foreground font-serif">{prin.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{prin.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* —————————————————————————————————————————————————————————————————
          SECTION 12 — FINAL CTA
         ————————————————————————————————————————————————————————————————─ */}
      <section className="relative z-10 py-24 sm:py-36 px-4 sm:px-6 bg-muted/40 border-t border-border overflow-hidden text-center">
        <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground font-serif mb-6">
            Your next story is waiting.
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
            Tell NaviiGo where you&apos;re going. We&apos;ll help you figure out the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/itinerary?new=true" className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-saffron text-white font-bold text-lg hover:bg-saffron/90 transition-all hover:scale-105 shadow-md">
              Plan My Journey
            </Link>
            <Link href="/explore" className="w-full sm:w-auto px-10 py-4.5 rounded-2xl bg-card border border-border text-card-foreground font-bold text-lg hover:bg-accent transition-all">
              Explore India
            </Link>
          </div>
          <div className="mt-14 text-sm font-bold tracking-[0.3em] text-saffron uppercase font-mono">
            WE NAVIGATE, YOU GO.
          </div>
        </motion.div>
      </section>

    </main>
  );
}
