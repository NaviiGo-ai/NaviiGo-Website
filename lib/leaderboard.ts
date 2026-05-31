// ─── Leaderboard System ──────────────────────────────────────────────────────
// Manages global rankings by XP. Updated whenever a user earns a stamp.

import { db } from './firebase';
import {
    doc, setDoc, getDocs, collection, query, orderBy, limit, serverTimestamp, getDoc,
} from 'firebase/firestore';

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    photoURL: string | null;
    totalXP: number;
    totalStamps: number;
    level: number;
    statesCount: number;
    lastUpdated: any;
}

/**
 * Update the leaderboard entry for a user after stamp award.
 */
export async function updateLeaderboardEntry(
    uid: string,
    displayName: string,
    photoURL: string | null,
    stats: {
        totalXP: number;
        totalStamps: number;
        level: number;
        statesVisited: string[];
    }
) {
    const ref = doc(db, 'leaderboard', uid);
    await setDoc(ref, {
        uid,
        displayName: displayName || 'Traveler',
        photoURL: photoURL || null,
        totalXP: stats.totalXP,
        totalStamps: stats.totalStamps,
        level: stats.level,
        statesCount: stats.statesVisited.length,
        lastUpdated: serverTimestamp(),
    }, { merge: true });
}

/**
 * Fetch the top N users from the leaderboard.
 */
export async function getLeaderboard(topN: number = 20): Promise<LeaderboardEntry[]> {
    try {
        const q = query(
            collection(db, 'leaderboard'),
            orderBy('totalXP', 'desc'),
            limit(topN)
        );
        const snap = await getDocs(q);
        return snap.docs.map((d, i) => ({ ...d.data(), uid: d.id } as LeaderboardEntry));
    } catch {
        return [];
    }
}

/**
 * Get the current user's rank. Counts how many users have more XP.
 */
export async function getUserRank(uid: string): Promise<number | null> {
    try {
        const userDoc = await getDoc(doc(db, 'leaderboard', uid));
        if (!userDoc.exists()) return null;
        const userXP = userDoc.data().totalXP || 0;

        // Count users with more XP
        const allDocs = await getDocs(
            query(collection(db, 'leaderboard'), orderBy('totalXP', 'desc'))
        );
        let rank = 1;
        for (const d of allDocs.docs) {
            if (d.id === uid) return rank;
            rank++;
        }
        return rank;
    } catch {
        return null;
    }
}
