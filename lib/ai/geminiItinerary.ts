// ─── Gemini-Powered Destination Enrichment ────────────────────────────────────
// Uses Gemini AI to ENRICH live Google Places data with cultural context,
// temple info, heritage significance, logistics, and travel tips.
// The actual itinerary personalization is ALWAYS done by the deterministic engine.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DestInfo } from '@/app/itinerary/data';
import { fetchLiveDestinationData, liveDataToDestInfo } from '@/lib/api/googlePlaces';
import { getPlaceImage, FALLBACK_IMAGES } from '@/lib/imageMap';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// Use 2.5-flash: active quota, and 1.5-flash is retired
const GEMINI_MODEL = 'gemini-2.5-flash';

/** Retry a Gemini call up to maxRetries times with exponential backoff on 429 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T | null> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (e: any) {
            const is429 = e?.message?.includes('429') || e?.message?.includes('Too Many Requests') || e?.message?.includes('quota');
            if (is429 && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 3000; // 3s, 6s
                console.warn(`[Gemini] Rate limited. Retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(res => setTimeout(res, delay));
                continue;
            }
            // On final attempt or non-429 error, log and return null
            console.error('[Gemini] Failed after retries:', e.message?.slice(0, 120));
            return null;
        }
    }
    return null;
}

import { fetchExactWeather } from '@/lib/api/weather';

/**
 * Fetch live destination data from Google Places + enrich with Gemini.
 * Returns DestInfo ready for the deterministic personalization engine.
 */
export async function fetchDestinationDataWithGemini(params: {
    destName: string;
    purpose: string;
    budget: number;
    days: number;
    originCity?: string | null;
}): Promise<DestInfo | null> {
    // Step 1: Try Google Places API for live data
    const liveData = await fetchLiveDestinationData(params.destName);

    if (liveData && liveData.attractions.length > 0) {
        console.log(`[GeminiEnrich] Got ${liveData.attractions.length} live attractions, enriching with Gemini...`);

        // Step 2: Use Gemini to add cultural context & logistics (with retry)
        const enrichment = await withRetry(() => getGeminiEnrichment(params.destName, params.originCity));
        
        // Exact Weather injection
        const liveWeather = await fetchExactWeather(liveData.center.lat, liveData.center.lng);
        if (liveWeather && enrichment) enrichment.weather = liveWeather;

        // Step 3: Merge live data + Gemini enrichment into DestInfo
        return liveDataToDestInfo(params.destName, liveData, enrichment || undefined);
    }

    // Fallback: If Google Places fails, use Gemini for everything
    console.log(`[GeminiEnrich] Google Places failed, using full Gemini fallback...`);
    const fullData = await withRetry(() => getFullGeminiData(params));
    if (fullData) {
        fullData.weather = await fetchExactWeather(fullData.mapCenter.lat, fullData.mapCenter.lng);
    }
    return fullData;
}

/**
 * Get cultural enrichment from Gemini (description, logistics, weather, crowd info).
 * This is lightweight — just context, not the full place data.
 */
