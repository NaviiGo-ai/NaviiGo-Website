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

const STORAGE_PREFIX = 'naviigo_trip_';

function buildTripId(destId: string): string {
    return `${destId}_${Date.now()}`;
}

function getStorageKey(tripId: string): string {
    return `${STORAGE_PREFIX}${tripId}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCheckpoints(
    destId: string,
    destName: string,
    stateName: string,
    purpose: string,
    dayPlans: { day: number; activities: { name: string }[] }[]
) {
    const [isTripActive, setIsTripActive] = useState(false);
    const [checkpoint, setCheckpoint] = useState<CheckpointState | null>(null);
    const [justCompleted, setJustCompleted] = useState<string | null>(null);
    const [dayJustCompleted, setDayJustCompleted] = useState<number | null>(null);
    const [tripJustCompleted, setTripJustCompleted] = useState(false);

    // On mount, check if there's a saved trip for this destination
    useEffect(() => {
        if (typeof window === 'undefined') return;
        // Look for any active trip for this destination
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
                try {
                    const saved = JSON.parse(localStorage.getItem(key) || '');
                    if (saved.destId === destId && !saved.isComplete) {
                        setCheckpoint(saved);
                        setIsTripActive(true);
                        return;
                    }
                } catch { /* skip corrupt entries */ }
            }
        }
    }, [destId]);

    // Persist checkpoint to localStorage on every change
    useEffect(() => {
        if (!checkpoint || typeof window === 'undefined') return;
        localStorage.setItem(getStorageKey(checkpoint.tripId), JSON.stringify(checkpoint));
    }, [checkpoint]);

    const startTrip = useCallback(() => {
        const dayTotals: Record<number, number> = {};
        let total = 0;
        dayPlans.forEach((dp, i) => {
            dayTotals[i] = dp.activities.length;
            total += dp.activities.length;
        });

        const newState: CheckpointState = {
            tripId: buildTripId(destId),
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
    }, [destId, destName, stateName, purpose, dayPlans]);

    const stopTrip = useCallback(() => {
        if (checkpoint) {
            localStorage.removeItem(getStorageKey(checkpoint.tripId));
        }
        setCheckpoint(null);
        setIsTripActive(false);
        setJustCompleted(null);
        setDayJustCompleted(null);
        setTripJustCompleted(false);
    }, [checkpoint]);

    const toggleCheckpoint = useCallback((dayIndex: number, activityName: string) => {
        if (!checkpoint) return;
        const key = `${dayIndex}:${activityName}`;
        setCheckpoint(prev => {
            if (!prev) return prev;
            const completed = new Set(prev.completedSet);
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
            return { ...prev, completedSet: Array.from(completed) };
        });
    }, [checkpoint, dayPlans]);

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
