// ─── AI Itinerary Generation Model ────────────────────────────────────────────
// Structured, context-aware itinerary generation using Google Gemini.
// Replaces the raw single-prompt approach with:
//   1. User context extraction (preferences, history)
//   2. Multi-part structured prompt
//   3. Output schema validation
//   4. Retry logic with fallback

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// ─── Output Schema ────────────────────────────────────────────────────────────

export interface GeneratedActivity {
    time: string;
    slot: 'Morning' | 'Afternoon' | 'Evening';
    name: string;
    desc: string;
    crowd: 'Low' | 'Medium' | 'High';
    crowdTip: string;
    travelFromPrev?: string;
    lat: number;
    lng: number;
    type?: 'attraction' | 'restaurant' | 'hotel';
    priceBase?: number;
    durationMins?: number;
}

export interface GeneratedDayPlan {
    day: number;
    title: string;
    weather: {
        temp: string;
        condition: string;
        emoji: string;
        rain: number;
        tip: string;
    };
    activities: GeneratedActivity[];
}

export interface GeneratedItinerary {
    destName: string;
    description: string;
    avgCost: string;
    crowdLevel: 'Low' | 'Medium' | 'High';
    crowdNote: string;
    logistics: {
        flights: string;
        trains: string;
    };
    highlights: Array<{
        name: string;
        desc: string;
        bestMonths: string;
        duration: string;
        tags: string[];
        lat: number;
        lng: number;
    }>;
    restaurants: Array<{
        name: string;
        desc: string;
        cuisine: string;
        priceRange: string;
        rating: number;
        mustTry: string;
        lat: number;
        lng: number;
    }>;
    hotels: Array<{
        name: string;
        desc: string;
        type: string;
        priceRange: string;
        rating: number;
        amenities: string[];
        lat: number;
        lng: number;
    }>;
    dayPlans: GeneratedDayPlan[];
    mapCenter: {
        lat: number;
        lng: number;
    };
}

// ─── User Context ─────────────────────────────────────────────────────────────

export interface UserContext {
    // From wizard form
    destination: string;
    destName: string;
    purpose: string;
    group: string;
    days: number;
    budget: number;
    startDate: string;

    // From Firestore (optional enrichment)
    preferences?: {
        travelStyle: string | null;
        interests: string[];
        dietaryPreferences: string[];
        accessibilityNeeds: string[];
    } | null;

    // Past trip history summary
    pastTrips?: Array<{
        destName: string;
        purpose: string;
    }>;
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompt(ctx: UserContext): string {
    const parts: string[] = [];

    // System context
    parts.push(`You are NaviiGo AI, an expert Indian travel planner. Generate a detailed, personalized travel itinerary for the user based on their preferences.`);

    // Core trip details
    parts.push(`
## Trip Details
- **Destination:** ${ctx.destName} (${ctx.destination})
- **Purpose:** ${ctx.purpose}
- **Group:** ${ctx.group}
- **Duration:** ${ctx.days} days
- **Budget per person:** ₹${ctx.budget.toLocaleString('en-IN')}
- **Start Date:** ${ctx.startDate}
`);

    // User preferences enrichment
    if (ctx.preferences) {
        const prefs = ctx.preferences;
        const prefLines: string[] = [];
        if (prefs.travelStyle) prefLines.push(`- Travel style: ${prefs.travelStyle}`);
        if (prefs.interests?.length) prefLines.push(`- Interests: ${prefs.interests.join(', ')}`);
        if (prefs.dietaryPreferences?.length) prefLines.push(`- Dietary: ${prefs.dietaryPreferences.join(', ')}`);
        if (prefs.accessibilityNeeds?.length) prefLines.push(`- Accessibility: ${prefs.accessibilityNeeds.join(', ')}`);
        if (prefLines.length) {
            parts.push(`## User Preferences\n${prefLines.join('\n')}`);
        }
    }

    // Past trip context
    if (ctx.pastTrips?.length) {
        parts.push(`## Past Trips (avoid repetition)\n${ctx.pastTrips.map(t => `- ${t.destName} (${t.purpose})`).join('\n')}`);
    }

    // Budget-aware guidance
    const budgetPerDay = ctx.budget / ctx.days;
    let budgetTier = 'budget';
    if (budgetPerDay > 5000) budgetTier = 'mid-range';
    if (budgetPerDay > 12000) budgetTier = 'luxury';

    parts.push(`## Budget Tier: ${budgetTier.toUpperCase()} (₹${Math.round(budgetPerDay).toLocaleString('en-IN')}/day)`);

    // Purpose-specific instructions
    const purposeInstructions: Record<string, string> = {
        spiritual: 'Focus on temples, ashrams, meditation centers, and spiritual experiences. Include darshan timings and dress code tips.',
        leisure: 'Prioritize relaxation — spas, beach time, scenic spots, slow cultural walks. Avoid packed schedules.',
        adventure: 'Include trekking, rafting, camping, paragliding, and outdoor activities. Mention difficulty levels and gear needed.',
        cultural: 'Focus on museums, forts, local art, cuisine experiences, and craft workshops. Include historical context.',
        honeymoon: 'Romantic settings — private dining, sunset spots, couples activities. Premium and intimate experiences.',
        celebrate: 'Group-friendly activities — clubs, group tours, adventure sports, shared dining. Fun and social.',
    };

    if (purposeInstructions[ctx.purpose]) {
        parts.push(`## Purpose-Specific Notes\n${purposeInstructions[ctx.purpose]}`);
    }

    // Output format
    parts.push(`
## Output Format
Return a valid JSON object with this EXACT structure (no markdown, no comments, just JSON):
{
  "destName": "${ctx.destName}",
  "description": "2-3 sentence description of the destination",
  "avgCost": "daily cost range in INR",
  "crowdLevel": "Low" | "Medium" | "High",
  "crowdNote": "when to visit for fewer crowds",
  "logistics": {
    "flights": "nearest airport and avg cost",
    "trains": "nearest major railway station"
  },
  "highlights": [
    {
      "name": "Place Name",
      "desc": "1-2 sentence description",
      "bestMonths": "e.g. Oct – Mar",
      "duration": "e.g. 2–4 hrs",
      "tags": ["Nature", "Culture"],
      "lat": 12.3456,
      "lng": 78.9012
    }
  ],
  "restaurants": [
    {
      "name": "Restaurant Name",
      "desc": "description",
      "cuisine": "cuisine type",
      "priceRange": "price range in INR",
      "rating": 4.5,
      "mustTry": "dish name",
      "lat": 12.3456,
      "lng": 78.9012
    }
  ],
  "hotels": [
    {
      "name": "Hotel Name",
      "desc": "description",
      "type": "Hotel" | "Homestay" | "Resort" | "Hostel",
      "priceRange": "price range in INR",
      "rating": 4.5,
      "amenities": ["Pool", "WiFi"],
      "lat": 12.3456,
      "lng": 78.9012
    }
  ],
  "dayPlans": [
    {
      "day": 1,
      "title": "Day title",
      "weather": {
        "temp": "temp range",
        "condition": "condition",
        "emoji": "weather emoji",
        "rain": 10,
        "tip": "weather tip"
      },
      "activities": [
        {
          "time": "06:30 AM",
          "slot": "Morning" | "Afternoon" | "Evening",
          "name": "Activity Name",
          "desc": "1-2 sentence description",
          "crowd": "Low" | "Medium" | "High",
          "crowdTip": "timing advice",
          "travelFromPrev": "e.g. 10 min walk",
          "lat": 12.3456,
          "lng": 78.9012,
          "type": "attraction" | "restaurant" | "hotel"
        }
      ]
    }
  ],
  "mapCenter": { "lat": 12.3456, "lng": 78.9012 }
}

CRITICAL RULES:
- Generate EXACTLY ${ctx.days} day plans
- Include 5-7 activities per day
- All lat/lng must be REAL coordinates for ${ctx.destName}
- Include at least 2 restaurant activities per day (lunch + dinner)
- Prices must be in INR and realistic for the ${budgetTier} tier
- Include 4-6 highlights, 3-4 restaurants, 2-3 hotels
- Each activity needs real coordinates — DO NOT make up coordinates
- Return ONLY valid JSON, no other text
`);

    return parts.join('\n\n');
}

// ─── Generation Engine ────────────────────────────────────────────────────────

const MAX_RETRIES = 2;

function extractJSON(text: string): string {
    // Try to find JSON block in markdown code fence
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) return fenceMatch[1].trim();

