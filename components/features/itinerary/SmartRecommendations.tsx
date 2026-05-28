'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { resolveImgSrc } from '@/lib/imageService';
import { DEST_IMAGES } from '@/lib/imageMap';

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

        fetch('/api/recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uid: userId, budget, month: new Date().getMonth() + 1,
                group, purpose, pastDestinations: [],
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
        if (onSelectAndNext) onSelectAndNext(id, name);
        else handleSelect(id, name);
    };

    const imgFor = (id: string) => resolveImgSrc(DEST_IMG_MAP[id] || DEST_IMAGES.mumbai, 600);

    const [topRec, ...rest] = recs;

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
                <div className="space-y-3">
                    <div className="h-36 rounded-2xl bg-zinc-800/50 animate-pulse" />
                    <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-zinc-800/50 animate-pulse" />)}
                    </div>
                </div>
            )}

            {!loading && recs.length > 0 && (
                <div className="space-y-3">
                    {/* Hero — top pick */}
                    {topRec && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            className={`rounded-2xl overflow-hidden border-2 transition-all shadow-lg ${selected === topRec.id ? 'border-emerald-500 shadow-emerald-500/20' : 'border-emerald-500/40 hover:border-emerald-500'}`}>
                            <div className="relative h-36 cursor-pointer group" onClick={() => handleSelect(topRec.id, topRec.name)}>
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                    style={{ backgroundImage: `url(${imgFor(topRec.id)})` }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1">
                                    🏆 Top Pick
                                </div>
                                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-lg">
                                    {topRec.score}% match
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <div className="text-white font-bold text-xl mb-1">{topRec.name}</div>
                                    <div className="flex flex-wrap gap-1">
                                        {topRec.reasons?.slice(0, 2).map((r: string) => (
                                            <span key={r} className="text-[10px] bg-white/20 backdrop-blur text-white rounded-full px-2 py-0.5">
                                                {r.includes('season') ? '🗓️' : r.includes('budget') ? '💰' : '✨'} {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleGo(topRec.id, topRec.name)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm py-3 flex items-center justify-center gap-2 transition-colors">
                                Select {topRec.name} &amp; Continue →
                            </button>
                        </motion.div>
                    )}

                    {/* 3 smaller picks */}
                    <div className="grid grid-cols-3 gap-3">
                        {rest.slice(0, 3).map((rec, i) => (
                            <motion.div key={rec.id}
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (i + 1) * 0.07 }}
                                className={`rounded-2xl overflow-hidden border-2 transition-all ${selected === rec.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' : 'border-transparent hover:border-zinc-600'}`}>
                                <div className="relative h-20 cursor-pointer group" onClick={() => handleSelect(rec.id, rec.name)}>
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${imgFor(rec.id)})` }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                    <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                        {rec.score}%
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-2">
                                        <div className="text-white font-bold text-xs leading-tight">{rec.name}</div>
                                        {rec.reasons?.[0] && (
                                            <div className="text-white/60 text-[9px] mt-0.5 line-clamp-1">
                                                {rec.reasons[0].includes('season') ? '🗓️' : '✨'} {rec.reasons[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => handleGo(rec.id, rec.name)}
                                    className="w-full bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold py-2 flex items-center justify-center gap-1 transition-colors">
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
