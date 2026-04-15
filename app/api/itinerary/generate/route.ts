import { NextRequest, NextResponse } from 'next/server';
import { generateItinerary, type UserContext } from '@/lib/ai/itineraryModel';
import { DEST_DATA, FALLBACK_DEST } from '@/app/itinerary/data';

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
        } = body;

        // Validate required fields
        if (!destName || !purpose || !days) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: destName, purpose, days' },
                { status: 400 }
            );
        }

        // Build user context for the AI model
        const userContext: UserContext = {
            destination: destination || destName.toLowerCase(),
            destName,
            purpose,
            group: group || 'solo',
            days: Number(days) || 3,
            budget: Number(budget) || 15000,
            startDate: startDate || new Date().toISOString().split('T')[0],
            preferences: preferences || null,
            pastTrips: [], // TODO: pull from Firestore if userId is provided
        };

        // Try AI generation first
        console.log(`[Itinerary] Generating for ${destName} (${days} days, ${purpose}, ₹${budget})`);
        const aiResult = await generateItinerary(userContext);

        if (aiResult) {
            console.log('[Itinerary] AI generation succeeded');

            // Merge AI result with static data images (Unsplash IDs for highlights)
            const staticData = DEST_DATA[destination] || null;
            if (staticData) {
                // Enrich AI highlights with images from static data
                aiResult.highlights = aiResult.highlights.map((h, i) => {
                    const staticHighlight = staticData.highlights[i];
                    return {
                        ...h,
                        img: staticHighlight?.img || '',
                    };
                });

                // Enrich restaurants with images
                aiResult.restaurants = aiResult.restaurants.map((r, i) => {
                    const staticRestaurant = staticData.restaurants[i];
                    return {
                        ...r,
                        img: staticRestaurant?.img || '',
                    };
                });

                // Enrich hotels with images
                aiResult.hotels = aiResult.hotels.map((h, i) => {
                    const staticHotel = staticData.hotels[i];
                    return {
                        ...h,
                        img: staticHotel?.img || '',
                    };
                });
            }

            return NextResponse.json({
                success: true,
                itinerary: aiResult,
                source: 'ai',
            });
        }

        // Fallback to static data if AI fails
        console.log('[Itinerary] AI failed, falling back to static data');
        const fallbackData = DEST_DATA[destination] || FALLBACK_DEST;

        // Adjust day plans to match requested days
        const adjustedDayPlans = [];
        for (let i = 0; i < Number(days); i++) {
            const basePlan = fallbackData.dayPlans[i % fallbackData.dayPlans.length];
            adjustedDayPlans.push({
                ...basePlan,
                day: i + 1,
                title: i < fallbackData.dayPlans.length
                    ? basePlan.title
                    : `Day ${i + 1} — Explore ${destName}`,
            });
        }

        return NextResponse.json({
            success: true,
            itinerary: {
                ...fallbackData,
                destName,
                dayPlans: adjustedDayPlans,
            },
            source: 'static',
        });

    } catch (error: any) {
        console.error('[Itinerary] Generation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate itinerary' },
            { status: 500 }
        );
    }
}
