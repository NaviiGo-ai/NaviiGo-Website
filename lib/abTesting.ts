// ─── A/B Testing Framework ───────────────────────────────────────────────────
// Simple client-side A/B testing with consistent user bucketing.
// No external dependencies — uses localStorage for persistence.

const AB_KEY = 'naviigo_ab_tests';

interface ABExperiment {
    name: string;
    variants: string[];
    weight?: number[];  // distribution weights (default: even split)
}

interface ABStore {
    userId: string;
    assignments: Record<string, string>; // experiment → variant
}

// ─── Built-in experiments ────────────────────────────────────────────────────

export const EXPERIMENTS: Record<string, ABExperiment> = {
    // Hero CTA text
    hero_cta: {
        name: 'hero_cta',
        variants: ['Plan Your Journey', 'Start Exploring'],
    },
    // Itinerary card layout
    itinerary_layout: {
        name: 'itinerary_layout',
        variants: ['timeline', 'cards'],
    },
    // Explore page grid style
    explore_grid: {
        name: 'explore_grid',
        variants: ['bento', 'masonry'],
    },
    // Show transport comparison
    transport_compare: {
        name: 'transport_compare',
        variants: ['show', 'hide'],
    },
    // Festival banner
    festival_banner: {
        name: 'festival_banner',
        variants: ['prominent', 'subtle'],
    },
};

// ─── Core Logic ──────────────────────────────────────────────────────────────

function getStore(): ABStore {
    if (typeof window === 'undefined') {
        return { userId: 'ssr', assignments: {} };
    }
    try {
        const raw = localStorage.getItem(AB_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }

    // Generate new user bucket ID
    const userId = `ab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const store: ABStore = { userId, assignments: {} };
    saveStore(store);
    return store;
}

function saveStore(store: ABStore) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(AB_KEY, JSON.stringify(store));
    } catch { /* quota exceeded */ }
}

/**
 * Get the variant assigned to this user for a given experiment.
 * Assignment is deterministic — same user always gets same variant.
 */
export function getVariant(experimentName: string): string {
    const store = getStore();

    // Return existing assignment
    if (store.assignments[experimentName]) {
        return store.assignments[experimentName];
    }

    // Look up experiment config
    const experiment = EXPERIMENTS[experimentName];
    if (!experiment) return 'A'; // default fallback

    // Assign variant based on hash of userId + experiment name
    const hash = simpleHash(`${store.userId}_${experimentName}`);
    const weights = experiment.weight || experiment.variants.map(() => 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const threshold = hash % totalWeight;

    let cumulative = 0;
    let assignedVariant = experiment.variants[0];
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (threshold < cumulative) {
            assignedVariant = experiment.variants[i];
            break;
        }
    }

    // Persist assignment
    store.assignments[experimentName] = assignedVariant;
    saveStore(store);

    return assignedVariant;
}

/**
 * Get all current experiment assignments for this user.
 */
export function getAllAssignments(): Record<string, string> {
    const store = getStore();
    // Ensure all experiments have assignments
    for (const name of Object.keys(EXPERIMENTS)) {
        if (!store.assignments[name]) {
            getVariant(name); // This will create and persist the assignment
        }
    }
    return getStore().assignments;
}

/**
 * Force a specific variant (for testing/debugging).
 */
export function forceVariant(experimentName: string, variant: string) {
    const store = getStore();
    store.assignments[experimentName] = variant;
    saveStore(store);
}

/**
 * Reset all A/B assignments (for debugging).
 */
export function resetABTests() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AB_KEY);
    }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
