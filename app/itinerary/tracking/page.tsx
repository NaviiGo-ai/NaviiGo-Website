'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrackingPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/itinerary/ongoing');
    }, [router]);

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20 sm:pt-24 flex items-center justify-center">
            <p className="text-zinc-500">Redirecting...</p>
        </div>
    );
}
