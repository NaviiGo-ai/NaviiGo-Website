'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { saveSharedItinerary, listenToItinerary, saveItineraryToFirestore, updateSharedPlans } from '@/lib/firestore';
import { useAuth } from '@/lib/AuthContext';
import { resolveImgSrc } from '@/lib/imageService';
import PlaceImage from '@/components/shared/PlaceImage';
import {
    PURPOSES, DESTINATIONS, GROUP_SIZES,
    DEST_DATA, CROWD_COLOR, WALK_COLOR,
    type CrowdLevel,
} from '@/app/itinerary/data';
import { Badge, genShareId } from './helpers';
import ShareDropdown from './ShareDropdown';
import WeatherStrip from './WeatherStrip';
import ExpenseTracker from './ExpenseTracker';
import { useAI } from '@/context/AIContext';
import { destinationExploreHref, itineraryPlaceHref } from '@/lib/placeLinks';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });
const VideoCard = dynamic(() => import('@/components/shared/VideoCard'), { ssr: false });

interface ResultPageProps {
    form: Record<string, unknown>;
    generatedData?: any;
    shareId?: string | null;
    isLoaded?: boolean;
    onDayView: () => void;
    onReset: () => void;
}

// Live-weather anchor: prefer the map center, else the first activity with coords.
function pickWeatherCenter(d: any): { lat: number; lng: number } | null {
    const mc = d?.mapCenter;
    if (mc && Number.isFinite(mc.lat) && Number.isFinite(mc.lng)) return mc;
    for (const dp of d?.dayPlans ?? []) {
        for (const a of dp?.activities ?? []) {
            if (typeof a?.lat === 'number' && typeof a?.lng === 'number') return { lat: a.lat, lng: a.lng };
        }
    }
    return null;
}

