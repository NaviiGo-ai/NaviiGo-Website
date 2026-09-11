// ─── Browsing Signal Collector ────────────────────────────────────────────────
// Tracks user browsing behaviour on explore pages to feed into itinerary
// personalization. All data lives in memory (zero API cost) and is synced to
// Firestore when a user is signed in (debounced to avoid excessive writes).

const STORAGE_KEY = 'naviigo_browsing_signals'; // kept for reference only

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

// In-memory store for the current user's signals
let _signals: BrowsingSignals | null = null;
// Current UID for Firestore sync
let _currentUid: string | null = null;
// Firestore debounce timer
let _firestoreDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000; // 2 seconds — batches rapid signal updates

/** Call on sign-in / sign-out to enable/disable Firestore sync */
export function setCurrentUid(uid: string | null) {
    _currentUid = uid;
    if (uid) {
        // Load signals from Firestore for this user
        loadFromFirestore(uid).then(() => {
            // If we still have no signals after load, initialize with defaults
            if (!_signals) {
                _signals = getDefaults();
            }
        }).catch(err => {
            console.error('[BrowsingSignals] Failed to load from Firestore on setCurrentUid:', err);
            _signals = getDefaults();
        });
    } else {
        // Signing out: keep signals in memory but stop syncing
        // Optionally, we could clear _signals here if we don't want to retain data across sessions
        // For now, we keep it in memory until next sign-in or page reload.
    }
}

/** Get the current browsing signals, loading from Firestore if needed */
export async function getBrowsingSignals(): Promise<BrowsingSignals> {
    if (_signals) {
        return _signals;
    }
    // No signals in memory yet
    if (_currentUid) {
        try {
            await loadFromFirestore(_currentUid);
        } catch (err) {
            console.error('[BrowsingSignals] Failed to load from Firestore in getBrowsingSignals:', err);
        }
    }
    // If still no signals, return defaults
    if (!_signals) {
        _signals = getDefaults();
    }
    return _signals!;
}

/** Debounced write to Firestore — avoids excessive writes during rapid browsing */
function scheduleFirestoreSync() {
    if (!_currentUid) return;
    if (_firestoreDebounceTimer) clearTimeout(_firestoreDebounceTimer);
    _firestoreDebounceTimer = setTimeout(() => {
        syncToFirestore();
    }, DEBOUNCE_MS);
}

/** Actually write current signals to Firestore */
async function syncToFirestore() {
    if (!_currentUid) return;
    if (!_signals) return;
    try {
        const { savePersonalizationSignals } = await import('./firestore');
        await savePersonalizationSignals(_currentUid, {
            timeOnCity: _signals.timeOnCity,
            clickedCategories: _signals.clickedCategories,
            deepDiveVibes: _signals.deepDiveVibes,
            viewedDestinations: _signals.viewedDestinations,
        });
    } catch (err) {
        console.error('[BrowsingSignals] Firestore sync failed:', err);
    }
}

/** Load from Firestore and merge into memory (Firestore wins if newer) */
export async function loadFromFirestore(uid: string): Promise<void> {
    try {
        const { getPersonalizationSignals } = await import('./firestore');
        const remote = await getPersonalizationSignals(uid);
        if (!remote) {
            // No cloud data yet — keep whatever is in memory or set to defaults
            if (!_signals) {
                _signals = getDefaults();
            }
            return;
        }

        const local = _signals ?? getDefaults();
        const remoteTimestamp = remote.updatedAt?.toMillis?.() || 0;

        // If Firestore data is newer, merge it into memory
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
            _signals = merged;
        } else if (local.lastUpdated > remoteTimestamp) {
            // Local is newer — push to Firestore
            await syncToFirestore();
        }
        // If timestamps are equal, we can keep whichever (we'll keep local)
    } catch (err) {
        console.error('[BrowsingSignals] Failed to load from Firestore:', err);
        // Ensure we have a signals object
        if (!_signals) {
            _signals = getDefaults();
        }
    }
}

// ── Core Save ────────────────────────────────────────────────────────────────

function save(signals: BrowsingSignals) {
    _signals = signals;
    signals.lastUpdated = Date.now();
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
    getBrowsingSignals().then(signals => {
        // Deduplicate — move to end if already present
        signals.viewedDestinations = signals.viewedDestinations.filter(d => d !== city);
        signals.viewedDestinations.push(city);
        // Keep last 30
        if (signals.viewedDestinations.length > 30) {
            signals.viewedDestinations = signals.viewedDestinations.slice(-30);
        }
        save(signals);
    }).catch(err => {
        console.error('[BrowsingSignals] Error in startCityView:', err);
    });
}

/** Call when user leaves a city page / navigates away */
export function flushCityView() {
    if (!cityViewStart) return;
    const currentView = cityViewStart; // Capture locally for the async closure
    const elapsed = Math.round((Date.now() - currentView.ts) / 1000);
    if (elapsed > 1) { // ignore sub-second glances
        getBrowsingSignals().then(signals => {
            signals.timeOnCity[currentView.city] =
                (signals.timeOnCity[currentView.city] || 0) + elapsed;
            save(signals);
        }).catch(err => {
            console.error('[BrowsingSignals] Error in flushCityView:', err);
        });
    }
    cityViewStart = null;
}

// ── Category Click Tracking ──────────────────────────────────────────────────

/** Call when user clicks a category filter pill on Explore page */
export function trackCategoryClick(category: string) {
    if (category === 'All') return; // Not useful signal
    getBrowsingSignals().then(signals => {
        if (!signals.clickedCategories.includes(category)) {
            signals.clickedCategories.push(category);
        }
        save(signals);
    }).catch(err => {
        console.error('[BrowsingSignals] Error in trackCategoryClick:', err);
    });
}

// ── Deep-Dive Vibe Tracking ────────────────────────────────────────────────

/** Call when user selects companion/vibe on a deep-dive page */
export function trackDeepDiveVibe(dest: string, companion: string, vibe: string) {
    getBrowsingSignals().then(signals => {
        // Replace existing entry for the same dest
        signals.deepDiveVibes = signals.deepDiveVibes.filter(v => v.dest !== dest);
        signals.deepDiveVibes.push({ dest, companion, vibe });
        // Keep last 10
        if (signals.deepDiveVibes.length > 10) {
            signals.deepDiveVibes = signals.deepDiveVibes.slice(-10);
        }
        save(signals);
    }).catch(err => {
        console.error('[BrowsingSignals] Error in trackDeepDiveVibe:', err);
    });
}