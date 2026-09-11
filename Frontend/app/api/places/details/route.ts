import { NextRequest, NextResponse } from 'next/server';
import { badRequest, validateLat, validateLng, validateNumber, KNOWN_PLACE_TYPES } from '@/lib/validation';
import {
    PLACES_API_BASE,
    PLACE_FIELD_MASK,
    MAX_CIRCLE_RADIUS,
    MAX_RESULT_COUNT,
    normalizePlace,
    placesApiError,
    placesPhotoProxyPath,
} from '@/lib/api/placesNew';

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

// Per-type radius caps (the New API caps a circle at 50 km regardless).
const RADIUS_CAPS: Record<string, number> = {
    restaurant: 30_000,    // 30km
    lodging: 50_000,       // 50km
    tourist_attraction: 50_000, // 50km — New API maximum
};

/**
 * Google Places API (New) — nearby/named lookup for restaurants and hotels.
 * GET /api/places/details?lat=26.9&lng=75.7&type=restaurant&query=best+restaurants+jaipur
 *
 * Two New-API endpoints back this route:
 *   • with a `query`   → places:searchText   (free text + a location bias)
 *   • without a `query` → places:searchNearby (type + a hard restriction)
 *
 * searchNearby has no keyword parameter, which is why the free-text case falls
 * back to searchText — it is the only New-API endpoint that can resolve a
 * named place.
 *
 * Returns formatted data matching our Restaurant/Hotel interfaces.
 * Cached with 24-hour revalidation to minimize API costs.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // ── Validation ────────────────────────────────────────────────────
    const lat = validateLat(searchParams.get('lat') || '20.5937');
    const lng = validateLng(searchParams.get('lng') || '78.9629');

    if (lat === null) return badRequest('lat must be a valid number between -90 and 90.');
    if (lng === null) return badRequest('lng must be a valid number between -180 and 180.');

    const rawType = searchParams.get('type') || 'restaurant';
    const type = KNOWN_PLACE_TYPES.has(rawType as any) ? rawType : 'restaurant';

    // Apply per-type radius cap, then the New API's own 50km circle ceiling.
    const maxRadius = Math.min(RADIUS_CAPS[type] ?? MAX_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS);
    const radius = validateNumber(searchParams.get('radius') || '5000', 1, maxRadius) ?? 5000;

    // Sanitise the optional free-text query (max 100 chars)
    const rawQuery = searchParams.get('query') || '';
    const query = rawQuery.slice(0, 100).trim();
    // ─────────────────────────────────────────────────────────────────

    if (!GOOGLE_PLACES_KEY) {
        return NextResponse.json({
            success: true,
            results: [],
            _note: 'No Google Places API key configured. Set GOOGLE_PLACES_API_KEY in .env.local',
        });
    }

    const center = { latitude: lat, longitude: lng };

    try {
        const [path, body] = query
            ? [
                'places:searchText',
                {
                    textQuery: query,
                    maxResultCount: MAX_RESULT_COUNT,
                    locationBias: { circle: { center, radius } },
                },
            ]
            : [
                'places:searchNearby',
                {
                    includedTypes: [type],
                    maxResultCount: MAX_RESULT_COUNT,
                    locationRestriction: { circle: { center, radius } },
                },
            ];

        const res = await fetch(`${PLACES_API_BASE}/${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_KEY,
                'X-Goog-FieldMask': PLACE_FIELD_MASK,
                'Referer': 'https://naviigo.in/',
            },
            body: JSON.stringify(body),
            next: { revalidate: 86400 }, // Cache 24 hours
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            const detail = placesApiError(data, res.status);
            console.warn('[Places] API error:', detail);
            return NextResponse.json({ success: true, results: [], _status: detail });
        }

        const places: any[] = Array.isArray(data?.places) ? data.places : [];

        const results = places.slice(0, 10).map((raw) => {
            const place = normalizePlace(raw);
            return {
                id: place.id,
                name: place.name,
                rating: place.rating,
                userRatingsTotal: place.userRatingsTotal,
                priceLevel: place.priceLevel, // 0-4
                vicinity: place.vicinity,
                lat: place.lat,
                lng: place.lng,
                isOpen: place.isOpen,
                types: place.types,
                photo: place.photoName
                    ? `/api/places/photo?photoName=${encodeURIComponent(place.photoName)}&w=400`
                    : null,
            };
        });

        return NextResponse.json({
            success: true,
            results,
            total: places.length,
        });

    } catch (error: any) {
        console.error('[Places] Error:', error.message);
        return NextResponse.json(
            { success: false, results: [], error: error.message },
            { status: 500 }
        );
    }
}
