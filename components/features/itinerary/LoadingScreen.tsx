'use client';
import { motion } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { GEN_STEPS, DEST_DATA, GROUP_SIZES, PURPOSES } from '@/app/itinerary/data';

const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });
import { getBrowsingSignals } from '@/lib/browsingSignals';

// Generic India center — used when destination has no hardcoded data
// This prevents Kerala's data from bleeding into Ladakh / other new destinations
const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

interface LoadingScreenProps {
    form: Record<string, unknown>;
    onDone: (data: any) => void;
}

export default function LoadingScreen({ form, onDone }: LoadingScreenProps) {
    const destId = form.destination as string;
    const destName = form.destName as string;
    const groupLabel = GROUP_SIZES.find(g => g.id === form.group)?.label ?? '';
    const purposeLabel = PURPOSES.find(p => p.id === form.purpose)?.label ?? '';
    const hardcodedData = DEST_DATA[destId] ?? null;
    const mapCenter = hardcodedData?.mapCenter ?? INDIA_CENTER;

    // Fallback highlights if we don't have hardcoded data for this destination
    const fallbackHighlights = [
        { lat: INDIA_CENTER.lat + 4, lng: INDIA_CENTER.lng - 2, name: 'Scanning flights...', img: '' },
        { lat: INDIA_CENTER.lat - 6, lng: INDIA_CENTER.lng + 1, name: 'Finding stays...', img: '' },
        { lat: INDIA_CENTER.lat + 2, lng: INDIA_CENTER.lng + 5, name: 'Curating activities...', img: '' },
        { lat: INDIA_CENTER.lat - 3, lng: INDIA_CENTER.lng - 4, name: 'Finalizing route...', img: '' }
    ];

    const loadingHighlights = hardcodedData?.highlights?.length ? hardcodedData.highlights : fallbackHighlights;

    const [currentStep, setCurrentStep] = useState(0);
    const [currentSub, setCurrentSub] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [revealedPins, setRevealedPins] = useState(0);
    const [apiData, setApiData] = useState<any>(null);
    const [apiDone, setApiDone] = useState(false);
    const fetchedRef = useRef(false);

    const [dynamicCenter, setDynamicCenter] = useState<{ lat: number, lng: number } | null>(null);
    const [dynamicHighlights, setDynamicHighlights] = useState<any[]>([]);

    const activeMapCenter = hardcodedData?.mapCenter ?? dynamicCenter ?? INDIA_CENTER;
    const activeHighlights = hardcodedData?.highlights?.length ? hardcodedData.highlights : (dynamicHighlights.length ? dynamicHighlights : fallbackHighlights);

    // Fetch real city center via Nominatim for non-hardcoded destinations
    useEffect(() => {
        if (hardcodedData) return;
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destName + ' India')}&format=json&limit=1`)
            .then(res => res.json())
            .then(data => {
                if (data && data[0]) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    setDynamicCenter({ lat, lng });

                    // Generate 4 realistic-looking points near the city center to simulate itinerary building
                    setDynamicHighlights([
                        { lat: lat + 0.015, lng: lng - 0.015, name: 'Scanning top attractions...', img: '' },
                        { lat: lat - 0.012, lng: lng + 0.01, name: 'Curating perfect stays...', img: '' },
                        { lat: lat + 0.008, lng: lng + 0.02, name: 'Finding local eateries...', img: '' },
                        { lat: lat - 0.02, lng: lng - 0.005, name: 'Finalizing your route...', img: '' }
                    ]);
                }
            })
            .catch(() => console.error("Geocoding failed for loading screen"));
    }, [destName, hardcodedData]);

    // Timer
    useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, []);

    // Call Gemini API to generate itinerary
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        const generate = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || '';
                const res = await fetch(`${baseUrl}/api/itinerary/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        destination: destId,
                        destName: destName,
                        purpose: form.purpose,
                        group: form.group,
                        days: form.days,
                        budget: form.budget,
                        startDate: form.startDate,
                        travelerType: form.travelerType,
                        browsingSignals: getBrowsingSignals(),
                    }),
                });
                const result = await res.json();
                if (result.success && result.itinerary) {
                    setApiData(result.itinerary);
                }
            } catch (err) {
                console.error('Itinerary generation failed:', err);
            }
            setApiDone(true);
        };

        generate();
    }, [destId, destName, form]);

    // Step animation — when both animation and API are done, call onDone
    useEffect(() => {
        if (currentStep >= GEN_STEPS.length) {
            // Wait for API if still loading
            if (apiDone) {
                setTimeout(() => onDone(apiData), 600);
            }
            return;
        }
        const step = GEN_STEPS[currentStep];
        const subInterval = step.duration / (step.sub.length + 1);
        if (currentSub < step.sub.length) {
            const t = setTimeout(() => { setCurrentSub(s => s + 1); setRevealedPins(p => Math.min(p + 1, activeHighlights.length)); }, subInterval);
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(() => { setCurrentStep(s => s + 1); setCurrentSub(0); }, subInterval);
            return () => clearTimeout(t);
        }
    }, [currentStep, currentSub, apiDone, apiData, onDone, activeHighlights.length]);

    // If API finishes after animation, trigger onDone
    useEffect(() => {
        if (apiDone && currentStep >= GEN_STEPS.length) {
            setTimeout(() => onDone(apiData), 600);
        }
    }, [apiDone, currentStep, apiData, onDone]);

    const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const mapPins = useMemo(() =>
        activeHighlights.slice(0, revealedPins).map((h, i) => ({
            lat: h.lat ?? activeMapCenter.lat, lng: h.lng ?? activeMapCenter.lng,
            label: h.name, number: i + 1, img: h.img,
        })),
        [activeHighlights, activeMapCenter, revealedPins]);

    return (
        <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-6 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="font-bold text-zinc-900 dark:text-white">NaviiGo AI is crafting your trip</span>
                </div>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">NaviiGo Personalization Engine</span>
            </div>

            <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 md:px-8 py-8 gap-6 min-h-[calc(100vh-160px)]">
                {/* Left: Timeline */}
                <div className="flex-1 max-w-md mx-auto lg:mx-0">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="text-xs text-zinc-400 font-medium">Step {Math.min(currentStep + 1, GEN_STEPS.length)} of {GEN_STEPS.length}</div>
                                <div className="w-32 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                                    <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${(Math.min(currentStep, GEN_STEPS.length) / GEN_STEPS.length) * 100}%` }} transition={{ duration: 0.5 }} />
                                </div>
                            </div>
                            <div className="text-xs text-zinc-400">{Math.round((currentStep / GEN_STEPS.length) * 100)}%</div>
                        </div>

                        <div className="space-y-4">
                            {GEN_STEPS.map((s, i) => {
                                const done = i < currentStep, active = i === currentStep;
                                return (
                                    <div key={s.label} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 border-2
                        ${done ? 'bg-emerald-500 border-emerald-500' : active ? 'border-emerald-500 bg-white dark:bg-zinc-900' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900'}`}>
                                                {done ? <span className="text-white text-[10px]">✓</span> : active ? <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> : <div className="w-2 h-2 bg-zinc-200 rounded-full" />}
                                            </div>
                                            {i < GEN_STEPS.length - 1 && <div className={`w-0.5 flex-1 mt-1 min-h-[16px] transition-colors duration-500 ${done ? 'bg-emerald-400' : 'bg-zinc-200 dark:bg-zinc-700'}`} />}
                                        </div>
                                        <div className="pt-0.5 pb-3 flex-1">
                                            <div className={`font-semibold text-sm transition-colors ${active ? 'text-emerald-600' : done ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-400'}`}>{s.label}</div>
                                            {active && (
                                                <div className="mt-2 space-y-1.5">
                                                    {i === 1 && (
                                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                                            {[groupLabel, `${form.days} days`, purposeLabel, `₹${(form.budget as number).toLocaleString('en-IN')} budget`].map(tag => (
                                                                <span key={tag} className="text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full px-2.5 py-1 font-medium">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {s.sub.map((sub, j) => j <= currentSub && (
                                                        <motion.div key={sub} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                                                            className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2">
                                                            {j < currentSub ? <span className="text-emerald-500 text-sm">✓</span> : <span className="w-3 h-3 rounded-full border-2 border-zinc-300 border-t-emerald-500 animate-spin inline-block" />}
                                                            {sub}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
                            <span className="text-emerald-500 font-mono text-sm font-bold">{fmt(elapsed)}</span>
                            <p className="text-[11px] text-zinc-400 mt-1">Personalizing with NaviiGo AI…</p>
                        </div>
                    </div>
                </div>

                {/* Right: Interactive Map */}
                <div className="flex-1 min-h-[400px] lg:min-h-0">
                    <div className="h-full min-h-[400px] lg:h-full rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <ItineraryMap
                            pins={mapPins}
                            center={activeMapCenter}
                            zoom={hardcodedData?.highlights?.length || dynamicCenter ? 12 : 4.5}
                            showRoute={mapPins.length > 1}
                            className="w-full h-full min-h-[400px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
