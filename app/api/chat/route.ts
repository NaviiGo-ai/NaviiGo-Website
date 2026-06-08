import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
    // Rate limit: 10 requests per minute per IP
    const ip = getClientIP(req);
    const { allowed, retryAfter } = checkRateLimit(ip, 10, 60 * 1000);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please wait before sending another message.' },
            { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
        );
    }

    try {
        const { message, context, currentPlans, itineraryContext } = await req.json();

        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return NextResponse.json({
                reply: "AI Chat is in demo mode. Add your GEMINI_API_KEY to .env.local to enable real AI responses.",
                action: null,
            });
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

        // Use itineraryContext (from AIContext) or currentPlans (legacy) — whichever is available
        const itineraryData = itineraryContext || currentPlans;

        const systemContext = `You are NaviiGo's AI travel assistant. You help users edit their travel itinerary with personality and flair.
Current itinerary:
- Destination: ${itineraryData?.destName || 'Unknown'}
- Day plans: ${JSON.stringify(itineraryData?.dayPlans || [], null, 2)}
- Highlights: ${JSON.stringify((itineraryData?.highlights || []).map((h: any) => h.name), null, 2)}
- Restaurants: ${JSON.stringify((itineraryData?.restaurants || []).map((r: any) => r.name), null, 2)}

Conversation: ${JSON.stringify(context || [], null, 2)}

You can either:
1. Just reply with a helpful message (action: null)
2. Reply AND suggest an itinerary change (return action with type + payload)

Supported action types:
- "removeActivity": { dayIndex: number, activityIndex: number }
- "addActivity": { dayIndex: number, activity: { name, desc, time, slot, crowd, crowdTip, lat, lng, type } }
- "reorderDay": { dayIndex: number, fromIndex: number, toIndex: number }
- "replaceActivity": { dayIndex: number, activityIndex: number, activity: { name, desc, time, slot, crowd, crowdTip, lat, lng, type } }
- "addDay": { day: { day: number, title: string, activities: [...] } }
- "changeHotel": { hotelIndex: number, newHotel: { name, desc, type, priceRange, rating, amenities } }
- "swapRestaurant": { dayIndex: number, activityIndex: number, newRestaurant: { name, desc, cuisine, mustTry } }
- "surpriseActivity": { dayIndex: number } - replace a random activity with something offbeat/hidden gem

Be warm, fun and helpful. When editing, explain WHY the change is better.
Respond with ONLY valid JSON:
{
  "reply": "Natural conversational reply",
  "action": null | { "type": "...", "payload": {...} }
}`;

        const result = await model.generateContent(systemContext + '\n\nUser: ' + message);
        const text = result.response.text();

        // Parse JSON from Gemini response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ reply: text, action: null });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);

    } catch (err: unknown) {
        console.error('[AI Chat Error]', err);
        return NextResponse.json(
            { reply: "I'm having trouble right now. Please try again in a moment.", action: null },
            { status: 200 }
        );
    }
}
