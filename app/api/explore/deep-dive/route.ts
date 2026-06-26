import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/explore/deep-dive
 * Proxies to the Python backend which handles Gemini-powered
 * destination deep dives with caching.
 *
 * Body: { destination, companion, vibe }
 * Returns: { success: true, data: { redditConsensus, hiddenGems, touristTrapsToAvoid, instagramWorthy, localFoodMustHaves } }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';


        const pythonResponse = await fetch(`${baseUrl}/api/explore/deep-dive`, {
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
        console.error('[Proxy] Deep Dive Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to generate deep dive' },
            { status: 500 }
        );
    }
}
