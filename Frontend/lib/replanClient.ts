import { auth } from './firebase';
import { getOwnerItinerary, type OwnerItinerary } from './firestore';

export type ReplanAction = { actionType: string; activityId?: string; rationale: string; targetDate?: string; replacementActivity?: { name?: string; title?: string } };
export type ReplanProposal = { proposalId: string; itineraryId: string; ownerUid: string; operationId: string; baseRevisionId: string; currentDayNumber: number; summary: string; actions: ReplanAction[]; warnings?: string[] };
export type ReplanInput = { itineraryId: string; operationId: string; baseRevisionId: string; currentDayNumber: number; currentTime: string; destinationTimezone: string; reason: 'I_AM_TIRED'; completedActivityIds: string[]; skippedActivityIds: string[] };
export class ReplanError extends Error {
    constructor(public code: string, message: string) { super(message); }
}
const owned = (uid: string) => { if (auth?.currentUser?.uid !== uid) throw new ReplanError('ACCOUNT_CHANGED', 'Your account changed. Open the itinerary again.'); };

export function canChangeItinerary(itinerary: OwnerItinerary) {
    const status = String(itinerary.status || (itinerary.generatedData as Record<string, unknown> | undefined)?.status || '').toLowerCase();
    if (['completed', 'cancelled', 'canceled'].includes(status)) throw new ReplanError('TRIP_TERMINAL', 'This journey has ended. It can be viewed but cannot be changed.');
}

export async function readReplanOwner(uid: string, id: string) {
    owned(uid);
    const itinerary = await getOwnerItinerary(uid, id);
    owned(uid);
    if (!itinerary?.generatedData) throw new ReplanError('ITINERARY_NOT_FOUND', 'A saved itinerary is required.');
    if (!itinerary.revisionId) throw new ReplanError('ACTIVITY_IDENTITY_AMBIGUOUS', 'This older itinerary has no saved revision and cannot safely be replanned.');
    canChangeItinerary(itinerary);
    return itinerary;
}

async function post(uid: string, path: string, body: object) {
    owned(uid);
    const token = await auth?.currentUser!.getIdTokenResult();
    owned(uid);
    if (!token?.token || token.claims.sub !== uid || (token.claims.user_id != null && token.claims.user_id !== uid)) throw new ReplanError('ACCOUNT_CHANGED', 'The sign-in token could not be verified.');
    let response: Response;
    try { response = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${token.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
    catch { owned(uid); throw new ReplanError('REPLAN_UNCONFIRMED', 'The outcome is unconfirmed. Retry to check the same operation.'); }
    owned(uid);
    const data = await response.json();
    owned(uid);
    if (!response.ok) throw new ReplanError(data.code || 'REPLAN_FAILED', data.error || 'The itinerary could not be changed.');
    return data;
}

/** Bind manual/recorded progress to immutable IDs, never names or list positions. */
export function replanProgress(data: Record<string, unknown>) {
    const days = data.dayPlans as { day?: number; dayNumber?: number; activities: { activityId?: string; status?: string }[] }[];
    if (!Array.isArray(days) || !days.length) throw new ReplanError('ACTIVITY_IDENTITY_AMBIGUOUS', 'This older itinerary cannot safely be replanned.');
    const ids = new Set<string>();
    const completedActivityIds: string[] = [], skippedActivityIds: string[] = [];
    for (const day of days) {
        if (!Array.isArray(day.activities)) throw new ReplanError('ACTIVITY_IDENTITY_AMBIGUOUS', 'Activity identities are missing.');
        for (const act of day.activities) {
            if (!act.activityId || ids.has(act.activityId)) throw new ReplanError('ACTIVITY_IDENTITY_AMBIGUOUS', 'This older itinerary has missing or repeated activity identities.');
            ids.add(act.activityId);
            if (act.status === 'completed') completedActivityIds.push(act.activityId);
            if (act.status === 'skipped') skippedActivityIds.push(act.activityId);
        }
    }
    return { completedActivityIds, skippedActivityIds };
}

export async function requestReplan(uid: string, input: ReplanInput): Promise<ReplanProposal> {
    const data = await post(uid, '/api/itinerary/replan', input);
    const proposal = data.proposal as ReplanProposal;
    if (data.success !== true || !proposal || typeof proposal.proposalId !== 'string' || !proposal.proposalId.trim() || proposal.ownerUid !== uid || proposal.itineraryId !== input.itineraryId || proposal.operationId !== input.operationId || proposal.baseRevisionId !== input.baseRevisionId || proposal.currentDayNumber !== input.currentDayNumber || !Array.isArray(proposal.actions)) throw new ReplanError('INVALID_RECEIPT', 'The proposal identity could not be confirmed.');
    return proposal;
}

export async function acceptReplan(uid: string, proposal: ReplanProposal, operationId: string): Promise<OwnerItinerary> {
    // Replays must reach the backend even if a prior attempt already advanced the revision.
    const data = await post(uid, '/api/itinerary/replan/accept', { itineraryId: proposal.itineraryId, proposalId: proposal.proposalId, baseRevisionId: proposal.baseRevisionId, operationId });
    const r = data.receipt;
    if (data.success !== true || !r || r.status !== 'accepted' || r.ownerUid !== uid || r.itineraryId !== proposal.itineraryId || r.proposalId !== proposal.proposalId || r.operationId !== operationId || r.previousRevisionId !== proposal.baseRevisionId || typeof r.revisionId !== 'string') throw new ReplanError('INVALID_RECEIPT', 'The saved change could not be confirmed.');
    const owner = await getOwnerItinerary(uid, proposal.itineraryId);
    owned(uid);
    const receipts = (owner as (OwnerItinerary & { acceptanceReceipts?: Record<string, Record<string, unknown>> }) | null)?.acceptanceReceipts;
    const stored = receipts?.[operationId];
    // A historical accepted operation can be replayed after a later revision.
    // Confirm its saved receipt while displaying the latest authoritative plan.
    if (!owner?.generatedData || !Array.isArray(owner.generatedData.dayPlans) || !owner.revisionId || owner.generatedData.revisionId !== owner.revisionId || !stored || ['status', 'ownerUid', 'itineraryId', 'proposalId', 'operationId', 'previousRevisionId', 'revisionId'].some(key => stored[key] !== r[key])) throw new ReplanError('REFRESH_UNCONFIRMED', 'The change was accepted, but the latest itinerary could not be loaded. Retry to refresh it.');
    return owner;
}
