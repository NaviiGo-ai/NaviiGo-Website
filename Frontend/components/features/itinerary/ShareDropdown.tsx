'use client';
import { useState } from 'react';

import { downloadItineraryAsPDF } from '@/lib/pdfGenerator';
import { formatItineraryForWhatsApp } from '@/lib/textExporter';

interface ShareDropdownProps {
    onCopyLink: () => void;
    destName: string;
    isSharing: boolean;
    collaborators: number;
    planData?: any;
}

export default function ShareDropdown({ onCopyLink, destName, isSharing, collaborators, planData }: ShareDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setIsOpen(false)}
                className="flex px-4 py-1.5 rounded-full border border-muted-200 dark:border-muted-700 text-xs font-semibold items-center gap-1.5 hover:bg-muted-50 dark:hover:bg-muted-800 transition-colors"
            >
                {isSharing ? '⏳' : '🔗'} Share
                {collaborators > 1 && <span className="bg-jungle-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{collaborators}</span>}
            </button>

            {isOpen && (
                <div
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setIsOpen(false)}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden text-muted-700 dark:text-muted-300"
                >
                    <button onClick={onCopyLink} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                        👥 Invite Friends (Copy Link)
                    </button>
                    <button onClick={() => {
                        const text = formatItineraryForWhatsApp(destName, planData);
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                        📱 WhatsApp
                    </button>
                    <button onClick={() => {
                        const subject = `My ${destName} Itinerary — NaviiGo`;
                        const text = formatItineraryForWhatsApp(destName, planData);
                        const body = `Hi!\n\nI've planned a trip to ${destName} using NaviiGo.\n\n${text}\n\nView full itinerary here:\n${window.location.href}`;
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                        ✉️ Gmail
                    </button>
                    <button onClick={() => {
                        if (planData) {
                            downloadItineraryAsPDF(destName, planData);
                        } else {
                            window.print();
                        }
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                        📄 Download PDF Brochure
                    </button>
                </div>
            )}
        </div>
    );
}
