'use client';

import { useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';

function RedirectItineraryContent() {
    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        const rawUuid = (params?.uuid as string) ?? '';
        if (rawUuid) {
            const cleanUuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();
            router.replace(`/itinerary/plan/${cleanUuid}`);
        } else {
            router.replace('/itinerary');
        }
    }, [params, router]);

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Opening itinerary…</p>
            </div>
        </div>
    );
}

export default function RedirectItineraryPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <RedirectItineraryContent />
        </Suspense>
    );
}
