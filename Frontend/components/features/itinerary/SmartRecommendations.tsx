'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { resolveImgSrc } from '@/lib/imageService';
import PlaceImage from '@/components/shared/PlaceImage';
import { getPersonalizationTaste, savePersonalizationTaste } from '@/lib/firestore';
import { getBrowsingSignals } from '@/lib/browsingSignals';

interface SmartRecommendationsProps {
    purpose: string;
    group: string;
    budget: number;
    userId?: string;
    onSelect: (destId: string, destName: string) => void;
    onSelectAndNext?: (destId: string, destName: string) => void;
}

const DEST_IMG_MAP: Record<string, string> = {};

export default function SmartRecommendations({
    purpose, group, budget, userId, onSelect, onSelectAndNext
}: SmartRecommendationsProps) {
    const [recs, setRecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        if (!purpose) return;
        setLoading(true);
        setSelected(null);

        const fetchRecs = async () => {
            const baseUrl = '';
            let tasteVector: number[] = [];
            if (userId) {
                const taste = await getPersonalizationTaste(userId);
                tasteVector = taste?.vector ?? [];
            }
            try {
                const browsingSignals = await getBrowsingSignals();
                const resp = await fetch(`${baseUrl}/api/recommendations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: userId ?? '',
                        budget,
                        month: new Date().getMonth() + 1,
                        group,
                        purpose,
                        pastDestinations: [],
                        tasteVector,
                        browsingSignals,
                    }),
                });
                const data = await resp.json();
                if (data.success) {
                    setRecs(data.recommendations.slice(0, 4));
                }
            } catch (err) {
                console.error('Failed to fetch recommendations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecs();
    }, [purpose, group, budget, userId, refreshKey]);

    if (!purpose) return null;

    const handleSelect = (id: string, name: string) => { onSelect(id, name); setSelected(id); };
    const handleGo = (id: string, name: string) => {
        // Fire and forget taste vector update
        const updateTaste = async () => {
            try {
                const { getPersonalizationTaste, savePersonalizationTaste } = await import('@/lib/firestore');
                const currentTaste = userId ? await getPersonalizationTaste(userId) : null;
                const currentVector = currentTaste?.vector || [];

                const baseUrl = '';
                const r = await fetch(`${baseUrl}/api/taste/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentVector,
                        selectedDestId: id,
                        purpose
                    })
                });
                const d = await r.json();
                if (d.success && userId) {
                    await savePersonalizationTaste(userId, d.newVector);
                }
            } catch (err) {
                console.error(err);
            }
        };
        updateTaste();

        if (onSelectAndNext) onSelectAndNext(id, name);
        else handleSelect(id, name);
    };

    const imgFor = (id: string) => resolveImgSrc(DEST_IMG_MAP[id] || '', 600);

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-marigold-500/10 to-saffron-500/10 border border-marigold-200 dark:border-marigold-500/20 rounded-full px-3 py-1.5">
                    <span className="text-sm">🧠</span>
                    <span className="text-xs font-bold text-marigold-700 dark:text-marigold-400 uppercase tracking-wider">AI Picks For You</span>
                </div>
                <span className="text-xs text-muted-400">Based on your preferences</span>
            </div>

            {/* Skeletons */}
            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-2xl overflow-hidden border-2 border-transparent bg-muted-100 dark:bg-muted-800/50">
                            <div className="h-28 relative overflow-hidden">
                                {/* Shimmer animation base */}
                                <div className="absolute inset-0 bg-muted-200 dark:bg-muted-700/50 animate-pulse" />
                                {/* Shimmer wave */}
                                <div className="absolute inset-0 -tranmuted-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
                                {/* Skeleton content */}
                                <div className="absolute bottom-3 left-3 space-y-2">
                                    <div className="h-3 w-20 bg-muted-300 dark:bg-muted-600 rounded" />
                                    <div className="h-2 w-32 bg-muted-300 dark:bg-muted-600 rounded" />
                                </div>
                            </div>
                            <div className="h-9 bg-muted-200/80 dark:bg-muted-800 animate-pulse" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && recs.length > 0 && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {recs.slice(0, 4).map((rec, i) => (
                            <motion.div key={rec.id}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className={`rounded-2xl overflow-hidden border-2 transition-all ${selected === rec.id ? 'border-jungle-green-500 shadow-lg shadow-jungle-green-500/10' : 'border-transparent hover:border-muted-600'}`}>
                                <div className="relative h-28 cursor-pointer group" onClick={() => handleSelect(rec.id, rec.name)}>
                                    <PlaceImage
                                        name={rec.name}
                                        asBackground
                                        className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
                                        width={600}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                    
                                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-white/10 shadow-sm">
                                        {i + 1}
                                    </div>

                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        {rec.score}%
                                    </div>

                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <div className="text-white font-bold text-sm leading-tight mb-0.5">{rec.name}</div>
                                        {rec.reasons?.[0] && (
                                            <div className="text-white/70 text-[9px] line-clamp-1">
                                                {rec.reasons[0].includes('season') ? '🗓️' : '✨'} {rec.reasons[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => handleGo(rec.id, rec.name)}
                                    className="w-full bg-muted-900 dark:bg-muted-800 hover:bg-muted-700 active:bg-muted-600 text-white text-[10px] font-bold py-2.5 flex items-center justify-center gap-1 transition-colors">
                                    Select →
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <button onClick={() => setRefreshKey(k => k + 1)}
                        className="text-xs text-muted-400 hover:text-muted-300 flex items-center gap-1 transition-colors">
                        🔄 Refresh recommendations
                    </button>
                </div>
            )}
        </div>
    );
}
