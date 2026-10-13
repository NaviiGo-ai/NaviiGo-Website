import { auth, db } from './firebase';
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

function assertCurrentOwner(uid: string) {
    if (!uid || !auth?.currentUser || auth.currentUser.uid !== uid) {
        throw new Error('The signed-in account changed before this save completed.');
    }
}

export async function saveItineraryToFirestore(uid: string, data: {
    destId: string;
    destName: string;
    form: Record<string, unknown>;
    generatedData: Record<string, unknown> | null;
    id?: string;
    uuid?: string;
}): Promise<string> {
    if (!db || !uid) throw new Error('Owner persistence is unavailable.');
    assertCurrentOwner(uid);

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

    if (!stableId) stableId = crypto.randomUUID();
    const lockKey = `${uid}:${stableId}`;
    if (inFlightSaves.has(lockKey)) {
        return inFlightSaves.get(lockKey)!;
    }

    const savePromise = (async (): Promise<string> => {
        try {
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

            // Recheck after owner reads, before dispatching an account-bound write.
            assertCurrentOwner(uid);
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

            assertCurrentOwner(uid);
            return stableId;
        } catch (err) {
            console.warn('[Firestore] saveItineraryToFirestore error:', err);
            throw err;
        }
    })();

    inFlightSaves.set(lockKey, savePromise);
    try {
        return await savePromise;
    } finally {
        inFlightSaves.delete(lockKey);
    }
}


export type OwnerItinerary = SavedItineraryDoc & {
    userId: string;
    ownerUid: string;
    isPublic: false;
    publicShareId?: string | null;
    revisionId?: string;
    status?: string;
};

function ownerItineraryData(uid: string, id: string, data: Record<string, unknown>): OwnerItinerary {
    for (const owner of [data.userId, data.ownerUid]) {
        if (owner != null && owner !== uid) throw new Error('The owner itinerary has mismatched ownership.');
    }
    const form = data.form && typeof data.form === 'object' && !Array.isArray(data.form)
        ? data.form as Record<string, unknown> : {};
    const generatedData = data.generatedData && typeof data.generatedData === 'object' && !Array.isArray(data.generatedData)
        ? data.generatedData as Record<string, unknown> : null;
    return {
        ...data,
        id,
        destId: typeof data.destId === 'string' ? data.destId : typeof form.destination === 'string' ? form.destination : '',
        destName: typeof data.destName === 'string' ? data.destName : typeof form.destName === 'string' ? form.destName : 'Saved trip',
        form,
        generatedData,
        createdAt: data.createdAt as Timestamp,
        updatedAt: data.updatedAt as Timestamp,
        isActive: data.isActive === true,
        userId: uid,
        ownerUid: uid,
        isPublic: false,
        publicShareId: typeof data.publicShareId === 'string' ? data.publicShareId : null,
        revisionId: typeof data.revisionId === 'string' ? data.revisionId : undefined,
        status: typeof data.status === 'string' ? data.status : undefined,
    };
}

/** Private authority: never fall back to a public projection or another owner. */
export async function getOwnerItinerary(uid: string, itineraryId: string): Promise<OwnerItinerary | null> {
    assertCurrentOwner(uid);
    const snapshot = await getDoc(doc(db, 'users', uid, 'itineraries', itineraryId));
    assertCurrentOwner(uid);
    return snapshot.exists() ? ownerItineraryData(uid, itineraryId, snapshot.data()) : null;
}

/** A saved generation can be replayed after replanning without reverting the owner revision. */
export function confirmsGenerationReceipt(owner: OwnerItinerary, receipt: Record<string, unknown>): boolean {
    if (!owner.revisionId || !owner.generatedData || receipt.status !== 'committed' || receipt.ownerUid !== owner.ownerUid || receipt.itineraryId !== owner.id || receipt.operationId !== owner.id) return false;
    if (owner.revisionId === receipt.revisionId) return true;
    const raw = owner as OwnerItinerary & { receipt?: Record<string, unknown>; generationReceipt?: Record<string, unknown> };
    return [raw.receipt, raw.generationReceipt].some(stored => stored && ['status', 'ownerUid', 'itineraryId', 'operationId', 'revisionId'].every(key => stored[key] === receipt[key]));
}

