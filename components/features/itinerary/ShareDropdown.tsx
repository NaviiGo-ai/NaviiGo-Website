'use client';
import { useState } from 'react';

interface ShareDropdownProps {
    onCopyLink: () => void;
    destName: string;
    isSharing: boolean;
    collaborators: number;
}

export default function ShareDropdown({ onCopyLink, destName, isSharing, collaborators }: ShareDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setIsOpen(false)}
                className="flex px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
                {isSharing ? '⏳' : '🔗'} Share
                {collaborators > 1 && <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{collaborators}</span>}
            </button>

            {isOpen && (
                <div
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setIsOpen(false)}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden text-zinc-700 dark:text-zinc-300"
                >
                    <button onClick={onCopyLink} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                        👥 Invite Friends (Copy Link)
                    </button>
                    <button onClick={() => {
                        const text = `Check out my NaviiGo itinerary for ${destName}! 🗺️ ${window.location.href}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                        📱 WhatsApp
                    </button>
                    <button onClick={() => {
                        const subject = `My ${destName} Itinerary — NaviiGo`;
                        const body = `Hi!\n\nI've planned a trip to ${destName} using NaviiGo. Check it out:\n${window.location.href}`;
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                        ✉️ Gmail
                    </button>
                    <button onClick={() => window.print()} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2">
                        📄 Print to PDF
                    </button>
                </div>
            )}
        </div>
    );
}
