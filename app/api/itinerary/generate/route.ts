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
export async function POST(req: NextRequest) {
    // 5 requests/min per IP — itinerary gen is the most expensive Gemini call
    const limited = applyRateLimit(req, 5, 60_000, 'ai');
    if (limited) return limited;

    try {
        const authorization = req.headers.get('authorization') || '';
        if (!authorization.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Sign in is required to create an itinerary.' }, { status: 401 });
        }
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        const destination = validateString(body.destination, 'destination', 100);
        if (!destination) {
            return badRequest('destination is required and must be a non-empty string under 100 characters.');
        }

        const days = validateNumber(body.days, 1, 365);
        if (days === null) {
            return badRequest('days must be a number between 1 and 365.');
        }

        const budget = validateNumber(body.budget, 1, Number.MAX_SAFE_INTEGER);
        if (budget === null) {
            return badRequest('budget must be a positive number.');
        }

        // group is optional but must be a known value if provided
        if (body.group !== undefined && !KNOWN_GROUPS.has(body.group)) {
            return badRequest(`group must be one of: ${[...KNOWN_GROUPS].join(', ')}.`);
        }

        // purpose is optional but must be a known value if provided
        if (body.purpose !== undefined && !KNOWN_PURPOSES.has(body.purpose)) {
            return badRequest(`purpose must be one of: ${[...KNOWN_PURPOSES].join(', ')}.`);
        }

        // uuid — optional, validated when present (must be standard UUID v4 format)
        const rawUuid = typeof body.uuid === 'string' ? body.uuid : '';
        const cleanUuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();
        const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(cleanUuid)
            ? cleanUuid
            : null;

        const safeBody = {
            destination,
            destName: validateString(body.destName, 'destName', 100) || destination,
            purpose: body.purpose ?? null,
            group: body.group ?? null,
            days,
            budget,
            startDate: body.startDate ?? null,
            endDate: body.endDate ?? null,
            // The FastAPI service verifies the bearer token and sets the UID itself.
            // Never trust a UID supplied by the browser.
            userId: null,
            preferences: body.preferences ?? null,
            browsingSignals: body.browsingSignals ?? null,
            travelerType: body.travelerType ?? null,
            originCity: validateString(body.originCity, 'originCity', 100) ?? null,
            routeStops: Array.isArray(body.routeStops) ? body.routeStops.slice(0, 4).map((stop: any) => ({
                name: validateString(stop?.name, 'route stop name', 100),
                stayDays: validateNumber(stop?.stayDays, 1, 14) ?? 1,
                travelMode: ['flight', 'train', 'bus', 'car'].includes(stop?.travelMode) ? stop.travelMode : 'train',
                travelTime: ['morning', 'afternoon', 'evening', 'night'].includes(stop?.travelTime) ? stop.travelTime : 'morning',
            })).filter((stop: { name: string | null }) => Boolean(stop.name)) : [],
        };
        // ─────────────────────────────────────────────────────────────

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';


        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/generate`, {
            method: 'POST',
            headers: { ...getProxyHeaders(req), Authorization: authorization },
            body: JSON.stringify(safeBody),
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            console.error('[Proxy] Python backend error:', data);
            return NextResponse.json(
                { success: false, error: data.detail || 'Python backend failed' },
                { status: pythonResponse.status }
            );
        }

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
                console.log(`[Generate] Saved to itineraries/${uuid}`);
            } catch (fsErr: any) {
                console.error('[Generate] Firestore UUID save failed (non-fatal):', fsErr.message);
            }
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Itinerary Proxy] Error:', error.message || error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error forwarding to Python backend' },
            { status: 500 }
        );
    }
}
