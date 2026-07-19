import { NextRequest, NextResponse } from 'next/server';
import {
    badRequest, validateString, validateNumber,
    KNOWN_GROUPS, KNOWN_PURPOSES,
} from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/itinerary/generate
 * Proxies to the Python backend which handles Gemini-powered itinerary generation,
 * destination cache, Firebase user data enrichment, and CSV bulk loading.
 *
 * Body: { destination, destName, purpose, group, days, budget, startDate, userId, preferences, browsingSignals, travelerType, originCity }
 * Returns: { success: true, generatedData: { ... } }
 */
export async function POST(req: NextRequest) {
    // 5 requests/min per IP — itinerary gen is the most expensive Gemini call
    const limited = applyRateLimit(req, 5, 60_000, 'ai');
    if (limited) return limited;

    try {
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

        const safeBody = {
            destination,
            destName: validateString(body.destName, 'destName', 100) || destination,
            purpose: body.purpose ?? null,
            group: body.group ?? null,
            days,
            budget,
            startDate: body.startDate ?? null,
            endDate: body.endDate ?? null,
            userId: typeof body.userId === 'string' ? body.userId : null,
            preferences: body.preferences ?? null,
            browsingSignals: body.browsingSignals ?? null,
            travelerType: body.travelerType ?? null,
            originCity: validateString(body.originCity, 'originCity', 100) ?? null,
        };
        // ─────────────────────────────────────────────────────────────

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';


        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Itinerary Proxy] Error:', error.message || error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error forwarding to Python backend' },
            { status: 500 }
        );
    }
}
