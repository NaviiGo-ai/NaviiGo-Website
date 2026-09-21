'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { DEST_DATA } from '@/app/itinerary/data';
import { getBrowsingSignals } from '@/lib/browsingSignals';
import { useAuth } from '@/lib/AuthContext';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });

const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

// Real stages of the generation workflow
const REAL_STAGES = [
  {
    id: 'understanding',
    number: '01',
    title: 'UNDERSTANDING THE TRIP',
    description: 'Analyzing travel dates, duration, group pace, and transit parameters.',
  },
  {
    id: 'finding',
    number: '02',
    title: 'FINDING PLACES',
    description: 'Locating verified landmarks, authentic eateries, and regionally authentic stays.',
  },
  {
    id: 'routing',
    number: '03',
    title: 'BUILDING THE ROUTE',
    description: 'Connecting waypoints with realistic travel buffers and spatial alignment.',
  },
  {
    id: 'shaping',
    number: '04',
    title: 'SHAPING THE DAYS',
    description: 'Orchestrating morning to evening flow into a coherent living document.',
  },
];

interface LoadingScreenProps {
  form: Record<string, unknown>;
  uuid?: string;
  onDone: (data: any) => void;
}

export default function LoadingScreen({ form, uuid, onDone }: LoadingScreenProps) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const destId = (form.destination as string) || '';
  const destName = (form.destName as string) || 'India';
  const daysCount = (form.days as number) || 3;
  const hardcodedData = DEST_DATA[destId] ?? null;

  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [revealedPinsCount, setRevealedPinsCount] = useState(0);
  const [apiData, setApiData] = useState<any>(null);
  const [apiDone, setApiDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dynamicCenter, setDynamicCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [dynamicHighlights, setDynamicHighlights] = useState<any[]>([]);
  const fetchedRef = useRef(false);

  const activeMapCenter = hardcodedData?.mapCenter ?? dynamicCenter ?? INDIA_CENTER;

  // Fallback points around the map center to show spatial construction
  const fallbackHighlights = useMemo(() => [
    { lat: activeMapCenter.lat + 0.02, lng: activeMapCenter.lng - 0.018, name: 'Arrival & Primary Quarter' },
    { lat: activeMapCenter.lat - 0.015, lng: activeMapCenter.lng + 0.014, name: 'Cultural Landmark & History' },
    { lat: activeMapCenter.lat + 0.012, lng: activeMapCenter.lng + 0.022, name: 'Local Culinary Market' },
    { lat: activeMapCenter.lat - 0.022, lng: activeMapCenter.lng - 0.01, name: 'Evening Horizon & Retreat' },
  ], [activeMapCenter]);

  const activeHighlights = hardcodedData?.highlights?.length
    ? hardcodedData.highlights
    : dynamicHighlights.length
    ? dynamicHighlights
    : fallbackHighlights;

  // Fetch coordinates via Nominatim if destination is not in hardcoded data
  useEffect(() => {
    if (hardcodedData) return;
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destName + ' India')}&format=json&limit=1`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setDynamicCenter({ lat, lng });
          setDynamicHighlights([
            { lat: lat + 0.016, lng: lng - 0.014, name: 'Heritage Center' },
            { lat: lat - 0.012, lng: lng + 0.012, name: 'Regional Culinary Hub' },
            { lat: lat + 0.01, lng: lng + 0.02, name: 'Scenic Overlook' },
            { lat: lat - 0.02, lng: lng - 0.008, name: 'Sanctuary & Stays' },
          ]);
        }
      })
      .catch(() => {});
  }, [destName, hardcodedData]);

  // Elapsed seconds timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Real API Generation Call
  useEffect(() => {
    if (authLoading) return; // Wait until Firebase Auth initial session resolves
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const generateTrip = async () => {
      try {
        if (!user) {
          console.warn('[LoadingScreen] No user session found. Sign-in required for itinerary creation.');
          setError('Sign in is required to generate your personalized itinerary.');
          setApiDone(true);
          return;
        }

        console.log(`[LoadingScreen] Initiating generation for "${destName}" (${daysCount} days)...`);
        const idToken = await user.getIdToken();
        console.log('[LoadingScreen] Acquired Firebase ID token. Calling POST /api/itinerary/generate...');

        const res = await fetch('/api/itinerary/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            destination: destId,
            destName,
            purpose: form.purpose,
            group: form.group,
            days: form.days,
            budget: form.budget,
            startDate: form.startDate,
            travelerType: form.travelerType || 'comfort',
            browsingSignals: getBrowsingSignals(),
            userId: user.uid,
            uuid: uuid ?? null,
            arrivalTime: form.arrivalTime || 'afternoon',
            arrivalMode: form.arrivalMode || '',
            departureTime: form.departureTime || '',
            departureMode: form.departureMode || '',
            hotelArea: form.hotelArea || '',
            originCity: form.originCity || '',
            mustDo: form.mustDo || [],
            routeStops: form.routeStops || [],
          }),
        });

        const result = await res.json();
        console.log('[LoadingScreen] API response:', { status: res.status, ok: res.ok, success: result?.success });

        if (!res.ok || !result.success || !result.itinerary) {
          const errMsg = result.error || result.detail || 'Itinerary generation engine encountered an error.';
          console.error('[LoadingScreen] Generation failed:', errMsg);
          setError(errMsg);
          setApiDone(true);
          return;
        }

        console.log('[LoadingScreen] Generation succeeded! Setting itinerary data.');
        setApiData(result.itinerary);

        if (uuid && typeof window !== 'undefined') {
          import('@/lib/firestore').then(({ saveItineraryByUUID }) => {
            saveItineraryByUUID(uuid, {
              form,
              generatedData: result.itinerary,
              destName,
              userId: (form?.userId as string) ?? user?.uid ?? null,
              isPublic: true,
            }).catch((fsErr) => {
              console.warn('[LoadingScreen] Firestore save warning:', fsErr);
            });
          });
        }
      } catch (err: any) {
        console.error('[LoadingScreen] Generation caught exception:', err);
        setError(err.message || 'Network error communicating with the generation engine.');
      }
      setApiDone(true);
    };

    generateTrip();
  }, [authLoading, destId, destName, form, user, uuid, daysCount]);

  const handleRetry = () => {
    fetchedRef.current = false;
    setError(null);
    setApiDone(false);
    setActiveStageIndex(0);
    setElapsed(0);
  };

  // Progress through the 4 stages while waiting for real API data
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => {
        if (prev < REAL_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
      setRevealedPinsCount((prev) => Math.min(prev + 1, activeHighlights.length));
    }, 4500);

    return () => clearInterval(interval);
  }, [activeHighlights.length]);

  // Once API is done and final stage reached, transition gracefully
  useEffect(() => {
    if (apiDone && apiData) {
      const timeout = setTimeout(() => {
        onDone(apiData);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [apiDone, apiData, onDone]);

  // Generate mapped pins
  const currentMapPins = useMemo(() => {
    return activeHighlights.slice(0, revealedPinsCount).map((h, i) => ({
      lat: h.lat ?? activeMapCenter.lat,
      lng: h.lng ?? activeMapCenter.lng,
      label: h.name,
      number: i + 1,
      img: h.img || '',
    }));
  }, [activeHighlights, activeMapCenter, revealedPinsCount]);

  return (
    <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-20 pb-16 selection:bg-brand-primary selection:text-white">
      {/* ── Top Editorial Folio Bar ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 border-b border-[#EADFD4] flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-naviigo-brown/60 mb-1">
            <span className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-brand-primary animate-pulse'}`} />
            <span>JOURNEY CONSTRUCTION</span>
            <span className="text-naviigo-brown/30">/</span>
            <span>NV-PLAN-{daysCount}D</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-naviigo-brown uppercase tracking-tight">
            Assembling Route for {destName}
          </h1>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs">
          <span className="text-naviigo-brown/50 uppercase tracking-wider">
            ELAPSED: 00:{elapsed.toString().padStart(2, '0')}
          </span>
          <span className={`font-bold uppercase tracking-wider ${error ? 'text-red-600' : 'text-brand-primary'}`}>
            {error ? '⚠ GENERATION PAUSED' : apiDone ? '✦ ROUTE READY' : 'LIVE CONVERGENCE'}
          </span>
        </div>
      </div>

      {/* ── Live Journey Canvas (Two Column Workspace) ─────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[calc(100vh-220px)]">
        
        {/* Left Column: Stages & Status Feedback */}
        <div className="lg:col-span-5 space-y-6">

          {/* Interactive Error Card */}
          {error && (
            <div className="bg-paper-light border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-red-600 font-mono text-xs font-bold uppercase tracking-wider">
                <span>⚠ Generation Error</span>
              </div>
              <p className="font-sans text-xs sm:text-sm text-naviigo-brown/80 leading-relaxed">
                {error}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {!user ? (
                  <button
                    onClick={() => signInWithGoogle()}
                    className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs uppercase font-bold transition-colors"
                  >
                    Sign In with Google
                  </button>
                ) : (
                  <button
                    onClick={handleRetry}
                    className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs uppercase font-bold transition-colors shadow-xs"
                  >
                    ↻ Retry Generation
                  </button>
                )}
                <Link
                  href="/itinerary"
                  className="px-5 py-2.5 rounded-xl bg-paper-warm border border-[#EADFD4] hover:border-naviigo-brown text-naviigo-brown font-mono text-xs uppercase font-bold transition-colors"
                >
                  Return to Wizard
                </Link>
              </div>
            </div>
          )}

          <div className="bg-paper-light border border-[#EADFD4] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#EADFD4]">
              <span className="font-mono text-xs uppercase tracking-widest text-brand-primary font-bold">
                SYSTEM STAGES
              </span>
              <span className="font-mono text-xs text-naviigo-brown/50">
                {activeStageIndex + 1} OF 4
              </span>
            </div>

            <div className="space-y-6">
              {REAL_STAGES.map((stage, idx) => {
                const isCompleted = idx < activeStageIndex || (idx === activeStageIndex && apiDone);
                const isCurrent = idx === activeStageIndex && !apiDone;

                return (
                  <div key={stage.id} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs transition-all duration-500 border ${
                          isCompleted
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : isCurrent
                            ? 'bg-paper-warm border-brand-primary text-brand-primary font-bold shadow-xs'
                            : 'bg-paper-warm border-[#EADFD4] text-naviigo-brown/30'
                        }`}
                      >
                        {isCompleted ? '✓' : stage.number}
                      </div>
                      {idx < REAL_STAGES.length - 1 && (
                        <div
                          className={`w-[1.5px] h-10 mt-2 transition-colors duration-500 ${
                            idx < activeStageIndex ? 'bg-brand-primary' : 'bg-[#EADFD4]'
                          }`}
                        />
                      )}
                    </div>

                    <div className="pt-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-display font-bold text-sm sm:text-base uppercase tracking-tight transition-colors ${
                            isCurrent
                              ? 'text-brand-primary'
                              : isCompleted
                              ? 'text-naviigo-brown'
                              : 'text-naviigo-brown/40'
                          }`}
                        >
                          {stage.title}
                        </h4>
                        {isCurrent && (
                          <span className="font-mono text-[10px] text-brand-primary uppercase tracking-widest animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-xs text-naviigo-brown/70 font-light mt-1 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arriving Waypoints Feed */}
          <div className="bg-paper-light border border-[#EADFD4] rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-naviigo-brown/60">
                RESOLVED WAYPOINTS
              </span>
              <span className="font-mono text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded font-bold uppercase">
                {revealedPinsCount} LOCATED
              </span>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {currentMapPins.map((pin) => (
                  <motion.div
                    key={pin.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-paper-warm border border-[#EADFD4] text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-naviigo-brown text-white font-mono text-[10px] flex items-center justify-center font-bold">
                      {pin.number}
                    </span>
                    <span className="font-sans font-medium text-naviigo-brown">
                      {pin.label}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {revealedPinsCount === 0 && (
                <div className="font-mono text-xs text-naviigo-brown/40 py-4 text-center">
                  Triangulating regional coordinates…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Working Live Map & Route Construction Canvas */}
        <div className="lg:col-span-7 h-[540px] sm:h-[620px] lg:h-full min-h-[500px] relative rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm bg-paper-light">
          {/* Spatial Header Tag */}
          <div className="absolute top-4 left-4 z-20 bg-paper-warm/95 backdrop-blur-md px-4 py-2 rounded-xl border border-[#EADFD4] shadow-xs font-mono text-xs flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-brand-primary" />
            <span className="font-bold text-naviigo-brown">{destName} Cartographic Canvas</span>
            <span className="text-naviigo-brown/40">|</span>
            <span className="text-naviigo-brown/60">OSM Spatial Engine</span>
          </div>

          <ItineraryMap
            pins={currentMapPins}
            center={activeMapCenter}
            zoom={12}
            className="w-full h-full"
          />
        </div>

      </div>
    </div>
  );
}
