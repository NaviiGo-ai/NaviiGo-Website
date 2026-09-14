'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Loader2, ArrowRight, Compass, Calendar, Users, Sparkles, MapPin, X, Plus } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import CalendarPicker from '@/components/shared/CalendarPicker';
import { DESTINATIONS } from '@/app/itinerary/data';
import { useAuth } from '@/lib/AuthContext';
import AuthRequiredModal from '@/components/shared/AuthRequiredModal';
import { saveItineraryByUUID } from '@/lib/firestore';

/** Resolve a city name to its catalog destination */
function resolveDestKey(name: string): { id: string; name: string; state?: string; img?: string } | null {
  const lower = name.toLowerCase().trim();
  const match = DESTINATIONS.find(d => d.name.toLowerCase() === lower || d.id === lower);
  if (match) return { id: match.id, name: match.name, state: match.state, img: match.img };
  return null;
}

const STAGES = [
  { id: 1, key: 'destination', label: '01 / PLACE', title: 'Where are we going?' },
  { id: 2, key: 'dates', label: '02 / DATES', title: 'When does the journey begin?' },
  { id: 3, key: 'travellers', label: '03 / COMPANIONS', title: 'Who is sharing this road?' },
  { id: 4, key: 'style', label: '04 / STYLE & PACE', title: 'What is the cadence?' },
  { id: 5, key: 'dispatch', label: '05 / DISPATCH', title: 'Review your expedition dossier' },
];

const TRAVEL_STYLES = [
  { id: 'culinary', label: 'FOOD & CULINARY', desc: 'Regional kitchens, street masters, and harvest tastings.' },
  { id: 'mountains', label: 'MOUNTAINS & TRAILS', desc: 'High passes, pine ridges, and quiet elevations.' },
  { id: 'heritage', label: 'HERITAGE & ART', desc: 'Ancient stone architecture, textiles, and royal courtyards.' },
  { id: 'sacred', label: 'SACRED SITES & HISTORY', desc: 'Dawn riverside ghats, ancient temples, and historic quarters.' },
  { id: 'slow', label: 'SLOW DAYS & REPOSE', desc: 'Unhurried mornings, verandah reading, and no checklist pressure.' },
  { id: 'wildlife', label: 'WILDLIFE & FORESTS', desc: 'National sanctuaries, birding corridors, and jungle dawn tracks.' },
  { id: 'nightlife', label: 'NIGHTLIFE & SOUND', desc: 'Late evening acoustic music, jazz lounges, and seaside gatherings.' },
];

const COMPANIONS = [
  { id: 'solo', label: 'SOLO TRAVELER', desc: '1 independent explorer', count: '1 PERSON' },
  { id: 'duo', label: 'DUO / COUPLE', desc: '2 traveling companions', count: '2 PERSONS' },
  { id: 'family', label: 'FAMILY VOYAGE', desc: 'Multi-generational with children or elders', count: '3–5 PERSONS' },
  { id: 'friends', label: 'EXPEDITION CREW', desc: 'Close friends or shared cohort', count: '4–8 PERSONS' },
  { id: 'caravan', label: 'LARGE CARAVAN', desc: 'Group expedition or shared delegation', count: '8+ PERSONS' },
];

interface SetupWizardProps {
  onDone?: (f: Record<string, unknown>) => void;
}

