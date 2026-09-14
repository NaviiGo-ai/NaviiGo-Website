import { NextRequest, NextResponse } from 'next/server';
import {
    badRequest, validateString, validateNumber,
    KNOWN_GROUPS, KNOWN_PURPOSES,
} from '@/lib/validation';
import { applyRateLimit, getProxyHeaders } from '@/lib/rateLimit';

/**
 * POST /api/itinerary/generate
 * Proxies to the Python backend which handles Gemini-powered itinerary generation,
 * destination cache, Firebase user data enrichment, and CSV bulk loading.
 *
 * Body: { destination, destName, purpose, group, days, budget, startDate, userId,
 *         preferences, browsingSignals, travelerType, originCity, uuid }
 *
 * uuid (optional): client-generated UUID v4. When provided, the generated itinerary
 * is saved to Firestore at itineraries/{uuid} so it can be accessed via a shareable URL.
 *
 * Returns: { success: true, itinerary: { ... } }
 */
// Canonical mappings for group and purpose to align UI options with backend engines
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

export async function POST(req: NextRequest) {
    // 5 requests/min per IP — itinerary gen is the most expensive Gemini call
    const limited = applyRateLimit(req, 5, 60_000, 'ai');
    if (limited) return limited;

    try {
        const authorization = req.headers.get('authorization') || '';
        if (!authorization.startsWith('Bearer ')) {
            console.warn('[Itinerary Proxy] Rejected: Missing or invalid Authorization Bearer header');
            return NextResponse.json({ success: false, error: 'Sign in is required to create an itinerary.' }, { status: 401 });
        }
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        const destination = validateString(body.destination, 'destination', 100);
        if (!destination) {
            console.warn('[Itinerary Proxy] Rejected: destination is required');
            return badRequest('destination is required and must be a non-empty string under 100 characters.');
        }

        const days = validateNumber(body.days, 1, 365);
        if (days === null) {
            console.warn(`[Itinerary Proxy] Rejected: invalid days: ${body.days}`);
            return badRequest('days must be a number between 1 and 365.');
        }

        const budget = validateNumber(body.budget, 1, Number.MAX_SAFE_INTEGER);
        if (budget === null) {
            console.warn(`[Itinerary Proxy] Rejected: invalid budget: ${body.budget}`);
            return badRequest('budget must be a positive number.');
        }

        // group is optional but must be a known value if provided
        let canonicalGroup = 'solo';
        if (body.group !== undefined && body.group !== null) {
            if (!KNOWN_GROUPS.has(body.group)) {
                console.warn(`[Itinerary Proxy] Rejected: unknown group: "${body.group}"`);
                return badRequest(`group must be one of: ${[...KNOWN_GROUPS].join(', ')}.`);
            }
            canonicalGroup = GROUP_CANONICAL_MAP[body.group] || body.group;
        }

        // purpose is optional but must be a known value if provided
        let canonicalPurpose = 'cultural';
        if (body.purpose !== undefined && body.purpose !== null) {
            if (!KNOWN_PURPOSES.has(body.purpose)) {
                console.warn(`[Itinerary Proxy] Rejected: unknown purpose: "${body.purpose}"`);
                return badRequest(`purpose must be one of: ${[...KNOWN_PURPOSES].join(', ')}.`);
            }
            canonicalPurpose = PURPOSE_CANONICAL_MAP[body.purpose] || body.purpose;
        }

        // uuid — optional, validated when present (must be standard UUID v4 format)
        const rawUuid = typeof body.uuid === 'string' ? body.uuid : '';
        const cleanUuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cleanUuid)
            ? cleanUuid
            : null;

        // Clamp days to FastAPI's 1-14 supported range
        const safeDays = Math.min(Math.max(days, 1), 14);

        const safeBody = {
            destination,
            destName: validateString(body.destName, 'destName', 100) || destination,
            purpose: canonicalPurpose,
            group: canonicalGroup,
            days: safeDays,
            budget,
            startDate: body.startDate ?? null,
            endDate: body.endDate ?? null,
            // The FastAPI service verifies the bearer token and sets the UID itself.
            // Never trust a UID supplied by the browser.
            userId: null,
            preferences: body.preferences ?? null,
            browsingSignals: body.browsingSignals ?? null,
            travelerType: body.travelerType ?? 'comfort',
            originCity: validateString(body.originCity, 'originCity', 100) ?? null,
            arrivalTime: validateString(body.arrivalTime, 'arrivalTime', 50) ?? null,
            arrivalMode: validateString(body.arrivalMode, 'arrivalMode', 50) ?? null,
            departureTime: validateString(body.departureTime, 'departureTime', 50) ?? null,
            departureMode: validateString(body.departureMode, 'departureMode', 50) ?? null,
            hotelArea: validateString(body.hotelArea, 'hotelArea', 100) ?? null,
            mustDo: Array.isArray(body.mustDo) ? body.mustDo.slice(0, 10).map((m: any) => ({
                name: validateString(m?.name || m, 'mustDo name', 150),
                dayIndex: typeof m?.dayIndex === 'number' ? m.dayIndex : null,
            })).filter((m: { name: string | null }) => Boolean(m.name)) : [],
            routeStops: Array.isArray(body.routeStops) ? body.routeStops.slice(0, 4).map((stop: any) => ({
                name: validateString(stop?.name, 'route stop name', 100),
                stayDays: validateNumber(stop?.stayDays, 1, 14) ?? 1,
                travelMode: ['flight', 'train', 'bus', 'car'].includes(stop?.travelMode) ? stop.travelMode : 'train',
                travelTime: ['morning', 'afternoon', 'evening', 'night'].includes(stop?.travelTime) ? stop.travelTime : 'morning',
            })).filter((stop: { name: string | null }) => Boolean(stop.name)) : [],
        };
        // ─────────────────────────────────────────────────────────────

        if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_PYTHON_API_URL) {
            console.error('[Itinerary Proxy] NEXT_PUBLIC_PYTHON_API_URL is missing in production!');
            return NextResponse.json(
                { success: false, error: 'Server configuration error: NEXT_PUBLIC_PYTHON_API_URL is missing' },
                { status: 500 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

        console.log(`[Itinerary Proxy] Forwarding to Render (${baseUrl}/api/itinerary/generate) for "${safeBody.destName}":`, {
            days: safeBody.days,
            budget: safeBody.budget,
            purpose: safeBody.purpose,
            group: safeBody.group,
            routeStopsCount: safeBody.routeStops.length,
        });

        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/generate`, {
            method: 'POST',
            headers: { ...getProxyHeaders(req), Authorization: authorization },
            body: JSON.stringify(safeBody),
        });

        console.log(`[Itinerary Proxy] Render response HTTP status: ${pythonResponse.status} for "${safeBody.destName}"`);

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            console.error(`[Itinerary Proxy] Render returned error (${pythonResponse.status}):`, data);
            return NextResponse.json(
                { success: false, error: data.detail || 'Python backend failed' },
                { status: pythonResponse.status }
            );
        }

        console.log(`[Itinerary Proxy] Render generated successfully for "${safeBody.destName}" (source: ${data.source || 'gemini'})`);

        // ── Persist to Firestore at itineraries/{uuid} ────────────────
        // Runs for both guests (no userId) and logged-in users.
        // Non-fatal: if Firestore write fails, the itinerary JSON still returns.
        if (uuid && data.success && data.itinerary) {
            try {
                const { saveItineraryByUUID } = await import('@/lib/firestore');
                await saveItineraryByUUID(uuid, {
                    form: safeBody as any,
                    generatedData: data.itinerary,
                    destName: safeBody.destName,
                    userId: data.userId ?? null,
                    isPublic: true,
                });
                console.log(`[Itinerary Proxy] Saved to itineraries/${uuid}`);
            } catch (fsErr: any) {
                console.error('[Itinerary Proxy] Firestore UUID save failed (non-fatal):', fsErr.message);
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Itinerary Proxy] Error connecting to Render backend:', error.message || error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error forwarding to Python backend' },
            { status: 500 }
        );
    }
}
