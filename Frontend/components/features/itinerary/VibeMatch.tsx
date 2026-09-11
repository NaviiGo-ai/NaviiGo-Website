'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { resolveImgSrc } from '@/lib/imageService';


const VIBES = [
    { emoji: '🏔️', label: 'Mountains', tag: 'mountain' },
    { emoji: '🏖️', label: 'Beach', tag: 'beach' },
    { emoji: '🧘', label: 'Wellness', tag: 'wellness' },
    { emoji: '🕌', label: 'Spiritual', tag: 'spiritual' },
    { emoji: '🍜', label: 'Foodie', tag: 'food' },
    { emoji: '🎒', label: 'Adventure', tag: 'adventure' },
    { emoji: '💑', label: 'Romance', tag: 'romance' },
    { emoji: '🏛️', label: 'Culture', tag: 'culture' },
    { emoji: '🌿', label: 'Nature', tag: 'nature' },
    { emoji: '🎉', label: 'Party', tag: 'party' },
    { emoji: '📸', label: 'Photography', tag: 'photo' },
    { emoji: '🐘', label: 'Wildlife', tag: 'wildlife' },
];

const VIBE_DEST_MAP: Record<string, string[]> = {
    mountain:  ['manali', 'ladakh', 'shimla', 'darjeeling', 'gangtok'],
    beach:     ['goa', 'andaman', 'kerala', 'pondicherry'],
    wellness:  ['rishikesh', 'kerala', 'coorg'],
    spiritual: ['varanasi', 'amritsar', 'rishikesh', 'tirupati', 'ujjain'],
    food:      ['amritsar', 'jaipur', 'kerala', 'hyderabad', 'kolkata'],
    adventure: ['ladakh', 'manali', 'rishikesh', 'gangtok', 'andaman'],
    romance:   ['udaipur', 'kerala', 'andaman', 'coorg', 'goa'],
    culture:   ['jaipur', 'hampi', 'varanasi', 'mysuru', 'kolkata'],
    nature:    ['coorg', 'kerala', 'darjeeling', 'andaman', 'shillong'],
    party:     ['goa', 'mumbai', 'rishikesh'],
    photo:     ['ladakh', 'hampi', 'jaipur', 'varanasi', 'darjeeling'],
    wildlife:  ['coorg', 'kerala', 'andaman', 'kaziranga'],
};

const DEST_META: Record<string, { name: string; emoji: string; img: string }> = {
    manali:      { name: 'Manali',      emoji: '⛷️',  img: '' },
    ladakh:      { name: 'Ladakh',      emoji: '🏔️',  img: '' },
    shimla:      { name: 'Shimla',      emoji: '🌨️',  img: '' },
    darjeeling:  { name: 'Darjeeling',  emoji: '🍵',  img: '' },
    gangtok:     { name: 'Gangtok',     emoji: '🙏',  img: '' },
    goa:         { name: 'Goa',         emoji: '🌊',  img: '' },
    andaman:     { name: 'Andaman',     emoji: '🐠',  img: '' },
    kerala:      { name: 'Kerala',      emoji: '🌴',  img: '' },
    pondicherry: { name: 'Pondicherry', emoji: '🇫🇷',  img: '' },
    rishikesh:   { name: 'Rishikesh',   emoji: '🧘',  img: '' },
    coorg:       { name: 'Coorg',       emoji: '☕',  img: '' },
    varanasi:    { name: 'Varanasi',    emoji: '🕉️',  img: '' },
    amritsar:    { name: 'Amritsar',    emoji: '🥗',  img: '' },
    tirupati:    { name: 'Tirupati',    emoji: '🛕',  img: '' },
    ujjain:      { name: 'Ujjain',      emoji: '🪔',  img: '' },
    jaipur:      { name: 'Jaipur',      emoji: '🏯',  img: '' },
    hyderabad:   { name: 'Hyderabad',   emoji: '💎',  img: '' },
    kolkata:     { name: 'Kolkata',     emoji: '🎭',  img: '' },
    udaipur:     { name: 'Udaipur',     emoji: '🏰',  img: '' },
    mysuru:      { name: 'Mysuru',      emoji: '👑',  img: '' },
    hampi:       { name: 'Hampi',       emoji: '🗿',  img: '' },
    mumbai:      { name: 'Mumbai',      emoji: '🌆',  img: '' },
    shillong:    { name: 'Shillong',    emoji: '🎵',  img: '' },
    kaziranga:   { name: 'Kaziranga',   emoji: '🦏',  img: '' },
};

