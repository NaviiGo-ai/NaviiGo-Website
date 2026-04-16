// ─── Gemini-Powered Itinerary Generation ──────────────────────────────────────
// Fallback engine for destinations WITHOUT hardcoded DEST_DATA.
// Uses Google's Gemini AI to generate full itinerary data matching our schema.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeneratedItinerary } from './itineraryModel';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Generate a complete itinerary for ANY destination using Gemini AI.
 * Returns the same GeneratedItinerary interface as the deterministic engine.
 */
export async function generateWithGemini(params: {
    destName: string;
    days: number;
    purpose: string;
    group: string;
    budget: number;
    startDate: string;
}): Promise<GeneratedItinerary | null> {
    if (!GEMINI_API_KEY) {
        console.error('[GeminiItinerary] No GEMINI_API_KEY configured');
        return null;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const budgetPerDay = Math.round(params.budget / params.days);
    const budgetTier = budgetPerDay > 12000 ? 'luxury' : budgetPerDay > 5000 ? 'mid-range' : 'budget';

    const prompt = `You are an expert Indian travel planner. Generate a complete travel itinerary for ${params.destName}, India.

TRIP DETAILS:
- Destination: ${params.destName}
- Duration: ${params.days} days
- Purpose: ${params.purpose}
- Group: ${params.group}
- Budget: ₹${params.budget.toLocaleString('en-IN')} total (${budgetTier} tier, ~₹${budgetPerDay.toLocaleString('en-IN')}/day)
- Start Date: ${params.startDate}

Generate a COMPLETE JSON response with this EXACT structure. Every field is required:

{
  "destName": "${params.destName}",
  "description": "2-3 sentence vivid description of the destination",
  "avgCost": "daily cost range like ₹2,000 – ₹8,000",
  "crowdLevel": "Low" or "Medium" or "High",
  "crowdNote": "brief crowd info",
  "logistics": {
    "flights": "Nearest airport with code and avg fare",
    "trains": "Nearest major railway station with code"
  },
  "mapCenter": { "lat": number, "lng": number },
  "highlights": [
    {
      "name": "Attraction Name",
      "img": "placeholder",
      "desc": "1-2 sentence description",
      "bestMonths": "Oct – Mar",
      "duration": "2–3 hrs",
      "tags": ["Heritage", "UNESCO"],
      "lat": number,
      "lng": number
    }
  ],
  "restaurants": [
    {
      "id": "r1",
      "name": "Restaurant Name",
      "img": "placeholder",
      "desc": "1-2 sentence description",
      "cuisine": "Cuisine Type",
      "priceRange": "₹200–₹600",
      "rating": 4.5,
      "mustTry": "Signature dish",
      "lat": number,
      "lng": number,
      "tags": ["Local", "Famous"]
    }
  ],
  "hotels": [
    {
      "id": "h1",
      "name": "Hotel Name",
      "img": "placeholder",
      "desc": "1-2 sentence description",
      "type": "Hotel" or "Hostel" or "Resort" or "Homestay",
      "priceRange": "₹2,000–₹5,000/night",
      "rating": 4.3,
      "amenities": ["WiFi", "Pool"],
      "lat": number,
      "lng": number
    }
  ],
  "dayPlans": [
    {
      "day": 1,
      "title": "Catchy Day Title",
      "weather": {
        "temp": "22–30°C",
        "condition": "Partly Cloudy",
        "emoji": "⛅",
        "rain": 15,
        "tip": "Weather tip"
      },
      "activities": [
        {
          "time": "07:00 AM",
          "slot": "Morning",
          "name": "Activity Name",
          "desc": "1-2 sentence description",
          "crowd": "Low" or "Medium" or "High",
          "crowdTip": "Crowd avoidance tip",
          "travelFromPrev": "10 min auto",
          "lat": number,
          "lng": number
        }
      ]
    }
  ]
}

IMPORTANT RULES:
1. Include exactly 6 highlights (top attractions)
2. Include exactly 4 restaurants (famous local ones, real places)
3. Include exactly 3 hotels (one ${budgetTier} option, mix of types)
4. Include exactly ${params.days} day plans
5. Each day plan must have exactly 6 activities (2 morning, 1 lunch, 1 afternoon, 1 evening attraction, 1 dinner)
6. Use REAL place names, REAL coordinates (lat/lng), REAL restaurant names
7. All image fields should be "placeholder" — we'll resolve them later
8. Activities should match the "${params.purpose}" purpose and "${params.group}" group type
9. For ${budgetTier} budget, recommend appropriate restaurants and hotels
10. Make day plans flow geographically — nearby activities grouped together
11. Return ONLY valid JSON — no markdown, no backticks, no explanation`;

    try {
        console.log(`[GeminiItinerary] Generating for ${params.destName} (${params.days} days, ${params.purpose})`);

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }
        // Also try to find raw JSON object
        const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            jsonStr = braceMatch[0];
        }

        const parsed = JSON.parse(jsonStr) as GeneratedItinerary;

        // Validate critical fields
        if (!parsed.destName || !parsed.dayPlans || parsed.dayPlans.length === 0) {
            console.error('[GeminiItinerary] Invalid response structure');
            return null;
        }

        // Ensure mapCenter exists
        if (!parsed.mapCenter && parsed.highlights?.length > 0) {
            parsed.mapCenter = {
                lat: parsed.highlights[0].lat,
                lng: parsed.highlights[0].lng,
            };
        }

        console.log(`[GeminiItinerary] Success: ${parsed.dayPlans.length} days, ${parsed.highlights?.length} highlights`);
        return parsed;

    } catch (error: any) {
        console.error('[GeminiItinerary] Generation failed:', error.message || error);
        return null;
    }
}

