import { NextRequest, NextResponse } from 'next/server';
import { badRequest, validateString, KNOWN_COMPANIONS, KNOWN_VIBES } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/explore/deep-dive
 * Proxies to the Python backend which handles Gemini-powered
 * destination deep dives with caching.
 *
 * Body: { destination, companion, vibe }
 * Returns: { success: true, data: { redditConsensus, hiddenGems, touristTrapsToAvoid, instagramWorthy, localFoodMustHaves } }
 */
export async function POST(req: NextRequest) {
    // 5 requests/min per IP — Gemini-powered destination deep dive
    const limited = applyRateLimit(req, 5, 60_000, 'ai');
    if (limited) return limited;

    try {
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        const destination = validateString(body.destination, 'destination', 100);
        if (!destination) {
            return badRequest('destination is required and must be a non-empty string under 100 characters.');
        }

        if (body.companion !== undefined && !KNOWN_COMPANIONS.has(body.companion)) {
            return badRequest(`companion must be one of: ${[...KNOWN_COMPANIONS].join(', ')}.`);
        }

        if (body.vibe !== undefined && !KNOWN_VIBES.has(body.vibe)) {
            return badRequest(`vibe must be one of: ${[...KNOWN_VIBES].join(', ')}.`);
        }

        const safeBody = {
            destination,
            companion: body.companion ?? 'Solo',
            vibe: body.vibe ?? 'Authentic Exploration',
        };
        // ─────────────────────────────────────────────────────────────

        if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_PYTHON_API_URL) {
            console.error('[Proxy] NEXT_PUBLIC_PYTHON_API_URL is missing in production!');
            return NextResponse.json(
                { success: false, error: 'Server configuration error: NEXT_PUBLIC_PYTHON_API_URL is missing' },
                { status: 500 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

        const pythonResponse = await fetch(`${baseUrl}/api/explore/deep-dive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(safeBody),
        });

        const data = await pythonResponse.json();

        if (!pythonResponse.ok) {
            return NextResponse.json(
                { success: false, error: data.detail || 'Python backend failed' },
                { status: pythonResponse.status }
            );
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[Proxy] Deep Dive Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate deep dive' },
            { status: 500 }
        );
    }
}
