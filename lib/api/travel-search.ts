export interface SearchParams {
  type: "flights" | "hotels" | "cabs" | "trains";
  from: string;
  to: string;
  date: string;
  travelers: number;
}

const CITY_MAP: Record<string, { iata: string; station: string }> = {
  'mumbai': { iata: 'BOM', station: 'CSMT' },
  'delhi': { iata: 'DEL', station: 'NDLS' },
  'bangalore': { iata: 'BLR', station: 'SBC' },
  'chennai': { iata: 'MAA', station: 'MAS' },
  'kolkata': { iata: 'CCU', station: 'HWH' },
  'hyderabad': { iata: 'HYD', station: 'SC' },
  'pune': { iata: 'PNQ', station: 'PUNE' },
  'ahmedabad': { iata: 'AMD', station: 'ADI' },
  'jaipur': { iata: 'JAI', station: 'JP' },
  'varanasi': { iata: 'VNS', station: 'BSB' },
  'goa': { iata: 'GOI', station: 'MAO' },
  'kochi': { iata: 'COK', station: 'ERS' },
  'udaipur': { iata: 'UDR', station: 'UDZ' },
  'agra': { iata: 'AGR', station: 'AGC' },
  'rishikesh': { iata: 'DED', station: 'HW' },
  'manali': { iata: 'KUU', station: 'CDG' },
  'amritsar': { iata: 'ATQ', station: 'ASR' },
  'jodhpur': { iata: 'JDH', station: 'JU' },
  'jharsuguda': { iata: 'JRG', station: 'JSG' },
  'patna': { iata: 'PAT', station: 'PNBE' },
  'lucknow': { iata: 'LKO', station: 'LKO' },
  'bhubaneswar': { iata: 'BBI', station: 'BBS' },
  'guwahati': { iata: 'GAU', station: 'GHY' },
  'chandigarh': { iata: 'IXC', station: 'CDG' },
  'dehradun': { iata: 'DED', station: 'DDN' },
  'indore': { iata: 'IDR', station: 'INDB' },
  'bhopal': { iata: 'BHO', station: 'BPL' },
  'ranchi': { iata: 'IXR', station: 'RNC' },
  'raipur': { iata: 'RPR', station: 'R' },
  'surat': { iata: 'STV', station: 'ST' },
  'vadodara': { iata: 'BDQ', station: 'BRC' },
  'visakhapatnam': { iata: 'VTZ', station: 'VSKP' },
  'vijayawada': { iata: 'VGA', station: 'BZA' },
  'tirupati': { iata: 'TIR', station: 'TPTY' },
  'madurai': { iata: 'IXM', station: 'MDU' },
  'coimbatore': { iata: 'CJB', station: 'CBE' },
  'trivandrum': { iata: 'TRV', station: 'TVC' },
  'shillong': { iata: 'SHL', station: 'GHY' },
  'haridwar': { iata: 'DED', station: 'HW' },
  'gaya': { iata: 'GAY', station: 'GAYA' },
  'prayagraj': { iata: 'IXD', station: 'PRYJ' },
  'gorakhpur': { iata: 'GOP', station: 'GKP' },
  'kanpur': { iata: 'KNU', station: 'CNB' },
};

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

