import { NextRequest, NextResponse } from 'next/server';
import {
    PLACES_API_BASE,
    PHOTO_FIELD_MASK,
    isValidPhotoName,
    placesApiError,
    placesPhotoProxyPath,
} from '@/lib/api/placesNew';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

// In-memory cache to avoid repeated API calls for the same place
const photoCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Places Photo Resolver — turns a place name + city into a real Google photo.
 *
 * GET /api/places/photo?name=MG+Marg&city=Gangtok&w=800
 *
 * How it works:
 * 1. Google Places `places:searchText` (API v1) finds the place for the given
 *    name (+ city); we ask for the photo resource name only.
 * 2. We return the backend proxy URL (`{python-api}/api/places/photo?name=...`).
 *    The backend streams the actual image bytes with the API key — the browser
 *    never sees a `places.googleapis.com` URL carrying the key.
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

        const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
                'X-Goog-FieldMask': PHOTO_FIELD_MASK,
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            // The New API uses real HTTP status codes, unlike the legacy API
            // which returned 200 with an error body — surface the detail either way.
            console.error(`[Places Photo] ${placesApiError(data, res.status)}`);
            return NextResponse.json({ url: '' });
        }

        const photoName = data?.places?.[0]?.photos?.[0]?.name;
        if (!isValidPhotoName(photoName)) {
            return NextResponse.json({ url: '' });
        }

        // Absolute URL — the API key never reaches the client.
        const url = `${PYTHON_API_URL}${placesPhotoProxyPath(photoName, maxWidth)}`;

        photoCache.set(cacheKey, { url, ts: Date.now() });

        return NextResponse.json({ url });
    } catch (err: any) {
        console.error('[Places Photo] Error:', err?.message || err);
        return NextResponse.json({ url: '' });
    }
}
