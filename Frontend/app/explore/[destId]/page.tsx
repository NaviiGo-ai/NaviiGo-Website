'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    MapPin, Users, Compass, Link2, Heart, ArrowRight, Loader2, Sparkles, AlertTriangle,
    MessageSquare, Camera, Utensils
} from 'lucide-react';
import { trackDeepDiveVibe, startCityView, flushCityView } from '@/lib/browsingSignals';
import ReviewSection from '@/components/features/reviews/ReviewSection';
import { getUpcomingFestivals, type Festival } from '@/lib/festivalCalendar';
import { resolveImgSrc } from '@/lib/imageService';
import type { LocalEvent } from '@/types';


interface DeepDiveData {
    redditConsensus: string;
    hiddenGems: { name: string, desc: string }[];
    touristTrapsToAvoid: { trap: string, betterAlternative: string }[];
    instagramWorthy: { spot: string, bestTime: string }[];
    localFoodMustHaves: { dish: string, where: string }[];
}

export default function DestinationDeepDive() {
    const params = useParams();
    const router = useRouter();
    const destination = decodeURIComponent(params.destId as string);

    const [companion, setCompanion] = useState<string>('Solo');
    const [vibe, setVibe] = useState<string>('Authentic Exploration');
    
    const [data, setData] = useState<DeepDiveData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const festivals = useMemo(() => getUpcomingFestivals(destination), [destination]);
    const [liveEvents, setLiveEvents] = useState<LocalEvent[]>([]);

    const fetchDeepDive = useCallback(async (signal?: AbortSignal) => {
        setLoading(true);
        setError('');
        // Track the vibe selection for personalization
        trackDeepDiveVibe(destination, companion, vibe);
        try {
            const baseUrl = '';
            const res = await fetch(`${baseUrl}/api/explore/deep-dive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination, companion, vibe }),
                signal,
            });
            const json = await res.json();
            if (res.ok) setData(json);
            else setError(json.error || 'Failed to analyze destination.');
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setError(e.message || 'Error fetching destination deep dive');
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    }, [destination, companion, vibe]);

    const fetchEvents = useCallback(async (signal?: AbortSignal) => {
        try {
            const baseUrl = '';
            const res = await fetch(`${baseUrl}/api/explore/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination }),
                signal,
            });
            const json = await res.json();
            if (res.ok && json.events) {
                setLiveEvents(json.events);
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error('Failed to fetch live events:', e);
            }
        }
    }, [destination]);

    useEffect(() => {
        // Track city view start
        startCityView(destination);
        
        const controller = new AbortController();

        // Fetch immediately on mount
        fetchDeepDive(controller.signal);
        fetchEvents(controller.signal);

        // Flush city view and abort pending fetches on unmount or destination change
        return () => {
            controller.abort();
            flushCityView();
        };
    }, [destination, companion, vibe, fetchDeepDive, fetchEvents]);

    return (
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] pb-24 overflow-x-hidden">
            
            {/* HERO HEADER */}
            <div className="relative h-[45vh] sm:h-[50vh] min-h-[360px] sm:min-h-[400px] w-full bg-zinc-900 border-b border-zinc-200 dark:border-white/10 flex items-center justify-center">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" 
                    style={{ backgroundImage: `url('${resolveImgSrc(destination, 1920)}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f5f5f7] dark:from-[#000000] via-transparent to-transparent" />
                
                <div className="relative z-10 text-center px-4 max-w-3xl">
                    <button onClick={() => router.push('/explore')} className="mb-6 flex items-center justify-center gap-2 text-white/70 hover:text-white mx-auto text-sm font-semibold transition-colors">
                        <span>←</span> Back to Explore
                    </button>
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white mb-3 sm:mb-4">
                        {destination}
                    </h1>
                    <p className="text-base sm:text-xl text-white/80 font-serif italic mb-6 sm:mb-8">
                        The Authentic Guide
                    </p>

                    {/* Preference Selectors */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl sm:rounded-2xl inline-flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-center gap-2 shadow-2xl w-full sm:w-auto">
                        <select 
                            value={companion} 
                            onChange={(e) => setCompanion(e.target.value)}
                            className="bg-black/40 text-white border-0 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                        >
                            <option>Solo</option>
                            <option>Couple</option>
                            <option>Group of Friends</option>
                            <option>Family</option>
                        </select>
                        <select 
                            value={vibe} 
                            onChange={(e) => setVibe(e.target.value)}
                            className="bg-black/40 text-white border-0 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
                        >
                            <option>Authentic Exploration</option>
                            <option>Food & Culinary</option>
                            <option>Relaxation & Luxury</option>
                            <option>Budget Backpacking</option>
                        </select>
                        <button
                            onClick={() => fetchDeepDive()} disabled={loading}
                            className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-zinc-200 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Vibe'}
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 -mt-10 relative z-20">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl text-center mb-8 font-semibold">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        <div className="bg-white dark:bg-[#111] h-64 rounded-[2rem] border border-zinc-200 dark:border-white/10" />
                        <div className="bg-white dark:bg-[#111] h-64 rounded-[2rem] border border-zinc-200 dark:border-white/10" />
                        <div className="bg-white dark:bg-[#111] h-96 rounded-[2rem] border border-zinc-200 dark:border-white/10 md:col-span-2" />
                    </div>
                ) : data ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* REDDIT CONSENSUS */}
                        <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#1a1400] dark:to-[#110d00] border border-orange-100 dark:border-orange-900/30 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-orange-900 dark:text-orange-400">The Word on the Street</h2>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-orange-600/70 dark:text-orange-500/50">Reddit & Travel Blog Consensus</p>
                                </div>
                            </div>
                            <p className="text-lg md:text-xl font-medium text-orange-800 dark:text-orange-200/90 leading-relaxed">
                                &quot;{data.redditConsensus}&quot;
                            </p>
                        </div>

                        {/* HIDDEN GEMS */}
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="w-6 h-6 text-emerald-500" />
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Hidden Gems</h3>
                            </div>
                            <div className="space-y-5 flex-1">
                                {(data?.hiddenGems ?? []).map((gem, i) => (
                                    <div key={i} className="group">
                                        <h4 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-emerald-500 transition-colors">{gem.name}</h4>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{gem.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* TOURIST TRAPS */}
                        <div className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <AlertTriangle className="w-6 h-6 text-rose-500" />
                                <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-400">Skip the Traps</h3>
                            </div>
                            <div className="space-y-6 flex-1">
                                {(data?.touristTrapsToAvoid ?? []).map((trap, i) => (
                                    <div key={i} className="bg-white dark:bg-black/40 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold mb-1 line-through opacity-70 flex-wrap">
                                            <span className="text-sm">❌</span> {trap.trap}
                                        </div>
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mt-2 flex-wrap">
                                            <span className="text-base">✅</span> {trap.betterAlternative}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FOOD */}
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Utensils className="w-6 h-6 text-amber-500" />
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Local Bites</h3>
                            </div>
                            <div className="space-y-4">
                                {(data?.localFoodMustHaves ?? []).map((food, i) => (
                                    <div key={i} className="flex gap-4 items-start border-b border-zinc-100 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-zinc-900 dark:text-white">{food.dish}</h4>
                                            <p className="text-xs font-semibold tracking-wide text-zinc-500 mt-1 uppercase">📍 {food.where}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* INSTA SPOTS */}
                        <div className="bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Camera className="w-6 h-6 text-blue-500" />
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">Aesthetic Spots</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {(data?.instagramWorthy ?? []).map((spot, i) => (
                                    <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 flex flex-col gap-2 hover:shadow-md transition-shadow cursor-default">
                                        <div className="font-bold text-sm text-zinc-900 dark:text-white">{spot.spot}</div>
                                        <div className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-2 py-1.5 rounded w-fit leading-relaxed">
                                            {spot.bestTime}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : null}

                {/* LIVE LOCAL EVENTS */}
                {liveEvents.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-emerald-500" /> Live Local Events
                                </h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Gigs, flea markets, and pop-ups happening in {destination}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {liveEvents.map((event, i) => (
                                <a key={i} href={event.link} target="_blank" rel="noopener noreferrer" className="group block bg-white dark:bg-[#111] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div className="h-32 w-full relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                        <Image src={event.thumbnail} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                            {event.date.when}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-2 mb-2 group-hover:text-emerald-500 transition-colors">{event.title}</h4>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 truncate">
                                            <MapPin className="w-3 h-3" /> {event.venue?.name || 'Local Venue'}
                                        </p>
                                        <div className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:gap-2 transition-all">
                                            Get Tickets <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* CALL TO ACTION */}
                {data && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="mt-12 bg-blue-600 dark:bg-blue-600 rounded-[2rem] p-10 text-center shadow-xl shadow-blue-500/20"
                    >
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to lock it in?</h2>
                        <p className="text-blue-100 mb-8 max-w-xl mx-auto font-medium">
                            Take these authentic insights and instantly generate a fully mapped day-by-day itinerary tailored precisely to you.
                        </p>
                        <button 
                            onClick={() => router.push(`/itinerary?destination=${encodeURIComponent(destination)}`)}
                            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-base shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                        >
                            Build My Itinerary <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                )}

                {/* Festival Banner */}
                {festivals.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                            🎉 Upcoming Festivals
                        </h3>
                        <div className="space-y-3">
                            {festivals.map((f, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-2xl">{f.emoji}</span>
                                    <div>
                                        <div className="font-semibold text-sm text-slate-900 dark:text-white">{f.name}</div>
                                        <p className="text-xs text-slate-500">{f.description}</p>
                                        {f.travelImpact.warnings.length > 0 && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">⚠️ {f.travelImpact.warnings[0]}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Reviews Section */}
                <ReviewSection destId={destination.toLowerCase().replace(/\s+/g, '')} destName={destination} />

            </div>
        </div>
    );
}
