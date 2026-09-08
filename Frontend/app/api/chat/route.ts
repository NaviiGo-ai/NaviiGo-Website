import { NextRequest, NextResponse } from 'next/server';
import { badRequest, validateString } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * POST /api/chat
 * Proxies to the Python backend which handles Gemini-powered
 * AI travel chat with itinerary editing capabilities.
 *
 * Body: { message, context, itineraryContext }
 * Returns: { reply, action }
 */
export async function POST(req: NextRequest) {
    // 20 requests/min per IP for chat — generous for interactive use
    const limited = applyRateLimit(req, 20, 60_000, 'chat');
    if (limited) return limited;

    try {
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        const message = validateString(body.message, 'message', 1200);
        if (!message) {
            return badRequest('message is required and must be a non-empty string under 1200 characters.');
        }

        // context must be an array if provided; cap it to 20 items
        const context = Array.isArray(body.context) ? body.context.slice(0, 20) : [];

        const safeBody = {
            message,
            context,
            itineraryContext: body.itineraryContext ?? null,
        };
        // ─────────────────────────────────────────────────────────────

        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';


        const pythonResponse = await fetch(`${baseUrl}/api/chat/`, {
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
        console.error('[Proxy] Chat Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
