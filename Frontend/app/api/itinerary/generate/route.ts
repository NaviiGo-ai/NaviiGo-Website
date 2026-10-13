import { NextRequest, NextResponse } from 'next/server';
import {
    badRequest, validateString, validateNumber,
    KNOWN_GROUPS, KNOWN_PURPOSES,
} from '@/lib/validation';
import { applyRateLimit, getProxyHeaders } from '@/lib/rateLimit';

/**
 * POST /api/itinerary/generate
 *
 * This route is deliberately a proxy, not a second persistence layer. The
 * backend owns the durable write and must return a receipt before this route
 * reports a successful generation to the browser.
 */

// Canonical mappings for group and purpose to align UI options with backend engines.
const GROUP_CANONICAL_MAP: Record<string, string> = {
    solo: 'solo',
    couple: 'couple',
    duo: 'couple',
    family: 'family',
    friends: 'friends',
    large: 'large',
    caravan: 'large',
};

const PURPOSE_CANONICAL_MAP: Record<string, string> = {
    spiritual: 'spiritual',
    sacred: 'spiritual',
    leisure: 'leisure',
    slow: 'leisure',
    adventure: 'adventure',
    mountains: 'adventure',
    wildlife: 'adventure',
    cultural: 'cultural',
    heritage: 'cultural',
    culinary: 'cultural',
    honeymoon: 'honeymoon',
    celebrate: 'celebrate',
    nightlife: 'celebrate',
};

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(body: JsonObject, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(body, key);
}

function isUuidV4(value: unknown): value is string {
    return typeof value === 'string' && UUID_V4_PATTERN.test(value.trim());
}

function operationIdFromRequest(req: NextRequest, body: JsonObject): string | null {
    const bodyValue = body.operationId;
    const headerValue = req.headers.get('idempotency-key');
    const bodyOperationId = typeof bodyValue === 'string' ? bodyValue.trim().toLowerCase() : null;
    const headerOperationId = headerValue?.trim().toLowerCase() || null;

    // A request with both forms must still have exactly one operation identity.
    if (bodyOperationId && headerOperationId && bodyOperationId !== headerOperationId) {
        return null;
    }

    const operationId = bodyOperationId || headerOperationId;
    return isUuidV4(operationId) ? operationId.toLowerCase() : null;
}

/** Keep an explicitly supplied optional value intact, including null and ''. */
function optionalString(
    body: JsonObject,
    key: string,
    maxLength: number,
): { present: boolean; valid: boolean; value?: string | null } {
    if (!hasOwn(body, key)) return { present: false, valid: true };
    const raw = body[key];
    if (raw === null) return { present: true, valid: true, value: null };
    if (typeof raw !== 'string' || raw.length > maxLength) {
        return { present: true, valid: false };
    }
    return { present: true, valid: true, value: raw.trim() };
}

function optionalField(body: JsonObject, key: string): JsonObject {
    return hasOwn(body, key) ? { [key]: body[key] } : {};
}

function isDurablyPersisted(data: JsonObject, operationId: string): boolean {
    const persistence = isObject(data.persistence) ? data.persistence : null;
    const receipt = isObject(data.receipt) ? data.receipt : null;
    const itinerary = isObject(data.itinerary) ? data.itinerary : null;

    if (
        data.success !== true ||
        !itinerary ||
        !persistence ||
        persistence.status !== 'saved' ||
        persistence.durable !== true ||
        typeof persistence.replayed !== 'boolean' ||
        !receipt ||
        receipt.operationId !== operationId ||
        receipt.itineraryId !== operationId ||
        typeof receipt.ownerUid !== 'string' ||
        receipt.ownerUid.length === 0 ||
        typeof receipt.revisionId !== 'string' ||
        receipt.revisionId.length === 0 ||
        receipt.status !== 'committed' ||
        itinerary.id !== operationId
    ) {
        return false;
    }

    // These fields are informational in the response, but if the backend
    // includes them they must agree with the receipt rather than becoming a
    // second owner authority.
    if (typeof data.userId === 'string' && data.userId !== receipt.ownerUid) return false;
    if (typeof itinerary.userId === 'string' && itinerary.userId !== receipt.ownerUid) return false;
    return true;
}

