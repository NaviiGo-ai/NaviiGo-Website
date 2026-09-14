import { db } from './firebase';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    onSnapshot,
    collection,
    updateDoc,
    deleteDoc,
    increment,
    serverTimestamp,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
    addDoc,
    arrayUnion,
    runTransaction,
} from 'firebase/firestore';
import type {
    UserProfile,
    UserPreferences,
    SavedItineraryDoc,
    TrackingSession,
    LocationPoint,
} from './firestoreSchema';

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROFILE — users/{uid}
// ═══════════════════════════════════════════════════════════════════════════════

export async function upsertUserProfile(uid: string, data: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}) {
    const ref = doc(db, 'users', uid);
    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (snap.exists()) {
            transaction.update(ref, {
                displayName: data.displayName,
                email: data.email,
                photoURL: data.photoURL,
                lastLogin: serverTimestamp(),
            });
        } else {
            transaction.set(ref, {
                uid,
                displayName: data.displayName,
                email: data.email,
                photoURL: data.photoURL,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                totalTrips: 0,
                totalBookings: 0,
            });
        }
    });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER PREFERENCES — users/{uid}/preferences/main
// ═══════════════════════════════════════════════════════════════════════════════

export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
    const snap = await getDoc(doc(db, 'users', uid, 'preferences', 'main'));
    return snap.exists() ? (snap.data() as UserPreferences) : null;
}

