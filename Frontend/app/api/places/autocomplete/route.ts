import { NextRequest, NextResponse } from 'next/server';

/**
 * Place Autocomplete — Uses Nominatim (OpenStreetMap)
 * Free, no API key required. No local/mock data.
 * GET /api/places/autocomplete?input=Mumbai
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input') ?? '';

  if (input.length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=6&countrycodes=in&email=contact@naviigo.com`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NaviiGo/1.0 (travel-app)' },
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    const predictions = (data || []).map((p: any) => {
      const parts = p.display_name?.split(',') || [];
      const cityName = parts[0]?.trim() || 'Unknown';
      const region = parts.slice(1, 3).join(',').trim() || 'India';
      return {
        description: cityName,
        place_id: p.place_id?.toString(),
        sub: p.address?.state || region,
      };
    });

    return NextResponse.json({ predictions });
  } catch (err: any) {
    console.error('[Autocomplete] Nominatim error:', err.message);
    return NextResponse.json({ predictions: [] });
  }
}
