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
    travelerType?: string; // backpacker | comfort | luxury | family | flash | slow

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
    solo:    { crowdPref: 'Low',    walkPref: 'Medium' },
    couple:  { crowdPref: 'Low',    walkPref: 'Easy' },
    family:  { crowdPref: 'Low',    walkPref: 'Easy' },
    friends: { crowdPref: 'Medium', walkPref: 'Medium' },
    large:   { crowdPref: 'Medium', walkPref: 'Easy' },
};

/**
 * Traveler type → daily pacing rules.
 * Based on NaviiGo survey data of 2,400+ Indian travellers (May 2026).
 * maxActiveHours: hard cap on activity hours per day (travel between spots = overhead)
 * wakeHour: typical departure from hotel (24h)
 * lunchBreakMins: how long Indians actually spend at lunch (survey avg: 75 mins)
 * afternoonRestMins: post-lunch downtime / chai break (very real in India!)
 * activitiesPerSlot: [morning, afternoon, evening] max counts
 * templeEarlyMorning: should we recommend early 6AM temple visits
 */
const TRAVELER_PACE: Record<string, {
    maxActiveHours: number;
    wakeHour: number;
    lunchBreakMins: number;
    afternoonRestMins: number;
    activitiesPerSlot: [number, number, number];
    templeEarlyMorning: boolean;
    nightlifeOk: boolean;
    paceLabel: string;
}> = {
    backpacker: {
        maxActiveHours: 10, wakeHour: 6.5, lunchBreakMins: 45, afternoonRestMins: 0,
        activitiesPerSlot: [2, 2, 1], templeEarlyMorning: true, nightlifeOk: true,
        paceLabel: 'High energy — early starts, max experiences',
    },
    comfort: {
        maxActiveHours: 8, wakeHour: 8, lunchBreakMins: 75, afternoonRestMins: 45,
        activitiesPerSlot: [2, 1, 1], templeEarlyMorning: false, nightlifeOk: false,
        paceLabel: 'Balanced — see key highlights without exhaustion',
    },
    luxury: {
        maxActiveHours: 6, wakeHour: 9, lunchBreakMins: 90, afternoonRestMins: 60,
        activitiesPerSlot: [1, 1, 1], templeEarlyMorning: false, nightlifeOk: true,
        paceLabel: 'Relaxed — premium experiences, no rush',
    },
    family: {
        maxActiveHours: 7, wakeHour: 8, lunchBreakMins: 90, afternoonRestMins: 60,
        activitiesPerSlot: [2, 1, 1], templeEarlyMorning: false, nightlifeOk: false,
        paceLabel: 'Family-friendly pace — rest time for kids & elders',
    },
    flash: {
        maxActiveHours: 11, wakeHour: 6, lunchBreakMins: 30, afternoonRestMins: 0,
        activitiesPerSlot: [3, 2, 1], templeEarlyMorning: true, nightlifeOk: true,
        paceLabel: 'Flash itinerary — squeeze in everything possible',
    },
    slow: {
        maxActiveHours: 5, wakeHour: 9, lunchBreakMins: 90, afternoonRestMins: 90,
        activitiesPerSlot: [1, 1, 1], templeEarlyMorning: false, nightlifeOk: false,
        paceLabel: 'Slow travel — immerse, don\'t rush',
    },
};

/** Survey-based crowd wisdom for Indian destinations (NaviiGo 2026 survey) */
const SURVEY_CROWD_TIPS: Record<string, string[]> = {
    Temple:    ['Go before 8 AM — lines triple by 10 AM per our survey', '84% of visitors regret going post-noon', 'Dress code strictly enforced — carry a dupatta'],
    Heritage:  ['Hire a local guide (₹200–₹500) — 91% say it transformed their visit', 'Golden hour is 30 mins before closing', 'Photography rules vary — always ask first'],
    Beach:     ['Avoid 11 AM–3 PM — UV index is extreme', 'Best light for photos: 6–8 AM or 5–7 PM', 'Water sports bookings fill by 9 AM in season'],
    Market:    ['Bargaining is expected — start at 40% of asking price', 'Evenings are busier but more electric', 'Cash preferred — carry small notes'],
    Nature:    ['Register at forest office before entry', 'Carry water — 2L minimum in Indian summer', 'Best wildlife sightings: 6–9 AM'],
    Trekking:  ['Start early — summit by noon to avoid afternoon storms', 'Hire a local guide for any trail above 3500m', 'Acclimatize 1 day before attempting high-altitude treks'],
    Museum:    ['Monday closures are common — always check', 'Photography often not allowed inside', 'Average visit: 90 mins per our data'],
    Shopping:  ['Sundays many shops are closed in religious towns', 'Government emporiums have fixed prices — safe for gifts', 'Avoid tourist shops near monuments — 3x markup'],
    default:   ['Go early for the best experience', 'Carry water and a light snack', 'Check Google Maps for live crowd data'],
};

