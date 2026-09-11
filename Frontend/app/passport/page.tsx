'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { X, MapPin, Calendar, CheckCircle2, Trophy, Flame, Star, Target, ChevronRight, Zap, Globe2, TrendingUp, Award, Heart, Lock, ArrowRight, Activity, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getPassportStats, getPassportStamps, getUserBucketList } from '@/lib/firestore';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard';
import {
    xpProgress, getLevelTitle, ACHIEVEMENTS, getDefaultStats,
    type PassportStats, type PassportStamp
} from '@/lib/gamification';
import PassportHeader from '@/components/features/passport/PassportHeader';
import StampGrid from '@/components/features/passport/StampGrid';
import Leaderboard from '@/components/features/passport/Leaderboard';

// ─── Indian States Map Data ─────────────────────
const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
    'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
    'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal', 'A&N Islands', 'Delhi', 'J&K', 'Ladakh', 'Lakshadweep',
];

const FALLBACK_STATS: PassportStats = {
    totalStamps: 0, totalXP: 0, level: 1, streak: 0,
    lastTripDate: null,
    achievements: [],
    statesVisited: [],
    citiesVisited: [],
    categoryCounts: {},
    totalActivitiesCompleted: 0,
};

export default function PassportPage() {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedStamp, setSelectedStamp] = useState<PassportStamp | null>(null);
    const [activeTab, setActiveTab] = useState<'stamps' | 'achievements' | 'stats' | 'leaderboard' | 'bucketlist'>('stamps');

    const { user, loading: authLoading, signInWithGoogle } = useAuth();

    const [stats, setStats] = useState<PassportStats>(FALLBACK_STATS);
    const [stamps, setStamps] = useState<PassportStamp[]>([]);
    const [bucketList, setBucketList] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loadedUid, setLoadedUid] = useState<string | null>(null);

    const [prevUserUid, setPrevUserUid] = useState(user?.uid);
    if (user?.uid !== prevUserUid) {
        setPrevUserUid(user?.uid);
        if (!user?.uid) {
            setStats(FALLBACK_STATS);
            setStamps([]);
            setBucketList([]);
            setLeaderboard([]);
            setLoadedUid(null);
        }
    }

    const loading = !!user && loadedUid !== user.uid;

    useEffect(() => {
        if (authLoading || !user) return;
        let active = true;

        Promise.all([
            getPassportStats(user.uid),
            getPassportStamps(user.uid),
            getUserBucketList(user.uid),
            getLeaderboard(20),
        ]).then(([fsStats, fsStamps, fsBucketList, fsLeaderboard]) => {
            if (!active) return;
            setBucketList(fsBucketList);
            setLeaderboard(fsLeaderboard);
            if (fsStats) {
                setStats({ ...fsStats, lastTripDate: fsStats.lastTripDate?.toDate?.()?.toISOString() || null } as any);
            } else {
                setStats(getDefaultStats());
            }
            if (fsStamps.length > 0) {
                setStamps(fsStamps.map(s => ({ ...s, visitedDate: (s.visitedDate as any)?.toDate?.()?.toISOString?.() || '' })) as any);
            } else {
                setStamps([]);
            }
            setLoadedUid(user.uid);
        }).catch(() => {
            if (active) setLoadedUid(user.uid);
        });

        return () => { active = false; };
    }, [user, authLoading]);

    const progress = xpProgress(stats.totalXP);
    const levelTitle = getLevelTitle(progress.level);

    // Animations
    useLayoutEffect(() => {
        if (loading || authLoading || !containerRef.current) return;
        const ctx = gsap.context(() => {
            if (activeTab === 'stamps' && stamps.length > 0) {
                gsap.from('.stamp-card', { scale: 0, opacity: 0, rotation: () => Math.random() * 40 - 20, stagger: 0.1, duration: 0.8, ease: 'back.out(1.5)', delay: 0.2 });
            }
            if (activeTab === 'leaderboard') {
                gsap.from('.podium-item', { scaleY: 0, transformOrigin: 'bottom', opacity: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out' });
            }
            gsap.from('.stat-card', { y: 40, opacity: 0, stagger: 0.1, duration: 0.5, delay: 0.1 });
        }, containerRef);
        return () => ctx.revert();
    }, [activeTab, loading, authLoading, stamps.length]);

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center text-emerald-500"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    const renderNotLoggedIn = () => (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center max-w-lg border border-white/20 dark:border-zinc-800/50">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/20 mx-auto mb-6">
                    🌎
                </div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-3">Your Digital Passport</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                    Start checking into destinations, collect beautiful stamps, earn XP, and climb the global leaderboards.
                </p>
                <button onClick={signInWithGoogle} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-900/10 dark:shadow-white/10">
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} className="bg-white rounded-full p-0.5" alt="Google" />
                    Sign in to Start
                </button>
            </motion.div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="text-center py-20 px-4">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-6xl mb-6">✈️</motion.div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Passport is Empty!</h2>
            <p className="text-zinc-500 max-w-md mx-auto mb-8">You haven&apos;t completed any trips yet. Generate an itinerary, pack your bags, and earn your first stamp!</p>
            <button onClick={() => router.push('/explore')} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105">
                Explore Destinations
            </button>
        </div>
    );

    return (
        <div ref={containerRef} className="min-h-screen relative bg-background text-foreground pt-20 sm:pt-28 pb-24 px-4 md:px-8 overflow-hidden font-sans">
            {!user && renderNotLoggedIn()}

            {/* Decorative Background Effects */}
            <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-teal-500/5 dark:bg-teal-500/10 blur-[150px] rounded-full pointer-events-none" />

            <div className={`max-w-6xl mx-auto relative z-10 transition-all duration-700 ${!user ? 'opacity-30 blur-sm pointer-events-none scale-95' : ''}`}>
                
                {/* ── PROFILE HERO CARD ─────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-12 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[2.5rem] transform -rotate-1 scale-[1.02] opacity-20 blur-xl"></div>
                    <div className="relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border border-white dark:border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            
                            {/* Avatar & XP Ring */}
                            <div className="relative shrink-0">
                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-800" strokeWidth="8" />
                                    <motion.circle 
                                        initial={{ strokeDasharray: '0 300' }}
                                        animate={{ strokeDasharray: `${(progress.progress / 100) * 283} 300` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8" strokeLinecap="round" 
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#14b8a6" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 m-auto w-[100px] h-[100px] rounded-full bg-zinc-200 dark:bg-zinc-800 p-1">
                                    {user?.photoURL ? (
                                        <Image src={user.photoURL!} alt="Profile" width={100} height={100} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-4xl">😎</div>
                                    )}
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black px-4 py-1 rounded-full shadow-xl border-2 border-white dark:border-zinc-900 whitespace-nowrap">
                                    LVL {progress.level}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 text-center md:text-left mt-2">
                                <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                                    {user?.displayName || 'Adventurer'}
                                </h1>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold mb-6">
                                    <Star className="w-4 h-4 fill-emerald-500" /> {levelTitle}
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
                                    {[
                                        { icon: <MapPin />, val: stats.totalStamps, label: 'Stamps' },
                                        { icon: <Globe2 />, val: stats.statesVisited.length, label: 'States' },
                                        { icon: <Flame />, val: stats.streak, label: 'Day Streak' },
                                        { icon: <Zap />, val: stats.totalXP, label: 'Total XP' },
                                    ].map((s, i) => (
                                        <div key={i} className="stat-card flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center">
                                                {s.icon}
                                            </div>
                                            <div>
                                                <div className="text-xl font-black text-zinc-900 dark:text-white leading-none">{s.val}</div>
                                                <div className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-wider">{s.label}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Progress info */}
                            <div className="hidden lg:flex flex-col justify-center items-end bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="text-sm font-bold text-zinc-400 mb-1">NEXT LEVEL</div>
                                <div className="text-3xl font-black text-emerald-500 mb-4">{progress.nextLevelXP} <span className="text-lg text-zinc-500">XP needed</span></div>
                                <div className="w-48 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress.progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── TAB NAVIGATION ───────────────────────────────────────── */}
                <div className="flex justify-center md:justify-start gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                    {(['stamps', 'achievements', 'stats', 'leaderboard', 'bucketlist'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                                activeTab === tab
                                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xl shadow-zinc-900/20'
                                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            {tab === 'stamps' && <MapPin className="w-4 h-4"/>}
                            {tab === 'achievements' && <Trophy className="w-4 h-4"/>}
                            {tab === 'stats' && <Activity className="w-4 h-4"/>}
                            {tab === 'leaderboard' && <Award className="w-4 h-4"/>}
                            {tab === 'bucketlist' && <Heart className="w-4 h-4"/>}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {(() => {
                    const showEmptyState = user && stamps.length === 0 && activeTab !== 'bucketlist' && activeTab !== 'leaderboard';
                    if (showEmptyState) {
                        return renderEmptyState();
                    }
                    return (
                        <>
                            {/* ── STAMPS TAB ──────────────────────────────────────────── */}
                {activeTab === 'stamps' && stamps.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-amber-50/50 dark:bg-amber-900/10 rounded-[3rem] p-8 md:p-12 border border-amber-100 dark:border-amber-900/30 relative overflow-hidden shadow-inner">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10 relative z-10">
                            {stamps.map((stamp, i) => (
                                <motion.div
                                    key={i}
                                    onClick={() => setSelectedStamp(stamp)}
                                    whileHover={{ scale: 1.05, zIndex: 10 }}
                                    className="stamp-card cursor-pointer group"
                                >
                                    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-full w-full aspect-square border-[6px] border-dashed border-emerald-500/30 flex flex-col items-center justify-center p-4 shadow-xl transition-all group-hover:border-emerald-500 group-hover:shadow-emerald-500/20">
                                        <div className="text-4xl mb-2">{stamp.icon}</div>
                                        <h3 className="font-bold text-[11px] md:text-sm text-center text-zinc-900 dark:text-white leading-tight line-clamp-2">{stamp.name}</h3>
                                        <div className="text-[9px] md:text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">{new Date(stamp.visitedDate).toLocaleDateString(undefined, {month:'short', year:'numeric'})}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
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
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`relative overflow-hidden flex items-center gap-4 p-5 rounded-[2rem] border transition-all ${
                                        unlocked
                                            ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-lg'
                                            : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
                                    }`}
                                >
                                    {unlocked && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />}
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shrink-0 shadow-inner ${
                                        unlocked ? 'bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40' : 'bg-zinc-200 dark:bg-zinc-800 grayscale'
                                    }`}>
                                        {unlocked ? achievement.emoji : <Lock className="w-6 h-6 text-zinc-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-lg leading-tight mb-1 ${unlocked ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                                            {achievement.name}
                                        </h3>
                                        <p className="text-sm text-zinc-500 line-clamp-2 leading-snug">{achievement.description}</p>
                                    </div>
                                    {unlocked && (
                                        <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">
                                            UNLOCKED
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* ── STATS TAB ──────────────────────────────────────────── */}
                            {activeTab === 'stats' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Map Card */}
                            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                                <h3 className="font-black text-xl text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 flex items-center justify-center"><Globe2 /></span>
                                    India Coverage
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-4 mb-2 overflow-hidden relative">
                                        <div className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full" style={{ width: `${(stats.statesVisited.length / INDIAN_STATES.length) * 100}%` }}></div>
                                    </div>
                                    <div className="w-full flex justify-between text-xs font-bold text-zinc-400 mb-4">
                                        <span>{stats.statesVisited.length} Visited</span>
                                        <span>{INDIAN_STATES.length} Total</span>
                                    </div>
                                    {INDIAN_STATES.map(state => {
                                        const visited = stats.statesVisited.includes(state);
                                        return visited && (
                                            <span key={state} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> {state}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Category Radar/Bars */}
                            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                                <h3 className="font-black text-xl text-zinc-900 dark:text-white mb-6 flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-500 flex items-center justify-center"><TrendingUp /></span>
                                    Travel DNA
                                </h3>
                                <div className="space-y-4">
                                    {['Spiritual', 'Heritage', 'Adventure', 'Nature', 'Beach', 'City'].map(cat => {
                                        const count = stats.categoryCounts[cat] || 0;
                                        const max = Math.max(...Object.values(stats.categoryCounts), 1);
                                        const pct = (count / max) * 100;
                                        const icons: Record<string, string> = { Spiritual: '🕉️', Heritage: '🏛️', Adventure: '🏔️', Nature: '🌿', Beach: '🏖️', City: '🏙️' };
                                        return (
                                            <div key={cat} className="flex items-center gap-4">
                                                <div className="w-8 text-xl text-center">{icons[cat]}</div>
                                                <div className="w-20 text-sm font-bold text-zinc-600 dark:text-zinc-400">{cat}</div>
                                                <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-purple-500 rounded-full" />
                                                </div>
                                                <div className="w-8 text-right text-sm font-bold text-zinc-900 dark:text-white">{count}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── LEADERBOARD TAB ──────────────────────────────────────── */}
                            {activeTab === 'leaderboard' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        {/* Podium */}
                        <div className="flex items-end justify-center gap-2 md:gap-6 pt-10 pb-6">
                            {[1, 0, 2].map((idx) => {
                                const entry = leaderboard[idx];
                                if (!entry) return null;
                                const height = idx === 0 ? 'h-48' : idx === 1 ? 'h-36' : 'h-28';
                                const color = idx === 0 ? 'from-amber-300 to-amber-500' : idx === 1 ? 'from-slate-300 to-slate-400' : 'from-orange-300 to-orange-500';
                                const rank = idx + 1;
                                return (
                                    <div key={rank} className="flex flex-col items-center group cursor-pointer">
                                        <div className="relative mb-4 z-10 group-hover:-translate-y-2 transition-transform">
                                            <Image src={entry.photoURL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='} alt="" width={80} height={80} className={`rounded-full border-4 border-white dark:border-zinc-900 object-cover shadow-xl ${idx === 0 ? 'w-20 h-20 md:w-24 md:h-24 ring-4 ring-amber-400' : 'w-16 h-16 md:w-20 md:h-20'}`} />
                                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-black shadow-lg border-2 border-white dark:border-zinc-900`}>{rank}</div>
                                        </div>
                                        <div className="text-center mb-4">
                                            <div className="font-bold text-zinc-900 dark:text-white text-sm md:text-base max-w-[100px] truncate">{entry.displayName}</div>
                                            <div className="text-xs font-black text-emerald-500">{entry.totalXP} XP</div>
                                        </div>
                                        <div className={`podium-item w-20 md:w-28 ${height} bg-gradient-to-t ${color} rounded-t-2xl shadow-inner opacity-90`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* List */}
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {leaderboard.slice(3).map((entry, i) => (
                                    <div key={entry.uid} className="flex items-center gap-4 p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <div className="w-8 text-center font-black text-zinc-400 text-lg">{i + 4}</div>
                                        <Image src={entry.photoURL || ''} alt="" width={48} height={48} className="w-12 h-12 rounded-full object-cover bg-zinc-200" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-zinc-900 dark:text-white truncate">{entry.displayName}</div>
                                            <div className="text-xs text-zinc-500">Level {entry.level}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-emerald-500">{entry.totalXP.toLocaleString()} XP</div>
                                            <div className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">{entry.totalStamps} Stamps</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── BUCKET LIST TAB ─────────────────────────────────────────── */}
                            {activeTab === 'bucketlist' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {bucketList.length === 0 ? (
                            <div className="text-center py-20 bg-white/50 dark:bg-zinc-900/50 rounded-[2.5rem] border border-dashed border-zinc-300 dark:border-zinc-700">
                                <Heart className="w-16 h-16 text-rose-300 dark:text-rose-900/50 mx-auto mb-4" />
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Your bucket list is empty</h3>
                                <p className="text-zinc-500 max-w-md mx-auto">Explore destinations and tap the heart icon to save places you want to visit.</p>
                                <button onClick={() => router.push('/explore')} className="mt-6 font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-6 py-2 rounded-full">Go Explore</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {bucketList.map((item, i) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group relative rounded-[2rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all cursor-pointer"
                                        onClick={() => router.push(`/itinerary?load=${item.id}`)}
                                    >
                                        <div className="relative h-56 bg-zinc-100 dark:bg-zinc-800">
                                            {item.image && (
                                                <div className="absolute inset-0 bg-cover bg-center transform group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: `url(${item.image})` }} />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent opacity-80" />
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg">
                                                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                                            </div>
                                            <div className="absolute bottom-6 left-6 right-6">
                                                <h3 className="font-black text-white text-2xl mb-1 leading-tight">{item.name}</h3>
                                                {item.location && <p className="text-white/80 text-sm font-medium flex items-center gap-1"><MapPin className="w-3 h-3"/>{item.location}</p>}
                                                <div className="mt-4 flex items-center justify-between opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                                    <span className="text-xs font-bold text-emerald-400">Plan Trip</span>
                                                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                            )}
                        </>
                    );
                })()}
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
                        <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md" onClick={() => setSelectedStamp(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="relative h-40 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                                <button onClick={() => setSelectedStamp(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors z-10">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute -bottom-12 w-28 h-28 rounded-full border-8 border-white dark:border-zinc-900 bg-white dark:bg-zinc-800 flex items-center justify-center text-6xl shadow-xl shadow-emerald-500/20">
                                    {selectedStamp.icon}
                                </div>
                            </div>

                            <div className="pt-16 pb-8 px-8 text-center">
                                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">{selectedStamp.name}</h2>
                                <div className="flex flex-col items-center justify-center gap-1 text-sm font-medium text-zinc-500 mb-6">
                                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-500" /> {selectedStamp.location}, {selectedStamp.state}</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-emerald-500" /> {new Date(selectedStamp.visitedDate).toLocaleDateString()}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                    <Zap className="w-4 h-4" /> +{selectedStamp.xpEarned} XP
                                </div>

                                {selectedStamp.activities && selectedStamp.activities.length > 0 && (
                                    <div className="mt-8 text-left">
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Activities Completed</h3>
                                        <ul className="space-y-2">
                                            {selectedStamp.activities.map((activity, idx) => (
                                                <li key={idx} className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{activity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
