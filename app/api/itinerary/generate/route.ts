import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary, type UserContext } from '@/lib/ai/itineraryModel';
import { generateWithGemini, buildMinimalFallback } from '@/lib/ai/geminiItinerary';
import { DEST_DATA, DESTINATIONS } from '@/app/itinerary/data';

export async function POST(req: NextRequest) {
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

        // ── Path A: Deterministic engine (has DEST_DATA) ─────────────────────
        if (DEST_DATA[resolvedDest]) {
            console.log(`[Itinerary] Using deterministic engine for ${destName}`);

            const userContext: UserContext = {
                destination: resolvedDest,
                destName: match?.name || destName,
                purpose,
                group: group || 'solo',
                days: Number(days) || 3,
                budget: Number(budget) || 15000,
                startDate: startDate || new Date().toISOString().split('T')[0],
                preferences: preferences || null,
                pastTrips: [],
                browsingSignals: browsingSignals || null,
            };

            const result = await generateItinerary(userContext);
            if (result) {
                return NextResponse.json({
                    success: true,
                    itinerary: result,
                    source: 'personalized',
                });
            }
        }

        // ── Path B: Gemini AI generation (no DEST_DATA) ──────────────────────
        console.log(`[Itinerary] No DEST_DATA for "${resolvedDest}", using Gemini AI`);

        const geminiResult = await generateWithGemini({
            destName: match?.name || destName,
            days: Number(days) || 3,
            purpose,
            group: group || 'solo',
            budget: Number(budget) || 15000,
            startDate: startDate || new Date().toISOString().split('T')[0],
        });

        if (geminiResult) {
            return NextResponse.json({
                success: true,
                itinerary: geminiResult,
                source: 'ai',
            });
        }

        // ── Path C: Minimal fallback (Gemini also failed) ────────────────────
        console.warn(`[Itinerary] Gemini failed for "${destName}", using minimal fallback`);
        const fallback = buildMinimalFallback(match?.name || destName, Number(days) || 3);

        return NextResponse.json({
            success: true,
            itinerary: fallback,
            source: 'fallback',
        });

    } catch (error: any) {
        console.error('[Itinerary] Generation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate itinerary' },
            { status: 500 }
        );
    }
}
