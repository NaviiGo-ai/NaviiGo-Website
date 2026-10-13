'use client';
import { useRef, useState } from 'react';
import { FileDown, Link2, Mail, MessageCircle, Unlink } from 'lucide-react';

import { downloadItineraryAsPDF } from '@/lib/pdfGenerator';
import { formatItineraryForWhatsApp } from '@/lib/textExporter';

interface ShareDropdownProps {
    onCopyLink: () => void;
    onUnshare?: () => void;
    destName: string;
    isSharing: boolean;
    collaborators: number;
    planData?: any;
    isShared?: boolean;
    canManageShare?: boolean;
    /** Relative or absolute public URL. Never infer a private owner URL. */
    shareUrl?: string | null;
}

export default function ShareDropdown({
    onCopyLink,
    onUnshare,
    destName,
    isSharing,
    collaborators,
    planData,
    isShared = false,
    canManageShare = true,
    shareUrl = null,
}: ShareDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const getPublicUrl = () => {
        if (!shareUrl) return null;
        return shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;
    };

    return (
        <div
            ref={wrapperRef}
            className="relative"
            onBlur={(event) => {
                // Do not close between the trigger and a menu item when a
                // keyboard user tabs into the menu.
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsOpen(false);
                }
            }}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-busy={isSharing}
                className="flex px-4 py-1.5 rounded-full border border-muted-200 dark:border-muted-700 text-xs font-semibold items-center gap-1.5 hover:bg-muted-50 dark:hover:bg-muted-800 transition-colors"
            >
                {isSharing ? 'Working…' : isShared ? 'Shared' : 'Share'}
                {collaborators > 1 && <span className="bg-jungle-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{collaborators}</span>}
            </button>

            {isOpen && (
                <div
                    role="menu"
                    aria-label={`${destName} sharing options`}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setIsOpen(false)}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-muted-900 border border-muted-200 dark:border-muted-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden text-muted-700 dark:text-muted-300"
                >
                    {canManageShare && (
                        <>
                            <button type="button" role="menuitem" onClick={onCopyLink} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                                <Link2 aria-hidden="true" className="w-4 h-4" /> {isShared ? 'Copy Public Link' : 'Create Public Link'}
                            </button>
                            {isShared && onUnshare && (
                                <button type="button" role="menuitem" onClick={onUnshare} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                                    <Unlink aria-hidden="true" className="w-4 h-4" /> Unshare itinerary
                                </button>
                            )}
                        </>
                    )}
                    <button type="button" role="menuitem" onClick={() => {
                        const text = formatItineraryForWhatsApp(destName, planData);
                        const publicUrl = getPublicUrl();
                        const suffix = publicUrl ? `\n\nView the public roadbook:\n${publicUrl}` : '';
                        window.open(`https://wa.me/?text=${encodeURIComponent(text + suffix)}`, '_blank', 'noopener,noreferrer');
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                        <MessageCircle aria-hidden="true" className="w-4 h-4" /> WhatsApp
                    </button>
                    <button type="button" role="menuitem" onClick={() => {
                        const subject = `My ${destName} Itinerary — NaviiGo`;
                        const text = formatItineraryForWhatsApp(destName, planData);
                        const publicUrl = getPublicUrl();
                        const linkMessage = publicUrl
                            ? `\n\nView the public roadbook here:\n${publicUrl}`
                            : '\n\nCreate a public link from NaviiGo before sending a viewable roadbook.';
                        const body = `Hi!\n\nI've planned a trip to ${destName} using NaviiGo.\n\n${text}${linkMessage}`;
                        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                        <Mail aria-hidden="true" className="w-4 h-4" /> Email
                    </button>
                    <button type="button" role="menuitem" onClick={() => {
                        if (planData) {
                            downloadItineraryAsPDF(destName, planData);
                        } else {
                            window.print();
                        }
                    }} className="w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-muted-50 dark:hover:bg-muted-800 flex items-center gap-2">
                        <FileDown aria-hidden="true" className="w-4 h-4" /> Download PDF
                    </button>
                </div>
            )}
        </div>
    );
}
