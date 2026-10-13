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
    /** UID that started this in-memory session; prevents account crossover. */
    ownerUid?: string;
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

import { createTrackingSession, updateActivityStatus, cancelActiveItinerary, saveActiveTripProgress, setActiveItinerary } from '@/lib/firestore';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCheckpoints(
    destId: string,
    destName: string,
    stateName: string,
    purpose: string,
    dayPlans: { day: number; activities: { activityId?: string; id?: string; name: string; lat?: number; lng?: number }[] }[],
    itineraryId?: string
) {
    const { user } = useAuth();
    const [checkpoint, setCheckpoint] = useState<CheckpointState | null>(null);
    const [isTripActive, setIsTripActive] = useState(() => checkpoint !== null);
    const [justCompleted, setJustCompleted] = useState<string | null>(null);
    const [dayJustCompleted, setDayJustCompleted] = useState<number | null>(null);
    const [tripJustCompleted, setTripJustCompleted] = useState(false);
    const [commandError, setCommandError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const startingRef = useRef(false);
    const previousUidRef = useRef<string | null | undefined>(user?.uid);

    // A route can remain mounted while Firebase switches accounts. Reset the
    // local session during that transition and never persist the old session
    // under the new UID.
    if (previousUidRef.current !== user?.uid) {
        previousUidRef.current = user?.uid;
        setCommandError(null);
        setIsStarting(false);
        setCheckpoint(null);
        setIsTripActive(false);
        setJustCompleted(null);
        setDayJustCompleted(null);
        setTripJustCompleted(false);
    }

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
        if (!checkpoint || !user?.uid || checkpoint.ownerUid !== user.uid) return;
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

    const startTrip = useCallback(async () => {
        const uid = user?.uid;
        if (!uid || !itineraryId || startingRef.current) return;
        startingRef.current = true; setIsStarting(true); setCommandError(null);
        try {
            await setActiveItinerary(uid, itineraryId);
            if (auth?.currentUser?.uid !== uid) return;
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

        // Reuse stable canonical itinerary ID as tracking session tripId
        const tripId = itineraryId || `${destId}_${Date.now()}`;

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
            ownerUid: user?.uid,
        };
        setCheckpoint(newState);
        setIsTripActive(true);

        if (user?.uid) {
            createTrackingSession(user.uid, {
                tripId,
                itineraryId: tripId,
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
        } catch (error) {
            if (auth?.currentUser?.uid === uid) setCommandError(error instanceof Error ? error.message : 'The journey could not be started.');
        } finally {
            startingRef.current = false;
            if (auth?.currentUser?.uid === uid) setIsStarting(false);
        }
    }, [destId, destName, stateName, purpose, dayPlans, user, itineraryId]);

    const stopTrip = useCallback(async () => {
        const uid = user?.uid;
        if (!checkpoint || !uid || checkpoint.ownerUid !== uid || !itineraryId || startingRef.current) return;
        startingRef.current = true; setIsStarting(true); setCommandError(null);
        try {
            await cancelActiveItinerary(uid, itineraryId);
            if (auth?.currentUser?.uid !== uid) return;
            setCheckpoint(null); setIsTripActive(false); setJustCompleted(null);
            setDayJustCompleted(null); setTripJustCompleted(false);
        } catch (error) {
            if (auth?.currentUser?.uid === uid) setCommandError(error instanceof Error ? error.message : 'The journey could not be ended.');
        } finally {
            startingRef.current = false;
            if (auth?.currentUser?.uid === uid) setIsStarting(false);
        }
    }, [checkpoint, user, itineraryId]);

    const toggleCheckpoint = useCallback((dayIndex: number, activityName: string) => {
        if (!checkpoint) return;
        const candidates = dayPlans[dayIndex]?.activities.filter(a => a.activityId === activityName || a.id === activityName || a.name === activityName) || [];
        if (candidates.length !== 1) return;
        const activity = candidates[0];
        const activityIdentity = activity?.activityId || activity?.id || activityName;
        const key = `${dayIndex}:${activityIdentity}`;
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
                    completed.has(`${dayIndex}:${a.activityId || a.id || a.name}`)
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
        const activity = dayPlans[dayIndex]?.activities.find(a => a.name === activityName);
        return checkpoint.completedSet.includes(`${dayIndex}:${activity?.activityId || activity?.id || activityName}`);
    }, [checkpoint, dayPlans]);

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
            checkpoint.completedSet.includes(`${dayIndex}:${a.activityId || a.id || a.name}`)
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
        isTripActive, commandError, isStarting,
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