export async function getUserItineraries(uid: string): Promise<SavedItineraryDoc[]> {
    assertCurrentOwner(uid);
    const snapshot = await getDocs(collection(db, 'users', uid, 'itineraries'));
    assertCurrentOwner(uid);
    const items = snapshot.docs.map((entry) => ownerItineraryData(uid, entry.id, entry.data()));
    const timestamp = (value: Timestamp | undefined) => value?.toMillis?.() ?? 0;
    items.sort((left, right) =>
        (timestamp(right.updatedAt) || timestamp(right.createdAt)) -
        (timestamp(left.updatedAt) || timestamp(left.createdAt)));
    // Separate operation IDs are separate trips, even for identical destinations
    // and dates. Reading history must never mutate or delete owner records.
    return items.slice(0, 30);
}

export async function setActiveItinerary(uid: string, itineraryId: string) {
    assertCurrentOwner(uid);
    const target = doc(db, 'users', uid, 'itineraries', itineraryId);
    // Starting is one confirmed owner write. Never silently end a different journey.
    const all = await getUserItineraries(uid);
    if (all.some(itinerary => itinerary.isActive && itinerary.id !== itineraryId)) throw new Error('End your other active journey before starting this one.');
    await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(target);
        assertCurrentOwner(uid);
        if (!snapshot.exists() || !snapshot.data().generatedData) throw new Error('A saved itinerary is required.');
        const data = snapshot.data();
        ownerItineraryData(uid, itineraryId, data);
        const status = String(data.status || data.generatedData?.status || '').toLowerCase();
        if (['completed', 'cancelled', 'canceled'].includes(status)) throw new Error('This journey has ended and cannot be restarted.');
        transaction.update(target, { isActive: true, status: 'active', ...(data.startedAt ? {} : { startedAt: serverTimestamp() }), updatedAt: serverTimestamp() });
    });
    assertCurrentOwner(uid);
}

export async function deleteItineraryFromFirestore(uid: string, itineraryId: string) {
    assertCurrentOwner(uid);
    await deleteDoc(doc(db, 'users', uid, 'itineraries', itineraryId));
}

export async function cancelActiveItinerary(uid: string, itineraryId: string) {
    assertCurrentOwner(uid);
    const ref = doc(db, 'users', uid, 'itineraries', itineraryId);
    const trackingRef = doc(db, 'users', uid, 'tracking', itineraryId);
    await runTransaction(db, async transaction => {
        const owner = await transaction.get(ref);
        const tracking = await transaction.get(trackingRef);
        assertCurrentOwner(uid);
        if (!owner.exists()) throw new Error('The saved journey was not found.');
        ownerItineraryData(uid, itineraryId, owner.data());
        const status = String(owner.data().status || '').toLowerCase();
        if (['completed', 'cancelled', 'canceled'].includes(status)) return;
        if (status !== 'active') throw new Error('This journey is not active.');
        transaction.update(ref, { isActive: false, status: 'cancelled', endedAt: serverTimestamp(), updatedAt: serverTimestamp() });
        if (tracking.exists()) transaction.update(trackingRef, { isActive: false, lastUpdatedAt: serverTimestamp() });
    });
    assertCurrentOwner(uid);
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

type PublicShareInput = {
    form: Record<string, unknown>;
    generatedData: unknown;
    destName: string;
};

function publicValue(field: string, value: unknown, depth: number): unknown {
    if (typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (depth > 4) return undefined;
    if (field === 'location') return publicFields(value, ['name', 'address', 'city', 'lat', 'lng', 'latitude', 'longitude'], depth + 1);
    if (field === 'mapCenter') return publicFields(value, ['lat', 'lng'], depth + 1);
    const weatherFields = ['temp', 'temperature', 'feelsLike', 'condition', 'description', 'icon', 'high', 'low', 'humidity', 'windSpeed', 'rainChance', 'source', 'updatedAt', 'date', 'forecast', 'daily'];
    if (field === 'weather') return publicFields(value, weatherFields, depth + 1);
    if ((field === 'forecast' || field === 'daily') && Array.isArray(value)) {
        return value.slice(0, 14).map((entry) => publicFields(entry, weatherFields, depth + 1));
    }
    return undefined;
}

function publicFields(value: unknown, fields: string[], depth = 0): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const field of fields) {
        const safeValue = publicValue(field, source[field], depth);
        if (safeValue !== undefined) result[field] = safeValue;
    }
    return result;
}

