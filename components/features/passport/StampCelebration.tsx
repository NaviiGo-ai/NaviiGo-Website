'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Zap, Trophy, ArrowRight, Star } from 'lucide-react';
import type { AwardResult } from '@/lib/passportService';

interface StampCelebrationProps {
    result: AwardResult | null;
    onClose: () => void;
    onViewPassport: () => void;
}

// CSS-only confetti
function Confetti() {
    const colors = ['#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899', '#f97316'];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
    }));

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {pieces.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                    animate={{ y: '110vh', opacity: 0, rotate: p.rotation + 720 }}
                    transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
                    className="absolute"
                    style={{
                        width: p.size,
                        height: p.size * 0.6,
                        backgroundColor: p.color,
                        borderRadius: 2,
                    }}
                />
            ))}
        </div>
    );
}

export default function StampCelebration({ result, onClose, onViewPassport }: StampCelebrationProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (result) {
            setShow(true);
            const timer = setTimeout(() => { setShow(false); onClose(); }, 12000);
            return () => clearTimeout(timer);
        }
    }, [result, onClose]);

    if (!result) return null;

    const { stamp, stats, newAchievements, xpBreakdown, isReturnVisit, levelUp, previousLevel } = result;

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={() => { setShow(false); onClose(); }}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

                    {/* Confetti */}
                    <Confetti />

                    {/* Card */}
                    <motion.div
                        initial={{ scale: 0.5, y: 60, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="relative z-10 w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Glow effect */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none" />

                        {/* Stamp Animation */}
                        <div className="pt-10 pb-4 flex flex-col items-center relative">
                            {isReturnVisit && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mb-3 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30"
                                >
                                    🔄 Return Visit
                                </motion.div>
                            )}

                            <motion.div
                                initial={{ scale: 3, rotate: -30, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.2 }}
                                className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-2xl shadow-orange-500/40 border-4 border-orange-300/30"
                            >
                                <span className="text-5xl">{stamp.icon}</span>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-4 text-2xl font-bold text-white"
                            >
                                {stamp.name}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-sm text-zinc-400"
                            >
                                {stamp.state} · {stamp.type}
                            </motion.p>
                        </div>

                        {/* XP Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="mx-6 mb-4 bg-white/5 rounded-2xl border border-white/10 p-4"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-sm font-bold text-white">XP Earned</span>
                                <span className="ml-auto text-lg font-black text-amber-400">+{xpBreakdown.total}</span>
                            </div>
                            <div className="space-y-1.5 text-xs text-zinc-400">
                                <div className="flex justify-between">
                                    <span>Base completion</span><span className="text-zinc-300">+{xpBreakdown.base}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{xpBreakdown.activityCount} activities × 25</span><span className="text-zinc-300">+{xpBreakdown.activities}</span>
                                </div>
                                {xpBreakdown.daysCompleted > 0 && (
                                    <div className="flex justify-between">
                                        <span>{xpBreakdown.daysCompleted} day{xpBreakdown.daysCompleted > 1 ? 's' : ''} completed × 100</span><span className="text-zinc-300">+{xpBreakdown.dayBonuses}</span>
                                    </div>
                                )}
                                {xpBreakdown.streakBonus > 0 && (
                                    <div className="flex justify-between">
                                        <span>🔥 Streak bonus</span><span className="text-emerald-400">+{xpBreakdown.streakBonus}</span>
                                    </div>
                                )}
                                {xpBreakdown.returnVisitPenalty < 0 && (
                                    <div className="flex justify-between">
                                        <span>Return visit</span><span className="text-red-400">{xpBreakdown.returnVisitPenalty}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Level Up */}
                        {levelUp && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, type: 'spring' }}
                                className="mx-6 mb-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl border border-indigo-500/30 p-4 text-center"
                            >
                                <Star className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                                <div className="text-white font-bold">Level Up!</div>
                                <div className="text-xs text-indigo-300">Level {previousLevel} → Level {stats.level}</div>
                            </motion.div>
                        )}

                        {/* New Achievements */}
                        {newAchievements.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                                className="mx-6 mb-4"
                            >
                                <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Achievements Unlocked</div>
                                {newAchievements.map(ach => (
                                    <div key={ach.id} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-2">
                                        <span className="text-xl">{ach.emoji}</span>
                                        <div>
                                            <div className="text-sm font-bold text-white">{ach.name}</div>
                                            <div className="text-[10px] text-amber-400">+{ach.xpReward} XP</div>
                                        </div>
                                        <Trophy className="w-4 h-4 text-amber-400 ml-auto" />
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Actions */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => { setShow(false); onClose(); }}
                                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-zinc-300 hover:bg-white/10 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => { setShow(false); onViewPassport(); }}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2"
                            >
                                View Passport <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
