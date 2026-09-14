'use client';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveSharedItinerary, listenToItinerary, saveItineraryToFirestore } from '@/lib/firestore';
import { useAuth } from '@/lib/AuthContext';
import PlaceImage from '@/components/shared/PlaceImage';
import {
    DEST_DATA, CROWD_COLOR, CROWD_DOT,
    type DayPlan, type CrowdLevel,
} from '@/app/itinerary/data';
import { genShareId, CrowdDot } from './helpers';
import ShareDropdown from './ShareDropdown';
import TransportCompare from './TransportCompare';
import WeatherStrip from './WeatherStrip';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });
import { useAI } from '@/context/AIContext';
import { useEffect } from 'react';
import { useCheckpoints } from '@/lib/useCheckpoints';
import { completeTripAndAwardStamp, type AwardResult } from '@/lib/passportService';
import { updateLeaderboardEntry } from '@/lib/leaderboard';
import CheckpointToast, { useCheckpointToast } from '@/components/features/passport/CheckpointToast';
import StampCelebration from '@/components/features/passport/StampCelebration';
import { DESTINATIONS } from '@/app/itinerary/data';
import { CheckCircle2, Circle, Rocket } from 'lucide-react';
import { itineraryPlaceHref } from '@/lib/placeLinks';

interface DayViewPageProps {
    form: Record<string, unknown>;
    generatedData?: any;
    onBack: () => void;
}

// Destination center for the live weather strip: prefer explicit mapCenter,
// else fall back to the first activity that carries coordinates.
function pickMapCenter(d: any): { lat: number; lng: number } | null {
    const mc = d?.mapCenter;
    if (mc && Number.isFinite(mc.lat) && Number.isFinite(mc.lng)) return mc;
    for (const dp of d?.dayPlans ?? []) {
        for (const a of dp?.activities ?? []) {
            if (typeof a?.lat === 'number' && typeof a?.lng === 'number') return { lat: a.lat, lng: a.lng };
        }
    }
    return null;
}

