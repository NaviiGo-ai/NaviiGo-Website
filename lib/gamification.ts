// ─── Gamification Engine ──────────────────────────────────────────────────────
// XP system, levels, achievements, and streak tracking for Digital Passport.

export interface Achievement {
    id: string;
    name: string;
    emoji: string;
    description: string;
    category: 'travel' | 'social' | 'mastery' | 'special';
    requirement: (stats: PassportStats) => boolean;
    xpReward: number;
}

export interface PassportStats {
    totalStamps: number;
    totalXP: number;
    level: number;
    streak: number;
    lastTripDate: string | null;
    achievements: string[];
    statesVisited: string[];
    citiesVisited: string[];
    categoryCounts: Record<string, number>; // Spiritual: 3, Heritage: 5, etc.
}

export interface PassportStamp {
    id?: string;
    name: string;
    location: string;
    state: string;
    icon: string;
    type: 'Spiritual' | 'Heritage' | 'Adventure' | 'Nature' | 'Beach' | 'City';
    xpEarned: number;
    visitedDate: string;
    activities: string[];
    verificationMethod: 'itinerary_complete' | 'manual' | 'gps';
    itineraryId?: string;
}

// ─── XP & Level System ───────────────────────────────────────────────────────

const BASE_XP = 100;
const XP_PER_ACTIVITY = 25;
const STREAK_BONUS_XP = 50;

export function calculateXP(activitiesCompleted: number, hasStreak: boolean): number {
    return BASE_XP + (activitiesCompleted * XP_PER_ACTIVITY) + (hasStreak ? STREAK_BONUS_XP : 0);
}

export function calculateLevel(totalXP: number): number {
    return Math.floor(Math.sqrt(totalXP / 100));
}

export function xpForNextLevel(currentLevel: number): number {
    return ((currentLevel + 1) ** 2) * 100;
}