export default function ResultPage({ form, generatedData, shareId, onDayView, onReset }: ResultPageProps) {
    const router = useRouter();
    const { user, signInWithGoogle } = useAuth();
    const { registerItinerary, unregisterItinerary, applyAction, isEditPanelOpen, openEditPanel, closeEditPanel,
        editMessages, sendEditMessage, lastAction, clearLastAction } = useAI();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);
    const saveInFlightRef = useRef(false);
    const [collaborators, setCollaborators] = useState(1);
    const [isSharing, setIsSharing] = useState(false);
    const [hiddenGems, setHiddenGems] = useState<any[]>([]);
    const [insiderTips, setInsiderTips] = useState<string[]>([]);
    const [packingList, setPackingList] = useState<string[]>([]);
    const [showAllPacking, setShowAllPacking] = useState(false);
    const [checkedPacking, setCheckedPacking] = useState<Record<number, boolean>>({});
    const [editInput, setEditInput] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [localData, setLocalData] = useState<any>(null);
    const editChatRef = useRef<HTMLDivElement>(null);

    const destId = (form.destination as string) || (form.destId as string) || '';
    const destName = (form.destName as string) || (form.destination as string) || 'India Expedition';
    const stableTripId = (shareId || form._uuid || form.uuid || form.id || destId) as string;
    const purpose = form.purpose as string, group = form.group as string;
    const displayMonth = form.startDate ? new Date(form.startDate as string).toLocaleString('en-US', { month: 'short' }) : 'Jan';
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
            estimatedTravelCost: undefined,
            logistics: { flights: '', trains: '' },
            departureInfo: undefined
        };
        const base = staticData ? { ...emptyBase, ...staticData } : emptyBase;
        const merged = generatedData ? { ...base, ...generatedData } : base;
        return localData ? { ...merged, ...localData } : merged;
    }, [staticData, generatedData, localData, destName]);

    // Curated & Deduplicated Top Highlights (strictly best 5-7 real items)
    const curatedHighlights = useMemo(() => {
        const seen = new Set<string>();
        const list: any[] = [];
        for (const item of (data.highlights || [])) {
            if (!item || !item.name) continue;
            const norm = item.name.toLowerCase().trim();
            if (!seen.has(norm)) {
                seen.add(norm);
                list.push(item);
            }
        }
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        return list.slice(0, 6);
    }, [data.highlights]);

    // Curated & Deduplicated Cuisine & Dining (strictly best 5-7 real items)
    const curatedRestaurants = useMemo(() => {
        const seen = new Set<string>();
        const list: any[] = [];
        for (const item of (data.restaurants || [])) {
            if (!item || !item.name) continue;
            const norm = item.name.toLowerCase().trim();
            if (!seen.has(norm)) {
                seen.add(norm);
                list.push(item);
            }
        }
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        return list.slice(0, 6);
    }, [data.restaurants]);
    const destInfo = DESTINATIONS.find(d => d.id === destId);
    const purposeLabel = PURPOSES.find(p => p.id === purpose)?.label ?? purpose;
    const groupLabel = GROUP_SIZES.find(g => g.id === group)?.label ?? group;
    const weatherForMonth = data.weather?.[displayMonth] ?? data.weather?.['Jan'] ?? '20–30°C';

    // Live-weather anchor: prefer the map center, else the first activity with coords.
    const weatherCenter = pickWeatherCenter(data);

    // Register itinerary for AI edits — persist changes to Firestore
    useEffect(() => {
        registerItinerary(data, (newData: any) => {
            setLocalData(newData);
            // Save updated itinerary to Firestore so changes persist
            if (user?.uid) {
                saveItineraryToFirestore(user.uid, {
                    id: stableTripId,
                    uuid: stableTripId,
                    destId: (form.destId as string) || destId || 'unknown',
                    destName: destInfo?.name || destName || 'Unknown',
                    form: { ...form, _uuid: stableTripId, uuid: stableTripId },
                    generatedData: newData,
                }).catch(console.error);
            }
            if (shareId) {
                updateSharedPlans(shareId, newData.dayPlans).catch(console.error);
            }
        });
        
        return () => {
            unregisterItinerary();
        };
    }, [data, registerItinerary, unregisterItinerary, shareId, user, form, destId, destName, destInfo, stableTripId]);

    // Live Sync Listener
    useEffect(() => {
        if (shareId) {
            try {
                const unsub = listenToItinerary(shareId, (liveData) => {
                    setCollaborators(liveData.collaborators ?? 1);
                    if (liveData.customPlans && liveData.customPlans.length > 0) {
                        setLocalData((prev: any) => ({
                            ...prev,
                            dayPlans: liveData.customPlans,
                        }));
                    }
                });
                return () => { if (unsub) unsub(); };
            } catch (err) {
                console.warn('[ResultPage] listenToItinerary failed:', err);
            }
        }
    }, [shareId]);


    // ── Auto-save itinerary to Firestore ─────────────────────────
    // Uses deterministic doc ID in Firestore so re-saves just update, never duplicate.
    const autoSaveRef = useRef(false);
    useEffect(() => {
        if (!user?.uid || autoSaveRef.current) return;
        autoSaveRef.current = true;
        saveItineraryToFirestore(user.uid, {
            id: stableTripId,
            uuid: stableTripId,
            destId: (form.destId as string) || destId || 'india',
            destName: destInfo?.name || destName || 'India Expedition',
            form: { ...form, _uuid: stableTripId, uuid: stableTripId },
            generatedData: generatedData || null,
        }).then(() => {
            setIsSaved(true);
            console.log('[Itinerary] Auto-saved to Firestore');
        }).catch((err) => {
            console.error('[Itinerary] Auto-save failed:', err);
            autoSaveRef.current = false;
        });
    }, [user?.uid, destId, destName, form, generatedData, stableTripId, destInfo]);


    useEffect(() => {
        if (data.mapCenter) {
            const baseUrl = '';
            fetch(`${baseUrl}/api/places?lat=${data.mapCenter.lat}&lng=${data.mapCenter.lng}&type=tourist_attraction&radius=5000`)
                .then(r => r.json())
                .then(d => setHiddenGems(d.places?.slice(0, 4) ?? []))
                .catch(() => { });
        }
    }, [destId, data.mapCenter]);

    // Fetch AI insider tips
    useEffect(() => {
        if (!destName) return;
        const baseUrl = '';
        fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Give me 4 ultra-specific LOCAL INSIDER TIPS for visiting ${destName}, India — things only locals know. Format as a JSON array of strings, each starting with an emoji. No markdown.`,
                itineraryContext: null,
                context: [],
            }),
        })
            .then(r => r.json())
            .then(d => {
                const txt = d.reply || '';
                // Try parsing as JSON array
                const match = txt.match(/\[[\s\S]*\]/);
                if (match) {
                    const tips = JSON.parse(match[0]);
                    if (Array.isArray(tips)) setInsiderTips(tips.slice(0, 4));
                }
            })
            .catch(() => { });
    }, [destName]);

    // Fetch AI Packing List
    useEffect(() => {
        if (!destName || !displayMonth) return;
        const baseUrl = '';
        fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Give me a smart 4-item packing list for visiting ${destName}, India in ${displayMonth} (consider weather). Format as a JSON array of strings, each starting with an emoji. No markdown.`,
                itineraryContext: null,
                context: [],
            }),
        })
            .then(r => r.json())
            .then(d => {
                const txt = d.reply || '';
                const match = txt.match(/\[[\s\S]*\]/);
                if (match) {
                    const items = JSON.parse(match[0]);
                    if (Array.isArray(items)) setPackingList(items.slice(0, 4));
                }
            })
            .catch(() => { });
    }, [destName, displayMonth]);

    // Auto-scroll edit chat
    useEffect(() => {
        if (editChatRef.current) {
            editChatRef.current.scrollTop = editChatRef.current.scrollHeight;
        }
    }, [editMessages]);

    const mapPins = useMemo(() => data.highlights.filter((h: any) => h.lat).map((h: any, i: number) => ({
        lat: h.lat!, lng: h.lng!, label: h.name, number: i + 1, img: h.img,
    })), [data]);

    const handleShare = useCallback(async () => {
        setIsSharing(true);
        try {
            const id = genShareId();
            await saveSharedItinerary(id, { 
                form, 
                customPlans: localData?.dayPlans || data.dayPlans, 
                generatedData, 
                destName 
            }, user?.uid, user?.email || undefined);
            
            const url = `${window.location.origin}/itinerary?shareId=${id}`;
            await navigator.clipboard.writeText(url);
            listenToItinerary(id, (liveData) => setCollaborators(liveData.collaborators ?? 1), () => { });
            alert(`✅ Share link copied to clipboard!\n\nAnyone with this link can view your live itinerary.`);
        } catch (e) {
            console.error(e);
            const url = `${window.location.origin}/itinerary?load=${destId}`;
            navigator.clipboard.writeText(url);
            alert('Link copied! (Offline mode — link works only for you)');
        }
        setIsSharing(false);
    }, [form, destName, destId, localData, data, generatedData, user]);

    const handleSendEdit = useCallback(async () => {
        if (!editInput.trim() || editLoading) return;
        const msg = editInput;
        setEditInput('');
        setEditLoading(true);
        await sendEditMessage(msg);
        setEditLoading(false);
    }, [editInput, editLoading, sendEditMessage]);

    const handleAcceptAction = useCallback(() => {
        if (!lastAction) return;
        applyAction({ type: lastAction.type, payload: lastAction.payload });
        clearLastAction();
    }, [lastAction, applyAction, clearLastAction]);

    const handleSurpriseMe = useCallback(async () => {
        const dayIndex = Math.floor(Math.random() * (data.dayPlans?.length || 1));
        applyAction({ type: 'surpriseActivity', payload: { dayIndex } });
    }, [data, applyAction]);

    const handleSaveItinerary = useCallback(async () => {
        if (saveInFlightRef.current || isSaving || isSaved) return;
        if (!user?.uid) {
            signInWithGoogle();
            return;
        }
        saveInFlightRef.current = true;
        setIsSaving(true);
        setSaveError(false);
        try {
            await saveItineraryToFirestore(user.uid, {
                id: stableTripId,
                uuid: stableTripId,
                destId: (form.destId as string) || destId || 'india',
                destName: destInfo?.name || destName || 'India Expedition',
                form: { ...form, _uuid: stableTripId, uuid: stableTripId },
                generatedData: localData || generatedData || null,
            });
            setIsSaved(true);
        } catch (err) {
            console.error('[ResultPage] Save failed:', err);
            setSaveError(true);
        } finally {
            setIsSaving(false);
            saveInFlightRef.current = false;
        }
    }, [user, isSaving, isSaved, stableTripId, form, destId, destInfo, destName, localData, generatedData, signInWithGoogle]);

    return (
        <div className="min-h-screen bg-paper-warm text-naviigo-brown pt-16 sm:pt-20 font-sans selection:bg-brand-primary selection:text-white">
            {/* Top bar */}
            <div className="sticky top-16 sm:top-20 z-40 bg-paper-light/95 backdrop-blur-md border-b border-[#EADFD4] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 transition-colors">
                <button onClick={onReset} className="w-9 h-9 rounded-full border border-[#EADFD4] flex items-center justify-center hover:bg-[#EFE9E0] transition-colors text-sm text-naviigo-brown">←</button>
                <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar text-xs text-naviigo-brown/70">
                    <button onClick={() => router.push(destinationExploreHref(destName))} className="text-left group"><div className="text-[10px] font-bold text-naviigo-brown/50 uppercase tracking-wide">Where</div><div className="font-semibold text-naviigo-brown group-hover:text-brand-primary">{destName} ↗</div></button>
                    <div className="w-px h-6 bg-[#EADFD4]" />
                    <div><div className="text-[10px] font-bold text-naviigo-brown/50 uppercase tracking-wide">Dates</div><div className="font-semibold text-naviigo-brown">{form.startDate ? new Date(form.startDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} - {form.endDate ? new Date(form.endDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div></div>
                    <div className="w-px h-6 bg-[#EADFD4]" />
                    <div><div className="text-[10px] font-bold text-naviigo-brown/50 uppercase tracking-wide">Preferences</div><div className="font-semibold text-naviigo-brown truncate max-w-[160px]">{groupLabel} · {purposeLabel}</div></div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Surprise Me button */}
                    <button onClick={handleSurpriseMe}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-[#EADFD4] text-naviigo-brown hover:bg-[#EFE9E0] transition-colors">
                        🎲 Surprise Me
                    </button>
                    <ShareDropdown onCopyLink={handleShare} destName={destName} isSharing={isSharing} collaborators={collaborators} planData={data} />
                    <button
                        onClick={handleSaveItinerary}
                        disabled={isSaving || isSaved}
                        className={`flex px-4 py-1.5 rounded-full text-xs font-semibold items-center gap-1.5 transition-all ${
                            isSaved
                                ? 'bg-brand-primary/10 text-brand-primary cursor-default border border-brand-primary/20'
                                : isSaving
                                ? 'bg-naviigo-brown/70 text-white/80 cursor-wait'
                                : saveError
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-naviigo-brown text-white hover:bg-naviigo-brown/90 shadow-sm'
                        }`}
                    >
                        {isSaving ? (
                            <>
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>SAVING…</span>
                            </>
                        ) : isSaved ? (
                            <span>✓ SAVED</span>
                        ) : saveError ? (
                            <span>RETRY SAVE</span>
                        ) : (
                            <span>💾 SAVE</span>
                        )}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
                {/* ── RESTRAINED TRIP MASTHEAD (EDITORIAL ASYMMETRIC) ── */}
                <header className="relative bg-paper-light border border-[#EADFD4] rounded-3xl overflow-hidden shadow-sm p-6 sm:p-10 lg:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Left Info Column */}
                        <div className="lg:col-span-6 z-10">
                            <div className="flex items-center gap-3 font-mono text-[11px] font-bold tracking-[0.25em] text-brand-primary uppercase mb-4">
                                <span className="w-2 h-2 rounded-full bg-brand-primary" />
                                <span>JOURNEY Nº {String(form.days || 7).padStart(2, '0')}</span>
                                <span className="text-naviigo-brown/30">|</span>
                                <span>{destInfo?.state || 'INDIA'}</span>
                            </div>

                            <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tightest text-naviigo-brown mb-4 leading-[0.95]">
                                {destName}
                            </h1>

                            {/* Waypoint Route Trail */}
                            <div className="font-mono text-xs font-semibold tracking-wider text-brand-primary uppercase mb-6 flex flex-wrap items-center gap-2">
                                <span>START</span>
                                <span>→</span>
                                <span>{destName}</span>
                                <span>→</span>
                                <span>{data.highlights?.[0]?.name || 'HISTORIC CORE'}</span>
                                {data.highlights?.[1]?.name && (
                                    <>
                                        <span>→</span>
                                        <span>{data.highlights[1].name}</span>
                                    </>
                                )}
                            </div>

                            <p className="font-sans text-sm sm:text-base text-naviigo-brown/75 font-light leading-relaxed mb-8 max-w-lg">
                                {data.description}
                            </p>

                            {/* Editorial Metadata Strip */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-b border-[#EADFD4] py-4 mb-8 font-mono text-xs text-naviigo-brown">
                                <div>
                                    <div className="text-[10px] text-naviigo-brown/50 uppercase tracking-widest">DURATION</div>
                                    <div className="font-bold text-sm mt-0.5">{form.days as number} DAYS</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-naviigo-brown/50 uppercase tracking-widest">WINDOW</div>
                                    <div className="font-bold text-sm mt-0.5">
                                        {form.startDate ? new Date(form.startDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Flexible'}
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <div className="text-[10px] text-naviigo-brown/50 uppercase tracking-widest">PARTY</div>
                                    <div className="font-bold text-sm mt-0.5 truncate">{groupLabel}</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-4">
                                <button
                                    onClick={onDayView}
                                    className="px-8 py-4 bg-brand-primary hover:bg-naviigo-brown text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-brand-primary/20 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <span>OPEN DAY-BY-DAY ROADBOOK</span>
                                    <span>→</span>
                                </button>
                                {!user ? (
                                    <button
                                        onClick={signInWithGoogle}
                                        className="px-6 py-4 border-2 border-naviigo-brown/20 hover:border-brand-primary text-naviigo-brown hover:text-brand-primary font-mono text-xs font-bold uppercase tracking-wider rounded-full transition-colors"
                                    >
                                        Save to Passport
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSaveItinerary}
                                        disabled={isSaving || isSaved}
                                        className={`px-6 py-4 border-2 font-mono text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center gap-2 ${
                                            isSaved
                                                ? 'border-brand-primary text-brand-primary bg-brand-primary/10 cursor-default'
                                                : isSaving
                                                ? 'border-brand-primary/40 text-naviigo-brown/60 cursor-wait'
                                                : saveError
                                                ? 'border-red-500 text-red-600 hover:bg-red-50'
                                                : 'border-naviigo-brown/20 hover:border-brand-primary text-naviigo-brown hover:text-brand-primary'
                                        }`}
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                                <span>SAVING ROADBOOK…</span>
                                            </>
                                        ) : isSaved ? (
                                            <span>✓ SAVED IN PASSPORT</span>
                                        ) : saveError ? (
                                            <span>RETRY PASSPORT SAVE</span>
                                        ) : (
                                            <span>SAVE TO PASSPORT</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right 55vw Visual Anchor */}
                        <div className="lg:col-span-6 relative">
                            <div className="relative aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden shadow-xl border border-[#EADFD4] group">
                                <PlaceImage
                                    name={destName}
                                    fallbackUrl={destInfo?.img}
                                    asBackground
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                                    width={1600}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute bottom-6 left-6 right-6 text-white flex items-end justify-between">
                                    <div>
                                        <span className="font-mono text-[10px] tracking-widest uppercase text-brand-secondary font-bold block mb-1">
                                            CURATED ITINERARY FILE
                                        </span>
                                        <div className="font-display font-black text-2xl uppercase tracking-tight">
                                            {destName}
                                        </div>
                                        <div className="font-mono text-xs text-white/80 mt-0.5">
                                            Average cost: {data.avgCost || '₹2,500/day'}
                                        </div>
                                    </div>
                                    <div className="font-mono text-xs text-white/70 text-right">
                                        CLIMATE<br />{weatherForMonth}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Live weather — Open-Meteo via /api/weather, self-hides when offline */}
                {weatherCenter && (
                    <WeatherStrip lat={weatherCenter.lat} lng={weatherCenter.lng} label={destName} compact />
                )}

                {/* ── TRANSFER STRIP ── */}
                <div className="bg-paper-light border border-[#EADFD4] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs shadow-sm">
                    <div className="flex items-center gap-2 font-bold tracking-wider text-naviigo-brown uppercase">
                        <span className="w-2 h-2 rounded-full bg-brand-primary" />
                        <span>TRANSIT CORRIDOR</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-3 w-full sm:w-auto text-brand-primary font-semibold">
                        <span className="w-8 sm:w-16 h-[1px] bg-brand-primary/30" />
                        <span>AIR / RAIL / ROAD WAYPOINT</span>
                        <span className="w-8 sm:w-16 h-[1px] bg-brand-primary/30" />
                    </div>
                    <div className="text-naviigo-brown/70 tracking-wider">
                        {data.logistics?.flights || data.logistics?.trains || `${destName} Terminal`}
                    </div>
                </div>

                {/* ── LIVING JOURNEY SPINE (DAY CHAPTERS PREVIEW) ── */}
                <section className="bg-paper-light border border-[#EADFD4] rounded-3xl p-6 sm:p-10 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#EADFD4] pb-5 mb-8">
                        <div>
                            <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-brand-primary block mb-1">
                                ROADBOOK CHAPTERS
                            </span>
                            <h2 className="font-display font-black text-2xl sm:text-4xl text-naviigo-brown uppercase tracking-tight">
                                Journey Spine
                            </h2>
                        </div>
                        <button
                            onClick={onDayView}
                            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-primary hover:text-naviigo-brown transition-colors"
                        >
                            Open Day-by-Day View →
                        </button>
                    </div>

                    <div className="relative space-y-6 sm:space-y-8">
                        {/* Connecting Spine */}
                        <div className="absolute left-[19px] sm:left-[23px] top-6 bottom-6 w-[2px] bg-brand-primary/20 pointer-events-none" />

                        {data.dayPlans?.map((dp: any, idx: number) => {
                            const formattedDay = String(dp.day || idx + 1).padStart(2, '0');
                            const actCount = dp.activities?.length || 0;
                            return (
                                <div
                                    key={dp.day || idx}
                                    onClick={onDayView}
                                    className="relative flex items-start gap-4 sm:gap-6 group cursor-pointer"
                                >
                                    {/* Numbered Waypoint */}
                                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-paper-warm border-2 border-brand-primary text-brand-primary font-mono font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-sm group-hover:bg-brand-primary group-hover:text-white transition-all z-10">
                                        {formattedDay}
                                    </div>

                                    {/* Editorial Chapter Strip */}
                                    <div className="flex-1 bg-paper-warm border border-[#EADFD4] group-hover:border-brand-primary/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 group-hover:shadow-md">
                                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-xs font-bold text-brand-primary uppercase tracking-widest">
                                                    CHAPTER {formattedDay}
                                                </span>
                                                <span className="text-naviigo-brown/30">·</span>
                                                <h3 className="font-display font-bold text-xl sm:text-2xl text-naviigo-brown uppercase tracking-tight group-hover:translate-x-1 transition-transform">
                                                    {dp.title || `${destName} Discovery`}
                                                </h3>
                                            </div>
                                            <span className="font-mono text-xs text-naviigo-brown/60 uppercase">
                                                {actCount} Activities Planned
                                            </span>
                                        </div>

                                        <p className="font-sans text-xs sm:text-sm text-naviigo-brown/70 font-light mb-4 line-clamp-2">
                                            {dp.activities?.[0]?.desc || 'Morning arrivals, local trails, and authenticated cultural stops.'}
                                        </p>

                                        {/* Activity timestamps preview */}
                                        <div className="flex flex-wrap gap-2 pt-3 border-t border-[#EADFD4]/60">
                                            {dp.activities?.slice(0, 3).map((a: any, aIdx: number) => (
                                                <span
                                                    key={aIdx}
                                                    className="font-mono text-[11px] bg-paper-light border border-[#EADFD4] text-naviigo-brown/80 px-2.5 py-1 rounded-lg"
                                                >
                                                    {a.time ? `${a.time} · ` : ''}{a.name}
                                                </span>
                                            ))}
                                            {actCount > 3 && (
                                                <span className="font-mono text-[11px] text-brand-primary font-bold px-2 py-1">
                                                    +{actCount - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-10">
                        {/* Budget Progress */}
                        <div className="bg-paper-light rounded-2xl border border-[#EADFD4] p-5 sm:p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                    <span>TRIP BUDGET PROGRESS</span>
                                </h3>
                                <span className="font-mono text-xs font-bold text-naviigo-brown">
                                    Budget: ₹{(form.budget as number).toLocaleString('en-IN')}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <span className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/50 block mb-1">
                                        Allocated Budget
                                    </span>
                                    <span className="font-display font-bold text-base sm:text-lg text-naviigo-brown">
                                        ₹{(form.budget as number).toLocaleString('en-IN')}
                                    </span>
                                </div>
                                {data.avgCost && (
                                    <div>
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/50 block mb-1">
                                            Est. Base Daily Cost
                                        </span>
                                        <span className="font-display font-bold text-base sm:text-lg text-naviigo-brown">
                                            {data.avgCost} / day
                                        </span>
                                    </div>
                                )}
                                {data.estimatedTravelCost && (
                                    <div>
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-naviigo-brown/50 block mb-1">
                                            Transit Baseline
                                        </span>
                                        <span className="font-display font-bold text-base sm:text-lg text-naviigo-brown">
                                            {data.estimatedTravelCost}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full h-2 bg-paper-warm rounded-full overflow-hidden border border-[#EADFD4]">
                                <div className="h-full bg-brand-primary rounded-full" style={{ width: '60%' }} />
                            </div>
                        </div>

                        {/* Per-trip expense tracker — logs actual spend vs budget */}
                        <ExpenseTracker shareId={shareId} budget={form.budget as number} />

                        {/* Smart Packing List */}
                        {packingList.length > 0 && (
                            <div className="bg-paper-light rounded-2xl border border-[#EADFD4] p-5 sm:p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>SMART PACKING LIST</span>
                                    </h3>
                                    {data.weather && (
                                        <span className="font-mono text-[10px] text-naviigo-brown/60 uppercase">
                                            Weather Context: {weatherForMonth}
                                        </span>
                                    )}
                                </div>

                                <ul className="space-y-2.5 mb-4">
                                    {(showAllPacking ? packingList : packingList.slice(0, 7)).map((item, idx) => {
                                        const isChecked = !!checkedPacking[idx];
                                        return (
                                            <li
                                                key={`pack-item-${idx}`}
                                                onClick={() => setCheckedPacking(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                className="flex items-start gap-3 group cursor-pointer select-none"
                                            >
                                                <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition-colors ${
                                                    isChecked
                                                        ? 'bg-naviigo-teal border-naviigo-teal text-white'
                                                        : 'border-[#EADFD4] bg-paper-warm group-hover:border-brand-primary'
                                                }`}>
                                                    {isChecked && <span className="text-[10px] font-bold">✓</span>}
                                                </div>
                                                <span className={`text-xs sm:text-sm font-sans transition-colors ${
                                                    isChecked ? 'line-through text-naviigo-brown/40' : 'text-naviigo-brown/85'
                                                }`}>
                                                    {item}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {packingList.length > 7 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllPacking(!showAllPacking)}
                                        className="font-mono text-[11px] font-bold uppercase tracking-wider text-brand-primary hover:text-naviigo-brown transition-colors"
                                    >
                                        {showAllPacking ? 'Show Less ↑' : `Show All (${packingList.length}) ↓`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Transport Logistics */}
                        {data.logistics && (data.logistics.flights || data.logistics.trains) && (
                            <div className="bg-paper-light rounded-2xl border border-[#EADFD4] p-5 sm:p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>GETTING THERE</span>
                                    </h3>
                                    <span className="font-mono text-[10px] text-naviigo-brown/50">TRANSIT PROTOCOLS</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.logistics.flights && (
                                        <div className="bg-paper-warm rounded-xl border border-[#EADFD4] p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-mono text-xs font-bold uppercase text-naviigo-brown">Air Transit</span>
                                                    <span className="font-mono text-[10px] text-brand-primary font-bold">FLIGHT</span>
                                                </div>
                                                <p className="font-sans text-xs text-naviigo-brown/70 leading-relaxed mb-4">
                                                    {data.logistics.flights}
                                                </p>
                                            </div>
                                            <a
                                                href={`/bookings?transport=flight&to=${data.logistics.airportCode || 'BOM'}`}
                                                className="inline-flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-brand-primary hover:text-naviigo-brown border-t border-[#EADFD4] pt-3"
                                            >
                                                <span>Book Flights</span>
                                                <span>↗</span>
                                            </a>
                                        </div>
                                    )}

                                    {data.logistics.trains && (
                                        <div className="bg-paper-warm rounded-xl border border-[#EADFD4] p-4 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-mono text-xs font-bold uppercase text-naviigo-brown">Rail Corridor</span>
                                                    <span className="font-mono text-[10px] text-brand-primary font-bold">RAIL</span>
                                                </div>
                                                <p className="font-sans text-xs text-naviigo-brown/70 leading-relaxed mb-4">
                                                    {data.logistics.trains}
                                                </p>
                                            </div>
                                            <a
                                                href={`/bookings?transport=train&to=${data.logistics.stationCode || 'BSB'}`}
                                                className="inline-flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-wider text-brand-primary hover:text-naviigo-brown border-t border-[#EADFD4] pt-3"
                                            >
                                                <span>Book Trains</span>
                                                <span>↗</span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Highlights — Only best 5–7 in asymmetric editorial layout */}
                        {curatedHighlights.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>TOP HIGHLIGHTS</span>
                                    </h3>
                                    <span className="font-mono text-[10px] text-naviigo-brown/50">CURATED REGIONAL ATLAS ({curatedHighlights.length})</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                        {/* Hero Feature Place (~58% width) */}
                                        {curatedHighlights[0] && (
                                            <div
                                                onClick={() => router.push(itineraryPlaceHref('attraction', destId, curatedHighlights[0]))}
                                                className="lg:col-span-7 group relative bg-paper-light rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm hover:border-brand-primary/40 transition-all cursor-pointer flex flex-col min-h-[300px] sm:min-h-[360px]"
                                            >
                                                <div className="relative flex-1 bg-paper-warm overflow-hidden">
                                                    <PlaceImage
                                                        name={curatedHighlights[0].name}
                                                        city={destName}
                                                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        asBackground
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                                    <div className="absolute top-3 left-3 flex items-center gap-2">
                                                        <span className="font-mono text-[10px] font-bold uppercase bg-brand-primary text-white px-2.5 py-1 rounded-full shadow-sm">
                                                            01 · Featured
                                                        </span>
                                                        {curatedHighlights[0].rating && (
                                                            <span className="font-mono text-[10px] font-bold bg-white/90 text-naviigo-brown px-2 py-0.5 rounded-full shadow-sm">
                                                                ★ {curatedHighlights[0].rating}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="absolute bottom-4 left-4 right-4 text-white">
                                                        <h4 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight leading-tight mb-1">
                                                            {curatedHighlights[0].name}
                                                        </h4>
                                                        <p className="font-sans text-xs text-white/80 line-clamp-2">
                                                            {curatedHighlights[0].desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 2 Secondary Stacked Places */}
                                        <div className="lg:col-span-5 flex flex-col gap-4">
                                            {curatedHighlights.slice(1, 3).map((a: any, idx: number) => (
                                                <div
                                                    key={`hl-sec-${idx}-${a.name}`}
                                                    onClick={() => router.push(itineraryPlaceHref('attraction', destId, a))}
                                                    className="group flex-1 bg-paper-light rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm hover:border-brand-primary/40 transition-all cursor-pointer flex flex-col justify-between min-h-[160px]"
                                                >
                                                    <div className="relative h-28 bg-paper-warm overflow-hidden">
                                                        <PlaceImage
                                                            name={a.name}
                                                            city={destName}
                                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            asBackground
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                        <div className="absolute top-2.5 left-2.5">
                                                            <span className="font-mono text-[9px] font-bold uppercase bg-paper-warm/90 text-naviigo-brown px-2 py-0.5 rounded-full">
                                                                0{idx + 2}
                                                            </span>
                                                        </div>
                                                        <div className="absolute bottom-2 left-3 right-3 text-white">
                                                            <h4 className="font-display font-bold text-base uppercase leading-tight line-clamp-1">
                                                                {a.name}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <p className="font-sans text-xs text-naviigo-brown/70 line-clamp-1 mb-1">
                                                            {a.desc}
                                                        </p>
                                                        <div className="flex items-center justify-between font-mono text-[10px] text-naviigo-brown/50">
                                                            <span>{a.bestMonths || 'All Season'}</span>
                                                            <span className="text-brand-primary font-bold">View Place →</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Supporting Places (3 to 6) */}
                                    {curatedHighlights.length > 3 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {curatedHighlights.slice(3, 6).map((a: any, idx: number) => (
                                                <div
                                                    key={`hl-sub-${idx}-${a.name}`}
                                                    onClick={() => router.push(itineraryPlaceHref('attraction', destId, a))}
                                                    className="group bg-paper-light rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm hover:border-brand-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                                                >
                                                    <div className="relative h-32 bg-paper-warm overflow-hidden">
                                                        <PlaceImage
                                                            name={a.name}
                                                            city={destName}
                                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            asBackground
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                        <div className="absolute top-2.5 left-2.5">
                                                            <span className="font-mono text-[9px] font-bold uppercase bg-paper-warm/90 text-naviigo-brown px-2 py-0.5 rounded-full">
                                                                0{idx + 4}
                                                            </span>
                                                        </div>
                                                        <div className="absolute bottom-2 left-3 right-3 text-white">
                                                            <h4 className="font-display font-bold text-sm uppercase leading-tight line-clamp-1">
                                                                {a.name}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <p className="font-sans text-xs text-naviigo-brown/70 line-clamp-2 mb-2">
                                                            {a.desc}
                                                        </p>
                                                        <div className="flex items-center justify-between font-mono text-[10px]">
                                                            <span className="text-naviigo-brown/50">{a.bestMonths || 'All Year'}</span>
                                                            <span className="text-brand-primary font-bold group-hover:underline">View →</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Video Guide — strictly hidden if no valid video exists */}
                        <VideoCard destId={destId} destName={destName} />

                        {/* Cuisine & Dining — Curated Best 5–7 */}
                        {curatedRestaurants.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>CUISINE & DINING</span>
                                    </h3>
                                    <span className="font-mono text-[10px] text-naviigo-brown/50">CURATED GASTRONOMY ({curatedRestaurants.length})</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {curatedRestaurants.map((r: any, idx: number) => (
                                        <div
                                            key={`rest-${idx}-${r.id || r.name}`}
                                            onClick={() => router.push(itineraryPlaceHref('restaurant', destId, r))}
                                            className="group bg-paper-light rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm hover:border-brand-primary/40 transition-all cursor-pointer flex flex-col justify-between"
                                        >
                                            <div className="relative h-36 bg-paper-warm overflow-hidden">
                                                <PlaceImage
                                                    name={r.name}
                                                    city={destName}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    asBackground
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                                <div className="absolute top-2.5 left-2.5">
                                                    <span className="font-mono text-[10px] font-bold uppercase bg-paper-warm/90 text-naviigo-brown px-2 py-0.5 rounded-full">
                                                        {r.cuisine || 'Local Specialty'}
                                                    </span>
                                                </div>
                                                {r.rating && (
                                                    <div className="absolute top-2.5 right-2.5">
                                                        <span className="font-mono text-[10px] font-bold bg-white/95 text-naviigo-brown px-2 py-0.5 rounded-full shadow-sm">
                                                            ★ {r.rating}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 left-3 right-3 text-white">
                                                    <h4 className="font-display font-bold text-base uppercase leading-tight line-clamp-1">
                                                        {r.name}
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <p className="font-sans text-xs text-naviigo-brown/70 line-clamp-2 mb-3">
                                                    {r.desc}
                                                </p>
                                                {r.mustTry && (
                                                    <div className="font-mono text-[10px] bg-paper-warm border border-[#EADFD4] text-naviigo-brown px-2.5 py-1 rounded-md line-clamp-1 mb-2">
                                                        <span className="font-bold text-brand-primary mr-1">Must try:</span>
                                                        {r.mustTry}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between font-mono text-[10px] text-naviigo-brown/50 pt-2 border-t border-[#EADFD4]">
                                                    <span>{r.priceRange || 'Moderate'}</span>
                                                    <span className="text-brand-primary font-bold group-hover:underline">Explore →</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels & Stays */}
                        {data.hotels && data.hotels.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>CURATED HOSPITALITY</span>
                                    </h3>
                                    <span className="font-mono text-[10px] text-naviigo-brown/50">STAY OPTIONS ({data.hotels.length})</span>
                                </div>
                                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-naviigo-brown mb-4">
                                    🏨 Stay Options
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.hotels.map((h: any, i: number) => (
                                        <motion.div
                                            key={`hotel-card-${i}-${h.id || h.name || 'item'}`}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={(e) => { e.stopPropagation(); router.push(itineraryPlaceHref('hotel', destId, h)); }}
                                            className="group bg-paper-light rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm hover:border-brand-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                                        >
                                            <div className="relative h-40 bg-paper-warm overflow-hidden">
                                                <PlaceImage name={h.name} city={destName} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" asBackground />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
                                                <div className="absolute top-2.5 left-2.5">
                                                    <span className="font-mono text-[10px] font-bold uppercase bg-paper-warm/95 text-naviigo-brown px-2 py-0.5 rounded-full shadow-xs">
                                                        {h.type || 'Hotel'}
                                                    </span>
                                                </div>
                                                {h.priceRange && (
                                                    <div className="absolute top-2.5 right-2.5">
                                                        <span className="font-mono text-[11px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md shadow-xs">
                                                            {h.priceRange}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                                    <h3 className="font-display font-bold text-base uppercase leading-tight line-clamp-1">
                                                        {h.name}
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="font-mono text-[11px] font-bold bg-amber-500/15 text-amber-800 border border-amber-500/25 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                                                            ★ {h.rating || '4.5'}
                                                        </span>
                                                        <span className="font-mono text-[10px] text-naviigo-brown/50">Verified Stay</span>
                                                    </div>
                                                    <p className="font-sans text-xs text-naviigo-brown/75 line-clamp-2 leading-relaxed mb-3">
                                                        {h.desc}
                                                    </p>
                                                    {h.amenities && h.amenities.length > 0 && (
                                                        <div className="flex gap-1.5 flex-wrap mb-3">
                                                            {h.amenities.slice(0, 3).map((a: string, aIdx: number) => (
                                                                <span key={`amenity-${i}-${aIdx}`} className="font-mono text-[10px] text-naviigo-brown/70 bg-paper-warm border border-[#EADFD4] px-2 py-0.5 rounded-md">
                                                                    {a}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between font-mono text-[10px] text-naviigo-brown/50 pt-2.5 border-t border-[#EADFD4]">
                                                    <span>{h.priceRange || 'Standard Rate'}</span>
                                                    <span className="text-brand-primary font-bold group-hover:underline flex items-center gap-1">
                                                        Book Stay →
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hidden Gems */}
                        {hiddenGems.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>SECRET SPOTS</span>
                                    </h3>
                                    <span className="font-mono text-[10px] text-naviigo-brown/50">UNMAPPED ({hiddenGems.length})</span>
                                </div>
                                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-naviigo-brown mb-4">
                                    💎 Local Hidden Gems
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {hiddenGems.map((g, i) => (
                                        <motion.div
                                            key={`gem-card-${i}-${g.placeId || g.name || 'item'}`}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group bg-paper-light border border-[#EADFD4] rounded-2xl p-4 shadow-sm hover:border-brand-primary/40 hover:shadow-md transition-all"
                                        >
                                            <div className="flex gap-3.5">
                                                <PlaceImage
                                                    name={g.name}
                                                    city={destName}
                                                    fallbackUrl={g.photo}
                                                    className="w-16 h-16 rounded-xl shrink-0 object-cover border border-[#EADFD4]"
                                                    asBackground
                                                    width={200}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-display font-bold text-base uppercase text-naviigo-brown line-clamp-1 group-hover:text-brand-primary transition-colors">
                                                        {g.name}
                                                    </h3>
                                                    <div className="font-mono text-[11px] text-brand-primary font-bold uppercase mb-1">{g.type}</div>
                                                    <div className="font-sans text-xs text-naviigo-brown/70 line-clamp-1">{g.vicinity}</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Local Insider Tips */}
                        {insiderTips.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>LOCAL INSIDER KNOWLEDGE</span>
                                    </h3>
                                    <span className="font-mono text-[10px] text-naviigo-brown/50">FIELD INTEL</span>
                                </div>
                                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-naviigo-brown mb-4">
                                    🧠 Local Insider Tips
                                </h2>
                                <div className="bg-paper-light border border-[#EADFD4] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                                    {insiderTips.map((tip, i) => (
                                        <motion.div
                                            key={`insider-tip-${i}`}
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            className="flex gap-3.5 items-start p-4 rounded-2xl bg-paper-warm/70 border border-[#EADFD4]/80 hover:border-brand-primary/30 transition-colors"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                                {i + 1}
                                            </div>
                                            <p className="font-sans text-sm text-naviigo-brown font-medium leading-relaxed">
                                                {tip}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Travel Tips from AI */}
                        {data.travelTips && data.travelTips.length > 0 && (
                            <div>
                                <div className="flex items-baseline justify-between mb-4 border-b border-[#EADFD4] pb-2">
                                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-brand-primary flex items-center gap-2">
                                        <span>TRAVEL PROTOCOLS</span>
                                    </h3>
                                    <span className="font-mono text-[10px] text-naviigo-brown/50">REGIONAL ETIQUETTE</span>
                                </div>
                                <h2 className="font-display font-black text-2xl uppercase tracking-tight text-naviigo-brown mb-4">
                                    🧭 Travel Tips from Locals
                                </h2>
                                <div className="bg-paper-light border border-[#EADFD4] rounded-3xl p-6 sm:p-8 shadow-sm space-y-3.5">
                                    {data.travelTips.map((tip: string, i: number) => (
                                        <div key={`travel-tip-${i}`} className="flex gap-3.5 items-start p-3.5 rounded-xl bg-paper-warm/50 border border-[#EADFD4]/60">
                                            <span className="text-brand-primary font-bold text-base mt-0.5">✦</span>
                                            <p className="font-sans text-sm text-naviigo-brown/85 leading-relaxed font-normal">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {generatedData && (
                            <div className="flex items-center gap-3.5 text-xs text-naviigo-brown/80 bg-paper-light border border-[#EADFD4] rounded-2xl p-4 sm:p-5 shadow-xs">
                                <span className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0 text-base">✨</span>
                                <span className="font-sans leading-relaxed">
                                    This bespoke itinerary was crafted by the <strong className="font-semibold text-brand-primary">NaviiGo Personalization Engine</strong> based on your preferences, browsing behavior, and real traveler field data.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Sticky Map */}
                    <div className="w-full max-w-full lg:w-[400px] lg:sticky lg:top-[140px] lg:self-start">
                        <div className="h-[350px] max-h-[calc(100vh-200px)] lg:h-[500px] lg:max-h-[calc(100vh-200px)] rounded-2xl overflow-hidden border border-[#EADFD4] shadow-sm bg-paper-light">
                            <ItineraryMap pins={mapPins} center={data.mapCenter} zoom={10} className="w-full h-full" />
                        </div>
                    </div>
                </div>

                {/* ── SOFT CONCLUSION (BRIDGE TO MEMORY ARCHIVE) ── */}
                <section className="pt-20 pb-12 border-t border-[#EADFD4] text-center max-w-2xl mx-auto">
                    <div className="w-12 h-1 bg-brand-primary mx-auto mb-6 rounded-full" />
                    <span className="font-mono text-xs font-bold tracking-[0.25em] text-brand-primary uppercase block mb-3">
                        CONCLUSION
                    </span>
                    <h2 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tight text-naviigo-brown mb-4">
                        KEEP THIS ONE.
                    </h2>
                    <p className="font-sans text-sm sm:text-base text-naviigo-brown/70 font-light max-w-md mx-auto mb-8 leading-relaxed">
                        Every curated journey leaves a permanent trace in your personal archive. Take it on the road or save it for next season.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <button
                            onClick={onDayView}
                            className="px-8 py-4 bg-brand-primary hover:bg-naviigo-brown text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full shadow-lg shadow-brand-primary/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <span>EXPLORE ROADBOOK</span>
                            <span>→</span>
                        </button>
                        <button
                            onClick={() => router.push('/passport')}
                            className="px-8 py-4 border-2 border-naviigo-brown/20 hover:border-brand-primary text-naviigo-brown hover:text-brand-primary font-mono text-xs font-bold uppercase tracking-widest rounded-full transition-colors"
                        >
                            View Passport Archive
                        </button>
                    </div>
                </section>
            </div>


            {/* AI Edit Panel (Slide-in) */}
            <AnimatePresence>
                {isEditPanelOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                            onClick={closeEditPanel} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white dark:bg-muted-900 shadow-2xl flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-muted-100 dark:border-muted-800 bg-gradient-to-r from-indigo-50 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-900/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">✨</div>
                                    <div>
                                        <div className="font-bold text-muted-900 dark:text-white text-sm">Edit with AI</div>
                                        <div className="text-[10px] text-muted-400">Tell me how to change {destName}</div>
                                    </div>
                                </div>
                                <button onClick={closeEditPanel} className="w-8 h-8 rounded-full hover:bg-muted-100 dark:hover:bg-muted-800 flex items-center justify-center text-muted-500 text-lg transition-colors">×</button>
                            </div>

                            {/* Quick Prompt Chips */}
                            <div className="px-4 py-3 border-b border-muted-100 dark:border-muted-800">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        '🍽️ More food stops',
                                        '🚶 Less walking',
                                        '💰 Make it cheaper',
                                        '✨ Add hidden gem',
                                        '🌅 More morning time',
                                    ].map(chip => (
                                        <button key={chip} onClick={() => { setEditInput(chip.slice(2).trim()); }}
                                            className="text-xs bg-muted-100 dark:bg-muted-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 hover:text-indigo-700 dark:hover:text-indigo-300 text-muted-600 dark:text-muted-400 rounded-full px-3 py-1.5 font-medium transition-all">
                                            {chip}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div ref={editChatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                {editMessages.map((msg, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm'
                                                : 'bg-muted-100 dark:bg-muted-800 text-muted-800 dark:text-muted-200 rounded-bl-sm'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                                {editLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-muted-100 dark:bg-muted-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                            {[0, 1, 2].map(i => (
                                                <div key={i} className="w-1.5 h-1.5 bg-muted-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pending Action Banner */}
                            <AnimatePresence>
                                {lastAction && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="mx-4 mb-2 bg-gradient-to-r from-jungle-green-50 to-deep-sea-50 dark:from-jungle-green-900/20 dark:to-deep-sea-900/10 border border-jungle-green-100 dark:border-jungle-green-500/20 rounded-2xl p-3">
                                        <p className="text-xs text-muted-600 dark:text-muted-400 mb-2">🧠 AI wants to make a change:</p>
                                        <p className="text-xs font-semibold text-muted-900 dark:text-white mb-3">{lastAction.description}</p>
                                        <div className="flex gap-2">
                                            <button onClick={handleAcceptAction}
                                                className="flex-1 bg-jungle-green-500 hover:bg-jungle-green-400 text-white text-xs font-bold rounded-xl py-2 transition-colors">
                                                ✓ Apply Change
                                            </button>
                                            <button onClick={clearLastAction}
                                                className="flex-1 bg-muted-100 dark:bg-muted-800 hover:bg-muted-200 dark:hover:bg-muted-700 text-muted-700 dark:text-muted-300 text-xs font-bold rounded-xl py-2 transition-colors">
                                                ✕ Skip
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input */}
                            <div className="px-4 py-4 border-t border-muted-100 dark:border-muted-800">
                                <div className="flex gap-2">
                                    <input
                                        value={editInput}
                                        onChange={e => setEditInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendEdit()}
                                        placeholder={`e.g. Remove the temple on day 2...`}
                                        className="flex-1 bg-muted-100 dark:bg-muted-800 rounded-2xl px-4 py-3 text-sm text-muted-900 dark:text-white placeholder-muted-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    />
                                    <button onClick={handleSendEdit} disabled={editLoading || !editInput.trim()}
                                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-lg disabled:opacity-50 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                                        →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
