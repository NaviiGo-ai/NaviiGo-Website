'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import Image from 'next/image';
import PlaceImage from '@/components/shared/PlaceImage';
import gsap from 'gsap';
import { X, MapPin, Calendar, CheckCircle2, Trophy, Flame, Star, Target, ChevronRight, Zap, Globe2, TrendingUp, Award, Heart, Lock, ArrowRight, Activity, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getPassportStats, getPassportStamps, getUserBucketList, getUserItineraries } from '@/lib/firestore';
import { getLeaderboard, type LeaderboardEntry } from '@/lib/leaderboard';
import {
    xpProgress, getLevelTitle, ACHIEVEMENTS, getDefaultStats,
    type PassportStats, type PassportStamp
} from '@/lib/gamification';

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
    const [activeTab, setActiveTab] = useState<'journeys' | 'bucketlist' | 'stamps' | 'stats' | 'achievements' | 'leaderboard'>('journeys');

    const { user, loading: authLoading, signInWithGoogle } = useAuth();

    const [stats, setStats] = useState<PassportStats>(FALLBACK_STATS);
    const [stamps, setStamps] = useState<PassportStamp[]>([]);
    const [savedJourneys, setSavedJourneys] = useState<any[]>([]);
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
            getUserItineraries(user.uid),
            getUserBucketList(user.uid),
            getLeaderboard(20),
        ]).then(([fsStats, fsStamps, fsJourneys, fsBucketList, fsLeaderboard]) => {
            if (!active) return;
            setSavedJourneys(fsJourneys || []);
            setBucketList(fsBucketList || []);
            setLeaderboard(fsLeaderboard || []);
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
            if (!active) return;
            // Graceful fallback for offline / permission restrictions
            setLoadedUid(user.uid);
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
                gsap.from('.stamp-card', { opacity: 0, y: 16, stagger: 0.05, duration: 0.5, ease: 'power2.out' });
            }
            gsap.from('.stat-plate', { y: 20, opacity: 0, stagger: 0.08, duration: 0.5, delay: 0.1 });
        }, containerRef);
        return () => ctx.revert();
    }, [activeTab, loading, authLoading, stamps.length]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-paper-warm flex flex-col items-center justify-center gap-3 text-brand-primary">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-xs uppercase tracking-widest text-naviigo-brown/60">Opening Archive...</span>
            </div>
        );
    }

    const renderNotLoggedIn = () => (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-naviigo-brown/30 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-paper-light rounded-2xl p-8 md:p-12 shadow-2xl text-center max-w-lg border border-[#EADFD4]">
                <div className="w-16 h-16 bg-paper-warm rounded-xl flex items-center justify-center mx-auto mb-6 p-3 border border-[#EADFD4]">
                    <Image src="/brand/naviigo-mark-primary.png" width={40} height={40} alt="NaviiGo" className="object-contain" />
                </div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-primary mb-2">ARCHIVE ACCESS REQUIRED</div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-naviigo-brown uppercase mb-3">Personal Travel Archive</h2>
                <p className="font-sans text-naviigo-brown/75 font-light text-sm mb-8 leading-relaxed">
                    Authenticate to index verified milestones, track territorial coverage across India, and chronicle your journeys.
                </p>
                <button onClick={signInWithGoogle} className="w-full bg-naviigo-brown text-white font-mono font-bold text-xs uppercase tracking-wider py-3.5 rounded-lg flex items-center justify-center gap-3 hover:bg-brand-primary transition-all shadow-md">
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={18} height={18} className="bg-white rounded-full p-0.5" alt="Google" />
                    Access Traveler Archive
                </button>
            </motion.div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="text-center py-20 px-4 bg-paper-light rounded-2xl border border-[#EADFD4]">
            <div className="w-16 h-16 rounded-xl bg-paper-warm border border-[#EADFD4] flex items-center justify-center mx-auto mb-6 p-3">
                <Image src="/brand/naviigo-mark-primary.png" width={36} height={36} alt="NaviiGo" className="object-contain opacity-60" />
            </div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-naviigo-brown/60 mb-2">ARCHIVE REGISTER EMPTY</div>
            <h2 className="text-2xl font-display font-black text-naviigo-brown uppercase mb-3">No Expeditions Indexed Yet</h2>
            <p className="font-sans text-naviigo-brown/70 text-sm font-light max-w-md mx-auto mb-8">Begin by navigating our curated digital atlas and setting out on your initial verified journey.</p>
            <button onClick={() => router.push('/explore')} className="bg-brand-primary text-white font-mono font-bold text-xs uppercase tracking-wider py-3 px-8 rounded-lg shadow-sm hover:bg-brand-primary/90 transition-all">
                Explore Digital Atlas →
            </button>
        </div>
    );

    return (
        <div ref={containerRef} className="min-h-screen relative bg-paper-warm text-naviigo-brown pt-24 sm:pt-32 pb-24 px-4 sm:px-6 md:px-10 font-sans selection:bg-brand-primary selection:text-white">
            {!user && renderNotLoggedIn()}

            <div className={`max-w-6xl mx-auto relative z-10 transition-all duration-700 ${!user ? 'opacity-30 blur-sm pointer-events-none scale-98' : ''}`}>
                
                {/* ── ARCHIVE MASTHEAD ─────────────────────────────────────────── */}
                <div className="mb-8 border-b border-[#EADFD4] pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                        <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary flex items-center gap-2">
                            <span>04 / PERSONAL TRAVEL ARCHIVE</span>
                            <span className="text-naviigo-brown/30">·</span>
                            <span className="text-naviigo-brown/60">FOLIO NV-2026-IND</span>
                        </div>
                        <div className="font-mono text-[11px] text-naviigo-brown/50 uppercase">
                            AUTHENTICATED EXPEDITION LEDGER
                        </div>
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-naviigo-brown">
                        CHRONICLE OF DISCOVERY.
                    </h1>
                </div>

                {/* ── TRAVELER DOSSIER CARD ─────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 relative">
                    <div className="relative bg-paper-light border border-[#EADFD4] rounded-2xl p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                            
                            {/* Avatar & Level Plate */}
                            <div className="relative shrink-0 flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-paper-warm p-1 overflow-hidden border-2 border-[#EADFD4] shadow-sm">
                                    {user?.photoURL ? (
                                        <Image src={user.photoURL!} alt="Profile" width={96} height={96} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-paper-light flex items-center justify-center text-naviigo-brown font-mono font-bold text-xl">
                                            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'N'}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2.5 bg-paper-warm border border-[#EADFD4] text-naviigo-brown font-mono text-[10px] font-bold px-3 py-0.5 rounded uppercase tracking-wider">
                                    TIER {progress.level} · {levelTitle}
                                </div>
                            </div>

                            {/* Details & Telemetry Plates */}
                            <div className="flex-1 text-center md:text-left min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-display font-black text-naviigo-brown tracking-tight uppercase">
                                            {user?.displayName || 'Unnamed Traveler'}
                                        </h2>
                                        <p className="font-mono text-xs text-naviigo-brown/60 uppercase tracking-widest mt-0.5">
                                            TRAVELER REGISTRY NO · {user?.uid ? user.uid.substring(0, 10).toUpperCase() : 'IND-001'}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase tracking-wider">NEXT ADVANCEMENT</div>
                                        <div className="font-mono text-xs font-bold text-brand-primary">{progress.nextLevelXP} XP REQUIRED</div>
                                        <div className="w-36 h-1.5 bg-[#EADFD4] rounded-full overflow-hidden mt-1.5">
                                            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${progress.progress}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#EADFD4]">
                                    {[
                                        { val: stats.totalStamps, label: 'Milestones', code: 'MLS' },
                                        { val: stats.statesVisited.length, label: 'States Visited', code: `${stats.statesVisited.length}/34` },
                                        { val: stats.streak, label: 'Active Streak', code: 'DAYS' },
                                        { val: stats.totalXP.toLocaleString(), label: 'Expedition XP', code: 'PTS' },
                                    ].map((s, i) => (
                                        <div key={i} className="stat-plate bg-paper-warm rounded-xl border border-[#EADFD4] p-3 text-left">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="font-mono text-[9px] uppercase tracking-wider text-naviigo-brown/50">{s.label}</span>
                                                <span className="font-mono text-[9px] text-brand-primary font-bold">{s.code}</span>
                                            </div>
                                            <div className="text-xl font-mono font-bold text-naviigo-brown leading-none">{s.val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── TYPOGRAPHIC ARCHIVE INDEX TABS ───────────────────────────────────────── */}
                <div className="flex items-center gap-6 sm:gap-8 mb-8 border-b border-[#EADFD4] overflow-x-auto no-scrollbar pb-3 font-mono text-xs uppercase tracking-wider">
                    {[
                        { id: 'journeys', label: 'Saved Journeys', count: savedJourneys.length },
                        { id: 'bucketlist', label: 'Saved Places', count: bucketList.length },
                        { id: 'stamps', label: 'Milestones', count: stamps.length },
                        { id: 'stats', label: 'Territorial Coverage', count: stats.statesVisited.length },
                        { id: 'achievements', label: 'Citations', count: stats.achievements.length },
                        { id: 'leaderboard', label: 'Traveler Registry', count: leaderboard.length },
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative py-1 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                                    isActive ? 'text-brand-primary font-bold' : 'text-naviigo-brown/60 hover:text-naviigo-brown'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span className="font-mono text-[10px] text-naviigo-brown/40">/{String(tab.count).padStart(2, '0')}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activePassportTab"
                                        className="absolute -bottom-3 left-0 right-0 h-[2px] bg-brand-primary"
                                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {(() => {
                    const showEmptyState = user && stamps.length === 0 && activeTab === 'stamps';
                    if (showEmptyState) {
                        return renderEmptyState();
                    }
                    return (
                        <>
                            {/* ── MILESTONES TAB ──────────────────────────────────────────── */}
                            {activeTab === 'stamps' && stamps.length > 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {stamps.map((stamp, i) => (
                                            <motion.div
                                                key={i}
                                                onClick={() => setSelectedStamp(stamp)}
                                                whileHover={{ y: -3 }}
                                                className="stamp-card cursor-pointer group bg-paper-light rounded-xl border border-[#EADFD4] p-5 hover:border-brand-primary/50 transition-all shadow-sm flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex justify-between items-baseline mb-3">
                                                        <span className="font-mono text-[9px] uppercase tracking-wider text-naviigo-brown/50">ENTRY Nº {String(i + 1).padStart(3, '0')}</span>
                                                        <span className="font-mono text-[10px] font-bold text-brand-primary">+{stamp.xpEarned} XP</span>
                                                    </div>
                                                    <div className="text-3xl mb-3">{stamp.icon}</div>
                                                    <h3 className="font-display font-bold text-base text-naviigo-brown uppercase leading-tight group-hover:text-brand-primary transition-colors">
                                                        {stamp.name}
                                                    </h3>
                                                    <div className="font-mono text-[10px] text-naviigo-brown/60 mt-1 uppercase">
                                                        {stamp.location}, {stamp.state}
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-[#EADFD4] flex justify-between items-center font-mono text-[9px] text-naviigo-brown/50 uppercase">
                                                    <span>{new Date(stamp.visitedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    <span className="group-hover:text-brand-primary font-bold transition-colors">Dossier →</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* ── ACHIEVEMENTS / CITATIONS TAB ────────────────────────────────────── */}
                            {activeTab === 'achievements' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {ACHIEVEMENTS.map((achievement, i) => {
                                        const unlocked = stats.achievements.includes(achievement.id);
                                        return (
                                            <div
                                                key={achievement.id}
                                                className={`relative flex items-start gap-4 p-5 rounded-xl border transition-all ${
                                                    unlocked
                                                        ? 'bg-paper-light border-[#EADFD4] shadow-sm'
                                                        : 'bg-paper-warm border-dashed border-[#EADFD4] opacity-55'
                                                }`}
                                            >
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 border border-[#EADFD4] ${
                                                    unlocked ? 'bg-paper-warm' : 'bg-paper-light grayscale'
                                                }`}>
                                                    {unlocked ? achievement.emoji : <Lock className="w-4 h-4 text-naviigo-brown/40" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                                        <h3 className={`font-display font-bold text-sm uppercase leading-tight ${unlocked ? 'text-naviigo-brown' : 'text-naviigo-brown/50'}`}>
                                                            {achievement.name}
                                                        </h3>
                                                        {unlocked && (
                                                            <span className="font-mono text-[9px] font-bold text-brand-primary uppercase">
                                                                VERIFIED
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="font-sans text-xs text-naviigo-brown/70 leading-relaxed font-light">{achievement.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {/* ── STATS / TERRITORIAL COVERAGE TAB ──────────────────────────────────── */}
                            {activeTab === 'stats' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Territorial Ledger */}
                                        <div className="bg-paper-light rounded-xl p-6 border border-[#EADFD4] shadow-sm">
                                            <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                                <h3 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-widest">
                                                    Territorial Coverage
                                                </h3>
                                                <span className="font-mono text-[10px] text-naviigo-brown/60">
                                                    {stats.statesVisited.length} OF {INDIAN_STATES.length} STATES & TERRITORIES
                                                </span>
                                            </div>
                                            <div className="w-full bg-[#EADFD4] rounded-full h-2 mb-6 overflow-hidden">
                                                <div className="h-full bg-brand-primary rounded-full" style={{ width: `${(stats.statesVisited.length / INDIAN_STATES.length) * 100}%` }} />
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                                                {INDIAN_STATES.map(state => {
                                                    const visited = stats.statesVisited.includes(state);
                                                    return (
                                                        <span
                                                            key={state}
                                                            className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-all ${
                                                                visited
                                                                    ? 'bg-paper-warm text-naviigo-brown border-brand-primary/40 font-bold'
                                                                    : 'bg-paper-warm/50 text-naviigo-brown/40 border-[#EADFD4]'
                                                            }`}
                                                        >
                                                            {visited ? '✓ ' : ''}{state}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Travel DNA Ledger */}
                                        <div className="bg-paper-light rounded-xl p-6 border border-[#EADFD4] shadow-sm">
                                            <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                                <h3 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-widest">
                                                    Exploration DNA
                                                </h3>
                                                <span className="font-mono text-[10px] text-naviigo-brown/60">GEOGRAPHIC BIAS</span>
                                            </div>
                                            <div className="space-y-4">
                                                {['Spiritual', 'Heritage', 'Adventure', 'Nature', 'Beach', 'City'].map(cat => {
                                                    const count = stats.categoryCounts[cat] || 0;
                                                    const max = Math.max(...Object.values(stats.categoryCounts), 1);
                                                    const pct = (count / max) * 100;
                                                    const icons: Record<string, string> = { Spiritual: '🕉️', Heritage: '🏛️', Adventure: '🏔️', Nature: '🌿', Beach: '🏖️', City: '🏙️' };
                                                    return (
                                                        <div key={cat} className="flex items-center gap-3 font-mono text-xs">
                                                            <div className="w-6 text-center text-sm">{icons[cat]}</div>
                                                            <div className="w-24 text-naviigo-brown uppercase font-semibold">{cat}</div>
                                                            <div className="flex-1 h-2 bg-[#EADFD4] rounded-full overflow-hidden">
                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full bg-naviigo-brown rounded-full" />
                                                            </div>
                                                            <div className="w-8 text-right font-bold text-brand-primary">{count}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── TRAVELER REGISTRY / LEADERBOARD TAB ──────────────────────────────────────── */}
                            {activeTab === 'leaderboard' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    <div className="bg-paper-light rounded-xl border border-[#EADFD4] shadow-sm overflow-hidden">
                                        <div className="flex items-baseline justify-between p-4 sm:p-6 border-b border-[#EADFD4]">
                                            <h3 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-widest">
                                                Global Explorer Registry
                                            </h3>
                                            <span className="font-mono text-[10px] text-naviigo-brown/50">VERIFIED VOYAGERS</span>
                                        </div>
                                        <div className="divide-y divide-[#EADFD4]">
                                            {leaderboard.map((entry, i) => (
                                                <div key={entry.uid} className="flex items-center gap-4 p-4 sm:px-6 hover:bg-paper-warm transition-colors">
                                                    <div className="w-8 font-mono font-bold text-sm text-naviigo-brown/60">
                                                        #{String(i + 1).padStart(2, '0')}
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-paper-warm border border-[#EADFD4] overflow-hidden shrink-0">
                                                        <Image src={entry.photoURL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-display font-bold text-sm text-naviigo-brown truncate uppercase">{entry.displayName}</div>
                                                        <div className="font-mono text-[10px] text-naviigo-brown/60">Level {entry.level}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono font-bold text-xs text-brand-primary">{entry.totalXP.toLocaleString()} XP</div>
                                                        <div className="font-mono text-[9px] text-naviigo-brown/50 uppercase">{entry.totalStamps} Milestones</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── SAVED JOURNEYS (ITINERARIES) TAB ─────────────────────────────────────────── */}
                            {activeTab === 'journeys' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    {savedJourneys.length === 0 ? (
                                        <div className="text-center py-20 px-6 bg-paper-light rounded-2xl border border-[#EADFD4]">
                                            <div className="w-16 h-16 rounded-xl bg-paper-warm border border-[#EADFD4] flex items-center justify-center mx-auto mb-6 p-3">
                                                <Image src="/brand/naviigo-mark-primary.png" width={36} height={36} alt="NaviiGo" className="object-contain opacity-60" />
                                            </div>
                                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-naviigo-brown/60 mb-2">ARCHIVE REGISTER EMPTY</div>
                                            <h3 className="text-2xl font-display font-black text-naviigo-brown uppercase mb-3">NO SAVED JOURNEYS YET.</h3>
                                            <p className="font-sans text-naviigo-brown/70 text-sm font-light max-w-md mx-auto mb-8">
                                                The next one starts somewhere. Plan a curated expedition with AI-powered routing, waypoints, and day chapters.
                                            </p>
                                            <button
                                                onClick={() => router.push('/itinerary')}
                                                className="bg-brand-primary text-white font-mono font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl shadow-sm hover:bg-brand-primary/90 transition-all inline-flex items-center gap-2"
                                            >
                                                <span>PLAN A TRIP</span>
                                                <span>→</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {savedJourneys.map((journey) => {
                                                const destTitle = journey.destName || (journey.form?.destName as string) || (journey.form?.destination as string) || 'India Expedition';
                                                const totalDays = journey.generatedData?.dayPlans?.length || journey.form?.days || 3;
                                                const totalStops = (journey.generatedData?.dayPlans || []).reduce((acc: number, dp: any) => acc + (dp.activities?.length || 0), 0);
                                                const planUrl = `/itinerary/plan/${journey.uuid || journey.id}`;
                                                const day1Url = `/itinerary/plan/${journey.uuid || journey.id}/day/1`;

                                                return (
                                                    <div
                                                        key={journey.id}
                                                        className="group bg-paper-light rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm hover:border-brand-primary/40 transition-all duration-300 flex flex-col justify-between"
                                                    >
                                                        <div>
                                                            {/* Cover Image */}
                                                            <div className="relative h-48 sm:h-56 bg-paper-warm overflow-hidden">
                                                                <PlaceImage
                                                                    name={destTitle}
                                                                    city={destTitle}
                                                                    asBackground
                                                                    className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700 object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                                
                                                                <div className="absolute top-3 left-3">
                                                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-white/90 text-naviigo-brown px-3 py-1 rounded-full shadow-sm">
                                                                        {totalDays} {totalDays === 1 ? 'DAY' : 'DAYS'} CHAPTERS
                                                                    </span>
                                                                </div>

                                                                <div className="absolute bottom-3 left-4 right-4 text-white">
                                                                    <h3 className="font-display font-black text-2xl uppercase tracking-tight leading-tight">
                                                                        {destTitle}
                                                                    </h3>
                                                                    <div className="flex items-center gap-3 font-mono text-[11px] text-white/80 uppercase mt-1">
                                                                        {journey.form?.startDate && (
                                                                            <span>{new Date(journey.form.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                                        )}
                                                                        {totalStops > 0 && <span>• {totalStops} Waypoints</span>}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Content */}
                                                            <div className="p-5">
                                                                <p className="font-sans text-xs sm:text-sm text-naviigo-brown/70 font-light line-clamp-2 mb-4">
                                                                    {journey.generatedData?.description || `Curated roadbook through ${destTitle} with verified route geometry.`}
                                                                </p>

                                                                {/* Day Chapters Quick Peek */}
                                                                {journey.generatedData?.dayPlans && journey.generatedData.dayPlans.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                                                        {journey.generatedData.dayPlans.slice(0, 4).map((dp: any, dpIdx: number) => (
                                                                            <span
                                                                                key={dpIdx}
                                                                                className="font-mono text-[10px] bg-paper-warm border border-[#EADFD4] text-naviigo-brown px-2 py-0.5 rounded"
                                                                            >
                                                                                Day {dp.day || dpIdx + 1}
                                                                            </span>
                                                                        ))}
                                                                        {journey.generatedData.dayPlans.length > 4 && (
                                                                            <span className="font-mono text-[10px] text-brand-primary font-bold px-1.5 py-0.5">
                                                                                +{journey.generatedData.dayPlans.length - 4} more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="px-5 py-4 bg-paper-warm/60 border-t border-[#EADFD4] flex items-center justify-between gap-3">
                                                            <button
                                                                onClick={() => router.push(day1Url)}
                                                                className="font-mono text-xs text-naviigo-brown/70 hover:text-brand-primary uppercase font-bold transition-colors"
                                                            >
                                                                Open Day 01 →
                                                            </button>
                                                            <button
                                                                onClick={() => router.push(planUrl)}
                                                                className="bg-brand-primary hover:bg-brand-primary/90 text-white font-mono font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                                            >
                                                                <span>VIEW JOURNEY</span>
                                                                <ArrowRight className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* ── BUCKET LIST / SAVED PLACES TAB ─────────────────────────────────────────── */}
                            {activeTab === 'bucketlist' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                    {bucketList.length === 0 ? (
                                        <div className="text-center py-20 px-6 bg-paper-light rounded-2xl border border-[#EADFD4]">
                                            <div className="w-16 h-16 rounded-xl bg-paper-warm border border-[#EADFD4] flex items-center justify-center mx-auto mb-6 p-3">
                                                <Image src="/brand/naviigo-mark-primary.png" width={36} height={36} alt="NaviiGo" className="object-contain opacity-60" />
                                            </div>
                                            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-naviigo-brown/60 mb-2">SAVED ATLAS BOOKMARKS</div>
                                            <h3 className="text-2xl font-display font-black text-naviigo-brown uppercase mb-3">NO SAVED PLACES YET.</h3>
                                            <p className="font-sans text-naviigo-brown/70 text-sm font-light max-w-sm mx-auto mb-8">
                                                Explore somewhere worth keeping. Bookmark iconic landmarks, trails, and cultural points across India.
                                            </p>
                                            <button
                                                onClick={() => router.push('/explore')}
                                                className="bg-brand-primary text-white font-mono text-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-xl hover:bg-brand-primary/90 transition-colors inline-flex items-center gap-2"
                                            >
                                                <span>EXPLORE DIGITAL ATLAS</span>
                                                <span>→</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {bucketList.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => router.push(`/explore?place=${encodeURIComponent(item.name || item.title || '')}`)}
                                                    className="group relative rounded-2xl overflow-hidden border border-[#EADFD4] bg-paper-light shadow-sm hover:border-brand-primary/50 transition-all cursor-pointer flex flex-col justify-between"
                                                >
                                                    <div className="relative h-48 bg-paper-warm overflow-hidden">
                                                        <PlaceImage
                                                            name={item.name || item.title}
                                                            city={item.location || item.city}
                                                            fallbackUrl={item.image}
                                                            asBackground
                                                            className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700 object-cover"
                                                            width={600}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                                        <div className="absolute bottom-3 left-4 right-4">
                                                            <h3 className="font-display font-bold text-white text-lg uppercase leading-tight">{item.name || item.title}</h3>
                                                            {item.location && <p className="font-mono text-[10px] text-white/80 uppercase mt-0.5">{item.location}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="p-3.5 bg-paper-light flex items-center justify-between font-mono text-[10px] uppercase font-bold text-brand-primary">
                                                        <span>View in Digital Atlas</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </>
                    );
                })()}
            </div>

            {/* ── STAMP DETAIL ARCHIVAL DOSSIER MODAL ──────────────────────────────────────── */}
            <AnimatePresence>
                {selectedStamp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-naviigo-brown/40 backdrop-blur-sm" onClick={() => setSelectedStamp(null)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="relative w-full max-w-md bg-paper-light rounded-2xl shadow-2xl overflow-hidden border border-[#EADFD4]"
                        >
                            <div className="p-6 border-b border-[#EADFD4] flex items-baseline justify-between bg-paper-warm">
                                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-primary">
                                    VERIFIED EXPEDITION DOSSIER
                                </div>
                                <button onClick={() => setSelectedStamp(null)} className="text-naviigo-brown/60 hover:text-naviigo-brown text-sm font-mono">
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 text-center">
                                <div className="text-5xl mb-4">{selectedStamp.icon}</div>
                                <h2 className="text-2xl font-display font-black text-naviigo-brown uppercase mb-1">{selectedStamp.name}</h2>
                                <div className="font-mono text-xs text-naviigo-brown/60 uppercase mb-4">
                                    {selectedStamp.location}, {selectedStamp.state} · {new Date(selectedStamp.visitedDate).toLocaleDateString()}
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-paper-warm border border-[#EADFD4] font-mono font-bold text-xs text-brand-primary mb-6">
                                    <Zap className="w-3.5 h-3.5" /> +{selectedStamp.xpEarned} EXPEDITION XP RECORDED
                                </div>

                                {selectedStamp.activities && selectedStamp.activities.length > 0 && (
                                    <div className="text-left pt-4 border-t border-[#EADFD4]">
                                        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-naviigo-brown/60 mb-3">
                                            Completed Waypoints
                                        </div>
                                        <ul className="space-y-2">
                                            {selectedStamp.activities.map((activity, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5 font-sans text-xs text-naviigo-brown/85 bg-paper-warm p-2.5 rounded border border-[#EADFD4]">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-naviigo-teal shrink-0 mt-0.5" />
                                                    <span>{activity}</span>
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
