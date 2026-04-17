import { NextResponse } from 'next/server';
import { SearchParams, searchFlights, searchTrains, searchCabs, searchHotels } from '@/lib/api/travel-search';

const cache = new Map<string, { timestamp: number; data: any[] }>();
const CACHE_TTL_MS = 10 * 60 * 1000; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.type || !body.from || !body.to || !body.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { type, from, to, date, travelers = 1, page = 1 } = body;
    const params: SearchParams = { type, from, to, date, travelers };

    const cacheKey = `${type}-${from}-${to}-${date}-${travelers}-p${page}`;
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, results: cachedEntry.data, cached: true });
    }

    let results: any[] = [];
    switch (type) {
      case "flights": results = await searchFlights(params, page); break;
      case "trains": results = await searchTrains(params); break;
      case "cabs": results = await searchCabs(params); break;
      case "hotels": results = await searchHotels(params, page); break;
      default: return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }

    // Enrich results with metadata for deep link builders
    results.forEach(res => {
      const baseRating = res.rating || (res.stars ? res.stars : 4.0);
      res.score = (baseRating * 1000) - (res.priceNum || Number.MAX_SAFE_INTEGER);
      res._date = date; // Pass search date to booking portal for OTA deep links
    });
    
    results.sort((a, b) => b.score - a.score);

    cache.set(cacheKey, { timestamp: Date.now(), data: results });

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
