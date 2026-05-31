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
    // 1. Get current stats
    const currentStats = await getPassportStats(uid);
    const stats: PassportStats = currentStats
        ? {
            ...currentStats,
            lastTripDate: (currentStats.lastTripDate as any)?.toDate?.()?.toISOString?.() || currentStats.lastTripDate || null,
        } as any
        : {
            totalStamps: 0,
            totalXP: 0,
            level: 0,
            streak: 0,
            lastTripDate: null,
            achievements: [],
            statesVisited: [],
            citiesVisited: [],
            categoryCounts: {},
            totalActivitiesCompleted: 0,
        };

    // 2. Check for return visit
    const existingStamps = await getPassportStamps(uid);
    const isReturnVisit = existingStamps.some((s: any) =>
        (s.location || '').toLowerCase() === checkpoint.destName.toLowerCase()
    );

    // 3. Calculate streak
    let hasStreak = false;
    if (stats.lastTripDate) {
        const lastTrip = new Date(stats.lastTripDate as string);
        const now = new Date();
        const daysDiff = (now.getTime() - lastTrip.getTime()) / 86400000;
        hasStreak = daysDiff <= 14;
    }

    // 4. Calculate XP
    const xpBreakdown = calculateTripXP(checkpoint, hasStreak, isReturnVisit);

    // 5. Build stamp
    const activitiesList = checkpoint.completedSet.map(k => k.split(':').slice(1).join(':'));
    const stamp: PassportStamp = {
        name: checkpoint.destName,
        location: checkpoint.destName,
        state: checkpoint.state,
        icon: getStampIcon(checkpoint.purpose),
        type: getStampType(checkpoint.purpose),
        xpEarned: xpBreakdown.total,
        visitedDate: new Date().toISOString(),
        activities: activitiesList.slice(0, 10), // cap at 10 for display
        verificationMethod: 'itinerary_complete',
    };

    // 6. Apply stamp to stats
    const previousLevel = stats.level;
    const newStats = applyStamp(stats, stamp);

    // Track total activities completed
    (newStats as any).totalActivitiesCompleted =
        ((stats as any).totalActivitiesCompleted || 0) + checkpoint.completedSet.length;

    // 7. Check new achievements
    const newAchievements = checkNewAchievements(newStats);
    for (const ach of newAchievements) {
        if (!newStats.achievements.includes(ach.id)) {
            newStats.achievements.push(ach.id);
            newStats.totalXP += ach.xpReward;
        }
    }

    // 8. Write to Firestore
    await addPassportStamp(uid, {
        ...stamp,
        visitedDate: new Date() as any,
    });
    await updatePassportStats(uid, newStats as any);

    return {
        stamp,
        stats: newStats,
        newAchievements,
        xpBreakdown,
        isReturnVisit,
        levelUp: newStats.level > previousLevel,
        previousLevel,
    };
}