const TRAIN_CORPUS = [
  { name: 'Vande Bharat Express', number: '22435', class: 'CC / EC', priceNum: 1450, tags: ['Fastest', 'Premium'], speed: 130 },
  { name: 'Shatabdi Express', number: '12002', class: 'CC / EC', priceNum: 1100, tags: ['Meals Incl.'], speed: 120 },
  { name: 'Rajdhani Express', number: '12424', class: '1A / 2A / 3A', priceNum: 2800, tags: ['Premium', 'Meals Incl.'], speed: 110 },
  { name: 'Duronto Express', number: '12260', class: '1A / 2A / 3A', priceNum: 2400, tags: ['Point to Point'], speed: 110 },
  { name: 'Gatiman Express', number: '12050', class: 'CC / EC', priceNum: 1200, tags: ['Hyper Fast'], speed: 160 },
  { name: 'Shiv Ganga Express', number: '12560', class: '3A / SL', priceNum: 800, tags: ['Superfast'], speed: 90 },
  { name: 'Kalinga Utkal Exp', number: '18478', class: '2A / 3A / SL', priceNum: 1100, tags: ['Long Distance'], speed: 70 },
  { name: 'Humsafar Express', number: '22317', class: '3A only', priceNum: 1400, tags: ['Premium 3A'], speed: 100 },
  { name: 'Garib Rath', number: '12203', class: '3A only', priceNum: 650, tags: ['Budget AC'], speed: 90 },
  { name: 'Sampark Kranti', number: '12650', class: '2A / 3A / SL', priceNum: 950, tags: ['State Special'], speed: 90 },
];

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
      console.error("Flight API failed, falling back:", err);
    }
  }

  if (page > 1) {
    return [
      { id: 'f5', airline: 'GoFirst', code: 'G8-225', from: fromCode, to: toCode, dep: '11:30', arr: '13:15', duration: '1h 45m', stops: 'Non-stop', price: '₹5,400', priceNum: 5400, class: 'Economy', seats: '3 seats left', tags: [], logo: '✈️', badge: null, priceDiff: '₹550 more', deepLink: deepLink },
      { id: 'f6', airline: 'AirAsia India', code: 'I5-780', from: fromCode, to: toCode, dep: '19:30', arr: '21:10', duration: '1h 40m', stops: 'Non-stop', price: '₹4,750', priceNum: 4750, class: 'Economy', seats: '6 seats', tags: ['Late Night'], logo: '✈️', badge: null, priceDiff: null, deepLink: deepLink },
    ];
  }
  return [
    { id: 'f1', airline: 'IndiGo', code: '6E-345', from: fromCode, to: toCode, dep: '06:15', arr: '07:45', duration: '1h 30m', stops: 'Non-stop', price: '₹4,850', priceNum: 4850, class: 'Economy', seats: '4 seats left', tags: ['Fastest'], logo: '✈️', badge: 'cheapest', priceDiff: null, deepLink: deepLink },
    { id: 'f2', airline: 'Air India', code: 'AI-403', from: fromCode, to: toCode, dep: '09:00', arr: '10:35', duration: '1h 35m', stops: 'Non-stop', price: '₹5,200', priceNum: 5200, class: 'Economy', seats: '12 seats', tags: ['Full Meal'], logo: '✈️', badge: 'bestvalue', priceDiff: '₹350 more', deepLink: deepLink },
    { id: 'f3', airline: 'SpiceJet', code: 'SG-118', from: fromCode, to: toCode, dep: '13:20', arr: '15:05', duration: '1h 45m', stops: 'Non-stop', price: '₹4,990', priceNum: 4990, class: 'Economy', seats: '8 seats', tags: [], logo: '✈️', badge: null, priceDiff: '₹140 more', deepLink: deepLink },
    { id: 'f4', airline: 'Vistara', code: 'UK-779', from: fromCode, to: toCode, dep: '17:45', arr: '19:20', duration: '1h 35m', stops: 'Non-stop', price: '₹6,100', priceNum: 6100, class: 'Business', seats: '2 seats left', tags: ['Business Class'], logo: '✈️', badge: null, priceDiff: '₹1,250 more', deepLink: deepLink },
  ];
}

