// ─── SerpAPI + Google Maps — Live Destination Data ────────────────────────────
// Fetches REAL attractions, restaurants, hotels with photos, ratings, reviews
// from Google Maps via SerpAPI for any destination in real-time.

const SERPAPI_KEY = process.env.SERPAPI_API_KEY || '';
const SERP_BASE = 'https://serpapi.com/search.json';

interface SerpPlace {
    position: number;
    title: string;
    place_id?: string;
    data_id?: string;
    data_cid?: string;
    reviews_original?: string;
    reviews?: number;
    rating?: number;
    type?: string;
    types?: string[];
    address?: string;
    description?: string;
    thumbnail?: string;
    gps_coordinates?: { latitude: number; longitude: number };
    open_state?: string;
    hours?: string;
    price?: string;
    phone?: string;
    link?: string;
}

export interface PlaceDetails {
    name: string;
    desc: string;
    lat: number;
    lng: number;
    rating: number;
    reviews: number;
    photoUrl?: string;
    tags: string[];
    type: string;
    priceRange?: string; // e.g. "$$" or "₹500-1000"
    mustTry?: string; // for restaurants
    hours?: string;
    walking?: string; // 'Easy' | 'Moderate' | 'Hard'
    duration?: string; // e.g. "2 hours"
    address?: string;
    bookingLink?: string; // Extracted booking/reservation link
}

// ─── SerpAPI Google Maps Search ──────────────────────────────────────────────
async function serpMapsSearch(query: string, lat: number, lng: number, type?: string): Promise<SerpPlace[]> {
    if (!SERPAPI_KEY) return [];
    const params = new URLSearchParams({
        engine: 'google_maps',
        q: query,
        api_key: SERPAPI_KEY,
        type: 'search',
        ll: `@${lat},${lng},13z`,
    });
    try {
        const res = await fetch(`${SERP_BASE}?${params}`);
        const data = await res.json();
        return data.local_results || [];
    } catch (e) {
        console.error('[SerpAPI] Maps search failed:', e);
        return [];
    }
}

// ─── Get destination coordinates from SerpAPI ────────────────────────────────
async function getDestCoords(destName: string): Promise<{ lat: number; lng: number } | null> {
    if (!SERPAPI_KEY) return null;
    const params = new URLSearchParams({
        engine: 'google_maps',
        q: `${destName} India`,
        api_key: SERPAPI_KEY,
        type: 'search',
    });
    try {
        const res = await fetch(`${SERP_BASE}?${params}`);
        const data = await res.json();
        const gps = data.search_information?.gps_coordinates || 
                     data.local_results?.[0]?.gps_coordinates;
        if (gps) return { lat: gps.latitude, lng: gps.longitude };
        // Fallback from place_results
        if (data.place_results?.gps_coordinates) {
            return { lat: data.place_results.gps_coordinates.latitude, lng: data.place_results.gps_coordinates.longitude };
        }
        return null;
    } catch { return null; }
}

// ─── Type inference ──────────────────────────────────────────────────────────
function inferTags(type: string, title: string): string[] {
    const t = (type + ' ' + title).toLowerCase();
    const tags: string[] = [];
    if (t.includes('temple') || t.includes('mandir')) tags.push('Temple', 'Spiritual');
    if (t.includes('mosque') || t.includes('masjid') || t.includes('dargah')) tags.push('Mosque', 'Spiritual');
    if (t.includes('church') || t.includes('cathedral')) tags.push('Church', 'Spiritual');
    if (t.includes('fort') || t.includes('palace') || t.includes('monument') || t.includes('heritage')) tags.push('Heritage');
    if (t.includes('museum') || t.includes('gallery')) tags.push('Museum', 'Culture');
    if (t.includes('park') || t.includes('garden') || t.includes('lake') || t.includes('waterfall')) tags.push('Nature');
    if (t.includes('beach')) tags.push('Beach');
    if (t.includes('market') || t.includes('bazaar') || t.includes('mall')) tags.push('Shopping');
    if (t.includes('trek') || t.includes('adventure') || t.includes('safari')) tags.push('Adventure');
    if (tags.length === 0) tags.push('Attraction');
    return tags.slice(0, 4);
}

