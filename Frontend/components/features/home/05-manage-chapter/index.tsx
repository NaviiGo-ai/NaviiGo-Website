'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Calendar, Check, Clock, CreditCard, Luggage, Plane, ShieldCheck, Users } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function ManageChapter() {
  const containerRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      gsap.fromTo(
        cardsRef.current?.children || [],
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.14,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="manage"
      className="relative w-full bg-paper-warm text-naviigo-text py-24 md:py-36 px-6 md:px-12 border-b border-naviigo-brown/10"
    >
      <div className="max-w-7xl mx-auto">
        {/* ── Section Header (Asymmetric 40/60 Split) ──────────── */}
        <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-naviigo-text/50 mb-4">
          <span className="text-naviigo-orange font-bold">05</span>
          <span className="w-8 h-[1px] bg-naviigo-brown/20" />
          <span>CHAPTER / MANAGE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-16 md:mb-20">
          <div className="md:col-span-8">
            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tightest uppercase text-naviigo-brown">
              KNOW WHAT
              <span className="block text-naviigo-orange ml-[2%] sm:ml-[6%]">
                COMES NEXT.
              </span>
            </h2>
          </div>
          <div className="md:col-span-4">
            <p className="font-sans text-sm md:text-base text-naviigo-text/75 leading-relaxed">
              Active schedules, confirmed transport, shared expenses, and sanctuary check-ins in one calm, glanceable companion.
            </p>
          </div>
        </div>

        {/* ── Live Context Travel Bar (Naviigo Teal Accent) ──────── */}
        <div className="w-full bg-paper-light border border-naviigo-teal/20 rounded-2xl p-4 sm:p-5 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-naviigo-teal text-white flex items-center justify-center shrink-0">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-naviigo-teal font-semibold">
                <span>SPECIMEN TELEMETRY</span>
                <span>•</span>
                <span>EN ROUTE TRANSIT CORRIDOR</span>
              </div>
              <div className="text-sm sm:text-base font-display font-bold text-naviigo-brown">
                Corridor Telemetry Preview • Real-Time Gate, Transit & Acclimation Sync
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-naviigo-text/60">
            <span>LIVE DISPATCH FEED</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* ── Glanceable Product Fragments (3 Cohesive Cards) ──── */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {/* Fragment 1: Schedule & Next Action */}
          <div className="bg-paper-light border border-naviigo-brown/10 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-naviigo-brown/10 font-mono text-[10px] text-naviigo-text/50 uppercase tracking-wider">
                <span>01 / CONTEXTUAL WAYPOINTS</span>
                <Clock className="w-3.5 h-3.5 text-naviigo-orange" />
              </div>
              <h3 className="font-display font-bold text-xl text-naviigo-brown mt-3">
                Altitude Acclimatization Brief
              </h3>
              <p className="font-sans text-xs text-naviigo-text/70 mt-1 leading-relaxed">
                Expedition schedules adapt automatically to daylight, mountain road buffers, and local guide rendezvous.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-naviigo-brown/5 flex items-center justify-between text-xs font-mono text-naviigo-text/60">
              <span>SYSTEM ADAPTIVE PACE</span>
              <span className="text-naviigo-orange font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> AUTOMATED
              </span>
            </div>
          </div>

          {/* Fragment 2: Stay & Sanctuary Access */}
          <div className="bg-paper-light border border-naviigo-brown/10 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-naviigo-brown/10 font-mono text-[10px] text-naviigo-text/50 uppercase tracking-wider">
                <span>02 / SANCTUARY ACCESS</span>
                <Calendar className="w-3.5 h-3.5 text-naviigo-teal" />
              </div>
              <h3 className="font-display font-bold text-xl text-naviigo-brown mt-3">
                Offline Document Wallet
              </h3>
              <p className="font-sans text-xs text-naviigo-text/70 mt-1 leading-relaxed">
                Every verified booking, heritage estate key, and transport voucher cached locally for remote mountain zones.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-naviigo-brown/5 flex items-center justify-between text-xs font-mono text-naviigo-text/60">
              <span className="flex items-center gap-1">
                <Luggage className="w-3.5 h-3.5" /> OFFLINE ACCESS
              </span>
              <span className="text-naviigo-teal font-semibold">VERIFIED</span>
            </div>
          </div>

          {/* Fragment 3: Expense & Group Split */}
          <div className="bg-paper-light border border-naviigo-brown/10 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-naviigo-brown/10 font-mono text-[10px] text-naviigo-text/50 uppercase tracking-wider">
                <span>03 / SHARED EXPENSES</span>
                <Users className="w-3.5 h-3.5 text-naviigo-yellow" />
              </div>
              <h3 className="font-display font-bold text-xl text-naviigo-brown mt-3">
                Transparent Group Ledgers
              </h3>
              <p className="font-sans text-xs text-naviigo-text/70 mt-1 leading-relaxed">
                4x4 transport, permits, fuel, and shared meals reconciled continuously with zero post-trip spreadsheet friction.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-naviigo-brown/5 flex items-center justify-between text-xs font-mono text-naviigo-text/60">
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" /> MULTI-CURRENCY
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> REALTIME
              </span>
            </div>
          </div>
        </div>

        {/* Action Link to Bookings & Itinerary */}
        <div className="mt-12 flex justify-end">
          <Link
            href="/bookings"
            className="group inline-flex items-center gap-2 text-xs md:text-sm font-semibold uppercase tracking-widest text-naviigo-orange hover:text-naviigo-brown transition-colors"
          >
            <span>Open Trip Manager & Bookings</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
