'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { resolveImgSrc } from '@/lib/imageService';
import { DEST_IMAGES } from '@/lib/imageMap';
import { getBrowsingSignals } from '@/lib/browsingSignals';

interface SmartRecommendationsProps {
    purpose: string;
    group: string;
    budget: number;
    userId?: string;
    onSelect: (destId: string, destName: string) => void;
    onSelectAndNext?: (destId: string, destName: string) => void;
}

const DEST_IMG_MAP: Record<string, string> = {
    ladakh: DEST_IMAGES.ladakh, manali: DEST_IMAGES.manali, kerala: DEST_IMAGES.kerala,
    goa: DEST_IMAGES.goa, jaipur: DEST_IMAGES.jaipur, varanasi: DEST_IMAGES.varanasi,
    rishikesh: DEST_IMAGES.rishikesh, andaman: DEST_IMAGES.andaman,
    darjeeling: DEST_IMAGES.darjeeling, udaipur: DEST_IMAGES.udaipur,
    coorg: DEST_IMAGES.coorg, hampi: DEST_IMAGES.hampi, shimla: DEST_IMAGES.shimla,
    amritsar: DEST_IMAGES.amritsar, gangtok: DEST_IMAGES.gangtok,
    mysuru: DEST_IMAGES.mysuru, kolkata: DEST_IMAGES.kolkata, mumbai: DEST_IMAGES.mumbai,
    hyderabad: DEST_IMAGES.hyderabad, shillong: DEST_IMAGES.shillong,
};

export default function SmartRecommendations({
    purpose, group, budget, userId, onSelect, onSelectAndNext
}: SmartRecommendationsProps) {
    const [recs, setRecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        if (!purpose || fetched) return;
        setLoading(true);
        setSelected(null);

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || '';
        fetch(`${baseUrl}/api/recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: userId, budget, month: new Date().getMonth() + 1,
                group, purpose, pastDestinations: [],
                tasteVector: JSON.parse(localStorage.getItem('naviigo_taste_vector') || '[]'),
                browsingSignals: getBrowsingSignals(),
            }),
        })
            .then(r => r.json())
            .then(data => { if (data.success) setRecs(data.recommendations.slice(0, 4)); })
            .catch(() => { })
            .finally(() => { setLoading(false); setFetched(true); });
    }, [purpose, group, budget, userId, fetched]);

    if (!purpose) return null;

    const handleSelect = (id: string, name: string) => { onSelect(id, name); setSelected(id); };
    const handleGo = (id: string, name: string) => {
        // Fire and forget taste vector update
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || '';
        fetch(`${baseUrl}/api/taste/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentVector: JSON.parse(localStorage.getItem('naviigo_taste_vector') || '[]'),
                selectedDestId: id,
                purpose
            })
        }).then(r => r.json()).then(d => {
            if (d.success) localStorage.setItem('naviigo_taste_vector', JSON.stringify(d.newVector));
        }).catch(console.error);

        if (onSelectAndNext) onSelectAndNext(id, name);
        else handleSelect(id, name);
    };

    const imgFor = (id: string) => resolveImgSrc(DEST_IMG_MAP[id] || DEST_IMAGES.mumbai, 600);

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full px-3 py-1.5">
                    <span className="text-sm">🧠</span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">AI Picks For You</span>
                </div>
                <span className="text-xs text-zinc-400">Based on your preferences</span>
            </div>

            {/* Skeletons */}
            {loading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-2xl overflow-hidden border-2 border-transparent bg-zinc-100 dark:bg-zinc-800/50">
                            <div className="h-28 relative overflow-hidden">
                                {/* Shimmer animation base */}
                                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-700/50 animate-pulse" />
                                {/* Shimmer wave */}
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_1.5s_infinite]" />
                                {/* Skeleton content */}
                                <div className="absolute bottom-3 left-3 space-y-2">
                                    <div className="h-3 w-20 bg-zinc-300 dark:bg-zinc-600 rounded" />
                                    <div className="h-2 w-32 bg-zinc-300 dark:bg-zinc-600 rounded" />
                                </div>
                            </div>
                            <div className="h-9 bg-zinc-200/80 dark:bg-zinc-800 animate-pulse" />
                        </div>
                    ))}
                </div>
            )}

            {!loading && recs.length > 0 && (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {recs.slice(0, 4).map((rec, i) => (
                            <motion.div key={rec.id}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className={`rounded-2xl overflow-hidden border-2 transition-all ${selected === rec.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-transparent hover:border-zinc-600'}`}>
                                <div className="relative h-28 cursor-pointer group" onClick={() => handleSelect(rec.id, rec.name)}>
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${imgFor(rec.id)})` }} />
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
                                    className="w-full bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white text-[10px] font-bold py-2.5 flex items-center justify-center gap-1 transition-colors">
                                    Select →
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <button onClick={() => setFetched(false)}
                        className="text-xs text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                        🔄 Refresh recommendations
                    </button>
                </div>
            )}
        </div>
    );
}
