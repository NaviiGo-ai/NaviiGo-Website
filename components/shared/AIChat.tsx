'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayPlan } from '@/app/itinerary/data';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface AIChatProps {
    currentPlans: DayPlan[];
    onPlanUpdate: (updater: (prev: DayPlan[]) => DayPlan[]) => void;
}

export default function AIChat({ currentPlans, onPlanUpdate }: AIChatProps) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', content: "Hi! I'm your NaviiGo AI assistant. Tell me how you'd like to change your itinerary — for example: *\"Remove the last activity from Day 1\"*, *\"Make Day 2 more relaxed\"*, or *\"Add a morning yoga session.\"*" },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: text }]);
        setLoading(true);

        try {
            const context = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, context, currentPlans }),
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);

            // Apply action if the AI returned one
            if (data.action) {
                applyAction(data.action);
            }
        } catch {
            setMessages(prev => [...prev, { role: 'ai', content: 'Something went wrong. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, messages, currentPlans]);

    const applyAction = (action: { type: string; payload: any }) => {
        const { type, payload } = action;
        onPlanUpdate(prev => {
            const copy = JSON.parse(JSON.stringify(prev)) as DayPlan[];
            if (type === 'removeActivity') {
                copy[payload.dayIndex]?.activities.splice(payload.activityIndex, 1);
            } else if (type === 'addActivity') {
                copy[payload.dayIndex]?.activities.push(payload.activity);
            } else if (type === 'reorderDay') {
                const acts = copy[payload.dayIndex]?.activities;
                if (acts) {
                    const [moved] = acts.splice(payload.fromIndex, 1);
                    acts.splice(payload.toIndex, 0, moved);
                }
            } else if (type === 'replaceActivity') {
                if (copy[payload.dayIndex]) {
                    copy[payload.dayIndex].activities[payload.activityIndex] = {
                        ...copy[payload.dayIndex].activities[payload.activityIndex],
                        ...payload.activity,
                    };
                }
            }
            return copy;
        });
    };

    return (
        <>
            {/* Floating button */}
            <motion.button
                onClick={() => setOpen(o => !o)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-3 rounded-2xl shadow-xl shadow-indigo-500/30 font-bold text-sm"
            >
                <span className="text-lg">{open ? '✕' : '✨'}</span>
                {open ? 'Close' : 'AI Assistant'}
            </motion.button>

            {/* Chat drawer */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed bottom-20 right-6 z-50 w-[360px] max-h-[520px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-700 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-lg">✨</div>
                            <div>
                                <div className="text-white font-bold text-sm">NaviiGo AI</div>
                                <div className="text-white/70 text-[11px]">Powered by Gemini</div>
                            </div>
                            <div className="ml-auto flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-white/70 text-[11px]">Online</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-md'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick prompts */}
                        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
                            {['Optimize Day 1', 'Make it relaxed', 'Add breakfast spot', 'Remove last activity'].map(q => (
                                <button key={q} onClick={() => setInput(q)}
                                    className="text-[11px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Ask me to edit your itinerary…"
                                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || loading}
                                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors"
                            >
                                <span className="text-sm">→</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