// Seasonal intelligence
const AVOID_MONTHS: Record<string, { months: number[]; reason: string }> = {
    jaipur:    { months: [4, 5, 6, 7], reason: 'Extreme heat 45°C+' },
    udaipur:   { months: [4, 5, 6, 7], reason: 'Extreme heat 44°C+' },
    ladakh:    { months: [11, 12, 1, 2, 3], reason: 'Snowbound & –20°C' },
    goa:       { months: [6, 7, 8], reason: 'Heavy monsoon rains' },
    andaman:   { months: [6, 7, 8], reason: 'Rough seas & storms' },
    kerala:    { months: [6, 7], reason: 'Intense monsoon floods' },
    amritsar:  { months: [5, 6], reason: 'Scorching heat 44°C' },
    mumbai:    { months: [6, 7, 8], reason: 'Heavy monsoon flooding' },
    hampi:     { months: [4, 5, 6], reason: 'Unbearable dry heat' },
};

const IDEAL_MONTHS: Record<string, { months: number[]; reason: string }> = {
    jaipur:    { months: [10, 11, 12, 1, 2, 3], reason: 'Perfect cool weather' },
    udaipur:   { months: [10, 11, 12, 1, 2, 3], reason: 'Ideal for sightseeing' },
    ladakh:    { months: [6, 7, 8, 9], reason: 'All passes open' },
    goa:       { months: [11, 12, 1, 2, 3], reason: 'Beach season at its best' },
    andaman:   { months: [11, 12, 1, 2, 3, 4], reason: 'Crystal clear waters' },
    kerala:    { months: [10, 11, 12, 1, 2, 3], reason: 'Post-monsoon paradise' },
    manali:    { months: [3, 4, 5, 6, 10, 11], reason: 'Snow & greenery' },
    shimla:    { months: [3, 4, 5, 6, 10, 11], reason: 'Perfect hill station weather' },
    rishikesh: { months: [2, 3, 4, 9, 10, 11], reason: 'Ideal for rafting & yoga' },
    darjeeling:{ months: [3, 4, 5, 9, 10, 11], reason: 'Clear mountain views' },
    coorg:     { months: [10, 11, 12, 1, 2, 3], reason: 'Cool coffee country weather' },
};

type DestResult = {
    id: string; name: string; emoji: string; img: string;
    score: number; matchedVibes: string[];
    warning?: { reason: string }; ideal?: { reason: string };
};