export async function searchTrains(params: SearchParams) {
  const fromName = extractCode(params.from);
  const toName = extractCode(params.to);
  const fromCode = getCodes(fromName).station;
  const toCode = getCodes(toName).station;
  
  const [y, m, d] = (params.date || '').split('-');
  const dateCleartrip = (d && m && y) ? `${d}/${m}/${y}` : '';
  
  const cleartripLink = `https://www.cleartrip.com/trains/${fromCode}/${toCode}/${dateCleartrip}/1/0/0/0/0/0`;

  // Filter or generate results based on route
  // If it's a major route, show specific trains
  let results = [];
  
  if (fromCode === 'NDLS' && toCode === 'BSB') {
    results = [TRAIN_CORPUS[0], TRAIN_CORPUS[1], TRAIN_CORPUS[2], TRAIN_CORPUS[5]];
  } else if (fromCode === 'NDLS' && toCode === 'JSG') {
    results = [TRAIN_CORPUS[2], TRAIN_CORPUS[6], TRAIN_CORPUS[7], TRAIN_CORPUS[9]];
  } else {
    // Generate varied results for any other route
    results = [TRAIN_CORPUS[5], TRAIN_CORPUS[6], TRAIN_CORPUS[8], TRAIN_CORPUS[9]];
  }

  return results.map((t, i) => {
    const durationHours = Math.floor(1000 / t.speed) + i;
    return {
      id: `t${i}`,
      name: t.name,
      number: t.number,
      from: fromCode,
      to: toCode,
      fromName: fromName,
      toName: toName,
      dep: `${String(6 + i * 4).padStart(2, '0')}:30`,
      arr: `${String((6 + i * 4 + durationHours) % 24).padStart(2, '0')}:45`,
      duration: `${durationHours}h 15m`,
      class: t.class,
      price: `₹${t.priceNum.toLocaleString('en-IN')}`,
      priceNum: t.priceNum,
      avail: i % 2 === 0 ? 'Available' : 'Waitlist 4',
      tags: t.tags,
      days: 'Daily',
      badge: i === 0 ? 'fastest' : (i === 2 ? 'bestvalue' : null),
      priceDiff: null,
      deepLink: ''
    };
  });
}

export async function searchCabs(params: SearchParams) {
  const pickupEnc = encodeURIComponent(params.from || 'Airport');
  const dropEnc = encodeURIComponent(params.to || 'City');

  return [
    { id: 'c1', provider: 'Ola Outstation', type: 'Innova Crysta', category: 'SUV', pax: '6+1', price: '₹3,200', priceNum: 3200, perKm: '₹14/km', eta: '8 mins away', features: ['AC', 'GPS', 'Free Cancellation'], tags: ['Top Rated'], rating: 4.8, trips: '12.4k', badge: 'bestvalue', from: params.from, to: params.to, deepLink: `https://www.olacabs.com/` },
    { id: 'c2', provider: 'Uber', type: 'Toyota Etios', category: 'Sedan', pax: '4+1', price: '₹2,800', priceNum: 2800, perKm: '₹12/km', eta: '5 mins away', features: ['AC', 'GPS'], tags: [], rating: 4.5, trips: '8.9k', badge: 'cheapest', from: params.from, to: params.to, deepLink: `https://www.uber.com/in/en/ride/` },
  ];
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
      console.error("Hotel API failed, falling back to mock:", err);
    }
  }

  // Fallback
  const [y2, m2, d2] = (params.date || '').split('-');
  const bookingLink = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin_year=${y2}&checkin_month=${m2}&checkin_monthday=${d2}&no_rooms=1&group_adults=${params.travelers}`;
  return [
    { id: 'h1', name: 'Taj Nadesar Palace', area: city, stars: 5, price: '₹18,500', priceNum: 18500, perNight: '/night', rating: 4.9, reviews: 2840, amenities: ['Free Breakfast', 'Pool', 'Spa', 'Wifi', 'Gym'], tags: ['Luxury', 'Heritage'], image: '🏯', refundable: true, distance: '4.2 km from center', badge: 'bestvalue', deepLink: bookingLink },
    { id: 'h2', name: 'BrijRama Palace', area: city, stars: 5, price: '₹15,200', priceNum: 15200, perNight: '/night', rating: 4.8, reviews: 1920, amenities: ['Breakfast', 'River View', 'Wifi', 'Spa'], tags: ['Best Location', 'Ghat View'], image: '🏛️', refundable: true, distance: 'Central', badge: null, deepLink: bookingLink },
  ];
}
