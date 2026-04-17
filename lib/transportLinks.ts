// ─── Transport Deep Links & Fare Estimation ─────────────────────────────────
// Generates deep links and fare estimates for Ola, Uber, and local autos
// between itinerary activities.

export interface TransportOption {
    provider: string;
    icon: string;
    estimatedFare: string;
    estimatedTime: string;
    deepLink: string;
    webFallback: string;
    color: string;
}

// ─── Fare estimation formulas (per km, approximate 2025 rates) ───────────────

const FARE_RATES = {
    auto: { base: 30, perKm: 18, minFare: 30 },
    ola: { base: 50, perKm: 14, minFare: 80 },
    uber: { base: 45, perKm: 13, minFare: 75 },
    olaAuto: { base: 25, perKm: 15, minFare: 25 },
};

// ─── Haversine distance (km) ─────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateFare(distKm: number, rates: typeof FARE_RATES.auto): number {
    return Math.max(rates.minFare, Math.round(rates.base + distKm * rates.perKm));
}

function estimateDuration(distKm: number): number {
    // Average speed in Indian cities: ~20-25 km/h
    return Math.max(5, Math.round(distKm * 3));
}

// ─── Deep link generators ────────────────────────────────────────────────────

function olaDeepLink(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number): string {
    return `https://book.olacabs.com/?pickup_lat=${pickupLat}&pickup_lng=${pickupLng}&drop_lat=${dropLat}&drop_lng=${dropLng}`;
}

function uberDeepLink(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number, pickupName: string, dropName: string): string {
    return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&pickup[nickname]=${encodeURIComponent(pickupName)}&dropoff[latitude]=${dropLat}&dropoff[longitude]=${dropLng}&dropoff[nickname]=${encodeURIComponent(dropName)}`;
}

function googleMapsDirections(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number): string {
    return `https://www.google.com/maps/dir/${pickupLat},${pickupLng}/${dropLat},${dropLng}`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Get transport options between two points with fare estimates and deep links.
 */
export function getTransportOptions(
    pickupLat: number,
    pickupLng: number,
    dropLat: number,
    dropLng: number,
    pickupName: string = 'Pickup',
    dropName: string = 'Drop',
): TransportOption[] {
    const distKm = haversineKm(pickupLat, pickupLng, dropLat, dropLng);
    const durationMins = estimateDuration(distKm);

    // Don't show transport for very short distances
    if (distKm < 0.3) return [];

    const options: TransportOption[] = [];

    // Auto-rickshaw (for distances < 15km)
    if (distKm < 15) {
        options.push({
            provider: 'Auto',
            icon: '🛺',
            estimatedFare: `₹${estimateFare(distKm, FARE_RATES.auto)}`,
            estimatedTime: `${durationMins} min`,
            deepLink: googleMapsDirections(pickupLat, pickupLng, dropLat, dropLng),
            webFallback: googleMapsDirections(pickupLat, pickupLng, dropLat, dropLng),
            color: '#f59e0b',
        });
    }

    // Ola
    options.push({
        provider: 'Ola',
        icon: '🚗',
        estimatedFare: `₹${estimateFare(distKm, FARE_RATES.ola)}`,
        estimatedTime: `${durationMins} min`,
        deepLink: olaDeepLink(pickupLat, pickupLng, dropLat, dropLng),
        webFallback: olaDeepLink(pickupLat, pickupLng, dropLat, dropLng),
        color: '#22c55e',
    });

    // Uber
    options.push({
        provider: 'Uber',
        icon: '🚙',
        estimatedFare: `₹${estimateFare(distKm, FARE_RATES.uber)}`,
        estimatedTime: `${durationMins} min`,
        deepLink: uberDeepLink(pickupLat, pickupLng, dropLat, dropLng, pickupName, dropName),
        webFallback: uberDeepLink(pickupLat, pickupLng, dropLat, dropLng, pickupName, dropName),
        color: '#000000',
    });

    return options;
}

/**
 * Format distance for display.
 */
export function formatDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const km = haversineKm(lat1, lng1, lat2, lng2);
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
}
