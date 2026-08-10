'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SetupWizard from '@/components/features/itinerary/SetupWizard';

/**
 * /itinerary
 *
 * Entry point — shows the SetupWizard.
 * When the wizard completes, SetupWizard generates a UUID and navigates
 * to /itinerary/[uuid] which handles loading → result → day view.
 *
 * Legacy support:
 *   ?shareId=xxx → redirect to /itinerary/xxx (UUID routes use the same Firestore collection)
 *   ?load=xxx    → redirect to /itinerary/xxx
 *   ?new=true    → clear state and show fresh wizard (already handled internally)
 */
function ItineraryPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Redirect legacy share/load links to UUID-based routes
    useEffect(() => {
        const shareId = searchParams.get('shareId');
        const loadId = searchParams.get('load');
        if (shareId) {
            router.replace(`/itinerary/${shareId}`);
            return;
        }
        if (loadId) {
            router.replace(`/itinerary/${loadId}`);
            return;
        }
    }, [searchParams, router]);

    // No-op: SetupWizard now handles navigation itself via router.push('/itinerary/[uuid]')
    const handleDone = () => { };

    return <SetupWizard onDone={handleDone} />;
}

export default function ItineraryPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ItineraryPageContent />
        </Suspense>
    );
}
