'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, Calendar, MapPin, Users, Sparkles, CheckCircle, Circle } from 'lucide-react';

const UPCOMING_TRIPS = [
    {
        id: '1',
        destination: 'Jaipur, Rajasthan',
        startDate: '2026-04-15',
        endDate: '2026-04-18',
        daysUntil: 16,
        group: 'Couple',
        budget: '₹25,000',
        image: 'https://images.unsplash.com/photo-1599661502283-a44ea24dfc74?auto=format&fit=crop&w=600&q=80',
        preparedness: 75,
        checklist: [
            { item: 'Book flights', done: true },
            { item: 'Reserve hotel', done: true },
            { item: 'Pack bags', done: false },
            { item: 'Download offline maps', done: true },
            { item: 'Confirm restaurant reservations', done: false },
        ],
    },
    {
        id: '2',
        destination: 'Manali, Himachal',
        startDate: '2026-05-10',
        endDate: '2026-05-14',
        daysUntil: 41,
        group: 'Friends (6)',
        budget: '₹40,000',
        image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
        preparedness: 30,
        checklist: [
            { item: 'Book bus tickets', done: true },
            { item: 'Reserve hostel', done: false },
            { item: 'Rent adventure gear', done: false },
            { item: 'Get travel insurance', done: false },
            { item: 'Plan Rohtang Pass permit', done: true },
        ],
    },
    {
        id: '3',
        destination: 'Varanasi, UP',
        startDate: '2026-06-01',
        endDate: '2026-06-03',
        daysUntil: 63,
        group: 'Solo',
        budget: '₹12,000',
        image: 'https://images.unsplash.com/photo-1582283925565-d053709d3bdf?auto=format&fit=crop&w=600&q=80',
        preparedness: 10,
        checklist: [
            { item: 'Book train ticket', done: true },
            { item: 'Reserve ghat-view hotel', done: false },
            { item: 'Register for Ganga Aarti VIP', done: false },
            { item: 'Plan Sarnath day trip', done: false },
        ],
    },
];

export default function UpcomingTripsPage() {
    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-24 pb-20">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Upcoming Trips</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">{UPCOMING_TRIPS.length} adventures planned</p>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    {UPCOMING_TRIPS.map((trip, i) => (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden"
                        >
                            {/* Hero Image */}
                            <div className="relative h-44">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${trip.image})` }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{trip.destination}</h2>
                                        <div className="flex items-center gap-3 text-xs text-white/80">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(trip.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {new Date(trip.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {trip.group}</span>
                                        </div>
                                    </div>
                                    {/* Countdown */}
                                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-2 text-center border border-white/20">
                                        <div className="text-2xl font-bold text-white">{trip.daysUntil}</div>
                                        <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Days Left</div>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-bold text-zinc-900 dark:text-white">Trip Preparedness</span>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trip.preparedness >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : trip.preparedness >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' : 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400'}`}>
                                        {trip.preparedness}% Ready
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${trip.preparedness}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${trip.preparedness >= 70 ? 'bg-emerald-500' : trip.preparedness >= 40 ? 'bg-amber-400' : 'bg-red-500'}`} />
                                </div>

                                {/* Checklist */}
                                <div className="space-y-2">
                                    {trip.checklist.map((c) => (
                                        <div key={c.item} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${c.done ? 'bg-emerald-50 dark:bg-emerald-500/5' : 'bg-zinc-50 dark:bg-zinc-800/50'}`}>
                                            {c.done ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />}
                                            <span className={`${c.done ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{c.item}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 mt-5">
                                    <Link href="/itinerary" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-center py-2.5 rounded-xl font-bold text-sm transition-colors">
                                        View Itinerary
                                    </Link>
                                    <button className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        Edit Trip
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
