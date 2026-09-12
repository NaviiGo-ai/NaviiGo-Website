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
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20">
            {/* Top bar */}
            <div className="sticky top-16 sm:top-20 z-40 bg-white/80 dark:bg-muted-900/80 backdrop-blur-lg border-b border-muted-100 dark:border-white/5 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
                <button onClick={onBack} className="w-9 h-9 rounded-full border border-muted-200 dark:border-muted-700 flex items-center justify-center hover:bg-muted-50 dark:hover:bg-muted-800 transition-colors text-sm text-muted-600 dark:text-muted-300">←</button>
                <button onClick={() => router.push('/itinerary?new=true')} className="hidden sm:flex w-9 h-9 rounded-full border border-jungle-green-500/30 items-center justify-center hover:bg-jungle-green-50 dark:hover:bg-jungle-green-500/10 transition-colors text-jungle-green-600 dark:text-jungle-green-400" title="Create New Itinerary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </button>
                <div className="flex-1">
                    <h1 className="font-bold text-muted-900 dark:text-white text-sm truncate">{destName} — <span className="hidden sm:inline">Day-by-Day </span>Itinerary</h1>
                    <p className="text-xs text-muted-400 hidden sm:block">Full plan with crowd & weather alerts</p>
                </div>
                <ShareDropdown onCopyLink={handleShare} destName={destName} isSharing={isSharing} collaborators={collaborators} planData={{ ...data, dayPlans: customPlans }} />
                {user && (
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => isTripActive ? stopTrip() : startTrip()}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isTripActive
                                ? 'bg-temple-red-500/10 text-temple-red-500 border border-temple-red-500/30 hover:bg-temple-red-500/20'
                                : 'bg-gradient-to-r from-jungle-green-500 to-deep-sea-500 text-white shadow-lg shadow-jungle-green-500/20 hover:shadow-jungle-green-500/40'
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
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${isSaved ? 'bg-jungle-green-100 dark:bg-jungle-green-500/20 text-jungle-green-700 dark:text-jungle-green-400 cursor-default' : 'bg-muted-900 dark:bg-white text-white dark:text-muted-900 hover:bg-muted-800 dark:hover:bg-muted-200'}`}>
                    {isSaved ? '✓ Saved' : '💾 Save'}
                </motion.button>
            </div>

            {/* Day tabs */}
            <div className="sticky top-[104px] sm:top-[120px] z-10 bg-white/80 dark:bg-muted-900/80 backdrop-blur-lg border-b border-muted-100 dark:border-white/5 px-3 sm:px-4 py-2 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                    {data.dayPlans.map((dp: DayPlan, i: number) => (
                        <button key={dp.day} onClick={() => {
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
                            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${activeDay === i ? 'bg-jungle-green-500 text-white shadow-md shadow-jungle-green-500/25' : 'bg-muted-100 dark:bg-muted-800 text-muted-600 dark:text-muted-400 hover:bg-muted-200 dark:hover:bg-muted-700'}`}>
                            Day {dp.day}
                        </button>
                    ))}
                </div>

                {isTripActive && (() => {
                    const progress = getProgress();
                    const pColor = progress.percent < 34 ? 'from-deep-sea-500 to-cyan-500' :
                                progress.percent < 67 ? 'from-marigold-500 to-saffron-500' :
                                progress.percent < 100 ? 'from-jungle-green-500 to-deep-sea-500' :
                                'from-marigold-400 to-yellow-300';
                    return (
                        <div className="mt-2 pt-2 border-t border-muted-100 dark:border-muted-800">
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                <span className="text-muted-500">Trip Progress</span>
                                <span className="text-muted-700 dark:text-muted-300">{progress.completed}/{progress.total} activities ({progress.percent}%)</span>
                            </div>
                            <div className="h-1.5 bg-muted-100 dark:bg-muted-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress.percent}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className={`h-full rounded-full bg-gradient-to-r ${pColor}`}
                                />
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
                {/* Live weather strip for the destination */}
                {center && (
                    <div className="mb-6">
                        <WeatherStrip lat={center.lat} lng={center.lng} label={destName} />
                    </div>
                )}
                {/* 2-Col Layout at page level */}
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Animating Day Dashboard + Timeline */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div key={activeDay} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                                {/* DAY DASHBOARD */}
                                <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-muted-900 dark:text-white truncate">Day {plan.day}: {plan.title}</h2>
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
                                }} className="text-xs bg-muted-900 dark:bg-white text-white dark:text-muted-900 px-3 py-1.5 rounded-full font-bold shadow-sm hover:scale-105 transition-transform hidden sm:flex items-center gap-1.5 shrink-0">
                                    <span>📅</span> Add to Calendar
                                </motion.button>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                {/* Weather */}
                                <div className={`rounded-2xl border p-4 flex items-center gap-4 shadow-sm transition-all ${plan.weather.temp.includes('°C') ? 'bg-gradient-to-br from-deep-sea-500/10 to-cyan-500/10 border-deep-sea-500/20' : 'bg-white dark:bg-muted-900 border-muted-100 dark:border-muted-800'}`}>
                                    <span className="text-4xl">{plan.weather.temp.includes('°C') ? '🌤️' : plan.weather.emoji}</span>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-bold text-lg text-muted-900 dark:text-white leading-tight">{plan.weather.temp}</div>
                                            {plan.weather.temp.includes('°C') && <span className="text-[9px] bg-deep-sea-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Live</span>}
                                        </div>
                                        <div className="text-xs text-muted-500">{plan.weather.temp.includes('°C') ? 'Exact Forecast' : plan.weather.condition}</div>
                                        <div className="text-xs text-jungle-green-600 dark:text-jungle-green-400 mt-0.5 font-medium flex items-center gap-1">
                                            <span className="text-[10px]">💡</span> {plan.weather.tip}
                                        </div>
                                    </div>
                                </div>

                                {/* Daily Budget Progress */}
                                <div className="bg-white dark:bg-muted-900 rounded-2xl border border-muted-100 dark:border-muted-800 p-4 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-xs font-bold text-muted-700 dark:text-muted-300 flex items-center gap-1.5"><span>💳</span> Daily Budget Use</h4>
                                        <span className="text-[10px] font-bold text-jungle-green-600 bg-jungle-green-50 dark:bg-jungle-green-500/10 px-1.5 py-0.5 rounded">
                                            ₹{(form.budget as number / (form.days as number || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} cap
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-muted-100 dark:bg-muted-800 rounded-full overflow-hidden flex">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (plan.activities.length * 20))}%` }} transition={{ duration: 1 }} className={`h-full ${plan.activities.length > 4 ? 'bg-marigold-400' : 'bg-jungle-green-500'}`} />
                                    </div>
                                    {data.estimatedTravelCost ? (
                                        <div className="text-[9px] font-bold text-jungle-green-600 dark:text-jungle-green-400 mt-2 line-clamp-1" title={data.estimatedTravelCost}>
                                            ✈️ {data.estimatedTravelCost}
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-muted-400 mt-2 text-right">{plan.activities.length} activities planned</div>
                                    )}
                                </div>

                                {/* Crowd Context */}
                                <div className="bg-white dark:bg-muted-900 rounded-2xl border border-muted-100 dark:border-muted-800 p-4 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                                    <h4 className="text-xs font-bold text-muted-700 dark:text-muted-300 mb-2 flex items-center gap-1.5"><span>👥</span> Crowd Level</h4>
                                    <div className="flex gap-2">
                                        {(['Low', 'Medium', 'High'] as CrowdLevel[]).map(level => {
                                            const count = plan.activities.filter(a => a.crowd === level).length;
                                            if (count === 0) return null;
                                            return (
                                                <div key={level} className="flex-1 bg-muted-50 dark:bg-muted-800 rounded-lg p-1.5 text-center">
                                                    <CrowdDot level={level} />
                                                    <div className="text-[10px] font-medium text-muted-600 dark:text-muted-400 mt-0.5">{count} {level}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Route Info */}
                                {dayRouteInfo && routeIsSane ? (
                                    <div className="bg-gradient-to-br from-indigo-50 to-deep-sea-50 dark:from-indigo-500/10 dark:to-deep-sea-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 p-4 shadow-sm flex flex-col justify-center hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 mb-1"><span className="text-xl">🗺️</span><span className="font-bold text-xs text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">Today&apos;s Commute</span></div>
                                        <div className="font-bold text-indigo-700 dark:text-indigo-400 text-lg leading-tight">{dayRouteInfo.time}</div>
                                        <div className="text-[11px] text-indigo-600/70 dark:text-indigo-400/70 font-medium">{dayRouteInfo.distance} total travel</div>
                                    </div>
                                ) : dayRouteInfo && !routeIsSane ? (
                                    <div className="bg-marigold-50 dark:bg-marigold-500/10 rounded-2xl border border-marigold-200 dark:border-marigold-500/20 p-4 shadow-sm flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1"><span className="text-xl">🚶</span><span className="font-bold text-xs text-marigold-800 dark:text-marigold-300 uppercase tracking-wide">Within City</span></div>
                                        <div className="font-bold text-marigold-700 dark:text-marigold-400 text-sm leading-tight">All spots are within the city</div>
                                        <div className="text-[11px] text-marigold-600/70 dark:text-marigold-400/70 font-medium">Auto/cab between activities</div>
                                    </div>
                                ) : (
                                    <div className="bg-muted-50 dark:bg-muted-800/50 rounded-2xl border border-muted-100 dark:border-muted-800 p-4 shadow-sm flex flex-col items-center justify-center text-center opacity-70">
                                        <div className="text-base mb-1">📍</div>
                                        <div className="text-[10px] font-medium text-muted-500">Calculating route...</div>
                                    </div>
                                )}
                            </div>

                            {/* Top Stays */}
                            {data.hotels && data.hotels.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-xs font-bold text-muted-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span>🏨</span> Top Stays For Your Budget
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {data.hotels.slice(0, 3).map((hotel: any, i: number) => (
                                            <div key={i} className="group relative bg-white dark:bg-muted-900 rounded-2xl border border-muted-100 dark:border-muted-800 overflow-hidden shadow-sm hover:shadow-xl hover:-tranmuted-y-1 transition-all flex flex-col">
                                                <PlaceImage name={hotel.name} city={destName} className="h-28 w-full shrink-0" asBackground />
                                                <div className="p-3 flex-1 flex flex-col">
                                                    <div className="font-bold text-sm text-muted-900 dark:text-white line-clamp-1 mb-0.5">{hotel.name}</div>
                                                    <div className="text-[11px] text-muted-500 line-clamp-2 mb-3 flex-1">{hotel.desc}</div>
                                                    <div className="flex items-center justify-between mt-auto">
                                                        <div>
                                                            <div className="text-[10px] font-bold text-marigold-500">★ {hotel.rating}</div>
                                                            <div className="text-xs font-semibold text-jungle-green-600 dark:text-jungle-green-400">{hotel.priceRange}</div>
                                                        </div>
                                                        {hotel.bookingLink && (
                                                            <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-jungle-green-50 dark:bg-jungle-green-500/10 text-jungle-green-600 dark:text-jungle-green-400 text-xs font-bold rounded-lg hover:bg-jungle-green-100 dark:hover:bg-jungle-green-500/20 transition-colors">
                                                                Book
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
                                                    <div className="flex items-center gap-3 mb-6 mt-8 first:mt-0">
                                                        <span className="text-xl bg-white dark:bg-muted-800 rounded-full w-8 h-8 flex items-center justify-center shadow-sm border border-muted-200 dark:border-muted-700">{slotEmoji[act.slot]}</span>
                                                        <span className="text-sm font-bold text-muted-800 dark:text-muted-200 uppercase tracking-widest">{act.slot}</span>
                                                        <div className="flex-1 h-px bg-muted-200 dark:bg-muted-800" />
                                                    </div>
                                                )}
                                                {act.travelFromPrev && i > 0 && plan.activities[i-1]?.lat && act.lat && (
                                                    <TransportCompare
                                                        fromLat={plan.activities[i-1].lat}
                                                        fromLng={plan.activities[i-1].lng}
                                                        toLat={act.lat}
                                                        toLng={act.lng}
                                                        fromName={plan.activities[i-1].name}
                                                        toName={act.name}
                                                    />
                                                )}
                                                {act.travelFromPrev && (!act.lat || i === 0 || !plan.activities[i-1]?.lat) && (
                                                    <div className="flex items-center gap-3 ml-[38px] mb-4">
                                                        <div className="w-1.5 flex flex-col gap-1.5 items-center justify-center h-10">
                                                            <div className="w-[3px] h-[3px] bg-muted-300 dark:bg-muted-700 rounded-full" />
                                                            <div className="w-[3px] h-[3px] bg-muted-300 dark:bg-muted-700 rounded-full" />
                                                            <div className="w-[3px] h-[3px] bg-muted-300 dark:bg-muted-700 rounded-full" />
                                                        </div>
                                                        <span className="text-[10px] font-black tracking-tight text-muted-500 dark:text-muted-400 bg-white dark:bg-muted-800 border border-muted-200 dark:border-muted-700 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                                                            <span className="text-sm opacity-100 group-hover:scale-125 transition-transform">🚗</span>
                                                            {act.travelFromPrev}
                                                        </span>
                                                    </div>
                                                )}
                                                <div 
                                                    className="flex gap-4 mb-4 cursor-grab active:cursor-grabbing group" onClick={() => setActiveActivity(isActive ? -1 : i)}>
                                                    <div className="flex flex-col items-center pt-2">
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
                                                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-jungle-green-400 to-deep-sea-500 flex items-center justify-center shadow-lg shadow-jungle-green-500/30"
                                                                    >
                                                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                                                    </motion.div>
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-300 dark:border-muted-600 bg-white dark:bg-muted-900 flex items-center justify-center text-muted-400 group-hover/check:border-jungle-green-400 group-hover/check:text-jungle-green-400 transition-colors">
                                                                        <Circle className="w-5 h-5" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <div className={`w-10 h-10 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-lg shrink-0 transition-transform duration-300
                                                                ${isActive ? 'bg-muted-900 dark:bg-jungle-green-500 scale-110' : 'bg-jungle-green-500 dark:bg-muted-800'}`}>{i + 1}</div>
                                                        )}
                                                        {!isLast && <div className={`w-0.5 flex-1 mt-3 rounded-full transition-colors ${isActive ? 'bg-muted-900 dark:bg-jungle-green-500' : 'bg-jungle-green-100 dark:bg-muted-800'}`} />}
                                                    </div>
                                                    <div className={`flex-1 bg-white/80 dark:bg-muted-900/80 backdrop-blur-xl rounded-[1.5rem] border p-5 transition-all relative overflow-hidden group-hover:shadow-lg
                            ${isActive ? 'border-muted-500 dark:border-jungle-green-500/50 shadow-xl scale-[1.02]' : 'border-white/20 dark:border-muted-700/50 shadow-sm'} ${isTripActive && isChecked(activeDay, act.name) ? 'opacity-60 grayscale-[30%]' : ''}`}>
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="pr-4">
                                                                <div className="inline-flex items-center gap-2 mb-2">
                                                                    <span className="px-2.5 py-1 bg-muted-100 dark:bg-muted-800 rounded-lg text-xs font-bold text-muted-700 dark:text-muted-300 font-mono tracking-tight">{act.time}</span>
                                                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${CROWD_COLOR[act.crowd]}`}>
                                                                        <CrowdDot level={act.crowd} /> {act.crowd}
                                                                    </div>
                                                                </div>
                                                                <h4 className={"font-bold text-muted-900 dark:text-white text-lg leading-tight transition-all" + (isTripActive && isChecked(activeDay, act.name) ? ' line-through text-muted-400 dark:text-muted-500' : '')}>{act.name}</h4>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex bg-muted-100 dark:bg-muted-800 rounded-xl text-muted-500 overflow-hidden shrink-0 border border-muted-200 dark:border-muted-700 shadow-sm items-center">
                                                                <div className="px-2 cursor-grab active:cursor-grabbing text-muted-400 hover:text-muted-600 dark:hover:text-muted-200">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="8" x2="20" y2="8"></line><line x1="4" y1="16" x2="20" y2="16"></line></svg>
                                                                </div>
                                                                <button onClick={(e) => { e.stopPropagation(); removeActivity(i); }} className="w-8 h-8 flex items-center justify-center hover:bg-temple-red-500 hover:text-white transition-colors border-l border-muted-200 dark:border-muted-700">✕</button>
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-muted-600 dark:text-muted-400 mb-3 leading-relaxed line-clamp-3">{act.desc}</p>

                                                        {/* V2: Category badge */}
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            {act.category === 'hidden-gem' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                                                                    💎 Hidden Gem
                                                                </span>
                                                            )}
                                                            {act.category === 'local-secret' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-temple-red-50 text-temple-red-700 dark:bg-temple-red-500/15 dark:text-temple-red-400 border border-temple-red-200 dark:border-temple-red-500/30">
                                                                    🤫 Local Secret
                                                                </span>
                                                            )}
                                                            {act.category === 'experience' && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-marigold-50 text-marigold-700 dark:bg-marigold-500/15 dark:text-marigold-400 border border-marigold-200 dark:border-marigold-500/30">
                                                                    ✨ Experience
                                                                </span>
                                                            )}
                                                            {act.entryFee && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-jungle-green-50 text-jungle-green-700 dark:bg-jungle-green-500/10 dark:text-jungle-green-400 border border-jungle-green-200 dark:border-jungle-green-500/20">
                                                                    🎟️ {act.entryFee}
                                                                </span>
                                                            )}
                                                            {act.openingHours && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-muted-50 text-muted-600 dark:bg-muted-800 dark:text-muted-400 border border-muted-200 dark:border-muted-700">
                                                                    🕐 {act.openingHours}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* V2: Insider tip (replaces generic blue tip when available) */}
                                                        {act.insiderTip ? (
                                                            <div className="text-[11px] font-semibold px-3 py-2 rounded-xl bg-gradient-to-r from-marigold-50 to-saffron-50 dark:from-marigold-500/10 dark:to-saffron-500/10 text-marigold-800 dark:text-marigold-300 border border-marigold-200/60 dark:border-marigold-500/20 mb-3 leading-relaxed">
                                                                🤫 <span className="font-bold">Insider:</span> {act.insiderTip}
                                                            </div>
                                                        ) : (
                                                            <div className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-deep-sea-50/80 text-deep-sea-700 dark:bg-deep-sea-500/10 dark:text-deep-sea-400 border border-deep-sea-100 dark:border-deep-sea-500/20 inline-flex items-center gap-1.5 mb-3">
                                                                {act.slot === 'Morning' ? '👍 Best time: Early' : (act.desc.toLowerCase().includes('rain') ? '⚠️ Skip if raining' : '☕ Pair with nearby cafe')}
                                                            </div>
                                                        )}

                                                        {/* V2: Best photo spot */}
                                                        {act.bestPhotoSpot && (
                                                            <div className="text-[11px] px-3 py-1.5 rounded-lg bg-sky-50/80 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-100 dark:border-sky-500/20 inline-flex items-center gap-1.5 mb-3">
                                                                📸 <span className="font-bold">Photo spot:</span> {act.bestPhotoSpot}
                                                            </div>
                                                        )}

                                                        {/* V2: What to wear advisory */}
                                                        {act.whatToWear && (
                                                            <div className="text-[11px] px-3 py-1.5 rounded-lg bg-muted-50 text-muted-600 dark:bg-muted-800 dark:text-muted-400 border border-muted-200 dark:border-muted-700 inline-flex items-center gap-1.5 mb-3">
                                                                👔 {act.whatToWear}
                                                            </div>
                                                        )}

                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-muted-100 dark:border-muted-800/80 gap-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                <div className="flex items-center gap-1.5 text-xs font-medium bg-marigold-50 dark:bg-marigold-500/10 text-marigold-700 dark:text-marigold-400 rounded-lg px-3 py-1 max-w-[300px]">
                                                                    <span className="shrink-0">💡</span> <span className="line-clamp-2">{act.crowdTip}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-700 dark:text-muted-300 bg-muted-50 dark:bg-muted-800 rounded-lg px-3 py-1 border border-muted-200 dark:border-muted-700 shadow-sm">
                                                                    <span>💳</span> ₹{act.priceBase || [250, 400, 800, 1500][i % 4]}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {act.bookingLink && (
                                                                    <a
                                                                        href={act.bookingLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-xs font-bold bg-deep-sea-600 text-white px-4 py-1.5 rounded-xl hover:bg-deep-sea-700 transition-colors shadow-sm flex items-center gap-1.5"
                                                                    >
                                                                        {act.type === 'restaurant' ? 'Reserve Table' : 'Get Tickets'} ➔
                                                                    </a>
                                                                )}
                                                                <motion.button whileTap={{ scale: 0.98 }} onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    router.push(itineraryPlaceHref((act.type === 'restaurant' || act.type === 'hotel') ? act.type : 'attraction', destId, act));
                                                                }}
                                                                    className="text-xs font-bold bg-jungle-green-50 text-jungle-green-700 dark:bg-jungle-green-500/10 dark:text-jungle-green-400 px-4 py-1.5 rounded-xl hover:bg-jungle-green-100 dark:hover:bg-jungle-green-500/20 transition-colors">
                                                                    Explorer ➔
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
                                    <div className="mt-8 pt-8 border-t border-muted-200 dark:border-muted-800">
                                        <h3 className="text-muted-900 dark:text-white font-bold text-xl mb-4">Nearby Recommendations</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {data.hotels && data.hotels.length > 0 && (
                                                <div className="bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-2xl p-4 shadow-sm group cursor-pointer hover:shadow-md transition-all"
                                                    onClick={() => {
                                                        router.push(itineraryPlaceHref('hotel', destId, data.hotels[0]));
                                                    }}>
                                                    <div className="flex items-center gap-3 mb-2 text-xs font-bold text-muted-400 uppercase tracking-widest"><span className="text-base leading-none">🏨</span> Place to stay</div>
                                                    <div className="flex gap-4">
                                                        <PlaceImage name={data.hotels[0].name} city={destName} className="w-16 h-16 rounded-xl shrink-0" asBackground />
                                                        <div className="flex flex-col justify-center">
                                                            <div className="font-bold text-base text-muted-900 dark:text-white line-clamp-1 group-hover:text-jungle-green-500 transition-colors">{data.hotels[0].name}</div>
                                                            <div className="text-xs text-muted-500 mt-0.5">{data.hotels[0].type} • {data.hotels[0].priceRange}</div>
                                                            <div className="text-xs font-bold text-marigold-500 mt-1">★ {data.hotels[0].rating}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {data.restaurants && data.restaurants.length > 0 && (
                                                <div className="bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-2xl p-4 shadow-sm group cursor-pointer hover:shadow-md transition-all"
                                                    onClick={() => {
                                                        router.push(itineraryPlaceHref('restaurant', destId, data.restaurants[0]));
                                                    }}>
                                                    <div className="flex items-center gap-3 mb-2 text-xs font-bold text-muted-400 uppercase tracking-widest"><span className="text-base leading-none">🍽️</span> Where to eat</div>
                                                    <div className="flex gap-4">
                                                        <PlaceImage name={data.restaurants[0].name} city={destName} className="w-16 h-16 rounded-xl shrink-0" asBackground />
                                                        <div className="flex flex-col justify-center">
                                                            <div className="font-bold text-base text-muted-900 dark:text-white line-clamp-1 group-hover:text-marigold-500 transition-colors">{data.restaurants[0].name}</div>
                                                            <div className="text-xs text-muted-500 mt-0.5">{data.restaurants[0].cuisine}</div>
                                                            <div className="text-xs font-bold text-marigold-500 mt-1">★ {data.restaurants[0].rating}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Search & Add Panel */}
                                <div className="mt-8 bg-muted-100 dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-[2rem] p-6 shadow-inner">
                                    <h4 className="font-bold text-lg text-muted-900 dark:text-white mb-4 flex items-center gap-2">
                                        <span className="p-2 bg-jungle-green-100 dark:bg-jungle-green-500/20 text-jungle-green-600 dark:text-jungle-green-400 rounded-xl">➕</span>
                                        Add a spot
                                    </h4>
                                    <form onSubmit={handleSearch} className="flex gap-3">
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cafes, hidden gems..."
                                            className="flex-1 bg-white dark:bg-muted-800 border border-muted-300 dark:border-muted-700 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-jungle-green-500 focus:border-transparent transition-all shadow-sm" />
                                        <button type="submit" disabled={isSearching} className="bg-jungle-green-600 text-white px-6 rounded-2xl text-sm font-bold shadow-md hover:bg-jungle-green-500 hover:shadow-lg disabled:opacity-50 transition-all active:scale-95">
                                            {isSearching ? '...' : 'Search'}
                                        </button>
                                    </form>
                                    {searchRes.length > 0 && (
                                        <div className="mt-4 bg-white dark:bg-muted-800 rounded-2xl border border-muted-200 dark:border-muted-700 overflow-hidden divide-y divide-muted-100 dark:divide-muted-700/50">
                                            {searchRes.map(res => (
                                                <div key={res.place_id} className="p-3 flex items-center justify-between gap-4 hover:bg-muted-50 dark:hover:bg-muted-700/50 transition-colors">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-bold text-sm text-muted-900 dark:text-white line-clamp-1">{res.name || res.display_name.split(',')[0]}</div>
                                                        <div className="text-[11px] text-muted-500 line-clamp-1 mt-0.5">{res.display_name}</div>
                                                    </div>
                                                    <button onClick={() => addCustomActivity(res)} className="px-4 py-1.5 bg-muted-900 dark:bg-white text-white dark:text-muted-900 rounded-xl text-xs font-bold hover:scale-105 transition-transform shrink-0 shadow-sm">Add</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-6 pt-6 border-t border-muted-200 dark:border-muted-800/80">
                                        <h4 className="text-xs font-bold text-muted-500 uppercase tracking-widest mb-3">Or Pick a Top Highlight</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {data.highlights?.filter((a: any) => !plan.activities.find((pa: any) => pa.name === a.name)).slice(0, 4).map((sug: any) => (
                                                <div key={sug.name} className="bg-white dark:bg-muted-800 border border-muted-200 dark:border-muted-700 rounded-xl p-2.5 flex gap-3 group cursor-pointer hover:border-jungle-green-400 hover:shadow-md transition-all"
                                                    onClick={() => addCustomActivity({ name: sug.name, display_name: sug.desc, lat: sug.lat || data.mapCenter.lat, lon: sug.lng || data.mapCenter.lng })}>
                                                    <PlaceImage name={sug.name} city={destName} className="w-10 h-10 rounded-lg shrink-0" asBackground />
                                                    <div className="min-w-0 flex flex-col justify-center">
                                                        <div className="text-[11px] font-bold text-muted-900 dark:text-white truncate group-hover:text-jungle-green-600 transition-colors">{sug.name}</div>
                                                        <div className="text-[9px] text-muted-500 truncate mt-0.5">{sug.desc}</div>
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

                {/* Right Column: Sticky Map */}
                <div className="hidden lg:block lg:w-[400px] xl:w-[500px] shrink-0 self-start sticky top-[100px] z-10 pb-4">
                    <div className="h-[calc(100vh-140px)] min-h-[500px] rounded-[2rem] overflow-hidden border-4 border-white dark:border-muted-800 shadow-xl bg-muted-100 dark:bg-muted-900">
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
