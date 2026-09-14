'use client';

import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { useAI } from '@/context/AIContext';
import { useCheckpoints } from '@/lib/useCheckpoints';
import { completeTripAndAwardStamp, type AwardResult } from '@/lib/passportService';
import { updateLeaderboardEntry } from '@/lib/leaderboard';
import CheckpointToast, { useCheckpointToast } from '@/components/features/passport/CheckpointToast';
import StampCelebration from '@/components/features/passport/StampCelebration';
import { DESTINATIONS } from '@/app/itinerary/data';
import { 
    CheckCircle2, Circle, Rocket, MapPin, Clock, Calendar, 
    Compass, ExternalLink, X, ChevronRight, Sparkles, Navigation, 
    Coffee, Camera, Tag, UtensilsCrossed, BedDouble, AlertCircle
} from 'lucide-react';
import { itineraryPlaceHref } from '@/lib/placeLinks';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });

interface DayViewPageProps {
    form: Record<string, unknown>;
    generatedData?: any;
    onBack: () => void;
}

export default function DayViewPage({ form, generatedData, onBack }: DayViewPageProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { registerItinerary, unregisterItinerary } = useAI();
    const [isSaved, setIsSaved] = useState(false);
    const destId = (form.destination as string) || (form.destId as string) || '';
    const destName = (form.destName as string) || (form.destination as string) || 'India Expedition';
    const staticData = destId ? DEST_DATA[destId.toLowerCase()] : undefined;

    const data: any = useMemo(() => {
        const emptyBase = {
            description: destName ? `Curated roadbook through ${destName}` : '',
            avgCost: '',
            weather: {},
            crowdLevel: 'Medium',
            crowdNote: '',
            highlights: [],
            restaurants: [],
            hotels: [],
            dayPlans: [],
            mapCenter: { lat: 20.5937, lng: 78.9629 },
            estimatedTravelCost: undefined
        };
        const base = staticData ? { ...emptyBase, ...staticData } : emptyBase;
        return generatedData ? { ...base, ...generatedData } : base;
    }, [generatedData, staticData, destName]);

    const availablePlans: DayPlan[] = useMemo(() => {
        if (Array.isArray(generatedData?.dayPlans) && generatedData.dayPlans.length > 0) {
            return generatedData.dayPlans;
        }
        if (Array.isArray(data?.dayPlans) && data.dayPlans.length > 0) {
            return data.dayPlans;
        }
        return [];
    }, [generatedData?.dayPlans, data?.dayPlans]);

    const totalDays = Math.max(1, availablePlans.length || 1);
    const initialDay = typeof form._initialDay === 'number' ? form._initialDay : 0;
    const [activeDay, setActiveDay] = useState(() => Math.max(0, Math.min(initialDay, totalDays - 1)));
    const [activeActivity, setActiveActivity] = useState<number>(-1);
    const [dayRouteInfo, setDayRouteInfo] = useState<{ distance: string, time: string } | null>(null);
    const [selectedDossier, setSelectedDossier] = useState<any | null>(null);
    const [showMobileMap, setShowMobileMap] = useState(false);

    const [customPlans, setCustomPlans] = useState<DayPlan[]>(() => {
        if (Array.isArray(form.customPlans) && form.customPlans.length > 0) return form.customPlans as DayPlan[];
        if (availablePlans.length > 0) return JSON.parse(JSON.stringify(availablePlans));
        return [];
    });

    // Synchronize customPlans whenever availablePlans arrives asynchronously
    useEffect(() => {
        if (availablePlans.length > 0) {
            if (customPlans.length === 0 || customPlans.length !== availablePlans.length) {
                setCustomPlans(JSON.parse(JSON.stringify(availablePlans)));
            }
        }
    }, [availablePlans, customPlans.length]);

    // Keep activeDay valid if _initialDay prop or plans length changes
    useEffect(() => {
        if (typeof form._initialDay === 'number') {
            const maxIdx = Math.max(0, (customPlans.length || availablePlans.length || 1) - 1);
            setActiveDay(Math.max(0, Math.min(form._initialDay, maxIdx)));
        }
    }, [form._initialDay, customPlans.length, availablePlans.length]);

    const plansToRender = customPlans.length > 0 ? customPlans : availablePlans;
    const plan: DayPlan | undefined = plansToRender[activeDay] ?? plansToRender[0];
    const activities = useMemo(() => {
        return plan?.activities ?? [];
    }, [plan]);

    const navigateToDay = useCallback((dayIdx: number) => {
        const count = plansToRender.length || 1;
        if (dayIdx < 0 || dayIdx >= count) return;
        setActiveDay(dayIdx);
        setActiveActivity(-1);
        const parts = window.location.pathname.split('/');
        const planIdx = parts.indexOf('plan');
        const urlUuid = planIdx !== -1 ? parts[planIdx + 1] : null;
        const uuid = (form.uuid || form._uuid || urlUuid) as string;
        if (uuid) {
            window.history.pushState(null, '', `/itinerary/plan/${uuid}/day/${dayIdx + 1}`);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [plansToRender.length, form.uuid, form._uuid]);

    // Sync activeDay with browser history navigation (back/forward)
    useEffect(() => {
        const handlePopState = () => {
            const parts = window.location.pathname.split('/');
            const dayIdx = parts.indexOf('day');
            if (dayIdx !== -1 && parts[dayIdx + 1]) {
                const dayNum = parseInt(parts[dayIdx + 1], 10);
                if (!isNaN(dayNum) && dayNum >= 1) {
                    const count = plansToRender.length || 1;
                    setActiveDay(Math.max(0, Math.min(dayNum - 1, count - 1)));
                }
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [plansToRender.length]);

    const destState = DESTINATIONS.find(d => d.id === destId)?.state || '';
    const purpose = (form.purpose as string) || 'cultural';

    const {
        isTripActive, checkpoint, startTrip, stopTrip,
        toggleCheckpoint, isChecked, getProgress,
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

    // Register itinerary with AI context once on mount
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

    // Prepare pins for the interactive Leaflet map
    const mapPins = useMemo(() => activities.map((a, i) => ({
        lat: a.lat, lng: a.lng, label: a.name, number: i + 1,
    })), [activities]);

    // Total active hours estimate
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
        } else totalHours += 2;
        if (a.travelFromPrev) totalHours += 0.5;
    });

    const isExhausting = activities.length > 5 || totalHours >= 10;

    // Scroll-synchronized active activity detection
    const activityRefs = useRef<(HTMLDivElement | null)[]>([]);
    useEffect(() => {
        if (typeof window === 'undefined' || activities.length === 0) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idxStr = entry.target.getAttribute('data-activity-index');
                    if (idxStr !== null) {
                        const idx = parseInt(idxStr, 10);
                        if (!isNaN(idx)) {
                            setActiveActivity(idx);
                        }
                    }
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0.1
        });

        activityRefs.current.forEach(el => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [activities]);

    // Scroll to activity when clicking map pin
    const scrollToActivity = (idx: number) => {
        setActiveActivity(idx);
        const el = activityRefs.current[idx];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Calculate real date string for this day
    const formattedDate = useMemo(() => {
        if (form.startDate) {
            try {
                const d = new Date(form.startDate as string);
                d.setDate(d.getDate() + activeDay);
                return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
            } catch (e) {}
        }
        return `Day ${activeDay + 1}`;
    }, [form.startDate, activeDay]);

    return (
        <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-16 sm:pt-20 font-sans selection:bg-brand-primary selection:text-white">
            {/* Top Restrained Editorial Bar */}
            <div className="sticky top-16 sm:top-20 z-40 bg-paper-light/95 backdrop-blur-md border-b border-[#EADFD4] px-4 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <button 
                        onClick={onBack} 
                        className="w-8 h-8 rounded-full border border-[#EADFD4] flex items-center justify-center hover:bg-paper-warm transition-colors text-sm text-naviigo-brown shrink-0"
                        title="Back to Itinerary Overview"
                    >
                        ←
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-naviigo-brown/60">
                            <span>{destName}</span>
                            <span>·</span>
                            <span>Day {String(activeDay + 1).padStart(2, '0')} of {String(plansToRender.length).padStart(2, '0')}</span>
                        </div>
                        <h1 className="font-display font-bold text-sm sm:text-base text-naviigo-brown truncate leading-tight">
                            {plan?.title || `${destName} Chapter`}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <ShareDropdown onCopyLink={handleShare} destName={destName} isSharing={isSharing} collaborators={collaborators} planData={{ ...data, dayPlans: customPlans }} />
                    {user && (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => isTripActive ? stopTrip() : startTrip()}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                isTripActive
                                    ? 'bg-naviigo-teal text-white shadow-md shadow-naviigo-teal/20'
                                    : 'bg-brand-primary hover:bg-brand-primary/90 text-white shadow-md shadow-brand-primary/20'
                            }`}
                        >
                            <Rocket className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isTripActive ? 'Live Trip Active' : 'Start Trip'}</span>
                        </motion.button>
                    )}
                    <motion.button 
                        whileTap={{ scale: 0.98 }} 
                        onClick={async () => {
                            if (user?.uid) {
                                await saveItineraryToFirestore(user.uid, { destId, destName, form: { ...form, customPlans }, generatedData: generatedData || null });
                            }
                            setIsSaved(true);
                            alert('📍 Itinerary successfully archived to your Passport!');
                        }} 
                        disabled={isSaved}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                            isSaved ? 'bg-brand-primary/10 text-brand-primary cursor-default' : 'bg-naviigo-brown text-white hover:bg-naviigo-brown/90'
                        }`}
                    >
                        {isSaved ? '✓ Saved' : 'Archive'}
                    </motion.button>
                </div>
            </div>

            {/* Day Chapter Navigation (Crisp Horizontal Index) */}
            <div className="sticky top-[108px] sm:top-[128px] z-30 bg-paper-light/95 backdrop-blur-md border-b border-[#EADFD4] px-4 sm:px-8 py-2">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs tracking-wider uppercase overflow-x-auto no-scrollbar py-1">
                        {plansToRender.map((dp: DayPlan, i: number) => {
                            const isActive = activeDay === i;
                            const titleSnippet = dp.title ? dp.title.split(' ')[0] : `DAY 0${i + 1}`;
                            return (
                                <button
                                    key={dp.day || i}
                                    onClick={() => navigateToDay(i)}
                                    className={`group relative py-1 flex items-center gap-2 transition-colors whitespace-nowrap ${
                                        isActive ? 'text-brand-primary font-bold' : 'text-naviigo-brown/60 hover:text-naviigo-brown'
                                    }`}
                                >
                                    <span>{String(i + 1).padStart(2, '0')}</span>
                                    <span className="hidden md:inline text-[11px] font-sans font-medium uppercase tracking-tight opacity-80">{titleSnippet}</span>
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

                    {/* Stepper (Previous / Next) */}
                    <div className="flex items-center gap-2 font-mono text-xs uppercase shrink-0">
                        <button
                            onClick={() => navigateToDay(activeDay - 1)}
                            disabled={activeDay === 0}
                            className="px-2.5 py-1 rounded border border-[#EADFD4] text-naviigo-brown/80 hover:text-brand-primary hover:border-brand-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            ← Prev
                        </button>
                        <span className="font-bold text-naviigo-brown px-1">
                            {String(activeDay + 1).padStart(2, '0')} / {String(plansToRender.length || 1).padStart(2, '0')}
                        </span>
                        <button
                            onClick={() => navigateToDay(activeDay + 1)}
                            disabled={activeDay >= plansToRender.length - 1}
                            className="px-2.5 py-1 rounded border border-[#EADFD4] text-naviigo-brown/80 hover:text-brand-primary hover:border-brand-primary/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {/* Live Trip Tracker progress strip if active */}
                {isTripActive && (() => {
                    const progress = getProgress();
                    return (
                        <div className="max-w-[1440px] mx-auto mt-2 pt-2 border-t border-[#EADFD4] flex items-center justify-between font-mono text-[10px] text-naviigo-teal font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-naviigo-teal animate-pulse" />
                                LIVE PROGRESS: {progress.completed}/{progress.total} CHECKPOINTS VISITED
                            </span>
                            <span>{progress.percent}% ACCOMPLISHED</span>
                        </div>
                    );
                })()}
            </div>

            {/* Main Spatial Editorial Container */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 lg:py-10">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    
                    {/* LEFT COLUMN (62-65%): Editorial Chapter Storyline */}
                    <div className="flex-1 min-w-0 w-full">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeDay} 
                                initial={{ opacity: 0, y: 12 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0 }} 
                                transition={{ duration: 0.25 }}
                            >
                                {/* ─────────────────────────────────────────────────────────────
                                    1. THE DAY OPENING SCENE (EDITORIAL MASTHEAD)
                                    ───────────────────────────────────────────────────────────── */}
                                <div className="border-b border-[#EADFD4] pb-8 mb-8">
                                    {/* Folio Telemetry Row */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs uppercase tracking-widest text-brand-primary mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-bold">DAY {String(activeDay + 1).padStart(2, '0')} / {String(plansToRender.length).padStart(2, '0')}</span>
                                            <span className="text-naviigo-brown/30">·</span>
                                            <span className="text-naviigo-brown/80 font-bold">{destName.toUpperCase()}</span>
                                            <span className="text-naviigo-brown/30">·</span>
                                            <span className="text-naviigo-brown/60">{formattedDate}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-naviigo-brown/70">{activities.length} PLANNED STOPS</span>
                                            <button 
                                                onClick={() => {
                                                    const baseDate = form.startDate ? new Date(form.startDate as string) : new Date();
                                                    baseDate.setDate(baseDate.getDate() + activeDay);
                                                    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NaviiGo//Itinerary//EN\n";
                                                    activities.forEach((a) => {
                                                        const parts = (a.time || '').split('–').map(s => s.trim());
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
                                                    const a = document.createElement('a'); a.href = url; a.download = `NaviiGo_Day${activeDay + 1}.ics`; a.click();
                                                }}
                                                className="text-[11px] font-mono text-naviigo-brown/70 hover:text-brand-primary transition-colors flex items-center gap-1 uppercase"
                                                title="Download calendar file for this day"
                                            >
                                                <Calendar className="w-3 h-3" />
                                                <span>Export .ics</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Monumental Chapter Heading */}
                                    <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-naviigo-brown tracking-tightest leading-[1.04] mb-3">
                                        {plan?.title || `${destName} Chapter`}
                                    </h2>

                                    {/* Evocative Narrative Line */}
                                    <p className="font-sans text-sm sm:text-base text-naviigo-brown/75 font-light leading-relaxed max-w-2xl mb-6">
                                        {activeDay === 0
                                            ? "Arrive, orient, and wander. Leave generous space for unscripted courtyards and acclimatization."
                                            : activeDay === plansToRender.length - 1
                                            ? "Final chapter before departure. Pack the fieldbook, revisit favorite paths, and savor the evening horizon."
                                            : "Start early to catch the crisp morning light. Follow the spine through local quarters and historic gates."}
                                    </p>

                                    {/* Hero Archival Field Plate */}
                                    {activities.length > 0 && (
                                        <div className="relative rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm bg-paper-light">
                                            <div className="h-56 sm:h-72 w-full relative">
                                                <PlaceImage 
                                                    name={activities[0].name} 
                                                    city={destName} 
                                                    className="w-full h-full object-cover brightness-[0.96] contrast-[1.04]" 
                                                    asBackground 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                                                
                                                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                                                    <div>
                                                        <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-white/80">
                                                            EXPEDITION PLATE 0{activeDay + 1} · {destName.toUpperCase()}
                                                        </div>
                                                        <div className="font-display font-bold text-lg sm:text-2xl tracking-tight">
                                                            {activities[0].name}
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:block font-mono text-xs uppercase tracking-wider bg-black/40 backdrop-blur-md px-3 py-1 rounded border border-white/20">
                                                        {activities[0].time || '08:30'} Start
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ─────────────────────────────────────────────────────────────
                                    2. DAY PULSE (COMPACT REFINED EDITORIAL RIBBON)
                                    ───────────────────────────────────────────────────────────── */}
                                <div className="bg-paper-light border border-[#EADFD4] rounded-2xl p-4 sm:p-5 mb-8 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs font-mono">
                                        {/* Real weather context if available */}
                                        {Boolean(plan?.weather?.temp) && (
                                            <div className="flex items-center gap-2 text-naviigo-brown">
                                                <span className="text-base">{plan?.weather?.temp?.includes('°C') ? '🌤️' : plan?.weather?.emoji || '🌤️'}</span>
                                                <div>
                                                    <span className="font-bold">{plan?.weather?.temp}</span>
                                                    <span className="text-naviigo-brown/60 ml-1.5">{plan?.weather?.condition || 'Clear Sky'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Stops tally */}
                                        <div className="flex items-center gap-2 text-naviigo-brown">
                                            <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                                            <span><strong>{activities.length}</strong> Waypoints</span>
                                        </div>

                                        {/* Real Transit distance / time */}
                                        {dayRouteInfo ? (
                                            <div className="flex items-center gap-2 text-naviigo-brown">
                                                <Navigation className="w-3.5 h-3.5 text-naviigo-teal" />
                                                <span><strong>{dayRouteInfo.distance}</strong> · {dayRouteInfo.time} transit</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-naviigo-brown/70">
                                                <Navigation className="w-3.5 h-3.5 text-naviigo-brown/40" />
                                                <span>Active Corridor</span>
                                            </div>
                                        )}

                                        {/* Real daily allocation */}
                                        {Boolean(form.budget) && (
                                            <div className="flex items-center gap-1.5 text-naviigo-brown">
                                                <span className="text-naviigo-brown/50">EST. BUDGET:</span>
                                                <span className="font-bold">₹{Math.round(Number(form.budget) / (Number(form.days) || 1)).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}

                                        {/* Cadence */}
                                        <div className="px-2.5 py-0.5 rounded bg-paper-warm border border-[#EADFD4] text-naviigo-brown/70 text-[11px] font-sans font-medium">
                                            {activities.length <= 4 ? 'Leisurely Cadence' : activities.length <= 6 ? 'Balanced Cadence' : 'Brisk Cadence'}
                                        </div>
                                    </div>

                                    {/* Genuine local travel tip if present */}
                                    {data.crowdNote && (
                                        <div className="mt-3 pt-3 border-t border-[#EADFD4]/70 flex items-start gap-2.5 text-xs font-sans text-naviigo-brown/80 leading-snug">
                                            <span className="font-mono text-[10px] font-bold text-brand-primary uppercase tracking-wider shrink-0 mt-0.5">LOCAL NOTE:</span>
                                            <span>{data.crowdNote}</span>
                                        </div>
                                    )}
                                </div>

                                {/* ─────────────────────────────────────────────────────────────
                                    3. STAYS TO CONSIDER (HUMAN ACCOMMODATIONS)
                                    ───────────────────────────────────────────────────────────── */}
                                {data.hotels && data.hotels.length > 0 && (
                                    <div className="mb-10">
                                        <div className="flex items-baseline justify-between mb-3 pb-1 border-b border-[#EADFD4]">
                                            <div className="flex items-center gap-2">
                                                <BedDouble className="w-4 h-4 text-brand-primary" />
                                                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-naviigo-brown">Stays to Consider</h3>
                                            </div>
                                            <span className="font-mono text-[10px] uppercase text-naviigo-brown/50">Bases near today&apos;s waypoints</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Featured Stay (Larger Card) */}
                                            {data.hotels[0] && (
                                                <div className="md:col-span-2 bg-paper-light border border-[#EADFD4] rounded-2xl overflow-hidden shadow-sm flex flex-col sm:flex-row group hover:border-brand-primary/50 transition-colors">
                                                    <div className="sm:w-2/5 h-44 sm:h-auto relative shrink-0">
                                                        <PlaceImage name={data.hotels[0].name} city={destName} className="w-full h-full object-cover" asBackground />
                                                    </div>
                                                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <span className="font-mono text-[10px] uppercase tracking-wider text-brand-primary font-bold">Featured Recommendation</span>
                                                                <span className="font-mono text-xs font-bold text-brand-primary">★ {data.hotels[0].rating}</span>
                                                            </div>
                                                            <h4 className="font-display font-bold text-lg text-naviigo-brown group-hover:text-brand-primary transition-colors">{data.hotels[0].name}</h4>
                                                            <p className="font-sans text-xs text-naviigo-brown/70 font-light mt-1 line-clamp-2">{data.hotels[0].desc}</p>
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EADFD4]">
                                                            <span className="font-mono text-xs font-semibold text-naviigo-brown">{data.hotels[0].priceRange}</span>
                                                            {data.hotels[0].bookingLink && (
                                                                <a 
                                                                    href={data.hotels[0].bookingLink} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="px-3.5 py-1.5 rounded-lg bg-naviigo-brown text-white hover:bg-brand-primary font-mono text-xs uppercase font-bold tracking-wider transition-colors shadow-2xs"
                                                                >
                                                                    Reserve Stay ➔
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Companion Stay */}
                                            {data.hotels[1] && (
                                                <div className="bg-paper-light border border-[#EADFD4] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between p-4 group hover:border-brand-primary/50 transition-colors">
                                                    <div>
                                                        <div className="h-24 rounded-lg overflow-hidden mb-3 relative">
                                                            <PlaceImage name={data.hotels[1].name} city={destName} className="w-full h-full object-cover" asBackground />
                                                        </div>
                                                        <div className="font-mono text-[10px] text-brand-primary font-bold uppercase mb-0.5">Alternative Base</div>
                                                        <h4 className="font-display font-bold text-sm text-naviigo-brown group-hover:text-brand-primary transition-colors line-clamp-1">{data.hotels[1].name}</h4>
                                                        <p className="font-sans text-[11px] text-naviigo-brown/65 font-light line-clamp-2 mt-1">{data.hotels[1].desc}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#EADFD4]">
                                                        <span className="font-mono text-[11px] text-naviigo-brown font-semibold">★ {data.hotels[1].rating}</span>
                                                        <span className="font-mono text-[11px] text-naviigo-brown/60">{data.hotels[1].priceRange}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ─────────────────────────────────────────────────────────────
                                    4. THE DAY PATH & ASYMMETRIC ACTIVITY TIMELINE
                                    ───────────────────────────────────────────────────────────── */}
                                <div>
                                    {/* Action Header & Schedule Health Notice */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-2 border-b border-[#EADFD4]">
                                        <div className="flex items-center gap-2">
                                            <Compass className="w-4 h-4 text-brand-primary" />
                                            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-naviigo-brown">Today&apos;s Route Spine</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    const currentPlans = customPlans.length > 0 ? [...customPlans] : [...data.dayPlans];
                                                    const currentActs = plan?.activities || [];
                                                    const optimized = [...currentActs].sort((a, b) => {
                                                        const slots = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3 };
                                                        const sA = slots[a.slot as keyof typeof slots] || 9;
                                                        const sB = slots[b.slot as keyof typeof slots] || 9;
                                                        if (sA !== sB) return sA - sB;
                                                        return (a.lng || 0) - (b.lng || 0);
                                                    });
                                                    currentPlans[activeDay] = { ...plan, activities: optimized };
                                                    setCustomPlans(currentPlans);
                                                }}
                                                className="px-3 py-1 rounded-lg bg-paper-light border border-[#EADFD4] text-naviigo-brown hover:border-brand-primary hover:text-brand-primary font-mono text-[11px] uppercase tracking-wider font-bold transition-all shadow-2xs"
                                                title="Reorder activities by logical time and proximity"
                                            >
                                                ✨ Optimize Order
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const currentActs = plan?.activities || [];
                                                    if (currentActs.length <= 3) { alert("Your schedule is already well-paced!"); return; }
                                                    const currentPlans = customPlans.length > 0 ? [...customPlans] : [...data.dayPlans];
                                                    let toRemoveIdx = currentActs.length - 1;
                                                    const crowdedIdx = currentActs.findIndex(a => a.crowd === 'High');
                                                    if (crowdedIdx >= 0) toRemoveIdx = crowdedIdx;
                                                    const newActivities = [...currentActs];
                                                    newActivities.splice(toRemoveIdx, 1);
                                                    currentPlans[activeDay] = { ...plan, activities: newActivities };
                                                    setCustomPlans(currentPlans);
                                                }}
                                                className="px-3 py-1 rounded-lg bg-paper-light border border-[#EADFD4] text-naviigo-brown hover:border-brand-primary hover:text-brand-primary font-mono text-[11px] uppercase tracking-wider font-bold transition-all shadow-2xs"
                                                title="Lighten the day to avoid fatigue"
                                            >
                                                😌 Relax Itinerary
                                            </button>
                                        </div>
                                    </div>

                                    {/* Route Overload Warning Note (integrated into route) */}
                                    {isExhausting && (
                                        <div className="mb-6 p-4 rounded-xl bg-paper-light border-l-4 border-brand-primary border border-[#EADFD4] flex items-center justify-between gap-4 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="w-5 h-5 text-brand-primary shrink-0" />
                                                <div>
                                                    <h4 className="font-mono text-xs font-bold text-naviigo-brown uppercase tracking-wider">Pace Notice: Packed Schedule</h4>
                                                    <p className="font-sans text-xs text-naviigo-brown/70 mt-0.5">
                                                        This chapter features ~{Math.round(totalHours)} hours of movement. Consider relaxing to enjoy lingering in courtyards.
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeActivity(activities.length - 1)}
                                                className="px-3 py-1 rounded bg-paper-warm border border-[#EADFD4] hover:bg-brand-primary hover:text-white font-mono text-[11px] font-bold uppercase tracking-wider shrink-0 transition-colors"
                                            >
                                                Drop Last
                                            </button>
                                        </div>
                                    )}

                                    {/* Activities List on the Continuous Journey Line */}
                                    <Reorder.Group 
                                        axis="y" 
                                        values={activities} 
                                        onReorder={(newOrder) => {
                                            const currentPlans = customPlans.length > 0 ? [...customPlans] : [...data.dayPlans];
                                            currentPlans[activeDay] = { ...plan, activities: newOrder };
                                            setCustomPlans(currentPlans);
                                        }} 
                                        className="space-y-0 list-none relative"
                                    >
                                        {/* The Continuous Naviigo Journey Line */}
                                        <div className="absolute left-[19px] sm:left-[21px] top-6 bottom-6 w-[2px] bg-[#EC6426]/30 pointer-events-none z-0" />

                                        {activities.map((act, i) => {
                                            const isLast = i === activities.length - 1;
                                            const slotChanged = i === 0 || activities[i - 1].slot !== act.slot;
                                            const isActive = activeActivity === i;
                                            const isHeroStop = i === 0 || act.category === 'experience' || (i === 1 && activities.length > 3);
                                            const isFoodStop = act.type === 'restaurant' || act.name.toLowerCase().includes('lunch') || act.name.toLowerCase().includes('dinner') || act.name.toLowerCase().includes('cafe');

                                            return (
                                                <Reorder.Item 
                                                    key={act.name + i} 
                                                    value={act}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                                    className="relative z-10"
                                                >
                                                    {/* Time-of-Day Chapter Anchor */}
                                                    {slotChanged && (
                                                        <div className="flex items-center gap-3 pt-6 pb-4 first:pt-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">
                                                            <div className="w-5 h-5 rounded-full bg-paper-light border-2 border-brand-primary flex items-center justify-center shrink-0 z-10">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                                            </div>
                                                            <span>{act.slot || 'DAY'} CHAPTER</span>
                                                            <div className="flex-1 h-px bg-naviigo-brown/15" />
                                                        </div>
                                                    )}

                                                    {/* Spatial Movement / Transfer Segment */}
                                                    {act.travelFromPrev && i > 0 && activities[i-1]?.lat && act.lat && (
                                                        <div className="my-3 pl-10 sm:pl-12">
                                                            <TransportCompare
                                                                fromLat={activities[i-1].lat}
                                                                fromLng={activities[i-1].lng}
                                                                toLat={act.lat}
                                                                toLng={act.lng}
                                                                fromName={activities[i-1].name}
                                                                toName={act.name}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Stop Card Row with Spine Waypoint */}
                                                    <div 
                                                        ref={(el) => { activityRefs.current[i] = el; }}
                                                        data-activity-index={i}
                                                        onClick={() => scrollToActivity(i)}
                                                        className={`flex items-start gap-3 sm:gap-6 mb-8 cursor-pointer group transition-all duration-300 ${
                                                            isActive ? 'scale-[1.005]' : 'opacity-90 hover:opacity-100'
                                                        }`}
                                                    >
                                                        {/* Journey Line Waypoint Node */}
                                                        <div className="flex flex-col items-center pt-2 shrink-0 z-10">
                                                            {isTripActive ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleCheckpointToggle(activeDay, act.name); }}
                                                                    className="relative group/check"
                                                                >
                                                                    {isChecked(activeDay, act.name) ? (
                                                                        <motion.div
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            className="w-10 h-10 rounded-full bg-naviigo-teal flex items-center justify-center shadow-md text-white"
                                                                        >
                                                                            <CheckCircle2 className="w-5 h-5" />
                                                                        </motion.div>
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-naviigo-brown/30 bg-paper-warm flex items-center justify-center text-naviigo-brown/50 hover:border-naviigo-teal hover:text-naviigo-teal transition-colors">
                                                                            <Circle className="w-5 h-5" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <div className={`w-10 h-10 rounded-full font-mono text-xs font-bold flex items-center justify-center shadow-sm transition-all duration-300 ${
                                                                    isActive 
                                                                        ? 'bg-brand-primary text-white scale-110 ring-4 ring-brand-primary/25 shadow-lg shadow-brand-primary/30' 
                                                                        : 'bg-paper-light border-2 border-brand-primary/50 text-brand-primary group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-white'
                                                                }`}>
                                                                    {String(i + 1).padStart(2, '0')}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Activity Editorial Composition */}
                                                        <div className={`flex-1 rounded-2xl border p-5 sm:p-7 transition-all duration-300 relative overflow-hidden bg-paper-light shadow-sm ${
                                                            isActive 
                                                                ? 'border-brand-primary ring-1 ring-brand-primary/30 shadow-md' 
                                                                : 'border-[#EADFD4] hover:border-brand-primary/40'
                                                        }`}>
                                                            {/* Composition Type A: Major Cinematic Destination */}
                                                            {isHeroStop && !isFoodStop ? (
                                                                <div>
                                                                    <div className="flex items-baseline justify-between gap-3 mb-2">
                                                                        <span className="font-mono text-xs font-bold text-brand-primary tracking-wider">
                                                                            {act.time || '09:00'}
                                                                        </span>
                                                                        <span className="font-mono text-[10px] text-naviigo-brown/50 uppercase tracking-widest">
                                                                            PRIMARY WAYPOINT
                                                                        </span>
                                                                    </div>

                                                                    <h4 className="font-display font-black text-2xl sm:text-3xl text-naviigo-brown tracking-tight leading-tight group-hover:text-brand-primary transition-colors mb-3">
                                                                        {act.name}
                                                                    </h4>

                                                                    {/* Hero Visual Frame */}
                                                                    <div className="h-44 sm:h-56 w-full rounded-xl overflow-hidden border border-[#EADFD4] relative mb-4">
                                                                        <PlaceImage name={act.name} city={destName} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" asBackground />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                                                        {act.entryFee && (
                                                                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white font-mono text-[10px] px-2.5 py-1 rounded uppercase tracking-wider border border-white/20">
                                                                                TICKETS: {act.entryFee}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <p className="font-sans text-sm text-naviigo-brown/80 font-light leading-relaxed mb-4">
                                                                        {act.desc}
                                                                    </p>
                                                                </div>
                                                            ) : isFoodStop ? (
                                                                /* Composition Type B: Food / Culinary Break */
                                                                <div>
                                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                                        <div className="flex items-center gap-2 font-mono text-xs font-bold text-brand-primary">
                                                                            <UtensilsCrossed className="w-3.5 h-3.5" />
                                                                            <span>{act.time || '13:00'} · REPAST</span>
                                                                        </div>
                                                                        <span className="font-mono text-[10px] text-naviigo-brown/50 uppercase tracking-widest">
                                                                            GASTRONOMY
                                                                        </span>
                                                                    </div>

                                                                    <h4 className="font-display font-bold text-xl sm:text-2xl text-naviigo-brown group-hover:text-brand-primary transition-colors mb-2">
                                                                        {act.name}
                                                                    </h4>

                                                                    <p className="font-sans text-xs sm:text-sm text-naviigo-brown/75 font-light leading-relaxed mb-3">
                                                                        {act.desc}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                /* Composition Type C: Exploration / Cultural Place */
                                                                <div>
                                                                    <div className="flex items-baseline justify-between gap-2 mb-2">
                                                                        <span className="font-mono text-xs font-bold text-brand-primary tracking-wider">
                                                                            {act.time || '11:00'}
                                                                        </span>
                                                                        {act.openingHours && (
                                                                            <span className="font-mono text-[10px] text-naviigo-brown/50">
                                                                                HOURS: {act.openingHours}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <h4 className="font-display font-bold text-xl sm:text-2xl text-naviigo-brown group-hover:text-brand-primary transition-colors mb-2">
                                                                        {act.name}
                                                                    </h4>

                                                                    <p className="font-sans text-xs sm:text-sm text-naviigo-brown/75 font-light leading-relaxed mb-3">
                                                                        {act.desc}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Restrained Field Note & Guidance */}
                                                            {act.insiderTip ? (
                                                                <div className="border-l-2 border-brand-primary pl-3 py-1 mb-4 text-xs font-sans text-naviigo-brown/85 leading-relaxed bg-paper-warm/50 rounded-r-md">
                                                                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-primary mr-1.5">FIELD NOTE:</span>
                                                                    {act.insiderTip}
                                                                </div>
                                                            ) : act.bestPhotoSpot ? (
                                                                <div className="border-l-2 border-[#EADFD4] pl-3 py-1 mb-4 text-xs font-sans text-naviigo-brown/70 leading-relaxed">
                                                                    <span className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/50 mr-1.5">PERSPECTIVE:</span>
                                                                    {act.bestPhotoSpot}
                                                                </div>
                                                            ) : null}

                                                            {/* Action Footer */}
                                                            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#EADFD4] gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    {act.priceBase ? (
                                                                        <span className="font-mono text-[11px] font-bold text-naviigo-brown">
                                                                            EST: ₹{act.priceBase.toLocaleString('en-IN')}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="font-mono text-[11px] text-naviigo-brown/60">
                                                                            ENTRY: On site
                                                                        </span>
                                                                    )}
                                                                    {act.whatToWear && (
                                                                        <span className="hidden sm:inline font-mono text-[10px] text-naviigo-brown/60 border-l border-[#EADFD4] pl-2">
                                                                            WEAR: {act.whatToWear}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {act.bookingLink && (
                                                                        <a
                                                                            href={act.bookingLink}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-xs font-mono font-bold uppercase tracking-wider bg-brand-primary text-white px-3 py-1 rounded hover:bg-brand-primary/90 transition-colors shadow-2xs"
                                                                        >
                                                                            Book Tickets ➔
                                                                        </a>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedDossier(act);
                                                                        }}
                                                                        className="text-xs font-mono font-bold uppercase tracking-wider bg-paper-warm text-naviigo-brown border border-[#EADFD4] hover:border-brand-primary/60 px-3 py-1 rounded transition-colors"
                                                                    >
                                                                        Place Dossier ➔
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Reorder.Item>
                                            );
                                        })}
                                    </Reorder.Group>

                                    {/* ─────────────────────────────────────────────────────────────
                                        5. DAY ROUTE RECAP & NEXT-CHAPTER TRANSITION
                                        ───────────────────────────────────────────────────────────── */}
                                    <div className="mt-12 pt-8 border-t-2 border-[#EADFD4]">
                                        <div className="bg-paper-light border border-[#EADFD4] rounded-2xl p-6 sm:p-8 shadow-sm">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                                <div>
                                                    <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-1">
                                                        DAY {String(activeDay + 1).padStart(2, '0')} COMPLETE
                                                    </div>
                                                    <h4 className="font-display font-black text-2xl sm:text-3xl text-naviigo-brown tracking-tight">
                                                        {activities.length} Waypoints Traversed in {destName}
                                                    </h4>
                                                    <p className="font-sans text-xs sm:text-sm text-naviigo-brown/70 font-light mt-1">
                                                        {activeDay < plansToRender.length - 1
                                                            ? `Rest and refresh for tomorrow&apos;s journey into Chapter ${activeDay + 2}.`
                                                            : "Your expedition roadbook is complete. Archive this journey to your Passport."}
                                                    </p>
                                                </div>

                                                {activeDay < plansToRender.length - 1 ? (
                                                    <button
                                                        onClick={() => navigateToDay(activeDay + 1)}
                                                        className="px-6 py-3 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-md shadow-brand-primary/20 shrink-0 flex items-center gap-2 group"
                                                    >
                                                        <span>CONTINUE TO DAY 0{activeDay + 2}</span>
                                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => router.push('/passport')}
                                                        className="px-6 py-3 rounded-xl bg-naviigo-brown hover:bg-black text-white font-mono text-xs font-bold uppercase tracking-widest transition-all shadow-md shrink-0 flex items-center gap-2"
                                                    >
                                                        <span>VIEW PASSPORT ARCHIVE</span>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* RIGHT COLUMN (35-38%): Sticky Spatial Map & Telemetry Panel */}
                    <div className="hidden lg:block lg:w-[420px] xl:w-[460px] shrink-0 self-start sticky top-[160px] z-20">
                        <div className="bg-paper-light border border-[#EADFD4] rounded-2xl overflow-hidden shadow-sm flex flex-col">
                            {/* Spatial Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EADFD4] bg-paper-warm/50">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-naviigo-brown">Live Route Geometry</span>
                                </div>
                                <span className="font-mono text-[10px] text-naviigo-brown/60">
                                    {activeActivity >= 0 ? `STOP 0${activeActivity + 1} FOCUS` : `${activities.length} WAYPOINTS`}
                                </span>
                            </div>

                            {/* Leaflet Map Frame */}
                            <div className="h-[calc(100vh-240px)] min-h-[520px] w-full relative">
                                <ItineraryMap
                                    pins={mapPins}
                                    center={data.mapCenter}
                                    zoom={12}
                                    showRoute={true}
                                    activePin={activeActivity >= 0 ? activeActivity : undefined}
                                    onPinClick={scrollToActivity}
                                    onRouteCalculated={(legs: { distance: string, time: string }[]) => { 
                                        if (legs && legs.length > 0) setDayRouteInfo(legs[0]); 
                                    }}
                                    className="w-full h-full"
                                />
                            </div>

                            {/* Telemetry Footer */}
                            <div className="px-4 py-2.5 bg-paper-warm/40 border-t border-[#EADFD4] flex items-center justify-between text-[11px] font-mono text-naviigo-brown/70">
                                <span>Click marker to scroll to stop</span>
                                <span className="text-brand-primary font-bold">{dayRouteInfo?.distance || 'OSRM Synced'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Floating Map Action Pill */}
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setShowMobileMap(true)}
                    className="px-4 py-2.5 rounded-full bg-naviigo-brown text-white font-mono text-xs uppercase font-bold tracking-wider shadow-xl flex items-center gap-2 border border-white/20 active:scale-95 transition-transform"
                >
                    <Compass className="w-4 h-4 text-brand-primary animate-spin-slow" />
                    <span>View Route Map ({activities.length})</span>
                </button>
            </div>

            {/* Mobile Map Fullsheet Drawer */}
            <AnimatePresence>
                {showMobileMap && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end lg:hidden"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-paper-light w-full h-[85vh] rounded-t-3xl border-t border-[#EADFD4] flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EADFD4]">
                                <div>
                                    <div className="font-mono text-[10px] uppercase text-brand-primary font-bold">Route Geometry</div>
                                    <h4 className="font-display font-bold text-base text-naviigo-brown">Day {activeDay + 1} Map Overview</h4>
                                </div>
                                <button
                                    onClick={() => setShowMobileMap(false)}
                                    className="w-8 h-8 rounded-full border border-[#EADFD4] flex items-center justify-center text-naviigo-brown hover:bg-paper-warm"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ItineraryMap
                                    pins={mapPins}
                                    center={data.mapCenter}
                                    zoom={12}
                                    showRoute={true}
                                    activePin={activeActivity >= 0 ? activeActivity : undefined}
                                    onPinClick={(idx) => {
                                        scrollToActivity(idx);
                                        setShowMobileMap(false);
                                    }}
                                    className="w-full h-full"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Place Dossier Editorial Slide-Over Sheet */}
            <AnimatePresence>
                {selectedDossier && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedDossier(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
                        />
                        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                className="w-screen max-w-md bg-paper-light border-l border-[#EADFD4] shadow-2xl flex flex-col overflow-y-auto"
                            >
                                <div className="p-6 border-b border-[#EADFD4] flex items-center justify-between sticky top-0 bg-paper-light/95 backdrop-blur-md z-10">
                                    <div>
                                        <div className="font-mono text-[10px] uppercase tracking-widest text-brand-primary font-bold">Field Dossier</div>
                                        <h3 className="font-display font-black text-xl text-naviigo-brown">{selectedDossier.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedDossier(null)}
                                        className="w-8 h-8 rounded-full border border-[#EADFD4] flex items-center justify-center hover:bg-paper-warm text-naviigo-brown transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-6 flex-1">
                                    <div className="h-52 rounded-xl overflow-hidden border border-[#EADFD4] relative">
                                        <PlaceImage name={selectedDossier.name} city={destName} className="w-full h-full object-cover" asBackground />
                                    </div>

                                    <div>
                                        <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-naviigo-brown/60 mb-1">Archival Context</h4>
                                        <p className="font-sans text-sm text-naviigo-brown/85 font-light leading-relaxed">
                                            {selectedDossier.desc}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                                        <div className="p-3 bg-paper-warm rounded-lg border border-[#EADFD4]">
                                            <div className="text-[10px] text-naviigo-brown/50 uppercase">Timing</div>
                                            <div className="font-bold text-naviigo-brown mt-0.5">{selectedDossier.time || 'Flexible'}</div>
                                        </div>
                                        <div className="p-3 bg-paper-warm rounded-lg border border-[#EADFD4]">
                                            <div className="text-[10px] text-naviigo-brown/50 uppercase">Admission</div>
                                            <div className="font-bold text-naviigo-brown mt-0.5">{selectedDossier.entryFee || 'On-site'}</div>
                                        </div>
                                    </div>

                                    {selectedDossier.insiderTip && (
                                        <div className="p-4 rounded-xl bg-paper-warm border-l-4 border-brand-primary border border-[#EADFD4]">
                                            <div className="font-mono text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">Field Advisory</div>
                                            <div className="font-sans text-xs text-naviigo-brown/80 leading-relaxed">{selectedDossier.insiderTip}</div>
                                        </div>
                                    )}

                                    {selectedDossier.bestPhotoSpot && (
                                        <div className="flex items-center gap-2 text-xs font-mono text-naviigo-brown/75">
                                            <Camera className="w-4 h-4 text-brand-primary" />
                                            <span>Photo vantage: {selectedDossier.bestPhotoSpot}</span>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-[#EADFD4] flex gap-3">
                                        <button
                                            onClick={() => {
                                                const idx = activities.findIndex(a => a.name === selectedDossier.name);
                                                if (idx >= 0) scrollToActivity(idx);
                                                setSelectedDossier(null);
                                            }}
                                            className="flex-1 py-2.5 rounded-lg bg-naviigo-brown hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-wider transition-colors"
                                        >
                                            Focus on Timeline
                                        </button>
                                        {selectedDossier.bookingLink && (
                                            <a
                                                href={selectedDossier.bookingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="py-2.5 px-4 rounded-lg bg-brand-primary text-white font-mono text-xs uppercase font-bold tracking-wider hover:bg-brand-primary/90 transition-colors"
                                            >
                                                Book ➔
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <CheckpointToast toasts={toasts} />
            <StampCelebration
                result={celebrationResult}
                onClose={() => setCelebrationResult(null)}
                onViewPassport={() => router.push('/passport')}
            />
        </div>
    );
}
