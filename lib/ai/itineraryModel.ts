// ─── Personalized Itinerary Generation Model ─────────────────────────────────
// Deterministic, scoring-based itinerary generation that uses ALL available
// user signals — wizard inputs, browsing analytics, Firestore preferences,
// and past trip history. Zero external API dependency.

import {
    DEST_DATA, DESTINATIONS, FALLBACK_DEST,
    type DestInfo, type DayPlan, type DayActivity,
    type Attraction, type Restaurant, type Hotel,
    type CrowdLevel, type TimeOfDay,
} from '@/app/itinerary/data';

// ─── Output Schema (unchanged from before) ───────────────────────────────────

export interface GeneratedActivity {
    time: string;
    slot: 'Morning' | 'Afternoon' | 'Evening';
    name: string;
    desc: string;
    crowd: 'Low' | 'Medium' | 'High';
    crowdTip: string;
    travelFromPrev?: string;
    lat: number;
    lng: number;
    type?: 'attraction' | 'restaurant' | 'hotel';
    priceBase?: number;
    durationMins?: number;
}

export interface GeneratedDayPlan {
    day: number;
    title: string;
    weather: {
        temp: string;
        condition: string;
        emoji: string;
        rain: number;
        tip: string;
    };
    activities: GeneratedActivity[];
}

export interface GeneratedItinerary {
    destName: string;
    description: string;
    avgCost: string;
    crowdLevel: 'Low' | 'Medium' | 'High';
    crowdNote: string;
    logistics: {
        flights: string;
        trains: string;
    };
    highlights: Array<{
        name: string;
        img: string;
        desc: string;
        bestMonths: string;
        duration: string;
        tags: string[];
        lat: number;
        lng: number;
    }>;
    restaurants: Array<{
        id: string;
        name: string;
        img: string;
        desc: string;
        cuisine: string;
        priceRange: string;
        rating: number;
        mustTry: string;
        lat: number;
        lng: number;
        tags: string[];
    }>;
    hotels: Array<{
        id: string;
        name: string;
        img: string;
        desc: string;
        type: string;
        priceRange: string;
        rating: number;
        amenities: string[];
        lat: number;
        lng: number;
    }>;
    dayPlans: GeneratedDayPlan[];
    mapCenter: {
        lat: number;
        lng: number;
    };
}

// ─── User Context ─────────────────────────────────────────────────────────────

export interface UserContext {
    destination: string;
    destName: string;
    purpose: string;
    group: string;
    days: number;
    budget: number;
    startDate: string;

    preferences?: {
        travelStyle: string | null;
        interests: string[];
        dietaryPreferences: string[];
        accessibilityNeeds: string[];
    } | null;

    pastTrips?: Array<{
        destName: string;
        purpose: string;
    }>;

