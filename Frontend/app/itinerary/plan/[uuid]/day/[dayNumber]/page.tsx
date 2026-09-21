'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DayViewPage from '@/components/features/itinerary/DayViewPage';
import { getItineraryByUUID } from '@/lib/firestore';
import { DEST_DATA } from '@/app/itinerary/data';

/**
 * /itinerary/plan/[uuid]/day/[dayNumber]
 *
 * Renders the day-by-day view for a specific day of a UUID-keyed itinerary.
 * dayNumber is 1-indexed (day/1, day/2, ...).
 *
 * Guaranteed reliability:
 * 1. Fast-path: checks sessionStorage cache for instant 0ms rendering on client navigation
 * 2. Static catalog fallback: checks DEST_DATA if uuid/destKey matches known destinations (e.g. jaipur, varanasi)
 * 3. Firestore fetch fallback for direct URLs, refresh, or external sharing
 * 4. 5-second timeout safeguard to prevent any infinite "Loading Day X..." lockup
 * 5. Refined editorial skeleton matching the Naviigo light paper canvas
 */
function DayViewContent() {
    const params = useParams();
    const router = useRouter();
    const rawUuid = (params?.uuid as string) ?? '';
    const uuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();
    const dayNumber = parseInt(params?.dayNumber as string, 10);

    const isValidId = /^[a-zA-Z0-9_-]{1,128}$/.test(uuid);
    const isInvalid = !uuid || !isValidId || isNaN(dayNumber) || dayNumber < 1;

    const [phase, setPhase] = useState<'loading' | 'ready' | 'generating' | 'not-found' | 'slow-loading'>('loading');
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [generatedData, setGeneratedData] = useState<any>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (isInvalid) {
            setPhase('not-found');
            return;
        }

        let active = true;

        // 1. Instant fast-path from sessionStorage
        if (typeof window !== 'undefined') {
            try {
                const cached = sessionStorage.getItem(`naviigo_plan_${uuid}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const expectedDays = Number(parsed?.form?.days) || 0;
                    const actualDays = parsed?.generatedData?.dayPlans?.length || 0;
                    if (actualDays > 0 && (expectedDays <= 1 || actualDays >= expectedDays)) {
                        if (dayNumber > actualDays) {
                            router.replace(`/itinerary/plan/${uuid}/day/1`);
                            return;
                        }
                        setForm(parsed.form || {});
                        setGeneratedData(parsed.generatedData);
                        setPhase('ready');
                        return;
                    }
                }
            } catch (e) {
                console.warn('[DayView] Cache parse failed, falling back to network:', e);
            }
        }

        // 2. Direct static destination fallback (e.g. /itinerary/plan/jaipur/day/1)
        const directStatic = DEST_DATA[uuid.toLowerCase()];
        if (directStatic && directStatic.dayPlans?.length > 0) {
            const totalDays = directStatic.dayPlans.length;
            if (dayNumber > totalDays) {
                router.replace(`/itinerary/plan/${uuid}/day/1`);
                return;
            }
            const defaultForm = {
                destId: uuid,
                destination: uuid,
                destName: uuid.charAt(0).toUpperCase() + uuid.slice(1),
                days: totalDays,
                budget: 25000,
                purpose: 'cultural',
                group: 'solo',
            };
            setForm(defaultForm);
            setGeneratedData(directStatic);
            setPhase('ready');
            try {
                sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                    form: defaultForm,
                    generatedData: directStatic,
                }));
            } catch {}
            return;
        }

        // 3. Fallback timeout to prevent infinite spinner
        const timer = setTimeout(() => {
            if (active && phase === 'loading') {
                setPhase('slow-loading');
            }
        }, 5000);

        // 4. Fetch from Firestore
        getItineraryByUUID(uuid).then((data) => {
            if (!active) return;
            clearTimeout(timer);

            if (data?.form) {
                const expectedDays = Number(data.form?.days) || 0;
                const totalDays = data.generatedData?.dayPlans?.length ?? 0;
                const isComplete = totalDays > 0 && (expectedDays <= 1 || totalDays >= expectedDays);

                if (!isComplete) {
                    // Itinerary needs generation or repair -> redirect to plan page to generate
                    router.replace(`/itinerary/plan/${uuid}`);
                    return;
                }

                if (dayNumber > totalDays) {
                    router.replace(`/itinerary/plan/${uuid}/day/1`);
                    return;
                }

                const loadedForm = data.form ?? {};
                setForm(loadedForm);
                setGeneratedData(data.generatedData);
                setPhase('ready');

                // Cache for fast back/forward navigation
                try {
                    sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                        form: loadedForm,
                        generatedData: data.generatedData,
                    }));
                } catch {}
                return;
            }

            if (data?.generatedData) {
                const totalDays = data.generatedData?.dayPlans?.length ?? 0;
                if (totalDays === 0) {
                    setPhase('not-found');
                    return;
                }

                if (dayNumber > totalDays) {
                    router.replace(`/itinerary/plan/${uuid}/day/1`);
                    return;
                }

                const loadedForm = data.form ?? {};
                setForm(loadedForm);
                setGeneratedData(data.generatedData);
                setPhase('ready');

                try {
                    sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                        form: loadedForm,
                        generatedData: data.generatedData,
                    }));
                } catch {}
                return;
            }

            setPhase('not-found');
        }).catch((err) => {
            console.error('[DayView] getItineraryByUUID failed:', err);
            if (active) setPhase('not-found');
        });

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [uuid, dayNumber, isInvalid, router, retryCount]);

    const handleBack = useCallback(() => {
        router.push(`/itinerary/plan/${uuid}`);
    }, [router, uuid]);

    const handleRetry = useCallback(() => {
        setPhase('loading');
        setRetryCount(c => c + 1);
    }, []);

    // ─── REFINED LIGHT EDITORIAL SKELETON ───
    if (phase === 'loading' || phase === 'slow-loading') {
        return (
            <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-20 sm:pt-24 px-4 sm:px-8 max-w-6xl mx-auto">
                {/* Masthead Bar Skeleton */}
                <div className="border-b border-[#EADFD4] pb-6 mb-8 animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 w-40 bg-[#EADFD4] rounded" />
                        <div className="h-8 w-24 bg-[#EADFD4] rounded-full" />
                    </div>
                    <div className="h-10 w-72 sm:w-96 bg-[#EADFD4] rounded-lg mb-3" />
                    <div className="h-4 w-60 bg-[#EADFD4] rounded" />
                </div>

                {/* Day Navigation Skeleton */}
                <div className="flex gap-3 mb-8 pb-3 border-b border-[#EADFD4]">
                    {[1, 2, 3, 4].map(n => (
                        <div key={n} className={`h-8 w-20 rounded-full ${n === dayNumber ? 'bg-brand-primary/20 border border-brand-primary/40' : 'bg-[#EADFD4]'}`} />
                    ))}
                </div>

                {/* Vertical Spine Skeleton */}
                <div className="relative pl-8 sm:pl-12 space-y-8">
                    <div className="absolute left-3 sm:left-4 top-2 bottom-6 w-[2px] bg-[#EC6426]/30" />

                    {[1, 2, 3].map(i => (
                        <div key={i} className="relative bg-paper-light border border-[#EADFD4] rounded-2xl p-6 shadow-sm">
                            <div className="absolute -left-8 sm:-left-12 top-6 w-7 h-7 rounded-full bg-paper-warm border-2 border-[#EC6426] flex items-center justify-center font-mono text-[10px] font-bold text-brand-primary">
                                0{i}
                            </div>
                            <div className="flex items-baseline justify-between mb-3">
                                <div className="h-4 w-28 bg-[#EADFD4] rounded" />
                                <div className="h-3 w-16 bg-[#EADFD4] rounded" />
                            </div>
                            <div className="h-6 w-48 sm:w-72 bg-[#EADFD4] rounded mb-2" />
                            <div className="h-4 w-full bg-[#EADFD4]/70 rounded" />
                        </div>
                    ))}
                </div>

                {/* Graceful recovery if loading exceeds threshold */}
                {phase === 'slow-loading' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-paper-light border border-brand-primary/40 shadow-xl rounded-2xl p-4 flex items-center gap-4 text-xs font-mono max-w-md w-[90%]"
                    >
                        <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                        <span className="flex-1 text-naviigo-brown">Still connecting to journey archive...</span>
                        <button
                            onClick={handleRetry}
                            className="bg-brand-primary text-white px-3 py-1.5 rounded-lg font-bold hover:bg-brand-primary/90 transition-colors"
                        >
                            Retry →
                        </button>
                        <button
                            onClick={handleBack}
                            className="text-naviigo-brown/60 hover:text-naviigo-brown transition-colors"
                        >
                            Overview
                        </button>
                    </motion.div>
                )}
            </div>
        );
    }

    if (phase === 'not-found') {
        return (
            <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-16 sm:pt-20 flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md bg-paper-light border border-[#EADFD4] p-8 sm:p-10 rounded-3xl shadow-sm"
                >
                    <div className="text-5xl mb-5">🗺️</div>
                    <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary mb-2">
                        EXPEDITION RECORD
                    </div>
                    <h1 className="text-2xl font-display font-black text-naviigo-brown uppercase mb-3">
                        This journey couldn&apos;t be found.
                    </h1>
                    <p className="text-naviigo-brown/70 font-sans text-sm mb-8 leading-relaxed">
                        This itinerary or day is no longer in the active ledger, or the URL parameters are malformed.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => router.push('/itinerary')}
                            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-mono font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-sm"
                        >
                            Plan a New Journey →
                        </button>
                        <button
                            onClick={handleBack}
                            className="bg-paper-warm border border-[#EADFD4] text-naviigo-brown font-mono font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl hover:bg-[#EAE0D5] transition-colors"
                        >
                            Back to Overview
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <DayViewPage
            form={{ ...form, _uuid: uuid, uuid, _initialDay: Math.max(0, dayNumber - 1) }}
            generatedData={generatedData}
            onBack={handleBack}
        />
    );
}

export default function DayViewRoute() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-paper-warm flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <DayViewContent />
        </Suspense>
    );
}