import { CITY_CODES_MAP, getDestinationById } from '@/lib/constants/destinations';

export interface SearchParams {
  type: "flights" | "hotels" | "cabs" | "trains";
  from: string;
  to: string;
  date: string;
  checkout?: string;
  travelers: number;
}

const CITY_MAP = CITY_CODES_MAP;

function getCodes(cityName: string) {
  const normalized = cityName?.toLowerCase().trim();
  
  // Direct match in map
  if (CITY_MAP[normalized]) return CITY_MAP[normalized];
  
  // Match by station/iata code directly if the user typed it
  const asCode = normalized.toUpperCase();
  for (const entry of Object.values(CITY_MAP)) {
    if (entry.iata === asCode || entry.station === asCode) return entry;
  }

  // Try partial match
  for (const [key, value] of Object.entries(CITY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  
  return null;
}

// Train search uses the Cleartrip deep link below; no fabricated train corpus.

function extractCode(str: string, isHotel = false): string {
  if (!str) return isHotel ? 'Varanasi' : 'DEL';
  const match = str.match(/\(([^)]+)\)/);
  if (match) return match[1];
  const firstPart = str.split(',')[0].trim();
  return firstPart;
}

// Google Flights deep link — always works, no blocking
function buildFlightLink(from: string, to: string, dateStr: string) {
  // Google Flights URL pattern: /travel/flights/results?tfs=...
  // Simple format that always loads the search page:
  return `https://www.google.com/travel/flights?q=flights+from+${from}+to+${to}+on+${dateStr}&curr=INR`;
}

export async function searchFlights(params: SearchParams, page = 1) {
  const fromName = extractCode(params.from);
  const toName = extractCode(params.to);
  const fromCodes = getCodes(fromName);
  const toCodes = getCodes(toName);

  // If we cannot resolve a known IATA code, return empty — never fabricate codes
  if (!fromCodes?.iata || !toCodes?.iata) {
    return [];
  }

  const fromCode = fromCodes.iata;
  const toCode = toCodes.iata;
  const startIndex = (page - 1) * 4;
  const deepLink = buildFlightLink(fromCode, toCode, params.date);

  if (process.env.SERPAPI_API_KEY) {
    try {
      const url = `https://serpapi.com/search.json?engine=google_flights&departure_id=${fromCode}&arrival_id=${toCode}&outbound_date=${params.date}&type=2&currency=INR&gl=in&hl=en&api_key=${process.env.SERPAPI_API_KEY}`;
      const res = await fetch(url, { next: { revalidate: 600 } });
      const data = await res.json();

      const allFlights = [
        ...(data.best_flights || []),
        ...(data.other_flights || [])
      ];

      if (allFlights.length > 0) {
        const pageResults = allFlights.slice(startIndex, startIndex + 4);
        return pageResults.map((f: any, i: number) => {
          const flight = f.flights[0];

          return {
            id: `api-f${startIndex + i}`,
            airline: flight.airline || 'Unknown Airline',
            code: flight.flight_number || 'N/A',
            from: fromCode,
            to: toCode,
            dep: flight.departure_airport?.time?.substring(11, 16) || 'N/A',
            arr: flight.arrival_airport?.time?.substring(11, 16) || 'N/A',
            duration: f.total_duration ? `${Math.floor(f.total_duration / 60)}h ${f.total_duration % 60}m` : 'N/A',
            stops: f.flights.length > 1 ? `${f.flights.length - 1} stop${f.flights.length > 2 ? 's' : ''}` : 'Non-stop',
            price: f.price ? `₹${Number(f.price).toLocaleString('en-IN')}` : 'Check price',
            priceNum: f.price || null,
            travelClass: flight.travel_class || null,
            logo: '✈️',
            priceDiff: null,
            deepLink: deepLink
          };
        });
      }
    } catch (err) {
      console.error("Flight API failed:", err);
    }
  }

  // Return empty results when API is unavailable - never fabricate data
  return [];
}

function createBoundedCache(maxSize: number, ttlSeconds: number) {
  const cache = new Map<string, { value: any; timestamp: number }>();
  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (!item) return undefined;
      if (Date.now() - item.timestamp > ttlSeconds * 1000) {
        cache.delete(key);
        return undefined;
      }
      return item.value;
    },
    set: (key: string, value: any) => {
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
      }
      cache.set(key, { value, timestamp: Date.now() });
    },
    has: (key: string) => {
      const item = cache.get(key);
      if (!item) return false;
      if (Date.now() - item.timestamp > ttlSeconds * 1000) {
        cache.delete(key);
        return false;
      }
      return true;
    }
  };
}

const geocodeCache = createBoundedCache(1000, 30 * 24 * 60 * 60); // 30 days
const routingCache = createBoundedCache(500, 60 * 60); // 1 hour

export async function getCoordinates(cityName: string, apiKey: string): Promise<{lat: number, lng: number} | null> {
  if (!cityName) return null;
  const normalized = cityName.trim().toLowerCase();
  
  const dest = getDestinationById(normalized);
  if (dest && dest.lat && dest.lng) {
    return { lat: dest.lat, lng: dest.lng };
  }
  
  if (geocodeCache.has(normalized)) {
    return geocodeCache.get(normalized)!;
  }
  
  if (!apiKey) return null;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(cityName)}&apiKey=${apiKey}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const coords = {
        lat: data.features[0].properties.lat,
        lng: data.features[0].properties.lon
      };
      geocodeCache.set(normalized, coords);
      return coords;
    }
  } catch (err) {
    console.error("Geocoding failed:", err);
  }
  return null;
}