export default function DayViewPage({ form, generatedData, onBack }: DayViewPageProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { registerItinerary, unregisterItinerary } = useAI();
    const [isSaved, setIsSaved] = useState(false);
    const destId = form.destination as string, destName = form.destName as string;
    const staticData = DEST_DATA[destId];
    const data: any = useMemo(() => {
      if (!staticData) {
        // Destination data not available - return empty state instead of fallback
        return {
          description: 'Destination data not available',
          avgCost: '',
          weather: {},
          crowdLevel: 'Low',
          crowdNote: 'Data unavailable for this destination',
          highlights: [],
          restaurants: [],
          hotels: [],
          dayPlans: [],
          mapCenter: { lat: 0, lng: 0 },
          estimatedTravelCost: undefined
        };
      }
      return generatedData ? { ...staticData, ...generatedData } : staticData;
    }, [generatedData, staticData]);
    const center = pickMapCenter(data);
    const [activeDay, setActiveDay] = useState(() => {
        const initial = typeof form._initialDay === 'number' ? form._initialDay : 0;
        const totalDays = (generatedData ?? DEST_DATA[form.destination as string])?.dayPlans?.length ?? 0;
        return Math.max(0, Math.min(initial, totalDays - 1));
    });
    const [activeActivity, setActiveActivity] = useState(-1);
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [dayRouteInfo, setDayRouteInfo] = useState<{ distance: string, time: string } | null>(null);
    const [customPlans, setCustomPlans] = useState<DayPlan[]>(() => (form.customPlans as DayPlan[]) || JSON.parse(JSON.stringify(data.dayPlans)));
    const plan: DayPlan | undefined = customPlans[activeDay] ?? customPlans[0];
    const activities = useMemo(() => {
        return plan?.activities ?? [];
    }, [plan]);

    // Sync activeDay with browser history navigation (back/forward)
    useEffect(() => {
        const handlePopState = () => {
            const parts = window.location.pathname.split('/');
            const dayIdx = parts.indexOf('day');
            if (dayIdx !== -1 && parts[dayIdx + 1]) {
                const dayNum = parseInt(parts[dayIdx + 1], 10);
                if (!isNaN(dayNum) && dayNum >= 1) {
                    setActiveDay(dayNum - 1);
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);


    const destState = DESTINATIONS.find(d => d.id === destId)?.state || '';
    const purpose = (form.purpose as string) || 'cultural';

    const {
        isTripActive, checkpoint, startTrip, stopTrip,
        toggleCheckpoint, isChecked, getProgress, getDayProgress,
        justCompleted, clearJustCompleted,
        dayJustCompleted, clearDayJustCompleted,
        tripJustCompleted, clearTripJustCompleted,
    } = useCheckpoints(destId, destName, destState, purpose, customPlans);

    const { toasts, showToast } = useCheckpointToast();
    const [celebrationResult, setCelebrationResult] = useState<AwardResult | null>(null);

    const handleCheckpointToggle = useCallback((dayIdx: number, actName: string) => {
        if (!isTripActive) return;
        const wasChecked = isChecked(dayIdx, actName);
        toggleCheckpoint(dayIdx, actName);
        if (!wasChecked) {
            showToast(actName, 25);
        }
    }, [isTripActive, isChecked, toggleCheckpoint, showToast]);

    useEffect(() => {
        if (tripJustCompleted && checkpoint && user?.uid) {
            completeTripAndAwardStamp(user.uid, checkpoint).then(result => {
                setCelebrationResult(result);
                updateLeaderboardEntry(
                    user.uid,
                    user.displayName || 'Traveler',
                    user.photoURL || null,
                    result.stats
                ).catch(console.error);
            }).catch(console.error);
            clearTripJustCompleted();
        }
    }, [tripJustCompleted, checkpoint, user, clearTripJustCompleted]);

    // Register itinerary with AI context once on mount (avoids infinite re-render loop)
    const registeredRef = useRef(false);
    useEffect(() => {
        if (registeredRef.current) return;
        registeredRef.current = true;
        registerItinerary({ ...data, dayPlans: customPlans }, (newData: any) => {
            if (newData.dayPlans) setCustomPlans(newData.dayPlans);
        });
        
        return () => {
            unregisterItinerary();
            registeredRef.current = false;
        };
    }, [registerItinerary, unregisterItinerary, data, customPlans]);

    const [isSharing, setIsSharing] = useState(false);
    const [collaborators, setCollaborators] = useState(1);

    const handleShare = useCallback(async () => {
        setIsSharing(true);
        try {
            const id = genShareId();
            await saveSharedItinerary(id, { form, customPlans, destName });
            const url = `${window.location.origin}/itinerary?shareId=${id}`;
            await navigator.clipboard.writeText(url);
            listenToItinerary(id, (data) => setCollaborators(data.collaborators ?? 1), () => { });
        } catch (e) {
            const url = `${window.location.origin}/itinerary?load=${destId}`;
            navigator.clipboard.writeText(url);
        }
        setIsSharing(false);
    }, [form, customPlans, destName, destId]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchRes, setSearchRes] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&email=contact@naviigo.com`);
            const results = await res.json();
            setSearchRes(results);
        } catch (err) { console.error(err); }
        setIsSearching(false);
    };

    const addCustomActivity = (place: any) => {
        setCustomPlans(prev => {
            const copy = [...prev];
            const newAct = {
                name: place.name || place.display_name.split(',')[0],
                desc: place.display_name,
                time: 'Custom Time',
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lon),
                crowd: 'Low' as CrowdLevel,
                crowdTip: 'Custom added location',
                slot: 'Afternoon' as any,
                tags: ['Custom']
            };
            copy[activeDay] = { ...copy[activeDay], activities: [...copy[activeDay].activities, newAct] };
            return copy;
        });
        setSearchQuery('');
        setSearchRes([]);
        setIsSaved(false);
    };

    const moveActivity = (fromIdx: number, toIdx: number) => {
        setCustomPlans(prev => {
            const copy = [...prev];
            const acts = [...copy[activeDay].activities];
            const [moved] = acts.splice(fromIdx, 1);
            acts.splice(toIdx, 0, moved);
            copy[activeDay] = { ...copy[activeDay], activities: acts };
            return copy;
        });
        setIsSaved(false);
    };

    const removeActivity = (idx: number) => {
        setCustomPlans(prev => {
            const copy = [...prev];
            const acts = [...copy[activeDay].activities];
            acts.splice(idx, 1);
            copy[activeDay] = { ...copy[activeDay], activities: acts };
            return copy;
        });
        setIsSaved(false);
    };

    const slotEmoji: Record<string, string> = { Morning: '🌅', Afternoon: '☀️', Evening: '🌙' };

    const mapPins = useMemo(() => activities.map((a, i) => ({
        lat: a.lat, lng: a.lng, label: a.name, number: i + 1,
    })), [activities]);

    let totalHours = 0;
    activities.forEach(a => {
        const timeStr = a.time || '';
        const parts = timeStr.includes('–') ? timeStr.split('–').map(s => s.trim()) : [];
        if (parts.length === 2 && parts[0].includes(':') && parts[1].includes(':')) {
            const parse = (s: string) => {
                const m = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (!m) return null;
                let h = parseInt(m[1]);
                if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12;
                if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
                return h + parseInt(m[2]) / 60;
            };
            const s = parse(parts[0]), e = parse(parts[1]);
            if (s !== null && e !== null) { let d = e - s; if (d < 0) d += 24; totalHours += d; }
        } else totalHours += 2.5;
        if (a.travelFromPrev) totalHours += 0.5;
    });

    // Sanity-check the OSRM route data — if coords were spread across cities,
    // OSRM may return absurd distances. Cap display at 200km.
    const routeDistanceKm = dayRouteInfo
        ? parseFloat(dayRouteInfo.distance.replace(/[^\d.]/g, ''))
        : 0;
    const routeIsSane = routeDistanceKm > 0 && routeDistanceKm <= 200;

    const isExhausting = activities.length > 6;
    const isRaining = (plan?.weather?.rain ?? 0) > 20;

    return (
        <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-16 sm:pt-20 font-sans selection:bg-brand-primary selection:text-white">
            {/* Top bar */}
            <div className="sticky top-16 sm:top-20 z-40 bg-paper-light/95 backdrop-blur-md border-b border-[#EADFD4] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 transition-colors">
                <button onClick={onBack} className="w-9 h-9 rounded-full border border-[#EADFD4] flex items-center justify-center hover:bg-[#EFE9E0] transition-colors text-sm text-naviigo-brown">←</button>
                <button onClick={() => router.push('/itinerary?new=true')} className="hidden sm:flex w-9 h-9 rounded-full border border-brand-primary/30 items-center justify-center hover:bg-brand-primary/10 transition-colors text-brand-primary" title="Create New Itinerary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </button>
                <div className="flex-1">
                    <h1 className="font-display font-bold text-naviigo-brown text-sm sm:text-base truncate">{destName} — <span className="hidden sm:inline">Routebook & </span>Itinerary</h1>
                    <p className="text-xs text-naviigo-brown/60 hidden sm:block">Real itinerary timeline, waypoints & logistics</p>
                </div>
                <ShareDropdown onCopyLink={handleShare} destName={destName} isSharing={isSharing} collaborators={collaborators} planData={{ ...data, dayPlans: customPlans }} />
                {user && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => isTripActive ? stopTrip() : startTrip()}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isTripActive
                                ? 'bg-temple-red-500/10 text-temple-red-500 border border-temple-red-500/30 hover:bg-temple-red-500/20'
                                : 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40'
                        }`}
                    >
                        <Rocket className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isTripActive ? 'End Trip' : 'Start Trip'}</span>
                        <span className="sm:hidden">{isTripActive ? '⏹' : '▶'}</span>
                    </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.98 }} onClick={async () => {
                    if (user?.uid) {
                        await saveItineraryToFirestore(user.uid, { destId, destName, form: { ...form, customPlans }, generatedData: generatedData || null });
                    }
                    setIsSaved(true);
                    alert('📍 Itinerary successfully saved to your Passport!');
                }} disabled={isSaved}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${isSaved ? 'bg-brand-primary/10 text-brand-primary cursor-default' : 'bg-naviigo-brown text-white hover:bg-naviigo-brown/90'}`}>
                    {isSaved ? '✓ Saved' : '💾 Save'}
                </motion.button>
            </div>

            {/* Day tabs (Restrained Editorial Tabs) */}
            <div className="sticky top-[104px] sm:top-[120px] z-20 bg-paper-light/95 backdrop-blur-md border-b border-[#EADFD4] px-4 sm:px-8 py-3 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-6 font-mono text-xs tracking-wider uppercase">
                    {data.dayPlans.map((dp: DayPlan, i: number) => {
                        const isActive = activeDay === i;
                        const formattedDay = `DAY ${String(dp.day).padStart(2, '0')}`;
                        return (
                            <button
                                key={dp.day}
                                onClick={() => {
                                    setActiveDay(i);
                                    setActiveActivity(-1);
                                    const parts = window.location.pathname.split('/');
                                    const planIdx = parts.indexOf('plan');
                                    const urlUuid = planIdx !== -1 ? parts[planIdx + 1] : null;
                                    const uuid = (form.uuid || form._uuid || urlUuid) as string;
                                    if (uuid) {
                                        window.history.pushState(null, '', `/itinerary/plan/${uuid}/day/${i + 1}`);
                                    }
                                }}
                                className={`group relative py-1 flex items-center gap-2 transition-colors ${
                                    isActive ? 'text-brand-primary font-bold' : 'text-naviigo-brown/60 hover:text-naviigo-brown'
                                }`}
                            >
                                <span>{formattedDay}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeDayTabIndicator"
                                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-primary"
                                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {isTripActive && (() => {
                    const progress = getProgress();
                    return (
                        <div className="mt-3 pt-2 border-t border-[#EADFD4] flex items-center justify-between font-mono text-[10px] text-naviigo-teal font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-naviigo-teal animate-pulse" />
                                LIVE TRIP PROGRESS: {progress.completed}/{progress.total} CHECKPOINTS
                            </span>
                            <span>{progress.percent}% ACCOMPLISHED</span>
                        </div>
                    );
                })()}
            </div>

            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
                {/* Live weather strip for the destination */}
                {center && (
                    <div className="mb-6">
                        <WeatherStrip lat={center.lat} lng={center.lng} label={destName} />
                    </div>
                )}
                {/* 2-Col Layout at page level */}
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Left Column: Animating Day Dashboard + Timeline */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeDay} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                <div className="mb-8">
                                    {/* DAY CHAPTER OPENING */}
                                    <div className="border-b border-[#EADFD4] pb-6 mb-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-[0.25em] text-brand-primary">
                                            <span>DAY {String(plan.day).padStart(2, '0')}</span>
                                            <span className="text-naviigo-brown/30">|</span>
                                            <span>{destName}</span>
                                            <span className="text-naviigo-brown/30">|</span>
                                            <span className="text-naviigo-brown/60">{plan.activities.length} STOPS</span>
                                        </div>
                                        <motion.button whileTap={{ scale: 0.98 }} onClick={() => {
                                            const baseDate = form.startDate ? new Date(form.startDate as string) : new Date();
                                            baseDate.setDate(baseDate.getDate() + activeDay);
                                            let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NaviiGo//Itinerary//EN\n";
                                            plan.activities.forEach((a) => {
                                                const parts = a.time.split('–').map(s => s.trim());
                                                let sh = 9, sm = 0, eh = 10, em = 0;
                                                if (parts.length === 2) {
                                                    const parse = (s: string) => { const m = s.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return null; let h = parseInt(m[1]); if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12; if (m[3].toUpperCase() === 'AM' && h === 12) h = 0; return [h, parseInt(m[2])]; };
                                                    const s = parse(parts[0]), e = parse(parts[1]);
                                                    if (s) { sh = s[0]; sm = s[1]; }
                                                    if (e) { eh = e[0]; em = e[1]; }
                                                }
                                                const sd = new Date(baseDate); sd.setHours(sh, sm, 0);
                                                const ed = new Date(baseDate); ed.setHours(eh, em, 0);
                                                const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                                                ics += `BEGIN:VEVENT\nSUMMARY:${a.name}\nDESCRIPTION:${a.desc}\nDTSTART:${fmt(sd)}\nDTEND:${fmt(ed)}\nLOCATION:${a.lat},${a.lng}\nEND:VEVENT\n`;
                                            });
                                            ics += "END:VCALENDAR";
                                            const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
                                            const a = document.createElement('a'); a.href = url; a.download = `NaviiGo_Day${plan.day}.ics`; a.click();
                                        }} className="text-xs border border-naviigo-brown/20 text-naviigo-brown hover:border-brand-primary hover:text-brand-primary px-4 py-2 rounded-full font-mono uppercase font-bold tracking-wider transition-colors hidden sm:flex items-center gap-1.5 shrink-0">
                                            <span>📅</span> Export Day .ics
                                        </motion.button>
                                    </div>

                                    <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-naviigo-brown mb-3">
                                        {plan.title || `${destName} Chapter`}
                                    </h1>

                                    <p className="font-sans text-sm sm:text-base text-naviigo-brown/70 font-light italic max-w-xl">
                                        {activeDay === 0
                                            ? "Arrive, orient, and wander. Leave space for unscripted courtyards and acclimating."
                                            : activeDay === data.dayPlans.length - 1
                                            ? "Final hours before departure. Pack the roadbook and savor the closing horizon."
                                            : "Start early to catch the morning light. Follow the spine through local paths."}
                                    </p>
                                </div>

                            {/* Top Dashboard Grid */}
                            {data.crowdNote && (
                                <div className="mb-4 bg-gradient-to-r from-marigold-500/10 to-saffron-500/10 border border-marigold-500/20 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                                    <div className="text-2xl mt-1">🤖</div>
                                    <div>
                                        <div className="text-xs font-bold text-marigold-700 dark:text-marigold-500 uppercase tracking-wider mb-1 flex items-center gap-2">Live AI Crowd Alert <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marigold-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-marigold-500"></span></span></div>
                                        <div className="text-sm font-medium text-marigold-900 dark:text-marigold-400 leading-snug">{data.crowdNote}</div>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                                {/* Weather */}
                                <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm flex items-center gap-3">
                                    <span className="text-3xl shrink-0">{plan.weather.temp.includes('°C') ? '🌤️' : plan.weather.emoji}</span>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="font-display font-bold text-base text-naviigo-brown leading-tight">{plan.weather.temp}</div>
                                            {plan.weather.temp.includes('°C') && <span className="text-[8px] font-mono bg-naviigo-teal text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Forecast</span>}
                                        </div>
                                        <div className="text-[11px] font-mono text-naviigo-brown/60 truncate">{plan.weather.temp.includes('°C') ? 'Meteorology' : plan.weather.condition}</div>
                                        <div className="text-[11px] font-sans text-brand-primary mt-0.5 font-medium flex items-center gap-1 line-clamp-1">
                                            <span>✦</span> {plan.weather.tip}
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Budget Progress */}
                                <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm flex flex-col justify-center">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/60">Estimated Allocation</span>
                                        <span className="font-mono text-[11px] font-bold text-naviigo-brown">
                                            ₹{(form.budget as number / (form.days as number || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#EADFD4] rounded-full overflow-hidden flex">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (plan.activities.length * 20))}%` }} transition={{ duration: 1 }} className={`h-full ${plan.activities.length > 4 ? 'bg-brand-primary' : 'bg-naviigo-brown'}`} />
                                    </div>
                                    {data.estimatedTravelCost ? (
                                        <div className="font-mono text-[10px] text-naviigo-brown/70 mt-2 truncate" title={data.estimatedTravelCost}>
                                            ✈️ {data.estimatedTravelCost}
                                        </div>
                                    ) : (
                                        <div className="font-mono text-[10px] text-naviigo-brown/50 mt-2 text-right">{plan.activities.length} stops scheduled</div>
                                    )}
                                </div>

                                {/* Crowd Context */}
                                <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm flex flex-col justify-center">
                                    <div className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/60 mb-2">Crowd Density</div>
                                    <div className="flex gap-2">
                                        {(['Low', 'Medium', 'High'] as CrowdLevel[]).map(level => {
                                            const count = plan.activities.filter(a => a.crowd === level).length;
                                            if (count === 0) return null;
                                            return (
                                                <div key={level} className="flex-1 bg-paper-warm rounded border border-[#EADFD4] p-1 text-center">
                                                    <CrowdDot level={level} />
                                                    <div className="font-mono text-[9px] font-semibold text-naviigo-brown/70 mt-0.5">{count} {level}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Route Info */}
                                {dayRouteInfo && routeIsSane ? (
                                    <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm flex flex-col justify-center">
                                        <div className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/60 mb-1">Transit Corridor</div>
                                        <div className="font-display font-bold text-naviigo-brown text-base leading-tight">{dayRouteInfo.time}</div>
                                        <div className="font-mono text-[10px] text-naviigo-brown/60">{dayRouteInfo.distance} total travel</div>
                                    </div>
                                ) : dayRouteInfo && !routeIsSane ? (
                                    <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm flex flex-col justify-center">
                                        <div className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/60 mb-1">Urban Proximity</div>
                                        <div className="font-display font-semibold text-naviigo-brown text-sm leading-tight">Within City Center</div>
                                        <div className="font-mono text-[10px] text-naviigo-brown/60">Short connections</div>
                                    </div>
                                ) : (
                                    <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center opacity-70">
                                        <div className="font-mono text-[10px] text-naviigo-brown/60">Calculating Waypoints...</div>
                                    </div>
                                )}
                            </div>

                            {/* Top Stays */}
                            {data.hotels && data.hotels.length > 0 && (
                                <div className="mb-8">
                                    <div className="flex items-baseline justify-between mb-3 border-b border-[#EADFD4] pb-2">
                                        <h3 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-widest flex items-center gap-2">
                                            <span>HOTEL REPOSITORIES</span>
                                        </h3>
                                        <span className="font-mono text-[10px] text-naviigo-brown/50">CURATED FOR YOUR STAY</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {data.hotels.slice(0, 3).map((hotel: any, i: number) => (
                                            <div key={i} className="group relative bg-paper-light rounded-xl border border-[#EADFD4] overflow-hidden shadow-sm hover:border-brand-primary/50 transition-all flex flex-col">
                                                <PlaceImage name={hotel.name} city={destName} className="h-28 w-full shrink-0 object-cover" asBackground />
                                                <div className="p-3.5 flex-1 flex flex-col">
                                                    <div className="font-display font-bold text-sm text-naviigo-brown line-clamp-1 mb-0.5 group-hover:text-brand-primary transition-colors">{hotel.name}</div>
                                                    <div className="font-sans text-[11px] text-naviigo-brown/70 line-clamp-2 mb-3 flex-1">{hotel.desc}</div>
                                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#EADFD4]">
                                                        <div>
                                                            <div className="font-mono text-[10px] font-bold text-brand-primary">★ {hotel.rating}</div>
                                                            <div className="font-mono text-xs font-semibold text-naviigo-brown">{hotel.priceRange}</div>
                                                        </div>
                                                        {hotel.bookingLink && (
                                                            <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-paper-warm text-naviigo-brown border border-[#EADFD4] hover:bg-brand-primary hover:text-white text-xs font-mono font-bold uppercase rounded transition-colors">
                                                                Reserve
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Alerts Row */}
                            {(isRaining || isExhausting || plan.activities.length > 5) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {isRaining && (
                                        <div className="bg-deep-sea-50 dark:bg-deep-sea-500/10 border border-deep-sea-200 dark:border-deep-sea-500/20 rounded-2xl p-4 flex gap-3 shadow-sm items-center">
                                            <div className="text-3xl">🌧️</div>
                                            <div>
                                                <h4 className="text-sm font-bold text-deep-sea-900 dark:text-deep-sea-400 mb-0.5">Rain Expected</h4>
                                                <p className="text-xs text-deep-sea-700 dark:text-deep-sea-300">{plan.weather.rain}% chance of rain today. Keep an umbrella handy!</p>
                                            </div>
                                        </div>
                                    )}
                                    {isExhausting && (
                                        <div className="bg-temple-red-50 dark:bg-temple-red-500/10 border border-temple-red-200 dark:border-temple-red-500/20 rounded-2xl p-4 flex gap-3 shadow-sm items-center">
                                            <div className="text-3xl">⚠️</div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-temple-red-900 dark:text-temple-red-400 mb-0.5">Overstuffed Schedule</h4>
                                                <p className="text-[11px] text-temple-red-700 dark:text-temple-red-300 leading-tight">This day involves ~{Math.round(totalHours)} hours of activity. Consider removing an item to avoid exhaustion.</p>
                                            </div>
                                            <motion.button whileTap={{ scale: 0.98 }} onClick={() => removeActivity(plan.activities.length - 1)} className="shrink-0 text-[10px] bg-temple-red-100 dark:bg-temple-red-500/20 text-temple-red-700 dark:text-temple-red-300 font-bold px-2.5 py-1.5 rounded-lg hover:bg-temple-red-200 transition-colors">
                                                Drop Last
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Action Bar */}
                                <div className="flex gap-3 flex-wrap bg-white dark:bg-muted-900 border border-muted-100 dark:border-muted-800 rounded-2xl p-2 shadow-sm">
                                    <motion.button whileTap={{ scale: 0.98 }} onClick={(e) => {
                                        e.stopPropagation();
                                        const currentPlans = customPlans.length > 0 ? [...customPlans] : [...data.dayPlans];
                                        const optimizedActivities = [...plan.activities].sort((a, b) => {
                                            const slots = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3 };
                                            const sA = slots[a.slot as keyof typeof slots] || 9;
                                            const sB = slots[b.slot as keyof typeof slots] || 9;
                                            if (sA !== sB) return sA - sB;
                                            return (a.lng || 0) - (b.lng || 0);
                                        });
                                        currentPlans[activeDay] = { ...plan, activities: optimizedActivities };
                                        setCustomPlans(currentPlans);
                                    }}
                                        className="flex-1 bg-muted-900 dark:bg-white hover:bg-muted-800 dark:hover:bg-muted-100 text-white dark:text-muted-900 transition-all px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                        <span>✨</span> Optimize Order
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.98 }} onClick={(e) => {
                                        e.stopPropagation();
                                        if (plan.activities.length <= 3) { alert("Your schedule is already very relaxed!"); return; }
                                        const currentPlans = customPlans.length > 0 ? [...customPlans] : [...data.dayPlans];
                                        let toRemoveIdx = plan.activities.length - 1;
                                        const crowdedIdx = plan.activities.findIndex(a => a.crowd === 'High');
                                        if (crowdedIdx >= 0) toRemoveIdx = crowdedIdx;
                                        const newActivities = [...plan.activities];
                                        newActivities.splice(toRemoveIdx, 1);
                                        currentPlans[activeDay] = { ...plan, activities: newActivities };
                                        setCustomPlans(currentPlans);
                                    }}
                                        className="flex-1 bg-muted-50 dark:bg-muted-800 text-muted-900 dark:text-white hover:bg-muted-100 dark:hover:bg-muted-700 transition-all px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                        <span>😌</span> Make it Relaxed
                                    </motion.button>
                                </div>

                                {/* Last Day Departure Buffer Banner */}
                                {activeDay === customPlans.length - 1 && data.departureInfo && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-r from-saffron-50 to-marigold-50 dark:from-saffron-500/5 dark:to-marigold-500/5 rounded-2xl p-4 border border-saffron-200/50 dark:border-saffron-500/20 flex items-center gap-3 mt-2 mb-4">
                                        <div className="text-2xl">
                                            {data.departureInfo.departureMode === 'flight' ? '✈️' : data.departureInfo.departureMode === 'train' ? '🚆' : data.departureInfo.departureMode === 'bus' ? '🚌' : '🚗'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-saffron-600 dark:text-saffron-400">Departure Day</div>
                                            <div className="text-[11px] text-muted-600 dark:text-muted-300 mt-0.5">
                                                Checkout {data.departureInfo.checkoutTime} · Depart {data.departureInfo.departureTime} · {data.departureInfo.availableHoursAfterCheckout}h free window
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Timeline */}
                                <Reorder.Group axis="y" values={plan.activities} onReorder={(newOrder) => {
                                    const currentPlans = customPlans.length > 0 ? [...customPlans] : [...data.dayPlans];
                                    currentPlans[activeDay] = { ...plan, activities: newOrder };
                                    setCustomPlans(currentPlans);
                                }} className="space-y-0 pt-4 list-none">
                                    {plan.activities.map((act, i) => {
                                        const isLast = i === plan.activities.length - 1;
                                        const slotChanged = i === 0 || plan.activities[i - 1].slot !== act.slot;
                                        const isActive = activeActivity === i;
                                        return (
                                            <Reorder.Item key={act.name} value={act}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                                            >
                                                {slotChanged && (
                                                    <div className="flex items-center gap-3 mb-6 mt-8 first:mt-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">
                                                        <span className="w-2 h-2 rounded-full bg-brand-primary" />
                                                        <span>{act.slot} SEGMENT</span>
                                                        <div className="flex-1 h-px bg-naviigo-brown/15" />
                                                    </div>
                                                )}
                                                {act.travelFromPrev && i > 0 && plan.activities[i-1]?.lat && act.lat && (
                                                    <div className="my-4">
                                                        <TransportCompare
                                                            fromLat={plan.activities[i-1].lat}
                                                            fromLng={plan.activities[i-1].lng}
                                                            toLat={act.lat}
                                                            toLng={act.lng}
                                                            fromName={plan.activities[i-1].name}
                                                            toName={act.name}
                                                        />
                                                    </div>
                                                )}
                                                {act.travelFromPrev && (!act.lat || i === 0 || !plan.activities[i-1]?.lat) && (
                                                    <div className="flex items-center gap-3 ml-[48px] my-4 font-mono text-[11px] text-naviigo-brown/60">
                                                        <span className="w-8 h-[1px] bg-naviigo-brown/20" />
                                                        <span className="bg-paper-light border border-[#EADFD4] px-3 py-1 rounded-full text-brand-primary font-bold">
                                                            TRANSIT: {act.travelFromPrev}
                                                        </span>
                                                        <span className="flex-1 h-[1px] bg-naviigo-brown/20" />
                                                    </div>
                                                )}
                                                <div 
                                                    className="flex gap-4 sm:gap-6 mb-6 cursor-grab active:cursor-grabbing group" onClick={() => setActiveActivity(isActive ? -1 : i)}>
                                                    {/* Spine Waypoint Column */}
                                                    <div className="flex flex-col items-center pt-1">
                                                        {isTripActive ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleCheckpointToggle(activeDay, act.name); }}
                                                                className="relative group/check z-10"
                                                            >
                                                                {isChecked(activeDay, act.name) ? (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                                        className="w-10 h-10 rounded-full bg-naviigo-teal flex items-center justify-center shadow-md text-white"
                                                                    >
                                                                        <CheckCircle2 className="w-5 h-5" />
                                                                    </motion.div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-naviigo-brown/30 bg-paper-warm flex items-center justify-center text-naviigo-brown/50 group-hover/check:border-naviigo-teal group-hover/check:text-naviigo-teal transition-colors">
                                                                        <Circle className="w-5 h-5" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center shadow-sm shrink-0 transition-transform duration-300 font-mono z-10
                                                                ${isActive ? 'bg-brand-primary text-white scale-110 ring-4 ring-brand-primary/20' : 'bg-paper-warm border-2 border-brand-primary/40 text-brand-primary group-hover:bg-brand-primary group-hover:text-white'}`}>
                                                                {String(i + 1).padStart(2, '0')}
                                                            </div>
                                                        )}
                                                        {!isLast && <div className={`w-[2px] flex-1 my-2 rounded-full transition-colors ${isActive ? 'bg-brand-primary' : 'bg-brand-primary/20'}`} />}
                                                    </div>

                                                    {/* Editorial Schedule Content */}
                                                    <div className={`flex-1 bg-paper-light rounded-2xl border p-5 sm:p-6 transition-all relative overflow-hidden group-hover:shadow-md
                            ${isActive ? 'border-brand-primary/50 shadow-lg' : 'border-[#EADFD4] shadow-sm'} ${isTripActive && isChecked(activeDay, act.name) ? 'opacity-60' : ''}`}>
                                                        
                                                        {/* Schedule Line: Timestamp ──────────── Title */}
                                                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                                                            <div className="flex-1 flex items-baseline gap-3">
                                                                <span className="font-mono text-xs font-bold text-brand-primary tracking-wider shrink-0">
                                                                    {act.time || '09:00'}
                                                                </span>
                                                                <span className="hidden sm:inline-block flex-1 border-b border-dashed border-naviigo-brown/20" />
                                                                <h4 className={"font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-naviigo-brown group-hover:text-brand-primary transition-colors" + (isTripActive && isChecked(activeDay, act.name) ? ' line-through text-naviigo-brown/40' : '')}>
                                                                    {act.name}
                                                                </h4>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CROWD_COLOR[act.crowd]}`}>
                                                                    <CrowdDot level={act.crowd} /> {act.crowd}
                                                                </div>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex bg-paper-warm rounded-lg text-naviigo-brown/60 overflow-hidden shrink-0 border border-[#EADFD4] items-center">
                                                                    <button onClick={(e) => { e.stopPropagation(); removeActivity(i); }} className="w-7 h-7 flex items-center justify-center hover:bg-brand-primary hover:text-white transition-colors text-xs font-mono">✕</button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <p className="font-sans text-xs sm:text-sm text-naviigo-brown/75 font-light leading-relaxed mb-4">
                                                            {act.desc}
                                                        </p>

                                                        {/* Category & Tags Strip */}
                                                        <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-[11px]">
                                                            {act.category === 'hidden-gem' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                                                    💎 Hidden Gem
                                                                </span>
                                                            )}
                                                            {act.category === 'local-secret' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-secondary/20 text-naviigo-brown border border-brand-secondary/30">
                                                                    🤫 Local Secret
                                                                </span>
                                                            )}
                                                            {act.category === 'experience' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                                                                    ✨ Experience
                                                                </span>
                                                            )}
                                                            {act.entryFee && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-paper-warm text-naviigo-brown border border-[#EADFD4]">
                                                                    🎟️ {act.entryFee}
                                                                </span>
                                                            )}
                                                            {act.openingHours && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium bg-paper-warm text-naviigo-brown/70 border border-[#EADFD4]">
                                                                    🕐 {act.openingHours}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Editorial Insider Note */}
                                                        {act.insiderTip ? (
                                                            <div className="border-l-2 border-brand-secondary pl-3 py-1 mb-3 text-xs font-sans text-naviigo-brown/85 leading-relaxed bg-paper-warm/50 rounded-r-md">
                                                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-primary mr-1.5">Note:</span>
                                                                {act.insiderTip}
                                                            </div>
                                                        ) : (
                                                            <div className="border-l-2 border-[#EADFD4] pl-3 py-1 mb-3 text-xs font-sans text-naviigo-brown/70 leading-relaxed">
                                                                <span className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/50 mr-1.5">Guidance:</span>
                                                                {act.slot === 'Morning' ? 'Best experienced early before heat and crowds.' : (act.desc.toLowerCase().includes('rain') ? 'Check forecast · indoor options advised in rain.' : 'Allow leisurely buffer time to explore nearby alleyways.')}
                                                            </div>
                                                        )}

                                                        {/* Photo spot & advisory */}
                                                        {(act.bestPhotoSpot || act.whatToWear) && (
                                                            <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-[11px] text-naviigo-brown/70">
                                                                {act.bestPhotoSpot && (
                                                                    <span className="inline-flex items-center gap-1.5 bg-paper-warm px-2.5 py-1 rounded border border-[#EADFD4]">
                                                                        📸 <span className="text-naviigo-brown font-semibold">{act.bestPhotoSpot}</span>
                                                                    </span>
                                                                )}
                                                                {act.whatToWear && (
                                                                    <span className="inline-flex items-center gap-1.5 bg-paper-warm px-2.5 py-1 rounded border border-[#EADFD4]">
                                                                        👔 {act.whatToWear}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Actions & Logistics strip */}
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-[#EADFD4] gap-3">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {act.crowdTip && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-naviigo-brown/80 bg-paper-warm px-3 py-1 rounded border border-[#EADFD4]">
                                                                        <span className="text-brand-primary">✦</span> <span className="line-clamp-1">{act.crowdTip}</span>
                                                                    </div>
                                                                )}
                                                                {act.priceBase ? (
                                                                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-naviigo-brown bg-paper-warm px-3 py-1 rounded border border-[#EADFD4]">
                                                                        <span>EST:</span> ₹{act.priceBase.toLocaleString('en-IN')}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5 text-xs font-mono text-naviigo-brown/60 bg-paper-warm px-3 py-1 rounded border border-[#EADFD4]">
                                                                        <span>ENTRY:</span> Free / On site
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {act.bookingLink && (
                                                                    <a
                                                                        href={act.bookingLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-xs font-mono font-bold uppercase tracking-wider bg-brand-primary text-white px-3.5 py-1.5 rounded hover:bg-brand-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
                                                                    >
                                                                        {act.type === 'restaurant' ? 'Reserve Table' : 'Book Tickets'} ➔
                                                                    </a>
                                                                )}
                                                                <motion.button 
                                                                    whileTap={{ scale: 0.98 }} 
                                                                    onClick={(e) => { 
                                                                        e.stopPropagation(); 
                                                                        router.push(itineraryPlaceHref((act.type === 'restaurant' || act.type === 'hotel') ? act.type : 'attraction', destId, act));
                                                                    }}
                                                                    className="text-xs font-mono font-bold uppercase tracking-wider bg-paper-warm text-naviigo-brown border border-[#EADFD4] hover:border-brand-primary/50 px-3.5 py-1.5 rounded transition-colors"
                                                                >
                                                                    Place Dossier ➔
                                                                </motion.button>
                                                            </div>
                                                        </div>

                                                        {/* V2: Nearby gem mini-card */}
                                                        {act.nearbyGem && (
                                                            <div className="mt-3 pt-3 border-t border-dashed border-muted-200 dark:border-muted-700/50">
                                                                <div className="flex items-start gap-2 text-xs text-muted-600 dark:text-muted-400 bg-muted-50/80 dark:bg-muted-800/50 rounded-xl px-3 py-2 border border-muted-100 dark:border-muted-700/50">
                                                                    <span className="text-sm shrink-0 mt-0.5">📍</span>
                                                                    <div>
                                                                        <span className="font-bold text-muted-700 dark:text-muted-300">While you&apos;re here:</span>{' '}
                                                                        {act.nearbyGem}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Reorder.Item>
                                        );
                                    })}
                                </Reorder.Group>

                                {plan.activities.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-8 relative overflow-hidden rounded-3xl border border-muted-200/50 dark:border-white/10 bg-white/40 dark:bg-muted-900/40 backdrop-blur-xl p-8 text-center shadow-lg"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-jungle-green-500/5 to-deep-sea-500/5" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-white dark:bg-muted-800 rounded-full flex items-center justify-center shadow-md mb-4 text-2xl">
                                                🏖️
                                            </div>
                                            <h3 className="text-xl font-bold text-muted-900 dark:text-white mb-2">A Blank Canvas</h3>
                                            <p className="text-sm text-muted-500 dark:text-muted-400 max-w-sm mb-6">
                                                This day is completely free! Take a break, or add a custom activity to keep the adventure going.
                                            </p>
                                            <button onClick={() => setShowAddActivity(true)} className="px-6 py-2.5 rounded-xl bg-muted-900 text-white dark:bg-white dark:text-muted-900 text-sm font-bold hover:scale-105 transition-transform shadow-lg">
                                                + Add Activity
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                <AnimatePresence>
                                    {dayJustCompleted !== null && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="mt-4 bg-gradient-to-r from-jungle-green-500/10 to-deep-sea-500/10 border border-jungle-green-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-jungle-green-500 flex items-center justify-center text-2xl shadow-lg shadow-jungle-green-500/30 shrink-0">🎉</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-jungle-green-700 dark:text-jungle-green-400">Day {(dayJustCompleted || 0) + 1} Complete!</div>
                                                <div className="text-xs font-semibold text-jungle-green-600 dark:text-jungle-green-500">+100 XP Day Bonus (saved on trip end)</div>
                                            </div>
                                            <button onClick={clearDayJustCompleted} className="text-xs text-jungle-green-600 hover:text-jungle-green-800 bg-jungle-green-500/20 px-3 py-1.5 rounded-lg font-bold transition-colors">Dismiss</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Nearby Recommendations */}
                                {(data.hotels?.length > 0 || data.restaurants?.length > 0) && (
                                    <div className="mt-8 pt-6 border-t border-[#EADFD4]">
                                        <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                            <h3 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-widest">Nearby Waypoints</h3>
                                            <span className="font-mono text-[10px] text-naviigo-brown/50">CURATED LOCAL ARCHIVE</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {data.hotels && data.hotels.length > 0 && (
                                                <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm group cursor-pointer hover:border-brand-primary/50 transition-all"
                                                    onClick={() => {
                                                        router.push(itineraryPlaceHref('hotel', destId, data.hotels[0]));
                                                    }}>
                                                    <div className="flex items-center gap-2 mb-2 font-mono text-[10px] font-bold text-naviigo-brown/60 uppercase tracking-widest">
                                                        <span>🏨</span> Stay Dossier
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <PlaceImage name={data.hotels[0].name} city={destName} className="w-16 h-16 rounded-lg object-cover shrink-0" asBackground />
                                                        <div className="flex flex-col justify-center min-w-0">
                                                            <div className="font-display font-bold text-base text-naviigo-brown line-clamp-1 group-hover:text-brand-primary transition-colors">{data.hotels[0].name}</div>
                                                            <div className="font-mono text-[11px] text-naviigo-brown/60 mt-0.5">{data.hotels[0].type} • {data.hotels[0].priceRange}</div>
                                                            <div className="font-mono text-[11px] font-bold text-brand-primary mt-1">★ {data.hotels[0].rating}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {data.restaurants && data.restaurants.length > 0 && (
                                                <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-4 shadow-sm group cursor-pointer hover:border-brand-primary/50 transition-all"
                                                    onClick={() => {
                                                        router.push(itineraryPlaceHref('restaurant', destId, data.restaurants[0]));
                                                    }}>
                                                    <div className="flex items-center gap-2 mb-2 font-mono text-[10px] font-bold text-naviigo-brown/60 uppercase tracking-widest">
                                                        <span>🍽️</span> Gastronomy
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <PlaceImage name={data.restaurants[0].name} city={destName} className="w-16 h-16 rounded-lg object-cover shrink-0" asBackground />
                                                        <div className="flex flex-col justify-center min-w-0">
                                                            <div className="font-display font-bold text-base text-naviigo-brown line-clamp-1 group-hover:text-brand-primary transition-colors">{data.restaurants[0].name}</div>
                                                            <div className="font-mono text-[11px] text-naviigo-brown/60 mt-0.5">{data.restaurants[0].cuisine}</div>
                                                            <div className="font-mono text-[11px] font-bold text-brand-primary mt-1">★ {data.restaurants[0].rating}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Search & Add Panel */}
                                <div className="mt-8 bg-paper-light border border-[#EADFD4] rounded-xl p-6 shadow-sm">
                                    <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                        <h4 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-widest flex items-center gap-2">
                                            <span>✦ INDEX A CUSTOM DESTINATION</span>
                                        </h4>
                                        <span className="font-mono text-[10px] text-naviigo-brown/50">OPEN WAYPOINT REGISTRY</span>
                                    </div>
                                    <form onSubmit={handleSearch} className="flex gap-3">
                                        <input 
                                            type="text" 
                                            value={searchQuery} 
                                            onChange={(e) => setSearchQuery(e.target.value)} 
                                            placeholder="Search cafes, hidden viewpoints, historic alleys..."
                                            className="flex-1 bg-paper-warm border border-[#EADFD4] text-naviigo-brown rounded-lg px-4 py-2.5 text-sm font-sans focus:outline-none focus:border-brand-primary placeholder:text-naviigo-brown/40 transition-all shadow-inner" 
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isSearching} 
                                            className="bg-brand-primary text-white px-5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-sm hover:bg-brand-primary/90 disabled:opacity-50 transition-all active:scale-95"
                                        >
                                            {isSearching ? '...' : 'Search →'}
                                        </button>
                                    </form>
                                    {searchRes.length > 0 && (
                                        <div className="mt-4 bg-paper-warm rounded-lg border border-[#EADFD4] overflow-hidden divide-y divide-[#EADFD4]">
                                            {searchRes.map(res => (
                                                <div key={res.place_id} className="p-3 flex items-center justify-between gap-4 hover:bg-paper-light transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-display font-bold text-sm text-naviigo-brown line-clamp-1">{res.name || res.display_name.split(',')[0]}</div>
                                                        <div className="font-mono text-[10px] text-naviigo-brown/60 line-clamp-1 mt-0.5">{res.display_name}</div>
                                                    </div>
                                                    <button onClick={() => addCustomActivity(res)} className="px-3.5 py-1.5 bg-brand-primary text-white rounded font-mono text-xs font-bold uppercase tracking-wider hover:bg-brand-primary/90 transition-transform shrink-0 shadow-sm">Index</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-6 pt-5 border-t border-[#EADFD4]">
                                        <h4 className="font-mono text-[10px] font-bold text-naviigo-brown/60 uppercase tracking-widest mb-3">Signature Regional Highlights</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {data.highlights?.filter((a: any) => !plan.activities.find((pa: any) => pa.name === a.name)).slice(0, 4).map((sug: any) => (
                                                <div key={sug.name} className="bg-paper-warm border border-[#EADFD4] rounded-lg p-2.5 flex gap-3 group cursor-pointer hover:border-brand-primary/50 transition-all"
                                                    onClick={() => addCustomActivity({ name: sug.name, display_name: sug.desc, lat: sug.lat || data.mapCenter.lat, lon: sug.lng || data.mapCenter.lng })}>
                                                    <PlaceImage name={sug.name} city={destName} className="w-10 h-10 rounded object-cover shrink-0" asBackground />
                                                    <div className="min-w-0 flex flex-col justify-center">
                                                        <div className="font-display text-xs font-bold text-naviigo-brown truncate group-hover:text-brand-primary transition-colors">{sug.name}</div>
                                                        <div className="font-mono text-[9px] text-naviigo-brown/60 truncate mt-0.5">{sug.desc}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right Column: Sticky Editorial Wayfinding Visual */}
                <div className="hidden lg:block lg:w-[420px] xl:w-[480px] shrink-0 self-start sticky top-[90px] z-10 pb-4">
                    {/* Editorial Telemetry Header */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-paper-light border border-[#EADFD4] rounded-xl mb-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                            <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-naviigo-brown">Wayfinding Geometry</span>
                        </div>
                        <span className="font-mono text-[10px] text-naviigo-brown/60">
                            {data.mapCenter?.lat ? `${data.mapCenter.lat.toFixed(2)}°N · ${data.mapCenter.lng.toFixed(2)}°E` : 'Live Telemetry'}
                        </span>
                    </div>

                    <div className="h-[calc(100vh-160px)] min-h-[500px] rounded-xl overflow-hidden border border-[#EADFD4] shadow-md bg-paper-warm">
                        <ItineraryMap
                            pins={mapPins}
                            center={data.mapCenter}
                            zoom={12}
                            showRoute={true}
                            activePin={activeActivity >= 0 ? activeActivity : undefined}
                            onRouteCalculated={(legs: { distance: string, time: string }[]) => { if (legs && legs.length > 0) setDayRouteInfo(legs[0]); }}
                            className="w-full h-full"
                        />
                    </div>
                </div>
                </div>
            </div>
            <CheckpointToast toasts={toasts} />
            <StampCelebration
                result={celebrationResult}
                onClose={() => setCelebrationResult(null)}
                onViewPassport={() => router.push('/passport')}
            />
        </div>
    );
}
