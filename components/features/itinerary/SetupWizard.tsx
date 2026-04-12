'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import CalendarPicker from '@/components/shared/CalendarPicker';
import { PURPOSES, DESTINATIONS, GROUP_SIZES } from '@/app/itinerary/data';
import { StepBar } from './helpers';

const STEP_VISUALS = ['🌍', '📍', '🗓️', '👥'];
const STEP_TITLES = ["What's the purpose of your trip?", "Where in India do you want to go?", "When & how long is your trip?", "Who's travelling & what's your budget?"];
const STEP_SUBS = ["This helps us find the right vibe for your journey.", "Pick a destination and we'll craft your perfect plan.", "Select your travel month and number of days.", "Final details before we build your itinerary."];

interface SetupWizardProps {
    onDone: (f: Record<string, unknown>) => void;
}

export default function SetupWizard({ onDone }: SetupWizardProps) {
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
