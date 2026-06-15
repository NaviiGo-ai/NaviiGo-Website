import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary, type UserContext } from '@/lib/ai/itineraryModel';
import { fetchDestinationDataWithGemini, buildMinimalDestInfo } from '@/lib/ai/geminiItinerary';
import { DEST_DATA, DESTINATIONS } from '@/app/itinerary/data';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    // Rate limit: 5 requests per minute per IP
    const ip = getClientIP(req);
    const { allowed, retryAfter } = checkRateLimit(ip, 5, 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { success: false, error: 'Too many itinerary generation requests. Please wait before trying again.' },
            { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
        );
    }

    try {
        const body = await req.json();
        const {
            destination,
            destName,
            purpose,
            group,
            days,
            budget,
            startDate,
            userId,
            preferences,
            browsingSignals,
            travelerType,
            originCity,
        } = body;

        // Validate required fields
        if (!destName || !purpose || !days) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: destName, purpose, days' },
                { status: 400 }
            );
        }

        // Resolve destination key — match against known destinations
        let resolvedDest = destination || destName.toLowerCase().replace(/\s+/g, '');
        const match = DESTINATIONS.find(d =>
            d.name.toLowerCase() === (destName || '').toLowerCase() ||
            d.id === resolvedDest
        );
        if (match) resolvedDest = match.id;

        // Build user context (used by the deterministic engine in ALL paths)
        const userContext: UserContext = {
            destination: resolvedDest,
            destName: match?.name || destName,
            purpose,
            group: group || 'solo',
            days: Number(days) || 3,
            budget: Number(budget) || 15000,
            startDate: startDate || new Date().toISOString().split('T')[0],
            travelerType: travelerType || 'comfort',
            preferences: preferences || null,
            pastTrips: [],
            browsingSignals: browsingSignals || null,
            originCity: originCity || null,
        };

        // ── Path A: Fetch data with Gemini dynamically ─────────────
        console.log(`[Itinerary] Fetching dynamic AI data for "${resolvedDest}" via Gemini...`);
        const geminiData = await fetchDestinationDataWithGemini({
            destName: match?.name || destName,
            purpose,
            budget: Number(budget) || 15000,
            days: Number(days) || 3,
            originCity: originCity || null,
        
        // Forward the request to the Python FastAPI backend
        // This is crucial because Python handles the caching, Firebase user data enrichment,
        // and CSV bulk loading logic to prevent Gemini rate limits.
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        
        console.log(`[Proxy] Forwarding itinerary request to Python backend: ${baseUrl}/api/itinerary/generate`);
        
        const pythonResponse = await fetch(`${baseUrl}/api/itinerary/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
