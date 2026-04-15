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
    const snap = await getDoc(ref);

    if (snap.exists()) {
        await updateDoc(ref, {
            displayName: data.displayName,
            email: data.email,
            photoURL: data.photoURL,
            lastLogin: serverTimestamp(),
        });
    } else {
        await setDoc(ref, {
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
    const snap = await getDoc(ref);
    if (snap.exists()) {
        await updateDoc(ref, { ...prefs, updatedAt: serverTimestamp() });
    } else {
        await setDoc(ref, {
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
    const docRef = await addDoc(colRef, {
        ...data,
        isActive: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', uid), { totalTrips: increment(1) });
    return docRef.id;
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
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data() as TrackingSession;
    const activities = [...data.activities];
    activities[activityIndex] = {
        ...activities[activityIndex],
        status,
        completedAt: status === 'completed' ? Timestamp.now() : null,
        completionMethod: method,
    };

    const completedCount = activities.filter(a => a.status === 'completed').length;

    await updateDoc(ref, {
        activities,
        completedCount,
        lastUpdatedAt: serverTimestamp(),
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
    destName: string;
}, ownerUid?: string) {
    await setDoc(doc(db, 'itineraries', shareId), {
        ...data,
        ownerUid: ownerUid || null,
        collaborators: 1,
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

export async function joinSharedItinerary(shareId: string) {
    try {
        await updateDoc(doc(db, 'itineraries', shareId), {
            collaborators: increment(1),
        });
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

export { db };
