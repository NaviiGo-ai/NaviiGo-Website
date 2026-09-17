'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/features/itinerary/LoadingScreen';
import ResultPage from '@/components/features/itinerary/ResultPage';
import { listenToItineraryByUUID } from '@/lib/firestore';


import { DEST_DATA } from '@/app/itinerary/data';

/**
 * /itinerary/plan/[uuid]
 *
 * Each generated itinerary has a unique UUID URL.
 * Flow:
 *   1. On mount: subscribe to Firestore `itineraries/{uuid}` via getItineraryByUUID
 *   2. If doc has generatedData → show ResultPage immediately
 *   3. If doc has form but no generatedData → show LoadingScreen, which calls the generate API and writes the result to Firestore (calls onDone when complete). The onSnapshot fires → ResultPage shows.
 *   4. Fallback to DEST_DATA if uuid matches a known catalog destination (e.g. jaipur, varanasi)
 *   5. If doc is missing completely → show 404-style message.
 */
function ItineraryUUIDContent() {
    const params = useParams();
    const router = useRouter();
    const rawUuid = (params?.uuid as string) ?? '';
    const uuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();

    const [phase, setPhase] = useState<'loading-data' | 'generating' | 'result' | 'not-found'>('loading-data');
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [generatedData, setGeneratedData] = useState<any>(null);

    // Validate ID format on mount to prevent path traversal
    const isValidId = /^[a-zA-Z0-9_-]{1,128}$/.test(uuid);

    useEffect(() => {
        if (!uuid || !isValidId) {
            setPhase('not-found');
            return;
        }

        if (rawUuid !== uuid && typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/itinerary/plan/${uuid}`);
        }

        let isMounted = true;

        const loadData = async () => {
            try {
                // 1. Try fetching from Firestore by UUID
                const { getItineraryByUUID } = await import('@/lib/firestore');
                const data = await getItineraryByUUID(uuid);

                if (!isMounted) return;

                if (data?.generatedData) {
                    const loadedForm = data.form ?? {};
                    setForm(loadedForm);
                    setGeneratedData(data.generatedData);
                    setPhase('result');
                    try {
                        sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                            form: loadedForm,
                            generatedData: data.generatedData,
                        }));
                    } catch {}
                    return;
                }

                // If we have a form but no generatedData, check if it's in generating state or static
                if (data?.form) {
                    const destKey = ((data.form.destination || data.form.destId || '') as string).toLowerCase();
                    const staticMatch = DEST_DATA[destKey];
                    if (staticMatch) {
                        setForm(data.form);
                        setGeneratedData(staticMatch);
                        setPhase('result');
                        try {
                            sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                                form: data.form,
                                generatedData: staticMatch,
                            }));
                        } catch {}
                        return;
                    }

                    setForm(data.form ?? {});
                    setPhase('generating');
                    return;
                }

                // Fallback: Check if UUID itself is a known static destination
                const directStatic = DEST_DATA[uuid.toLowerCase()];
                if (directStatic) {
                    const defaultForm = {
                        destId: uuid,
                        destination: uuid,
                        destName: uuid.charAt(0).toUpperCase() + uuid.slice(1),
                        days: directStatic.dayPlans?.length || 3,
                        budget: 25000,
                        purpose: 'cultural',
                        group: 'solo',
                    };
                    setForm(defaultForm);
                    setGeneratedData(directStatic);
                    setPhase('result');
                    try {
                        sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                            form: defaultForm,
                            generatedData: directStatic,
                        }));
                    } catch {}
                    return;
                }

                // If we have neither, then not found
                setPhase('not-found');
                return;
            } catch (err) {
                console.warn('[UUID Page] Firestore fetch skipped/failed:', err);
                if (!isMounted) return;

                const directStatic = DEST_DATA[uuid.toLowerCase()];
                if (directStatic) {
                    const defaultForm = {
                        destId: uuid,
                        destination: uuid,
                        destName: uuid.charAt(0).toUpperCase() + uuid.slice(1),
                        days: directStatic.dayPlans?.length || 3,
                        budget: 25000,
                        purpose: 'cultural',
                        group: 'solo',
                    };
                    setForm(defaultForm);
                    setGeneratedData(directStatic);
                    setPhase('result');
                    return;
                }

                setPhase('not-found');
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [uuid, isValidId, rawUuid]);

    /**
     * Called by LoadingScreen when generation completes.
     * The API route already saved to Firestore.
     * We also set state here directly for instant transition and cache for day view.
     */
    const handleGenerationDone = useCallback((data: any) => {
        if (data) {
            setGeneratedData(data);
            setPhase('result');
            try {
                sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                    form,
                    generatedData: data,
                }));
            } catch {}
        }
    }, [form, uuid]);


    const handleReset = useCallback(() => {
        router.push('/itinerary');
    }, [router]);

    const handleDayView = useCallback((targetDay: number = 1, currentData?: any) => {
        const dayToOpen = typeof targetDay === 'number' && targetDay >= 1 ? targetDay : 1;
        const dataToSave = currentData || generatedData;
        if (dataToSave) {
            try {
                sessionStorage.setItem(`naviigo_plan_${uuid}`, JSON.stringify({
                    form,
                    generatedData: dataToSave,
                }));
            } catch {}
        }
        router.push(`/itinerary/plan/${uuid}/day/${dayToOpen}`);
    }, [uuid, router, form, generatedData]);

    if (phase === 'loading-data') {
        return (
            <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-jungle-green-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-500 dark:text-muted-400">Loading your itinerary…</p>
                </div>
            </div>
        );
    }

    if (phase === 'not-found') {
        return (
            <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="text-6xl mb-6">🗺️</div>
                    <h1 className="text-2xl font-bold text-muted-900 dark:text-white mb-3">
                        Itinerary Not Found
                    </h1>
                    <p className="text-muted-500 dark:text-muted-400 text-sm mb-8">
                        This itinerary link may have expired (guest itineraries last 30 days) or the URL is invalid.
                    </p>
                    <button
                        onClick={() => router.push('/itinerary')}
                        className="bg-jungle-green-600 hover:bg-jungle-green-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-jungle-green-500/20"
                    >
                        Create a New Itinerary ✨
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {phase === 'generating' && (
                <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingScreen
                        form={form}
                        uuid={uuid}
                        onDone={handleGenerationDone}
                    />
                </motion.div>
            )}
            {phase === 'result' && (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResultPage
                        form={{ ...form, uuid, _uuid: uuid }}
                        generatedData={generatedData}
                        shareId={uuid}
                        onDayView={handleDayView}
                        onReset={handleReset}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function ItineraryUUIDPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-jungle-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ItineraryUUIDContent />
        </Suspense>
    );
}