/**
 * Build a minimal fallback itinerary when Gemini also fails.
 * Uses generic data so the UI doesn't break.
 */
export function buildMinimalFallback(destName: string, days: number): GeneratedItinerary {
    const dayPlans = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        title: `Day ${i + 1} in ${destName}`,
        weather: {
            temp: '22–32°C',
            condition: 'Partly Cloudy',
            emoji: '⛅',
            rain: 15,
            tip: 'Check local weather for latest updates',
        },
        activities: [
            { time: '08:00 AM', slot: 'Morning' as const, name: `Explore ${destName} - Morning`, desc: `Start your day exploring the local attractions of ${destName}.`, crowd: 'Medium' as const, crowdTip: 'Visit early for fewer crowds', lat: 20.5937, lng: 78.9629 },
            { time: '10:00 AM', slot: 'Morning' as const, name: 'Local Market Walk', desc: 'Discover local handicrafts, spices and souvenirs.', crowd: 'Medium' as const, crowdTip: 'Morning hours are quieter', travelFromPrev: '15 min walk', lat: 20.5937, lng: 78.9629 },
            { time: '12:30 PM', slot: 'Afternoon' as const, name: 'Lunch at Local Restaurant', desc: `Try authentic local cuisine — ask your hotel for recommendations.`, crowd: 'Medium' as const, crowdTip: 'Reserve ahead for popular spots', travelFromPrev: '10 min auto', lat: 20.5937, lng: 78.9629, type: 'restaurant' as const },
            { time: '02:30 PM', slot: 'Afternoon' as const, name: `${destName} Heritage Walk`, desc: 'Explore the historical sites and architectural marvels.', crowd: 'Medium' as const, crowdTip: 'Afternoon sun can be strong — carry water', travelFromPrev: '15 min auto', lat: 20.5937, lng: 78.9629 },
            { time: '05:30 PM', slot: 'Evening' as const, name: 'Sunset Viewpoint', desc: 'Find the best sunset spot and watch the sky transform.', crowd: 'Low' as const, crowdTip: 'Golden hour — perfect for photography', travelFromPrev: '20 min drive', lat: 20.5937, lng: 78.9629 },
            { time: '08:00 PM', slot: 'Evening' as const, name: 'Dinner & Night Walk', desc: 'End the day with local dinner and an evening stroll.', crowd: 'Low' as const, crowdTip: 'Evening dining is relaxed', travelFromPrev: '15 min auto', lat: 20.5937, lng: 78.9629, type: 'restaurant' as const },
        ],
    }));

    return {
        destName,
        description: `${destName} is a vibrant Indian destination waiting to be explored. Plan your trip with NaviiGo for personalized recommendations.`,
        avgCost: '₹2,000 – ₹8,000',
        crowdLevel: 'Medium',
        crowdNote: 'Check seasonal crowd levels for the best experience',
        logistics: {
            flights: `Check airline websites for flights to ${destName}`,
            trains: `Check IRCTC for trains to ${destName}`,
        },
        mapCenter: { lat: 20.5937, lng: 78.9629 },
        highlights: [],
        restaurants: [],
        hotels: [],
        dayPlans,
    };
}