export async function searchTrains(params: SearchParams) {
  const dateStr = params.date || new Date().toISOString().split('T')[0];
  const fromCodes = getCodes(params.from);
  const toCodes = getCodes(params.to);
  
  return [{
    id: `rail-handoff-${params.from}-${params.to}`,
    type: "rail_handoff",
    from: params.from,
    to: params.to,
    fromName: params.from,
    fromStationCode: fromCodes?.station || null,
    toName: params.to,
    toStationCode: toCodes?.station || null,
    date: dateStr,
    title: "Check live train availability"
  }];
}

export async function searchCabs(params: SearchParams) {
  const apiKey = process.env.GEOAPIFY_API_KEY || '';
  if (!apiKey) {
    return [{
      id: `cab-handoff-noapi`,
      type: "cab_handoff",
      from: params.from,
      to: params.to,
      distanceKm: null,
      durationMinutes: null,
      estimatedFareMin: null,
      estimatedFareMax: null,
      estimateSource: null,
      fareIsLive: false
    }];
  }

  const origin = await getCoordinates(params.from, apiKey);
  const dest = await getCoordinates(params.to, apiKey);

  if (!origin || !dest) {
     return [{
      id: `cab-handoff-nocoords`,
      type: "cab_handoff",
      from: params.from,
      to: params.to,
      distanceKm: null,
      durationMinutes: null,
      estimatedFareMin: null,
      estimatedFareMax: null,
      estimateSource: null,
      fareIsLive: false
    }];
  }

  const routeKey = `${origin.lat},${origin.lng}|${dest.lat},${dest.lng}`;
  let routeData = routingCache.get(routeKey);

  if (!routeData) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`https://api.geoapify.com/v1/routing?waypoints=${routeKey}&mode=drive&apiKey=${apiKey}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        routeData = {
          distance: props.distance, // in meters
          time: props.time // in seconds
        };
        routingCache.set(routeKey, routeData);
      }
    } catch (err) {
      console.error("Routing failed:", err);
    }
  }

  const distanceKm = routeData ? Math.round(routeData.distance / 1000) : null;
  const durationMinutes = routeData ? Math.round(routeData.time / 60) : null;

  const baseFare = Number(process.env.CAB_BASE_FARE_ESTIMATE || 100);
  const minPerKm = Number(process.env.CAB_PER_KM_ESTIMATE_MIN || 12);
  const maxPerKm = Number(process.env.CAB_PER_KM_ESTIMATE_MAX || 18);

  let estimatedFareMin = null;
  let estimatedFareMax = null;

  if (distanceKm !== null) {
    estimatedFareMin = baseFare + distanceKm * minPerKm;
    estimatedFareMax = baseFare + distanceKm * maxPerKm;
  }

  return [{
    id: `cab-handoff-${params.from}-${params.to}`,
    type: "cab_handoff",
    from: params.from,
    to: params.to,
    distanceKm,
    durationMinutes,
    estimatedFareMin,
    estimatedFareMax,
    estimateSource: distanceKm !== null ? "naviigo_distance_model" : null,
    fareIsLive: false
  }];
}

export async function searchHotels(params: SearchParams, page = 1) {
  const city = extractCode(params.to, true);

  if (!params.date || !params.checkout) {
    return [];
  }
  
  if (new Date(params.checkout) <= new Date(params.date)) {
    return [];
  }

  if (process.env.SERPAPI_API_KEY) {
    try {
      const offset = (page - 1) * 4;
      const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(city + ' hotels')}&check_in_date=${params.date}&check_out_date=${params.checkout}&adults=${params.travelers}&currency=INR&gl=in&hl=en&api_key=${process.env.SERPAPI_API_KEY}`;
      const res = await fetch(url, { next: { revalidate: 600 } });
      const data = await res.json();

      if (data.properties && data.properties.length > 0) {
        const pageResults = data.properties.slice(offset, offset + 4);
        return pageResults.map((h: any, i: number) => ({
          id: `api-h${offset + i}`,
          name: h.name || 'Unknown Hotel',
          area: city,
          stars: h.hotel_class ?? null,
          price: h.rate_per_night?.lowest ? `₹${Number(String(h.rate_per_night.lowest).replace(/[^0-9]/g, '')).toLocaleString('en-IN')}` : 'Price unavailable',
          priceNum: h.rate_per_night?.lowest ? Number(String(h.rate_per_night.lowest).replace(/[^0-9]/g, '')) : null,
          perNight: '/night',
          rating: h.overall_rating ?? null,
          reviews: h.reviews ?? 0,
          amenities: h.amenities ?? [],
          tags: [],
          image: h.images?.[0]?.thumbnail || '🏨',
          refundable: null,
          distance: null,
          badge: null,
          deepLink: h.link || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`
        }));
      }
    } catch (err) {
      console.error("Hotel API failed:", err);
    }
  }

  // Return empty results when API is unavailable - never fabricate data
  return [];
}
