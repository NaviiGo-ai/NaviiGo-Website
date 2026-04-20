'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import gsap from 'gsap';
import { X, MapPin, Calendar, CheckCircle2, Trophy, Flame, Star, Target, ChevronRight, Zap, Globe2, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getPassportStats, getPassportStamps, updatePassportStats, addPassportStamp } from '@/lib/firestore';
import {
    xpProgress, getLevelTitle, ACHIEVEMENTS, getDefaultStats,
    type PassportStats, type PassportStamp, applyStamp
} from '@/lib/gamification';

// ─── Indian States Map Data (simplified SVG coordinates) ─────────────────────
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal', 'A&N Islands', 'Delhi', 'J&K', 'Ladakh', 'Lakshadweep',
];

// ─── Demo stamps (shown when not logged in) ──────────────────────────────────
const DEMO_STAMPS: PassportStamp[] = [
    { name: 'Kashi Vishwanath', location: 'Varanasi', state: 'Uttar Pradesh', icon: '🕉️', type: 'Spiritual', xpEarned: 175, visitedDate: '2025-08-14', activities: ['Ganga Aarti', 'Temple Darshan', 'Boat Ride'], verificationMethod: 'itinerary_complete' },
    { name: 'Amber Fort', location: 'Jaipur', state: 'Rajasthan', icon: '🏰', type: 'Heritage', xpEarned: 200, visitedDate: '2025-09-22', activities: ['Fort Tour', 'Light Show', 'Bazaar Walk'], verificationMethod: 'itinerary_complete' },
    { name: 'Meenakshi Temple', location: 'Madurai', state: 'Tamil Nadu', icon: '🛕', type: 'Spiritual', xpEarned: 150, visitedDate: '2025-10-05', activities: ['Architecture Tour', 'Evening Ceremony'], verificationMethod: 'manual' },
    { name: 'Alleppey Backwaters', location: 'Kerala', state: 'Kerala', icon: '🛶', type: 'Nature', xpEarned: 200, visitedDate: '2025-11-12', activities: ['Houseboat Cruise', 'Village Walk', 'Sunset Watch'], verificationMethod: 'itinerary_complete' },
    { name: 'Solang Valley', location: 'Manali', state: 'Himachal Pradesh', icon: '🏔️', type: 'Adventure', xpEarned: 225, visitedDate: '2025-12-01', activities: ['Paragliding', 'Snow Trek', 'Cable Car'], verificationMethod: 'gps' },
];

const DEMO_STATS: PassportStats = {
    totalStamps: 5, totalXP: 950, level: 3, streak: 2,
    lastTripDate: '2025-12-01',
    achievements: ['first_trip', 'five_trips', 'north_south'],
    statesVisited: ['Uttar Pradesh', 'Rajasthan', 'Tamil Nadu', 'Kerala', 'Himachal Pradesh'],
    citiesVisited: ['Varanasi', 'Jaipur', 'Madurai', 'Kerala', 'Manali'],
    categoryCounts: { Spiritual: 2, Heritage: 1, Nature: 1, Adventure: 1 },
};

