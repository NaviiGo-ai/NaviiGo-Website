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
    Timestamp,
    addDoc,
    arrayUnion,
    runTransaction,
} from 'firebase/firestore';
import type {
    UserProfile,
    UserPreferences,
    Booking,
    SavedItineraryDoc,
    TrackingSession,
    LocationPoint,
    PassengerInfo,
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

export async function addRecentSearch(uid: string, search: {
    query: string;
    type: 'flights' | 'hotels' | 'trains' | 'cabs';
    from?: string;
    to?: string;
}) {
    const prefs = await getUserPreferences(uid);
    const existing = prefs?.recentSearches ?? [];
    const updated = [
        { ...search, timestamp: Timestamp.now() },
        ...existing.slice(0, 9), // keep last 10
    ];
    await updateUserPreferences(uid, { recentSearches: updated } as any);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKINGS — users/{uid}/bookings/{bookingId}
// ═══════════════════════════════════════════════════════════════════════════════

export async function createBooking(uid: string, booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const colRef = collection(db, 'users', uid, 'bookings');
    const docRef = await addDoc(colRef, {
        ...booking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    // Update user stats
    await updateDoc(doc(db, 'users', uid), { totalBookings: increment(1) });
    return docRef.id;
}

export async function updateBookingStatus(uid: string, bookingId: string, status: Booking['status'], pnr?: string) {
    const ref = doc(db, 'users', uid, 'bookings', bookingId);
    const update: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
    if (pnr) update.pnr = pnr;
    await updateDoc(ref, update);
}

export async function getUserBookings(uid: string): Promise<Booking[]> {
    const q = query(
        collection(db, 'users', uid, 'bookings'),
        orderBy('createdAt', 'desc'),
        limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAVED ITINERARIES — users/{uid}/itineraries/{itineraryId}
// ═══════════════════════════════════════════════════════════════════════════════

export async function saveItineraryToFirestore(uid: string, data: {
    destId: string;
    destName: string;
    form: Record<string, unknown>;
    generatedData: Record<string, unknown> | null;
}): Promise<string> {
    const colRef = collection(db, 'users', uid, 'itineraries');

    // Check Firebase for an existing itinerary with the same destId + purpose + startDate
    const allSnap = await getDocs(colRef);
    const startDate = (data.form?.startDate as string) || '';
    const purpose = (data.form?.purpose as string) || '';
    
    let existingDocId: string | null = null;
    allSnap.forEach((d) => {
        const existing = d.data();
        const existingForm = existing.form as Record<string, unknown> | undefined;
        if (
            existing.destId === data.destId &&
            (existingForm?.purpose || '') === purpose &&
            (existingForm?.startDate || '') === startDate
        ) {
            existingDocId = d.id;
        }
    });

    if (existingDocId) {
        // Update existing doc — don't duplicate, don't re-increment totalTrips
        const ref = doc(db, 'users', uid, 'itineraries', existingDocId);
        await setDoc(ref, {
            ...data,
            updatedAt: serverTimestamp(),
        }, { merge: true });
        return existingDocId;
    } else {
        // First save — new unique ID via addDoc, increment trip count
        const newRef = await addDoc(colRef, {
            ...data,
            isActive: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'users', uid), { totalTrips: increment(1) });
        return newRef.id;
    }
}

export async function getUserItineraries(uid: string): Promise<SavedItineraryDoc[]> {
    const q = query(
        collection(db, 'users', uid, 'itineraries'),
        orderBy('createdAt', 'desc'),
        limit(20)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedItineraryDoc));
}

export async function setActiveItinerary(uid: string, itineraryId: string) {
    // Deactivate all others first (in practice, query + batch)
    const all = await getUserItineraries(uid);
    for (const itin of all) {
        if (itin.isActive) {
            await updateDoc(doc(db, 'users', uid, 'itineraries', itin.id), { isActive: false });
        }
    }
    // Activate this one
    await updateDoc(doc(db, 'users', uid, 'itineraries', itineraryId), {
        isActive: true,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteItineraryFromFirestore(uid: string, itineraryId: string) {
    await deleteDoc(doc(db, 'users', uid, 'itineraries', itineraryId));
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
    await setDoc(doc(db, 'itineraries', shareId), {
        ...data,
        ownerUid: ownerUid || null,
        collaborators: 1,
        invitedUsers: ownerEmail ? [ownerEmail] : [],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    });
    return shareId;
}

export async function updateSharedPlans(shareId: string, customPlans: unknown[]) {
    await updateDoc(doc(db, 'itineraries', shareId), {
        customPlans,
        updatedAt: serverTimestamp(),
    });
}

export async function joinSharedItinerary(shareId: string, userEmail?: string) {
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
    return onSnapshot(
        doc(db, 'itineraries', shareId),
        (snap) => {
            if (snap.exists()) {
                onUpdate(snap.data() as any);
            }
        },
        () => onError?.()
    );
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
