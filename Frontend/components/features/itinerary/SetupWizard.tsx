'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import CalendarPicker from '@/components/shared/CalendarPicker';
import { PURPOSES, DESTINATIONS, GROUP_SIZES, TRAVELER_TYPES, ARRIVAL_TIMES, DEPARTURE_MODES, DEPARTURE_TIMES, HOTEL_AREAS } from '@/app/itinerary/data';
import { resolveImgSrc } from '@/lib/imageService';
import { StepBar } from './helpers';
import BuildFromLink from './BuildFromLink';
import SmartRecommendations from './SmartRecommendations';
import VibeMatch from './VibeMatch';
import { useAuth } from '@/lib/AuthContext';
import AuthRequiredModal from '@/components/shared/AuthRequiredModal';

/** Resolve a city name to its DEST_DATA key (e.g. 'Jaipur' → 'jaipur') */
function resolveDestKey(name: string): { id: string; name: string } | null {
    const lower = name.toLowerCase().trim();
    const match = DESTINATIONS.find(d => d.name.toLowerCase() === lower || d.id === lower);
    if (match) return { id: match.id, name: match.name };
    return null;
}

const STEP_VISUALS = ['🌍', '📍', '🗓️', '👥', '🛫'];
const STEP_TITLES = [
    "What's the purpose of your trip?",
    "Where in India do you want to go?",
    "When & how long is your trip?",
    "Who's travelling & what's your style?",
    "Travel logistics & preferences",
];
const STEP_SUBS = [
    "This helps us find the right vibe for your journey.",
    "Search any Indian city or pick from popular destinations.",
    "Select your travel month and number of days.",
    "Group size, budget, and your travel pace.",
    "Help us optimize your first and last day.",
];

interface SetupWizardProps {
    onDone: (f: Record<string, unknown>) => void;
}