function inferHotelType(name: string, type: string): 'Hotel' | 'Resort' | 'Hostel' | 'Homestay' {
    const n = (name + ' ' + type).toLowerCase();
    if (n.includes('resort') || n.includes('palace') || n.includes('retreat')) return 'Resort';
    if (n.includes('hostel') || n.includes('zostel') || n.includes('backpack') || n.includes('dormitor')) return 'Hostel';
    if (n.includes('homestay') || n.includes('home stay') || n.includes('bnb') || n.includes('cottage') || n.includes('villa')) return 'Homestay';
    return 'Hotel';
}

// ─── MAIN: Fetch live destination data from SerpAPI ──────────────────────────
export async function fetchLiveDestinationData(destName: string): Promise<{
    attractions: PlaceDetails[];
    restaurants: PlaceDetails[];
    hotels: PlaceDetails[];
    center: { lat: number; lng: number };
} | null> {
    if (!SERPAPI_KEY) {
        console.error('[SerpAPI] No SERPAPI_API_KEY configured');
        return null;
    }

    console.log(`[SerpAPI] Fetching live data for ${destName}...`);

    // Get coordinates first
    const coords = await getDestCoords(destName);
    if (!coords) {
        console.error(`[SerpAPI] Could not find coordinates for ${destName}`);
        return null;
    }

    console.log(`[SerpAPI] ${destName} coords: ${coords.lat}, ${coords.lng}`);

    // Run all three searches in parallel
    const [attractionResults, restaurantResults, hotelResults] = await Promise.all([
        serpMapsSearch(`best places to visit in ${destName}`, coords.lat, coords.lng),
        serpMapsSearch(`best restaurants famous food in ${destName}`, coords.lat, coords.lng),
        serpMapsSearch(`best hotels to stay in ${destName}`, coords.lat, coords.lng),
    ]);

    console.log(`[SerpAPI] Found: ${attractionResults.length} attractions, ${restaurantResults.length} restaurants, ${hotelResults.length} hotels`);

    // Convert to PlaceDetails
    const attractions: PlaceDetails[] = attractionResults.slice(0, 30).map(p => ({
        name: p.title,
        desc: p.description || `${p.type || 'Attraction'} in ${destName} with ${p.reviews || 0}+ reviews.`,
        lat: p.gps_coordinates?.latitude || coords.lat,
        lng: p.gps_coordinates?.longitude || coords.lng,
        rating: p.rating || 4.0,
        reviews: p.reviews || 0,
        photoUrl: p.thumbnail || '/destinations/delhi.png',
        tags: inferTags(p.type || '', p.title),
        type: p.type || 'Tourist attraction',
        hours: p.hours,
        address: p.address,
        bookingLink: p.link || `https://www.google.com/search?q=${encodeURIComponent('Book tickets ' + p.title + ' ' + destName)}`,
    })).filter(a => a.name);

    const restaurants: PlaceDetails[] = restaurantResults.slice(0, 20).map(p => ({
        name: p.title,
        desc: p.description || `${p.type || 'Restaurant'} in ${destName} — rated ${p.rating || 4.0}★.`,
        lat: p.gps_coordinates?.latitude || coords.lat,
        lng: p.gps_coordinates?.longitude || coords.lng,
        rating: p.rating || 4.0,
        reviews: p.reviews || 0,
        photoUrl: p.thumbnail || '/destinations/delhi.png',
        tags: ['Restaurant'],
        type: p.type || 'Restaurant',
        priceRange: p.price || '₹200–₹600',
        hours: p.hours,
        address: p.address,
        bookingLink: p.link || `https://www.zomato.com/search?q=${encodeURIComponent(p.title + ' ' + destName)}`,
    })).filter(r => r.name);

    const hotels: PlaceDetails[] = hotelResults.slice(0, 15).map(p => ({
        name: p.title,
        desc: p.description || `${inferHotelType(p.title, p.type || '')} in ${destName} — rated ${p.rating || 4.0}★.`,
        lat: p.gps_coordinates?.latitude || coords.lat,
        lng: p.gps_coordinates?.longitude || coords.lng,
        rating: p.rating || 4.0,
        reviews: p.reviews || 0,
        photoUrl: p.thumbnail || '/destinations/delhi.png',
        tags: ['Hotel'],
        type: p.type || 'Hotel',
        priceRange: p.price || '₹3,000–₹8,000/night',
        hours: p.hours,
        address: p.address,
        bookingLink: p.link || `https://www.agoda.com/search?text=${encodeURIComponent(p.title + ' ' + destName)}`,
    })).filter(h => h.name);

    return { attractions, restaurants, hotels, center: coords };
}

