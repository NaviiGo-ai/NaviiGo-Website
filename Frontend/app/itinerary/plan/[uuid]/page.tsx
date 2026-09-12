'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/features/itinerary/LoadingScreen';
import ResultPage from '@/components/features/itinerary/ResultPage';
import { listenToItineraryByUUID } from '@/lib/firestore';


/**
 * /itinerary/plan/[uuid]
 *
 * Each generated itinerary has a unique UUID URL.
 * Flow:
 *   1. On mount: subscribe to Firestore `itineraries/{uuid}` via getItineraryByUUID
 *   2. If doc has generatedData → show ResultPage immediately
 *   3. If doc has form but no generatedData → show LoadingScreen, which calls the generate API and writes the result to Firestore (calls onDone when complete). The onSnapshot fires → ResultPage shows.
 *   4. If doc is missing completely → show 404-style message.
 */
function ItineraryUUIDContent() {
    const params = useParams();
    const router = useRouter();
    const rawUuid = (params?.uuid as string) ?? '';
    const uuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();

    const [phase, setPhase] = useState<'loading-data' | 'generating' | 'result' | 'not-found'>('loading-data');
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [generatedData, setGeneratedData] = useState<any>(null);

    // Validate UUID format on mount to prevent Firebase path injection
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid);

    useEffect(() => {
        if (!uuid || !isValidUUID) {
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
                    setForm(data.form ?? {});
                    setGeneratedData(data.generatedData);
                    setPhase('result');
                    return;
                }

                // If we have a form but no generatedData, we are in generating state
                if (data?.form) {
                    setForm(data.form ?? {});
                    setPhase('generating');
                    return;
                }

                // If we have neither, then not found
                setPhase('not-found');
                return;
            } catch (err) {
                console.warn('[UUID Page] Firestore fetch skipped/failed:', err);
                if (!isMounted) return;
                setPhase('not-found');
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [uuid, isValidUUID, rawUuid]);

    /**
     * Called by LoadingScreen when generation completes.
     * The API route already saved to Firestore.
     * We also set state here directly for instant transition.
     */
    const handleGenerationDone = useCallback((data: any) => {
        if (data) {
            setGeneratedData(data);
            setPhase('result');
            // Removed sessionStorage usage; rely on Firestore
        }
    }, []);


    const handleReset = useCallback(() => {
        router.push('/itinerary');
    }, [router]);

    const handleDayView = useCallback(() => {
        router.push(`/itinerary/plan/${uuid}/day/1`);
    }, [uuid, router]);

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
                        form={form}
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
