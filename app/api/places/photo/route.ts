import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// In-memory cache to avoid repeated API calls for the same place
const photoCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Places Photo Proxy — resolves a place name + city into a real Google Places photo URL.
 * 
 * GET /api/places/photo?name=MG+Marg&city=Gangtok
 * 
 * How it works:
 * 1. Uses Google Places Text Search to find the place
 * 2. Gets the first photo reference from the result
 * 3. Returns the Google Places Photo URL
 * 
 * Caches results in-memory to minimize API calls.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const city = searchParams.get('city') || '';
    const maxWidth = parseInt(searchParams.get('w') || '800', 10);

    if (!name) {
        return NextResponse.json({ error: 'Missing "name" parameter' }, { status: 400 });
    }


    // Check cache
    const cacheKey = `${name}|${city}`.toLowerCase();
    const cached = photoCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json({ url: cached.url });
    }

    try {
        // Step 1: Search Wikipedia for the place
        const query = city ? `${name} ${city}` : name;
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&pithumbsize=${maxWidth}`;
        
        const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } });
        const searchData = await searchRes.json();

        const pages = searchData.query?.pages;
        if (!pages) {
            return NextResponse.json({ url: '' });
        }

        const pageId = Object.keys(pages)[0];
        const photoUrl = pages[pageId]?.thumbnail?.source;
        
        if (!photoUrl) {
            return NextResponse.json({ url: '' });
        }

        // Cache the result
        photoCache.set(cacheKey, { url: photoUrl, ts: Date.now() });

        return NextResponse.json({ url: photoUrl });
    } catch (err: any) {
        console.error('[Places Photo] Error:', err.message);
        return NextResponse.json({ url: '' });
    }
}