async function getGeminiEnrichment(destName: string, originCity?: string | null): Promise<{
    description: string;
    crowdLevel: string;
    crowdNote: string;
    logistics: { flights: string; trains: string };
    weather: Record<string, string>;
    estimatedTravelCost?: string;
} | null> {
    if (!GEMINI_API_KEY) return null;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const travelCostPrompt = originCity 
        ? `\n  "estimatedTravelCost": "Estimate rough travel costs (e.g., flights, trains, gas) from ${originCity} to ${destName} (e.g. '₹4,000 - ₹7,000')",` 
        : `\n  "estimatedTravelCost": "Varies by origin",`;

    const prompt = `For the Indian destination "${destName}", provide ONLY this JSON (no markdown):
{
  "description": "3-4 highly evocative, poetic sentences describing what makes this place truly special — mention hidden heritage, specific local street foods, rich culture, and the exact vibe.",
  "crowdLevel": "Low" or "Medium" or "High",
  "crowdNote": "Specific crowd alerts (e.g. 'Extremely crowded from 12 PM - 3 PM, avoid school groups')",
  "logistics": {
    "flights": "Nearest airport with IATA code, approx distance/time to city center",
    "trains": "Nearest major railway station with code"
  },${travelCostPrompt}
  "weather": {}
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (braceMatch) jsonStr = braceMatch[0];
    return JSON.parse(jsonStr);
}

/**
 * Full Gemini fallback — generates complete destination data when Google Places fails.
 */
async function getFullGeminiData(params: {
    destName: string;
    purpose: string;
    budget: number;
    days: number;
    originCity?: string | null;
}): Promise<DestInfo | null> {
    if (!GEMINI_API_KEY) {
        console.error('[GeminiData] No GEMINI_API_KEY configured');
        return null;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const travelCostPrompt = params.originCity 
        ? `\n  "estimatedTravelCost": "Estimate rough travel costs (e.g., flights, trains) from ${params.originCity} to ${params.destName} (e.g. '₹5,000 - ₹9,000')",` 
        : `\n  "estimatedTravelCost": "Varies by origin",`;

    const prompt = `You are an expert, local Indian travel guide. Return ONLY raw destination data for ${params.destName}, India as strictly valid JSON (no markdown):
{
  "description": "3-4 highly evocative sentences describing the local vibe, hidden gems, and heritage.",
  "avgCost": "₹X – ₹Y per day",${travelCostPrompt}
  "crowdLevel": "Low/Medium/High",
  "crowdNote": "Exact crowd alerts (e.g., 'Avoid temples between 11 AM - 3 PM due to massive crowds')",
  "logistics": { "flights": "airport info", "trains": "station info" },
  "weather": {},
  "mapCenter": { "lat": number, "lng": number },
  "highlights": [{ "name": "Real Name", "desc": "2 detailed sentences with entry fees, exact timings (e.g., '6:00 AM - 8:00 PM'), and best spots for photos.", "tags": ["Heritage"], "lat": number, "lng": number, "duration": "1-2 hrs" }],
  "restaurants": [{ "name": "Real Name", "desc": "1-2 sentences", "cuisine": "type", "priceRange": "₹X–₹Y", "rating": 4.8, "mustTry": "dish", "lat": number, "lng": number, "tags": ["Local"] }],
  "hotels": [{ "name": "Real Name", "desc": "1-2 sentences", "type": "Hotel/Resort/Hostel/Homestay", "priceRange": "₹X/night", "rating": 4.5, "amenities": ["WiFi"], "lat": number, "lng": number }]
}
Rules: Generate exactly 20-25 highlights, 12 restaurants, and 8 hotels to ensure a dense itinerary. Provide extremely realistic names, coordinates, and exact timings.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
        const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (braceMatch) jsonStr = braceMatch[0];
        const parsed = JSON.parse(jsonStr);
        if (!parsed.highlights || !parsed.mapCenter) return null;

        const destImg = getPlaceImage(params.destName);
        return {
            description: parsed.description,
            avgCost: parsed.avgCost || '₹2,000 – ₹8,000',
            crowdLevel: parsed.crowdLevel || 'Medium',
            crowdNote: parsed.crowdNote || 'Check seasonal levels',
            logistics: parsed.logistics,
            estimatedTravelCost: parsed.estimatedTravelCost,
            weather: parsed.weather || {},
            mapCenter: parsed.mapCenter,
            highlights: (parsed.highlights || []).map((h: any) => ({
                name: h.name, img: destImg, desc: h.desc,
                bestMonths: h.bestMonths || 'Oct – Mar', duration: h.duration || '1.5 hrs',
                walking: 'Medium' as const, value: 'High' as const,
                tags: h.tags || ['Attraction'], lat: h.lat, lng: h.lng,
            })),
            restaurants: (parsed.restaurants || []).map((r: any, i: number) => ({
                id: `gr${i + 1}`, name: r.name, img: FALLBACK_IMAGES.restaurant, desc: r.desc,
                cuisine: r.cuisine || 'Local', priceRange: r.priceRange || '₹200–₹600',
                rating: r.rating || 4.0, mustTry: r.mustTry || 'House specialty',
                timing: '10:00 AM – 10:00 PM', lat: r.lat, lng: r.lng,
                tags: r.tags || ['Local'],
            })),
            hotels: (parsed.hotels || []).map((h: any, i: number) => ({
                id: `gh${i + 1}`, name: h.name, img: FALLBACK_IMAGES.hotel, desc: h.desc,
                type: h.type || 'Hotel', priceRange: h.priceRange || '₹3,000–₹8,000/night',
                rating: h.rating || 4.0, amenities: h.amenities || ['WiFi'],
                checkIn: '2:00 PM', lat: h.lat, lng: h.lng,
            })),
            dayPlans: [],
        };
    } catch (e: any) {
        console.error('[GeminiData] Full fallback failed:', e.message);
        return null;
    }
}

