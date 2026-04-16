// ─── NaviiGo Analytics Engine ─────────────────────────────────────────────────
// Client-side event tracking with Firestore persistence.
// Tracks: page views, destination interactions, itinerary generation, bookings.

const ANALYTICS_KEY = 'naviigo_analytics';

export type EventType =
    | 'page_view'
    | 'destination_click'
    | 'itinerary_generate'
    | 'itinerary_save'
    | 'booking_start'
    | 'booking_complete'
    | 'explore_search'
    | 'deep_dive_view'
    | 'passport_stamp'
    | 'review_submit'
    | 'share_itinerary'
    | 'transport_click';

interface AnalyticsEvent {
    type: EventType;
    timestamp: number;
    data: Record<string, string | number | boolean>;
    sessionId: string;
}

interface AnalyticsStore {
    events: AnalyticsEvent[];
    sessionId: string;
    sessionStart: number;
    userId: string | null;
}

// ─── Session Management ──────────────────────────────────────────────────────

function getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';
    let sessionId = sessionStorage.getItem('naviigo_session');
    if (!sessionId) {
        sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        sessionStorage.setItem('naviigo_session', sessionId);
    }
    return sessionId;
}

function getStore(): AnalyticsStore {
    if (typeof window === 'undefined') {
        return { events: [], sessionId: 'ssr', sessionStart: Date.now(), userId: null };
    }
    try {
        const raw = localStorage.getItem(ANALYTICS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
        events: [],
        sessionId: getSessionId(),
        sessionStart: Date.now(),
        userId: null,
    };
}

function saveStore(store: AnalyticsStore) {
    if (typeof window === 'undefined') return;
    // Keep last 500 events max
    if (store.events.length > 500) {
        store.events = store.events.slice(-500);
    }
    try {
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(store));
    } catch { /* quota exceeded */ }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Track an analytics event.
 */
export function trackEvent(type: EventType, data: Record<string, string | number | boolean> = {}) {
    const store = getStore();
    store.events.push({
        type,
        timestamp: Date.now(),
        data,
        sessionId: store.sessionId,
    });
    saveStore(store);
}

/**
 * Set the authenticated user ID for analytics.
 */
export function setAnalyticsUser(userId: string | null) {
    const store = getStore();
    store.userId = userId;
    saveStore(store);
}

/**
 * Get analytics summary for dashboard.
 */
export function getAnalyticsSummary() {
    const store = getStore();
    const events = store.events;

    const now = Date.now();
    const last7Days = events.filter(e => now - e.timestamp < 7 * 86400000);
    const last30Days = events.filter(e => now - e.timestamp < 30 * 86400000);

    const countByType = (evts: AnalyticsEvent[]) => {
        const counts: Partial<Record<EventType, number>> = {};
        evts.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
        return counts;
    };

    // Most viewed destinations
    const destClicks = events
        .filter(e => e.type === 'destination_click')
        .reduce((acc, e) => {
            const dest = String(e.data.destination || 'unknown');
            acc[dest] = (acc[dest] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

    const topDestinations = Object.entries(destClicks)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    return {
        totalEvents: events.length,
        last7Days: countByType(last7Days),
        last30Days: countByType(last30Days),
        topDestinations,
        sessionsCount: new Set(events.map(e => e.sessionId)).size,
        userId: store.userId,
    };
}

/**
 * Clear analytics data (for privacy/GDPR).
 */
export function clearAnalytics() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(ANALYTICS_KEY);
    }
}
