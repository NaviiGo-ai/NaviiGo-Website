'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navigation, MapPin, Calendar, Clock, ChevronRight, Plane, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getUserItineraries } from '@/lib/firestore';
import type { SavedItineraryDoc } from '@/lib/firestoreSchema';

interface TripData {
    id: string;
    destination: string;
    status: string;
    progress: number;
    startDate: string;
    endDate: string;
    currentActivity: string;
    nextActivity: string;
    image: string;
    totalActivities: number;
    completedActivities: number;
}

function mapItineraryToOngoing(itin: SavedItineraryDoc): TripData | null {
    const form = itin.form as any;
    const startDate = form.startDate as string;
    if (!startDate) return null;

    const days = Number(form.days) || 3;
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);
    const now = new Date();

    // Only show trips that are currently happening
    if (now < start || now > end) return null;

    const dayNum = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / 86400000) + 1);
    const progress = Math.min(100, Math.round((dayNum / days) * 100));

    return {
        id: itin.id,
        destination: itin.destName || 'Unknown Destination',
        status: `Day ${Math.min(dayNum, days)} of ${days}`,
        progress,
        startDate,
        endDate: end.toISOString().split('T')[0],
        currentActivity: `Exploring ${itin.destName || 'destination'}`,
        nextActivity: 'Continue your itinerary',
        image: `https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80`,
        totalActivities: days * 6,
        completedActivities: Math.round((progress / 100) * days * 6),
    };
}

export default function OngoingTripsPage() {
    const { user, signInWithGoogle } = useAuth();
    const [trips, setTrips] = useState<TripData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        getUserItineraries(user.uid).then(itineraries => {
            const ongoing = itineraries
                .map(mapItineraryToOngoing)
                .filter((t): t is TripData => t !== null);
            setTrips(ongoing);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user?.uid]);

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20 sm:pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Ongoing Trips</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {trips.length > 0 ? `${trips.length} active journey${trips.length > 1 ? 's' : ''}` : 'Your currently active journeys'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {!user && (
                    <div className="text-center py-20">
                        <LogIn className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Sign in to view ongoing trips</h3>
                        <p className="text-sm text-zinc-500 mb-6">Your trips sync across all your devices.</p>
                        <button onClick={signInWithGoogle} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors">Sign In with Google</button>
                    </div>
                )}

                {user && loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {user && !loading && trips.length === 0 && (
                    <div className="text-center py-20">
                        <Plane className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No ongoing trips</h3>
                        <p className="text-sm text-zinc-500 mb-6">Trips that fall on today&apos;s date will appear here automatically.</p>
                        <Link href="/itinerary?new=true" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors">Create Itinerary</Link>
                    </div>
                )}

                {user && !loading && trips.length > 0 && (
                    <div className="space-y-6">
                        {trips.map((trip, i) => (
                            <motion.div
                                key={trip.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-lg transition-all"
                            >
                                <div className="flex flex-col md:flex-row">
                                    <div className="relative md:w-72 h-48 md:h-auto shrink-0">
                                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${trip.image})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent md:bg-gradient-to-t" />
                                        <div className="absolute bottom-4 left-4">
                                            <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{trip.destination}</h2>
                                                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">{trip.status}</span>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                                                <span>{trip.completedActivities} of {trip.totalActivities} activities done</span>
                                                <span className="font-bold text-emerald-600">{trip.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${trip.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/20">
                                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">📍 Current Activity</div>
                                                <div className="text-sm font-semibold text-zinc-900 dark:text-white">{trip.currentActivity}</div>
                                            </div>
                                            <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-3 border border-purple-100 dark:border-purple-500/20">
                                                <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">⏭️ Next Up</div>
                                                <div className="text-sm font-semibold text-zinc-900 dark:text-white">{trip.nextActivity}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <Link href={`/itinerary?load=${trip.id}`} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-center py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                                <MapPin className="w-4 h-4" /> View Itinerary
                                            </Link>
                                            <Link href="/bookings" className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1">
                                                Bookings <ChevronRight className="w-4 h-4" />
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
