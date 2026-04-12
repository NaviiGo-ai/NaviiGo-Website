import { app } from './firebase';
import {
    getFirestore,
    doc,
    setDoc,
    onSnapshot,
    collection,
    updateDoc,
    increment,
    serverTimestamp,
} from 'firebase/firestore';

export const db = getFirestore(app);

/**
 * Save a shared itinerary to Firestore.
 * Returns the shareId (UUID).
 */
export async function saveSharedItinerary(shareId: string, data: {
    form: Record<string, unknown>;
    customPlans: unknown[];
    destName: string;
}) {
    await setDoc(doc(db, 'itineraries', shareId), {
        ...data,
        collaborators: 1,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    });
    return shareId;
}

/**
 * Update an existing shared itinerary's plans.
 */
export async function updateSharedPlans(shareId: string, customPlans: unknown[]) {
    await updateDoc(doc(db, 'itineraries', shareId), {
        customPlans,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Increment the collaborator count for a session.
 */
export async function joinSharedItinerary(shareId: string) {
    try {
        await updateDoc(doc(db, 'itineraries', shareId), {
            collaborators: increment(1),
        });
    } catch {
        // Document may not exist yet
    }
}

/**
 * Subscribe to real-time updates for a shared itinerary.
 * Returns an unsubscribe function.
 */
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
