// ─── Saved Itineraries (localStorage) ─────────────────────────────────────────

export interface SavedItinerary {
    id: string;
    destId: string;
    destName: string;
    form: Record<string, unknown>;
    createdAt: string; // ISO string
}

const STORAGE_KEY = 'naviigo_saved_itineraries';

function getAll(): SavedItinerary[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function persist(items: SavedItinerary[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveItinerary(destId: string, destName: string, form: Record<string, unknown>): SavedItinerary {
    const item: SavedItinerary = {
        id: `itin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        destId,
        destName,
        form,
        createdAt: new Date().toISOString(),
    };
    const all = getAll();
    all.unshift(item); // newest first
    persist(all);
    return item;
}

export function getSavedItineraries(): SavedItinerary[] {
    return getAll();
}

export function deleteItinerary(id: string): void {
    const all = getAll().filter(i => i.id !== id);
    persist(all);
}
