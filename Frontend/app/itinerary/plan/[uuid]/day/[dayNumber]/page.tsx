'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DayViewPage from '@/components/features/itinerary/DayViewPage';
import { getItineraryByUUID } from '@/lib/firestore';

/**
 * /itinerary/plan/[uuid]/day/[dayNumber]
 *
 * Renders the day-by-day view for a specific day of a UUID-keyed itinerary.
 * dayNumber is 1-indexed (day/1, day/2, ...).
 *
 * Navigation:
 *   ← Back  →  /itinerary/plan/[uuid]  (result overview)
 *   Day tabs → updates dayNumber in URL via router.push
 */
function DayViewContent() {
    const params = useParams();
    const router = useRouter();
    const rawUuid = (params?.uuid as string) ?? '';
    const uuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();
    const dayNumber = parseInt(params?.dayNumber as string, 10);

    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(uuid);
    const isInvalid = !uuid || !isValidUUID || isNaN(dayNumber) || dayNumber < 1;

    const [phase, setPhase] = useState<'loading' | 'ready' | 'generating' | 'not-found'>('loading');
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [generatedData, setGeneratedData] = useState<any>(null);

    useEffect(() => {
        if (isInvalid) return;
        let active = true;

        // Fetch from Firestore (or update if Firestore has newer doc)
        getItineraryByUUID(uuid).then((data) => {
            if (!active) return;
            if (data?.generatedData) {
                const totalDays = data.generatedData?.dayPlans?.length ?? 0;
                if (dayNumber > totalDays) {
                    router.replace(`/itinerary/plan/${uuid}/day/1`);
                    return;
                }
                setForm(data.form ?? {});
                setGeneratedData(data.generatedData);
                setPhase('ready');
            } else if (data?.form) {
                setForm(data.form ?? {});
                setPhase('generating');
            } else {
                setPhase('not-found');
            }
        }).catch(() => {
            if (active) setPhase('not-found');
        });

        return () => { active = false; };
    }, [uuid, dayNumber, isInvalid, router]);


    const handleBack = useCallback(() => {
        router.push(`/itinerary/plan/${uuid}`);
    }, [router, uuid]);

    if (phase === 'loading') {
        return (
            <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-jungle-green-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-500 dark:text-muted-400">Loading Day {dayNumber}…</p>
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
                    <div className="text-6xl mb-6">📅</div>
                    <h1 className="text-2xl font-bold text-muted-900 dark:text-white mb-3">
                        Day Not Found
                    </h1>
                    <p className="text-muted-500 dark:text-muted-400 text-sm mb-8">
                        This itinerary or day doesn&apos;t exist. It may have expired or the URL is invalid.
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
        <DayViewPage
            form={{ ...form, _uuid: uuid, _initialDay: dayNumber - 1 }}
            generatedData={generatedData}
            onBack={handleBack}
        />
    );
}

export default function DayViewRoute() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-jungle-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <DayViewContent />
        </Suspense>
    );
}