/**
 * Build a minimal fallback DestInfo when everything fails.
 */
export function buildMinimalDestInfo(destName: string): DestInfo {
    const img = getPlaceImage(destName);
    return {
        description: `${destName} — explore this beautiful Indian destination with NaviiGo.`,
        avgCost: '₹2,000 – ₹8,000',
        crowdLevel: 'Medium',
        crowdNote: 'Check seasonal crowd levels',
        logistics: { flights: `Search flights to ${destName}`, trains: `Search trains to ${destName}` },
        weather: { Jan: '10–25°C', Feb: '12–28°C', Mar: '16–32°C', Apr: '22–36°C', May: '25–40°C', Jun: '25–35°C', Jul: '23–30°C', Aug: '22–30°C', Sep: '22–32°C', Oct: '18–32°C', Nov: '12–28°C', Dec: '8–24°C' },
        mapCenter: { lat: 20.5937, lng: 78.9629 },
        highlights: [
            { name: `${destName} Heritage Walk`, img, desc: `Explore the historical heart of ${destName}.`, bestMonths: 'Oct – Mar', duration: '2–4 hrs', walking: 'Medium' as const, value: 'High' as const, tags: ['Heritage'], lat: 20.5937, lng: 78.9629 },
            { name: `${destName} Temple`, img, desc: `Visit the sacred temples and experience the spiritual atmosphere.`, bestMonths: 'All year', duration: '1–2 hrs', walking: 'Easy' as const, value: 'High' as const, tags: ['Temple', 'Spiritual'], lat: 20.5937, lng: 78.9629 },
            { name: `${destName} Market`, img, desc: `Discover local handicrafts and souvenirs.`, bestMonths: 'Oct – Mar', duration: '2–3 hrs', walking: 'Medium' as const, value: 'Medium' as const, tags: ['Shopping'], lat: 20.5937, lng: 78.9629 },
            { name: `Scenic Viewpoint`, img, desc: `Find the best panoramic view of ${destName}.`, bestMonths: 'Oct – Mar', duration: '1–2 hrs', walking: 'Easy' as const, value: 'High' as const, tags: ['Nature'], lat: 20.5937, lng: 78.9629 },
        ],
        restaurants: [
            { id: 'fr1', name: `${destName} Local Kitchen`, img: FALLBACK_IMAGES.restaurant, desc: 'Authentic local cuisine.', cuisine: 'Local', priceRange: '₹150–₹500', rating: 4.2, mustTry: 'Local Thali', timing: '10 AM – 10 PM', lat: 20.5937, lng: 78.9629, tags: ['Local'] },
            { id: 'fr2', name: 'Street Food Corner', img: FALLBACK_IMAGES.restaurant, desc: 'Best street food in town.', cuisine: 'Street Food', priceRange: '₹50–₹200', rating: 4.4, mustTry: 'Local Snacks', timing: '8 AM – 9 PM', lat: 20.5937, lng: 78.9629, tags: ['Street Food'] },
        ],
        hotels: [
            { id: 'fh1', name: `${destName} Heritage Hotel`, img: FALLBACK_IMAGES.hotel, desc: 'Comfortable heritage hotel.', type: 'Hotel', priceRange: '₹3,000–₹8,000/night', rating: 4.2, amenities: ['WiFi', 'Restaurant'], checkIn: '2:00 PM', lat: 20.5937, lng: 78.9629 },
            { id: 'fh2', name: `Budget Stay`, img: FALLBACK_IMAGES.hotel, desc: 'Clean and affordable.', type: 'Hostel', priceRange: '₹500–₹2,000/night', rating: 4.0, amenities: ['WiFi'], checkIn: '1:00 PM', lat: 20.5937, lng: 78.9629 },
        ],
        dayPlans: [],
    };
}
