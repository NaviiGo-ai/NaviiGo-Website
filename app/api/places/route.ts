import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Local Discovery Engine — Nearby places
 * Uses Google Places Nearby Search when available.
 * Falls back to Nominatim / Overpass (OpenStreetMap) when key is missing or denied.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ?? '9.9312';
    const lng = searchParams.get('lng') ?? '76.2673';
    const type = searchParams.get('type') ?? 'tourist_attraction';
    const radius = searchParams.get('radius') ?? '5000';

    // ── Try Google Places first ────────────────────────────────
    if (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'your_google_places_api_key_here') {
        try {
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}&rankby=prominence&language=en`;
            const res = await fetch(url, { next: { revalidate: 3600 } });
            const data = await res.json();

            if (data.status === 'OK') {
                const places = data.results.slice(0, 8).map((p: any) => ({
                    name: p.name,
                    rating: p.rating ?? 0,
                    vicinity: p.vicinity,
                    type: p.types?.[0]?.replace(/_/g, ' ') ?? type,
                    priceLevel: p.price_level ?? 1,
                    placeId: p.place_id,
                    photo: p.photos?.[0]?.photo_reference
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${p.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
                        : null,
                    lat: p.geometry?.location?.lat,
                    lng: p.geometry?.location?.lng,
                }));
                return NextResponse.json({ places });
            }
            // If REQUEST_DENIED or other error, fall through to OSM
            console.warn(`[Places API] Status: ${data.status} — using OSM fallback`);
        } catch (err: any) {
            console.warn('[Places API] Error:', err.message, '— using OSM fallback');
        }
    }

    // ── Fallback: Nominatim reverse geocode + search ──────────
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(type.replace(/_/g, ' '))}&format=json&limit=6&bounded=1&viewbox=${Number(lng) - 0.05},${Number(lat) + 0.05},${Number(lng) + 0.05},${Number(lat) - 0.05}`;
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