export async function updateUserPreferences(uid: string, prefs: Partial<UserPreferences>) {
    const ref = doc(db, 'users', uid, 'preferences', 'main');
    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (snap.exists()) {
            transaction.update(ref, { ...prefs, updatedAt: serverTimestamp() });
        } else {
            transaction.set(ref, {
                travelStyle: null,
                preferredGroup: null,
                interests: [],
                dietaryPreferences: [],
                accessibilityNeeds: [],
                homeCity: null,
                recentSearches: [],
                ...prefs,
                updatedAt: serverTimestamp(),
            });
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAVED ITINERARIES — users/{uid}/itineraries/{itineraryId}
// ═══════════════════════════════════════════════════════════════════════════════

// Concurrency guard: prevents race conditions when rapid clicks or parallel components trigger save
const inFlightSaves = new Map<string, Promise<string>>();

export async function saveItineraryToFirestore(uid: string, data: {
    destId: string;
    destName: string;
    form: Record<string, unknown>;
    generatedData: Record<string, unknown> | null;
    id?: string;
    uuid?: string;
}): Promise<string> {
    if (!db || !uid) return 'temp-local-id';

    // 1. Resolve canonical stable ID: prefer explicit id/uuid or form._uuid/uuid
    let stableId = (
        data.id ||
        data.uuid ||
        (data.form?.uuid as string) ||
        (data.form?._uuid as string) ||
        (data.form?.id as string) ||
        (data.generatedData?.id as string) ||
        (data.generatedData?.uuid as string)
    )?.trim();

    const lockKey = `${uid}:${stableId || (data.destId + '_' + (data.form?.startDate || ''))}`;
    if (inFlightSaves.has(lockKey)) {
        return inFlightSaves.get(lockKey)!;
    }

    const savePromise = (async (): Promise<string> => {
        try {
            const colRef = collection(db, 'users', uid, 'itineraries');

            // If no stableId was provided, check if a document already exists for this exact destination + startDate + purpose
            if (!stableId) {
                const allSnap = await getDocs(colRef);
                const startDate = (data.form?.startDate as string) || '';
                const purpose = (data.form?.purpose as string) || '';
                allSnap.forEach((d) => {
                    const existing = d.data();
                    const existingForm = existing.form as Record<string, unknown> | undefined;
                    if (
                        existing.destId === data.destId &&
                        (existingForm?.purpose || '') === purpose &&
                        (existingForm?.startDate || '') === startDate
                    ) {
                        stableId = d.id;
                    }
                });
            }

            // If still no stableId, generate one stable UUID once and lock it into the form state
            if (!stableId) {
                stableId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `trip_${Date.now()}`;
            }

            const ref = doc(db, 'users', uid, 'itineraries', stableId);
            const docSnap = await getDoc(ref);
            const exists = docSnap.exists();

            const now = serverTimestamp();
            const payload: any = {
                id: stableId,
                uuid: stableId,
                destId: data.destId || (data.form?.destination as string) || 'india',
                destName: data.destName || (data.form?.destName as string) || 'India Expedition',
                form: {
                    ...data.form,
                    uuid: stableId,
                    _uuid: stableId,
                },
                generatedData: data.generatedData || null,
                updatedAt: now,
                isActive: data.form?.isActive ?? (exists ? (docSnap.data()?.isActive ?? false) : false),
            };

            // Preserve createdAt: set on first creation only, never overwrite on subsequent saves
            if (!exists) {
                payload.createdAt = now;
            }

            // IDEMPOTENT UPSERT: target the single stable doc ID via setDoc merge
            await setDoc(ref, payload, { merge: true });

            // Increment totalTrips ONCE on initial creation
            if (!exists) {
                try {
                    await updateDoc(doc(db, 'users', uid), {
                        totalTrips: increment(1),
                        lastUpdated: now,
                    });
                } catch {
                    // Non-fatal if user doc doesn't have counter
                }
            }

            // Mirror to root itineraries collection for public access & share links
            try {
                const rootRef = doc(db, 'itineraries', stableId);
                const rootSnap = await getDoc(rootRef);
                const rootExists = rootSnap.exists();
                const rootData: any = {
                    ...payload,
                    userId: uid,
                    isPublic: true,
                };
                if (!rootExists) {
                    rootData.createdAt = now;
                }
                await setDoc(rootRef, rootData, { merge: true });
            } catch (mirrorErr) {
                console.warn('[Firestore] Mirroring to root itineraries failed (non-fatal):', mirrorErr);
            }

            return stableId;
        } catch (err) {
            console.warn('[Firestore] saveItineraryToFirestore error:', err);
            return stableId || 'temp-local-id';
        }
    })();

    inFlightSaves.set(lockKey, savePromise);
    try {
        return await savePromise;
    } finally {
        inFlightSaves.delete(lockKey);
    }
}


export async function getUserItineraries(uid: string): Promise<SavedItineraryDoc[]> {
    if (!db || !uid) return [];
    try {
        const rawMap = new Map<string, SavedItineraryDoc>();

        // 1. Fetch from user's personal itineraries subcollection
        try {
            const userItinSnap = await getDocs(collection(db, 'users', uid, 'itineraries'));
            userItinSnap.forEach(d => {
                const data = d.data();
                rawMap.set(d.id, {
                    id: d.id,
                    destId: data.destId || (data.form?.destination as string) || 'india',
                    destName: data.destName || (data.form?.destName as string) || 'India Expedition',
                    form: data.form || {},
                    generatedData: data.generatedData || null,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    isActive: data.isActive ?? false,
                } as SavedItineraryDoc);
            });
        } catch (e) {
            console.warn('[Firestore] getUserItineraries user subcollection read failed:', e);
        }

        // 2. Also query root itineraries collection where userId == uid
        try {
            const q = query(
                collection(db, 'itineraries'),
                where('userId', '==', uid)
            );
            const rootSnap = await getDocs(q);
            rootSnap.forEach(d => {
                const data = d.data();
                if (!rawMap.has(d.id)) {
                    rawMap.set(d.id, {
                        id: d.id,
                        destId: data.destId || (data.form?.destination as string) || 'india',
                        destName: data.destName || (data.form?.destName as string) || 'India Expedition',
                        form: data.form || {},
                        generatedData: data.generatedData || null,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        isActive: data.isActive ?? false,
                    } as SavedItineraryDoc);
                }
            });
        } catch (e) {
            console.warn('[Firestore] getUserItineraries root collection query failed:', e);
        }

        const rawList = Array.from(rawMap.values());

        // 3. Detect and reconcile legacy duplicate records for this user:
        // A logical trip matches if:
        // - They share the exact same UUID (e.g. form.uuid or form._uuid matches doc.id)
        // - OR they have the exact same destId, destination name, start date, and days count
        const canonicalMap = new Map<string, SavedItineraryDoc>();
        const redundantIdsToDelete: string[] = [];

        for (const item of rawList) {
            const formUuid = ((item.form?.uuid || item.form?._uuid) as string | undefined)?.trim();
            const isStandardUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);

            const destNorm = (item.destId || '').toLowerCase().trim();
            const startDate = ((item.form?.startDate as string) || '').trim();
            const days = String(item.form?.days || '');
            const sig = `${destNorm}__${startDate}__${days}`;

            let matchedKey: string | null = null;
            for (const [key, existing] of canonicalMap.entries()) {
                const existingFormUuid = ((existing.form?.uuid || existing.form?._uuid) as string | undefined)?.trim();
                const existingDestNorm = (existing.destId || '').toLowerCase().trim();
                const existingStartDate = ((existing.form?.startDate as string) || '').trim();
                const existingDays = String(existing.form?.days || '');
                const existingSig = `${existingDestNorm}__${existingStartDate}__${existingDays}`;

                const uuidMatch = (formUuid && formUuid === existingFormUuid) ||
                                  (formUuid && formUuid === existing.id) ||
                                  (existingFormUuid && existingFormUuid === item.id);

                const sigMatch = sig === existingSig && destNorm.length > 0;

                if (uuidMatch || sigMatch) {
                    matchedKey = key;
                    break;
                }
            }

            if (!matchedKey) {
                canonicalMap.set(item.id, item);
            } else {
                const existing = canonicalMap.get(matchedKey)!;
                const existingIsUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existing.id);

                const existingPlanCount = (existing.generatedData as any)?.dayPlans?.length || 0;
                const itemPlanCount = (item.generatedData as any)?.dayPlans?.length || 0;

                let keepExisting = true;
                if (!existingIsUUID && isStandardUUID) {
                    keepExisting = false;
                } else if (existingIsUUID && !isStandardUUID) {
                    keepExisting = true;
                } else if (itemPlanCount > existingPlanCount) {
                    keepExisting = false;
                } else {
                    const timeExisting = existing.updatedAt?.toMillis?.() || existing.createdAt?.toMillis?.() || 0;
                    const timeItem = item.updatedAt?.toMillis?.() || item.createdAt?.toMillis?.() || 0;
                    if (timeItem > timeExisting) {
                        keepExisting = false;
                    }
                }

                if (keepExisting) {
                    redundantIdsToDelete.push(item.id);
                } else {
                    canonicalMap.delete(matchedKey);
                    canonicalMap.set(item.id, item);
                    redundantIdsToDelete.push(existing.id);
                }
            }
        }

        // 4. Safely clean redundant legacy duplicate documents from Firestore
        if (redundantIdsToDelete.length > 0) {
            for (const redundantId of redundantIdsToDelete) {
                deleteDoc(doc(db, 'users', uid, 'itineraries', redundantId)).catch(err => {
                    console.warn(`[Firestore] Failed to clean legacy duplicate ${redundantId}:`, err);
                });
            }
        }

        const items = Array.from(canonicalMap.values());
        // Sort deterministically by updated/created timestamp descending
        items.sort((a: any, b: any) => {
            const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
            const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
            return timeB - timeA;
        });

        return items.slice(0, 30);
    } catch (err) {
        console.warn('[Firestore] getUserItineraries error:', err);
        return [];
    }
}

