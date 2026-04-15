'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { History, Star, MapPin, Calendar, Camera, TrendingUp, Plane, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getUserItineraries } from '@/lib/firestore';
import type { SavedItineraryDoc } from '@/lib/firestoreSchema';

interface PastTrip {
    id: string;
    destination: string;
    dates: string;
    duration: string;
    group: string;
    image: string;
}

function mapItineraryToPast(itin: SavedItineraryDoc): PastTrip | null {
    const form = itin.form as any;
    const startDate = form.startDate as string;
    if (!startDate) return null;

    const start = new Date(startDate);
    const now = new Date();
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / 86400000);
    const days = Number(form.days) || 3;

    // Only show past trips (trip has ended)
    if (daysUntil + days > 0) return null;

    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);

    return {
        id: itin.id,
        destination: itin.destName || 'Unknown',
        dates: `${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        duration: `${days} days`,
        group: form.group || 'Solo',
        image: `https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80`,
    };
}

export default function TripHistoryPage() {
    const { user, signInWithGoogle } = useAuth();
    const [trips, setTrips] = useState<PastTrip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }
        getUserItineraries(user.uid).then(itineraries => {
            const past = itineraries
                .map(mapItineraryToPast)
                .filter((t): t is PastTrip => t !== null);
            setTrips(past);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user?.uid]);

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                            <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Trip History</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {trips.length > 0 ? `${trips.length} past adventure${trips.length > 1 ? 's' : ''}` : 'Relive your past adventures'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Bar — only show when there are past trips */}
                {trips.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                        {[
                            { label: 'Total Trips', value: trips.length, icon: '🗺️', color: 'text-blue-600 dark:text-blue-400' },
                            { label: 'Destinations', value: new Set(trips.map(t => t.destination)).size, icon: '📍', color: 'text-emerald-600 dark:text-emerald-400' },
                            { label: 'Total Days', value: trips.reduce((sum, t) => sum + parseInt(t.duration), 0), icon: '📅', color: 'text-purple-600 dark:text-purple-400' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 text-center shadow-sm">
                                <div className="text-2xl mb-1">{stat.icon}</div>
                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {!user && (
                    <div className="text-center py-20">
                        <LogIn className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Sign in to view your trip history</h3>
                        <p className="text-sm text-zinc-500 mb-6">Your past trips are saved to the cloud.</p>
                        <button onClick={signInWithGoogle} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors">Sign In with Google</button>
                    </div>
                )}

                {user && loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {user && !loading && trips.length === 0 && (
                    <div className="text-center py-20">
                        <Plane className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No past trips yet</h3>
                        <p className="text-sm text-zinc-500 mb-6">Your completed trips will appear here automatically.</p>
                        <Link href="/itinerary" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors">Plan Your First Trip</Link>
                    </div>
                )}

                {user && !loading && trips.length > 0 && (
                    <div className="space-y-6">
                        {trips.map((trip, i) => (
                            <motion.div
                                key={trip.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.1 }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden group hover:shadow-lg transition-all"
                            >
                                <div className="flex flex-col md:flex-row">
                                    <div className="relative md:w-64 h-48 md:h-auto shrink-0 overflow-hidden">
                                        <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${trip.image})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
                                    </div>
                                    <div className="flex-1 p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{trip.destination}</h2>
                                                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {trip.dates}</span>
                                                    <span>{trip.duration}</span>
                                                    <span>{trip.group}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <Link href={`/itinerary?load=${trip.id}`} className="flex-1 bg-amber-500 hover:bg-amber-400 text-white text-center py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                                <TrendingUp className="w-4 h-4" /> View Trip
                                            </Link>
                                            <Link href="/itinerary" className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                                Re-plan
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
