'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { saveSharedItinerary, listenToItinerary, saveItineraryToFirestore, updateSharedPlans } from '@/lib/firestore';
import { useAuth } from '@/lib/AuthContext';
import { resolveImgSrc } from '@/lib/imageService';
import {
    PURPOSES, DESTINATIONS, GROUP_SIZES,
    DEST_DATA, FALLBACK_DEST, CROWD_COLOR, WALK_COLOR,
    type CrowdLevel,
} from '@/app/itinerary/data';
import { Badge, genShareId } from './helpers';
import ShareDropdown from './ShareDropdown';
import { useAI } from '@/context/AIContext';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });
const VideoCard = dynamic(() => import('@/components/shared/VideoCard'), { ssr: false });

interface ResultPageProps {
    form: Record<string, unknown>;
    generatedData?: any;
    shareId?: string | null;
    onDayView: () => void;
    onReset: () => void;
}

export default function ResultPage({ form, generatedData, shareId, onDayView, onReset }: ResultPageProps) {
    const router = useRouter();
    const { user, signInWithGoogle } = useAuth();
    const { registerItinerary, applyAction, isEditPanelOpen, openEditPanel, closeEditPanel,
        editMessages, sendEditMessage, lastAction, clearLastAction } = useAI();
    const [isSaved, setIsSaved] = useState(false);
    const [collaborators, setCollaborators] = useState(1);
    const [isSharing, setIsSharing] = useState(false);
    const [hiddenGems, setHiddenGems] = useState<any[]>([]);
    const [insiderTips, setInsiderTips] = useState<string[]>([]);
    const [packingList, setPackingList] = useState<string[]>([]);
    const [editInput, setEditInput] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [localData, setLocalData] = useState<any>(null);
    const editChatRef = useRef<HTMLDivElement>(null);
    const autoSaveRef = useRef(false);

    const destId = form.destination as string, destName = form.destName as string;
    const purpose = form.purpose as string, group = form.group as string;
    const displayMonth = form.startDate ? new Date(form.startDate as string).toLocaleString('en-US', { month: 'short' }) : 'Jan';
    const staticData = DEST_DATA[destId] ?? FALLBACK_DEST;
    const data: any = useMemo(() => {
        const base = generatedData ? { ...staticData, ...generatedData } : staticData;
        return localData ? { ...base, ...localData } : base;
    }, [staticData, generatedData, localData]);
    const destInfo = DESTINATIONS.find(d => d.id === destId);
    const purposeLabel = PURPOSES.find(p => p.id === purpose)?.label ?? purpose;
    const groupLabel = GROUP_SIZES.find(g => g.id === group)?.label ?? group;
    const weatherForMonth = data.weather?.[displayMonth] ?? data.weather?.['Jan'] ?? '20–30°C';

    useEffect(() => {
        registerItinerary(data, (newData) => {
            setLocalData(newData);
            if (!autoSaveRef.current) {
                autoSaveRef.current = true;
                setTimeout(() => {
                    if (user?.uid) {
                        saveItineraryToFirestore(user.uid, { form, generatedData: newData }).catch(console.error);
                    }
                    if (shareId) {
                        updateSharedPlans(shareId, newData.dayPlans).catch(console.error);
                    }
                    autoSaveRef.current = false;
                }, 2000);
            }
        });
    }, [data, registerItinerary, form, user, shareId]);

    // Live Sync Listener
    useEffect(() => {
        if (shareId) {
            const unsub = listenToItinerary(shareId, (liveData) => {
                setCollaborators(liveData.collaborators ?? 1);
                if (liveData.customPlans && liveData.customPlans.length > 0) {
                    setLocalData((prev: any) => ({
                        ...prev,
                        dayPlans: liveData.customPlans,
                    }));
                }
            });
            return () => unsub();
        }
    }, [shareId]);

    // ── Auto-save itinerary to Firestore on generation ─────────
    useEffect(() => {
        if (!user?.uid || autoSaveRef.current || isSaved) return;
        autoSaveRef.current = true;
        saveItineraryToFirestore(user.uid, {
            destId,
            destName,
            form,
            generatedData: generatedData || null,
        }).then(() => {
            setIsSaved(true);
            console.log('[Itinerary] Auto-saved to Firestore');
        }).catch((err) => {
            console.error('[Itinerary] Auto-save failed:', err);
            autoSaveRef.current = false;
        });
    }, [user?.uid, destId, destName, form, generatedData, isSaved]);

    useEffect(() => {
        if (data.mapCenter) {
            fetch(`/api/places?lat=${data.mapCenter.lat}&lng=${data.mapCenter.lng}&type=tourist_attraction&radius=5000`)
                .then(r => r.json())
                .then(d => setHiddenGems(d.places?.slice(0, 4) ?? []))
                .catch(() => { });
        }
    }, [destId, data.mapCenter]);

    // Fetch AI insider tips
    useEffect(() => {
        if (!destName) return;
        fetch('/api/chat', {
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
        fetch('/api/chat', {
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

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
            {/* Top bar */}
            <div className="sticky top-20 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-4 py-3 flex items-center gap-4">
                <button onClick={onReset} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-600 dark:text-zinc-300">←</button>
                <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar text-xs text-zinc-500">
                    <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Where</div><div className="font-semibold text-zinc-900 dark:text-white">{destName}</div></div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                    <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Dates</div><div className="font-semibold text-zinc-900 dark:text-white">{form.startDate ? new Date(form.startDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} - {form.endDate ? new Date(form.endDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div></div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                    <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Preferences</div><div className="font-semibold text-zinc-900 dark:text-white truncate max-w-[160px]">{groupLabel} · {purposeLabel}</div></div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Surprise Me button */}
                    <button onClick={handleSurpriseMe}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">
                        🎲 Surprise Me
                    </button>
                    <ShareDropdown onCopyLink={handleShare} destName={destName} isSharing={isSharing} collaborators={collaborators} />
                    <button onClick={async () => {
                        if (user?.uid) {
                            await saveItineraryToFirestore(user.uid, { destId, destName, form, generatedData: generatedData || null });
                        }
                        setIsSaved(true);
                        alert('📍 Itinerary successfully saved to your Passport!');
                    }} disabled={isSaved}
                        className={`flex px-4 py-1.5 rounded-full text-xs font-semibold items-center gap-1.5 transition-colors ${isSaved ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'}`}>
                        {isSaved ? '✓ Saved' : '💾 Save'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
                {/* Hero */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden mb-8 relative">
                    <div className="relative h-64 md:h-80 flex flex-col justify-end p-6 md:p-10">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${resolveImgSrc(destInfo?.img || '', 1400)})` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/20">
                                        {form.days as number} Days • {groupLabel}
                                    </span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">{destName}</h1>
                                <p className="text-white/90 text-sm md:text-base max-w-2xl">{data.description}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                                {!user ? (
                                    <button onClick={signInWithGoogle} className="bg-white/10 hover:bg-white/20 text-white transition-all px-8 py-4 rounded-2xl font-bold text-sm backdrop-blur-md border border-white/20 flex items-center justify-center gap-2 active:scale-95">
                                        <span className="text-lg">💾</span> Save to Profile
                                    </button>
                                ) : (
                                    <button disabled className="bg-emerald-500/20 text-emerald-300 px-8 py-4 rounded-2xl font-bold text-sm backdrop-blur-md border border-emerald-500/30 flex items-center justify-center gap-2 cursor-default">
                                        <span className="text-lg">✓</span> {isSaved ? "Saved to Profile" : "Saving..."}
                                    </button>
                                )}
                                <button onClick={onDayView} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transition-all px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95">
                                    <span className="text-lg">✨</span> View Full Day-by-Day Itinerary
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 bg-white dark:bg-zinc-900 border-t border-white/10 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2"><span>💰</span><span className="text-[10px] font-bold uppercase tracking-wider">Avg. Cost / day</span></div>
                                <div className="font-bold text-lg text-zinc-900 dark:text-white">{data.avgCost}</div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="flex items-center gap-2 text-amber-500 mb-2"><span>🌤️</span><span className="text-[10px] font-bold uppercase tracking-wider">Weather ({displayMonth})</span></div>
                                <div className="font-bold text-lg text-zinc-900 dark:text-white">{weatherForMonth}</div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2"><span>👥</span><span className="text-[10px] font-bold uppercase tracking-wider">Crowd Levels</span></div>
                                <Badge label={data.crowdLevel} colorClass={CROWD_COLOR[data.crowdLevel as CrowdLevel]} />
                                <div className="text-xs text-zinc-500 mt-2">{data.crowdNote}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-10">
                        {/* Budget Tracker */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><span>💰</span> Trip Budget Progress</h2>
                                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">Budget: ₹{(form.budget as number).toLocaleString('en-IN')}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
                                <div className="flex justify-between text-sm mb-3">
                                    <span className="text-zinc-500 font-medium tracking-wide text-xs uppercase">Est. Base Cost</span>
                                    <span className="font-bold text-zinc-900 dark:text-white">{data.avgCost} / day</span>
                                </div>
                                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-emerald-500" />
                                    <motion.div initial={{ width: 0 }} animate={{ width: '20%' }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} className="h-full bg-amber-400" />
                                </div>
                                <div className="flex justify-between items-center text-xs text-zinc-400 mt-3">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Travel & Stay</span>
                                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Food & Leisure</span>
                                    </div>
                                    <span className="font-medium text-emerald-600">Well Within Budget</span>
                                </div>
                            </div>
                        </div>

                        {/* Smart Packing List */}
                        {packingList.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2"><span>🎒</span> Smart Packing List</h2>
                                    <div className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded">Weather: {weatherForMonth}</div>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm">
                                    <ul className="space-y-3">
                                        {packingList.map((item, idx) => (
                                            <li key={idx} className="flex items-start gap-3 group cursor-pointer">
                                                <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700 flex shrink-0 items-center justify-center mt-0.5 group-hover:border-emerald-500 group-hover:bg-emerald-500/10 transition-colors">
                                                </div>
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Transport Logistics */}
                        {data.logistics && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><span>✈️</span> How to Get There</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-start gap-4 hover:border-emerald-500/30 transition-all group/card">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl shrink-0">🛫</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Flights</h4>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">{data.logistics.flights}</p>
                                            <a href={`/bookings?transport=flight&to=${data.logistics.airportCode || 'BOM'}`}
                                                className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 rounded-lg hover:scale-105 transition-transform">
                                                Book Flights ↗
                                            </a>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-start gap-4 hover:border-emerald-500/30 transition-all group/card">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">🚆</div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Trains</h4>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">{data.logistics.trains}</p>
                                            <a href={`/bookings?transport=train&to=${data.logistics.stationCode || 'BSB'}`}
                                                className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#f77728] text-white px-3 py-1.5 rounded-lg hover:scale-105 transition-transform">
                                                Book Trains ↗
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Highlights */}
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🏆 Top Highlights</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {data.highlights.map((a: any, i: number) => (
                                    <motion.div key={a.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                        onClick={() => router.push(`/itinerary/detail?type=attraction&dest=${destId}&name=${encodeURIComponent(a.name)}`)}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                        <div className="relative h-36">
                                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${resolveImgSrc(a.img, 500)})` }} />
                                            <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{i + 1}</div>
                                            <div className="absolute bottom-2 left-2 flex gap-1">{a.tags.slice(0, 2).map((t: string) => <span key={t} className="text-[10px] bg-black/50 text-white backdrop-blur px-2 py-0.5 rounded-full font-medium">{t}</span>)}</div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">{a.name}</h3>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{a.desc}</p>
                                            <div className="flex gap-2 text-xs flex-wrap">
                                                <span className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2 py-1">📅 {a.bestMonths}</span>
                                                <Badge label={a.walking} colorClass={(WALK_COLOR as any)[a.walking]} />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Video Guide */}
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🎤 Video Guide</h2>
                            <VideoCard destId={destId} destName={destName} />
                        </div>

                        {/* Restaurants */}
                        {data.restaurants && data.restaurants.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🍽️ Cuisine & Dining</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.restaurants.map((r: any, i: number) => (
                                        <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            onClick={() => router.push(`/itinerary/detail?type=restaurant&dest=${destId}&name=${encodeURIComponent(r.name)}`)}
                                            className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                            <div className="relative h-32">
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${resolveImgSrc(r.img, 500)})` }} />
                                                <div className="absolute bottom-2 left-2 flex gap-1"><span className="text-[10px] bg-black/60 text-white backdrop-blur px-2 py-0.5 rounded-full font-medium">{r.cuisine}</span></div>
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{r.name}</h3>
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">⭐ {r.rating}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{r.desc}</p>
                                                <div className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 inline-block px-1.5 py-0.5 rounded">Must Try: {r.mustTry}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Hotels */}
                        {data.hotels && data.hotels.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🏨 Stay Options</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {data.hotels.map((h: any, i: number) => (
                                        <motion.div key={h.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            onClick={() => router.push(`/itinerary/detail?type=hotel&dest=${destId}&name=${encodeURIComponent(h.name)}`)}
                                            className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                                            <div className="relative h-32">
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${resolveImgSrc(h.img, 500)})` }} />
                                                <div className="absolute bottom-2 left-2 flex gap-1"><span className="text-[10px] bg-black/60 text-white backdrop-blur px-2 py-0.5 rounded-full font-medium">{h.type}</span></div>
                                                <div className="absolute top-2 right-2 text-[10px] font-bold text-white bg-black/50 backdrop-blur px-1.5 py-0.5 rounded">{h.priceRange}</div>
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{h.name}</h3>
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">⭐ {h.rating}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{h.desc}</p>
                                                <div className="flex gap-1 flex-wrap">
                                                    {h.amenities.slice(0, 3).map((a: string) => <span key={a} className="text-[9px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded">{a}</span>)}
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
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">💎 Local Hidden Gems</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {hiddenGems.map((g, i) => (
                                        <motion.div key={g.placeId || g.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                            className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                                            <div className="flex gap-3">
                                                {g.photo && <img src={g.photo} alt={g.name} className="w-16 h-16 rounded-xl object-cover" />}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-1">{g.name}</h3>
                                                    <div className="text-xs text-emerald-600 font-medium mb-1">{g.type}</div>
                                                    <div className="text-xs text-zinc-500">{g.vicinity}</div>
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
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🧠 Local Insider Tips</h2>
                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5 space-y-3">
                                    {insiderTips.map((tip, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                                            className="flex gap-3 items-start">
                                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">{i + 1}</div>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{tip}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Travel Tips from AI */}
                        {data.travelTips && data.travelTips.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🧭 Travel Tips from Locals</h2>
                                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm space-y-3">
                                    {data.travelTips.map((tip: string, i: number) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <span className="text-emerald-500 font-bold text-sm mt-0.5">💡</span>
                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {generatedData && (
                            <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-100 dark:border-zinc-800">
                                <span>✨</span>
                                <span>This itinerary was crafted by the <strong className="text-emerald-500">NaviiGo Personalization Engine</strong> based on your preferences, browsing behavior, and real traveler data.</span>
                            </div>
                        )}
                    </div>

                    {/* Sticky Map */}
                    <div className="lg:w-[400px] lg:sticky lg:top-[140px] lg:self-start">
                        <div className="h-[350px] lg:h-[500px] rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <ItineraryMap pins={mapPins} center={data.mapCenter} zoom={10} className="w-full h-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating AI Edit Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5, type: 'spring' }}
                onClick={openEditPanel}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-purple-500/30 flex items-center gap-2.5 font-bold text-sm transition-all hover:scale-105 active:scale-95"
            >
                <span className="text-lg">✏️</span>
                <span>Edit with AI</span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            </motion.button>

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
                            className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg shadow-lg shadow-purple-500/20">✨</div>
                                    <div>
                                        <div className="font-bold text-zinc-900 dark:text-white text-sm">Edit with AI</div>
                                        <div className="text-[10px] text-zinc-400">Tell me how to change {destName}</div>
                                    </div>
                                </div>
                                <button onClick={closeEditPanel} className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 text-lg transition-colors">×</button>
                            </div>

                            {/* Quick Prompt Chips */}
                            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        '🍽️ More food stops',
                                        '🚶 Less walking',
                                        '💰 Make it cheaper',
                                        '✨ Add hidden gem',
                                        '🌅 More morning time',
                                    ].map(chip => (
                                        <button key={chip} onClick={() => { setEditInput(chip.slice(2).trim()); }}
                                            className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-500/20 hover:text-violet-700 dark:hover:text-violet-300 text-zinc-600 dark:text-zinc-400 rounded-full px-3 py-1.5 font-medium transition-all">
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
                                                ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-br-sm'
                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-sm'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                                {editLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                            {[0, 1, 2].map(i => (
                                                <div key={i} className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Pending Action Banner */}
                            <AnimatePresence>
                                {lastAction && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                        className="mx-4 mb-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-3">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">🧠 AI wants to make a change:</p>
                                        <p className="text-xs font-semibold text-zinc-900 dark:text-white mb-3">{lastAction.description}</p>
                                        <div className="flex gap-2">
                                            <button onClick={handleAcceptAction}
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl py-2 transition-colors">
                                                ✓ Apply Change
                                            </button>
                                            <button onClick={clearLastAction}
                                                className="flex-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl py-2 transition-colors">
                                                ✕ Skip
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Input */}
                            <div className="px-4 py-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex gap-2">
                                    <input
                                        value={editInput}
                                        onChange={e => setEditInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendEdit()}
                                        placeholder={`e.g. Remove the temple on day 2...`}
                                        className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                    <button onClick={handleSendEdit} disabled={editLoading || !editInput.trim()}
                                        className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-lg disabled:opacity-50 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-purple-500/20">
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
