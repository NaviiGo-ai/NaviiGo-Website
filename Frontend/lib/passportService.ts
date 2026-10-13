// ─── Passport Service ─────────────────────────────────────────────────────────
// Converts completed trips into passport stamps and syncs to Firestore.

import {
    type PassportStats,
    type PassportStamp,
    calculateXP,
    applyStamp,
    checkNewAchievements,
    type Achievement,
} from './gamification';
import {
    addPassportStamp,
    updatePassportStats,
    getPassportStats,
    getPassportStamps,
} from './firestore';
import type { CheckpointState } from './useCheckpoints';

// ─── Icon & Type Mapping ─────────────────────────────────────────────────────

const PURPOSE_ICON: Record<string, string> = {
    spiritual: '🕉️',
    leisure: '🌴',
    adventure: '🏔️',
    cultural: '🏛️',
    honeymoon: '💑',
    celebrate: '🎉',
};

const PURPOSE_TYPE: Record<string, PassportStamp['type']> = {
    spiritual: 'Spiritual',
    leisure: 'Nature',
    adventure: 'Adventure',
    cultural: 'Heritage',
    honeymoon: 'Nature',
    celebrate: 'City',
};

export function getStampIcon(purpose: string): string {
    return PURPOSE_ICON[purpose] || '📍';
}

export function getStampType(purpose: string): PassportStamp['type'] {
    return PURPOSE_TYPE[purpose] || 'City';
}

// ─── XP Calculation ──────────────────────────────────────────────────────────

export interface XPBreakdown {
    base: number;
    activities: number;
    activityCount: number;
    dayBonuses: number;
    daysCompleted: number;
    streakBonus: number;
    returnVisitPenalty: number;
    total: number;
}

function calculateTripXP(
    checkpoint: CheckpointState,
    hasStreak: boolean,
    isReturnVisit: boolean
): XPBreakdown {
    const base = 100;
    const activityCount = checkpoint.completedSet.length;
    const activities = activityCount * 25;

    // Count completed days
    let daysCompleted = 0;
    const dayKeys = Object.keys(checkpoint.dayTotals).map(Number);
    for (const dayIdx of dayKeys) {
        const total = checkpoint.dayTotals[dayIdx];
        const completed = checkpoint.completedSet.filter(k =>
            k.startsWith(`${dayIdx}:`)
        ).length;
        if (completed >= total && total > 0) daysCompleted++;
    }
    const dayBonuses = daysCompleted * 100;

    const streakBonus = hasStreak ? 50 : 0;
    const subtotal = base + activities + dayBonuses + streakBonus;
    const returnVisitPenalty = isReturnVisit ? -Math.round(subtotal * 0.5) : 0;
    const total = subtotal + returnVisitPenalty;

    return {
        base,
        activities,
        activityCount,
        dayBonuses,
        daysCompleted,
        streakBonus,
        returnVisitPenalty,
        total: Math.max(50, total), // minimum 50 XP
    };
}

// ─── Main Award Function ─────────────────────────────────────────────────────

export interface AwardResult {
    stamp: PassportStamp;
    stats: PassportStats;
    newAchievements: Achievement[];
    xpBreakdown: XPBreakdown;
    isReturnVisit: boolean;
    levelUp: boolean;
    previousLevel: number;
}

export async function completeTripAndAwardStamp(
    uid: string,
    checkpoint: CheckpointState
): Promise<AwardResult> {
    // Manual checkpoints are traveller reports, not verified visits. This older
    // two-write award path is deliberately unavailable until a shared atomic,
    // itinerary/revision-bound completion contract is implemented.
    throw new Error('Completion awards are not available. Your journey remains saved in your Passport archive.');
}
