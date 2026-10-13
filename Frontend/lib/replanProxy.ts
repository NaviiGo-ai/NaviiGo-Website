import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, getProxyHeaders } from './rateLimit';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 200;

/** Forward only contract fields; the backend verifies the bearer token and owns proposals. */
export async function proxyReplan(req: NextRequest, accept: boolean) {
    const limited = applyRateLimit(req, 12, 60_000, 'itinerary-replan');
    if (limited) return limited;
    const fail = (code: string, status: number, error: string) => NextResponse.json({ success: false, code, error }, { status });
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ') || !authorization.slice(7).trim()) return fail('AUTH_REQUIRED', 401, 'Sign in to change your itinerary.');
    try {
        const body = await req.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('VALIDATION_ERROR', 400, 'Invalid replan request.');
        const operationId = body.operationId;
        const header = req.headers.get('idempotency-key');
        if (!text(operationId) || !uuid.test(operationId) || (header && header !== operationId) || !text(body.itineraryId) || !text(body.baseRevisionId)) return fail('VALIDATION_ERROR', 400, 'Invalid operation or itinerary identity.');
        const payload: Record<string, unknown> = { itineraryId: body.itineraryId, operationId, baseRevisionId: body.baseRevisionId };
        if (accept) {
            if (!text(body.proposalId)) return fail('VALIDATION_ERROR', 400, 'A saved proposal is required.');
            payload.proposalId = body.proposalId;
        } else {
            if (body.reason !== 'I_AM_TIRED' || !Number.isInteger(body.currentDayNumber) || body.currentDayNumber < 1 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.currentTime) || !text(body.destinationTimezone)) return fail('VALIDATION_ERROR', 400, 'Enter the destination time and timezone.');
            for (const key of ['completedActivityIds', 'skippedActivityIds']) {
                if (!Array.isArray(body[key]) || body[key].length > 500 || !body[key].every(text)) return fail('VALIDATION_ERROR', 400, 'Invalid activity identities.');
                payload[key] = body[key];
            }
            Object.assign(payload, { reason: body.reason, currentDayNumber: body.currentDayNumber, currentTime: body.currentTime, destinationTimezone: body.destinationTimezone });
        }
        const base = process.env.NEXT_PUBLIC_PYTHON_API_URL;
        if (!base && process.env.NODE_ENV === 'production') return fail('BACKEND_UNAVAILABLE', 503, 'Replanning is temporarily unavailable.');
        const response = await fetch(`${(base || 'http://localhost:8000').replace(/\/$/, '')}/api/itinerary/replan${accept ? '/accept' : ''}`, {
            method: 'POST', headers: { ...getProxyHeaders(req), Authorization: authorization, 'Content-Type': 'application/json', 'Idempotency-Key': operationId }, body: JSON.stringify(payload), cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) return fail(data.code || data.error?.code || data.detail?.code || 'REPLAN_FAILED', response.status, response.status >= 500 ? 'Replanning could not be confirmed. Retry the same operation.' : (typeof data.error === 'string' ? data.error : data.error?.message || data.detail?.message || 'The itinerary could not be changed.'));
        const record = accept ? data.receipt : data.proposal;
        if (data.success !== true || !record || record.operationId !== operationId || record.itineraryId !== body.itineraryId || !text(record.ownerUid) || (accept ? record.status !== 'accepted' || record.proposalId !== body.proposalId || !text(record.revisionId) : record.baseRevisionId !== body.baseRevisionId || !text(record.proposalId))) return fail('INVALID_RECEIPT', 502, 'The saved outcome could not be confirmed.');
        return NextResponse.json(data);
    } catch {
        return fail('REPLAN_UNCONFIRMED', 503, 'The outcome could not be confirmed. Retry the same operation.');
    }
}