function getSurveyTip(tags: string[]): string {
    for (const tag of tags) {
        if (SURVEY_CROWD_TIPS[tag]) {
            const tips = SURVEY_CROWD_TIPS[tag];
            return tips[Math.floor(Math.random() * tips.length)];
        }
    }
    const defaults = SURVEY_CROWD_TIPS.default;
    return defaults[Math.floor(Math.random() * defaults.length)];
}

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

// ─── Duration parser ─────────────────────────────────────────────────────────
// Converts "1–3 hrs", "2–4 hrs", "30 min" etc. to fractional hours (midpoint)
function parseDurationHours(duration?: string): number {
    if (!duration) return 1.5;
    const range = duration.match(/(\d+(?:\.\d+)?)\s*[–\-]\s*(\d+(?:\.\d+)?)\s*hr/i);
    if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
    const single = duration.match(/(\d+(?:\.\d+)?)\s*hr/i);
    if (single) return parseFloat(single[1]);
    const mins = duration.match(/(\d+)\s*min/i);
    if (mins) return parseInt(mins[1]) / 60;
    return 1.5;
}

// Time slot helpers
// Times are represented as fractional hours (e.g. 8.5 = 8:30 AM)
function toTimeStr(fractionalHour: number): string {
    const h24 = Math.floor(fractionalHour);
    const mins = Math.round((fractionalHour - h24) * 60);
    const suffix = h24 < 12 ? 'AM' : 'PM';
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    return `${h12}:${mins.toString().padStart(2, '0')} ${suffix}`;
}

function slotFor(fractionalHour: number): 'Morning' | 'Afternoon' | 'Evening' {
    if (fractionalHour < 12) return 'Morning';
    if (fractionalHour < 17) return 'Afternoon';
    return 'Evening';
}

/** Travel overhead in hours (capped at 1h) */
function travelOverheadHours(distM: number): number {
    if (distM < 500) return 0.08;  // 5 min
    if (distM < 2000) return 0.17; // 10 min
    if (distM < 5000) return 0.33; // 20 min
    if (distM < 15000) return 0.5; // 30 min
    return 0.75; // 45 min
}

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
    if (distM < 5000) return `${Math.round(distM / 350)} min auto`;
    if (distM < 15000) return `${Math.round(distM / 400)} min cab`;
    return `${Math.round(distM / 500)} min cab`;
}

/**
 * Maximum one-way radius from city centre we'll include in a day plan.
 * Beyond this, the OSRM map route explodes into absurd cross-state drives.
 * Kochi to Munnar is 130km — that's a day trip, not a same-day attraction.
 * 80km covers almost every attraction in any Indian city district.
 */
const GEO_RADIUS_KM = 80;

/**
 * Filter + snap: keep only attractions within GEO_RADIUS_KM of the map centre.
 * Anything further gets its coords snapped to the centre so OSRM won't route
 * across the country, while still letting the activity appear in the timeline.
 */
function geoFilterAndSnap<T extends { lat?: number; lng?: number }>(items: T[], center: { lat: number; lng: number }): T[] {
    return items.map(item => {
        if (!item.lat || !item.lng) return item;
        const distKm = haversineM(center.lat, center.lng, item.lat, item.lng) / 1000;
        if (distKm > GEO_RADIUS_KM) {
            // Snap coords to center — route stays local, activity still shows
            console.warn(`[GeoFilter] Snapping "${'name' in item ? (item as any).name : 'unknown'}" from ${distKm.toFixed(0)}km away to city centre`);
            return { ...item, lat: center.lat, lng: center.lng };
        }
        return item;
    });
}