function getMatchedDestinations(selectedTags: string[]): DestResult[] {
    const scores: Record<string, { score: number; matchedVibes: string[] }> = {};
    const month = new Date().getMonth() + 1;

    for (const tag of selectedTags) {
        for (const destId of (VIBE_DEST_MAP[tag] || [])) {
            if (!scores[destId]) scores[destId] = { score: 0, matchedVibes: [] };
            scores[destId].score += 10;
            scores[destId].matchedVibes.push(tag);
        }
    }

    return Object.entries(scores)
        .map(([id, { score, matchedVibes }]) => {
            const meta = DEST_META[id] || { name: id, emoji: '📍', img: '' };
            let finalScore = score;
            let warning: { reason: string } | undefined;
            let ideal: { reason: string } | undefined;

            if (AVOID_MONTHS[id]?.months.includes(month)) {
                finalScore -= 25;
                warning = { reason: AVOID_MONTHS[id].reason };
            } else if (IDEAL_MONTHS[id]?.months.includes(month)) {
                finalScore += 5;
                ideal = { reason: IDEAL_MONTHS[id].reason };
            }

            return { id, ...meta, score: finalScore, matchedVibes, warning, ideal };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);
}

interface VibeMatchProps {
    onSelect: (destId: string, destName: string, purpose: string) => void;
}

export default function VibeMatch({ onSelect }: VibeMatchProps) {
    const [selected, setSelected] = useState<string[]>([]);
    const [matches, setMatches] = useState<DestResult[]>([]);
    const [step, setStep] = useState<'pick' | 'results'>('pick');

    const toggle = (tag: string) =>
        setSelected(prev => prev.includes(tag)
            ? prev.filter(t => t !== tag)
            : prev.length < 3 ? [...prev, tag] : prev);

    const findMatches = () => { setMatches(getMatchedDestinations(selected)); setStep('results'); };

    const vibeToPurpose = (tags: string[]): string => {
        if (tags.includes('spiritual')) return 'spiritual';
        if (tags.includes('romance')) return 'honeymoon';
        if (tags.includes('adventure') || tags.includes('mountain')) return 'adventure';
        if (tags.includes('culture') || tags.includes('photo')) return 'cultural';
        if (tags.includes('party')) return 'celebrate';
        return 'leisure';
    };

    const [topMatch, ...restMatches] = matches;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Vibe Match</h2>
                <p className="text-zinc-400 text-sm">Pick <strong>up to 3 vibes</strong> — AI finds your weather-perfect destination right now.</p>
            </div>

            <AnimatePresence mode="wait">
                {step === 'pick' ? (
                    <motion.div key="pick" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-5">
                            {VIBES.map(v => {
                                const isSelected = selected.includes(v.tag);
                                const isDisabled = !isSelected && selected.length >= 3;
                                return (
                                    <motion.button key={v.tag}
                                        whileHover={!isDisabled ? { scale: 1.04 } : {}}
                                        whileTap={!isDisabled ? { scale: 0.96 } : {}}
                                        onClick={() => !isDisabled && toggle(v.tag)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                                            isSelected
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                                                : isDisabled
                                                    ? 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 opacity-40 cursor-not-allowed'
                                                    : 'border-zinc-100 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-500 cursor-pointer'
                                        }`}>
                                        <span className="text-3xl">{v.emoji}</span>
                                        <span className={`text-xs font-semibold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                            {v.label}
                                        </span>
                                        {isSelected && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-[8px]">✓</span>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Selection indicator */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {[0, 1, 2].map(i => (
                                    <div key={i} className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${selected[i] ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/20' : 'border-dashed border-zinc-300 dark:border-zinc-700'}`}>
                                        {selected[i] && <span className="text-lg">{VIBES.find(v => v.tag === selected[i])?.emoji}</span>}
                                    </div>
                                ))}
                                <span className="text-xs text-zinc-400 ml-1">{selected.length}/3 vibes picked</span>
                            </div>
                            {selected.length > 0 && (
                                <button onClick={() => setSelected([])} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                                    Clear all
                                </button>
                            )}
                        </div>

                        <button onClick={findMatches} disabled={selected.length === 0}
                            className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                                selected.length > 0
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            }`}>
                            ✨ Find My Perfect Destination
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                        className="space-y-3">
                        {/* Selected vibes summary */}
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-zinc-500">Your vibes:</span>
                            {selected.map(tag => (
                                <span key={tag} className="flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full px-2 py-0.5">
                                    {VIBES.find(v => v.tag === tag)?.emoji} {VIBES.find(v => v.tag === tag)?.label}
                                </span>
                            ))}
                        </div>

                        {/* Hero card — best match */}
                        {topMatch && (
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                className={`rounded-2xl overflow-hidden border-2 shadow-lg ${topMatch.warning ? 'border-red-400/50' : 'border-emerald-500/60 shadow-emerald-500/10'}`}>
                                <div className="relative h-40 cursor-pointer group" onClick={() => onSelect(topMatch.id, topMatch.name, vibeToPurpose(topMatch.matchedVibes))}>
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${resolveImgSrc(topMatch.img || '', 700)})` }} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                    {/* Best match badge */}
                                    {!topMatch.warning && (
                                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">
                                            🏆 Best Match
                                        </div>
                                    )}

                                    {/* Weather badge */}
                                    {topMatch.warning ? (
                                        <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                            ⚠️ {topMatch.warning.reason}
                                        </div>
                                    ) : topMatch.ideal ? (
                                        <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                            🌤️ {topMatch.ideal.reason}
                                        </div>
                                    ) : null}

                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <div className="text-white font-bold text-2xl mb-2">{topMatch.emoji} {topMatch.name}</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {topMatch.matchedVibes.map(tag => (
                                                <span key={tag} className="text-[10px] bg-white/20 backdrop-blur text-white rounded-full px-2 py-0.5">
                                                    {VIBES.find(v => v.tag === tag)?.emoji} {VIBES.find(v => v.tag === tag)?.label}
                                                </span>
                                            ))}
                                            <span className="text-[10px] bg-white/10 text-white/70 rounded-full px-2 py-0.5">
                                                {topMatch.matchedVibes.length}/{selected.length} vibes matched
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => onSelect(topMatch.id, topMatch.name, vibeToPurpose(topMatch.matchedVibes))}
                                    className={`w-full text-white font-bold text-sm py-3 flex items-center justify-center gap-2 transition-colors ${topMatch.warning ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                    {topMatch.warning ? '⚠️ ' : ''}Select {topMatch.name} &amp; Continue →
                                </button>
                            </motion.div>
                        )}

                        {/* Remaining 3 as smaller photo cards */}
                        <div className="grid grid-cols-3 gap-3">
                            {restMatches.map((dest, i) => (
                                <motion.div key={dest.id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (i + 1) * 0.07 }}
                                    className={`rounded-2xl overflow-hidden border-2 transition-all ${dest.warning ? 'border-red-400/30' : 'border-transparent hover:border-zinc-500'}`}>
                                    <div className="relative h-24 cursor-pointer group" onClick={() => onSelect(dest.id, dest.name, vibeToPurpose(dest.matchedVibes))}>
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                            style={{ backgroundImage: `url(${resolveImgSrc(dest.img || '', 400)})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                                        {/* Weather badge */}
                                        {dest.warning ? (
                                            <div className="absolute top-1.5 left-1.5 bg-red-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                                                ⚠️ Avoid
                                            </div>
                                        ) : dest.ideal ? (
                                            <div className="absolute top-1.5 left-1.5 bg-emerald-500/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                                                🌤️ Ideal
                                            </div>
                                        ) : null}

                                        {/* Vibe count */}
                                        <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                                            {dest.matchedVibes.length}/{selected.length}
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                            <div className="text-white font-bold text-sm leading-tight">{dest.name}</div>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {dest.matchedVibes.slice(0, 2).map(tag => (
                                                    <span key={tag} className="text-[8px] text-white/70">
                                                        {VIBES.find(v => v.tag === tag)?.emoji}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => onSelect(dest.id, dest.name, vibeToPurpose(dest.matchedVibes))}
                                        className={`w-full text-white text-[10px] font-bold py-2 flex items-center justify-center gap-1 transition-colors ${dest.warning ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700'}`}>
                                        Select →
                                    </button>
                                </motion.div>
                            ))}
                        </div>

                        <button onClick={() => { setStep('pick'); setMatches([]); }}
                            className="w-full py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                            ← Try different vibes
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
