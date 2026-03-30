'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CalendarPicker from '@/components/shared/CalendarPicker';
import { saveItinerary, getSavedItineraries } from '@/lib/savedItineraries';
import {
  PURPOSES, DESTINATIONS, GROUP_SIZES, GEN_STEPS,
  DEST_DATA, FALLBACK_DEST, CROWD_COLOR, CROWD_DOT, WALK_COLOR,
  type DayPlan, type CrowdLevel,
} from './data';

// Dynamic import for the map (client-only)
const ItineraryMap = dynamic(() => import('@/components/shared/ItineraryMap'), { ssr: false });

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>{label}</span>;
}
function CrowdDot({ level }: { level: CrowdLevel }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${CROWD_DOT[level]}`} />;
}
function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < step ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
          style={{ width: i < step ? 40 : 24 }} />
      ))}
    </div>
  );
}

// ─── SETUP WIZARD ─────────────────────────────────────────────────────────────
const STEP_VISUALS = ['🌍', '📍', '🗓️', '👥'];
const STEP_TITLES = ["What's the purpose of your trip?", "Where in India do you want to go?", "When & how long is your trip?", "Who's travelling & what's your budget?"];
const STEP_SUBS = ["This helps us find the right vibe for your journey.", "Pick a destination and we'll craft your perfect plan.", "Select your travel month and number of days.", "Final details before we build your itinerary."];

function SetupWizard({ onDone }: { onDone: (f: Record<string, unknown>) => void }) {
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState({ purpose: '', destination: '', destName: '', startDate: '', endDate: '', days: 0, group: '', budget: 15000 });
  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));
  const next = () => { setDir(1); setStep(s => s + 1); };
  const back = () => { setDir(-1); setStep(s => s - 1); };
  const canNext = [form.purpose !== '', form.destination !== '', form.startDate !== '' && form.endDate !== '', form.group !== ''][step - 1] ?? false;
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-3xl">
                  {DESTINATIONS.map(d => (
                    <button key={d.id} onClick={() => { set('destination', d.id); set('destName', d.name); }}
                      className={`relative h-40 rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left ${form.destination === d.id ? 'border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]' : 'border-transparent hover:border-zinc-200 dark:hover:border-zinc-600'}`}>
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${d.img}?auto=format&fit=crop&w=400&q=70)` }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      {form.destination === d.id && <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px]">✓</span></div>}
                      <div className="absolute bottom-0 left-0 p-3"><div className="font-bold text-white text-sm">{d.name}</div><div className="text-white/60 text-[11px]">{d.sub}</div></div>
                    </button>
                  ))}
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

