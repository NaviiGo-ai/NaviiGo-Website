// ─── Browsing Signal Collector ────────────────────────────────────────────────
// Tracks user browsing behaviour on explore pages to feed into itinerary
// personalization. All data lives in localStorage — zero API cost.
// When a user is signed in, signals are also synced to Firestore for
// cross-device personalization (debounced to avoid excessive writes).

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

// ── Firestore Sync Layer ─────────────────────────────────────────────────────

let _currentUid: string | null = null;
let _firestoreDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000; // 2 seconds — batches rapid signal updates

/** Call on sign-in / sign-out to enable/disable Firestore sync */
export function setCurrentUid(uid: string | null) {
    _currentUid = uid;
}

/** Debounced write to Firestore — avoids excessive writes during rapid browsing */
function scheduleFirestoreSync() {
    if (!_currentUid) return;
    if (_firestoreDebounceTimer) clearTimeout(_firestoreDebounceTimer);
    _firestoreDebounceTimer = setTimeout(() => {
        syncToFirestore();
    }, DEBOUNCE_MS);
}

/** Actually write current localStorage signals to Firestore */
async function syncToFirestore() {
    if (!_currentUid) return;
    try {
        const signals = getBrowsingSignals();
        const { savePersonalizationSignals } = await import('./firestore');
        await savePersonalizationSignals(_currentUid, {
            timeOnCity: signals.timeOnCity,
            clickedCategories: signals.clickedCategories,
            deepDiveVibes: signals.deepDiveVibes,
            viewedDestinations: signals.viewedDestinations,
        });
    } catch (err) {
        console.error('[BrowsingSignals] Firestore sync failed:', err);
    }
}

/** Load from Firestore and merge into localStorage (Firestore wins if newer) */
export async function loadFromFirestore(uid: string) {
    try {
        const { getPersonalizationSignals } = await import('./firestore');
        const remote = await getPersonalizationSignals(uid);
        if (!remote) return; // No cloud data yet — keep local

        const local = getBrowsingSignals();
        const remoteTimestamp = remote.updatedAt?.toMillis?.() || 0;

        // If Firestore data is newer, merge it into localStorage
        if (remoteTimestamp > local.lastUpdated) {
            const merged: BrowsingSignals = {
                // Merge timeOnCity — take the max time for each city
                timeOnCity: { ...local.timeOnCity },
                // Deduplicate categories
                clickedCategories: [...new Set([
                    ...local.clickedCategories,
                    ...(remote.clickedCategories || []),
                ])],
                // Take Firestore's deep-dive vibes (more recent)
                deepDiveVibes: remote.deepDiveVibes || local.deepDiveVibes,
                // Take Firestore's viewed destinations (more recent ordering)
                viewedDestinations: remote.viewedDestinations || local.viewedDestinations,
                lastUpdated: remoteTimestamp,
            };
            // Merge timeOnCity — keep the larger value
            for (const [city, time] of Object.entries(remote.timeOnCity || {})) {
                merged.timeOnCity[city] = Math.max(merged.timeOnCity[city] || 0, time);
            }
            saveLocal(merged);
        } else if (local.lastUpdated > remoteTimestamp) {
            // Local is newer — push to Firestore
            syncToFirestore();
        }
    } catch (err) {
        console.error('[BrowsingSignals] Failed to load from Firestore:', err);
    }
}

// ── Core Save ────────────────────────────────────────────────────────────────

function saveLocal(signals: BrowsingSignals) {
    if (typeof window === 'undefined') return;
    signals.lastUpdated = Date.now();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
    } catch { /* quota exceeded — silently skip */ }
}

function save(signals: BrowsingSignals) {
    saveLocal(signals);
    // Queue Firestore sync if user is signed in
    scheduleFirestoreSync();
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
