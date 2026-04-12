'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Navigation, MapPin, Calendar, Clock, ChevronRight, Plane } from 'lucide-react';

const ONGOING_TRIPS = [
    {
        id: '1',
        destination: 'Kerala Backwaters',
        status: 'Day 2 of 5',
        progress: 40,
        startDate: '2026-03-28',
        endDate: '2026-04-01',
        currentActivity: 'Houseboat cruise through Alleppey canals',
        nextActivity: 'Munnar Tea Garden Visit',
        nextTime: '2:00 PM',
        image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
        totalActivities: 18,
        completedActivities: 7,
        weather: { temp: '28°C', condition: '☀️ Sunny' },
    },
    {
        id: '2',
        destination: 'Goa Beach Trip',
        status: 'Day 1 of 3',
        progress: 15,
        startDate: '2026-03-30',
        endDate: '2026-04-01',
        currentActivity: 'Exploring Old Goa Churches',
        nextActivity: 'Sunset at Anjuna Beach',
        nextTime: '5:30 PM',
        image: 'https://images.unsplash.com/photo-1512343779784-a1d53b98b8ef?auto=format&fit=crop&w=600&q=80',
        totalActivities: 12,
        completedActivities: 2,
        weather: { temp: '32°C', condition: '⛅ Partly Cloudy' },
    },
];

export default function OngoingTripsPage() {
    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                            <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Ongoing Trips</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Your currently active journeys</p>
                        </div>
                    </div>
                </motion.div>

                {/* Trip Cards */}
                <div className="space-y-6">
                    {ONGOING_TRIPS.map((trip, i) => (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden hover:shadow-lg transition-all"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Image */}
                                <div className="relative md:w-72 h-48 md:h-auto shrink-0">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${trip.image})` }} />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent md:bg-gradient-to-t" />
                                    <div className="absolute bottom-4 left-4 md:bottom-4 md:left-4">
                                        <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{trip.destination}</h2>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                <span>{trip.weather.condition} {trip.weather.temp}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">{trip.status}</span>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                                            <span>{trip.completedActivities} of {trip.totalActivities} activities done</span>
                                            <span className="font-bold text-emerald-600">{trip.progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${trip.progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Current & Next */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-500/20">
                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">📍 Current Activity</div>
                                            <div className="text-sm font-semibold text-zinc-900 dark:text-white">{trip.currentActivity}</div>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-500/10 rounded-xl p-3 border border-purple-100 dark:border-purple-500/20">
                                            <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">⏭️ Next Up ({trip.nextTime})</div>
                                            <div className="text-sm font-semibold text-zinc-900 dark:text-white">{trip.nextActivity}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <Link href="/itinerary/tracking" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-center py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                            <MapPin className="w-4 h-4" /> Track Live
                                        </Link>
                                        <button className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1">
                                            View Plan <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty state hint */}
                {ONGOING_TRIPS.length === 0 && (
                    <div className="text-center py-20">
                        <Plane className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">No ongoing trips</h3>
                        <p className="text-sm text-zinc-500 mb-6">Start planning your next adventure!</p>
                        <Link href="/itinerary" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors">Create Itinerary</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
