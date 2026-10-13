import type { OwnerItinerary } from './firestore';

/** The completion callback carries the private owner envelope, not a generated payload. */
export function generationResultForOwner(owner: OwnerItinerary, uid: string, itineraryId: string): Record<string, unknown> {
    if (!uid || owner.ownerUid !== uid || owner.userId !== uid || owner.id !== itineraryId || owner.isPublic !== false || !owner.revisionId || !owner.generatedData || !Array.isArray(owner.generatedData.dayPlans)) {
        throw new Error('The saved itinerary result does not match the current owner.');
    }
    return owner.generatedData;
}
