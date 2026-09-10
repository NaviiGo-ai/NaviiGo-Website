import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

// In-memory cache to avoid repeated API calls for the same place
const photoCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Places Photo Proxy — resolves a place name + city into a real Google Places photo.
 *
 * GET /api/places/photo?name=MG+Marg&city=Gangtok&w=800
 *
 * How it works:
 * 1. Google Places Text Search finds the place for the given name (+ city).
 * 2. We take the first result's photo_reference.
 * 3. We return the backend proxy URL (`{python-api}/api/places/photo/<ref>`).
 *    The backend streams the actual image bytes with the API key — the browser
 *    never sees a `maps.googleapis.com` URL carrying the key.
 *
 * If no key is configured, the place has no photo, or the search fails we return
 * `{ url: '' }` so the caller keeps its local fallback image.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const city = searchParams.get('city') || '';
    const rawWidth = parseInt(searchParams.get('w') || '800', 10);
    const maxWidth = Math.min(1600, Math.max(100, Number.isFinite(rawWidth) ? rawWidth : 800));

    if (!name) {
        return NextResponse.json({ error: 'Missing "name" parameter' }, { status: 400 });
    }

    const cacheKey = `${name}|${city}`.toLowerCase();
    const cached = photoCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json({ url: cached.url });
    }

    if (!GOOGLE_PLACES_API_KEY) {
        return NextResponse.json({ url: '' });
    }

    try {
        const query = city ? `${name} ${city}` : name;
        const params = new URLSearchParams({
            query,
            key: GOOGLE_PLACES_API_KEY,
            inputtype: 'textquery',
        });
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;

        const res = await fetch(searchUrl);
        if (!res.ok) throw new Error(`Google Places Text Search ${res.status}`);

        const data = await res.json();
        if (data?.status && data.status !== 'OK') {
            // Google returns HTTP 200 even for denied/bad-key requests — surface it.
            console.error(
                `[Places Photo] ${data.status}${data.error_message ? `: ${data.error_message}` : ''}`
            );
            return NextResponse.json({ url: '' });
        }
        const photoReference = data?.results?.[0]?.photos?.[0]?.photo_reference;
        if (!photoReference) {
            return NextResponse.json({ url: '' });
        }

        // Serve bytes via the backend proxy so the API key never reaches the client.
        const url = `${PYTHON_API_URL}/api/places/photo/${encodeURIComponent(photoReference)}?maxwidth=${maxWidth}`;

        photoCache.set(cacheKey, { url, ts: Date.now() });

        return NextResponse.json({ url });
    } catch (err: any) {
        console.error('[Places Photo] Error:', err?.message || err);
        return NextResponse.json({ url: '' });
    }
}