function publicFormData(form: Record<string, unknown>) {
    return publicFields(form, ['destination', 'destName', 'startDate', 'endDate', 'days']);
}

function publicActivityData(activity: unknown) {
    return publicFields(activity, [
        'activityId', 'id', 'name', 'title', 'desc', 'description', 'time',
        'type', 'duration', 'location', 'lat', 'lng', 'img', 'placeId',
    ]);
}

function publicItineraryData(generatedData: unknown) {
    const source = generatedData && typeof generatedData === 'object'
        ? generatedData as Record<string, unknown>
        : {};
    const result = publicFields(source, [
        'description', 'avgCost', 'weather', 'crowdLevel', 'crowdNote',
        'mapCenter',
    ]);

    for (const key of ['highlights', 'restaurants', 'hotels']) {
        const value = source[key];
        if (Array.isArray(value)) {
            result[key] = value.map((item) => publicFields(item, [
                'name', 'title', 'description', 'desc', 'type', 'rating',
                'lat', 'lng', 'img', 'image', 'location', 'price', 'cuisine',
            ]));
        }
    }

    if (Array.isArray(source.dayPlans)) {
        result.dayPlans = source.dayPlans.map((day) => {
            const dayData = publicFields(day, ['day', 'dayNumber', 'title', 'theme', 'date']);
            if (day && typeof day === 'object' && Array.isArray((day as Record<string, unknown>).activities)) {
                dayData.activities = ((day as Record<string, unknown>).activities as unknown[])
                    .map(publicActivityData);
            }
            return dayData;
        });
    }

    return result;
}

function publicShareData(input: PublicShareInput) {
    return {
        form: publicFormData(input.form),
        generatedData: publicItineraryData(input.generatedData),
        destName: input.destName,
    };
}

export async function saveSharedItinerary(shareId: string, data: {
    form: Record<string, unknown>;
    customPlans: unknown[];
    generatedData?: any;
    destName: string;
}, ownerUid?: string, ownerEmail?: string) {
    if (!ownerUid) throw new Error('Sign in is required before sharing an itinerary.');
    return createPublicShare(ownerUid, shareId, {
        form: data.form,
        generatedData: data.generatedData ?? { dayPlans: data.customPlans },
        destName: data.destName,
    });
}

export async function updateSharedPlans(shareId: string, customPlans: unknown[]) {
    throw new Error(
        `Public share ${shareId} is immutable; create a new owner-authorized projection instead.`
    );
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
    if (!db || !uuid) throw new Error('An itinerary operation ID is required.');
    const uid = data.userId || (data.form?.userId as string);
    if (!uid) throw new Error('Sign in is required before saving an itinerary.');
    return saveItineraryToFirestore(uid, {
        id: uuid,
        uuid,
        destId: (data.form?.destination as string) || (data.form?.destId as string) || 'india',
        destName: data.destName,
        form: { ...data.form, uuid, _uuid: uuid },
        generatedData: data.generatedData,
    });
}

