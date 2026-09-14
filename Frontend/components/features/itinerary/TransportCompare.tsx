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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="my-3 mx-2 sm:mx-6"
        >
            <div className="bg-paper-light border border-[#EADFD4] rounded-xl p-3 sm:p-4 shadow-sm">
                {/* Horizontal Route Motion Segment */}
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-naviigo-brown/70 mb-2.5">
                    <span className="font-bold text-naviigo-brown truncate max-w-[120px] sm:max-w-[180px]" title={fromName}>{fromName}</span>
                    <div className="flex-1 flex items-center gap-2">
                        <span className="flex-1 h-[1px] bg-brand-primary/40" />
                        <span className="font-bold text-brand-primary px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 shrink-0">
                            {distance}
                        </span>
                        <span className="flex-1 h-[1px] bg-brand-primary/40" />
                    </div>
                    <span className="font-bold text-naviigo-brown truncate max-w-[120px] sm:max-w-[180px]" title={toName}>{toName}</span>
                </div>

                {/* Available Transport Fares */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pt-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-naviigo-brown/50 shrink-0 mr-1">FARES:</span>
                    {options.map((opt, i) => (
                        <a
                            key={i}
                            href={opt.deepLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium whitespace-nowrap bg-paper-warm border border-[#EADFD4] text-naviigo-brown hover:border-brand-primary hover:text-brand-primary transition-all shadow-2xs hover:scale-[1.02]"
                        >
                            <span>{opt.icon}</span>
                            <span className="font-bold">{opt.provider}</span>
                            <span className="text-brand-primary font-bold">{opt.estimatedFare}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-40 ml-0.5" />
                        </a>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