export async function setActiveItinerary(uid: string, itineraryId: string) {
    try {
        const all = await getUserItineraries(uid);
        for (const itin of all) {
            if (itin.isActive && itin.id !== itineraryId) {
                await updateDoc(doc(db, 'users', uid, 'itineraries', itin.id), { isActive: false }).catch(() => {});
            }
        }
        await setDoc(doc(db, 'users', uid, 'itineraries', itineraryId), {
            isActive: true,
            status: 'active',
            startedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        console.warn('[Firestore] setActiveItinerary error:', err);
    }
}

export async function deleteItineraryFromFirestore(uid: string, itineraryId: string) {
    try {
        await deleteDoc(doc(db, 'users', uid, 'itineraries', itineraryId));
        await deleteDoc(doc(db, 'itineraries', itineraryId)).catch(() => {});
    } catch (err) {
        console.warn('[Firestore] deleteItineraryFromFirestore error:', err);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE TRACKING — users/{uid}/tracking/{tripId}
// ═══════════════════════════════════════════════════════════════════════════════

export async function createTrackingSession(uid: string, data: {
    tripId: string;
    itineraryId: string;
    destName: string;
    activities: TrackingSession['activities'];
}): Promise<string> {
    const ref = doc(db, 'users', uid, 'tracking', data.tripId);
    await setDoc(ref, {
        ...data,
        startedAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
        isActive: true,
        currentLat: 0,
        currentLng: 0,
        accuracy: 0,
        speed: null,
        heading: null,
        completedCount: 0,
        totalCount: data.activities.length,
    });
    return data.tripId;
}

export async function updateTrackingPosition(uid: string, tripId: string, position: {
    lat: number;
    lng: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
}) {
    // Update current position in tracking session
    await updateDoc(doc(db, 'users', uid, 'tracking', tripId), {
        currentLat: position.lat,
        currentLng: position.lng,
        accuracy: position.accuracy,
        speed: position.speed,
        heading: position.heading,
        lastUpdatedAt: serverTimestamp(),
    });

    // Add to location history sub-collection
    await addDoc(collection(db, 'users', uid, 'tracking', tripId, 'locations'), {
        ...position,
        timestamp: serverTimestamp(),
    });
}

export async function updateActivityStatus(
    uid: string,
    tripId: string,
    activityIndex: number,
    status: 'completed' | 'active' | 'upcoming',
    method: 'manual' | 'gps_auto' | null = null
) {
    const ref = doc(db, 'users', uid, 'tracking', tripId);
    
    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) return;

        const data = snap.data() as TrackingSession;
        const activities = [...data.activities];
        
        // Skip if already in the requested state
        if (activities[activityIndex]?.status === status) return;

        activities[activityIndex] = {
            ...activities[activityIndex],
            status,
            completedAt: status === 'completed' ? Timestamp.now() : null,
            completionMethod: method,
        };

        const completedCount = activities.filter(a => a.status === 'completed').length;

        transaction.update(ref, {
            activities,
            completedCount,
            lastUpdatedAt: serverTimestamp(),
        });
    });
}

export async function stopTrackingSession(uid: string, tripId: string) {
    await updateDoc(doc(db, 'users', uid, 'tracking', tripId), {
        isActive: false,
        lastUpdatedAt: serverTimestamp(),
    });
}

export async function getActiveTracking(uid: string): Promise<TrackingSession | null> {
    const q = query(collection(db, 'users', uid, 'tracking'), orderBy('startedAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = snap.docs[0].data() as TrackingSession;
    return data.isActive ? { ...data, tripId: snap.docs[0].id } : null;
}

export function listenToTracking(
    uid: string,
    tripId: string,
    onUpdate: (data: TrackingSession) => void,
    onError?: () => void
) {
    return onSnapshot(
        doc(db, 'users', uid, 'tracking', tripId),
        (snap) => {
            if (snap.exists()) {
                onUpdate(snap.data() as TrackingSession);
            }
        },
        () => onError?.()
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED ITINERARIES — itineraries/{shareId} (kept for backward compat)
// ═══════════════════════════════════════════════════════════════════════════════

export async function saveSharedItinerary(shareId: string, data: {
    form: Record<string, unknown>;
    customPlans: unknown[];
    generatedData?: any;
    destName: string;
}, ownerUid?: string, ownerEmail?: string) {
    try {
        await setDoc(doc(db, 'itineraries', shareId), {
            ...data,
            ownerUid: ownerUid || null,
            collaborators: 1,
            invitedUsers: ownerEmail ? [ownerEmail] : [],
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[Firestore] saveSharedItinerary error:', err);
    }
    return shareId;
}

export async function updateSharedPlans(shareId: string, customPlans: unknown[]) {
    try {
        await updateDoc(doc(db, 'itineraries', shareId), {
            customPlans,
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.warn('[Firestore] updateSharedPlans error:', err);
    }
}


// ═══════════════════════════════════════════════════════════════════════════════
// UUID-BASED ITINERARIES — itineraries/{uuid}  (new primary store)
// Each generated itinerary gets a client-generated UUID as its document ID.
// Works for both logged-in users and guests (guests expire after 30 days).
// ═══════════════════════════════════════════════════════════════════════════════

export async function saveItineraryByUUID(uuid: string, data: {
    form: Record<string, unknown>;
    generatedData: Record<string, unknown> | null;
    destName: string;
    userId?: string | null;
    isPublic?: boolean;
}) {
    if (!db || !uuid) return;
    try {
        const uid = data.userId || (data.form?.userId as string);
        if (uid) {
            // Unified single persistence path for authenticated users
            await saveItineraryToFirestore(uid, {
                id: uuid,
                uuid,
                destId: (data.form?.destination as string) || (data.form?.destId as string) || 'india',
                destName: data.destName,
                form: {
                    ...data.form,
                    uuid,
                    _uuid: uuid,
                },
                generatedData: data.generatedData,
            });
            return;
        }

        // Unauthenticated guest user: persist only to root itineraries/{uuid}
        const ref = doc(db, 'itineraries', uuid);
        const snap = await getDoc(ref);
        const exists = snap.exists();

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const docData: any = {
            ...data,
            uuid,
            id: uuid,
            isPublic: data.isPublic ?? true,
            expiresAt: Timestamp.fromDate(expiresAt),
            updatedAt: serverTimestamp(),
        };

        if (!exists) {
            docData.createdAt = serverTimestamp();
        }

        await setDoc(ref, docData, { merge: true });
    } catch (err) {
        console.warn('[Firestore] saveItineraryByUUID error (non-fatal):', err);
    }
}

export async function getItineraryByUUID(uuid: string): Promise<{
    form: Record<string, unknown>;
    generatedData: any;
    destName: string;
    userId?: string | null;
    isPublic?: boolean;
} | null> {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, 'itineraries', uuid));
        if (!snap.exists()) return null;
        return snap.data() as any;
    } catch (err) {
        console.warn('[Firestore] getItineraryByUUID failed:', err);
        return null;
    }
}

/** Real-time listener — used by the [uuid] page to detect when generation completes */
export function listenToItineraryByUUID(
    uuid: string,
    onUpdate: (data: { form: Record<string, unknown>; generatedData: any; destName: string } | null) => void,
    onError?: () => void
) {
    if (!db) {
        onError?.();
        return () => {};
    }
    try {
        return onSnapshot(
            doc(db, 'itineraries', uuid),
            (snap) => {
                onUpdate(snap.exists() ? (snap.data() as any) : null);
            },
            () => onError?.()
        );
    } catch (err) {
        console.warn('[Firestore] listenToItineraryByUUID failed:', err);
        onError?.();
        return () => {};
    }
}

export async function joinSharedItinerary(shareId: string, userEmail?: string) {
    if (!db) return;
    try {
        const updateData: any = { collaborators: increment(1) };
        if (userEmail) {
            updateData.invitedUsers = arrayUnion(userEmail);
        }
        await updateDoc(doc(db, 'itineraries', shareId), updateData);
    } catch {
        // Document may not exist yet
    }
}

export function listenToItinerary(
    shareId: string,
    onUpdate: (data: { form: Record<string, unknown>; customPlans: any[]; collaborators: number }) => void,
    onError?: () => void
) {
    if (!db) {
        onError?.();
        return () => {};
    }
    try {
        return onSnapshot(
            doc(db, 'itineraries', shareId),
            (snap) => {
                if (snap.exists()) {
                    onUpdate(snap.data() as any);
                }
            },
            () => onError?.()
        );
    } catch (err) {
        console.warn('[Firestore] listenToItinerary failed:', err);
        onError?.();
        return () => {};
    }
}



// ═══════════════════════════════════════════════════════════════════════════════
// DIGITAL PASSPORT — users/{uid}/passport/stats + stamps
// ═══════════════════════════════════════════════════════════════════════════════

import type {
    PassportStatsDoc,
    PassportStampDoc,
    DestinationReview,
} from './firestoreSchema';

export async function getPassportStats(uid: string): Promise<PassportStatsDoc | null> {
    const snap = await getDoc(doc(db, 'users', uid, 'passport', 'stats'));
    return snap.exists() ? (snap.data() as PassportStatsDoc) : null;
}

export async function updatePassportStats(uid: string, stats: Partial<PassportStatsDoc>) {
    const ref = doc(db, 'users', uid, 'passport', 'stats');
    const snap = await getDoc(ref);
    if (snap.exists()) {
        await updateDoc(ref, { ...stats, updatedAt: serverTimestamp() });
    } else {
        await setDoc(ref, {
            totalStamps: 0,
            totalXP: 0,
            level: 0,
            streak: 0,
            lastTripDate: null,
            achievements: [],
            statesVisited: [],
            citiesVisited: [],
            categoryCounts: {},
            ...stats,
            updatedAt: serverTimestamp(),
        });
    }
}

export async function addPassportStamp(uid: string, stamp: Omit<PassportStampDoc, 'createdAt'>): Promise<string> {
    const colRef = collection(db, 'users', uid, 'passport', 'stamps', 'entries');
    const docRef = await addDoc(colRef, {
        ...stamp,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getPassportStamps(uid: string): Promise<PassportStampDoc[]> {
    try {
        const q = query(
            collection(db, 'users', uid, 'passport', 'stamps', 'entries'),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data() } as PassportStampDoc));
    } catch {
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESTINATION REVIEWS — reviews/{destId}/entries/{reviewId}
// ═══════════════════════════════════════════════════════════════════════════════

export async function submitReview(destId: string, review: Omit<DestinationReview, 'id' | 'helpfulCount' | 'createdAt'>): Promise<string> {
    const colRef = collection(db, 'reviews', destId, 'entries');
    const docRef = await addDoc(colRef, {
        ...review,
        helpfulCount: 0,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function getReviews(destId: string, maxResults: number = 20): Promise<DestinationReview[]> {
    try {
        const q = query(
            collection(db, 'reviews', destId, 'entries'),
            orderBy('createdAt', 'desc'),
            limit(maxResults)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as DestinationReview));
    } catch {
        return [];
    }
}

export async function markReviewHelpful(destId: string, reviewId: string) {
    try {
        await updateDoc(doc(db, 'reviews', destId, 'entries', reviewId), {
            helpfulCount: increment(1),
        });
    } catch { /* silently fail */ }
}

export async function getAverageRating(destId: string): Promise<{ avg: number; count: number }> {
    try {
        const reviews = await getReviews(destId, 100);
        if (reviews.length === 0) return { avg: 0, count: 0 };
        const sum = reviews.reduce((s, r) => s + r.rating, 0);
        return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
    } catch {
        return { avg: 0, count: 0 };
    }
}
// ═══════════════════════════════════════════════════════════════════════════════
// BUCKET LIST — users/{uid}/bucketList/{itemId}
// ═══════════════════════════════════════════════════════════════════════════════

export interface BucketListItem {
    id: string;
    name: string;
    type: string;
    image?: string;
    location?: string;
    createdAt?: any;
}

export async function toggleBucketListItem(uid: string, item: BucketListItem): Promise<void> {
    const ref = doc(db, 'users', uid, 'bucketList', item.id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        await deleteDoc(ref);
    } else {
        await setDoc(ref, {
            ...item,
            createdAt: serverTimestamp(),
        });
    }
}

export async function getUserBucketList(uid: string): Promise<BucketListItem[]> {
    try {
        const q = query(
            collection(db, 'users', uid, 'bucketList'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ ...d.data() } as BucketListItem));
    } catch {
        return [];
    }
}

// ─── TRIP PROGRESS & BUCKET LIST ─────────────────────────────────────────────

export async function getStampByDestination(uid: string, destId: string): Promise<PassportStampDoc | null> {
    const q = query(
        collection(db, 'users', uid, 'passport', 'stamps', 'entries'),
        orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const stamps = snap.docs.map(d => d.data() as PassportStampDoc);
    const match = stamps.find(s => s.location.toLowerCase() === destId.toLowerCase() || s.name.toLowerCase() === destId.toLowerCase());
    return match || null;
}

export async function saveActiveTripProgress(uid: string, tripId: string, checkpointState: any) {
    const ref = doc(db, 'users', uid, 'trips', tripId);
    await setDoc(ref, {
        checkpointState,
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

export async function getActiveTripProgress(uid: string, tripId: string): Promise<any | null> {
    const snap = await getDoc(doc(db, 'users', uid, 'trips', tripId));
    return snap.exists() ? snap.data().checkpointState : null;
}

export { db };


// ═══════════════════════════════════════════════════════════════════════════════
// PERSONALIZATION — users/{uid}/personalization/signals + taste
// ═══════════════════════════════════════════════════════════════════════════════

import type {
    PersonalizationSignalsDoc,
    PersonalizationTasteDoc,
} from './firestoreSchema';

export async function savePersonalizationSignals(uid: string, signals: {
    timeOnCity: Record<string, number>;
    clickedCategories: string[];
    deepDiveVibes: Array<{ dest: string; companion: string; vibe: string }>;
    viewedDestinations: string[];
}) {
    try {
        const ref = doc(db, 'users', uid, 'personalization', 'signals');
        await setDoc(ref, {
            ...signals,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        console.error('[Personalization] Failed to save signals:', err);
    }
}

export async function getPersonalizationSignals(uid: string): Promise<PersonalizationSignalsDoc | null> {
    try {
        const snap = await getDoc(doc(db, 'users', uid, 'personalization', 'signals'));
        return snap.exists() ? (snap.data() as PersonalizationSignalsDoc) : null;
    } catch {
        return null;
    }
}

export async function savePersonalizationTaste(uid: string, vector: number[]) {
    try {
        const ref = doc(db, 'users', uid, 'personalization', 'taste');
        await setDoc(ref, {
            vector,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        console.error('[Personalization] Failed to save taste vector:', err);
    }
}

export async function getPersonalizationTaste(uid: string): Promise<PersonalizationTasteDoc | null> {
    try {
        const snap = await getDoc(doc(db, 'users', uid, 'personalization', 'taste'));
        return snap.exists() ? (snap.data() as PersonalizationTasteDoc) : null;
    } catch {
        return null;
    }
}
