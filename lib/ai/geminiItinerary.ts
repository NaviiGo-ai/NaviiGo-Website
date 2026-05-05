// ─── Gemini-Powered Destination Enrichment ────────────────────────────────────
// Uses Gemini AI to ENRICH live Google Places data with cultural context,
// temple info, heritage significance, logistics, and travel tips.
// The actual itinerary personalization is ALWAYS done by the deterministic engine.

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DestInfo } from '@/app/itinerary/data';
import { fetchLiveDestinationData, liveDataToDestInfo } from '@/lib/api/googlePlaces';
import { getPlaceImage, FALLBACK_IMAGES } from '@/lib/imageMap';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Fetch live destination data from Google Places + enrich with Gemini.
 * Returns DestInfo ready for the deterministic personalization engine.
 */
export async function fetchDestinationDataWithGemini(params: {
    destName: string;
    purpose: string;
    budget: number;
    days: number;
}): Promise<DestInfo | null> {
    // Step 1: Try Google Places API for live data
    const liveData = await fetchLiveDestinationData(params.destName);

    if (liveData && liveData.attractions.length > 0) {
        console.log(`[GeminiEnrich] Got ${liveData.attractions.length} live attractions, enriching with Gemini...`);

        // Step 2: Use Gemini to add cultural context & logistics
        const enrichment = await getGeminiEnrichment(params.destName);

        // Step 3: Merge live data + Gemini enrichment into DestInfo
        return liveDataToDestInfo(params.destName, liveData, enrichment || undefined);
    }

    // Fallback: If Google Places fails, use Gemini for everything
    console.log(`[GeminiEnrich] Google Places failed, using full Gemini fallback...`);
    return await getFullGeminiData(params);
}

/**
 * Get cultural enrichment from Gemini (description, logistics, weather, crowd info).
 * This is lightweight — just context, not the full place data.
 */
async function getGeminiEnrichment(destName: string): Promise<{
    description: string;
    crowdLevel: string;
    crowdNote: string;
    logistics: { flights: string; trains: string };
    weather: Record<string, string>;
} | null> {
    if (!GEMINI_API_KEY) return null;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `For the Indian destination "${destName}", provide ONLY this JSON (no markdown):
{
  "description": "2-3 vivid sentences describing what makes this place special — mention heritage, temples, culture, food",
  "crowdLevel": "Low" or "Medium" or "High",
  "crowdNote": "Brief seasonal crowd info with best time to visit",
  "logistics": {
    "flights": "Nearest airport with code and approx fare from Delhi",
    "trains": "Nearest major railway station with code"
  },
  "weather": { "Jan": "temp range", "Feb": "temp range", "Mar": "temp range", "Apr": "temp range", "May": "temp range", "Jun": "temp range", "Jul": "temp range", "Aug": "temp range", "Sep": "temp range", "Oct": "temp range", "Nov": "temp range", "Dec": "temp range" }
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonStr = jsonMatch[1];
        const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (braceMatch) jsonStr = braceMatch[0];
        return JSON.parse(jsonStr);
    } catch (e: any) {
        console.error('[GeminiEnrich] Enrichment failed:', e.message);
        return null;
    }
}

/**
 * Full Gemini fallback — generates complete destination data when Google Places fails.
 */
async function getFullGeminiData(params: {
    destName: string;
    purpose: string;
    budget: number;
    days: number;
}): Promise<DestInfo | null> {
    if (!GEMINI_API_KEY) {
        console.error('[GeminiData] No GEMINI_API_KEY configured');
        return null;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an expert Indian travel data provider. Return ONLY raw destination data for ${params.destName}, India as JSON (no markdown):
{
  "description": "2-3 vivid sentences",
  "avgCost": "₹X – ₹Y per day",
  "crowdLevel": "Low/Medium/High",
  "crowdNote": "seasonal info",
  "logistics": { "flights": "airport info", "trains": "station info" },
  "weather": { "Jan": "range", ... "Dec": "range" },
  "mapCenter": { "lat": number, "lng": number },
  "highlights": [{ "name": "Real Name", "desc": "1-2 sentences with entry fees, timings for temples", "tags": ["Heritage"], "lat": number, "lng": number }],
  "restaurants": [{ "name": "Real Name", "desc": "1-2 sentences", "cuisine": "type", "priceRange": "₹X–₹Y", "rating": 4.5, "mustTry": "dish", "lat": number, "lng": number, "tags": ["Local"] }],
  "hotels": [{ "name": "Real Name", "desc": "1-2 sentences", "type": "Hotel/Resort/Hostel/Homestay", "priceRange": "₹X/night", "rating": 4.3, "amenities": ["WiFi"], "lat": number, "lng": number }]
}
Rules: 6-8 highlights, 4 restaurants, 3-4 hotels. Use REAL names and coordinates.`;

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
            weather: parsed.weather || {},
            mapCenter: parsed.mapCenter,
            highlights: (parsed.highlights || []).map((h: any) => ({
                name: h.name, img: destImg, desc: h.desc,
                bestMonths: h.bestMonths || 'Oct – Mar', duration: h.duration || '1–3 hrs',
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
