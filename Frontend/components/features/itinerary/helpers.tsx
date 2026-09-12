'use client';
import { CROWD_DOT, WALK_COLOR, type CrowdLevel, type WalkLevel } from '@/app/itinerary/data';

export function genShareId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function Badge({ label, colorClass }: { label: string; colorClass: string }) {
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>{label}</span>;
}

export function CrowdDot({ level }: { level: CrowdLevel }) {
    return <span className={`inline-block w-2 h-2 rounded-full ${CROWD_DOT[level]}`} />;
}

export function StepBar({ step, total }: { step: number; total: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < step ? 'bg-saffron' : 'bg-muted/[0.2] dark:bg-muted/[0.6]'}`}
                    style={{ width: i < step ? 40 : 24 }} />
            ))}
        </div>
    );
}
