'use client';
import { useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import { acceptReplan, readReplanOwner, replanProgress, requestReplan, ReplanError, type ReplanInput, type ReplanProposal } from '@/lib/replanClient';
import type { OwnerItinerary } from '@/lib/firestore';

export default function ReplanCard({ uid, itineraryId, dayNumber, onSaved }: { uid: string; itineraryId: string; dayNumber: number; onSaved: (owner: OwnerItinerary) => void }) {
    const [time, setTime] = useState('');
    const [timezone, setTimezone] = useState('');
    const [proposal, setProposal] = useState<ReplanProposal | null>(null);
    const [activityNames, setActivityNames] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [retryRequest, setRetryRequest] = useState(false);
    const [retryAccept, setRetryAccept] = useState(false);
    const [message, setMessage] = useState('');
    const locked = useRef(false);
    const pendingRequest = useRef<ReplanInput | null>(null);
    const acceptOperation = useRef<string | null>(null);
    const current = () => auth?.currentUser?.uid === uid;
    async function run(accept: boolean) {
        if (locked.current || !current()) return;
        locked.current = true; setBusy(true); setMessage('');
        try {
            if (accept && proposal) {
                acceptOperation.current ||= crypto.randomUUID(); setRetryAccept(true);
                const saved = await acceptReplan(uid, proposal, acceptOperation.current);
                if (!current()) return;
                onSaved(saved); setProposal(null); pendingRequest.current = null; acceptOperation.current = null;
                setRetryRequest(false); setRetryAccept(false); setMessage('Your updated itinerary is saved.');
            } else {
                if (!pendingRequest.current) {
                    // A fresh owner read supplies the revision and progress. A retry reuses the exact request.
                    const owner = await readReplanOwner(uid, itineraryId);
                    if (!owner.revisionId) throw new ReplanError('ACTIVITY_IDENTITY_AMBIGUOUS', 'A saved itinerary revision is required.');
                    const progress = replanProgress(owner.generatedData as Record<string, unknown>);
                    const days = owner.generatedData?.dayPlans as { activities: { activityId: string; name?: string; title?: string }[] }[];
                    setActivityNames(Object.fromEntries(days.flatMap(day => day.activities.map(activity => [activity.activityId, activity.name || activity.title || 'Saved activity']))));
                    pendingRequest.current = { itineraryId, operationId: crypto.randomUUID(), baseRevisionId: owner.revisionId, currentDayNumber: dayNumber, currentTime: time, destinationTimezone: timezone.trim(), reason: 'I_AM_TIRED', ...progress };
                }
                setRetryRequest(true);
                const savedProposal = await requestReplan(uid, pendingRequest.current);
                if (current()) setProposal(savedProposal);
            }
        } catch (error) {
            if (!current()) return;
            const code = error instanceof ReplanError ? error.code : 'REPLAN_UNCONFIRMED';
            setMessage(error instanceof Error ? error.message : 'The outcome could not be confirmed. Retry the same operation.');
            if (['STALE_PROPOSAL', 'ACTIVITY_IDENTITY_AMBIGUOUS', 'TRIP_TERMINAL', 'VALIDATION_ERROR', 'REPLAN_VALIDATION_ERROR', 'IDEMPOTENCY_CONFLICT'].includes(code)) {
                pendingRequest.current = null; acceptOperation.current = null; setProposal(null); setRetryRequest(false); setRetryAccept(false);
                if (code === 'STALE_PROPOSAL') {
                    const owner = await readReplanOwner(uid, itineraryId).catch(() => null);
                    if (owner && current()) onSaved(owner);
                }
            }
        } finally { locked.current = false; if (current()) setBusy(false); }
    }
    return <section className="mb-6 rounded-2xl border border-[#EADFD4] bg-paper-light p-5 text-naviigo-brown" aria-label="Adjust your day">
        <h2 className="text-lg font-bold">Need a slower day?</h2>
        <p className="mt-1 text-sm">Review a lighter plan for Day {dayNumber}. Your saved itinerary changes only when you accept.</p>
        {!proposal ? <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm">Current time at your destination<input aria-label="Destination time" type="time" value={time} disabled={busy || retryRequest} onChange={e => setTime(e.target.value)} className="mt-1 block rounded-lg border p-2 bg-transparent" /></label>
            <label className="text-sm">Destination timezone<input aria-label="Destination timezone" placeholder="e.g. Asia/Kolkata" value={timezone} disabled={busy || retryRequest} onChange={e => setTimezone(e.target.value)} className="mt-1 block rounded-lg border p-2 bg-transparent" /></label>
            <button type="button" disabled={busy || (!retryRequest && (!time || !timezone.trim()))} onClick={() => void run(false)} className="rounded-lg bg-naviigo-teal text-white px-4 py-2 disabled:opacity-50">{busy ? 'Checking…' : retryRequest ? 'Retry proposal' : 'I’m tired — suggest changes'}</button>
        </div> : <div className="mt-4 space-y-3">
            <p className="font-semibold">{proposal.summary}</p>
            <ul className="space-y-2 text-sm">{proposal.actions.map((action, index) => <li key={`${action.activityId || 'end'}:${index}`}><strong>{action.actionType.replaceAll('_', ' ').toLowerCase()}</strong>{action.activityId ? `: ${activityNames[action.activityId] || 'Saved activity'}` : ''}{action.targetDate ? ` → ${action.targetDate}` : ''}{action.replacementActivity ? ` → ${action.replacementActivity.name || action.replacementActivity.title || 'replacement'}` : ''} — {action.rationale}</li>)}</ul>
            {proposal.warnings?.map((warning, index) => <p key={index} className="text-sm">{warning}</p>)}
            <div className="flex gap-3"><button type="button" disabled={busy} onClick={() => void run(true)} className="rounded-lg bg-naviigo-teal px-4 py-2 text-white disabled:opacity-50">{busy ? 'Confirming save…' : retryAccept ? 'Retry acceptance' : 'Accept and save'}</button>
                <button type="button" disabled={busy || retryAccept} onClick={() => { setProposal(null); pendingRequest.current = null; setRetryRequest(false); setMessage('Your saved itinerary is unchanged.'); }} className="rounded-lg border px-4 py-2 disabled:opacity-50">Keep original</button></div>
        </div>}
        {message && <p className="mt-3 text-sm" role="status">{message}</p>}
    </section>;
}
