import { NextRequest, NextResponse } from 'next/server';
import { badRequest, validateString, validateHttpsUrl } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/itinerary/from-link
 * Proxies to the Python backend which handles Gemini analysis
 * of social media links and captions to extract travel info.
 *
 * Body: { url?: string, captionText?: string }
 * Returns: { success: true, extracted: { destName, places, vibe, days, purpose, tags, summary, confidence } }
 */
export async function POST(req: NextRequest) {
    // 5 requests/min per IP — Gemini-powered social link analysis
    const limited = applyRateLimit(req, 5, 60_000, 'ai');
    if (limited) return limited;

    try {
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        const url = body.url !== undefined ? validateHttpsUrl(body.url) : undefined;
        const captionText = body.captionText !== undefined
            ? validateString(body.captionText, 'captionText', 1000)
            : undefined;

        // At least one of url or captionText must be provided
        if (url === null) {
            return badRequest('url must be a valid https:// URL.');
        }
        if (body.url === undefined && !captionText) {
            return badRequest('Either a valid https:// url or captionText (under 1000 characters) is required.');
        }
        if (!url && !captionText) {
            return badRequest('Either a valid https:// url or captionText (under 1000 characters) is required.');
        }

        const safeBody: Record<string, string> = {};
        if (url) safeBody.url = url;
        if (captionText) safeBody.captionText = captionText;
        // ─────────────────────────────────────────────────────────────

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

        console.log(`[Proxy] Forwarding from-link request to Python backend`);

        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/from-link`, {
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

        return NextResponse.json({ success: true, extracted: data.extracted || data });
    } catch (error: any) {
        console.error('[Proxy] From-Link Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