export default function SetupWizard({ onDone }: SetupWizardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [currentStage, setCurrentStage] = useState(1);
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [destination, setDestination] = useState('');
  const [destName, setDestName] = useState('');
  const [destImage, setDestImage] = useState('');
  const [destState, setDestState] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travellerGroup, setTravellerGroup] = useState('duo');
  const [selectedStyles, setSelectedStyles] = useState<string[]>(['heritage', 'culinary']);
  const [budgetPerPerson, setBudgetPerPerson] = useState(25000);
  const [mustDoPins, setMustDoPins] = useState<string[]>([]);
  const [mustDoInput, setMustDoInput] = useState('');
  const [routeStops, setRouteStops] = useState<{ name: string; stayDays: number }[]>([]);

  // Destination Autocomplete State
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Derive duration in nights and days
  const duration = useMemo(() => {
    if (!startDate || !endDate) return { nights: 0, days: 0 };
    const a = new Date(startDate);
    const b = new Date(endDate);
    const diffDays = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return {
      nights: Math.max(0, diffDays),
      days: Math.max(1, diffDays + 1),
    };
  }, [startDate, endDate]);

  // Pre-fill from query params if coming from Explore or external link
  useEffect(() => {
    const destParam = searchParams.get('destination') || searchParams.get('destName');
    if (destParam && !destination) {
      const resolved = resolveDestKey(destParam);
      if (resolved) {
        setDestination(resolved.id);
        setDestName(resolved.name);
        setDestState(resolved.state || 'India');
        setDestImage(resolved.img || '');
        setQuery(resolved.name);
      } else {
        const decoded = decodeURIComponent(destParam);
        setDestination(decoded.toLowerCase().replace(/\s+/g, '-'));
        setDestName(decoded);
        setDestState('India');
        setQuery(decoded);
      }
    }
  }, [searchParams, destination]);

  // Destination search logic
  const searchPlaces = useCallback(async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(text)}`);
      const data = await res.json();
      setSuggestions(data.predictions || []);
      setIsDropdownOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchPlaces(query), 200);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, searchPlaces]);

  // Handle outside click for autocomplete
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectDestination = (id: string, name: string, state?: string, img?: string) => {
    setDestination(id);
    setDestName(name);
    setDestState(state || 'India');
    if (img) setDestImage(img);
    setQuery(name);
    setIsDropdownOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const handleAddMustDo = () => {
    const trimmed = mustDoInput.trim();
    if (trimmed && !mustDoPins.includes(trimmed)) {
      setMustDoPins(prev => [...prev, trimmed]);
      setMustDoInput('');
    }
  };

  const handleRemoveMustDo = (pinToRemove: string) => {
    setMustDoPins(prev => prev.filter(p => p !== pinToRemove));
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev =>
      prev.includes(styleId) ? prev.filter(s => s !== styleId) : [...prev, styleId]
    );
  };

  const canProceed = useMemo(() => {
    if (currentStage === 1) return destination.trim().length > 0;
    if (currentStage === 2) return startDate !== '' && endDate !== '';
    if (currentStage === 3) return travellerGroup !== '';
    if (currentStage === 4) return selectedStyles.length > 0;
    return true;
  }, [currentStage, destination, startDate, endDate, travellerGroup, selectedStyles]);

  // Submit and launch living itinerary
  const handleBuildJourney = async () => {
    if (!user) {
      setShowAuthRequired(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const uuid = crypto.randomUUID();

      const groupMap: Record<string, string> = {
        solo: 'solo',
        duo: 'couple',
        family: 'family',
        friends: 'friends',
        caravan: 'large',
      };
      const purposeMap: Record<string, string> = {
        heritage: 'cultural',
        sacred: 'spiritual',
        mountains: 'adventure',
        wildlife: 'adventure',
        culinary: 'cultural',
        slow: 'leisure',
        nightlife: 'celebrate',
      };

      const selectedStyle = selectedStyles[0] || 'heritage';
      const canonicalGroup = groupMap[travellerGroup] || travellerGroup;
      const canonicalPurpose = purposeMap[selectedStyle] || selectedStyle || 'cultural';

      const payload = {
        destination,
        destName,
        destState,
        startDate,
        endDate,
        days: Math.min(Math.max(duration.days, 1), 14),
        group: canonicalGroup,
        purpose: canonicalPurpose,
        rawGroup: travellerGroup,
        rawStyle: selectedStyle,
        budget: budgetPerPerson,
        travelerType: 'comfort',
        mustDo: mustDoPins.map(p => ({ name: p, dayIndex: null })),
        routeStops,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      console.log('[SetupWizard] Dispatching journey to Firestore & loading screen:', payload);

      await saveItineraryByUUID(uuid, {
        form: payload,
        generatedData: null,
        destName,
        userId: user?.uid || null,
      });

      if (onDone) onDone({ ...payload, uuid });
      router.push(`/itinerary/plan/${uuid}`);
    } catch (err) {
      console.error('[SetupWizard] Failed to dispatch journey:', err);
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation for destination suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        const item = suggestions[activeSuggestionIndex];
        const cityName = item.description.split(',')[0].trim();
        const resolved = resolveDestKey(cityName);
        handleSelectDestination(
          resolved ? resolved.id : cityName.toLowerCase().replace(/\s+/g, '-'),
          resolved ? resolved.name : cityName,
          resolved ? resolved.state : 'India',
          resolved ? resolved.img : undefined
        );
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // ── RENDER EMPTY INTENTIONAL STATE ────────────────────────────────
  const renderEmptyPlacePrompt = () => (
    <div className="pt-8 pb-16">
      <div className="max-w-2xl">
        <div className="w-10 h-10 rounded-full border border-[#EADFD4] flex items-center justify-center text-brand-primary mb-6">
          <Compass className="w-5 h-5" />
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.25em] text-brand-primary font-bold mb-3">
          NOTHING PLANNED YET.
        </div>
        <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-naviigo-brown mb-4 leading-tight">
          Good. <br />
          That means the journey <br />
          <span className="text-brand-primary">can go anywhere.</span>
        </h2>
        <p className="text-naviigo-brown/75 font-sans text-base font-light leading-relaxed mb-10 max-w-lg">
          Type any destination in India into the compass field above, or select an authentic route corridor from the curated regional ledger below.
        </p>

        {/* Curated Catalog Picks */}
        <div className="space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-naviigo-brown/50 font-bold">
            PROVEN EXPEDITION CORRIDORS
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DESTINATIONS.slice(0, 8).map(d => (
              <button
                key={d.id}
                onClick={() => handleSelectDestination(d.id, d.name, d.state, d.img)}
                className="p-3 text-left bg-paper-light border border-[#EADFD4] rounded-xl hover:border-brand-primary/60 transition-all group"
              >
                <div className="font-display font-bold text-sm text-naviigo-brown group-hover:text-brand-primary transition-colors">
                  {d.name}
                </div>
                <div className="font-mono text-[10px] text-naviigo-brown/50 uppercase mt-0.5">
                  {d.state || 'India'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper-warm text-naviigo-brown font-sans selection:bg-brand-primary selection:text-white pt-24 md:pt-28 pb-32">
      <AuthRequiredModal open={showAuthRequired} onClose={() => setShowAuthRequired(false)} />

      {/* ── TOP EDITORIAL MASTHEAD ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8 border-b border-[#EADFD4] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-[10px] md:text-xs tracking-[0.25em] uppercase text-naviigo-brown/60">
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <span>EDITORIAL TRAVEL WORKSPACE</span>
            <span className="text-naviigo-brown/30">/</span>
            <span>NEW JOURNEY</span>
          </div>
          <div className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-naviigo-brown/50">
            {destination ? `CURRENT FOCUS: ${destName.toUpperCase()}` : 'OPEN COMPASS'}
          </div>
        </div>
      </div>

      {/* ── THE PLANNING WORKSPACE ───────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* ── LEFT COLUMN (62%): JOURNEY WORKSPACE & INPUTS ───────── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-12">
            
            {/* SPATIAL PROGRESSIVE JOURNEY LINE (Not a boring stepper) */}
            <div className="border-b border-[#EADFD4] pb-6">
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                {STAGES.map((s, idx) => {
                  const isActive = currentStage === s.id;
                  const isCompleted = currentStage > s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={() => {
                          if (destination || s.id === 1) setCurrentStage(s.id);
                        }}
                        disabled={!destination && s.id > 1}
                        className={`text-left transition-all ${
                          isActive
                            ? 'text-brand-primary'
                            : isCompleted
                            ? 'text-naviigo-brown hover:text-brand-primary'
                            : 'text-naviigo-brown/30 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-mono text-[10px] uppercase tracking-wider font-bold">
                          {s.label}
                        </div>
                        <div className="font-display font-bold text-xs uppercase tracking-tight">
                          {s.key}
                        </div>
                      </button>
                      {idx < STAGES.length - 1 && (
                        <div
                          className={`w-8 h-[1px] ${
                            isCompleted ? 'bg-brand-primary' : 'bg-[#EADFD4]'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STAGE 1: DESTINATION SELECTION */}
            {currentStage === 1 && (
              <div className="space-y-8">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand-primary font-bold mb-2">
                    STAGE 01 / DESTINATION
                  </div>
                  <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase leading-[0.9] tracking-tightest text-naviigo-brown">
                    WHERE ARE WE <br />
                    <span className="text-brand-primary">GOING?</span>
                  </h1>
                </div>

                {/* Signature Expansive Destination Input */}
                <div ref={searchWrapperRef} className="relative pt-4">
                  <label className="block font-mono text-xs font-bold uppercase tracking-[0.2em] text-naviigo-brown/60 mb-2">
                    DESTINATION / SEARCH OR REGION
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={query}
                      onChange={e => {
                        setQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (query.length >= 2) setIsDropdownOpen(true);
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Where are you thinking? (e.g. Kyoto, Ladakh, Goa, Jaipur...)"
                      className="w-full bg-transparent border-b-2 border-naviigo-brown/20 focus:border-brand-primary py-4 text-2xl sm:text-3xl font-display font-bold text-naviigo-brown placeholder:text-naviigo-brown/30 outline-none transition-colors"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {isSearching && <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />}
                      {destination && (
                        <button
                          type="button"
                          onClick={() => {
                            setDestination('');
                            setDestName('');
                            setQuery('');
                          }}
                          className="p-1 rounded-full text-naviigo-brown/40 hover:text-brand-primary"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editorial Autocomplete Dropdown */}
                  <AnimatePresence>
                    {isDropdownOpen && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute z-50 left-0 right-0 mt-3 bg-paper-light border border-[#EADFD4] rounded-2xl shadow-xl overflow-hidden divide-y divide-[#EADFD4]"
                      >
                        {suggestions.map((item, idx) => {
                          const cityName = item.description.split(',')[0].trim();
                          const sub = item.description.split(',').slice(1).join(',').trim() || 'India';
                          const resolved = resolveDestKey(cityName);
                          const isSelected = activeSuggestionIndex === idx;

                          return (
                            <button
                              key={item.place_id || idx}
                              type="button"
                              onClick={() => {
                                handleSelectDestination(
                                  resolved ? resolved.id : cityName.toLowerCase().replace(/\s+/g, '-'),
                                  resolved ? resolved.name : cityName,
                                  resolved ? resolved.state : sub,
                                  resolved ? resolved.img : undefined
                                );
                              }}
                              className={`w-full px-6 py-4 text-left flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-brand-primary/10' : 'hover:bg-paper-warm'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="font-mono text-xs text-brand-primary font-bold">
                                  0{idx + 1}
                                </span>
                                <div>
                                  <div className="font-display font-bold text-lg text-naviigo-brown uppercase">
                                    {cityName}
                                  </div>
                                  <div className="font-mono text-xs text-naviigo-brown/50">
                                    {sub}
                                  </div>
                                </div>
                              </div>
                              <span className="font-mono text-xs text-brand-primary font-semibold">
                                SELECT →
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Selected Confirmation Banner */}
                {destination ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-paper-light border border-[#EADFD4] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="font-mono text-[10px] text-brand-primary uppercase tracking-widest font-bold mb-1">
                        CONFIRMED SEED DESTINATION
                      </div>
                      <h3 className="font-display font-bold text-2xl sm:text-3xl text-naviigo-brown uppercase">
                        {destName}
                      </h3>
                      <p className="font-mono text-xs text-naviigo-brown/60 uppercase">
                        {destState} · INDIA
                      </p>
                    </div>

                    <button
                      onClick={() => setCurrentStage(2)}
                      className="px-6 py-3 rounded-xl bg-naviigo-brown hover:bg-brand-primary text-white font-mono text-xs uppercase tracking-widest font-bold transition-colors shrink-0 flex items-center gap-2 shadow-sm"
                    >
                      <span>SET DATES</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  renderEmptyPlacePrompt()
                )}

                {/* Optional Must-Do Experiences Pinning */}
                {destination && (
                  <div className="pt-6 border-t border-[#EADFD4]">
                    <div className="flex items-baseline justify-between mb-3">
                      <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-brand-primary font-bold">
                          MUST-DO EXPERIENCES (OPTIONAL)
                        </div>
                        <p className="font-sans text-xs text-naviigo-brown/70 mt-0.5">
                          Pin specific places or activities you definitely want integrated into the schedule.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={mustDoInput}
                        onChange={e => setMustDoInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMustDo();
                          }
                        }}
                        placeholder="e.g. Ganga Aarti at Dashashwamedh, Hemis Monastery, Scuba Diving..."
                        className="flex-1 bg-paper-light border border-[#EADFD4] rounded-xl px-4 py-2.5 text-xs font-mono text-naviigo-brown placeholder:text-naviigo-brown/40 outline-none focus:border-brand-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddMustDo}
                        className="px-5 py-2.5 rounded-xl bg-naviigo-brown hover:bg-brand-primary text-white font-mono text-xs uppercase font-bold transition-colors"
                      >
                        + PIN
                      </button>
                    </div>

                    {mustDoPins.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mustDoPins.map(pin => (
                          <span
                            key={pin}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-light border border-[#EADFD4] text-xs font-mono text-naviigo-brown"
                          >
                            <span>✦ {pin}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMustDo(pin)}
                              className="text-naviigo-brown/40 hover:text-brand-primary text-xs"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STAGE 2: CALENDAR & DURATION */}
            {currentStage === 2 && (
              <div className="space-y-8">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand-primary font-bold mb-2">
                    STAGE 02 / TEMPORAL CORRIDOR
                  </div>
                  <h2 className="font-display font-black text-4xl sm:text-6xl uppercase leading-[0.9] tracking-tightest text-naviigo-brown">
                    WHEN DOES THE <br />
                    <span className="text-brand-primary">EXPEDITION RUN?</span>
                  </h2>
                </div>

                <CalendarPicker
                  startDate={startDate}
                  endDate={endDate}
                  onSelect={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />

                <div className="flex items-center justify-between pt-6 border-t border-[#EADFD4]">
                  <button
                    onClick={() => setCurrentStage(1)}
                    className="font-mono text-xs uppercase tracking-wider text-naviigo-brown/60 hover:text-naviigo-brown font-bold"
                  >
                    ← BACK TO DESTINATION
                  </button>
                  <button
                    onClick={() => setCurrentStage(3)}
                    disabled={!startDate || !endDate}
                    className={`px-8 py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shadow-sm ${
                      startDate && endDate
                        ? 'bg-naviigo-brown hover:bg-brand-primary text-white'
                        : 'bg-[#EADFD4] text-naviigo-brown/30 cursor-not-allowed'
                    }`}
                  >
                    <span>WHO&apos;S TRAVELLING</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: TRAVELLERS */}
            {currentStage === 3 && (
              <div className="space-y-8">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand-primary font-bold mb-2">
                    STAGE 03 / TRAVEL COMPANIONS
                  </div>
                  <h2 className="font-display font-black text-4xl sm:text-6xl uppercase leading-[0.9] tracking-tightest text-naviigo-brown">
                    WHO IS SHARING <br />
                    <span className="text-brand-primary">THIS ROAD?</span>
                  </h2>
                </div>

                <div className="space-y-3">
                  {COMPANIONS.map(c => {
                    const isSelected = travellerGroup === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setTravellerGroup(c.id)}
                        className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-paper-light border-brand-primary shadow-xs'
                            : 'bg-paper-warm border-[#EADFD4] hover:border-brand-primary/40'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                              isSelected
                                ? 'border-brand-primary bg-brand-primary'
                                : 'border-naviigo-brown/30'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <div className="font-display font-bold text-lg text-naviigo-brown uppercase">
                              {c.label}
                            </div>
                            <div className="font-sans text-xs text-naviigo-brown/70 mt-0.5">
                              {c.desc}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-brand-primary font-bold">
                          {c.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#EADFD4]">
                  <button
                    onClick={() => setCurrentStage(2)}
                    className="font-mono text-xs uppercase tracking-wider text-naviigo-brown/60 hover:text-naviigo-brown font-bold"
                  >
                    ← BACK TO DATES
                  </button>
                  <button
                    onClick={() => setCurrentStage(4)}
                    className="px-8 py-3.5 rounded-xl bg-naviigo-brown hover:bg-brand-primary text-white font-mono text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <span>SELECT STYLE & PACE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 4: STYLE & PACE */}
            {currentStage === 4 && (
              <div className="space-y-10">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand-primary font-bold mb-2">
                    STAGE 04 / TRAVEL CADENCE
                  </div>
                  <h2 className="font-display font-black text-4xl sm:text-6xl uppercase leading-[0.9] tracking-tightest text-naviigo-brown">
                    WHAT IS THE <br />
                    <span className="text-brand-primary">ATMOSPHERE?</span>
                  </h2>
                </div>

                {/* Typographic Selection with Small Active Markers */}
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-naviigo-brown/60 font-bold mb-4">
                    CHOOSE YOUR EXPERIENTIAL FOCUS (SELECT ALL THAT APPLY)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TRAVEL_STYLES.map(style => {
                      const isSelected = selectedStyles.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => toggleStyle(style.id)}
                          className={`p-5 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? 'bg-paper-light border-brand-primary shadow-xs'
                              : 'bg-paper-warm border-[#EADFD4] hover:border-brand-primary/40'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-display font-bold text-base text-naviigo-brown uppercase">
                              {style.label}
                            </span>
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isSelected ? 'bg-brand-primary' : 'bg-[#EADFD4]'
                              }`}
                            />
                          </div>
                          <p className="font-sans text-xs text-naviigo-brown/70 leading-relaxed">
                            {style.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Per Person Budget Estimation */}
                <div className="p-6 rounded-2xl bg-paper-light border border-[#EADFD4]">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <div className="font-mono text-xs uppercase tracking-wider text-brand-primary font-bold">
                        ESTIMATED EXPEDITION BUDGET
                      </div>
                      <p className="font-sans text-xs text-naviigo-brown/60">
                        Per traveler allocation (accommodations, dining, verified guides & entry)
                      </p>
                    </div>
                    <div className="font-mono text-2xl font-bold text-naviigo-brown">
                      ₹{budgetPerPerson.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <input
                    type="range"
                    min={5000}
                    max={150000}
                    step={2500}
                    value={budgetPerPerson}
                    onChange={e => setBudgetPerPerson(Number(e.target.value))}
                    className="w-full accent-brand-primary cursor-pointer h-2 bg-[#EADFD4] rounded-lg"
                  />
                  <div className="flex justify-between font-mono text-[10px] text-naviigo-brown/50 uppercase mt-2">
                    <span>₹5,000 (MINIMALIST)</span>
                    <span>₹75,000 (BALANCED)</span>
                    <span>₹1,50,000+ (HERITAGE LUXURY)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#EADFD4]">
                  <button
                    onClick={() => setCurrentStage(3)}
                    className="font-mono text-xs uppercase tracking-wider text-naviigo-brown/60 hover:text-naviigo-brown font-bold"
                  >
                    ← BACK TO COMPANIONS
                  </button>
                  <button
                    onClick={() => setCurrentStage(5)}
                    className="px-8 py-3.5 rounded-xl bg-naviigo-brown hover:bg-brand-primary text-white font-mono text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <span>REVIEW EXPEDITION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 5: REVIEW & DISPATCH */}
            {currentStage === 5 && (
              <div className="space-y-10">
                <div>
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-brand-primary font-bold mb-2">
                    STAGE 05 / EXPEDITION REVIEW
                  </div>
                  <h2 className="font-display font-black text-4xl sm:text-6xl uppercase leading-[0.9] tracking-tightest text-naviigo-brown">
                    READY FOR <br />
                    <span className="text-brand-primary">DISPATCH.</span>
                  </h2>
                </div>

                {/* Clean Editorial Summary Ledger */}
                <div className="border border-[#EADFD4] rounded-2xl bg-paper-light overflow-hidden divide-y divide-[#EADFD4]">
                  
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-brand-primary font-bold">
                        DESTINATION SEED
                      </div>
                      <div className="font-display font-black text-2xl uppercase text-naviigo-brown">
                        {destName}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStage(1)}
                      className="font-mono text-xs text-naviigo-brown/50 hover:text-brand-primary uppercase underline"
                    >
                      EDIT
                    </button>
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-brand-primary font-bold">
                        EXPEDITION WINDOW
                      </div>
                      <div className="font-display font-bold text-xl uppercase text-naviigo-brown">
                        {new Date(startDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(endDate + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="font-mono text-xs text-naviigo-brown/60 uppercase mt-0.5">
                        {duration.nights} NIGHTS · {duration.days} DAYS
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStage(2)}
                      className="font-mono text-xs text-naviigo-brown/50 hover:text-brand-primary uppercase underline"
                    >
                      EDIT
                    </button>
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-brand-primary font-bold">
                        COMPANIONS & ALLOCATION
                      </div>
                      <div className="font-display font-bold text-xl uppercase text-naviigo-brown">
                        {COMPANIONS.find(c => c.id === travellerGroup)?.label}
                      </div>
                      <div className="font-mono text-xs text-naviigo-brown/60 uppercase mt-0.5">
                        BUDGET: ₹{budgetPerPerson.toLocaleString('en-IN')} PER PERSON
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStage(3)}
                      className="font-mono text-xs text-naviigo-brown/50 hover:text-brand-primary uppercase underline"
                    >
                      EDIT
                    </button>
                  </div>

                  <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-brand-primary font-bold">
                        CURATED CADENCE
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedStyles.map(s => (
                          <span
                            key={s}
                            className="font-mono text-xs uppercase px-2.5 py-1 rounded bg-paper-warm border border-[#EADFD4] text-naviigo-brown"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setCurrentStage(4)}
                      className="font-mono text-xs text-naviigo-brown/50 hover:text-brand-primary uppercase underline"
                    >
                      EDIT
                    </button>
                  </div>

                </div>

                {/* Primary CTA With Submitting State */}
                <div className="flex items-center justify-between pt-6 border-t border-[#EADFD4]">
                  <button
                    onClick={() => setCurrentStage(4)}
                    className="font-mono text-xs uppercase tracking-wider text-naviigo-brown/60 hover:text-naviigo-brown font-bold"
                  >
                    ← BACK TO STYLE
                  </button>
                  <button
                    onClick={handleBuildJourney}
                    disabled={isSubmitting}
                    className="px-10 py-5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-3 shadow-lg shadow-brand-primary/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>ORCHESTRATING JOURNEY SPINE...</span>
                      </>
                    ) : (
                      <>
                        <span>BUILD MY JOURNEY</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN (38%): STICKY EDITORIAL CONTEXT PANEL ──── */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-28 space-y-6">
            
            <div className="bg-paper-light border border-[#EADFD4] rounded-3xl overflow-hidden shadow-sm">
              
              {/* Destination Photographic Dossier */}
              <div className="relative aspect-[4/3] w-full bg-paper-warm">
                {destImage ? (
                  <Image
                    src={destImage}
                    alt={destName || 'Destination'}
                    fill
                    className="object-cover"
                    sizes="35vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-naviigo-brown/30 p-6 text-center">
                    <Compass className="w-12 h-12 stroke-[1] mb-2 text-brand-primary/50" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">
                      AWAITING SEED DESTINATION
                    </span>
                  </div>
                )}
                
                {destName && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-white/70">
                      SEED CORRIDOR
                    </div>
                    <div className="font-display font-black text-2xl uppercase">
                      {destName}
                    </div>
                  </div>
                )}
              </div>

              {/* Dossier Metadata Strip */}
              <div className="p-6 space-y-5">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-naviigo-brown/50 font-bold mb-1">
                    JOURNEY DOSSIER STATUS
                  </div>
                  <div className="font-display font-bold text-lg text-naviigo-brown uppercase">
                    {destination ? `${destName} Expedition` : 'Unchartered'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#EADFD4]">
                  <div>
                    <div className="font-mono text-[9px] uppercase text-naviigo-brown/50">WINDOW</div>
                    <div className="font-mono text-xs font-bold text-naviigo-brown mt-0.5">
                      {startDate && endDate ? `${duration.nights}N / ${duration.days}D` : 'TBD'}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[9px] uppercase text-naviigo-brown/50">PARTY</div>
                    <div className="font-mono text-xs font-bold text-naviigo-brown mt-0.5">
                      {COMPANIONS.find(c => c.id === travellerGroup)?.label.split(' ')[0] || 'DUO'}
                    </div>
                  </div>
                </div>

                {mustDoPins.length > 0 && (
                  <div className="pt-4 border-t border-[#EADFD4]">
                    <div className="font-mono text-[9px] uppercase text-naviigo-brown/50 mb-2">
                      PINNED HIGHLIGHTS ({mustDoPins.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {mustDoPins.map(pin => (
                        <span
                          key={pin}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-paper-warm border border-[#EADFD4] text-naviigo-brown"
                        >
                          ✦ {pin}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-[#EADFD4] font-mono text-[10px] text-naviigo-brown/60 leading-relaxed">
                  Naviigo automatically calculates transit pacing, arrival buffers, and contextual rest windows.
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