export function xpProgress(totalXP: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
    const level = calculateLevel(totalXP);
    const currentLevelXP = (level ** 2) * 100;
    const nextLevelXP = xpForNextLevel(level);
    const progress = Math.round(((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);
    return { level, currentXP: totalXP - currentLevelXP, nextLevelXP: nextLevelXP - currentLevelXP, progress };
}

// ─── Level Titles ────────────────────────────────────────────────────────────

export function getLevelTitle(level: number): string {
    if (level < 2) return 'Novice Traveler';
    if (level < 4) return 'Explorer';
    if (level < 6) return 'Adventurer';
    if (level < 8) return 'Seasoned Traveler';
    if (level < 10) return 'Globetrotter';
    if (level < 15) return 'Travel Master';
    if (level < 20) return 'Wanderlust Legend';
    return 'Travel God 🏆';
}

// ─── Achievements ────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
    // Travel milestones
    { id: 'first_trip', name: 'First Steps', emoji: '👣', description: 'Complete your first trip', category: 'travel', requirement: s => s.totalStamps >= 1, xpReward: 50 },
    { id: 'five_trips', name: 'Frequent Flyer', emoji: '✈️', description: 'Complete 5 trips', category: 'travel', requirement: s => s.totalStamps >= 5, xpReward: 200 },
    { id: 'ten_trips', name: 'Road Warrior', emoji: '🗺️', description: 'Complete 10 trips', category: 'travel', requirement: s => s.totalStamps >= 10, xpReward: 500 },
    { id: 'twenty_trips', name: 'Wanderlust', emoji: '🌍', description: 'Complete 20 trips', category: 'mastery', requirement: s => s.totalStamps >= 20, xpReward: 1000 },

    // Category-specific
    { id: 'beach_bum', name: 'Beach Bum', emoji: '🏖️', description: 'Visit 3 beach destinations', category: 'travel', requirement: s => (s.categoryCounts['Beach'] || 0) >= 3, xpReward: 200 },
    { id: 'mountain_goat', name: 'Mountain Goat', emoji: '🏔️', description: 'Visit 3 mountain destinations', category: 'travel', requirement: s => (s.categoryCounts['Adventure'] || 0) + (s.categoryCounts['Nature'] || 0) >= 3, xpReward: 200 },
    { id: 'pilgrim', name: 'Pilgrim', emoji: '🕉️', description: 'Visit 5 spiritual sites', category: 'travel', requirement: s => (s.categoryCounts['Spiritual'] || 0) >= 5, xpReward: 300 },
    { id: 'history_buff', name: 'History Buff', emoji: '🏛️', description: 'Visit 5 heritage sites', category: 'travel', requirement: s => (s.categoryCounts['Heritage'] || 0) >= 5, xpReward: 300 },

    // States coverage
    { id: 'five_states', name: 'Interstate Explorer', emoji: '📍', description: 'Visit 5 different states', category: 'travel', requirement: s => s.statesVisited.length >= 5, xpReward: 250 },
    { id: 'ten_states', name: 'Pan-India Traveler', emoji: '🇮🇳', description: 'Visit 10 different states', category: 'mastery', requirement: s => s.statesVisited.length >= 10, xpReward: 500 },
    { id: 'fifteen_states', name: 'All-India Champion', emoji: '🏆', description: 'Visit 15+ different states', category: 'mastery', requirement: s => s.statesVisited.length >= 15, xpReward: 1000 },

    // Streaks
    { id: 'streak_3', name: 'Hot Streak', emoji: '🔥', description: '3-week travel streak', category: 'social', requirement: s => s.streak >= 3, xpReward: 150 },
    { id: 'streak_7', name: 'On Fire', emoji: '🔥🔥', description: '7-week travel streak', category: 'social', requirement: s => s.streak >= 7, xpReward: 400 },

    // Levels
    { id: 'level_5', name: 'Rising Star', emoji: '⭐', description: 'Reach Level 5', category: 'mastery', requirement: s => s.level >= 5, xpReward: 200 },
    { id: 'level_10', name: 'Power Traveler', emoji: '💫', description: 'Reach Level 10', category: 'mastery', requirement: s => s.level >= 10, xpReward: 500 },

    // Special
    { id: 'diversity', name: 'Cultural Mosaic', emoji: '🎭', description: 'Visit destinations in all categories', category: 'special', requirement: s => Object.keys(s.categoryCounts).length >= 5, xpReward: 500 },
    { id: 'north_south', name: 'North to South', emoji: '🧭', description: 'Visit both North & South India', category: 'special', requirement: s => {
        const northStates = ['Delhi', 'Rajasthan', 'Uttar Pradesh', 'Punjab', 'Himachal Pradesh', 'Uttarakhand', 'J&K', 'Ladakh'];
        const southStates = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Goa'];
        const hasNorth = s.statesVisited.some(st => northStates.includes(st));
        const hasSouth = s.statesVisited.some(st => southStates.includes(st));
        return hasNorth && hasSouth;
    }, xpReward: 300 },
];

/**
 * Check which new achievements should be awarded.
 */
export function checkNewAchievements(stats: PassportStats): Achievement[] {
    return ACHIEVEMENTS.filter(a => 
        a.requirement(stats) && !stats.achievements.includes(a.id)
    );
}

/**
 * Get default empty stats for new users.
 */
export function getDefaultStats(): PassportStats {
    return {
        totalStamps: 0,
        totalXP: 0,
        level: 0,
        streak: 0,
        lastTripDate: null,
        achievements: [],
        statesVisited: [],
        citiesVisited: [],
        categoryCounts: {},
    };
}

/**
 * Update stats when a new stamp is awarded.
 */
export function applyStamp(stats: PassportStats, stamp: PassportStamp): PassportStats {
    const updated = { ...stats };
    
    updated.totalStamps += 1;
    updated.totalXP += stamp.xpEarned;
    updated.level = calculateLevel(updated.totalXP);
    updated.lastTripDate = stamp.visitedDate;

    // Update city & state tracking
    if (!updated.citiesVisited.includes(stamp.location)) {
        updated.citiesVisited.push(stamp.location);
    }
    if (!updated.statesVisited.includes(stamp.state)) {
        updated.statesVisited.push(stamp.state);
    }

    // Update category counts
    updated.categoryCounts[stamp.type] = (updated.categoryCounts[stamp.type] || 0) + 1;

    // Check streak (trip within last 2 weeks = streak continues)
    if (stats.lastTripDate) {
        const lastTrip = new Date(stats.lastTripDate);
        const thisTrip = new Date(stamp.visitedDate);
        const daysDiff = (thisTrip.getTime() - lastTrip.getTime()) / 86400000;
        if (daysDiff <= 14) {
            updated.streak += 1;
        } else {
            updated.streak = 1;
        }
    } else {
        updated.streak = 1;
    }

    // Check new achievements
    const newAchievements = checkNewAchievements(updated);
    for (const achievement of newAchievements) {
        updated.achievements.push(achievement.id);
        updated.totalXP += achievement.xpReward;
    }
    updated.level = calculateLevel(updated.totalXP);

    return updated;
}
