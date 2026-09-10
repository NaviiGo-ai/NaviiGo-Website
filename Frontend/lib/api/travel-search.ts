import { CITY_CODES_MAP } from '@/lib/constants/destinations';

export interface SearchParams {
  type: "flights" | "hotels" | "cabs" | "trains";
  from: string;
  to: string;
  date: string;
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
  
  return { 
    iata: cityName?.substring(0, 3).toUpperCase() || 'DEL', 
    station: cityName?.substring(0, 3).toUpperCase() || 'NDLS' 
  };
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
  const fromCode = getCodes(fromName).iata;
  const toCode = getCodes(toName).iata;
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
            price: `₹${Number(f.price).toLocaleString('en-IN')}`,
            priceNum: f.price,
            class: 'Economy',
            seats: 'Available',
            tags: i === 0 && page === 1 ? ['Fastest'] : [],
            logo: '✈️',
            badge: i === 0 && page === 1 ? 'cheapest' : null,
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

export async function searchTrains(params: SearchParams) {
  // Return empty results when no live API is available — never fabricate trains.
  // (The frontend shows the IRCTC/Cleartrip deep link directly when results are empty.)
  return [];
}

export async function searchCabs(params: SearchParams) {
  const pickupEnc = encodeURIComponent(params.from || 'Airport');
  const dropEnc = encodeURIComponent(params.to || 'City');

  // Return empty results when API is unavailable - never fabricate data
  return [];
}

export async function searchHotels(params: SearchParams, page = 1) {
  const city = extractCode(params.to, true);

  if (process.env.SERPAPI_API_KEY) {
    try {
      const offset = (page - 1) * 4;
      const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(city + ' hotels')}&check_in_date=${params.date}&adults=${params.travelers}&currency=INR&gl=in&hl=en&api_key=${process.env.SERPAPI_API_KEY}`;
      const res = await fetch(url, { next: { revalidate: 600 } });
      const data = await res.json();

      if (data.properties && data.properties.length > 0) {
        const pageResults = data.properties.slice(offset, offset + 4);
        return pageResults.map((h: any, i: number) => ({
          id: `api-h${offset + i}`,
          name: h.name || 'Unknown Hotel',
          area: city,
          stars: h.hotel_class || 3,
          price: h.rate_per_night?.lowest ? `₹${Number(String(h.rate_per_night.lowest).replace(/[^0-9]/g, '')).toLocaleString('en-IN')}` : 'Price unavailable',
          priceNum: Number(String(h.rate_per_night?.lowest || '5000').replace(/[^0-9]/g, '')),
          perNight: '/night',
          rating: h.overall_rating || 4.0,
          reviews: h.reviews || 0,
          amenities: h.amenities?.slice(0, 5) || ['Wifi', 'AC'],
          tags: i === 0 && page === 1 ? ['Top Pick'] : [],
          image: h.images?.[0]?.thumbnail || '🏨',
          refundable: true,
          distance: h.nearby_places?.[0]?.name ? `Near ${h.nearby_places[0].name}` : 'Central location',
          badge: i === 0 && page === 1 ? 'bestvalue' : null,
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