    // Try to find raw JSON object
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) return text.substring(start, end + 1);

    return text.trim();
}

function validateItinerary(data: any, expectedDays: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.destName) errors.push('Missing destName');
    if (!data.description) errors.push('Missing description');
    if (!data.mapCenter?.lat || !data.mapCenter?.lng) errors.push('Missing mapCenter');
    if (!Array.isArray(data.dayPlans)) errors.push('dayPlans is not an array');
    else if (data.dayPlans.length !== expectedDays) {
        // Allow close matches for flexibility
        if (Math.abs(data.dayPlans.length - expectedDays) > 1) {
            errors.push(`Expected ${expectedDays} day plans, got ${data.dayPlans.length}`);
        }
    }
    if (!Array.isArray(data.highlights) || data.highlights.length === 0) errors.push('No highlights');

    // Validate each day plan has activities
    if (Array.isArray(data.dayPlans)) {
        data.dayPlans.forEach((day: any, i: number) => {
            if (!Array.isArray(day.activities) || day.activities.length < 3) {
                errors.push(`Day ${i + 1} has too few activities`);
            }
        });
    }

    return { valid: errors.length === 0, errors };
}

export async function generateItinerary(ctx: UserContext): Promise<GeneratedItinerary | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY not set');
        return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
        },
    });

    const prompt = buildPrompt(ctx);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(`[ItineraryModel] Attempt ${attempt + 1}/${MAX_RETRIES + 1} for ${ctx.destName}`);

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = extractJSON(text);
            const parsed = JSON.parse(jsonStr);

            const validation = validateItinerary(parsed, ctx.days);
            if (validation.valid) {
                console.log('[ItineraryModel] Valid itinerary generated');
                return parsed as GeneratedItinerary;
            }

            console.warn('[ItineraryModel] Validation errors:', validation.errors);
            // If mostly valid (minor issues), still return it
            if (validation.errors.length <= 2 && parsed.dayPlans?.length > 0) {
                console.log('[ItineraryModel] Returning with minor issues');
                return parsed as GeneratedItinerary;
            }

        } catch (err) {
            console.error(`[ItineraryModel] Attempt ${attempt + 1} failed:`, err);
        }
    }

    console.error('[ItineraryModel] All attempts failed, returning null (will use fallback)');
    return null;
}

// ─── Temperature Mapping ──────────────────────────────────────────────────────
// Different trip types benefit from different creativity levels

export function getTemperatureForPurpose(purpose: string): number {
    const map: Record<string, number> = {
        spiritual: 0.5,    // more structured, reliable info
        leisure: 0.7,      // balanced creativity
        adventure: 0.8,    // more creative suggestions
        cultural: 0.6,     // factual but interesting
        honeymoon: 0.7,    // romantic creativity
        celebrate: 0.8,    // fun and varied
    };
    return map[purpose] ?? 0.7;
}