export async function getItineraryByUUID(uuid: string): Promise<{
    form: Record<string, unknown>;
    generatedData: any;
    destName: string;
    userId?: string | null;
    isPublic?: boolean;
    publicShareId?: string | null;
} | null> {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, 'itineraries', uuid));
        if (!snap.exists()) return null;
        const data = snap.data() as any;
        if (data.shareProjection !== true || data.isPublic !== true) return null;
        if (data.expiresAt && data.expiresAt.toMillis?.() <= Date.now()) return null;
        return {
            form: data.form ?? {},
            generatedData: data.generatedData ?? null,
            destName: data.destName ?? 'India Expedition',
            isPublic: true,
            shareProjection: true,
        } as any;
    } catch (err) {
        console.warn('[Firestore] getItineraryByUUID failed:', err);
        return null;
    }
}

export async function createPublicShare(
    uid: string,
    requestedShareId: string,
    projection: PublicShareInput,
    ownerItineraryId: string = String(projection.form.uuid || projection.form._uuid || requestedShareId),
) {
    assertCurrentOwner(uid);
    const ownerRef = doc(db, 'users', uid, 'itineraries', ownerItineraryId);
    const shareId = await runTransaction(db, async (transaction) => {
        const owner = await transaction.get(ownerRef);
        if (!owner.exists()) throw new Error('Save the owner itinerary before sharing it.');
        const data = ownerItineraryData(uid, ownerItineraryId, owner.data());
        if (!data.generatedData) throw new Error('An unconfirmed preview cannot be shared.');
        const resolvedShareId = data.publicShareId || requestedShareId;
        const ref = doc(db, 'itineraries', resolvedShareId);
        const existing = await transaction.get(ref);
        if (existing.exists() && (existing.data().ownerUid !== uid || existing.data().shareProjection !== true)) {
            throw new Error('You do not own this public share.');
        }
        assertCurrentOwner(uid);
        const safeProjection = publicShareData({ form: data.form, generatedData: data.generatedData, destName: data.destName });
        transaction.set(ref, {
            ...safeProjection,
            shareId: resolvedShareId,
            shareProjection: true,
            isPublic: true,
            ownerUid: uid,
            createdAt: existing.data()?.createdAt ?? serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        transaction.update(ownerRef, { publicShareId: resolvedShareId, isPublic: false, updatedAt: serverTimestamp() });
        return resolvedShareId;
    });
    assertCurrentOwner(uid);
    const saved = await getDoc(doc(db, 'itineraries', shareId));
    assertCurrentOwner(uid);
    if (!saved.exists() || saved.data().isPublic !== true || saved.data().ownerUid !== uid) {
        throw new Error('The public share could not be acknowledged.');
    }
    return shareId;
}

export async function unsharePublicShare(uid: string, shareId: string, ownerItineraryId?: string | null) {
    assertCurrentOwner(uid);
    const ref = doc(db, 'itineraries', shareId);
    await runTransaction(db, async (transaction) => {
        const current = await transaction.get(ref);
        const ownerRef = ownerItineraryId ? doc(db, 'users', uid, 'itineraries', ownerItineraryId) : null;
        const owner = ownerRef ? await transaction.get(ownerRef) : null;
        if (current.exists() && current.data().ownerUid !== uid) throw new Error('You do not own this public share.');
        assertCurrentOwner(uid);
        if (current.exists()) transaction.delete(ref);
        if (ownerRef && owner?.exists() && owner.data().publicShareId === shareId) {
            transaction.update(ownerRef, { publicShareId: null, isPublic: false, updatedAt: serverTimestamp() });
        }
    });
    assertCurrentOwner(uid);
    const remaining = await getDoc(ref);
    assertCurrentOwner(uid);
    if (remaining.exists()) throw new Error('The public share is still active.');
    return { status: 'removed' as const };
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
                const data = snap.data() as any;
                onUpdate(
                    snap.exists() && data.shareProjection === true && data.isPublic === true
                        ? data
                        : null
                );
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
    assertCurrentOwner(uid);
    const snap = await getDoc(doc(db, 'users', uid, 'passport', 'stats'));
    assertCurrentOwner(uid);
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
    assertCurrentOwner(uid);
    const q = query(collection(db, 'users', uid, 'passport', 'stamps', 'entries'), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    assertCurrentOwner(uid);
    return snap.docs.map(d => ({ ...d.data() } as PassportStampDoc));
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