// ─── LOADING SCREEN WITH MAP ──────────────────────────────────────────────────
function LoadingScreen({ form, onDone }: { form: Record<string, unknown>; onDone: () => void }) {
  const destId = form.destination as string;
  const destName = form.destName as string;
  const groupLabel = GROUP_SIZES.find(g => g.id === form.group)?.label ?? '';
  const purposeLabel = PURPOSES.find(p => p.id === form.purpose)?.label ?? '';
  const data = DEST_DATA[destId] ?? FALLBACK_DEST;

  const [currentStep, setCurrentStep] = useState(0);
  const [currentSub, setCurrentSub] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [revealedPins, setRevealedPins] = useState(0);

  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (currentStep >= GEN_STEPS.length) { setTimeout(onDone, 600); return; }
    const step = GEN_STEPS[currentStep];
    const subInterval = step.duration / (step.sub.length + 1);
    if (currentSub < step.sub.length) {
      const t = setTimeout(() => { setCurrentSub(s => s + 1); setRevealedPins(p => Math.min(p + 1, data.highlights.length)); }, subInterval);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setCurrentStep(s => s + 1); setCurrentSub(0); }, subInterval);
      return () => clearTimeout(t);
    }
  }, [currentStep, currentSub, onDone, data.highlights.length]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Map pins that progressively appear
  const mapPins = useMemo(() =>
    data.highlights.slice(0, revealedPins).map((h, i) => ({
      lat: h.lat ?? data.mapCenter.lat, lng: h.lng ?? data.mapCenter.lng,
      label: h.name, number: i + 1, img: h.img,
    })),
    [data, revealedPins]);

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
      {/* Header */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-6 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">✨</span>
          <span className="font-bold text-zinc-900 dark:text-white">Working our magic</span>
        </div>
        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Beta</span>
      </div>

      {/* 2-col: timeline + map */}
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 md:px-8 py-8 gap-6 min-h-[calc(100vh-160px)]">
        {/* Left: Timeline */}
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-6">
            {/* Progress */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs text-zinc-400 font-medium">Step {Math.min(currentStep + 1, GEN_STEPS.length)} of {GEN_STEPS.length}</div>
                <div className="w-32 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                  <motion.div className="h-full bg-emerald-500 rounded-full" animate={{ width: `${(Math.min(currentStep, GEN_STEPS.length) / GEN_STEPS.length) * 100}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
              <div className="text-xs text-zinc-400">{Math.round((currentStep / GEN_STEPS.length) * 100)}%</div>
            </div>

            {/* Steps */}
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
                          {/* User preference pills */}
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
              <p className="text-[11px] text-zinc-400 mt-1">NaviiGo AI is in beta — some results may vary.</p>
            </div>
          </div>
        </div>

        {/* Right: Interactive Map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          <div className="h-full min-h-[400px] lg:h-full rounded-3xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <ItineraryMap
              pins={mapPins}
              center={data.mapCenter}
              zoom={10}
              showRoute={true}
              className="w-full h-full min-h-[400px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RESULT PAGE ──────────────────────────────────────────────────────────────
function ResultPage({ form, onDayView, onReset }: { form: Record<string, unknown>; onDayView: () => void; onReset: () => void }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const destId = form.destination as string, destName = form.destName as string;
  const purpose = form.purpose as string, group = form.group as string;
  const displayMonth = form.startDate ? new Date(form.startDate as string).toLocaleString('en-US', { month: 'short' }) : 'Jan';
  const data = DEST_DATA[destId] ?? FALLBACK_DEST;
  const destInfo = DESTINATIONS.find(d => d.id === destId);
  const purposeLabel = PURPOSES.find(p => p.id === purpose)?.label ?? purpose;
  const groupLabel = GROUP_SIZES.find(g => g.id === group)?.label ?? group;
  const weatherForMonth = data.weather[displayMonth] ?? data.weather['Jan'];

  const mapPins = useMemo(() => data.highlights.filter(h => h.lat).map((h, i) => ({
    lat: h.lat!, lng: h.lng!, label: h.name, number: i + 1, img: h.img,
  })), [data]);

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
      <div className="sticky top-20 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-4 py-3 flex items-center gap-4">
        <button onClick={onReset} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-600 dark:text-zinc-300">←</button>
        <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar text-xs text-zinc-500">
          <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Where</div><div className="font-semibold text-zinc-900 dark:text-white">{destName}</div></div>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
          <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Dates</div><div className="font-semibold text-zinc-900 dark:text-white">{form.startDate ? new Date(form.startDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} - {form.endDate ? new Date(form.endDate as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</div></div>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
          <div><div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Preferences</div><div className="font-semibold text-zinc-900 dark:text-white truncate max-w-[160px]">{groupLabel} · {purposeLabel}</div></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            const url = `${window.location.origin}/itinerary?load=${destId}`;
            navigator.clipboard.writeText(url);
            alert("Share Link Copied! Note: Links only work for you right now since data is saved locally.");
          }} className="hidden md:flex px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">🔗 Share</button>

          <button onClick={() => window.print()} className="hidden sm:flex px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">📄 PDF</button>

          <button onClick={() => { saveItinerary(destId, destName, form); setIsSaved(true); }} disabled={isSaved}
            className={`flex px-4 py-1.5 rounded-full text-xs font-semibold items-center gap-1.5 transition-colors ${isSaved ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'}`}>
            {isSaved ? '✓ Saved' : '💾 Save'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
        {/* Hero */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden mb-8 relative">
          <div className="relative h-64 md:h-80 flex flex-col justify-end p-6 md:p-10">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${destInfo?.img}?auto=format&fit=crop&w=1400&q=80)` }} />
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
                <Badge label={data.crowdLevel} colorClass={CROWD_COLOR[data.crowdLevel]} />
                <div className="text-xs text-zinc-500 mt-2">{data.crowdNote}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Extras 2-col */}
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

            {/* Transport Logistics */}
            {data.logistics && (
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><span>✈️</span> How to Get There</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl shrink-0">🛫</div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Flights</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{data.logistics.flights}</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex items-start gap-4 hover:border-emerald-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">🚆</div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Trains</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{data.logistics.trains}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🏆 Top Highlights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.highlights.map((a, i) => (
                  <motion.div key={a.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => router.push(`/itinerary/detail?type=attraction&dest=${destId}&name=${encodeURIComponent(a.name)}`)}
                    className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                    <div className="relative h-36">
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${a.img}?auto=format&fit=crop&w=500&q=70)` }} />
                      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-md">{i + 1}</div>
                      <div className="absolute bottom-2 left-2 flex gap-1">{a.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] bg-black/50 text-white backdrop-blur px-2 py-0.5 rounded-full font-medium">{t}</span>)}</div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">{a.name}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2">{a.desc}</p>
                      <div className="flex gap-2 text-xs flex-wrap">
                        <span className="bg-zinc-50 dark:bg-zinc-800 rounded-lg px-2 py-1">📅 {a.bestMonths}</span>
                        <Badge label={a.walking} colorClass={WALK_COLOR[a.walking]} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {data.restaurants && data.restaurants.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🍽️ Cuisine & Dining</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.restaurants.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/itinerary/detail?type=restaurant&dest=${destId}&name=${encodeURIComponent(r.name)}`)}
                      className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                      <div className="relative h-32">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${r.img}?auto=format&fit=crop&w=500&q=70)` }} />
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

            {data.hotels && data.hotels.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">🏨 Stay Options</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.hotels.map((h, i) => (
                    <motion.div key={h.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => router.push(`/itinerary/detail?type=hotel&dest=${destId}&name=${encodeURIComponent(h.name)}`)}
                      className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-1">
                      <div className="relative h-32">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${h.img}?auto=format&fit=crop&w=500&q=70)` }} />
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
                          {h.amenities.slice(0, 3).map(a => <span key={a} className="text-[9px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded">{a}</span>)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Sticky map */}
          <div className="lg:w-[400px] lg:sticky lg:top-[140px] lg:self-start">
            <div className="h-[350px] lg:h-[500px] rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <ItineraryMap pins={mapPins} center={data.mapCenter} zoom={10} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DAY-WISE ITINERARY WITH INTERACTIVE MAP ─────────────────────────────────
function DayViewPage({ form, onBack }: { form: Record<string, unknown>; onBack: () => void }) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const destId = form.destination as string, destName = form.destName as string;
  const data = DEST_DATA[destId] ?? FALLBACK_DEST;
  const [activeDay, setActiveDay] = useState(0);
  const [activeActivity, setActiveActivity] = useState(-1);
  const [dayRouteInfo, setDayRouteInfo] = useState<{ distance: string, time: string } | null>(null);
  const [customPlans, setCustomPlans] = useState<DayPlan[]>(() => (form.customPlans as DayPlan[]) || JSON.parse(JSON.stringify(data.dayPlans)));
  const plan: DayPlan = customPlans[activeDay] ?? customPlans[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchRes, setSearchRes] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`);
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

  // Map pins from current day's activities
  const mapPins = useMemo(() => plan.activities.map((a, i) => ({
    lat: a.lat, lng: a.lng, label: a.name, number: i + 1,
  })), [plan]);

  return (
    <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20">
      {/* Top bar */}
      <div className="sticky top-20 z-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-4 py-3 flex items-center gap-4">
        <button onClick={onBack} className="w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm text-zinc-600 dark:text-zinc-300">←</button>
        <div className="flex-1">
          <h1 className="font-bold text-zinc-900 dark:text-white text-sm">{destName} — Day-by-Day Itinerary</h1>
          <p className="text-xs text-zinc-400">Full plan with crowd & weather alerts</p>
        </div>
        <button onClick={() => { saveItinerary(destId, destName, { ...form, customPlans }); setIsSaved(true); }} disabled={isSaved}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${isSaved ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 cursor-default' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200'}`}>
          {isSaved ? '✓ Saved' : '💾 Save'}
        </button>
      </div>

      {/* Day tabs */}
      <div className="sticky top-[120px] z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-zinc-100 dark:border-white/5 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {data.dayPlans.map((dp, i) => (
            <button key={dp.day} onClick={() => { setActiveDay(i); setActiveActivity(-1); }}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${activeDay === i ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
              Day {dp.day}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div key={activeDay} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* Day title + weather + Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Day {plan.day}: {plan.title}</h2>
                  <button onClick={() => {
                    const baseDate = form.startDate ? new Date(form.startDate as string) : new Date();
                    baseDate.setDate(baseDate.getDate() + activeDay);
                    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//NaviiGo//Itinerary//EN\n";
                    plan.activities.forEach((a, i) => {
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
                  }} className="text-xs bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 rounded-full font-bold shadow-sm hover:scale-105 transition-transform flex items-center gap-1.5">
                    <span>📅</span> Add to Calendar
                  </button>
                </div>
                <p className="text-zinc-400 text-sm">{plan.activities.length} activities planned</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 flex items-center gap-4 min-w-[280px]">
                <span className="text-4xl">{plan.weather.emoji}</span>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-white">{plan.weather.temp}</div>
                  <div className="text-xs text-zinc-500">{plan.weather.condition} • 🌧️ {plan.weather.rain}% rain</div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">💡 {plan.weather.tip}</div>
                </div>
              </div>
            </div>

            {/* 2-col: activities + map */}
            <div className="flex flex-col lg:flex-row gap-6">

              {/* Activities timeline */}
              <div className="flex-1 space-y-0">
                {/* Action Bar */}
                <div className="flex gap-3 mb-6 flex-wrap">
                  <button onClick={(e) => { e.stopPropagation(); alert('✨ AI is optimizing your route to minimize travel time...'); }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transition-all px-4 py-2.5 rounded-xl font-bold text-[13px] shadow-md shadow-emerald-500/20 flex items-center gap-2 active:scale-95">
                    <span>✨</span> Optimize Day
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); alert('😌 Making schedule more relaxed by removing less important activities...'); }}
                    className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all px-4 py-2.5 rounded-xl font-bold text-[13px] shadow-sm flex items-center gap-2 active:scale-95">
                    <span>😌</span> Make it Relaxed
                  </button>
                </div>
                {dayRouteInfo && plan.activities.length > 1 && (
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3"><span className="text-2xl drop-shadow-sm">🗺️</span><span className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Total Route Driving</span></div>
                    <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 text-right bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                      <div className="text-indigo-900 dark:text-indigo-200">{dayRouteInfo.distance} total distance</div>
                      <div>~{dayRouteInfo.time} commute</div>
                    </div>
                  </div>
                )}
                {plan.activities.map((act, i) => {
                  const isLast = i === plan.activities.length - 1;
                  const slotChanged = i === 0 || plan.activities[i - 1].slot !== act.slot;
                  const isActive = activeActivity === i;
                  return (
                    <div key={act.name + i}>
                      {slotChanged && (
                        <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
                          <span className="text-base">{slotEmoji[act.slot]}</span>
                          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{act.slot}</span>
                          <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
                        </div>
                      )}
                      {act.travelFromPrev && (
                        <div className="flex items-center gap-2 ml-4 mb-2">
                          <div className="w-px h-6 bg-indigo-200 dark:bg-indigo-900/50" />
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm">🚘 {act.travelFromPrev} drive</span>
                        </div>
                      )}
                      <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.015, y: -2 }} whileTap={{ scale: 0.99 }}
                        className="flex gap-3 mb-3 cursor-pointer" onClick={() => setActiveActivity(isActive ? -1 : i)}>
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md flex-shrink-0 transition-all
                            ${isActive ? 'bg-purple-600 scale-110 shadow-purple-500/40' : 'bg-emerald-500 shadow-emerald-500/25'}`}>{i + 1}</div>
                          {!isLast && <div className={`w-0.5 flex-1 mt-1 transition-colors ${isActive ? 'bg-purple-300' : 'bg-emerald-200 dark:bg-emerald-800'}`} />}
                        </div>
                        <div className={`flex-1 bg-white dark:bg-zinc-900 rounded-[1.25rem] border p-4 shadow-sm hover:shadow-lg transition-all group/act relative overflow-hidden
                          ${isActive ? 'border-purple-300 dark:border-purple-500/30 shadow-purple-500/10' : 'border-zinc-100 dark:border-zinc-800'}`}>

                          {/* Decision Engine Badge */}
                          <div className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shadow-sm flex items-center gap-1.5 opacity-0 sm:opacity-100 group-hover/act:opacity-100 transition-opacity">
                            {act.slot === 'Morning' ? '👍 Best time: Early' : (act.desc.toLowerCase().includes('rain') || act.desc.toLowerCase().includes('water') ? '⚠️ Skip if raining' : '☕ Pair with nearby cafe')}
                          </div>

                          <div className="flex items-start justify-between mb-2">
                            <div className="pr-32">
                              <div className="inline-block px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[11px] font-bold text-zinc-600 dark:text-zinc-300 font-mono mb-2 border border-zinc-200 dark:border-zinc-700">{act.time}</div>
                              <h4 className="font-bold text-zinc-900 dark:text-white text-[15px]">{act.name}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="opacity-0 group-hover/act:opacity-100 transition-opacity flex bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 overflow-hidden">
                                <button onClick={(e) => { e.stopPropagation(); moveActivity(i, Math.max(0, i - 1)); }} disabled={i === 0} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-transparent">↑</button>
                                <button onClick={(e) => { e.stopPropagation(); moveActivity(i, Math.min(plan.activities.length - 1, i + 1)); }} disabled={isLast} className="w-6 h-6 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 border-l border-white dark:border-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent">↓</button>
                                <button onClick={(e) => { e.stopPropagation(); removeActivity(i); }} className="w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border-l border-white dark:border-zinc-900">✕</button>
                              </div>
                              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${CROWD_COLOR[act.crowd]}`}>
                                <CrowdDot level={act.crowd} /> {act.crowd}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 leading-relaxed">{act.desc}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex gap-2">
                              <div className="flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg px-2.5 py-1">
                                <span>💡</span> {act.crowdTip}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg px-2.5 py-1 border border-zinc-100 dark:border-zinc-700/50 shadow-sm">
                                <span>💳</span> ₹{act.priceBase || [250, 400, 800, 1500][i % 4]}
                              </div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/itinerary/detail?type=attraction&dest=${destId}&name=${encodeURIComponent(act.name)}`); }}
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 underline decoration-2 underline-offset-2 transition-colors">
                              Details &rarr;
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {/* Actionable Smart Alert */}
                {plan.activities.length > 4 && (
                  <div className="mt-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex gap-4 items-start shadow-sm mb-6">
                    <div className="text-2xl pt-1">⚠️</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-red-900 dark:text-red-400 mb-1">Packed Schedule Alert</h4>
                      <p className="text-xs text-red-700 dark:text-red-300 mb-3">You have {plan.activities.length} activities planned for this day. This is likely to exceed 10 hours and cause exhaustion.</p>
                      <button onClick={() => removeActivity(plan.activities.length - 1)} className="text-[11px] bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 font-bold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all shadow-sm">
                        Fix it: Remove last activity
                      </button>
                    </div>
                  </div>
                )}

                {/* Search / Add Location */}
                <div className="mt-6 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2"><span>➕</span> Search & Add Location</h4>
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for nearby cafes, spots..."
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                    <button type="submit" disabled={isSearching} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                      {isSearching ? '...' : 'Search'}
                    </button>
                  </form>
                  {searchRes.length > 0 && (
                    <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {searchRes.map(res => (
                        <div key={res.place_id} className="py-2 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1">{res.name || res.display_name.split(',')[0]}</div>
                            <div className="text-xs text-zinc-500 line-clamp-1">{res.display_name}</div>
                          </div>
                          <button onClick={() => addCustomActivity(res)} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors shrink-0">Add</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Smart Suggestions Panel */}
                <div className="mt-8">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-3 flex items-center gap-2 flex-wrap"><span>✨</span> Alternative Experiences <span className="text-xs font-normal text-zinc-400">— Tap to add to Day {plan.day}</span></h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.highlights?.filter(a => !plan.activities.find(pa => pa.name === a.name)).slice(0, 4).map(sug => (
                      <div key={sug.name} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3 flex gap-4 group cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-md transition-all"
                        onClick={() => {
                          addCustomActivity({ name: sug.name, display_name: sug.desc, lat: sug.lat || data.mapCenter.lat, lon: sug.lng || data.mapCenter.lng });
                        }}>
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                          <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${sug.img}?auto=format&fit=crop&w=150&q=70)` }} />
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">{sug.name}</div>
                          <div className="text-[10px] text-zinc-500 line-clamp-2 mt-1">{sug.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky map + info panel */}
              <div className="lg:w-[440px] lg:sticky lg:top-[160px] lg:self-start space-y-4">
                {/* Interactive map */}
                <div className="h-[350px] lg:h-[420px] rounded-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                  <ItineraryMap
                    pins={mapPins}
                    center={data.mapCenter}
                    zoom={12}
                    showRoute={true}
                    activePin={activeActivity >= 0 ? activeActivity : undefined}
                    onRouteCalculated={(legs) => { if (legs && legs.length > 0) setDayRouteInfo(legs[0]); }}
                    className="w-full h-full"
                  />
                </div>
                {/* Day label under map */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-3 flex items-center justify-between">
                  <button onClick={() => activeDay > 0 && setActiveDay(d => d - 1)} disabled={activeDay === 0}
                    className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">←</button>
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Day {plan.day} · {plan.title}</span>
                  <button onClick={() => activeDay < data.dayPlans.length - 1 && setActiveDay(d => d + 1)} disabled={activeDay === data.dayPlans.length - 1}
                    className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-xs disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">→</button>
                </div>

                {/* Smart Exhaustion Alert */}
                {(() => {
                  let totalHours = 0;
                  plan.activities.forEach(a => {
                    const parts = a.time.split('–').map(s => s.trim());
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
                    } else totalHours += 2.5; // fallback
                    if (a.travelFromPrev) totalHours += 0.5; // add 30m average commute
                  });

                  if (totalHours > 10 || plan.activities.length > 5) {
                    return (
                      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1"><span className="text-lg">⚠️</span><span className="font-bold text-sm text-red-700 dark:text-red-400">Overstuffed Schedule</span></div>
                        <p className="text-xs text-red-600 dark:text-red-500 ml-7">This day involves ~{Math.round(totalHours)} hours of activity/travel. Consider removing an activity to prevent exhaustion.</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Daily Budget Progress Tracker */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2"><span>💳</span> Daily Budget Use</h4>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">₹{(form.budget as number / (form.days as number || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} cap</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (plan.activities.length * 20))} %` }} transition={{ duration: 1 }} className={`h-full ${plan.activities.length > 4 ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                  </div>
                </div>

                {/* Rain alert */}
                {plan.weather.rain > 20 && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-1"><span className="text-lg">🌧️</span><span className="font-bold text-sm text-blue-700 dark:text-blue-400">Rain Alert</span></div>
                    <p className="text-xs text-blue-600 dark:text-blue-500 ml-7">{plan.weather.rain}% chance of rain. Keep an umbrella handy!</p>
                  </div>
                )}

                {/* Stay & Dine Recommendations */}
                {(data.hotels?.length > 0 || data.restaurants?.length > 0) && (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 space-y-4">
                    {data.hotels && data.hotels.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">🏨 Recommended Stay</h4>
                        <div className="flex gap-3 cursor-pointer group" onClick={() => router.push(`/itinerary/detail?type=hotel&dest=${destId}&name=${encodeURIComponent(data.hotels[0].name)}`)}>
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${data.hotels[0].img}?auto=format&fit=crop&w=150&q=70)` }} />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">{data.hotels[0].name}</div>
                            <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{data.hotels[0].type} • {data.hotels[0].priceRange}</div>
                            <div className="text-[10px] font-bold text-emerald-600 mt-1">⭐ {data.hotels[0].rating}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    {data.restaurants && data.restaurants.length > 0 && (
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">🍽️ Top Dining Pick</h4>
                        <div className="flex gap-3 cursor-pointer group" onClick={() => router.push(`/itinerary/detail?type=restaurant&dest=${destId}&name=${encodeURIComponent(data.restaurants[0].name)}`)}>
                          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 relative">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110" style={{ backgroundImage: `url(https://images.unsplash.com/photo-${data.restaurants[0].img}?auto=format&fit=crop&w=150&q=70)` }} />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="font-bold text-sm text-zinc-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">{data.restaurants[0].name}</div>
                            <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{data.restaurants[0].cuisine}</div>
                            <div className="text-[10px] font-bold text-amber-600 mt-1">⭐ {data.restaurants[0].rating}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Crowd summary */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2"><span>👥</span> Crowd Summary</h4>
                  <div className="space-y-2">
                    {(['Low', 'Medium', 'High'] as CrowdLevel[]).map(level => {
                      const count = plan.activities.filter(a => a.crowd === level).length;
                      if (count === 0) return null;
                      return (
                        <div key={level} className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><CrowdDot level={level} /><span className="text-xs text-zinc-600 dark:text-zinc-400">{level} crowd</span></div>
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{count} spots</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Route list */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-3">📍 Route</h4>
                  <div className="space-y-1.5">
                    {plan.activities.map((act, i) => (
                      <button key={act.name + i} onClick={() => setActiveActivity(i)}
                        className={`w-full flex items-center gap-2 text-xs p-1.5 rounded-lg transition-colors text-left ${activeActivity === i ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                        <div className={`w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold ${activeActivity === i ? 'bg-purple-600' : 'bg-emerald-500'}`}>{i + 1}</div>
                        <span className="truncate">{act.name}</span>
                        <CrowdDot level={act.crowd} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type Phase = 'setup' | 'loading' | 'result' | 'dayview';
function ItineraryContent() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('setup');
  const [savedForm, setSavedForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId) {
      const all = getSavedItineraries();
      const match = all.find(i => i.id === loadId);
      if (match) {
        setSavedForm(match.form);
        setPhase('result');
      }
    }
  }, [searchParams]);

  const handleSetupDone = useCallback((form: Record<string, unknown>) => { setSavedForm(form); setPhase('loading'); }, []);
  const handleReset = useCallback(() => { setPhase('setup'); setSavedForm({}); }, []);

  return (
    <AnimatePresence mode="wait">
      {phase === 'setup' && <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SetupWizard onDone={handleSetupDone} /></motion.div>}
      {phase === 'loading' && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoadingScreen form={savedForm} onDone={() => setPhase('result')} /></motion.div>}
      {phase === 'result' && <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ResultPage form={savedForm} onDayView={() => setPhase('dayview')} onReset={handleReset} /></motion.div>}
      {phase === 'dayview' && <motion.div key="dayview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><DayViewPage form={savedForm} onBack={() => setPhase('result')} /></motion.div>}
    </AnimatePresence>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20 flex items-center justify-center">Loading...</div>}>
      <ItineraryContent />
    </Suspense>
  );
}
