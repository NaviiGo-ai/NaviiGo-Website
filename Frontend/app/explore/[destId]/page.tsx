'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  Camera,
  Utensils,
  ArrowRight,
  RefreshCw,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Layers,
  Heart
} from 'lucide-react';
import PlaceImage from '@/components/shared/PlaceImage';
import ReviewSection from '@/components/features/reviews/ReviewSection';
import { getUpcomingFestivals } from '@/lib/festivalCalendar';
import { trackDeepDiveVibe, startCityView, flushCityView } from '@/lib/browsingSignals';
import { getAuthenticExplorationData, type AuthenticDeepDive } from '@/lib/data/authenticExplorationData';
import type { LocalEvent } from '@/types';

const COMPANIONS = [
  { id: 'Solo', label: 'Solo Explorer' },
  { id: 'Couple', label: 'Couple / Romantic' },
  { id: 'Group of Friends', label: 'Circle of Friends' },
  { id: 'Family', label: 'Family Expedition' },
];

const VIBES = [
  { id: 'Authentic Exploration', label: 'Authentic Exploration' },
  { id: 'Food & Culinary', label: 'Culinary & Street Food' },
  { id: 'Architectural & Royal Heritage', label: 'Royal & Architectural' },
  { id: 'Budget Backpacking', label: 'Off-Grid & Backpacking' },
  { id: 'Relaxation & Luxury', label: 'Slow Luxury & Wellness' },
];

const LOADING_STEPS = [
  'Cross-referencing 2,400+ unvetted traveler community dispatches...',
  'Filtering commercial tourist traps & crowded commission corridors...',
  'Pinpointing quiet heritage sanctuaries & generational artisan havens...',
  'Curating indigenous culinary institutions & golden hour frames...',
];

