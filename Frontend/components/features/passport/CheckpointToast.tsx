'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';

interface ToastItem {
    id: number;
    activityName: string;
    xp: number;
}

let toastIdCounter = 0;

export function useCheckpointToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((activityName: string, xp: number = 25) => {
        const id = ++toastIdCounter;
        setToasts(prev => [...prev.slice(-3), { id, activityName, xp }]); // max 4 toasts
        
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.5, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {}

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2500);
    }, []);

    return { toasts, showToast };
}

interface CheckpointToastProps {
    toasts: ToastItem[];
}

export default function CheckpointToast({ toasts }: CheckpointToastProps) {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast, i) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 80, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 40, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="flex items-center gap-3 bg-muted-900/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl shadow-black/30 min-w-[220px]"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-500 flex items-center justify-center shadow-lg shadow-saffron-500/30">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{toast.activityName}</div>
                            <div className="text-[10px] text-saffron-400 font-semibold">+{toast.xp} Pending XP</div>
                        </div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                            className="text-jungle-green-400 text-lg"
                        >
                            ✓
                        </motion.div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
