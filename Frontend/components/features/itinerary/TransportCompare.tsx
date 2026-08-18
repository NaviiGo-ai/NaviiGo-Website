'use client';

import { getTransportOptions, formatDistance, type TransportOption } from '@/lib/transportLinks';
import { motion } from 'framer-motion';
import { Navigation, ExternalLink } from 'lucide-react';

interface TransportCompareProps {
    fromLat: number;
    fromLng: number;
    toLat: number;
    toLng: number;
    fromName: string;
    toName: string;
}

export default function TransportCompare({ fromLat, fromLng, toLat, toLng, fromName, toName }: TransportCompareProps) {
    const options = getTransportOptions(fromLat, fromLng, toLat, toLng, fromName, toName);

    // Don't render for very short distances
    if (options.length === 0) return null;

    const distance = formatDistance(fromLat, fromLng, toLat, toLng);

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="my-2 mx-4"
        >
            <div className="flex items-center gap-2 py-3 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-white/5">
                {/* Distance badge */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                    <Navigation className="w-3.5 h-3.5 text-orange-500" />
                    <span className="font-medium">{distance}</span>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

                {/* Transport options */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                    {options.map((opt, i) => (
                        <a
                            key={i}
                            href={opt.deepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all hover:scale-105 hover:shadow-md"
                            style={{
                                background: `${opt.color}10`,
                                color: opt.color === '#000000' ? undefined : opt.color,
                            }}
                        >
                            <span>{opt.icon}</span>
                            <span className="text-slate-700 dark:text-slate-300">{opt.provider}</span>
                            <span className="font-bold">{opt.estimatedFare}</span>
                            <ExternalLink className="w-3 h-3 opacity-40" />
                        </a>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
