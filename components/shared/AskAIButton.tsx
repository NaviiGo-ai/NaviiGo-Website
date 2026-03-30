'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AskAIButton() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Floating button */}
            <motion.button
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl shadow-emerald-600/30 hover:shadow-emerald-500/50 hover:bg-emerald-500 transition-all duration-300 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <span className="relative flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
                    <span className="text-base">✨</span>
                </span>
                <span className="font-semibold text-sm tracking-wide">Ask AI</span>
            </motion.button>

            {/* Chat panel */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                            onClick={() => setOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-20 right-6 z-50 w-[360px] max-h-[520px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-white/10 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-white/5">
                                <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                                    <span className="text-lg">🤖</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">NaviiGo AI</h3>
                                    <p className="text-[11px] text-emerald-500 font-medium">Online • Ready to help</p>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="w-7 h-7 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 flex items-center justify-center text-zinc-400 text-sm transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Chat body */}
                            <div className="flex-1 p-5 overflow-y-auto space-y-4">
                                {/* AI greeting */}
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs">✨</span>
                                    </div>
                                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                        Namaste! 🙏 I&apos;m your NaviiGo AI travel assistant. Ask me about:
                                        <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                                            <li>• Best time to visit a destination</li>
                                            <li>• Temple darshan timings</li>
                                            <li>• Budget-friendly travel tips</li>
                                            <li>• Hidden gems & local food</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Quick prompts */}
                                <div className="flex flex-wrap gap-2">
                                    {['Best temples in South India?', 'Budget trip to Varanasi?', 'Weekend getaway ideas'].map((q) => (
                                        <button
                                            key={q}
                                            className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 rounded-full px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Input */}
                            <div className="px-4 py-3 border-t border-zinc-100 dark:border-white/5">
                                <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl px-4 py-2.5">
                                    <input
                                        type="text"
                                        placeholder="Ask anything about your trip…"
                                        className="flex-1 bg-transparent text-sm outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400"
                                    />
                                    <button className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-colors flex-shrink-0">
                                        <span className="text-sm">↑</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
