'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

// Curated travel YouTube videos per destination
const DEST_VIDEOS: Record<string, { id: string; title: string; channel: string }> = {
    kerala: { id: 'qGDMlqJG3To', title: 'Kerala Travel Guide — Backwaters, Hills & Beaches', channel: 'Wander with Josh' },
    jaipur: { id: 'sGFEhSjbPJw', title: 'Jaipur in 48 Hours — Pink City Guide', channel: 'Travel Monks' },
    varanasi: { id: '0h09g8Zp_tM', title: 'Varanasi — The Eternal City of India', channel: 'Lost LeBlanc' },
    goa: { id: 'dpIAJNtdJ3I', title: 'Goa Travel Guide — Best Beaches & Food', channel: 'Nomadic Boys' },
    manali: { id: 'gbsGiC6-aF0', title: 'Manali Complete Guide — Himalayas & Rohtang', channel: 'Traveller\'s Mind' },
    udaipur: { id: 'iJWlAPVMDKU', title: 'Udaipur — City of Lakes & Palaces', channel: 'Karan Gupta Vlogs' },
    agra: { id: 'Zso6Z2Yx6QA', title: 'Taj Mahal & Agra — Complete Day Guide', channel: 'Solo Traveler India' },
    rishikesh: { id: 'sGFEhSjbPJw', title: 'Rishikesh — Yoga, Rafting & Mountains', channel: 'Mindful Wanderer' },
};

const DEFAULT_VIDEO = { id: 'qGDMlqJG3To', title: 'India Travel Highlights 2024', channel: 'NaviiGo Picks' };

interface VideoCardProps {
    destId: string;
    destName: string;
}

export default function VideoCard({ destId, destName }: VideoCardProps) {
    const [playing, setPlaying] = useState(false);
    const video = DEST_VIDEOS[destId] ?? DEFAULT_VIDEO;
    const thumbUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-red-500 text-lg">▶️</span>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Watch: {destName} Guide</h3>
                <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wider">YouTube</span>
            </div>

            <div className="relative" style={{ paddingBottom: '56.25%' }}>
                {playing ? (
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <motion.button
                        onClick={() => setPlaying(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="absolute inset-0 w-full h-full group"
                    >
                        {/* Thumbnail */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${thumbUrl})` }}
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-16 h-16 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 transition-colors"
                            >
                                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-white ml-1" />
                            </motion.div>
                        </div>
                        {/* Title overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white font-semibold text-sm line-clamp-1">{video.title}</p>
                            <p className="text-white/60 text-xs mt-0.5">{video.channel}</p>
                        </div>
                    </motion.button>
                )}
            </div>
        </div>
    );
}
