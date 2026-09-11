import { NextRequest, NextResponse } from 'next/server';
import {
    PLACES_API_BASE,
    PHOTO_FIELD_MASK,
    isValidPhotoName,
    placesApiError,
    placesPhotoProxyPath,
} from '@/lib/api/placesNew';

const rawKey = process.env.GOOGLE_PLACES_API_KEY || '';
const GOOGLE_PLACES_API_KEY = rawKey.trim().replace(/^["']|["']$/g, '');
const GOOGLE_REFERER = 'https://naviigo.in/';

// In-memory cache to avoid repeated API calls for the same place
const photoCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Resolves a Google Places photo resource name into a direct Google CDN URL.
 * Google's /media endpoint issues a 302 redirect to https://lh3.googleusercontent.com/...
 * which can be rendered directly by any client without exposing the API key.
 */
async function resolvePhotoCdnUrl(photoName: string, maxWidth: number): Promise<string | null> {
    if (!GOOGLE_PLACES_API_KEY || !isValidPhotoName(photoName)) return null;
    try {
        const mediaRes = await fetch(
            `${PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${GOOGLE_PLACES_API_KEY}`,
            {
                headers: { 'Referer': GOOGLE_REFERER },
                redirect: 'manual',
            }
        );

        const location = mediaRes.headers.get('location');
        if (location) return location;

        return null;
    } catch (err: any) {
        console.error('[Places Photo] Failed to resolve media redirect:', err?.message || err);
        return null;
    }
}

/**
 * Places Photo Resolver — turns a place name + city into a real Google photo.
 *
 * GET /api/places/photo?name=MG+Marg&city=Gangtok&w=800
 * GET /api/places/photo?photoName=places/.../photos/...&w=800
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const photoNameParam = searchParams.get('photoName');
    const nameParam = searchParams.get('name');
    const city = searchParams.get('city') || '';
    const rawWidth = parseInt(searchParams.get('w') || '800', 10);
    const maxWidth = Math.min(1600, Math.max(100, Number.isFinite(rawWidth) ? rawWidth : 800));

    const isDebug = searchParams.get('debug') === '1' || searchParams.get('debug') === 'true';

    // Check if directly resolving a photo resource name
    const directPhotoName = isValidPhotoName(photoNameParam)
        ? photoNameParam
        : (isValidPhotoName(nameParam) ? nameParam : null);

    if (directPhotoName) {
        const cdnUrl = await resolvePhotoCdnUrl(directPhotoName, maxWidth);
        if (!cdnUrl) {
            if (isDebug) {
                return NextResponse.json({
                    error: 'Failed to resolve photo CDN redirect',
                    photoName: directPhotoName,
                    hasApiKey: !!GOOGLE_PLACES_API_KEY,
                }, { status: 502 });
            }
            return NextResponse.json({ url: '' });
        }

        // If requested directly as an image (e.g. from <img> src tag)
        const accept = req.headers.get('accept') || '';
        if (accept.includes('image/') && !accept.includes('application/json')) {
            return NextResponse.redirect(cdnUrl, 307);
        }

        return NextResponse.json({ url: cdnUrl });
    }

    const name = nameParam;
    if (!name) {
        return NextResponse.json({ error: 'Missing "name" or "photoName" parameter' }, { status: 400 });
    }

    const cacheKey = `${name}|${city}|${maxWidth}`.toLowerCase();
    const cached = photoCache.get(cacheKey);
    if (!isDebug && cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json({ url: cached.url });
    }

    if (!GOOGLE_PLACES_API_KEY) {
        console.error('[Places Photo] GOOGLE_PLACES_API_KEY is not defined in environment variables');
        if (isDebug) {
            return NextResponse.json({
                error: 'GOOGLE_PLACES_API_KEY environment variable is not defined on the server (check Vercel Project Settings > Environment Variables)',
                hasApiKey: false,
            }, { status: 500 });
        }
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
                'Referer': GOOGLE_REFERER,
            },
            body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            const errMsg = placesApiError(data, res.status);
            console.error(`[Places Photo] ${errMsg}`);
            if (isDebug) {
                return NextResponse.json({
                    error: errMsg,
                    status: res.status,
                    keyLength: GOOGLE_PLACES_API_KEY.length,
                    keyPrefix: GOOGLE_PLACES_API_KEY.slice(0, 8),
                    keySuffix: GOOGLE_PLACES_API_KEY.slice(-4),
                    rawHadQuotes: rawKey.startsWith('"') || rawKey.startsWith("'"),
                    googleResponse: data,
                }, { status: res.status });
            }
            return NextResponse.json({ url: '' });
        }

        const photoName = data?.places?.[0]?.photos?.[0]?.name;
        if (!isValidPhotoName(photoName)) {
            if (isDebug) {
                return NextResponse.json({
                    error: 'No photo found for this place in Google Places',
                    query,
                    googlePlaces: data?.places || [],
                });
            }
            return NextResponse.json({ url: '' });
        }

        // Resolve direct Google CDN URL (lh3.googleusercontent.com)
        const cdnUrl = await resolvePhotoCdnUrl(photoName, maxWidth);
        const finalUrl = cdnUrl || '';

        if (finalUrl) {
            photoCache.set(cacheKey, { url: finalUrl, ts: Date.now() });
        }

        if (isDebug) {
            return NextResponse.json({
                success: true,
                query,
                photoName,
                cdnUrl: finalUrl,
            });
        }

        return NextResponse.json({ url: finalUrl });
    } catch (err: any) {
        console.error('[Places Photo] Error:', err?.message || err);
        if (isDebug) {
            return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
        }
        return NextResponse.json({ url: '' });
    }
}
