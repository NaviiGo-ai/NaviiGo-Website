'use client';
import { motion } from 'framer-motion';
import { History, Star, MapPin, Calendar, Camera, TrendingUp } from 'lucide-react';

const PAST_TRIPS = [
    {
        id: '1',
        destination: 'Udaipur, Rajasthan',
        dates: 'Feb 10 – Feb 14, 2026',
        duration: '5 days',
        group: 'Couple',
        rating: 4.8,
        highlights: ['City Palace tour', 'Lake Pichola sunset', 'Chittorgarh Fort'],
        totalSpent: '₹35,400',
        photos: 48,
        image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
        review: 'Absolutely magical experience. The palace views at sunset were breathtaking.',
    },
    {
        id: '2',
        destination: 'Rishikesh, Uttarakhand',
        dates: 'Jan 5 – Jan 8, 2026',
        duration: '4 days',
        group: 'Friends (5)',
        rating: 4.5,
        highlights: ['River rafting', 'Bungee jumping', 'Lakshman Jhula walk'],
        totalSpent: '₹22,800',
        photos: 92,
        image: 'https://images.unsplash.com/photo-1547471080-7fad851863b3?auto=format&fit=crop&w=600&q=80',
        review: 'The adrenaline rush from bungee jumping over the Ganga was unforgettable!',
    },
    {
        id: '3',
        destination: 'Varanasi, UP',
        dates: 'Dec 20 – Dec 22, 2025',
        duration: '3 days',
        group: 'Solo',
        rating: 5.0,
        highlights: ['Ganga Aarti', 'Sunrise boat ride', 'Sarnath Buddhist ruins'],
        totalSpent: '₹8,500',
        photos: 127,
        image: 'https://images.unsplash.com/photo-1582283925565-d053709d3bdf?auto=format&fit=crop&w=600&q=80',
        review: 'The spiritual energy of Varanasi changed my perspective on life. Must visit.',
    },
];

const STATS = {
    totalTrips: 8,
    citiesVisited: 12,
    totalDays: 38,
    totalPhotos: 542,
};

export default function TripHistoryPage() {
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
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Relive your past adventures</p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Bar */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    {[
                        { label: 'Total Trips', value: STATS.totalTrips, icon: '🗺️', color: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Cities Visited', value: STATS.citiesVisited, icon: '📍', color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Days Traveled', value: STATS.totalDays, icon: '📅', color: 'text-purple-600 dark:text-purple-400' },
                        { label: 'Photos Taken', value: STATS.totalPhotos, icon: '📸', color: 'text-amber-600 dark:text-amber-400' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 text-center shadow-sm">
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Past Trip Cards */}
                <div className="space-y-6">
                    {PAST_TRIPS.map((trip, i) => (
                        <motion.div
                            key={trip.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 + i * 0.1 }}
                            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden group hover:shadow-lg transition-all"
                        >
                            <div className="flex flex-col md:flex-row">
                                {/* Image */}
                                <div className="relative md:w-64 h-48 md:h-auto shrink-0 overflow-hidden">
                                    <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" style={{ backgroundImage: `url(${trip.image})` }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-gradient-to-r" />
                                    {/* Rating badge */}
                                    <div className="absolute top-3 left-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{trip.rating}</span>
                                    </div>
                                    {/* Photos count */}
                                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold">
                                        <Camera className="w-3 h-3" /> {trip.photos} photos
                                    </div>
                                </div>

                                {/* Content */}
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
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-zinc-900 dark:text-white">{trip.totalSpent}</div>
                                            <div className="text-[10px] text-zinc-400 font-medium">Total Spent</div>
                                        </div>
                                    </div>

                                    {/* Review */}
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 mb-3 border border-zinc-100 dark:border-zinc-700/50">
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">&ldquo;{trip.review}&rdquo;</p>
                                    </div>

                                    {/* Highlights */}
                                    <div className="flex flex-wrap gap-2">
                                        {trip.highlights.map((h) => (
                                            <span key={h} className="text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {h}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button className="flex-1 bg-amber-500 hover:bg-amber-400 text-white text-center py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                            <TrendingUp className="w-4 h-4" /> View Trip Report
                                        </button>
                                        <button className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                            Re-book
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
