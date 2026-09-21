'use client';
import { useState } from 'react';

// Curated verified travel videos
const DEST_VIDEOS: Record<string, { id: string; title: string; channel: string }> = {
    kerala: { id: 'k7Kz_w4u0uU', title: 'Kerala — God’s Own Country Field Guide', channel: 'Incredible India' },
    rajasthan: { id: 'd6b05w_C08w', title: 'Rajasthan — The Land of Kings', channel: 'Incredible India' },
};

interface VideoCardProps {
    destId: string;
    destName: string;
}

export default function VideoCard({ destId, destName }: VideoCardProps) {
    const [playing, setPlaying] = useState(false);
    const [failed, setFailed] = useState(false);

    const normId = destId ? destId.toLowerCase().trim() : '';
    const video = DEST_VIDEOS[normId];

    // If no curated video is mapped, or if thumbnail/stream failed, hide the section entirely
    if (!video || failed) {
        return null;
    }

    const thumbUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;

    return (
        <div className="bg-paper-light rounded-2xl border border-[#EADFD4] overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EADFD4]">
                <span className="text-brand-primary text-xs font-mono">▶</span>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-naviigo-brown">
                    Field Guide: {destName}
                </h3>
                <span className="ml-auto text-[10px] font-mono font-bold bg-paper-warm text-naviigo-brown/60 px-2 py-0.5 rounded uppercase tracking-wider border border-[#EADFD4]">
                    Curated
                </span>
            </div>

            <div className="relative aspect-video bg-paper-warm">
                {playing ? (
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        className="absolute inset-0 w-full h-full group text-left cursor-pointer overflow-hidden"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={thumbUrl}
                            alt={video.title}
                            onError={() => setFailed(true)}
                            onLoad={(e) => {
                                // YouTube returns a 120px fallback placeholder for deleted/invalid videos
                                if (e.currentTarget.naturalWidth <= 120) {
                                    setFailed(true);
                                }
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-white ml-1" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                            <p className="font-display font-bold text-sm uppercase tracking-tight line-clamp-1">{video.title}</p>
                            <p className="font-mono text-[10px] text-white/70 uppercase mt-0.5">{video.channel}</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
