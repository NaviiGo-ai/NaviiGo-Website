'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Calendar, Users, Sparkles, CheckCircle, Circle, Plane, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import PlaceImage from '@/components/shared/PlaceImage';
import { useAuth } from '@/lib/AuthContext';
import { getUserItineraries } from '@/lib/firestore';
import type { SavedItineraryDoc } from '@/lib/firestoreSchema';

interface UpcomingTrip {
    id: string;
    destination: string;
    startDate: string;
    endDate: string;
    daysUntil: number;
    group: string;
    budget: string;
    image: string;
    preparedness: number;
    checklist: { item: string; done: boolean }[];
}

function mapItineraryToUpcoming(itin: SavedItineraryDoc): UpcomingTrip | null {
    const form = itin.form as any;
    const startDate = form.startDate as string;
    if (!startDate) return null;

    const start = new Date(startDate);
    const now = new Date();
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / 86400000);

    // Only show future trips
    if (daysUntil < 0) return null;

    const days = Number(form.days) || 3;
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);

    return {
        id: itin.id,
        destination: itin.destName || 'Unknown',
        startDate,
        endDate: end.toISOString().split('T')[0],
        daysUntil,
        group: form.group || 'Solo',
        budget: `₹${Number(form.budget || 15000).toLocaleString('en-IN')}`,
        image: `https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80`,
        preparedness: 20,
        checklist: [
            { item: 'Itinerary created', done: true },
            { item: 'Book transport', done: false },
            { item: 'Reserve accommodation', done: false },
            { item: 'Pack essentials', done: false },
        ],
    };
}

export default function UpcomingTripsPage() {
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const [trips, setTrips] = useState<UpcomingTrip[] | null>(null);

    useEffect(() => {
        if (!user?.uid) return;
        let active = true;
        getUserItineraries(user.uid).then(itineraries => {
            if (!active) return;
            const upcoming = itineraries
                .map(mapItineraryToUpcoming)
                .filter((t): t is UpcomingTrip => t !== null)
                .sort((a, b) => a.daysUntil - b.daysUntil);
            setTrips(upcoming);
        }).catch(() => {
            if (active) setTrips([]);
        });
        return () => { active = false; };
    }, [user?.uid]);

    const loading = authLoading || (!!user && trips === null);
    const tripList = trips ?? [];

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20 sm:pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-muted-900 dark:text-white">Upcoming Trips</h1>
                            <p className="text-sm text-muted-500 dark:text-muted-400">
                                {tripList.length > 0 ? `${tripList.length} adventure${tripList.length > 1 ? 's' : ''} planned` : 'Your planned future adventures'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {!user && (
                    <div className="text-center py-20">
                        <LogIn className="w-12 h-12 text-muted-300 dark:text-muted-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-muted-700 dark:text-muted-300 mb-2">Sign in to view your upcoming trips</h3>
                        <p className="text-sm text-muted-500 mb-6">Your trips are synced across all your devices.</p>
                        <button onClick={signInWithGoogle} className="bg-jungle-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-jungle-green-500 transition-colors">Sign In with Google</button>
                    </div>
                )}

                {user && loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {user && !loading && tripList.length === 0 && (
                    <div className="text-center py-20">
                        <Plane className="w-12 h-12 text-muted-300 dark:text-muted-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-muted-700 dark:text-muted-300 mb-2">No upcoming trips</h3>
                        <p className="text-sm text-muted-500 mb-6">Plan an itinerary with a future date to see it here!</p>
                        <Link href="/itinerary?new=true" className="bg-jungle-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-jungle-green-500 transition-colors">Create Itinerary</Link>
                    </div>
                )}

                {user && !loading && tripList.length > 0 && (
                    <div className="space-y-6">
                        {tripList.map((trip, i) => (
                            <motion.div
                                key={trip.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-muted-900 rounded-3xl border border-muted-100 dark:border-muted-800 shadow-sm overflow-hidden"
                            >
                                <div className="relative h-44">
                                    <PlaceImage
                                        name={trip.destination}
                                        fallbackUrl={trip.image}
                                        asBackground
                                        className="absolute inset-0 w-full h-full"
                                        width={800}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white mb-1">{trip.destination}</h2>
                                            <div className="flex items-center gap-3 text-xs text-white/80">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trip.group}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center border border-white/20">
                                            <div className="text-2xl font-bold text-white">{trip.daysUntil}</div>
                                            <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Days Left</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm font-bold text-muted-900 dark:text-white">Trip Preparedness</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trip.preparedness >= 70 ? 'bg-jungle-green-100 text-jungle-green-700 dark:bg-jungle-green-500/15 dark:text-jungle-green-400' : trip.preparedness >= 40 ? 'bg-marigold-100 text-marigold-700 dark:bg-marigold-500/15 dark:text-marigold-400' : 'bg-temple-red-100 text-temple-red-600 dark:bg-temple-red-500/15 dark:text-temple-red-400'}`}>
                                            {trip.preparedness}% Ready
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-muted-100 dark:bg-muted-800 rounded-full overflow-hidden mb-4">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${trip.preparedness}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${trip.preparedness >= 70 ? 'bg-jungle-green-500' : trip.preparedness >= 40 ? 'bg-marigold-400' : 'bg-temple-red-500'}`} />
                                    </div>

                                    <div className="space-y-2">
                                        {trip.checklist.map((c) => (
                                            <div key={c.item} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${c.done ? 'bg-jungle-green-50 dark:bg-jungle-green-500/5' : 'bg-muted-50 dark:bg-muted-800/50'}`}>
                                                {c.done ? <CheckCircle className="w-4 h-4 text-jungle-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-muted-300 dark:text-muted-600 shrink-0" />}
                                                <span className={`${c.done ? 'line-through text-muted-400' : 'text-muted-700 dark:text-muted-300'}`}>{c.item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 mt-5">
                                        <Link href={`/itinerary?load=${trip.id}`} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-center py-2.5 rounded-xl font-bold text-sm transition-colors">
                                            View Itinerary
                                        </Link>
                                        <Link href="/bookings" className="px-4 py-2.5 rounded-xl border border-muted-200 dark:border-muted-700 text-sm font-semibold text-muted-700 dark:text-muted-300 hover:bg-muted-50 dark:hover:bg-muted-800 transition-colors">
                                            Book Transport
                                        </Link>
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
