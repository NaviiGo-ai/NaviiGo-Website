import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

/**
 * Google Places API — Nearby Search for restaurants/hotels near a destination.
 * GET /api/places/details?lat=26.9&lng=75.7&type=restaurant&query=best+restaurants+jaipur
 *
 * Returns formatted data matching our Restaurant/Hotel interfaces.
 * Cached with 24-hour revalidation to minimize API costs.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') || '20.5937';
    const lng = searchParams.get('lng') || '78.9629';
    const type = searchParams.get('type') || 'restaurant'; // restaurant | lodging | tourist_attraction
    const query = searchParams.get('query') || '';
    const radius = searchParams.get('radius') || '5000'; // meters

    if (!GOOGLE_PLACES_KEY) {
        return NextResponse.json({
            success: true,
            results: [],
            _note: 'No Google Places API key configured. Set GOOGLE_PLACES_API_KEY in .env.local',
        });
    }

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', radius);
        url.searchParams.set('type', type);
        if (query) url.searchParams.set('keyword', query);
        url.searchParams.set('key', GOOGLE_PLACES_KEY);

        const res = await fetch(url.toString(), {
            next: { revalidate: 86400 }, // Cache 24 hours
        });

        if (!res.ok) throw new Error('Google Places API error');
        const data = await res.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.warn('[Places] API status:', data.status, data.error_message);
            return NextResponse.json({ success: true, results: [], _status: data.status });
        }

        const results = (data.results || []).slice(0, 10).map((place: any) => ({
            id: place.place_id,
            name: place.name,
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            priceLevel: place.price_level, // 0-4
            vicinity: place.vicinity,
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng,
            isOpen: place.opening_hours?.open_now ?? null,
            types: place.types || [],
            photo: place.photos?.[0]
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_KEY}`
                : null,
        }));

        return NextResponse.json({
            success: true,
            results,
            total: data.results?.length || 0,
        });

    } catch (error: any) {
        console.error('[Places] Error:', error.message);
        return NextResponse.json(
            { success: false, results: [], error: error.message },
            { status: 500 }
        );
    }
}