export default function PassportPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedStamp, setSelectedStamp] = useState<PassportStamp | null>(null);
    const [activeTab, setActiveTab] = useState<'stamps' | 'achievements' | 'stats'>('stamps');
    const { user } = useAuth();

    // Use demo data when not logged in, Firestore data when logged in
    const [stats, setStats] = useState<PassportStats>(DEMO_STATS);
    const [stamps, setStamps] = useState<PassportStamp[]>(DEMO_STAMPS);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            setStats(DEMO_STATS);
            setStamps(DEMO_STAMPS);
            return;
        }
        setLoading(true);
        Promise.all([
            getPassportStats(user.uid),
            getPassportStamps(user.uid),
        ]).then(([fsStats, fsStamps]) => {
            if (fsStats && fsStats.totalStamps > 0) {
                setStats({
                    ...fsStats,
                    lastTripDate: fsStats.lastTripDate?.toDate?.()?.toISOString() || null,
                } as any);
            } else {
                // Seed Firebase with Demo Data on first Gmail Login
                const seedStats = { ...DEMO_STATS };
                updatePassportStats(user.uid, seedStats as any).catch(console.error);
                DEMO_STAMPS.forEach(s => addPassportStamp(user.uid, { ...s, visitedDate: new Date(s.visitedDate) as any } as any).catch(console.error));
                setStats(seedStats);
            }
            if (fsStamps.length > 0) {
                setStamps(fsStamps.map(s => ({
                    ...s,
                    visitedDate: (s.visitedDate as any)?.toDate?.()?.toISOString?.() || '',
                })) as any);
            } else {
                setStamps(DEMO_STAMPS);
            }
        }).finally(() => setLoading(false));
    }, [user]);

    const progress = xpProgress(stats.totalXP);
    const levelTitle = getLevelTitle(progress.level);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.stamp-card', { scale: 0, opacity: 0, rotation: -15, stagger: 0.08, duration: 0.6, ease: 'back.out(1.7)', delay: 0.3 });
            gsap.from('.stat-card', { y: 40, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.2 });
        }, containerRef);
        return () => ctx.revert();
    }, [activeTab]);

    return (
        <div ref={containerRef} className="min-h-screen relative bg-zinc-50 dark:bg-black pt-28 pb-24 px-4 md:px-12 overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 right-1/3 w-[20vw] h-[20vw] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* ── HEADER ───────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 text-slate-900 dark:text-white">
                        Digital Travel <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-400">Passport</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Your journeys immortalized. Collect stamps, earn XP, unlock achievements.
                    </p>
                </motion.div>

                {/* ── PROFILE CARD ─────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-10 bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-3xl p-6 md:p-8"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar + Level badge */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-orange-500/30">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span>🌍</span>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white dark:border-slate-900">
                                {progress.level}
                            </div>
                        </div>

                        {/* Info + XP bar */}
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {user?.displayName || 'Traveler'}
                            </h2>
                            <p className="text-sm text-orange-500 font-semibold mb-3">{levelTitle} · Level {progress.level}</p>

                            {/* XP Progress Bar */}
                            <div className="max-w-sm mx-auto md:mx-0">
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>{progress.currentXP} XP</span>
                                    <span>{progress.nextLevelXP} XP to Level {progress.level + 1}</span>
                                </div>
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress.progress}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4 md:gap-6">
                                {[
                                    { icon: <MapPin className="w-5 h-5" />, value: stats.totalStamps, label: 'Stamps' },
                                    { icon: <Flame className="w-5 h-5" />, value: stats.streak, label: 'Streak' },
                                    { icon: <Globe2 className="w-5 h-5" />, value: stats.statesVisited.length, label: 'States' },
                                    { icon: <Trophy className="w-5 h-5" />, value: stats.achievements.length, label: 'Badges' },
                                ].map((stat, i) => (
                                    <div key={i} className="stat-card text-center">
                                        <div className="w-12 h-12 mx-auto mb-1 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center text-orange-500">
                                            {stat.icon}
                                        </div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                                        <div className="text-xs text-slate-500">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Dynamic Gamification Connect Button */}
                            {user && (
                                <button 
                                    onClick={async () => {
                                        const newStamp = DEMO_STAMPS[Math.floor(Math.random() * DEMO_STAMPS.length)];
                                        const stampToAdd = { ...newStamp, visitedDate: new Date().toISOString() };
                                        const newStats = applyStamp(stats, stampToAdd);
                                        
                                        // Optimistic UI Update
                                        setStats(newStats);
                                        setStamps([stampToAdd, ...stamps]);
                                        
                                        // Dynamic Firebase Sync
                                        await updatePassportStats(user.uid, newStats as any);
                                        await addPassportStamp(user.uid, { ...stampToAdd, visitedDate: new Date() as any });
                                    }}
                                    className="stat-card mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    <MapPin className="w-4 h-4" /> Simulate Passport Scan
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── TAB NAVIGATION ───────────────────────────────────────── */}
                <div className="flex justify-center gap-2 mb-8">
                    {(['stamps', 'achievements', 'stats'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                activeTab === tab
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/10'
                            }`}
                        >
                            {tab === 'stamps' && '🗺️ '}{tab === 'achievements' && '🏆 '}{tab === 'stats' && '📊 '}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* ── STAMPS TAB ──────────────────────────────────────────── */}
                {activeTab === 'stamps' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {stamps.map((stamp, i) => (
                            <motion.div
                                key={i}
                                onClick={() => setSelectedStamp(stamp)}
                                whileHover={{ scale: 1.03, y: -4 }}
                                whileTap={{ scale: 0.97 }}
                                className="stamp-card cursor-pointer group"
                            >
                                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-5 transition-all group-hover:shadow-xl group-hover:shadow-orange-500/10 group-hover:border-orange-500/30">
                                    <div className="w-20 h-20 mx-auto rounded-full border-4 border-orange-500 bg-orange-500/5 flex items-center justify-center mb-3">
                                        <span className="text-3xl">{stamp.icon}</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-orange-500 mb-0.5">{stamp.type}</div>
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{stamp.name}</h3>
                                        <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3" /> {stamp.location}
                                        </p>
                                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-semibold">
                                            <Zap className="w-3 h-3" /> +{stamp.xpEarned} XP
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Locked stamp placeholder */}
                        {[...Array(Math.max(0, 8 - stamps.length))].map((_, i) => (
                            <div key={`locked-${i}`} className="stamp-card">
                                <div className="bg-white/30 dark:bg-white/3 backdrop-blur-sm border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-5 opacity-50">
                                    <div className="w-20 h-20 mx-auto rounded-full border-4 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center mb-3">
                                        <span className="text-3xl">🔒</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="font-bold text-sm text-slate-400">Undiscovered</h3>
                                        <p className="text-xs text-slate-400 mt-1">Keep exploring!</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* ── ACHIEVEMENTS TAB ────────────────────────────────────── */}
                {activeTab === 'achievements' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ACHIEVEMENTS.map((achievement, i) => {
                            const unlocked = stats.achievements.includes(achievement.id);
                            return (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                        unlocked
                                            ? 'bg-white/60 dark:bg-white/5 border-orange-500/30 shadow-lg shadow-orange-500/5'
                                            : 'bg-white/30 dark:bg-white/3 border-zinc-200 dark:border-white/5 opacity-60'
                                    }`}
                                >
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                                        unlocked
                                            ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20'
                                            : 'bg-zinc-100 dark:bg-zinc-800 grayscale'
                                    }`}>
                                        {unlocked ? achievement.emoji : '🔒'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm ${unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                            {achievement.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 truncate">{achievement.description}</p>
                                    </div>
                                    <div className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${
                                        unlocked
                                            ? 'bg-orange-500/10 text-orange-600'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                    }`}>
                                        {unlocked ? '✓ Earned' : `+${achievement.xpReward} XP`}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* ── STATS TAB ──────────────────────────────────────────── */}
                {activeTab === 'stats' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {/* States Visited Grid */}
                        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Globe2 className="w-5 h-5 text-orange-500" /> States Visited ({stats.statesVisited.length}/{INDIAN_STATES.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {INDIAN_STATES.map(state => {
                                    const visited = stats.statesVisited.includes(state);
                                    return (
                                        <span
                                            key={state}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                                                visited
                                                    ? 'bg-orange-500 text-white shadow-sm'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-slate-400'
                                            }`}
                                        >
                                            {visited && '✓ '}{state}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-orange-500" /> Travel Categories
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {['Spiritual', 'Heritage', 'Adventure', 'Nature', 'Beach', 'City'].map(cat => {
                                    const count = stats.categoryCounts[cat] || 0;
                                    const icons: Record<string, string> = {
                                        Spiritual: '🕉️', Heritage: '🏛️', Adventure: '🏔️',
                                        Nature: '🌿', Beach: '🏖️', City: '🏙️',
                                    };
                                    return (
                                        <div key={cat} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50">
                                            <span className="text-2xl">{icons[cat]}</span>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900 dark:text-white">{cat}</div>
                                                <div className="text-xs text-slate-500">{count} {count === 1 ? 'visit' : 'visits'}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Leaderboard Teaser */}
                        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6 text-center">
                            <Award className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">You&apos;re in the top 15% of travelers!</h3>
                            <p className="text-sm text-slate-500">Keep exploring to climb the leaderboard. {33 - stats.statesVisited.length} states to go for All-India!</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── STAMP DETAIL MODAL ──────────────────────────────────────── */}
            <AnimatePresence>
                {selectedStamp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedStamp(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                        >
                            <div className="relative h-32 bg-gradient-to-br from-orange-400/20 to-amber-500/20 flex items-center justify-center">
                                <button onClick={() => setSelectedStamp(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors">
                                    <X className="w-5 h-5 text-slate-800 dark:text-slate-200" />
                                </button>
                                <div className="absolute -bottom-12 w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-5xl shadow-lg">
                                    {selectedStamp.icon}
                                </div>
                            </div>

                            <div className="pt-16 pb-8 px-8">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{selectedStamp.name}</h2>
                                    <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedStamp.location}, {selectedStamp.state}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {selectedStamp.visitedDate}</span>
                                    </div>
                                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 font-semibold text-sm">
                                        <Zap className="w-4 h-4" /> +{selectedStamp.xpEarned} XP
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Activities Completed</h3>
                                        <ul className="space-y-2">
                                            {selectedStamp.activities?.map((activity, idx) => (
                                                <li key={idx} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                    <span className="text-slate-700 dark:text-slate-300">{activity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-500/10 rounded-2xl p-4 border border-orange-100 dark:border-orange-500/20">
                                        <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-1">Verification</h3>
                                        <p className="text-sm text-orange-700 dark:text-orange-300/80">
                                            {selectedStamp.verificationMethod === 'itinerary_complete' && '✅ Verified via completed NaviiGo itinerary'}
                                            {selectedStamp.verificationMethod === 'gps' && '📍 Verified via GPS check-in at location'}
                                            {selectedStamp.verificationMethod === 'manual' && '🤳 Self-reported visit'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
