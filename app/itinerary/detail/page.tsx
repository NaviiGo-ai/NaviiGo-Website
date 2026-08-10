"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { DEST_DATA, FALLBACK_DEST, DESTINATIONS } from "@/app/itinerary/data";
import { resolveImgSrc } from '@/lib/imageService';

function DetailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const destId = searchParams.get('dest') || '';
    const type = searchParams.get('type') || '';
    const encodedName = searchParams.get('name') || '';
    const name = decodeURIComponent(encodedName);

    const data = DEST_DATA[destId] ?? FALLBACK_DEST;
    const destInfo = DESTINATIONS.find(d => d.id === destId);
    
    const isFromLocal = searchParams.get('fromLocal') === 'true';
    const [itemData, setItemData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        let dataToSet = null;

        // Check localStorage first if it's a dynamically generated item
        if (isFromLocal) {
            try {
                const localStr = localStorage.getItem('navii_detail_item');
                if (localStr) dataToSet = JSON.parse(localStr);
            } catch (e) {
                console.error('Failed to parse local item data', e);
            }
        }

        // Fallback to hardcoded DEST_DATA
        if (!dataToSet) {
            if (type === 'attraction') {
                dataToSet = data.highlights?.find(h => h.name === name);
            } else if (type === 'restaurant') {
                dataToSet = data.restaurants?.find(r => r.name === name);
            } else if (type === 'hotel') {
                dataToSet = data.hotels?.find(h => h.name === name);
            }
        }
        
        setItemData(dataToSet);
    }, [isFromLocal, type, name, data]);

    if (!mounted) return null; // Avoid hydration mismatch on initial render

    if (!itemData) {
        return (
            <div className="min-h-screen pt-20 sm:pt-32 flex flex-col items-center justify-center text-zinc-500">
                <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Item not found</h2>
                <button onClick={() => router.back()} className="px-6 py-2 bg-emerald-600 text-white rounded-full">Go Back</button>
            </div>
        );
    }

    const bgUrl = resolveImgSrc(itemData.img, 1600);

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pb-20">
            <div className="relative h-[50vh] min-h-[400px]">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f7f8fc] dark:from-[#0a0a0f] via-black/40 to-black/20" />

                {/* Top Navbar */}
                <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10 pt-24">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors text-white shadow-xl">←</button>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-10 left-0 right-0 px-6 md:px-12 max-w-5xl mx-auto z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-emerald-500 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg">{type}</span>
                        <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full flex gap-1 items-center">📍 {destInfo?.name}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-2 leading-tight">{itemData.name}</h1>
                    {type === 'restaurant' && <div className="text-emerald-400 font-bold text-xl flex items-center gap-2">⭐ {itemData.rating} • {itemData.cuisine}</div>}
                    {type === 'hotel' && <div className="text-emerald-400 font-bold text-xl flex items-center gap-2">⭐ {itemData.rating} • {itemData.type}</div>}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 md:px-12 -mt-4 relative z-20">
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-xl border border-zinc-100 dark:border-white/5 flex flex-col md:flex-row gap-10">

                    <div className="flex-1 space-y-8">
                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">About</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">{itemData.desc}</p>
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                            {type === 'attraction' && (
                                <>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Best Months</div>
                                        <div className="font-semibold text-zinc-900 dark:text-white text-lg">📅 {itemData.bestMonths}</div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Walking Activity</div>
                                        <div className="font-semibold text-zinc-900 dark:text-white text-lg capitalize">🚶‍♂️ {itemData.walking}</div>
                                    </div>
                                </>
                            )}
                            {type === 'restaurant' && (
                                <>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Price Range</div>
                                        <div className="font-semibold text-zinc-900 dark:text-white text-lg">💰 {itemData.priceRange}</div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Must Try</div>
                                        <div className="font-semibold text-zinc-900 dark:text-white text-lg">🍽️ {itemData.mustTry}</div>
                                    </div>
                                </>
                            )}
                            {type === 'hotel' && (
                                <>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Price</div>
                                        <div className="font-semibold text-zinc-900 dark:text-white text-lg">💳 {itemData.priceRange}</div>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-1">Property Type</div>
                                        <div className="font-semibold text-zinc-900 dark:text-white text-lg">🏨 {itemData.type}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        {type === 'attraction' && itemData.tags && (
                            <section>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-wider">Known For</h3>
                                <div className="flex flex-wrap gap-2">
                                    {itemData.tags.map((t: string) => <span key={t} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full text-sm font-medium">{t}</span>)}
                                </div>
                            </section>
                        )}

                        {type === 'hotel' && itemData.amenities && (
                            <section>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 uppercase tracking-wider">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {itemData.amenities.map((a: string) => <span key={a} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium">✓ {a}</span>)}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right column: Action / CTA */}
                    <div className="md:w-72 lg:w-80 space-y-6">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-white/5 space-y-4">
                            <h3 className="font-bold text-zinc-900 dark:text-white text-xl">Add to your trip?</h3>
                            <p className="text-sm text-zinc-500">Go back to the itinerary planner and you can select this spot from the location editor.</p>
                            <button onClick={() => router.back()} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
                                Back to Plan
                            </button>
                        </div>

                        <div className="aspect-square rounded-3xl overflow-hidden border border-zinc-100 dark:border-white/5 relative bg-zinc-200 dark:bg-zinc-800">
                            {/* Static map representation */}
                            <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/12/2928/1749.png')] bg-cover bg-center opacity-60 dark:opacity-40" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center z-10 text-xl shadow-black/20">📍</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20 sm:pt-32 text-center">Loading details...</div>}>
            <DetailContent />
        </Suspense>
    );
}