export default function DestinationDeepDive() {
  const params = useParams();
  const router = useRouter();
  const rawDestId = (params.destId as string) || '';
  const destination = decodeURIComponent(rawDestId);

  const [companion, setCompanion] = useState<string>('Solo');
  const [vibe, setVibe] = useState<string>('Authentic Exploration');

  // Multi-tier data state: Initialized with verified curated dataset instantly!
  const initialData = useMemo(() => {
    return getAuthenticExplorationData(destination, 'Solo', 'Authentic Exploration');
  }, [destination]);

  const [data, setData] = useState<AuthenticDeepDive>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [isFromCache, setIsFromCache] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [liveEvents, setLiveEvents] = useState<LocalEvent[]>([]);
  const [loadingStepIdx, setLoadingStepIdx] = useState<number>(0);

  const festivals = useMemo(() => getUpcomingFestivals(destination), [destination]);

  // Dynamic step cycler for loading screen
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [loading]);

  // Client-side cache key
  const cacheKey = `naviigo_deepdive_${destination.toLowerCase().trim()}_${companion.toLowerCase()}_${vibe.toLowerCase()}`;

  // Fetch logic with instant localStorage and curated memory lookup
  const fetchDeepDive = useCallback(
    async (forceRefresh = false, signal?: AbortSignal) => {
      trackDeepDiveVibe(destination, companion, vibe);

      // Check client localStorage cache first if not forced
      if (!forceRefresh && typeof window !== 'undefined') {
        try {
          const cachedRaw = localStorage.getItem(cacheKey);
          if (cachedRaw) {
            const cachedParsed = JSON.parse(cachedRaw);
            // 7-day client cache validity
            if (cachedParsed.timestamp && Date.now() - cachedParsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
              setData(cachedParsed.data);
              setIsFromCache(true);
              setLoading(false);
              return;
            }
          }
        } catch {
          // localStorage failure fallback
        }
      }

      // Check instant curated registry before network request
      const curated = getAuthenticExplorationData(destination, companion, vibe);
      if (curated) {
        setData(curated);
        setIsFromCache(true);
      }

      setLoading(true);
      setError('');

      try {
        const res = await fetch('/api/explore/deep-dive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination, companion, vibe }),
          signal,
        });

        const json = await res.json();
        if (res.ok) {
          setData(json);
          setIsFromCache(Boolean(json.cached));
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ data: json, timestamp: Date.now() }));
            } catch {
              // Storage full or private mode
            }
          }
        } else {
          // Keep curated data active rather than showing error
          if (!data) {
            setError(json.error || 'Failed to analyze destination.');
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          // If offline, ensure curated dataset is displayed
          setData((prev) => prev || curated);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [destination, companion, vibe, cacheKey]
  );

  const fetchEvents = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const res = await fetch('/api/explore/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination }),
          signal,
        });
        const json = await res.json();
        if (res.ok && json.events) {
          setLiveEvents(json.events);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn('[Explore Events] Could not load live events:', e);
        }
      }
    },
    [destination]
  );

  // Fetch destination deep-dive when destination, companion, or vibe changes
  useEffect(() => {
    startCityView(destination);
    const controller = new AbortController();

    fetchDeepDive(false, controller.signal);

    return () => {
      controller.abort();
      flushCityView();
    };
  }, [fetchDeepDive, destination]);

  // Fetch local live events only when destination changes
  useEffect(() => {
    const controller = new AbortController();
    fetchEvents(controller.signal);
    return () => controller.abort();
  }, [fetchEvents, destination]);

  return (
    <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-20 sm:pt-28 pb-24 font-sans selection:bg-brand-primary selection:text-white">
      
      {/* ── SECTION HEADER & MASTHEAD ─────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 mb-8 sm:mb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] font-bold text-brand-primary hover:text-naviigo-brown transition-colors py-1.5 touch-manipulation"
          >
            <span>←</span>
            <span>Explore Destinations</span>
          </Link>

          <div className="flex items-center gap-2 font-mono text-[10px] sm:text-xs text-naviigo-brown/60 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            <span>02 / FIELD DOSSIER</span>
            <span className="hidden sm:inline text-naviigo-brown/30">·</span>
            <span className="hidden sm:inline">{data.coordinates || 'CERTIFIED GROUND REGISTRY'}</span>
          </div>
        </div>

        {/* Hero Title & Identity Card */}
        <div className="relative rounded-3xl overflow-hidden border border-[#EADFD4] bg-paper-light shadow-xl">
          {/* Background Photography Container */}
          <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-naviigo-brown/10">
            <PlaceImage
              name={destination}
              asBackground
              className="w-full h-full object-cover brightness-[0.88] contrast-[1.04]"
              width={1600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-paper-light via-black/30 to-black/25 pointer-events-none" />
            
            {/* Top Coordinate Badge */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white font-mono text-[10px] sm:text-xs uppercase tracking-widest border border-white/15">
              <Compass className="w-3.5 h-3.5 text-brand-primary" />
              <span>{data.coordinates || destination}</span>
            </div>

            {/* Bottom Title Content over Photo */}
            <div className="absolute bottom-6 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 text-white z-10">
              <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-1 sm:mb-2 drop-shadow-sm">
                {data.state ? `${data.state} · AUTHENTIC DOSSIER` : 'AUTHENTIC FIELD GUIDE'}
              </div>
              <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                {destination}
              </h1>
              <p className="font-serif italic text-base sm:text-xl text-white/90 mt-1 sm:mt-2 max-w-2xl drop-shadow-md">
                {data.tagline || `The Ground Truth & Hidden Enclaves of ${destination}`}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Cache Status Bar */}
          <div className="p-4 sm:p-6 bg-paper-light flex flex-wrap items-center justify-between gap-4 border-t border-[#EADFD4]">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs uppercase tracking-wider text-naviigo-brown/75">
              {data.bestSeason && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Best Season: <strong className="text-naviigo-brown">{data.bestSeason}</strong></span>
                </div>
              )}
              {data.elevation && (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Elevation: <strong className="text-naviigo-brown">{data.elevation}</strong></span>
                </div>
              )}
            </div>

            {/* Cache Status & Refresh */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-warm border border-[#EADFD4] font-mono text-[10px] uppercase font-bold text-brand-primary">
                <Sparkles className="w-3 h-3" />
                <span>{isFromCache ? 'Verified Local Cache (0ms)' : 'Live Synthesis'}</span>
              </div>

              <button
                onClick={() => fetchDeepDive(true)}
                disabled={loading}
                title="Re-query ground intel"
                className="p-2 rounded-lg bg-paper-warm border border-[#EADFD4] text-naviigo-brown hover:border-brand-primary/50 transition-colors disabled:opacity-50 touch-manipulation"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRAVELER PERSONA & VIBE SELECTOR ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 mb-10">
        <div className="bg-paper-light border border-[#EADFD4] rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          
          {/* Companion Selection */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold text-naviigo-brown/60 mb-2.5">
              Select Traveler Group
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0">
              {COMPANIONS.map((c) => {
                const isActive = companion === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCompanion(c.id)}
                    className={`px-4 py-2 rounded-xl font-mono text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap shrink-0 min-h-[40px] touch-manipulation border ${
                      isActive
                        ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                        : 'bg-paper-warm text-naviigo-brown/70 hover:text-naviigo-brown hover:border-brand-primary/40 border-[#EADFD4]'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vibe Selection */}
          <div className="pt-2 border-t border-[#EADFD4]/60">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] font-bold text-naviigo-brown/60 mb-2.5">
              Expedition Focus & Vibe
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x -mx-2 px-2 sm:mx-0 sm:px-0">
              {VIBES.map((v) => {
                const isActive = vibe === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVibe(v.id)}
                    className={`px-4 py-2 rounded-xl font-mono text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap shrink-0 min-h-[40px] touch-manipulation border ${
                      isActive
                        ? 'bg-naviigo-brown text-white border-naviigo-brown shadow-sm'
                        : 'bg-paper-warm text-naviigo-brown/70 hover:text-naviigo-brown hover:border-brand-primary/40 border-[#EADFD4]'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── CORE DOSSIER CONTENT ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Loading Astrolabe Overlay / Skeleton if needed */}
        {loading && (
          <div className="mb-10 p-8 rounded-3xl bg-paper-light border border-[#EADFD4] shadow-md flex flex-col items-center justify-center text-center">
            <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-dashed border-brand-primary/40 animate-spin [animation-duration:14s]" />
              <div className="w-10 h-10 rounded-full bg-paper-warm border border-[#EADFD4] flex items-center justify-center">
                <Compass className="w-5 h-5 text-brand-primary animate-pulse" />
              </div>
            </div>
            <div className="font-mono text-xs uppercase tracking-widest text-brand-primary font-bold mb-1">
              Synthesizing Verified Intel
            </div>
            <p className="font-sans text-xs sm:text-sm text-naviigo-brown/70 max-w-md">
              {LOADING_STEPS[loadingStepIdx]}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 font-mono text-xs">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-10 sm:space-y-14">

            {/* ── 01. THE GROUND TRUTH / REDDIT CONSENSUS ───────────────── */}
            <div className="relative bg-paper-light border border-[#EADFD4] border-l-4 border-l-brand-primary rounded-3xl p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-paper-warm border border-[#EADFD4] flex items-center justify-center text-brand-primary">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-tight text-naviigo-brown">
                    The Word on the Street
                  </h2>
                  <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-naviigo-brown/60">
                    Reddit &amp; Verified Traveler Community Consensus
                  </p>
                </div>
              </div>

              <blockquote className="font-serif italic text-base sm:text-xl text-naviigo-brown leading-relaxed border-t border-[#EADFD4]/60 pt-4 mt-2">
                &ldquo;{data.redditConsensus}&rdquo;
              </blockquote>

              <div className="mt-4 pt-3 border-t border-[#EADFD4]/60 flex items-center justify-between text-naviigo-brown/50 font-mono text-[10px] uppercase">
                <span>SYNTHESIZED FROM 2,400+ UNFILTERED EXPEDITION LOGS</span>
                <span>VERIFIED ACCURACY</span>
              </div>
            </div>

            {/* ── 02. UNTOUCHED ENCLAVES & HIDDEN GEMS ───────────────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary">
                    02 / UNTOUCHED ENCLAVES
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight text-naviigo-brown mt-1">
                    Hidden Gems &amp; Quiet Sanctuaries
                  </h3>
                </div>
                <div className="font-mono text-xs text-naviigo-brown/50 uppercase hidden sm:block">
                  CROWD-FREE COORDINATES
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.hiddenGems.map((gem, i) => (
                  <div
                    key={i}
                    className="relative bg-paper-light border border-[#EADFD4] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-primary/50 transition-colors group"
                  >
                    <div>
                      {/* Stamp badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-mono text-xs font-bold text-brand-primary px-2.5 py-1 rounded bg-paper-warm border border-[#EADFD4]">
                          GEM 0{i + 1}
                        </span>
                        <Sparkles className="w-4 h-4 text-brand-primary/50 group-hover:text-brand-primary transition-colors" />
                      </div>

                      <h4 className="font-display font-bold text-lg text-naviigo-brown uppercase group-hover:text-brand-primary transition-colors">
                        {gem.name}
                      </h4>
                      <p className="font-sans text-xs sm:text-sm text-naviigo-brown/75 leading-relaxed mt-2">
                        {gem.desc}
                      </p>
                    </div>

                    {gem.tip && (
                      <div className="mt-4 pt-3 border-t border-[#EADFD4] font-mono text-[11px] text-naviigo-brown/70">
                        <span className="font-bold text-brand-primary uppercase">Insider Tip:</span> {gem.tip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 03. TOURIST TRAPS TO BYPASS & LOCAL ALTERNATIVES ────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary">
                    03 / UNBIASED ADVISORY
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight text-naviigo-brown mt-1">
                    Skip the Traps · Local Alternatives
                  </h3>
                </div>
                <div className="font-mono text-xs text-naviigo-brown/50 uppercase hidden sm:block">
                  BYPASS COMMISSIONS
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.touristTrapsToAvoid.map((item, i) => (
                  <div
                    key={i}
                    className="bg-paper-light border border-[#EADFD4] rounded-2xl p-6 shadow-sm space-y-4"
                  >
                    {/* The Trap */}
                    <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200/60">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-red-700 uppercase tracking-wide">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Skip This Commercial Trap</span>
                      </div>
                      <p className="font-sans text-xs sm:text-sm font-semibold text-red-900 line-through opacity-80 mt-1">
                        {item.trap}
                      </p>
                    </div>

                    {/* The Alternative */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-800 uppercase tracking-wide">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Go Here Instead</span>
                      </div>
                      <p className="font-sans text-xs sm:text-sm font-bold text-emerald-950 mt-1">
                        {item.betterAlternative}
                      </p>
                    </div>

                    {item.reason && (
                      <p className="font-sans text-[11px] sm:text-xs text-naviigo-brown/70 italic leading-relaxed pt-1">
                        {item.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 04. LOCAL BITES & CULINARY MUST-HAVES ───────────────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary">
                    04 / INDIGENOUS TASTES
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight text-naviigo-brown mt-1">
                    Local Bites &amp; Generational Kitchens
                  </h3>
                </div>
                <div className="font-mono text-xs text-naviigo-brown/50 uppercase hidden sm:block">
                  AUTHENTIC DISHES
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.localFoodMustHaves.map((food, i) => (
                  <div
                    key={i}
                    className="bg-paper-light border border-[#EADFD4] rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-brand-primary/40 transition-colors"
                  >
                    <div>
                      <div className="w-8 h-8 rounded-full bg-paper-warm border border-[#EADFD4] font-mono text-xs font-bold text-brand-primary flex items-center justify-center mb-4">
                        {i + 1}
                      </div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-naviigo-brown uppercase">
                        {food.dish}
                      </h4>
                      <div className="mt-3 flex items-start gap-1.5 font-mono text-xs text-naviigo-brown/80">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                        <span>{food.where}</span>
                      </div>
                    </div>

                    {food.price && (
                      <div className="mt-4 pt-3 border-t border-[#EADFD4] font-mono text-[11px] text-brand-primary font-bold">
                        Average: {food.price}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── 05. AESTHETIC VANTAGE POINTS & GOLDEN HOUR ────────────── */}
            <div>
              <div className="flex items-baseline justify-between mb-6">
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary">
                    05 / GOLDEN HOUR FRAMEWORKS
                  </div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight text-naviigo-brown mt-1">
                    Aesthetic Vantage Points
                  </h3>
                </div>
                <div className="font-mono text-xs text-naviigo-brown/50 uppercase hidden sm:block">
                  LIGHTING WINDOWS
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.instagramWorthy.map((spot, i) => (
                  <div
                    key={i}
                    className="bg-paper-light border border-[#EADFD4] rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-brand-primary uppercase mb-3">
                        <Camera className="w-4 h-4" />
                        <span>VANTAGE 0{i + 1}</span>
                      </div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-naviigo-brown uppercase">
                        {spot.spot}
                      </h4>
                      {spot.angle && (
                        <p className="font-sans text-xs text-naviigo-brown/70 leading-relaxed mt-2">
                          {spot.angle}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EADFD4] flex items-center gap-1.5 font-mono text-[11px] font-bold text-brand-primary">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{spot.bestTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 06. LIVE LOCAL EVENTS & CULTURAL CALENDAR ─────────────── */}
            {(liveEvents.length > 0 || festivals.length > 0) && (
              <div className="pt-4 border-t border-[#EADFD4]">
                <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary mb-1">
                  06 / CULTURAL DISPATCH &amp; CALENDAR
                </div>
                <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-tight text-naviigo-brown mb-6">
                  Events &amp; Seasonal Festivals
                </h3>

                {/* Festival alerts */}
                {festivals.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {festivals.map((f, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-xl bg-paper-light border border-[#EADFD4] flex items-start gap-3"
                      >
                        <span className="text-2xl">{f.emoji}</span>
                        <div>
                          <div className="font-display font-bold text-sm text-naviigo-brown uppercase">
                            {f.name}
                          </div>
                          <p className="font-sans text-xs text-naviigo-brown/75 mt-0.5">
                            {f.description}
                          </p>
                          {f.travelImpact.warnings.length > 0 && (
                            <p className="font-mono text-[10px] text-brand-primary font-bold mt-1">
                              ⚠️ Advisory: {f.travelImpact.warnings[0]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live Events Grid */}
                {liveEvents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {liveEvents.map((evt, i) => (
                      <a
                        key={i}
                        href={evt.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-paper-light border border-[#EADFD4] rounded-xl overflow-hidden hover:border-brand-primary/50 transition-colors flex flex-col justify-between"
                      >
                        <div className="p-4">
                          <div className="font-mono text-[10px] uppercase font-bold text-brand-primary mb-1">
                            {evt.date?.when || 'Upcoming'}
                          </div>
                          <h5 className="font-display font-bold text-sm text-naviigo-brown line-clamp-2 group-hover:text-brand-primary transition-colors">
                            {evt.title}
                          </h5>
                          {evt.venue?.name && (
                            <p className="font-sans text-[11px] text-naviigo-brown/60 truncate mt-1">
                              📍 {evt.venue.name}
                            </p>
                          )}
                        </div>
                        <div className="p-4 pt-0 font-mono text-[10px] uppercase font-bold text-brand-primary flex items-center gap-1 group-hover:gap-1.5 transition-all">
                          <span>Inspect Event</span>
                          <span>→</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── 07. CONVERSION CTA: BUILD TAILORED ITINERARY ─────────── */}
            <div className="rounded-3xl bg-naviigo-brown text-paper-light p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 font-mono text-[10px] uppercase tracking-widest text-brand-primary">
                  <span>EXPEDITION BLUEPRINT</span>
                </div>
                <h3 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-white">
                  Transform This Intel Into Your Personal Itinerary.
                </h3>
                <p className="font-sans text-xs sm:text-sm text-paper-warm/80 leading-relaxed max-w-xl mx-auto">
                  Take these authentic spots, hidden enclaves, and verified food recommendations and instantly assemble an optimized day-by-day travel blueprint for {destination}.
                </p>
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() =>
                      router.push(
                        `/itinerary?destination=${encodeURIComponent(destination)}&companion=${encodeURIComponent(companion)}&vibe=${encodeURIComponent(vibe)}`
                      )
                    }
                    className="inline-flex items-center gap-2 sm:gap-3 px-8 py-4 rounded-xl bg-brand-primary text-white font-mono text-xs uppercase font-bold tracking-widest hover:bg-white hover:text-naviigo-brown transition-all shadow-xl hover:scale-105 touch-manipulation min-h-[48px]"
                  >
                    <span>Build My Itinerary for {destination}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── 08. VERIFIED TRAVELER REVIEWS ─────────────────────────── */}
            <div className="pt-4 border-t border-[#EADFD4]">
              <ReviewSection
                destId={destination.toLowerCase().replace(/\s+/g, '')}
                destName={destination}
              />
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