function CitySearch({ value, destName, onSelect }: { value: string; destName: string; onSelect: (id: string, name: string) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const search = useCallback(async (input: string) => {
        if (input.length < 2) { setResults([]); return; }
        setLoading(true);
        try {
            const baseUrl = '';
            const res = await fetch(`${baseUrl}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
            const data = await res.json();
            setResults(data.predictions || []);
            setIsOpen(true);
        } catch { setResults([]); }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => search(query), 250);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query, search]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Search Input Section */}
            <div ref={wrapperRef} className="relative group">
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1">Search Your Destination</label>
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
                        onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
                        placeholder="Type any city in India (e.g. Manali, Kochi, Munnar...)"
                        className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-[1.25rem] px-6 py-5 text-lg font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all shadow-sm group-hover:border-zinc-300 dark:group-hover:border-zinc-600"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        {loading ? (
                            <div className="w-5 h-5 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <div className="p-2.5 bg-zinc-100 dark:bg-zinc-700/50 rounded-xl">
                                <svg className="w-5 h-5 text-zinc-500 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dropdown results */}
                <AnimatePresence>
                    {isOpen && results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            className="absolute z-[100] left-0 right-0 mt-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl dark:bg-zinc-800/95"
                        >
                            <div className="p-2">
                                {results.map((r, i) => (
                                    <button
                                        key={r.place_id || i}
                                        onClick={() => {
                                            const cityName = r.description.split(',')[0].trim();
                                            // Resolve to DEST_DATA key if it's a known destination
                                            const resolved = resolveDestKey(cityName);
                                            const cityId = resolved ? resolved.id : cityName.toLowerCase().replace(/\s+/g, '-');
                                            const displayName = resolved ? resolved.name : cityName;
                                            onSelect(cityId, displayName);
                                            setQuery(displayName);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-2xl transition-all group/item"
                                    >
                                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700/50 rounded-xl flex items-center justify-center text-lg group-hover/item:bg-emerald-100 dark:group-hover/item:bg-emerald-500/20 transition-colors">📍</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-zinc-900 dark:text-white truncate">{r.description}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-medium">{r.sub || 'India'}</p>
                                        </div>
                                        {value === (r.place_id || r.description.split(',')[0].trim().toLowerCase()) ? (
                                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                <span className="text-white text-[10px] font-black">✓</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/item:opacity-100 transition-opacity">→</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selected Status */}
            {value && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl px-5 py-4"
                >
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm">✨</div>
                    <div className="flex-1">
                        <span className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest block mb-0.5">Current Selection</span>
                        <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">{destName}</span>
                    </div>
                </motion.div>
            )}

            {/* Quick Picks */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Popular Quick Picks</p>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">8 DESTINATIONS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {DESTINATIONS.slice(0, 8).map(d => (
                        <button key={d.id} onClick={() => { onSelect(d.id, d.name); setQuery(d.name); }}
                            className={`group relative h-32 sm:h-40 rounded-3xl overflow-hidden border-2 transition-all duration-300 text-left ${value === d.id ? 'border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${resolveImgSrc(d.img, 400)})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            {value === d.id && (
                                <div className="absolute top-3 right-3 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white text-[10px] font-black">✓</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 p-3 sm:p-4 w-full">
                                <div className="font-bold text-white text-sm sm:text-base leading-tight group-hover:translate-x-1 transition-transform">{d.name}</div>
                                <div className="text-white/70 text-[10px] uppercase tracking-wider font-bold mt-1">{d.sub}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SetupWizard({ onDone }: SetupWizardProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);
    const [buildFromReel, setBuildFromReel] = useState(false);
    const [vibeMatchMode, setVibeMatchMode] = useState(false);
    const [mustDoInput, setMustDoInput] = useState('');
    const [mustDoPins, setMustDoPins] = useState<string[]>([]);
    const [form, setForm] = useState({
        purpose: '', destination: '', destName: '', startDate: '', endDate: '', days: 0,
        group: '', budget: 15000, originCity: '', travelerType: 'comfort',
        arrivalTime: 'afternoon', arrivalMode: '', departureTime: '', departureMode: '', hotelArea: '',
        mustDo: [] as { name: string; dayIndex: number | null }[],
        routeStops: [] as { name: string; stayDays: number; travelMode: string; travelTime: string }[],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showAuthRequired, setShowAuthRequired] = useState(false);
    const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));
    const selectRouteCity = useCallback((id: string, name: string) => {
        setForm(previous => {
            if (!previous.destination) return { ...previous, destination: id, destName: name };
            if (previous.destination === id || previous.routeStops.some(stop => stop.name.toLowerCase() === name.toLowerCase())) return previous;
            return { ...previous, routeStops: [...previous.routeStops, { name, stayDays: 1, travelMode: 'train', travelTime: 'morning' }] };
        });
    }, []);
    const removeRouteCity = useCallback((index: number) => {
        setForm(previous => {
            if (index > 0) return { ...previous, routeStops: previous.routeStops.filter((_, stopIndex) => stopIndex !== index - 1) };
            const [nextCity, ...remainingStops] = previous.routeStops;
            if (!nextCity) return { ...previous, destination: '', destName: '', routeStops: [] };
            return { ...previous, destination: nextCity.name.toLowerCase().replace(/\s+/g, '-'), destName: nextCity.name, routeStops: remainingStops };
        });
    }, []);
    const next = () => { setDir(1); setStep(s => s + 1); };
    const back = () => { setDir(-1); setStep(s => s - 1); };
    const canNext = [
        form.purpose !== '',
        form.destination !== '',
        form.startDate !== '' && form.endDate !== '',
        form.group !== '',
        true, // Step 5 is always completable (all fields optional)
    ][step - 1] ?? false;

    const TOTAL_STEPS = 5;

    /**
     * Generate a UUID, store the form in sessionStorage keyed by that UUID,
     * then navigate to /itinerary/[uuid]. The [uuid] page handles generation.
     */
    const handleSubmit = useCallback(() => {
        if (!user) {
            setShowAuthRequired(true);
            return;
        }
        setIsSubmitting(true);
        const uuid = crypto.randomUUID();
        const formWithMeta = { ...form, userId: user.uid };
        sessionStorage.setItem(`navii_form_${uuid}`, JSON.stringify(formWithMeta));
        // Also call the legacy onDone so parent can still hook in if needed
        onDone({ ...formWithMeta, uuid });
        router.push(`/itinerary/plan/${uuid}`);
    }, [form, user, onDone, router]);

    // Pre-fill destination from URL query params (e.g. from Explore deep-dive CTA)
    useEffect(() => {
        const destParam = searchParams.get('destination') || searchParams.get('destName');
        if (destParam && !form.destination) {
            const resolved = resolveDestKey(destParam);
            if (resolved) {
                setForm(p => ({ ...p, destination: resolved.id, destName: resolved.name }));
            } else {
                const name = decodeURIComponent(destParam);
                setForm(p => ({ ...p, destination: name.toLowerCase().replace(/\s+/g, '-'), destName: name }));
            }
        }
    }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch user origin city for travel cost estimation
    useEffect(() => {
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                if (data.city) {
                    setForm(p => ({ ...p, originCity: data.city }));
                }
            })
            .catch(() => console.warn('Could not fetch origin city'));
    }, []);

    const variants = { enter: (d: number) => ({ opacity: 0, x: d * 40 }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: -d * 40 }) };

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20">
            <AuthRequiredModal open={showAuthRequired} onClose={() => setShowAuthRequired(false)} />
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 sticky top-16 sm:top-20 z-40 py-2.5 sm:py-3 flex items-center px-3 sm:px-6 md:px-12 lg:px-16 justify-between gap-2">
                {step > 1 && !buildFromReel && !vibeMatchMode && <button onClick={back} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300 text-sm">←</button>}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><span className="text-lg">🗺️</span><span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Setting Up Your Trip</span></div>
                    {!buildFromReel && !vibeMatchMode && <StepBar step={step} total={TOTAL_STEPS} />}
                </div>
                {/* Mode toggles */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setVibeMatchMode(v => !v); setBuildFromReel(false); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${vibeMatchMode
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/20'
                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-400 hover:text-emerald-600'
                            }`}
                    >
                        <span>🎯</span>
                        <span className="hidden sm:block">{vibeMatchMode ? 'Back to Wizard' : 'Vibe Match'}</span>
                    </button>
                    <button
                        onClick={() => { setBuildFromReel(r => !r); setVibeMatchMode(false); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${buildFromReel
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-lg shadow-purple-500/20'
                                : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-purple-400 hover:text-purple-600'
                            }`}
                    >
                        <span>📸</span>
                        <span className="hidden sm:block">{buildFromReel ? 'Back to Wizard' : 'Build from Reel'}</span>
                    </button>
                </div>
            </div>
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-140px)] relative pb-20 sm:pb-24 lg:pb-0">
                <div className="flex-1 px-3 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-6 lg:py-12 flex flex-col overflow-y-auto">
                    {/* Mode-specific panels */}
                    {vibeMatchMode ? (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
                            <VibeMatch
                                onSelect={(destId, destName, purpose) => {
                                    setForm(p => ({ ...p, destination: destId, destName, purpose: purpose || p.purpose || 'leisure' }));

                                    // Update taste vector in background
                                    const baseUrl = '';
                                    fetch(`${baseUrl}/api/taste/update`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            currentVector: JSON.parse(localStorage.getItem('naviigo_taste_vector') || '[]'),
                                            selectedDestId: destId,
                                            purpose: purpose || 'leisure'
                                        })
                                    }).then(r => r.json()).then(async d => {
                                        if (d.success) {
                                            localStorage.setItem('naviigo_taste_vector', JSON.stringify(d.newVector));
                                            // Persist to Firestore for cross-device sync
                                            if (user?.uid) {
                                                try {
                                                    const { savePersonalizationTaste } = await import('@/lib/firestore');
                                                    await savePersonalizationTaste(user.uid, d.newVector);
                                                } catch { }
                                            }
                                        }
                                    }).catch(console.error);

                                    setVibeMatchMode(false);
                                    setStep(3);
                                }}
                            />
                        </motion.div>
                    ) : buildFromReel ? (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight">Build from a Reel 📸</h1>
                            <p className="text-zinc-400 mb-8 text-sm">Paste an Instagram, YouTube or travel post — AI extracts the destination and vibe.</p>
                            <BuildFromLink
                                onExtracted={(destId, destName, purpose, days) => {
                                    setForm(p => ({
                                        ...p,
                                        destination: destId,
                                        destName,
                                        purpose: purpose || p.purpose || 'leisure',
                                        days: days || p.days,
                                    }));
                                    setBuildFromReel(false);
                                    setStep(3);
                                }}
                            />
                        </motion.div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Scrollable step content */}
                            <div className="flex-1">
                                <AnimatePresence mode="wait" custom={dir}>
                                    <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeInOut' }}>
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight">{STEP_TITLES[step - 1]}</h1>
                                        <p className="text-zinc-400 mb-6 sm:mb-8 text-sm md:text-base">{STEP_SUBS[step - 1]}</p>

                                        {step === 1 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-2xl w-full">
                                                {PURPOSES.map(p => (
                                                    <button key={p.id} onClick={() => set('purpose', p.id)}
                                                        className={`flex items-center gap-3 sm:gap-4 bg-white dark:bg-zinc-800/50 rounded-2xl p-3 sm:p-4 border-2 text-left transition-all duration-200 w-full ${form.purpose === p.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.01]' : 'border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-sm'}`}>
                                                        <span className="text-2xl sm:text-3xl shrink-0">{p.emoji}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-zinc-900 dark:text-white text-sm">{p.label}</div>
                                                            <div className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 leading-snug whitespace-normal break-words">{p.desc}</div>
                                                        </div>
                                                        {form.purpose === p.id && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px]">✓</span></div>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {step === 2 && (
                                            <div>
                                                {/* Smart AI Recommendations */}
                                                {form.purpose && (
                                                    <SmartRecommendations
                                                        purpose={form.purpose}
                                                        group={form.group || 'solo'}
                                                        budget={form.budget}
                                                        userId={user?.uid}
                                                        onSelect={selectRouteCity}
                                                        onSelectAndNext={selectRouteCity}
                                                    />
                                                )}
                                                <CitySearch
                                                    value={form.destination}
                                                    destName={form.destName}
                                                    onSelect={selectRouteCity}
                                                />

                                                {form.destination && (
                                                    <div className="mt-6 max-w-4xl rounded-2xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
                                                        <div className="flex items-center justify-between gap-3 mb-3">
                                                            <div><h3 className="text-sm font-bold text-zinc-900 dark:text-white">Your route</h3><p className="text-xs text-zinc-500 dark:text-zinc-400">Select every city here. NaviiGo reserves one transit day between consecutive cities.</p></div>
                                                            <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">{form.routeStops.length + 1} cities</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {[{ name: form.destName, primary: true }, ...form.routeStops.map(stop => ({ name: stop.name, primary: false }))].map((city, index) => (
                                                                <div key={`${city.name}-${index}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm dark:bg-zinc-800">
                                                                    <span className="w-6 text-center text-xs font-black text-violet-600">{index + 1}</span>
                                                                    <span className="min-w-[130px] flex-1 text-sm font-bold text-zinc-900 dark:text-white">{city.name}</span>
                                                                    <button type="button" onClick={() => removeRouteCity(index)} className="text-xs font-bold text-rose-600 hover:text-rose-500">Remove</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {form.routeStops.length > 0 && <p className="mt-3 text-xs font-medium text-violet-700 dark:text-violet-300">Next, choose dates and then add the travel details for every city-to-city leg.</p>}
                                                    </div>
                                                )}

                                                {/* Must-Do Pinning */}
                                                {form.destination && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 max-w-2xl">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-base">📌</span>
                                                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Must-Do Experiences (Optional)</span>
                                                        </div>
                                                        <p className="text-[11px] text-zinc-400 mb-3">Pin places or experiences you definitely don&apos;t want to miss in {form.destName}.</p>
                                                        
                                                        <div className="flex gap-2 mb-3">
                                                            <input
                                                                type="text"
                                                                value={mustDoInput}
                                                                onChange={e => setMustDoInput(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter' && mustDoInput.trim()) {
                                                                        e.preventDefault();
                                                                        const val = mustDoInput.trim();
                                                                        if (!mustDoPins.includes(val)) {
                                                                            const updated = [...mustDoPins, val];
                                                                            setMustDoPins(updated);
                                                                            setForm(p => ({ ...p, mustDo: updated.map(n => ({ name: n, dayIndex: null })) }));
                                                                        }
                                                                        setMustDoInput('');
                                                                    }
                                                                }}
                                                                placeholder="e.g. Ganga Aarti, Taj Mahal, Scuba Diving..."
                                                                className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-emerald-500"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const val = mustDoInput.trim();
                                                                    if (val && !mustDoPins.includes(val)) {
                                                                        const updated = [...mustDoPins, val];
                                                                        setMustDoPins(updated);
                                                                        setForm(p => ({ ...p, mustDo: updated.map(n => ({ name: n, dayIndex: null })) }));
                                                                        setMustDoInput('');
                                                                    }
                                                                }}
                                                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shrink-0"
                                                            >
                                                                + Pin
                                                            </button>
                                                        </div>

                                                        {mustDoPins.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {mustDoPins.map(pin => (
                                                                    <span key={pin} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                                                                        📌 {pin}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const updated = mustDoPins.filter(p => p !== pin);
                                                                                setMustDoPins(updated);
                                                                                setForm(p => ({ ...p, mustDo: updated.map(n => ({ name: n, dayIndex: null })) }));
                                                                            }}
                                                                            className="hover:text-red-500 ml-1 text-xs"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        {step === 3 && (
                                            <CalendarPicker
                                                startDate={form.startDate as string}
                                                endDate={form.endDate as string}
                                                onSelect={(start, end) => {
                                                    set('startDate', start);
                                                    set('endDate', end);
                                                    if (start && end) {
                                                        const a = new Date(start), b = new Date(end);
                                                        set('days', Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
                                                    } else {
                                                        set('days', 0);
                                                    }
                                                }}
                                            />
                                        )}

                                        {step === 4 && (
                                            <div className="space-y-8 max-w-2xl">
                                                {/* Group Size */}
                                                <div>
                                                    <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Group Size</div>
                                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                        {GROUP_SIZES.map(g => (
                                                            <button key={g.id} onClick={() => set('group', g.id)} className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${form.group === g.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md' : 'border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-200'}`}>
                                                                <span className="text-2xl">{g.emoji}</span><span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{g.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Budget */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Budget (per person)</span><span className="text-2xl font-bold text-emerald-500">₹{form.budget.toLocaleString('en-IN')}</span></div>
                                                    <input type="range" min={3000} max={200000} step={1000} value={form.budget} onChange={e => set('budget', Number(e.target.value))} className="w-full accent-emerald-500 h-2 cursor-pointer" />
                                                    <div className="flex justify-between text-xs text-zinc-400 mt-1"><span>₹3,000</span><span>₹2,00,000</span></div>
                                                </div>

                                                {/* Traveler Type */}
                                                <div>
                                                    <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">Your Travel Pace</div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {TRAVELER_TYPES.map(t => (
                                                            <button key={t.id} onClick={() => set('travelerType', t.id)}
                                                                className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${form.travelerType === t.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md' : 'border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-200'}`}>
                                                                <span className="text-xl">{t.emoji}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs font-bold text-zinc-900 dark:text-white">{t.label}</div>
                                                                    <div className="text-[10px] text-zinc-400 truncate">{t.desc}</div>
                                                                </div>
                                                                {form.travelerType === t.id && <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-[8px]">✓</span></div>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Origin City */}
                                                <div>
                                                    <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Your Origin City</div>
                                                    <p className="text-xs text-zinc-400 mb-2">Auto-detected. Override if needed.</p>
                                                    <input
                                                        type="text"
                                                        value={form.originCity}
                                                        onChange={e => set('originCity', e.target.value)}
                                                        placeholder="e.g. Mumbai, Delhi, Bangalore..."
                                                        className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700/50 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {step === 5 && (
                                            <div className="space-y-8 max-w-2xl">
                                                {form.routeStops.length > 0 && (
                                                    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 dark:border-violet-500/20 dark:from-violet-900/10 dark:to-indigo-900/10">
                                                        <div className="mb-1 flex items-center gap-2"><span className="text-lg">Route</span><span className="text-sm font-bold text-zinc-900 dark:text-white">Inter-city travel</span></div>
                                                        <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">Set how and when you will travel between each pair of cities. NaviiGo will make these dedicated transit days.</p>
                                                        <div className="space-y-5">
                                                            {form.routeStops.map((stop, index) => {
                                                                const fromCity = index === 0 ? form.destName : form.routeStops[index - 1].name;
                                                                return <div key={`${fromCity}-${stop.name}`} className="rounded-xl border border-violet-100 bg-white p-4 dark:border-violet-500/15 dark:bg-zinc-800/80">
                                                                    <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">Leg {index + 1}</p><h3 className="text-base font-bold text-zinc-900 dark:text-white">{fromCity} to {stop.name}</h3></div><span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">Transit day</span></div>
                                                                    <div className="mb-4"><p className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">How will you travel?</p><div className="flex flex-wrap gap-2">{DEPARTURE_MODES.map(mode => <button type="button" key={mode.id} onClick={() => setForm(previous => ({ ...previous, routeStops: previous.routeStops.map((routeStop, stopIndex) => stopIndex === index ? { ...routeStop, travelMode: mode.id } : routeStop) }))} className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all ${stop.travelMode === mode.id ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'}`}><span className="mr-1">{mode.emoji}</span>{mode.label}</button>)}</div></div>
                                                                    <div className="mb-4"><p className="mb-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">When will you leave {fromCity}?</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ARRIVAL_TIMES.map(time => <button type="button" key={time.id} onClick={() => setForm(previous => ({ ...previous, routeStops: previous.routeStops.map((routeStop, stopIndex) => stopIndex === index ? { ...routeStop, travelTime: time.id } : routeStop) }))} className={`rounded-xl border-2 p-2 text-center transition-all ${stop.travelTime === time.id ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'}`}><span className="block text-base">{time.emoji}</span><span className="text-[10px] font-bold">{time.label}</span></button>)}</div></div>
                                                                    <label className="flex items-center justify-between gap-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400">How many days will you stay in {stop.name}?<input aria-label={`Days in ${stop.name}`} type="number" min="1" max="14" value={stop.stayDays} onChange={event => setForm(previous => ({ ...previous, routeStops: previous.routeStops.map((routeStop, stopIndex) => stopIndex === index ? { ...routeStop, stayDays: Math.max(1, Number(event.target.value) || 1) } : routeStop) }))} className="w-16 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-center text-sm font-bold text-zinc-900 outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" /></label>
                                                                </div>;
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Arrival Info */}
                                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-500/20">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="text-lg">🛬</span>
                                                        <span className="text-sm font-bold text-zinc-900 dark:text-white">Arrival Info</span>
                                                        <span className="text-[10px] text-zinc-400 ml-auto">Optional — helps optimize Day 1</span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">When do you expect to reach {form.destName || 'your destination'}?</div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                                {ARRIVAL_TIMES.map(t => (
                                                                    <button key={t.id} onClick={() => set('arrivalTime', t.id)}
                                                                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${form.arrivalTime === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300'}`}>
                                                                        <span className="text-lg">{t.emoji}</span>
                                                                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{t.label}</span>
                                                                        <span className="text-[10px] text-zinc-400">{t.desc}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Arriving by</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {DEPARTURE_MODES.map(m => (
                                                                    <button key={m.id} onClick={() => set('arrivalMode', m.id)}
                                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${form.arrivalMode === m.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'}`}>
                                                                        <span>{m.emoji}</span> {m.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Departure Info */}
                                                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-500/20">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="text-lg">🛫</span>
                                                        <span className="text-sm font-bold text-zinc-900 dark:text-white">Departure Info</span>
                                                        <span className="text-[10px] text-zinc-400 ml-auto">Optional — helps optimize last day</span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Departure time</div>
                                                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                                {DEPARTURE_TIMES.map(t => (
                                                                    <button key={t.id} onClick={() => set('departureTime', t.id)}
                                                                        className={`px-3 py-2.5 rounded-xl border-2 text-sm font-bold text-center transition-all ${form.departureTime === t.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-sm' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'}`}>
                                                                        {t.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">Leaving by</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {DEPARTURE_MODES.map(m => (
                                                                    <button key={m.id} onClick={() => set('departureMode', m.id)}
                                                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${form.departureMode === m.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'}`}>
                                                                        <span>{m.emoji}</span> {m.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Hotel Area */}
                                                <div>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-lg">🏨</span>
                                                        <span className="text-sm font-bold text-zinc-900 dark:text-white">Preferred Hotel Area</span>
                                                        <span className="text-[10px] text-zinc-400 ml-auto">Optional</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {HOTEL_AREAS.map(a => (
                                                            <button key={a.id} onClick={() => set('hotelArea', form.hotelArea === a.id ? '' : a.id)}
                                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${form.hotelArea === a.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'}`}>
                                                                <span>{a.emoji}</span> {a.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Buffer Time Preview */}
                                                {form.departureTime && form.departureMode && (
                                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                        className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-sm">⏱️</span>
                                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Last Day Buffer Preview</span>
                                                        </div>
                                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                                            With a <strong>{form.departureTime.replace(':', ' ')} departure by {form.departureMode}</strong>,
                                                            you&apos;ll have until approximately <strong>
                                                                {(() => {
                                                                    const parts = form.departureTime.split(':');
                                                                    const depHour = parseInt(parts[0]) + parseInt(parts[1] || '0') / 60;
                                                                    const buffer = { flight: 2, train: 1, bus: 0.5, car: 0.25 }[form.departureMode] || 1;
                                                                    const transit = 0.75;
                                                                    const lastActivity = depHour - buffer - transit;
                                                                    const h = Math.floor(lastActivity);
                                                                    const m = Math.round((lastActivity - h) * 60);
                                                                    return `${h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                                                                })()}
                                                            </strong> for your last activity after checkout at 11:00 AM.
                                                        </p>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}

                                        <div className="h-20 lg:h-0" />{/* bottom spacer for floating button */}
                                    </motion.div>
                                </AnimatePresence>
                            </div>{/* end scrollable */}

                            {/* Sticky Next/Back buttons — always visible */}
                            <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 lg:relative lg:bg-transparent lg:dark:bg-transparent lg:border-t-0 lg:p-0 z-[100] lg:z-auto">
                                <div className="flex gap-3 max-w-2xl mx-auto lg:mx-0 lg:pt-4 lg:border-t lg:border-zinc-100 lg:dark:border-zinc-800 lg:mt-4">
                                    {step > 1 && <motion.button whileTap={{ scale: 0.98 }} onClick={back} className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">← Back</motion.button>}
                                    <motion.button whileTap={canNext && !isSubmitting && !isTransitioning ? { scale: 0.98 } : {}} onClick={step < TOTAL_STEPS ? () => { setIsTransitioning(true); setTimeout(() => { setIsTransitioning(false); next(); }, 300); } : handleSubmit} disabled={!canNext || isSubmitting || isTransitioning}
                                        className={`flex-[2] py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${canNext && !isSubmitting && !isTransitioning ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'}`}>
                                        {isSubmitting || isTransitioning ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                {isSubmitting ? 'Preparing...' : 'Loading...'}
                                            </>
                                        ) : (
                                            step < TOTAL_STEPS ? 'Next →' : 'Build My Itinerary ✨'
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="hidden lg:flex w-[420px] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 items-center justify-center border-l border-zinc-100 dark:border-white/5">
                    <motion.div key={`${step}-${vibeMatchMode}-${buildFromReel}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center">
                        <div className="text-8xl mb-6">
                            {vibeMatchMode ? '🎯' : buildFromReel ? '📸' : STEP_VISUALS[step - 1]}
                        </div>
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-200">
                            {vibeMatchMode ? 'Vibe Match' : buildFromReel ? 'Build from Content' : `Step ${step} of ${TOTAL_STEPS}`}
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                            {vibeMatchMode ? 'Pick vibes → AI finds your destination' : buildFromReel ? 'AI extracts your trip from social media' : STEP_TITLES[step - 1]}
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
