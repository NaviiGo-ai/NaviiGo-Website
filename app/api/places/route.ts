import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * Local Discovery Engine — Google Places Nearby Search
 * Falls back to curated mock data when no API key is set.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat') ?? '9.9312';
    const lng = searchParams.get('lng') ?? '76.2673';
    const type = searchParams.get('type') ?? 'tourist_attraction'; // restaurant | tourist_attraction | etc.
    const radius = searchParams.get('radius') ?? '5000';

    // ── MOCK MODE ──────────────────────────────────────────────
    if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your_google_places_api_key_here') {
        return NextResponse.json({
            places: [
                { name: 'Hidden Bamboo Grove', rating: 4.7, vicinity: '1.2 km away', type: 'Nature Spot', priceLevel: 1, photo: '1593693397690-362cb9666fc2' },
                { name: 'Local Toddy Shop', rating: 4.5, vicinity: '0.8 km away', type: 'Local Experience', priceLevel: 1, photo: '1517248135467-4c7edcad34c4' },
                { name: 'Fishermen\'s Village Market', rating: 4.6, vicinity: '2.1 km away', type: 'Market', priceLevel: 1, photo: '1512343779784-a1d53b98b8ef' },
                { name: 'Cliff Viewpoint', rating: 4.8, vicinity: '3.4 km away', type: 'Viewpoint', priceLevel: 0, photo: '1626621341517-bbf3d9990a23' },
                { name: 'Village Spice Garden', rating: 4.4, vicinity: '1.7 km away', type: 'Garden Tour', priceLevel: 2, photo: '1549366021-d6d0bdb29a8b' },
            ],
            _mock: true,
        });
    }

    // ── LIVE MODE ──────────────────────────────────────────────
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}&rankby=prominence&language=en`;
        const res = await fetch(url, { next: { revalidate: 3600 } });
        const data = await res.json();

        if (data.status !== 'OK') {
            throw new Error(data.status);
        }

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
    } catch (err: any) {
        console.error('[Places API Error]', err.message);
        return NextResponse.json({ places: [], error: err.message }, { status: 200 });
    }
}