    browsingSignals?: {
        timeOnCity: Record<string, number>;
        clickedCategories: string[];
        deepDiveVibes: Array<{ dest: string; companion: string; vibe: string }>;
        viewedDestinations: string[];
    } | null;
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

/** Purpose → tag affinity weights */
const PURPOSE_TAG_MAP: Record<string, Record<string, number>> = {
    spiritual: { Temple: 5, Spiritual: 5, Aarti: 4, Heritage: 3, Culture: 3, Buddhist: 4 },
    leisure: { Beach: 5, Nature: 4, Sunset: 4, Houseboat: 5, Safari: 3, Relaxation: 5 },
    adventure: { Trekking: 5, Mountains: 5, Snow: 4, Adventure: 5, Waterfall: 4, Safari: 3 },
    cultural: { History: 5, Culture: 5, Museum: 4, Heritage: 5, Fort: 4, Palace: 4, Shopping: 3, UNESCO: 4 },
    honeymoon: { Sunset: 5, Beach: 4, Nature: 4, Romantic: 5, Lake: 4 },
    celebrate: { Culture: 3, Shopping: 4, Market: 4, Fun: 5, Nightlife: 5 },
};

/** Group → crowd & walking preferences */
const GROUP_PREFS: Record<string, { crowdPref: CrowdLevel; walkPref: string }> = {
    solo: { crowdPref: 'Low', walkPref: 'Medium' },
    couple: { crowdPref: 'Low', walkPref: 'Easy' },
    family: { crowdPref: 'Low', walkPref: 'Easy' },
    friends: { crowdPref: 'Medium', walkPref: 'Medium' },
    large: { crowdPref: 'Medium', walkPref: 'Easy' },
};

interface ScoredAttraction extends Attraction {
    score: number;
    originalIndex: number;
}

function scoreAttraction(
    attr: Attraction,
    index: number,
    ctx: UserContext,
    budgetTier: string,
): ScoredAttraction {
    let score = 50; // baseline

    // 1. Purpose-tag alignment (most important signal)
    const tagWeights = PURPOSE_TAG_MAP[ctx.purpose] || {};
    for (const tag of attr.tags) {
        score += (tagWeights[tag] || 0) * 8;
    }

    // 2. Group-walk fit
    const groupPref = GROUP_PREFS[ctx.group] || GROUP_PREFS.solo;
    if (attr.walking === 'Easy' && groupPref.walkPref === 'Easy') score += 15;
    if (attr.walking === 'High' && groupPref.walkPref === 'Easy') score -= 20;

    // 3. Value alignment with budget tier
    if (budgetTier === 'budget' && attr.value === 'High') score += 10;
    if (budgetTier === 'luxury' && attr.value === 'Low') score -= 10;

    // 4. Browsing signals boost
    if (ctx.browsingSignals) {
        const signals = ctx.browsingSignals;
        // Boost if user spent time on this city
        const cityTime = signals.timeOnCity[ctx.destName] || 0;
        if (cityTime > 30) score += 5;
        if (cityTime > 120) score += 10;

        // Category click alignment
        for (const cat of signals.clickedCategories) {
            if (attr.tags.some(t => t.toLowerCase().includes(cat.toLowerCase()))) {
                score += 12;
            }
        }

        // Deep-dive vibe alignment
        const vibeEntry = signals.deepDiveVibes.find(v => v.dest === ctx.destName);
        if (vibeEntry) {
            const vibeMap: Record<string, string[]> = {
                'Authentic Exploration': ['Culture', 'History', 'Heritage', 'Walk'],
                'Food & Culinary': ['Food', 'Market', 'Shopping'],
                'Relaxation & Luxury': ['Beach', 'Nature', 'Sunset', 'Spa'],
                'Budget Backpacking': ['Trekking', 'Hostel', 'Walk', 'Market'],
            };
            const vibeTargets = vibeMap[vibeEntry.vibe] || [];
            for (const tag of attr.tags) {
                if (vibeTargets.some(v => tag.toLowerCase().includes(v.toLowerCase()))) {
                    score += 10;
                }
            }
        }
    }

    // 5. User preference boost
    if (ctx.preferences?.interests) {
        for (const interest of ctx.preferences.interests) {
            if (attr.tags.some(t => t.toLowerCase().includes(interest.toLowerCase()))) {
                score += 15;
            }
        }
    }

    // 6. Past trip penalty — lower score for repeat city types
    if (ctx.pastTrips?.length) {
        const visitedPurposes = new Set(ctx.pastTrips.map(t => t.purpose));
        if (visitedPurposes.has(ctx.purpose)) {
            // Slightly deprioritize generic items for returning users
            score -= 5;
        }
    }

    // 7. Date/month fit bonus
    if (ctx.startDate && attr.bestMonths) {
        const month = new Date(ctx.startDate).toLocaleString('en-US', { month: 'short' });
        if (attr.bestMonths.includes(month)) {
            score += 10;
        }
    }

    return { ...attr, score, originalIndex: index };
}

// ─── Haversine distance (meters) ──────────────────────────────────────────────

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Time slot helpers ────────────────────────────────────────────────────────

const SLOT_TIMES: Record<TimeOfDay, string[]> = {
    Morning: ['06:30 AM', '08:00 AM', '09:30 AM'],
    Afternoon: ['12:00 PM', '01:30 PM', '03:00 PM'],
    Evening: ['05:00 PM', '06:30 PM', '08:00 PM'],
};

const WEATHER_CONDITIONS = [
    { condition: 'Clear Skies', emoji: '☀️', rain: 0, tip: 'Great day for sightseeing — carry sunscreen' },
    { condition: 'Partly Cloudy', emoji: '⛅', rain: 15, tip: 'Light & breezy — carry sunglasses' },
    { condition: 'Hazy Morning', emoji: '🌤️', rain: 5, tip: 'Cool morning — good for early starts' },
    { condition: 'Misty Morning', emoji: '🌫️', rain: 30, tip: 'Carry a light jacket and umbrella' },
    { condition: 'Sunny', emoji: '☀️', rain: 0, tip: 'Stay hydrated and use sunscreen' },
];

const DAY_TITLES_MAP: Record<string, string[]> = {
    spiritual: ['Sacred Beginnings', 'Temple Trail', 'Divine Detours', 'Pilgrimage Path', 'Spiritual Heights'],
    leisure: ['Arriving in Paradise', 'Slow & Scenic', 'Hidden Havens', 'Lazy Luxury', 'Golden Hour'],
    adventure: ['Gear Up & Go', 'Into the Wild', 'Peak Thrills', 'Off the Grid', 'Summit Day'],
    cultural: ['Heritage Walk', 'Arts & Crafts', 'Living History', 'Bazaar Trail', 'Cultural Immersion'],
    honeymoon: ['Love at First Sight', 'Romantic Escapes', 'Sunset Together', 'Private Paradise', 'Memory Lane'],
    celebrate: ['Party Starts Here', 'Group Adventures', 'Festival Vibes', 'Night Out', 'Grand Finale'],
};

function estimateTravelTime(distM: number): string {
    if (distM < 500) return '5 min walk';
    if (distM < 2000) return `${Math.round(distM / 80)} min walk`;
    if (distM < 5000) return `${Math.round(distM / 400)} min auto`;
    return `${Math.round(distM / 500)} min drive`;
}

// ─── Main Generation Function ─────────────────────────────────────────────────

export async function generateItinerary(ctx: UserContext): Promise<GeneratedItinerary | null> {
    // Strictly resolve destination — never fall back to Kerala
    let destKey = ctx.destination;
    // Try to match destName to a known destination
    const match = DESTINATIONS.find(d =>
        d.name.toLowerCase() === ctx.destName.toLowerCase() ||
        d.id === destKey
    );
    if (match) destKey = match.id;

    const destData = DEST_DATA[destKey];
    if (!destData) {
        console.error(`[ItineraryModel] No data for destination: ${destKey} (${ctx.destName})`);
        return null;
    }

    console.log(`[ItineraryModel] Building personalized itinerary for ${ctx.destName} (${ctx.days} days)`);

    const budgetPerDay = ctx.budget / ctx.days;
    const budgetTier = budgetPerDay > 12000 ? 'luxury' : budgetPerDay > 5000 ? 'mid-range' : 'budget';

    // Score all attractions
    const scoredAttractions = destData.highlights.map((a, i) =>
        scoreAttraction(a, i, ctx, budgetTier)
    ).sort((a, b) => b.score - a.score);

    // Score restaurants
    const scoredRestaurants = [...destData.restaurants].sort((a, b) => {
        let scoreA = a.rating * 10;
        let scoreB = b.rating * 10;
        // Dietary preference boost
        if (ctx.preferences?.dietaryPreferences?.length) {
            for (const pref of ctx.preferences.dietaryPreferences) {
                if (a.tags?.some(t => t.toLowerCase().includes(pref.toLowerCase()))) scoreA += 20;
                if (b.tags?.some(t => t.toLowerCase().includes(pref.toLowerCase()))) scoreB += 20;
            }
        }
        // Purpose alignment
        if (ctx.purpose === 'celebrate' && a.tags?.includes('Experience')) scoreA += 15;
        if (ctx.purpose === 'celebrate' && b.tags?.includes('Experience')) scoreB += 15;
        return scoreB - scoreA;
    });

    // Score hotels by budget fit
    const scoredHotels = [...destData.hotels].sort((a, b) => {
        let scoreA = a.rating * 10;
        let scoreB = b.rating * 10;
        // Budget tier alignment
        if (budgetTier === 'budget') {
            if (a.type === 'Hostel') scoreA += 20;
            if (b.type === 'Hostel') scoreB += 20;
            if (a.type === 'Homestay') scoreA += 15;
            if (b.type === 'Homestay') scoreB += 15;
        } else if (budgetTier === 'luxury') {
            if (a.type === 'Resort') scoreA += 20;
            if (b.type === 'Resort') scoreB += 20;
            if (a.type === 'Hotel') scoreA += 15;
            if (b.type === 'Hotel') scoreB += 15;
        }
        // Group size preference
        if (ctx.group === 'solo' || ctx.group === 'friends') {
            if (a.type === 'Hostel') scoreA += 10;
            if (b.type === 'Hostel') scoreB += 10;
        }
        if (ctx.group === 'couple' || ctx.group === 'honeymoon') {
            if (a.type === 'Resort' || a.type === 'Hotel') scoreA += 10;
            if (b.type === 'Resort' || b.type === 'Hotel') scoreB += 10;
        }
        return scoreB - scoreA;
    });

    // Get month-based weather data
    const startMonth = ctx.startDate
        ? new Date(ctx.startDate).toLocaleString('en-US', { month: 'short' })
        : 'Jan';
    const tempForMonth = destData.weather?.[startMonth] || '20–30°C';

    // ── Build Day Plans ───────────────────────────────────────────────────────

    // If static day plans exist and match duration, use them as base and re-score
    const dayPlans: GeneratedDayPlan[] = [];
    const usedAttractions = new Set<string>();
    const usedRestaurants = new Set<string>();

    // Slot assignment: try to distribute evenly
    const attractionsPerDay = Math.ceil(scoredAttractions.length / ctx.days);

    for (let dayIndex = 0; dayIndex < ctx.days; dayIndex++) {
        // Check if we have a static day plan we can adapt
        const staticPlan = destData.dayPlans[dayIndex % destData.dayPlans.length];

        const dayActivities: GeneratedActivity[] = [];

        // Morning activities (2–3)
        const morningAttractions = scoredAttractions
            .filter(a => !usedAttractions.has(a.name))
            .slice(0, 2);

        morningAttractions.forEach((attr, slotIdx) => {
            usedAttractions.add(attr.name);
            const prevAct = dayActivities[dayActivities.length - 1];
            const travel = prevAct && attr.lat && prevAct.lat
                ? estimateTravelTime(haversineM(prevAct.lat, prevAct.lng, attr.lat!, attr.lng!))
                : undefined;

            dayActivities.push({
                time: SLOT_TIMES.Morning[slotIdx] || '09:00 AM',
                slot: 'Morning',
                name: attr.name,
                desc: attr.desc,
                crowd: attr.walking === 'Easy' ? 'Low' : 'Medium',
                crowdTip: slotIdx === 0 ? 'Early morning means fewer tourists' : 'Arrive before 10 for smaller groups',
                travelFromPrev: travel,
                lat: attr.lat || destData.mapCenter.lat,
                lng: attr.lng || destData.mapCenter.lng,
                type: 'attraction',
                durationMins: 90,
            });
        });

        // Lunch (1 restaurant)
        const lunchRestaurant = scoredRestaurants.find(r => !usedRestaurants.has(r.name));
        if (lunchRestaurant) {
            usedRestaurants.add(lunchRestaurant.name);
            const prevAct = dayActivities[dayActivities.length - 1];
            const travel = prevAct ? estimateTravelTime(
                haversineM(prevAct.lat, prevAct.lng, lunchRestaurant.lat, lunchRestaurant.lng)
            ) : undefined;

            dayActivities.push({
                time: '12:30 PM',
                slot: 'Afternoon',
                name: `Lunch at ${lunchRestaurant.name}`,
                desc: `${lunchRestaurant.desc} Must try: ${lunchRestaurant.mustTry}`,
                crowd: 'Medium',
                crowdTip: 'Peak lunch hour — arrive early to avoid wait',
                travelFromPrev: travel,
                lat: lunchRestaurant.lat,
                lng: lunchRestaurant.lng,
                type: 'restaurant',
                durationMins: 60,
            });
        }

        // Afternoon activities (1–2)
        const afternoonAttractions = scoredAttractions
            .filter(a => !usedAttractions.has(a.name))
            .slice(0, 2);

        afternoonAttractions.forEach((attr, slotIdx) => {
            usedAttractions.add(attr.name);
            const prevAct = dayActivities[dayActivities.length - 1];
            const travel = prevAct && attr.lat
                ? estimateTravelTime(haversineM(prevAct.lat, prevAct.lng, attr.lat!, attr.lng!))
                : undefined;

            dayActivities.push({
                time: SLOT_TIMES.Afternoon[slotIdx + 1] || '02:30 PM',
                slot: 'Afternoon',
                name: attr.name,
                desc: attr.desc,
                crowd: attr.walking === 'High' ? 'High' : 'Medium',
                crowdTip: attr.walking === 'High' ? 'Book entry online — slots fill fast' : 'Afternoon is pleasant for exploring',
                travelFromPrev: travel,
                lat: attr.lat || destData.mapCenter.lat,
                lng: attr.lng || destData.mapCenter.lng,
                type: 'attraction',
                durationMins: 120,
            });
        });

        // Evening activity (1)
        const eveningAttraction = scoredAttractions.find(a => !usedAttractions.has(a.name));
        if (eveningAttraction) {
            usedAttractions.add(eveningAttraction.name);
            const prevAct = dayActivities[dayActivities.length - 1];
            const travel = prevAct && eveningAttraction.lat
                ? estimateTravelTime(haversineM(prevAct.lat, prevAct.lng, eveningAttraction.lat!, eveningAttraction.lng!))
                : undefined;

            dayActivities.push({
                time: '05:30 PM',
                slot: 'Evening',
                name: eveningAttraction.name,
                desc: eveningAttraction.desc,
                crowd: 'Medium',
                crowdTip: 'Golden hour — beautiful lighting for photos',
                travelFromPrev: travel,
                lat: eveningAttraction.lat || destData.mapCenter.lat,
                lng: eveningAttraction.lng || destData.mapCenter.lng,
                type: 'attraction',
                durationMins: 90,
            });
        }

        // Dinner (1 restaurant)
        const dinnerRestaurant = scoredRestaurants.find(r => !usedRestaurants.has(r.name))
            || scoredRestaurants[0]; // Reuse if we've exhausted options
        if (dinnerRestaurant) {
            const prevAct = dayActivities[dayActivities.length - 1];
            const travel = prevAct ? estimateTravelTime(
                haversineM(prevAct.lat, prevAct.lng, dinnerRestaurant.lat, dinnerRestaurant.lng)
            ) : undefined;

            dayActivities.push({
                time: '08:00 PM',
                slot: 'Evening',
                name: `Dinner at ${dinnerRestaurant.name}`,
                desc: `${dinnerRestaurant.desc}`,
                crowd: 'Low',
                crowdTip: 'Evening dining is typically relaxed',
                travelFromPrev: travel,
                lat: dinnerRestaurant.lat,
                lng: dinnerRestaurant.lng,
                type: 'restaurant',
                durationMins: 60,
            });
        }

        // Use static plan activities as fallback/supplement if we ran out of scored ones
        if (dayActivities.length < 4 && staticPlan) {
            for (const act of staticPlan.activities) {
                if (!usedAttractions.has(act.name) && dayActivities.length < 6) {
                    usedAttractions.add(act.name);
                    dayActivities.push({ ...act });
                }
            }
        }

        // Day title
        const purposeTitles = DAY_TITLES_MAP[ctx.purpose] || DAY_TITLES_MAP.cultural;
        const dayTitle = staticPlan?.title || purposeTitles[dayIndex % purposeTitles.length] || `Day ${dayIndex + 1}`;

        // Weather
        const weatherIdx = dayIndex % WEATHER_CONDITIONS.length;
        const weather = staticPlan?.weather || {
            temp: tempForMonth,
            ...WEATHER_CONDITIONS[weatherIdx],
        };

        dayPlans.push({
            day: dayIndex + 1,
            title: dayTitle,
            weather,
            activities: dayActivities,
        });

        // Reset used restaurants if we need more days than restaurants available
        if (usedRestaurants.size >= scoredRestaurants.length) {
            usedRestaurants.clear();
        }
    }

    // Build the complete itinerary
    const itinerary: GeneratedItinerary = {
        destName: ctx.destName,
        description: destData.description,
        avgCost: destData.avgCost,
        crowdLevel: destData.crowdLevel,
        crowdNote: destData.crowdNote,
        logistics: destData.logistics || { flights: 'Check airline websites for latest fares', trains: 'Check IRCTC for trains' },
        highlights: destData.highlights.map(h => ({
            name: h.name,
            img: h.img,
            desc: h.desc,
            bestMonths: h.bestMonths,
            duration: h.duration,
            tags: h.tags,
            lat: h.lat || destData.mapCenter.lat,
            lng: h.lng || destData.mapCenter.lng,
        })),
        restaurants: destData.restaurants.map(r => ({
            ...r,
        })),
        hotels: destData.hotels.map(h => ({
            ...h,
        })),
        dayPlans,
        mapCenter: destData.mapCenter,
    };

    console.log(`[ItineraryModel] Personalized itinerary built: ${dayPlans.length} days, ${dayPlans.reduce((s, d) => s + d.activities.length, 0)} activities`);
    return itinerary;
}

// ─── Temperature Mapping ──────────────────────────────────────────────────────
export function getTemperatureForPurpose(purpose: string): number {
    const map: Record<string, number> = {
        spiritual: 0.5,
        leisure: 0.7,
        adventure: 0.8,
        cultural: 0.6,
        honeymoon: 0.7,
        celebrate: 0.8,
    };
    return map[purpose] ?? 0.7;
}
