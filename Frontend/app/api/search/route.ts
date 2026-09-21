import { NextResponse } from 'next/server';
import { SearchParams, searchFlights, searchTrains, searchCabs, searchHotels } from '@/lib/api/travel-search';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.type || !body.from || !body.to || !body.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    const { type, from, to, date, checkout, travelers = 1, page = 1 } = body;
    const params: any = { type, from, to, date, checkout, travelers };

    let results: any[] = [];
    switch (type) {
      case "flights": results = await searchFlights(params, page); break;
      case "trains": results = await searchTrains(params); break;
      case "cabs": results = await searchCabs(params); break;
      case "hotels": results = await searchHotels(params, page); break;
      default: return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
    }

    // Enrich results with metadata for deep link builders
    if (Array.isArray(results)) {
      results.forEach(res => {
        if (!res) return;
        res._date = date; // Pass search date to booking portal for OTA deep links
        res._checkout = checkout;
      });
      // Sort strictly by truthful price if available
      results.sort((a, b) => {
        if (a.priceNum && b.priceNum) return a.priceNum - b.priceNum;
        if (a.priceNum) return -1;
        if (b.priceNum) return 1;
        return 0;
      });
    } else {
      results = [];
    }

    return NextResponse.json(
      { success: true, results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=59',
        },
      }
    );
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
