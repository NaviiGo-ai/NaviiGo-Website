'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface BuildFromLinkProps {
    onExtracted: (destId: string, destName: string, purpose: string, days?: number) => void;
}

export default function BuildFromLink({ onExtracted }: BuildFromLinkProps) {
    const [url, setUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [extracted, setExtracted] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'link' | 'caption'>('link');

    const handleAnalyze = async () => {
        if (!url.trim() && !caption.trim()) {
            setError('Please paste a link or caption text first.');
            return;
        }
        setLoading(true);
        setError('');
        setExtracted(null);

        try {
            const res = await fetch('/api/itinerary/from-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: activeTab === 'link' ? url.trim() : undefined,
                    captionText: activeTab === 'caption' ? caption.trim() : (caption.trim() || undefined),
                }),
            });
            const data = await res.json();
            if (data.success) {
                setExtracted(data.extracted);
            } else {
                setError(data.error || 'Could not extract travel info from this content.');
            }
        } catch {
            setError('Failed to analyze. Check your connection and try again.');
        }
        setLoading(false);
    };

    const handleUse = () => {
        if (!extracted?.destName) return;
        const destId = extracted.destName.toLowerCase().replace(/\s+/g, '-');
        onExtracted(destId, extracted.destName, extracted.purpose || 'leisure', extracted.days);
    };

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Instagram-style gradient header */}
            <div className="relative overflow-hidden rounded-2xl p-5"
                style={{ background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' }}>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">📸</span>
                        <div>
                            <h3 className="text-white font-bold text-lg">Build from Reel or Post</h3>
                            <p className="text-white/80 text-xs">Paste an Instagram/YouTube link or travel caption — AI extracts the destination & vibe</p>
                        </div>
                    </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-8 w-20 h-20 bg-white/10 rounded-full translate-y-1/2" />
            </div>

            {/* Tab switcher */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl p-1">
                {(['link', 'caption'] as const).map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setError(''); setExtracted(null); }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab
                            ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                        {tab === 'link' ? '🔗 Paste Link' : '✍️ Paste Caption'}
                    </button>
                ))}
            </div>

            {/* Input area */}
            <AnimatePresence mode="wait">
                {activeTab === 'link' ? (
                    <motion.div key="link" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="space-y-3">
                        <input
                            type="url"
                            value={url}
                            onChange={e => { setUrl(e.target.value); setError(''); }}
                            placeholder="https://www.instagram.com/reel/..."
                            className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                        />
                        <div className="text-xs text-zinc-400 flex items-start gap-2 px-1">
                            <span>💡</span>
                            <span>Works with Instagram Reels, TikTok, YouTube Shorts, travel blogs — any public travel content URL. Add caption text below for best results.</span>
                        </div>
                        <textarea
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            placeholder="Optional: paste the caption or description from the reel..."
                            rows={3}
                            className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none"
                        />
                    </motion.div>
                ) : (
                    <motion.div key="caption" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <textarea
                            value={caption}
                            onChange={e => { setCaption(e.target.value); setError(''); }}
                            placeholder="Paste the caption, hashtags, or description from a travel reel...

Example: 5 days in Ladakh 🏔️ Hit Pangong Tso, Nubra Valley, stayed in camps 🏕️ Total budget ₹25,000 #Ladakh #TravelIndia #Adventure"
                            rows={6}
                            className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-4 text-sm font-medium text-zinc-900 dark:text-white placeholder-zinc-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-none"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    <span>⚠️</span><span>{error}</span>
                </motion.div>
            )}

            {/* Extracted Result */}
            <AnimatePresence>
                {extracted && (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <span className="text-lg">✨</span>
                            <span className="font-bold text-sm">AI extracted this from your content:</span>
                            <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${extracted.confidence === 'high' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
                                {extracted.confidence} confidence
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-3">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">📍 Destination</div>
                                <div className="font-bold text-zinc-900 dark:text-white">{extracted.destName}</div>
                            </div>
                            <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-3">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">🎯 Vibe</div>
                                <div className="font-bold text-zinc-900 dark:text-white capitalize">{extracted.vibe || extracted.purpose || 'Leisure'}</div>
                            </div>
                            {extracted.days && (
                                <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-3">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">📅 Duration</div>
                                    <div className="font-bold text-zinc-900 dark:text-white">{extracted.days} Days</div>
                                </div>
                            )}
                            {extracted.summary && (
                                <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-3 col-span-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">💬 Summary</div>
                                    <div className="text-sm text-zinc-700 dark:text-zinc-300">{extracted.summary}</div>
                                </div>
                            )}
                        </div>

                        {extracted.places?.length > 0 && (
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">🏛️ Places Mentioned</div>
                                <div className="flex flex-wrap gap-2">
                                    {extracted.places.map((p: string) => (
                                        <span key={p} className="text-xs bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1 font-medium">{p}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {extracted.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {extracted.tags.map((t: string) => (
                                    <span key={t} className="text-xs bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full px-3 py-1 font-semibold">#{t}</span>
                                ))}
                            </div>
                        )}

                        <button onClick={handleUse}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                            <span>✨</span> Build Itinerary for {extracted.destName}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analyze button */}
            {!extracted && (
                <button onClick={handleAnalyze} disabled={loading || (!url.trim() && !caption.trim())}
                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 ${loading || (!url.trim() && !caption.trim())
                        ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 active:scale-[0.98]'}`}>
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Analyzing your content…</span>
                        </>
                    ) : (
                        <>
                            <span>🔍</span>
                            <span>Extract Travel Info</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
