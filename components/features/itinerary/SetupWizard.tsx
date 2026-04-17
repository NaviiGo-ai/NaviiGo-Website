'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import CalendarPicker from '@/components/shared/CalendarPicker';
import { PURPOSES, DESTINATIONS, GROUP_SIZES } from '@/app/itinerary/data';
import { StepBar } from './helpers';

/** Resolve a city name to its DEST_DATA key (e.g. 'Jaipur' → 'jaipur') */
function resolveDestKey(name: string): { id: string; name: string } | null {
    const lower = name.toLowerCase().trim();
    const match = DESTINATIONS.find(d => d.name.toLowerCase() === lower || d.id === lower);
    if (match) return { id: match.id, name: match.name };
    return null;
}

const STEP_VISUALS = ['🌍', '📍', '🗓️', '👥'];
const STEP_TITLES = ["What's the purpose of your trip?", "Where in India do you want to go?", "When & how long is your trip?", "Who's travelling & what's your budget?"];
const STEP_SUBS = ["This helps us find the right vibe for your journey.", "Search any Indian city or pick from popular destinations.", "Select your travel month and number of days.", "Final details before we build your itinerary."];

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
            const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
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
                    {DESTINATIONS.map(d => (
                        <button key={d.id} onClick={() => { onSelect(d.id, d.name); setQuery(d.name); }}
                            className={`group relative h-40 rounded-3xl overflow-hidden border-2 transition-all duration-300 text-left ${value === d.id ? 'border-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.02]' : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${d.img.startsWith('http') ? d.img : `https://images.unsplash.com/photo-${d.img}?auto=format&fit=crop&w=400&q=70`})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            {value === d.id && (
                                <div className="absolute top-3 right-3 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white text-[10px] font-black">✓</span>
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 p-4 w-full">
                                <div className="font-bold text-white text-base leading-tight group-hover:translate-x-1 transition-transform">{d.name}</div>
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
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);
    const [form, setForm] = useState({ purpose: '', destination: '', destName: '', startDate: '', endDate: '', days: 0, group: '', budget: 15000 });
    const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));
    const next = () => { setDir(1); setStep(s => s + 1); };
    const back = () => { setDir(-1); setStep(s => s - 1); };
    const canNext = [form.purpose !== '', form.destination !== '', form.startDate !== '' && form.endDate !== '', form.group !== ''][step - 1] ?? false;

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
    const variants = { enter: (d: number) => ({ opacity: 0, x: d * 40 }), center: { opacity: 1, x: 0 }, exit: (d: number) => ({ opacity: 0, x: -d * 40 }) };

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-6 py-3 flex items-center gap-4">
                {step > 1 && <button onClick={back} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300 text-sm">←</button>}
                <div>
                    <div className="flex items-center gap-2 mb-1"><span className="text-lg">🗺️</span><span className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Setting Up Your Trip</span></div>
                    <StepBar step={step} total={4} />
                </div>
            </div>
            <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)]">
                <div className="flex-1 px-6 md:px-12 lg:px-16 py-10 lg:py-16 flex flex-col justify-center">
                    <AnimatePresence mode="wait" custom={dir}>
                        <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeInOut' }}>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-2 leading-tight">{STEP_TITLES[step - 1]}</h1>
                            <p className="text-zinc-400 mb-10 text-sm md:text-base">{STEP_SUBS[step - 1]}</p>

                            {step === 1 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                                    {PURPOSES.map(p => (
                                        <button key={p.id} onClick={() => set('purpose', p.id)}
                                            className={`flex items-center gap-4 bg-white dark:bg-zinc-800/50 rounded-2xl p-4 border-2 text-left transition-all duration-200 ${form.purpose === p.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.01]' : 'border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600 hover:shadow-sm'}`}>
                                            <span className="text-3xl">{p.emoji}</span>
                                            <div className="flex-1 min-w-0"><div className="font-semibold text-zinc-900 dark:text-white text-sm">{p.label}</div><div className="text-xs text-zinc-400 mt-0.5 truncate">{p.desc}</div></div>
                                            {form.purpose === p.id && <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-white text-[10px]">✓</span></div>}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {step === 2 && (
                                <CitySearch
                                    value={form.destination}
                                    destName={form.destName}
                                    onSelect={(id, name) => { set('destination', id); set('destName', name); }}
                                />
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
                                    <div>
                                        <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Budget (per person)</span><span className="text-2xl font-bold text-emerald-500">₹{form.budget.toLocaleString('en-IN')}</span></div>
                                        <input type="range" min={3000} max={200000} step={1000} value={form.budget} onChange={e => set('budget', Number(e.target.value))} className="w-full accent-emerald-500 h-2 cursor-pointer" />
                                        <div className="flex justify-between text-xs text-zinc-400 mt-1"><span>₹3,000</span><span>₹2,00,000</span></div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-10 max-w-2xl">
                                {step > 1 && <button onClick={back} className="flex-1 py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">← Back</button>}
                                <button onClick={step < 4 ? next : () => onDone(form)} disabled={!canNext}
                                    className={`flex-[2] py-3.5 rounded-2xl font-bold text-base transition-all ${canNext ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/25 active:scale-[0.98]' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'}`}>
                                    {step < 4 ? 'Next →' : 'Build My Itinerary ✨'}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="hidden lg:flex w-[420px] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 items-center justify-center border-l border-zinc-100 dark:border-white/5">
                    <motion.div key={step} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center">
                        <div className="text-8xl mb-6">{STEP_VISUALS[step - 1]}</div>
                        <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-200">Step {step} of 4</h3>
                        <p className="text-sm text-zinc-400 mt-1">{STEP_TITLES[step - 1]}</p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
