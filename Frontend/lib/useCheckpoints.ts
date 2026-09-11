'use client';
import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CheckpointState {
    tripId: string;
    destId: string;
    destName: string;
    state: string;
    purpose: string;
    totalActivities: number;
    completedSet: string[];        // serializable array of "dayIndex:activityName"
    dayTotals: Record<number, number>; // day → total activities count
    startedAt: string;
    isComplete: boolean;
}

export interface TripProgress {
    completed: number;
    total: number;
    percent: number;
}

export interface DayProgress {
    completed: number;
    total: number;
    percent: number;
    isComplete: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

import { createTrackingSession, updateActivityStatus, stopTrackingSession, saveActiveTripProgress } from '@/lib/firestore';
import { useAuth } from '@/lib/AuthContext';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCheckpoints(
    destId: string,
    destName: string,
    stateName: string,
    purpose: string,
    dayPlans: { day: number; activities: { name: string; lat?: number; lng?: number }[] }[]
) {
    const { user } = useAuth();
    const [checkpoint, setCheckpoint] = useState<CheckpointState | null>(null);
    const [isTripActive, setIsTripActive] = useState(() => checkpoint !== null);
    const [justCompleted, setJustCompleted] = useState<string | null>(null);
    const [dayJustCompleted, setDayJustCompleted] = useState<number | null>(null);
    const [tripJustCompleted, setTripJustCompleted] = useState(false);

    const [prevDestId, setPrevDestId] = useState(destId);
    if (destId !== prevDestId) {
        setPrevDestId(destId);
        // Reset checkpoint when destination changes
        setCheckpoint(null);
        setIsTripActive(false);
        setJustCompleted(null);
        setDayJustCompleted(null);
        setTripJustCompleted(false);
    }

    // Persist checkpoint to Firestore on every change
    useEffect(() => {
        if (!checkpoint || !user?.uid) return;
        // Save progress to Firestore
        const progress = {
            completed: checkpoint.completedSet.length,
            total: checkpoint.totalActivities,
            percent: checkpoint.totalActivities > 0 ? Math.round((checkpoint.completedSet.length / checkpoint.totalActivities) * 100) : 0
        };
        saveActiveTripProgress(user.uid, checkpoint.tripId, progress).catch(err => {
            console.warn('[useCheckpoints] Failed to save progress to Firestore:', err);
        });
    }, [checkpoint, user?.uid]);

    const startTrip = useCallback(() => {
        const dayTotals: Record<number, number> = {};
        let total = 0;
        const allActivities: { name: string; dayIndex: number; lat?: number; lng?: number; status: 'completed' | 'active' | 'upcoming' }[] = [];

        dayPlans.forEach((dp, i) => {
            dayTotals[i] = dp.activities.length;
            total += dp.activities.length;
            dp.activities.forEach(act => {
                allActivities.push({
                    name: act.name,
                    dayIndex: i,
                    lat: act.lat,
                    lng: act.lng,
                    status: 'upcoming',
                });
            });
        });

        const tripId = `${destId}_${Date.now()}`;

        const newState: CheckpointState = {
            tripId,
            destId,
            destName,
            state: stateName,
            purpose,
            totalActivities: total,
            completedSet: [],
            dayTotals,
            startedAt: new Date().toISOString(),
            isComplete: false,
        };
        setCheckpoint(newState);
        setIsTripActive(true);

        if (user?.uid) {
            createTrackingSession(user.uid, {
                tripId,
                itineraryId: destId,
                destName,
                activities: allActivities.map((a, idx) => ({
                    index: idx,
                    name: a.name,
                    lat: a.lat ?? 0,
                    lng: a.lng ?? 0,
                    status: a.status,
                    completedAt: null,
                    completionMethod: null,
                    timeSpentMinutes: null,
                })),
            }).catch(err => console.warn('Live tracking session create failed:', err));
        }
    }, [destId, destName, stateName, purpose, dayPlans, user]);

    const stopTrip = useCallback(() => {
        if (checkpoint && user?.uid) {
            stopTrackingSession(user.uid, checkpoint.tripId).catch(err => console.warn('Live tracking stop failed:', err));
        }
        setCheckpoint(null);
        setIsTripActive(false);
        setJustCompleted(null);
        setDayJustCompleted(null);
        setTripJustCompleted(false);
    }, [checkpoint, user]);

    const toggleCheckpoint = useCallback((dayIndex: number, activityName: string) => {
        if (!checkpoint) return;
        const key = `${dayIndex}:${activityName}`;
        setCheckpoint(prev => {
            if (!prev) return prev;
            const completed = new Set(prev.completedSet);
            const isNowChecked = !completed.has(key);
            if (completed.has(key)) {
                completed.delete(key);
                setJustCompleted(null);
            } else {
                completed.add(key);
                setJustCompleted(activityName);

                // Check if this day is now complete
                const dayActivities = dayPlans[dayIndex]?.activities || [];
                const dayCompleteCount = dayActivities.filter(a =>
                    completed.has(`${dayIndex}:${a.name}`)
                ).length;
                if (dayCompleteCount === dayActivities.length && dayActivities.length > 0) {
                    setDayJustCompleted(dayIndex);
                }

                // Check if entire trip is now complete
                const totalCompleted = completed.size;
                if (totalCompleted === prev.totalActivities) {
                    setTripJustCompleted(true);
                }
            }

            // Sync with Firestore tracking
            if (user?.uid) {
                const actFlatIndex = dayPlans
                    .slice(0, dayIndex)
                    .reduce((acc, dp) => acc + dp.activities.length, 0)
                    + (dayPlans[dayIndex]?.activities.findIndex(a => a.name === activityName) ?? 0);

                if (actFlatIndex >= 0) {
                    updateActivityStatus(
                        user.uid,
                        prev.tripId,
                        actFlatIndex,
                        isNowChecked ? 'completed' : 'upcoming',
                        'manual'
                    ).catch(err => console.warn('Live tracking activity update failed:', err));
                }
            }

            return { ...prev, completedSet: Array.from(completed) };
        });
    }, [checkpoint, dayPlans, user]);

    const isChecked = useCallback((dayIndex: number, activityName: string): boolean => {
        if (!checkpoint) return false;
        return checkpoint.completedSet.includes(`${dayIndex}:${activityName}`);
    }, [checkpoint]);

    const getProgress = useCallback((): TripProgress => {
        if (!checkpoint) return { completed: 0, total: 0, percent: 0 };
        const completed = checkpoint.completedSet.length;
        const total = checkpoint.totalActivities;
        return {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }, [checkpoint]);

    const getDayProgress = useCallback((dayIndex: number): DayProgress => {
        if (!checkpoint) return { completed: 0, total: 0, percent: 0, isComplete: false };
        const dayActivities = dayPlans[dayIndex]?.activities || [];
        const total = dayActivities.length;
        const completed = dayActivities.filter(a =>
            checkpoint.completedSet.includes(`${dayIndex}:${a.name}`)
        ).length;
        return {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            isComplete: completed === total && total > 0,
        };
    }, [checkpoint, dayPlans]);

    const clearJustCompleted = useCallback(() => setJustCompleted(null), []);
    const clearDayJustCompleted = useCallback(() => setDayJustCompleted(null), []);
    const clearTripJustCompleted = useCallback(() => setTripJustCompleted(false), []);

    return {
        isTripActive,
        checkpoint,
        startTrip,
        stopTrip,
        toggleCheckpoint,
        isChecked,
        getProgress,
        getDayProgress,
        justCompleted,
        clearJustCompleted,
        dayJustCompleted,
        clearDayJustCompleted,
        tripJustCompleted,
        clearTripJustCompleted,
    };
}