import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/itinerary/generate
 * Proxies to the Python backend which handles Gemini-powered itinerary generation,
 * destination cache, Firebase user data enrichment, and CSV bulk loading.
 *
 * Body: { destination, destName, purpose, group, days, budget, startDate, userId, preferences, browsingSignals, travelerType, originCity }
 * Returns: { success: true, generatedData: { ... } }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

        console.log(`[Proxy] Forwarding itinerary request to Python backend: ${baseUrl}/api/itinerary/generate`);

        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
