'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { DEST_DATA } from '@/app/itinerary/data';
import { getBrowsingSignals } from '@/lib/browsingSignals';
import { useAuth } from '@/lib/AuthContext';
import { getOwnerItinerary, confirmsGenerationReceipt } from '@/lib/firestore';
import type { ItineraryGenerateResponse } from '@/types/api';

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

type PersistenceState = 'pending' | 'saved' | 'unsaved' | 'ambiguous';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasDurableReceipt(
  result: ItineraryGenerateResponse,
  operationId: string,
  uid: string,
): result is ItineraryGenerateResponse & {
  itinerary: Record<string, unknown>;
  persistence: { status: 'saved'; durable: true; replayed: boolean };
  receipt: {
    operationId: string;
    itineraryId: string;
    ownerUid: string;
    revisionId: string;
    status: 'committed';
  };
} {
  const receipt = result.receipt;
  const persistence = result.persistence;
  return Boolean(
    result.success &&
      result.itinerary &&
      result.itinerary.id === operationId &&
      persistence?.status === 'saved' &&
      persistence.durable === true &&
      typeof persistence.replayed === 'boolean' &&
      receipt &&
      receipt.operationId === operationId &&
      receipt.itineraryId === operationId &&
      receipt.ownerUid === uid &&
      receipt.revisionId &&
      receipt.status === 'committed' &&
      (!result.userId || result.userId === uid) &&
      (!result.itinerary.userId || result.itinerary.userId === uid),
  );
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
  const [persistenceState, setPersistenceState] = useState<PersistenceState>('pending');
  const [retryNonce, setRetryNonce] = useState(0);
  const [dynamicCenter, setDynamicCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [dynamicHighlights, setDynamicHighlights] = useState<any[]>([]);
  const fetchedRef = useRef(false);
  const requestNonceRef = useRef(0);
  const activeAbortRef = useRef<AbortController | null>(null);
  const observedAccountRef = useRef<string | null | undefined>(undefined);
  const latestAccountUidRef = useRef<string | null>(null);

  // Update before passive effects run so a response that resolves during an
  // account transition cannot commit under the previous UID.
  useLayoutEffect(() => {
    latestAccountUidRef.current = user?.uid ?? null;
  }, [authLoading, user?.uid]);

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

  // Invalidate in-flight work when the authenticated account changes. The
  // operation ID remains stable so a retry can safely reconcile the backend's
  // idempotent operation, but stale data can never be shown for a new account.
  useEffect(() => {
    if (authLoading) return;
    const currentUid = user?.uid ?? null;
    const previousUid = observedAccountRef.current;
    observedAccountRef.current = currentUid;

    if (previousUid !== undefined && previousUid !== currentUid) {
      requestNonceRef.current += 1;
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
      fetchedRef.current = false;
      queueMicrotask(() => {
        if (latestAccountUidRef.current !== currentUid) return;
        setApiData(null);
        setApiDone(false);
        setPersistenceState('pending');
        setError(null);
      });
    }
  }, [authLoading, user?.uid]);

  // Real API Generation Call
  useEffect(() => {
    if (authLoading) return; // Wait until Firebase Auth initial session resolves
    // React Strict Mode can set up, clean up, and set up an effect again in
    // development. Only suppress a duplicate while a request is truly live;
    // an aborted setup must be allowed to establish the single real request.
    if (fetchedRef.current && activeAbortRef.current) return;
    fetchedRef.current = true;

    const urlOperationId = typeof uuid === 'string' ? uuid.trim().toLowerCase() : '';
    const formOperationId = typeof form.operationId === 'string' ? form.operationId.trim().toLowerCase() : '';
    const operationIdsConflict = Boolean(urlOperationId && formOperationId && urlOperationId !== formOperationId);
    const operationId = urlOperationId || formOperationId;
    const requestUid = user?.uid ?? null;
    const requestNonce = ++requestNonceRef.current;
    const abortController = new AbortController();
    activeAbortRef.current = abortController;
    const isCurrentRequest = () =>
      requestNonceRef.current === requestNonce &&
      latestAccountUidRef.current === requestUid &&
      !abortController.signal.aborted;

    const finish = () => {
      if (isCurrentRequest()) setApiDone(true);
    };

    const generateTrip = async () => {
      try {
        if (!user || !requestUid) {
          console.warn('[LoadingScreen] No user session found. Sign-in required for itinerary creation.');
          if (isCurrentRequest()) {
            setError('Sign in is required to generate your personalized itinerary.');
            setPersistenceState('unsaved');
          }
          finish();
          return;
        }

        if (operationIdsConflict || !UUID_V4_PATTERN.test(operationId)) {
          console.warn('[LoadingScreen] Missing or invalid UUID v4 operation ID.');
          if (isCurrentRequest()) {
            setError('This itinerary does not have a valid operation ID. Return to the wizard and start again.');
            setPersistenceState('unsaved');
          }
          finish();
          return;
        }

        console.log(`[LoadingScreen] Initiating generation for "${destName}" (${daysCount} days)...`);
        const idToken = await user.getIdToken();
        if (!isCurrentRequest()) return;
        console.log('[LoadingScreen] Acquired Firebase ID token. Calling POST /api/itinerary/generate...');

        const res = await fetch('/api/itinerary/generate', {
          method: 'POST',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            'Idempotency-Key': operationId,
          },
          body: JSON.stringify({
            operationId,
            destination: destId,
            destName,
            purpose: form.purpose,
            group: form.group,
            days: form.days,
            budget: form.budget,
            startDate: form.startDate,
            endDate: form.endDate,
            travelerType: form.travelerType,
            browsingSignals: Object.prototype.hasOwnProperty.call(form, 'browsingSignals')
              ? form.browsingSignals
              : getBrowsingSignals(),
            arrivalTime: form.arrivalTime,
            arrivalMode: form.arrivalMode,
            departureTime: form.departureTime,
            departureMode: form.departureMode,
            hotelArea: form.hotelArea,
            originCity: form.originCity,
            preferences: form.preferences,
            mustDo: form.mustDo,
            routeStops: form.routeStops,
          }),
        });

        const rawResult: unknown = await res.json();
        const result: ItineraryGenerateResponse = rawResult && typeof rawResult === 'object'
          ? rawResult as ItineraryGenerateResponse
          : { success: false, error: 'The generation service returned an invalid response.' };
        if (!isCurrentRequest()) return;
        console.log('[LoadingScreen] API response:', { status: res.status, ok: res.ok, success: result.success });

        if (!res.ok || !hasDurableReceipt(result, operationId, requestUid)) {
          const responsePersistence = result.persistence?.status;
          const state: PersistenceState = responsePersistence === 'ambiguous' || res.status >= 500
            ? 'ambiguous'
            : 'unsaved';
          const errMsg = state === 'ambiguous'
            ? 'We could not confirm whether this itinerary was saved. It is not in your history yet; retry to reconcile it safely.'
            : result.itinerary
            ? 'A preview was generated, but the backend did not confirm that it was saved. It is not in your history.'
            : result.error || 'Itinerary generation engine encountered an error.';
          console.error('[LoadingScreen] Generation was not durably confirmed:', errMsg);
          setError(errMsg);
          setPersistenceState(state);
          setApiData(null);
          finish();
          return;
        }

        // The response receipt proves the write was acknowledged, but the
        // owner document remains the canonical generated payload. Read it back
        // before showing a result so a stale/partial response cannot become a
        // second client-authored save.
        const ownerItinerary = await getOwnerItinerary(requestUid, operationId);
        if (!isCurrentRequest()) return;
        if (
          !ownerItinerary ||
          ownerItinerary.ownerUid && ownerItinerary.ownerUid !== requestUid ||
          !confirmsGenerationReceipt(ownerItinerary, result.receipt as unknown as Record<string, unknown>) ||
          !ownerItinerary.generatedData
        ) {
          setError('The itinerary was acknowledged, but its owner record could not be confirmed. It is not in your history yet; retry to reconcile it safely.');
          setPersistenceState('ambiguous');
          setApiData(null);
          finish();
          return;
        }

        console.log('[LoadingScreen] Generation committed. Setting canonical owner itinerary.');
        setPersistenceState('saved');
        setApiData(ownerItinerary);
      } catch (err: unknown) {
        if (!isCurrentRequest()) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('[LoadingScreen] Generation caught exception:', err);
        setPersistenceState('ambiguous');
        setError('We could not confirm whether this itinerary was saved. It is not in your history yet; retry to reconcile it safely.');
      }
      finish();
    };

    generateTrip();
    return () => {
      abortController.abort();
      if (activeAbortRef.current === abortController) activeAbortRef.current = null;
    };
  }, [authLoading, destId, destName, form, user, user?.uid, uuid, daysCount, retryNonce]);

  const handleRetry = () => {
    requestNonceRef.current += 1;
    activeAbortRef.current?.abort();
    activeAbortRef.current = null;
    fetchedRef.current = false;
    setError(null);
    setApiDone(false);
    setApiData(null);
    setPersistenceState('pending');
    setActiveStageIndex(0);
    setElapsed(0);
    setRetryNonce((nonce) => nonce + 1);
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
    if (apiDone && apiData && persistenceState === 'saved') {
      const accountUidAtCommit = latestAccountUidRef.current;
      const timeout = setTimeout(() => {
        if (latestAccountUidRef.current !== accountUidAtCommit) return;
        onDone(apiData);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [apiDone, apiData, onDone, persistenceState]);

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
          <span
            className={`font-bold uppercase tracking-wider ${
              error ? 'text-red-600' : 'text-brand-primary'
            }`}
            role="status"
            aria-live="polite"
          >
            {error
              ? persistenceState === 'ambiguous'
                ? '⚠ SAVE UNCONFIRMED'
                : '⚠ GENERATION PAUSED'
              : persistenceState === 'saved' && apiDone
              ? '✦ ROUTE READY'
              : 'LIVE CONVERGENCE'}
          </span>
        </div>
      </div>

      {/* ── Live Journey Canvas (Two Column Workspace) ─────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[calc(100vh-220px)]">
        
        {/* Left Column: Stages & Status Feedback */}
        <div className="lg:col-span-5 space-y-6">

          {/* Interactive Error Card */}
          {error && (
            <div
              className="bg-paper-light border border-red-200 rounded-2xl p-6 shadow-sm space-y-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-2 text-red-600 font-mono text-xs font-bold uppercase tracking-wider">
                <span>
                  {persistenceState === 'ambiguous' ? '⚠ Save Status Unconfirmed' : '⚠ Generation Error'}
                </span>
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
