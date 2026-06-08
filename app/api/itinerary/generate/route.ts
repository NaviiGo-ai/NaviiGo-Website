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
        });

        if (geminiData) {
            console.log(`[Itinerary] Got Gemini data, running deterministic personalization...`);
            const result = await generateItinerary(userContext, geminiData);
            if (result) {
                return NextResponse.json({
                    success: true,
                    itinerary: result,
                    source: 'ai-personalized',
                });
            }
        }

        // ── Path B: Fallback to hardcoded DEST_DATA if Gemini fails ─────────────
        if (DEST_DATA[resolvedDest]) {
            console.warn(`[Itinerary] Gemini failed or returned nothing, falling back to hardcoded data for ${destName}`);
            const result = await generateItinerary(userContext);
            if (result) {
                return NextResponse.json({
                    success: true,
                    itinerary: result,
                    source: 'fallback-hardcoded',
                });
            }
        }

        // ── Path C: Minimal fallback data + deterministic engine ──────────────
        console.warn(`[Itinerary] Gemini failed for "${destName}", using minimal data + deterministic engine`);
        const fallbackData = buildMinimalDestInfo(match?.name || destName);
        const fallbackResult = await generateItinerary(userContext, fallbackData);

        if (fallbackResult) {
            return NextResponse.json({
                success: true,
                itinerary: fallbackResult,
                source: 'fallback-personalized',
            });
        }

        // Should never reach here, but just in case
        return NextResponse.json({
            success: true,
            itinerary: {
                destName: match?.name || destName,
                description: `${destName} is a wonderful destination. Plan your trip with NaviiGo!`,
                avgCost: '₹2,000 – ₹8,000',
                crowdLevel: 'Medium',
                crowdNote: 'Check seasonal crowd levels',
                logistics: { flights: 'Check airline websites', trains: 'Check IRCTC' },
                mapCenter: { lat: 20.5937, lng: 78.9629 },
                highlights: [],
                restaurants: [],
                hotels: [],
                dayPlans: [],
            },
            source: 'empty-fallback',
        });

    } catch (error: any) {
        console.error('[Itinerary] Generation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate itinerary' },
            { status: 500 }
        );
    }
}
