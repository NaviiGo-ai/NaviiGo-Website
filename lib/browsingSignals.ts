// ─── Browsing Signal Collector ────────────────────────────────────────────────
// Tracks user browsing behaviour on explore pages to feed into itinerary
// personalization. All data lives in localStorage — zero API cost.

const STORAGE_KEY = 'naviigo_browsing_signals';

export interface BrowsingSignals {
    /** Seconds spent viewing each city's card/deep-dive page */
    timeOnCity: Record<string, number>;
    /** Category pills clicked on Explore page (Heritage, Beach, etc.) */
    clickedCategories: string[];
    /** Vibes selected on deep-dive pages: { dest, companion, vibe } */
    deepDiveVibes: Array<{ dest: string; companion: string; vibe: string }>;
    /** Destinations the user clicked into (ordered, most recent last) */
    viewedDestinations: string[];
    /** Timestamp of last signal update */
    lastUpdated: number;
}

function getDefaults(): BrowsingSignals {
    return {
        timeOnCity: {},
        clickedCategories: [],
        deepDiveVibes: [],
        viewedDestinations: [],
        lastUpdated: Date.now(),
    };
}

/** Read all accumulated browsing signals */
export function getBrowsingSignals(): BrowsingSignals {
    if (typeof window === 'undefined') return getDefaults();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaults();
        return JSON.parse(raw) as BrowsingSignals;
    } catch {
        return getDefaults();
    }
}

function save(signals: BrowsingSignals) {
    if (typeof window === 'undefined') return;
    signals.lastUpdated = Date.now();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
    } catch { /* quota exceeded — silently skip */ }
}

// ── City View Tracking ───────────────────────────────────────────────────────

let cityViewStart: { city: string; ts: number } | null = null;

/** Call when user starts viewing a city (clicks card / navigates to deep-dive) */
export function startCityView(city: string) {
    // Flush previous if any
    if (cityViewStart) {
        flushCityView();
    }
    cityViewStart = { city, ts: Date.now() };

    // Also record in viewed destinations
    const signals = getBrowsingSignals();
    // Deduplicate — move to end if already present
    signals.viewedDestinations = signals.viewedDestinations.filter(d => d !== city);
    signals.viewedDestinations.push(city);
    // Keep last 30
    if (signals.viewedDestinations.length > 30) {
        signals.viewedDestinations = signals.viewedDestinations.slice(-30);
    }
    save(signals);
}

/** Call when user leaves a city page / navigates away */
export function flushCityView() {
    if (!cityViewStart) return;
    const elapsed = Math.round((Date.now() - cityViewStart.ts) / 1000);
    if (elapsed > 1) { // ignore sub-second glances
        const signals = getBrowsingSignals();
        signals.timeOnCity[cityViewStart.city] =
            (signals.timeOnCity[cityViewStart.city] || 0) + elapsed;
        save(signals);
    }
    cityViewStart = null;
}

// ── Category Click Tracking ──────────────────────────────────────────────────

/** Call when user clicks a category filter pill on Explore page */
export function trackCategoryClick(category: string) {
    if (category === 'All') return; // Not useful signal
    const signals = getBrowsingSignals();
    if (!signals.clickedCategories.includes(category)) {
        signals.clickedCategories.push(category);
    }
    save(signals);
}

// ── Deep-Dive Vibe Tracking ──────────────────────────────────────────────────

/** Call when user selects companion/vibe on a deep-dive page */
export function trackDeepDiveVibe(dest: string, companion: string, vibe: string) {
    const signals = getBrowsingSignals();
    // Replace existing entry for the same dest
    signals.deepDiveVibes = signals.deepDiveVibes.filter(v => v.dest !== dest);
    signals.deepDiveVibes.push({ dest, companion, vibe });
    // Keep last 10
    if (signals.deepDiveVibes.length > 10) {
        signals.deepDiveVibes = signals.deepDiveVibes.slice(-10);
    }
    save(signals);
}
