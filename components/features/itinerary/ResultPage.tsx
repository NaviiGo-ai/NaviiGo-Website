'use client';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveItinerary } from '@/lib/savedItineraries';
import { saveSharedItinerary, listenToItinerary } from '@/lib/firestore';
import {
    PURPOSES, DESTINATIONS, GROUP_SIZES,
    DEST_DATA, FALLBACK_DEST, CROWD_COLOR, WALK_COLOR,
    type CrowdLevel,
} from '@/app/itinerary/data';
import { Badge, genShareId } from './helpers';
import ShareDropdown from './ShareDropdown';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });
const VideoCard = dynamic(() => import('@/components/shared/VideoCard'), { ssr: false });

interface ResultPageProps {
    form: Record<string, unknown>;
    onDayView: () => void;
    onReset: () => void;
}

export default function ResultPage({ form, onDayView, onReset }: ResultPageProps) {
    const router = useRouter();
    const [isSaved, setIsSaved] = useState(false);
    const [collaborators, setCollaborators] = useState(1);
    const [isSharing, setIsSharing] = useState(false);
    const [hiddenGems, setHiddenGems] = useState<any[]>([]);
    const destId = form.destination as string, destName = form.destName as string;
    const purpose = form.purpose as string, group = form.group as string;
    const displayMonth = form.startDate ? new Date(form.startDate as string).toLocaleString('en-US', { month: 'short' }) : 'Jan';
    const data = DEST_DATA[destId] ?? FALLBACK_DEST;
    const destInfo = DESTINATIONS.find(d => d.id === destId);
    const purposeLabel = PURPOSES.find(p => p.id === purpose)?.label ?? purpose;
    const groupLabel = GROUP_SIZES.find(g => g.id === group)?.label ?? group;
    const weatherForMonth = data.weather[displayMonth] ?? data.weather['Jan'];

    useEffect(() => {
        if (data.mapCenter) {
            fetch(`/api/places?lat=${data.mapCenter.lat}&lng=${data.mapCenter.lng}&type=tourist_attraction&radius=5000`)
                .then(r => r.json())
                .then(d => setHiddenGems(d.places?.slice(0, 4) ?? []))
                .catch(() => { });
        }
    }, [destId]);

    const mapPins = useMemo(() => data.highlights.filter(h => h.lat).map((h, i) => ({
        lat: h.lat!, lng: h.lng!, label: h.name, number: i + 1, img: h.img,
    })), [data]);

    const handleShare = useCallback(async () => {
        setIsSharing(true);
        try {
            const id = genShareId();
            await saveSharedItinerary(id, { form, customPlans: [], destName });
            const url = `${window.location.origin}/itinerary?shareId=${id}`;
            await navigator.clipboard.writeText(url);
            listenToItinerary(id, (data) => setCollaborators(data.collaborators ?? 1), () => { });
            alert(`✅ Share link copied to clipboard!\n\nAnyone with this link can view your live itinerary.`);
        } catch (e) {
            const url = `${window.location.origin}/itinerary?load=${destId}`;
            navigator.clipboard.writeText(url);
            alert('Link copied! (Offline mode — link works only for you)');
        }
        setIsSharing(false);
    }, [form, destName, destId]);

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
            <div className="sticky top-20 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-4 py-3 flex items-center gap-4">
                <button onClick={onReset} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-600 dark:text-zinc-300">←</button>
                <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar text-xs text-zinc-500">
                    <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Where</div><div className="font-semibold text-zinc-900 dark:text-white">{destName}</div></div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                    <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Dates</div><div className="font-semibold text-zinc-900 dark:text-white">{form.startDate ? new Date(form.startDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} - {form.endDate ? new Date(form.endDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div></div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                    <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Preferences</div><div className="font-semibold text-zinc-900 dark:text-white truncate max-w-[160px]">{groupLabel} · {purposeLabel}</div></div>
                </div>
                <div className="flex items-center gap-2">
                    <ShareDropdown onCopyLink={handleShare} destName={destName} isSharing={isSharing} collaborators={collaborators} />
                    <button onClick={() => { saveItinerary(destId, destName, form); setIsSaved(true); }} disabled={isSaved}
                        className={`flex px-4 py-1.5 rounded-full text-xs font-semibold items-center gap-1.5 transition-colors ${isSaved ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'}`}>
                        {isSaved ? '✓ Saved' : '💾 Save'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
                {/* Hero */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden mb-8 relative">
                    <div className="relative h-64 md:h-80 flex flex-col justify-end p-6 md:p-10">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${destInfo?.img}?auto=format&fit=crop&w=1400&q=80)` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/20">
                                        {form.days as number} Days • {groupLabel}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{destName}</h1>
                                <p className="text-white/90 text-sm md:text-base max-w-2xl">{data.description}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                                <button onClick={onDayView} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transition-all px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95">
                                    <span className="text-lg">✨</span> View Full Day-by-Day Itinerary
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border-t border-white/10 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2"><span>💰</span><span className="text-[10px] font-bold uppercase tracking-wider">Avg. Cost / day</span></div>
                                <div className="font-bold text-lg text-zinc-900 dark:text-white">{data.avgCost}</div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="flex items-center gap-2 text-amber-500 mb-2"><span>🌤️</span><span className="text-[10px] font-bold uppercase tracking-wider">Weather ({displayMonth})</span></div>
                                <div className="font-bold text-lg text-zinc-900 dark:text-white">{weatherForMonth}</div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2"><span>👥</span><span className="text-[10px] font-bold uppercase tracking-wider">Crowd Levels</span></div>
                                <Badge label={data.crowdLevel} colorClass={CROWD_COLOR[data.crowdLevel]} />
                                <div className="text-xs text-zinc-500 mt-2">{data.crowdNote}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-10">
                        {/* Budget Tracker */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><span>💰</span> Trip Budget Progress</h2>
                                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">Budget: ₹{(form.budget as number).toLocaleString('en-IN')}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
                                <div className="flex justify-between text-sm mb-3">
                                    <span className="text-zinc-500 font-medium tracking-wide text-xs uppercase">Est. Base Cost</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{data.avgCost} / day</span>
                                </div>
                                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-emerald-500" />
                                    <motion.div initial={{ width: 0 }} animate={{ width: '20%' }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} className="h-full bg-amber-400" />
                                </div>
                                <div className="flex justify-between items-center text-xs text-zinc-400 mt-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Travel & Stay</span>
                                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Food & Leisure</span>
                                    </div>
                                    <span className="font-medium text-emerald-600">Well Within Budget</span>
                                </div>
                            </div>
                        </div>

                        {/* Transport Logistics */}
                        {data.logistics && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><span>✈️</span> How to Get There</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl shrink-0">🛫</div>
                                        <div><h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Flights</h4><p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{data.logistics.flights}</p></div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">🚆</div>
                                        <div><h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Trains</h4><p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{data.logistics.trains}</p></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Highlights */}
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🏆 Top Highlights</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.highlights.map((a, i) => (
                                    <motion.div key={a.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                        onClick={() => router.push(`/itinerary/detail?type=attraction&dest=${destId}&name=${encodeURIComponent(a.name)}`)}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                        <div className="relative h-36">
                                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${a.img}?auto=format&fit=crop&w=500&q=70)` }} />
                                            <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{i + 1}</div>
                                            <div className="absolute bottom-2 left-2 flex gap-1">{a.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-black/50 text-white backdrop-blur px-2 py-0.5 rounded-full font-medium">{t}</span>)}</div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">{a.name}</h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{a.desc}</p>
                                            <div className="flex gap-2 text-xs flex-wrap">
                                                <span className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2 py-1">📅 {a.bestMonths}</span>
                                                <Badge label={a.walking} colorClass={WALK_COLOR[a.walking]} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Video Guide */}
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🎬 Video Guide</h2>
                            <VideoCard destId={destId} destName={destName} />
                        </div>

                        {/* Restaurants */}
                        {data.restaurants && data.restaurants.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🍽️ Cuisine & Dining</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.restaurants.map((r, i) => (
                                        <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            onClick={() => router.push(`/itinerary/detail?type=restaurant&dest=${destId}&name=${encodeURIComponent(r.name)}`)}
                                            className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                            <div className="relative h-32">
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${r.img}?auto=format&fit=crop&w=500&q=70)` }} />
                                                <div className="absolute bottom-2 left-2 flex gap-1"><span className="text-[10px] bg-black/60 text-white backdrop-blur px-2 py-0.5 rounded-full font-medium">{r.cuisine}</span></div>
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{r.name}</h3>
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">⭐ {r.rating}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{r.desc}</p>
                                                <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 inline-block px-1.5 py-0.5 rounded">Must Try: {r.mustTry}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels */}
                        {data.hotels && data.hotels.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🏨 Stay Options</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.hotels.map((h, i) => (
                                        <motion.div key={h.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            onClick={() => router.push(`/itinerary/detail?type=hotel&dest=${destId}&name=${encodeURIComponent(h.name)}`)}
                                            className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                            <div className="relative h-32">
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${h.img}?auto=format&fit=crop&w=500&q=70)` }} />
                                                <div className="absolute bottom-2 left-2 flex gap-1"><span className="text-[10px] bg-black/60 text-white backdrop-blur px-2 py-0.5 rounded-full font-medium">{h.type}</span></div>
                                                <div className="absolute top-2 right-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur px-1.5 py-0.5 rounded">{h.priceRange}</div>
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{h.name}</h3>
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">⭐ {h.rating}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{h.desc}</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {h.amenities.slice(0, 3).map(a => <span key={a} className="text-[9px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded">{a}</span>)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hidden Gems */}
                        {hiddenGems.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">💎 Local Hidden Gems</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {hiddenGems.map((g, i) => (
                                        <motion.div key={g.placeId || g.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                            <div className="flex gap-3">
                                                {g.photo && <img src={g.photo} alt={g.name} className="w-16 h-16 rounded-xl object-cover" />}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">{g.name}</h3>
                                                    <div className="text-xs text-emerald-600 font-medium mb-1">{g.type}</div>
                                                    <div className="text-xs text-zinc-500">{g.vicinity}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sticky Map */}
                    <div className="lg:w-[400px] lg:sticky lg:top-[140px] lg:self-start">
                        <div className="h-[350px] lg:h-[500px] rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <ItineraryMap pins={mapPins} center={data.mapCenter} zoom={10} className="w-full h-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