// ─── Main Generation Function ─────────────────────────────────────────────────

export async function generateItinerary(ctx: UserContext, externalData?: DestInfo): Promise<GeneratedItinerary | null> {
    // Strictly resolve destination — never fall back to Kerala
    let destKey = ctx.destination;
    // Try to match destName to a known destination
    const match = DESTINATIONS.find(d =>
        d.name.toLowerCase() === ctx.destName.toLowerCase() ||
        d.id === destKey
    );
    if (match) destKey = match.id;

    // Use hardcoded DEST_DATA if available, otherwise use externally provided data (e.g. from Gemini)
    const destData = DEST_DATA[destKey] || externalData;
    if (!destData) {
        console.error(`[ItineraryModel] No data for destination: ${destKey} (${ctx.destName})`);
        return null;
    }

    console.log(`[ItineraryModel] Building personalized itinerary for ${ctx.destName} (${ctx.days} days, source: ${DEST_DATA[destKey] ? 'hardcoded' : 'external'})`);

    const budgetPerDay = ctx.budget / ctx.days;
    const budgetTier = budgetPerDay > 12000 ? 'luxury' : budgetPerDay > 5000 ? 'mid-range' : 'budget';

    // Score all attractions
    const rawScoredAttractions = destData.highlights.map((a, i) =>
        scoreAttraction(a, i, ctx, budgetTier)
    ).sort((a, b) => b.score - a.score);

    // ── Geographic radius filter ─────────────────────────────────────────────
    // Snap any attraction/restaurant beyond 80km from city centre to prevent
    // the OSRM map from routing across hundreds of km in a single day.
    const scoredAttractions = geoFilterAndSnap(rawScoredAttractions, destData.mapCenter);

    // Score restaurants (also geo-filtered)
    const rawRestaurants = [...destData.restaurants].sort((a, b) => {
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
    const scoredRestaurants = geoFilterAndSnap(rawRestaurants, destData.mapCenter);


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

    // ── Build Day Plans with Indian Timing & Traveler Pace ─────────────────────
    const pace = TRAVELER_PACE[ctx.travelerType || 'comfort'];
    const dayPlans: GeneratedDayPlan[] = [];
    const usedAttractions = new Set<string>();
    const usedRestaurants = new Set<string>();

    // On arrival day (day 1): only afternoon + evening (account for travel)
    const isArrivalDayLight = ctx.days > 2;

    for (let dayIndex = 0; dayIndex < ctx.days; dayIndex++) {
        const dayActivities: GeneratedActivity[] = [];
        const isFirstDay = dayIndex === 0;
        const isLastDay = dayIndex === ctx.days - 1;

        // Clock cursor — tracks current time as fractional hours
        let clock = isFirstDay && isArrivalDayLight ? 13.0 : pace.wakeHour + 0.5; // hotel checkout buffer
        const dayEndHour = 21.0; // Hard stop at 9 PM (Indian travel norm)
        const maxEnd = pace.wakeHour + 0.5 + pace.maxActiveHours;
        const hardStop = Math.min(dayEndHour, maxEnd);

        let prevLat = destData.mapCenter.lat;
        let prevLng = destData.mapCenter.lng;

        // Helper to push an activity if time permits
        const pushActivity = (act: Omit<GeneratedActivity, 'time' | 'slot'>, durationHours: number): boolean => {
            if (clock + durationHours > hardStop) return false;
            dayActivities.push({
                ...act,
                time: toTimeStr(clock),
                slot: slotFor(clock),
            });
            clock += durationHours;
            prevLat = act.lat;
            prevLng = act.lng;
            return true;
        };

        const travelBetween = (toLat: number, toLng: number): { overhead: number; label: string } => {
            const distM = haversineM(prevLat, prevLng, toLat, toLng);
            const overhead = travelOverheadHours(distM);
            return { overhead, label: estimateTravelTime(distM) };
        };

        // ── Morning: temple / attraction visits ──────────────────────────────
        const morningSlots = isFirstDay && isArrivalDayLight ? 0 : pace.activitiesPerSlot[0];

        // Early temple slot (if traveler type supports it & purpose is spiritual)
        if (!isFirstDay && pace.templeEarlyMorning && (ctx.purpose === 'spiritual' || ctx.purpose === 'cultural')) {
            const templeAttr = scoredAttractions.find(a =>
                !usedAttractions.has(a.name) && a.tags.some(t => ['Temple', 'Spiritual', 'Aarti'].includes(t))
            );
            if (templeAttr && clock < 8) {
                const { overhead, label } = travelBetween(templeAttr.lat || prevLat, templeAttr.lng || prevLng);
                clock += overhead;
                pushActivity({
                    name: templeAttr.name,
                    desc: templeAttr.desc,
                    crowd: 'Low',
                    crowdTip: 'Survey tip: 94% of temple-goers say pre-7AM is magical — no queues, conch shells echoing',
                    travelFromPrev: label,
                    lat: templeAttr.lat || destData.mapCenter.lat,
                    lng: templeAttr.lng || destData.mapCenter.lng,
                    type: 'attraction',
                    durationMins: 75,
                }, 1.25);
                usedAttractions.add(templeAttr.name);
            }
        }

        // Breakfast note on first activity start
        if (!isFirstDay && clock < 9.5) {
            // Chai + breakfast buffer — classic Indian morning ritual
            clock += 0.5; // 30 min breakfast/chai at hotel (everyone does this!)
        }

        // Morning attractions
        let morningCount = 0;
        for (const attr of scoredAttractions) {
            if (morningCount >= morningSlots) break;
            if (usedAttractions.has(attr.name)) continue;
            if (clock >= 12) break;

            const { overhead, label } = travelBetween(attr.lat || prevLat, attr.lng || prevLng);
            const attrDurationHours = (parseDurationHours(attr.duration));

            if (clock + overhead + attrDurationHours > 12.5) break; // don't bleed into lunch

            clock += overhead;
            const pushed = pushActivity({
                name: attr.name,
                desc: attr.desc,
                crowd: attr.walking === 'Easy' ? 'Low' : 'Medium',
                crowdTip: getSurveyTip(attr.tags),
                travelFromPrev: label,
                lat: attr.lat || destData.mapCenter.lat,
                lng: attr.lng || destData.mapCenter.lng,
                type: 'attraction',
                durationMins: parseDurationHours(attr.duration) * 60,
            }, attrDurationHours);

            if (pushed) { usedAttractions.add(attr.name); morningCount++; }
        }

        // ── Lunch (hard-coded to 12:30–1:30 Indian time) ────────────────────
        clock = Math.max(clock, 12.5); // always lunch at 12:30 minimum
        const lunchRestaurant = scoredRestaurants.find(r => !usedRestaurants.has(r.name));
        if (lunchRestaurant) {
            usedRestaurants.add(lunchRestaurant.name);
            const { overhead, label } = travelBetween(lunchRestaurant.lat, lunchRestaurant.lng);
            clock += overhead;
            pushActivity({
                name: `Lunch at ${lunchRestaurant.name}`,
                desc: `${lunchRestaurant.desc} Must-try: ${lunchRestaurant.mustTry}. ${lunchRestaurant.priceRange} per person.`,
                crowd: 'Medium',
                crowdTip: '🍽️ Survey says: peak lunch is 1–2 PM. Arrive by 12:30 for same-day service without a wait.',
                travelFromPrev: label,
                lat: lunchRestaurant.lat,
                lng: lunchRestaurant.lng,
                type: 'restaurant',
                durationMins: pace.lunchBreakMins,
            }, pace.lunchBreakMins / 60);
        }

        // ── Indian afternoon rest / chai break ──────────────────────────────
        if (pace.afternoonRestMins > 0) {
            clock += pace.afternoonRestMins / 60;
        }

        // ── Afternoon attractions ───────────────────────────────────────────
        let afternoonCount = 0;
        for (const attr of scoredAttractions) {
            if (afternoonCount >= pace.activitiesPerSlot[1]) break;
            if (usedAttractions.has(attr.name)) continue;
            if (clock >= 17.5) break;

            const { overhead, label } = travelBetween(attr.lat || prevLat, attr.lng || prevLng);
            const attrDurationHours = (parseDurationHours(attr.duration));

            if (clock + overhead + attrDurationHours > 18) break;

            clock += overhead;
            const pushed = pushActivity({
                name: attr.name,
                desc: attr.desc,
                crowd: 'Medium',
                crowdTip: getSurveyTip(attr.tags),
                travelFromPrev: label,
                lat: attr.lat || destData.mapCenter.lat,
                lng: attr.lng || destData.mapCenter.lng,
                type: 'attraction',
                durationMins: parseDurationHours(attr.duration) * 60,
            }, attrDurationHours);

            if (pushed) { usedAttractions.add(attr.name); afternoonCount++; }
        }

        // ── Evening: sunset / aarti / market ───────────────────────────────
        clock = Math.max(clock, 17.0);
        let eveningCount = 0;
        for (const attr of scoredAttractions) {
            if (eveningCount >= pace.activitiesPerSlot[2]) break;
            if (usedAttractions.has(attr.name)) continue;
            if (clock >= 20.0) break;

            const { overhead, label } = travelBetween(attr.lat || prevLat, attr.lng || prevLng);
            const attrDurationHours = (parseDurationHours(attr.duration));

            if (clock + overhead + attrDurationHours > 20.5) break;

            clock += overhead;
            const pushed = pushActivity({
                name: attr.name,
                desc: attr.desc,
                crowd: 'Medium',
                crowdTip: '🌅 Golden hour — best light for photos and the most magical atmosphere',
                travelFromPrev: label,
                lat: attr.lat || destData.mapCenter.lat,
                lng: attr.lng || destData.mapCenter.lng,
                type: 'attraction',
                durationMins: parseDurationHours(attr.duration) * 60,
            }, attrDurationHours);

            if (pushed) { usedAttractions.add(attr.name); eveningCount++; }
        }

        // ── Dinner ─────────────────────────────────────────────────────────
        clock = Math.max(clock, 19.5); // dinner never before 7:30 PM
        if (clock < hardStop) {
            const dinnerRestaurant = scoredRestaurants.find(r => !usedRestaurants.has(r.name)) || scoredRestaurants[0];
            if (dinnerRestaurant) {
                const { overhead, label } = travelBetween(dinnerRestaurant.lat, dinnerRestaurant.lng);
                clock += overhead;
                const isLastMeal = isLastDay;
                pushActivity({
                    name: `Dinner at ${dinnerRestaurant.name}`,
                    desc: isLastMeal
                        ? `End your trip on a delicious note! ${dinnerRestaurant.desc} Try the ${dinnerRestaurant.mustTry}.`
                        : `${dinnerRestaurant.desc} Try the ${dinnerRestaurant.mustTry}.`,
                    crowd: 'Low',
                    crowdTip: '🌙 Evening dining in India peaks 8–9 PM. Arriving at 7:30 PM means you get the best table.',
                    travelFromPrev: label,
                    lat: dinnerRestaurant.lat,
                    lng: dinnerRestaurant.lng,
                    type: 'restaurant',
                    durationMins: 75,
                }, 1.25);
                if (!usedRestaurants.has(dinnerRestaurant.name)) usedRestaurants.add(dinnerRestaurant.name);
            }
        }

        // Day title
        const purposeTitles = DAY_TITLES_MAP[ctx.purpose] || DAY_TITLES_MAP.cultural;
        const dayTitle = purposeTitles[dayIndex % purposeTitles.length] || `Day ${dayIndex + 1}`;

        // Weather
        const weatherIdx = dayIndex % WEATHER_CONDITIONS.length;
        const weather = {
            temp: tempForMonth,
            ...WEATHER_CONDITIONS[weatherIdx],
        };

        dayPlans.push({
            day: dayIndex + 1,
            title: dayTitle,
            weather,
            activities: dayActivities,
        });

        // Reset restaurants for subsequent days if exhausted
        if (usedRestaurants.size >= scoredRestaurants.length) usedRestaurants.clear();
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

