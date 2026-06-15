import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/recommendations
 * Proxies to the Python backend which handles AI-powered
 * destination recommendations with Pinecone vector search,
 * seasonal scoring, and taste vector personalization.
 *
 * Body: { uid, budget, month, group, purpose, pastDestinations, tasteVector, browsingSignals }
 * Returns: { success: true, recommendations: [...] }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

        console.log(`[Proxy] Forwarding recommendations request to Python backend`);

        const pythonResponse = await fetch(`${baseUrl}/api/recommendations/`, {
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

        return NextResponse.json({ success: true, recommendations: data.recommendations || data });
    } catch (error: any) {
        console.error('[Proxy] Recommendations Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
