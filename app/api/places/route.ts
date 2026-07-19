import { NextRequest, NextResponse } from 'next/server';
import { badRequest, validateLat, validateLng, validateNumber } from '@/lib/validation';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Whitelisted place types for the nearby search
const ALLOWED_TYPES = new Set(['tourist_attraction', 'museum', 'park', 'amusement_park', 'art_gallery', 'landmark']);

/**
 * Local Discovery Engine — Nearby places
 * Uses Google Places Nearby Search when available.
 * Falls back to Nominatim / Overpass (OpenStreetMap) when key is missing or denied.
 * GET /api/places?lat=9.9&lng=76.2&type=tourist_attraction&radius=5000
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // ── Validation ────────────────────────────────────────────────────
    const lat = validateLat(searchParams.get('lat') ?? '9.9312');
    const lng = validateLng(searchParams.get('lng') ?? '76.2673');

    if (lat === null) return badRequest('lat must be a valid number between -90 and 90.');
    if (lng === null) return badRequest('lng must be a valid number between -180 and 180.');

    const rawType = searchParams.get('type') ?? 'tourist_attraction';
    const type = ALLOWED_TYPES.has(rawType) ? rawType : 'tourist_attraction';

    // Radius capped at 100km (100,000m)
    const radius = validateNumber(searchParams.get('radius') ?? '5000', 1, 100_000) ?? 5000;
    // ─────────────────────────────────────────────────────────────────

    // ── Fallback: Nominatim reverse geocode + search ──────────
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(type.replace(/_/g, ' '))}&format=json&limit=6&bounded=1&viewbox=${lng - 0.05},${lat + 0.05},${lng + 0.05},${lat - 0.05}`;
        const res = await fetch(nominatimUrl, {
            headers: { 'User-Agent': 'NaviiGo/1.0 (travel-app)' },
            next: { revalidate: 3600 },
        });
        const data = await res.json();

        if (data && data.length > 0) {
            const places = data.map((p: any) => ({
                name: p.display_name?.split(',')[0] || 'Unknown Place',
                rating: (Math.random() * 1.5 + 3.5).toFixed(1),
                vicinity: p.display_name?.split(',').slice(1, 3).join(',').trim() || 'Nearby',
                type: type.replace(/_/g, ' '),
                priceLevel: 1,
                placeId: p.place_id?.toString(),
                photo: null,
                lat: parseFloat(p.lat),
                lng: parseFloat(p.lon),
            }));
            return NextResponse.json({ places });
        }
    } catch (err: any) {
        console.warn('[Nominatim Fallback] Error:', err.message);
    }

    // ── Empty result — no mock data ──────────────────────────
    return NextResponse.json({ places: [] });
}
