import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/chat
 * Proxies to the Python backend which handles Gemini-powered
 * AI travel chat with itinerary editing capabilities.
 *
 * Body: { message, context, itineraryContext }
 * Returns: { reply, action }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

        console.log(`[Proxy] Forwarding chat request to Python backend`);

        const pythonResponse = await fetch(`${baseUrl}/api/chat/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