// ─── Convert SerpAPI data to DestInfo format ─────────────────────────────────
import type { DestInfo, Attraction, Restaurant, Hotel } from '@/app/itinerary/data';

export function liveDataToDestInfo(
    destName: string,
    liveData: { attractions: PlaceDetails[]; restaurants: PlaceDetails[]; hotels: PlaceDetails[]; center: { lat: number; lng: number } },
    geminiEnrichment?: { description?: string; crowdLevel?: string; crowdNote?: string; logistics?: { flights: string; trains: string }; weather?: Record<string, string> }
): DestInfo {
    const highlights: Attraction[] = liveData.attractions.map(a => ({
        name: a.name,
        img: a.photoUrl || '',
        desc: a.desc,
        bestMonths: 'Oct – Mar',
        duration: '1–3 hrs',
        walking: 'Medium' as const,
        value: (a.rating || 0) >= 4.3 ? 'High' as const : 'Medium' as const,
        tags: a.tags,
        lat: a.lat,
        lng: a.lng,
    }));

    const restaurants: Restaurant[] = liveData.restaurants.map((r, i) => ({
        id: `lr${i + 1}`,
        name: r.name,
        img: r.photoUrl || '',
        desc: r.desc,
        cuisine: r.type || 'Local',
        priceRange: r.priceRange || '₹200–₹600',
        rating: r.rating,
        mustTry: 'House specialty',
        timing: r.hours || '10:00 AM – 10:00 PM',
        lat: r.lat,
        lng: r.lng,
        tags: r.tags,
    }));

    const hotels: Hotel[] = liveData.hotels.map((h, i) => ({
        id: `lh${i + 1}`,
        name: h.name,
        img: h.photoUrl || '',
        desc: h.desc,
        type: inferHotelType(h.name, h.type),
        priceRange: h.priceRange || '₹3,000–₹8,000/night',
        rating: h.rating,
        amenities: ['WiFi'],
        checkIn: '2:00 PM',
        lat: h.lat,
        lng: h.lng,
    }));

    return {
        description: geminiEnrichment?.description || `${destName} — explore the best attractions, food and stays powered by live Google data.`,
        avgCost: '₹2,000 – ₹8,000',
        crowdLevel: (geminiEnrichment?.crowdLevel as any) || 'Medium',
        crowdNote: geminiEnrichment?.crowdNote || 'Check seasonal crowd levels',
        logistics: geminiEnrichment?.logistics || { flights: `Search flights to ${destName}`, trains: `Search trains to ${destName}` },
        weather: geminiEnrichment?.weather || { Jan: '10–25°C', Feb: '12–28°C', Mar: '16–32°C', Apr: '22–36°C', May: '25–40°C', Jun: '25–35°C', Jul: '23–30°C', Aug: '22–30°C', Sep: '22–32°C', Oct: '18–32°C', Nov: '12–28°C', Dec: '8–24°C' },
        mapCenter: liveData.center,
        highlights,
        restaurants,
        hotels,
        dayPlans: [],
    };
}
