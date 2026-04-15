// ─── Amadeus Self-Service API Client ──────────────────────────────────────────
// Handles OAuth2 token management and all booking operations.
// Free tier: 2,000 flight searches + 10,000 bookings/month.

const AMADEUS_BASE = 'https://api.amadeus.com';
const AMADEUS_AUTH = 'https://api.amadeus.com/v1/security/oauth2/token';

// ─── Token Management ─────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
        return cachedToken.token;
    }

    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET must be set in .env.local');
    }

    const res = await fetch(AMADEUS_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Amadeus auth failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    cachedToken = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };

    return cachedToken.token;
}

async function amadeusRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await getAccessToken();
    const res = await fetch(`${AMADEUS_BASE}${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        const errBody = await res.text();
        console.error(`[Amadeus] ${options.method || 'GET'} ${endpoint} → ${res.status}:`, errBody);
        throw new Error(`Amadeus API error: ${res.status}`);
    }

    return res.json();
}

// ─── Flight Search ────────────────────────────────────────────────────────────

export interface FlightSearchParams {
    originCode: string;       // IATA code e.g. "DEL"
    destinationCode: string;  // IATA code e.g. "BOM"
    departureDate: string;    // YYYY-MM-DD
    returnDate?: string;      // YYYY-MM-DD (optional, for round trip)
    adults: number;
    travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    maxResults?: number;
}

export interface FlightOffer {
    id: string;
    source: string;
    price: {
        total: string;
        currency: string;
        grandTotal: string;
    };
    itineraries: Array<{
        duration: string;
        segments: Array<{
            departure: { iataCode: string; terminal?: string; at: string };
            arrival: { iataCode: string; terminal?: string; at: string };
            carrierCode: string;
            number: string;
            aircraft: { code: string };
            duration: string;
            numberOfStops: number;
        }>;
    }>;
    travelerPricings: any[];
    validatingAirlineCodes: string[];
    numberOfBookableSeats: number;
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    const searchParams = new URLSearchParams({
        originLocationCode: params.originCode,
        destinationLocationCode: params.destinationCode,
        departureDate: params.departureDate,
        adults: params.adults.toString(),
        max: (params.maxResults || 10).toString(),
        currencyCode: 'INR',
    });

    if (params.returnDate) {
        searchParams.set('returnDate', params.returnDate);
    }
    if (params.travelClass) {
        searchParams.set('travelClass', params.travelClass);
    }

    const data = await amadeusRequest(`/v2/shopping/flight-offers?${searchParams}`);
    return data.data || [];
}

// ─── Flight Pricing (confirm before booking) ─────────────────────────────────

export async function priceFlightOffer(offer: FlightOffer): Promise<{
    pricedOffer: FlightOffer;
    dictionaries: any;
}> {
    const data = await amadeusRequest('/v1/shopping/flight-offers/pricing', {
        method: 'POST',
        body: JSON.stringify({
            data: {
                type: 'flight-offers-pricing',
                flightOffers: [offer],
            },
        }),
    });

    return {
        pricedOffer: data.data.flightOffers[0],
        dictionaries: data.dictionaries,
    };
}

// ─── Flight Booking (actual booking!) ─────────────────────────────────────────

export interface FlightPassenger {
    id: string;
    dateOfBirth: string; // YYYY-MM-DD
    name: { firstName: string; lastName: string };
    gender: 'MALE' | 'FEMALE';
    contact: {
        emailAddress: string;
        phones: Array<{
            deviceType: 'MOBILE';
            countryCallingCode: string;
            number: string;
        }>;
    };
    documents?: Array<{
        documentType: 'PASSPORT' | 'ID_CARD';
        number: string;
        expiryDate: string;
        issuanceCountry: string;
        nationality: string;
        holder: boolean;
    }>;
}

export interface FlightBookingResult {
    id: string;
    type: string;
    associatedRecords: Array<{
        reference: string; // PNR
        creationDate: string;
        originSystemCode: string;
        flightOfferId: string;
    }>;
    travelers: any[];
    flightOffers: FlightOffer[];
}

export async function createFlightOrder(
    pricedOffer: FlightOffer,
    travelers: FlightPassenger[],
    remarks?: string
): Promise<FlightBookingResult> {
    const body: any = {
        data: {
            type: 'flight-order',
            flightOffers: [pricedOffer],
            travelers,
        },
    };

    if (remarks) {
        body.data.remarks = { general: [{ subType: 'GENERAL_MISCELLANEOUS', text: remarks }] };
    }

    const data = await amadeusRequest('/v1/booking/flight-orders', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    return data.data;
}

// ─── Hotel Search ─────────────────────────────────────────────────────────────

export interface HotelSearchParams {
    cityCode: string;     // IATA city code e.g. "DEL"
    checkInDate: string;  // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD
    adults: number;
    roomQuantity?: number;
    priceRange?: string;  // e.g. "100-300"
    currency?: string;
    ratings?: string[];   // e.g. ["3", "4", "5"]
}

export interface HotelOffer {
    hotel: {
        hotelId: string;
        name: string;
        cityCode: string;
        latitude: number;
        longitude: number;
        address?: { lines?: string[]; cityName?: string; countryCode?: string };
        rating?: string;
        amenities?: string[];
        media?: Array<{ uri: string; category: string }>;
    };
    offers: Array<{
        id: string;
        checkInDate: string;
        checkOutDate: string;
        room: {
            type: string;
            typeEstimated?: { category: string; beds: number; bedType: string };
            description?: { text: string };
        };
        price: {
            total: string;
            currency: string;
            base?: string;
        };
        policies?: {
            cancellation?: { deadline?: string; amount?: string; description?: { text: string } };
            paymentType?: string;
        };
    }>;
}

export async function searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
    // Step 1: Get hotel IDs in the city
    const listParams = new URLSearchParams({
        cityCode: params.cityCode,
        radius: '30',
        radiusUnit: 'KM',
        hotelSource: 'ALL',
    });

    if (params.ratings?.length) {
        listParams.set('ratings', params.ratings.join(','));
    }

    let hotelIds: string[] = [];
    try {
        const listData = await amadeusRequest(`/v1/reference-data/locations/hotels/by-city?${listParams}`);
        hotelIds = (listData.data || []).slice(0, 20).map((h: any) => h.hotelId);
    } catch (err) {
        console.error('[Amadeus] Hotel list failed:', err);
        return [];
    }

    if (hotelIds.length === 0) return [];

    // Step 2: Get offers for those hotels
    const offerParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults.toString(),
        roomQuantity: (params.roomQuantity || 1).toString(),
        currency: params.currency || 'INR',
    });

    try {
        const data = await amadeusRequest(`/v3/shopping/hotel-offers?${offerParams}`);
        return data.data || [];
    } catch (err) {
        console.error('[Amadeus] Hotel offers failed:', err);
        return [];
    }
}

// ─── Hotel Booking ────────────────────────────────────────────────────────────

export interface HotelGuest {
    name: { title: string; firstName: string; lastName: string };
    contact: {
        phone: string;
        email: string;
    };
}

export async function bookHotel(
    offerId: string,
    guests: HotelGuest[],
    payment?: {
        method: 'CREDIT_CARD';
        cardNumber: string;
        expiryDate: string;
        holderName: string;
    }
): Promise<any> {
    const body: any = {
        data: {
            offerId,
            guests: guests.map((g, i) => ({
                id: i + 1,
                name: g.name,
                contact: g.contact,
            })),
        },
    };

    if (payment) {
        body.data.payments = [{
            method: payment.method,
            card: {
                vendorCode: 'VI', // Visa default
                cardNumber: payment.cardNumber,
                expiryDate: payment.expiryDate,
            },
        }];
    }

    const data = await amadeusRequest('/v2/booking/hotel-orders', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    return data.data;
}

// ─── City/Airport Code Lookup ─────────────────────────────────────────────────

export async function lookupIATACode(cityName: string): Promise<string | null> {
    const params = new URLSearchParams({
        keyword: cityName,
        subType: 'CITY,AIRPORT',
        'page[limit]': '1',
    });

    try {
        const data = await amadeusRequest(`/v1/reference-data/locations?${params}`);
        const results = data.data || [];
        if (results.length > 0) {
            return results[0].iataCode;
        }
    } catch (err) {
        console.error('[Amadeus] IATA lookup failed:', err);
    }
    return null;
}

// ─── IATA Code Mapping for Common Indian Cities ──────────────────────────────

export const INDIAN_CITY_CODES: Record<string, string> = {
    'delhi': 'DEL',
    'new delhi': 'DEL',
    'mumbai': 'BOM',
    'bangalore': 'BLR',
    'bengaluru': 'BLR',
    'chennai': 'MAA',
    'kolkata': 'CCU',
    'hyderabad': 'HYD',
    'kochi': 'COK',
    'goa': 'GOI',
    'jaipur': 'JAI',
    'varanasi': 'VNS',
    'lucknow': 'LKO',
    'ahmedabad': 'AMD',
    'pune': 'PNQ',
    'guwahati': 'GAU',
    'chandigarh': 'IXC',
    'amritsar': 'ATQ',
    'srinagar': 'SXR',
    'leh': 'IXL',
    'dehradun': 'DED',
    'udaipur': 'UDR',
    'agra': 'AGR',
    'bhopal': 'BHO',
    'indore': 'IDR',
    'patna': 'PAT',
    'ranchi': 'IXR',
    'bhubaneswar': 'BBI',
    'thiruvananthapuram': 'TRV',
    'trivandrum': 'TRV',
    'coimbatore': 'CJB',
    'madurai': 'IXM',
    'mangalore': 'IXE',
    'calicut': 'CCJ',
    'kozhikode': 'CCJ',
    'bagdogra': 'IXB',
    'siliguri': 'IXB',
    'darjeeling': 'IXB',
    'manali': 'KUU',
    'shimla': 'SLV',
    'rishikesh': 'DED',
    'haridwar': 'DED',
    'nagpur': 'NAG',
    'visakhapatnam': 'VTZ',
    'raipur': 'RPR',
    'jammu': 'IXJ',
    'jodhpur': 'JDH',
    'alleppey': 'COK',
    'munnar': 'COK',
    'kerala': 'COK',
};

export function resolveCityCode(cityName: string): string | null {
    const key = cityName.toLowerCase().trim();
    return INDIAN_CITY_CODES[key] || null;
}
