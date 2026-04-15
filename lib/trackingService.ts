// ─── Live Tracking Service ────────────────────────────────────────────────────
// Handles GPS watch + Firestore persistence for real-time trip tracking.
// Usage:
//   import { TrackingService } from '@/lib/trackingService';
//   const tracker = new TrackingService(userId, tripId);
//   tracker.start(onPositionUpdate);
//   tracker.stop();

import {
    updateTrackingPosition,
    updateActivityStatus,
    createTrackingSession,
    stopTrackingSession,
} from './firestore';
import type { TrackedActivity } from './firestoreSchema';
import { Timestamp } from 'firebase/firestore';

const PROXIMITY_THRESHOLD_M = 200; // auto-complete within 200m
const WRITE_THROTTLE_MS = 5000; // write to Firestore at most every 5s

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface TrackingCallbacks {
    onPositionUpdate?: (pos: { lat: number; lng: number; accuracy: number }) => void;
    onActivityAutoCompleted?: (activityIndex: number, activityName: string) => void;
    onError?: (error: string) => void;
}

export class TrackingService {
    private userId: string;
    private tripId: string;
    private watchId: number | null = null;
    private lastWriteTime = 0;
    private activities: TrackedActivity[] = [];
    private completedIndices: Set<number> = new Set();
    private callbacks: TrackingCallbacks = {};

    constructor(userId: string, tripId: string) {
        this.userId = userId;
        this.tripId = tripId;
    }

    async initSession(data: {
        itineraryId: string;
        destName: string;
        activities: Array<{ name: string; lat: number; lng: number; status: string }>;
    }) {
        this.activities = data.activities.map((act, i) => ({
            index: i,
            name: act.name,
            lat: act.lat,
            lng: act.lng,
            status: act.status as 'completed' | 'active' | 'upcoming',
            completedAt: act.status === 'completed' ? Timestamp.now() : null,
            completionMethod: act.status === 'completed' ? 'manual' as const : null,
            timeSpentMinutes: null,
        }));

        // Pre-fill completed indices
        this.activities.forEach((act, i) => {
            if (act.status === 'completed') this.completedIndices.add(i);
        });

        await createTrackingSession(this.userId, {
            tripId: this.tripId,
            itineraryId: data.itineraryId,
            destName: data.destName,
            activities: this.activities,
        });
    }

    start(callbacks: TrackingCallbacks = {}) {
        this.callbacks = callbacks;

        if (!navigator.geolocation) {
            callbacks.onError?.('Geolocation not supported');
            return;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (pos) => this.handlePosition(pos),
            (err) => {
                callbacks.onError?.(
                    err.code === 1 ? 'GPS permission denied' :
                    err.code === 2 ? 'GPS unavailable' :
                    'GPS timeout'
                );
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000,
            }
        );
    }

    private async handlePosition(pos: GeolocationPosition) {
        const { latitude: lat, longitude: lng, accuracy, speed, heading } = pos.coords;

        // Notify UI immediately
        this.callbacks.onPositionUpdate?.({ lat, lng, accuracy });

        // Throttle Firestore writes
        const now = Date.now();
        if (now - this.lastWriteTime > WRITE_THROTTLE_MS) {
            this.lastWriteTime = now;
            try {
                await updateTrackingPosition(this.userId, this.tripId, {
                    lat, lng, accuracy,
                    speed: speed ?? null,
                    heading: heading ?? null,
                });
            } catch (err) {
                console.error('Failed to write tracking position:', err);
            }
        }

        // Check proximity to activities
        this.checkActivityProximity(lat, lng);
    }

    private async checkActivityProximity(lat: number, lng: number) {
        for (const act of this.activities) {
            if (this.completedIndices.has(act.index)) continue;
            if (act.status === 'completed') continue;

            const dist = haversineM(lat, lng, act.lat, act.lng);
            if (dist < PROXIMITY_THRESHOLD_M) {
                this.completedIndices.add(act.index);
                act.status = 'completed';
                act.completedAt = Timestamp.now();
                act.completionMethod = 'gps_auto';

                this.callbacks.onActivityAutoCompleted?.(act.index, act.name);

                try {
                    await updateActivityStatus(
                        this.userId,
                        this.tripId,
                        act.index,
                        'completed',
                        'gps_auto'
                    );
                } catch (err) {
                    console.error('Failed to auto-complete activity:', err);
                }
            }
        }
    }

    async manualComplete(activityIndex: number) {
        if (this.completedIndices.has(activityIndex)) return;
        this.completedIndices.add(activityIndex);

        if (this.activities[activityIndex]) {
            this.activities[activityIndex].status = 'completed';
            this.activities[activityIndex].completedAt = Timestamp.now();
            this.activities[activityIndex].completionMethod = 'manual';
        }

        try {
            await updateActivityStatus(
                this.userId,
                this.tripId,
                activityIndex,
                'completed',
                'manual'
            );
        } catch (err) {
            console.error('Failed to manually complete activity:', err);
        }
    }

    async stop() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        try {
            await stopTrackingSession(this.userId, this.tripId);
        } catch (err) {
            console.error('Failed to stop tracking session:', err);
        }
    }

    isTracking() {
        return this.watchId !== null;
    }
}