function errorText(data: unknown, fallback: string): string {
    if (!isObject(data)) return fallback;
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
    if (typeof data.detail === 'string' && data.detail.trim()) return data.detail;
    return fallback;
}

export async function POST(req: NextRequest) {
    // 5 requests/min per IP — itinerary gen is the most expensive Gemini call.
    const limited = applyRateLimit(req, 5, 60_000, 'ai');
    if (limited) return limited;

    const authorization = req.headers.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
        console.warn('[Itinerary Proxy] Rejected: Missing or invalid Authorization Bearer header');
        return NextResponse.json(
            { success: false, error: 'Sign in is required to create an itinerary.' },
            { status: 401 },
        );
    }

    try {
        let parsedBody: unknown;
        try {
            parsedBody = await req.json();
        } catch {
            return badRequest('Request body must be valid JSON.');
        }
        if (!isObject(parsedBody)) {
            return badRequest('Request body must be a JSON object.');
        }
        const body = parsedBody;

        const operationId = operationIdFromRequest(req, body);
        if (!operationId) {
            console.warn('[Itinerary Proxy] Rejected: operationId must be one UUID v4 shared by body and header');
            return badRequest('operationId (or Idempotency-Key) must be a UUID v4.');
        }

        // ── Required generation inputs ───────────────────────────────────────
        const destination = validateString(body.destination, 'destination', 100);
        if (!destination) {
            console.warn('[Itinerary Proxy] Rejected: destination is required');
            return badRequest('destination is required and must be a non-empty string under 100 characters.');
        }

        // The phase contract is intentionally narrower than the historical
        // 1..365 + clamp behavior: invalid values must not be silently changed.
        const days = validateNumber(body.days, 1, 14);
        if (days === null || !hasOwn(body, 'days')) {
            console.warn(`[Itinerary Proxy] Rejected: invalid days: ${String(body.days)}`);
            return badRequest('days must be a number between 1 and 14.');
        }

        // Zero is a valid budget. Do not use `body.budget || ...` or a nullish
        // fallback here because both change caller intent.
        const budget = validateNumber(body.budget, 0, Number.MAX_SAFE_INTEGER);
        if (budget === null || !hasOwn(body, 'budget') || body.budget === null) {
            console.warn(`[Itinerary Proxy] Rejected: invalid budget: ${String(body.budget)}`);
            return badRequest('budget must be a number greater than or equal to zero.');
        }

        // Optional enum inputs retain absent and explicit-null as distinct
        // states. A supplied non-null value is canonicalized, never defaulted.
        let canonicalGroup: string | null | undefined;
        if (hasOwn(body, 'group')) {
            if (body.group === null) {
                canonicalGroup = null;
            } else if (typeof body.group === 'string' && KNOWN_GROUPS.has(body.group)) {
                canonicalGroup = GROUP_CANONICAL_MAP[body.group] || body.group;
            } else {
                console.warn(`[Itinerary Proxy] Rejected: unknown group: "${String(body.group)}"`);
                return badRequest(`group must be one of: ${[...KNOWN_GROUPS].join(', ')}.`);
            }
        }

        let canonicalPurpose: string | null | undefined;
        if (hasOwn(body, 'purpose')) {
            if (body.purpose === null) {
                canonicalPurpose = null;
            } else if (typeof body.purpose === 'string' && KNOWN_PURPOSES.has(body.purpose)) {
                canonicalPurpose = PURPOSE_CANONICAL_MAP[body.purpose] || body.purpose;
            } else {
                console.warn(`[Itinerary Proxy] Rejected: unknown purpose: "${String(body.purpose)}"`);
                return badRequest(`purpose must be one of: ${[...KNOWN_PURPOSES].join(', ')}.`);
            }
        }

        const destNameInput = optionalString(body, 'destName', 100);
        if (!destNameInput.valid) return badRequest('destName must be a string under 100 characters or null.');

        const optionalStringFields = [
            ['startDate', 50],
            ['endDate', 50],
            ['travelerType', 50],
            ['originCity', 100],
            ['arrivalTime', 50],
            ['arrivalMode', 50],
            ['departureTime', 50],
            ['departureMode', 50],
            ['hotelArea', 100],
        ] as const;
        const optionalStringValues: JsonObject = {};
        for (const [key, maxLength] of optionalStringFields) {
            const input = optionalString(body, key, maxLength);
            if (!input.valid) return badRequest(`${key} must be a string under ${maxLength} characters or null.`);
            if (input.present) optionalStringValues[key] = input.value;
        }

        const mustDo: unknown = body.mustDo;
        if (hasOwn(body, 'mustDo') && mustDo !== null && !Array.isArray(mustDo)) {
            return badRequest('mustDo must be an array or null.');
        }
        const safeMustDo = Array.isArray(mustDo)
            ? mustDo.slice(0, 10).map((item: unknown) => {
                const entry = isObject(item) ? item : { name: item };
                const rawName = entry.name;
                return {
                    name: validateString(rawName, 'mustDo name', 150),
                    dayIndex: typeof entry.dayIndex === 'number' ? entry.dayIndex : null,
                };
            }).filter((item: { name: string | null }) => Boolean(item.name))
            : mustDo;

        const routeStops: unknown = body.routeStops;
        if (hasOwn(body, 'routeStops') && routeStops !== null && !Array.isArray(routeStops)) {
            return badRequest('routeStops must be an array or null.');
        }
        const safeRouteStops = Array.isArray(routeStops)
            ? routeStops.slice(0, 4).map((stop: unknown) => {
                const entry = isObject(stop) ? stop : {};
                return {
                    name: validateString(entry.name, 'route stop name', 100),
                    stayDays: validateNumber(entry.stayDays, 1, 14) ?? 1,
                    travelMode: ['flight', 'train', 'bus', 'car'].includes(String(entry.travelMode))
                        ? entry.travelMode
                        : 'train',
                    travelTime: ['morning', 'afternoon', 'evening', 'night'].includes(String(entry.travelTime))
                        ? entry.travelTime
                        : 'morning',
                };
            }).filter((stop: { name: string | null }) => Boolean(stop.name))
            : routeStops;

        // Do not include userId (or any other client owner field). The backend
        // derives ownership exclusively from the verified bearer token.
        const safeBody: JsonObject = {
            operationId,
            destination,
            destName: destNameInput.present ? destNameInput.value : destination,
            days,
            budget,
            ...(canonicalPurpose !== undefined ? { purpose: canonicalPurpose } : {}),
            ...(canonicalGroup !== undefined ? { group: canonicalGroup } : {}),
            ...optionalStringValues,
            ...optionalField(body, 'preferences'),
            ...optionalField(body, 'browsingSignals'),
            ...(hasOwn(body, 'mustDo') ? { mustDo: safeMustDo } : {}),
            ...(hasOwn(body, 'routeStops') ? { routeStops: safeRouteStops } : {}),
        };

        if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_PYTHON_API_URL) {
            console.error('[Itinerary Proxy] NEXT_PUBLIC_PYTHON_API_URL is missing in production!');
            return NextResponse.json(
                { success: false, error: 'Server configuration error: NEXT_PUBLIC_PYTHON_API_URL is missing' },
                { status: 500 },
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        const safeDestName = typeof safeBody.destName === 'string' ? safeBody.destName : destination;

        console.log(`[Itinerary Proxy] Forwarding to backend (${baseUrl}/api/itinerary/generate) for "${safeDestName}":`, {
            operationId,
            days: safeBody.days,
            budget: safeBody.budget,
            purpose: safeBody.purpose,
            group: safeBody.group,
            routeStopsCount: Array.isArray(safeBody.routeStops) ? safeBody.routeStops.length : 0,
        });

        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/generate`, {
            method: 'POST',
            cache: 'no-store',
            headers: {
                ...getProxyHeaders(req),
                Authorization: authorization,
                // Keep the body and header identical so a retry replays the
                // same owner-scoped operation instead of creating a new one.
                'Idempotency-Key': operationId,
            },
            body: JSON.stringify(safeBody),
        });

        console.log(`[Itinerary Proxy] Backend response HTTP status: ${pythonResponse.status} for "${safeDestName}"`);

        let rawData: unknown;
        try {
            rawData = await pythonResponse.json();
        } catch {
            const status = pythonResponse.ok ? 502 : pythonResponse.status;
            return NextResponse.json(
                {
                    success: false,
                    error: 'The generation service returned an unreadable response.',
                    code: 'BACKEND_RESPONSE_INVALID',
                    persistence: { status: 'ambiguous', durable: false },
                },
                { status },
            );
        }

        if (!isObject(rawData)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'The generation service returned an invalid response.',
                    code: 'BACKEND_RESPONSE_INVALID',
                    persistence: { status: 'ambiguous', durable: false },
                },
                { status: pythonResponse.ok ? 502 : pythonResponse.status },
            );
        }

        if (!pythonResponse.ok) {
            console.error(`[Itinerary Proxy] Backend returned error (${pythonResponse.status}):`, { code: rawData.code });
            return NextResponse.json(
                {
                    success: false,
                    error: pythonResponse.status >= 500
                        ? 'The generation service is temporarily unavailable. Retry the same operation to reconcile it.'
                        : errorText(rawData, 'Generation could not be completed.'),
                    ...(typeof rawData.code === 'string' ? { code: rawData.code } : {}),
                    ...(isObject(rawData.persistence) ? { persistence: rawData.persistence } : {}),
                    ...(typeof rawData.retryAfter === 'number' ? { retryAfter: rawData.retryAfter } : {}),
                },
                { status: pythonResponse.status },
            );
        }

        // A 2xx preview without a matching durable receipt is never success.
        // Keep it explicitly unsaved so the client cannot place it in history,
        // Passport, sharing, or live journey state.
        if (!isDurablyPersisted(rawData, operationId)) {
            console.error('[Itinerary Proxy] Backend response lacked a valid persistence receipt:', {
                operationId,
                hasItinerary: isObject(rawData.itinerary),
            });
            const backendStatus = isObject(rawData.persistence) && rawData.persistence.status === 'ambiguous'
                ? 'ambiguous'
                : 'unsaved';
            return NextResponse.json(
                {
                    ...rawData,
                    success: false,
                    error: isObject(rawData.itinerary)
                        ? 'Itinerary preview generated, but the backend did not confirm durable persistence.'
                        : 'Generation completed without a valid persistence receipt.',
                    code: 'PERSISTENCE_RECEIPT_INVALID',
                    persistence: { status: backendStatus, durable: false },
                },
                { status: backendStatus === 'ambiguous' ? 503 : 502 },
            );
        }

        console.log(`[Itinerary Proxy] Generation committed for "${safeDestName}"`, {
            operationId,
            replayed: isObject(rawData.persistence) ? rawData.persistence.replayed : false,
        });
        return NextResponse.json(rawData);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Itinerary Proxy] Error connecting to generation backend:', message);
        return NextResponse.json(
            {
                success: false,
                error: 'We could not confirm whether the itinerary was saved. Retry to reconcile it safely.',
                code: 'PERSISTENCE_OUTCOME_AMBIGUOUS',
                persistence: { status: 'ambiguous', durable: false },
            },
            { status: 503 },
        );
    }
}
