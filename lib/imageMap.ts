// ─── Centralized Image Map ────────────────────────────────────────────────────
// Single source of truth for ALL destination & landmark images across NaviiGo.
//
// Strategy: Since Unsplash requires strict verified photo IDs, we map
// destinations to a curated set of 12 highly-verified, beautiful Indian
// context photos based on their region and category. This prevents 
// rate-limiting (429s) and prevents hallucinated irrelevant IDs.

function unsplash(photoId: string, w: number = 1000): string {
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${w}&q=80`;
}

// ─── Verified Unsplash Source IDs for India ──────────────────────────────────
// These have been strictly verified to be beautiful, correct Indian photography.
export const VERIFIED_SRC = {
    // Regions
    rajasthan_fort: '1599661502283-a44ea24dfc74',  // Grand Rajasthani fort
    himalayas:      '1585409677983-0f6c41ca9c3b',  // Snow capped peaks
    kerala_boats:   '1602216056096-3b40cc0c9944',  // Backwaters
    goa_beach:      '1512343779784-a1d53b98b8ef',  // Beach sunset
    varanasi_ghats: '1590132840509-3286380695c0',  // Spiritual river ghats
    taj_mahal:      '1564507592333-c60657eea523',  // Taj Mahal
    city_gate:      '1587474260584-136574528ed5',  // India Gate/Metro look
    golden_temple:  '1514222134-b57cbb8ce073',  // Golden temple
    south_temple:   '1582283925565-d053709d3bdf',  // Dravidian temple
    tea_gardens:    '1626621341517-bbf3d9990a23',  // Hills and tea
    jungle_tiger:   '1615824996195-f780bba7cfab',  // Wildlife/Nature
    india_generic:  '1524492412937-b28074a5d7da',  // General heritage structure
};

// ─── Smart Category Resolver ──────────────────────────────────────────────────
// Maps destination keys directly to the best curated photo.
export const DEST_IMAGES: Record<string, string> = {
    // Fallbacks for any missing scrape:
    kerala:         unsplash(VERIFIED_SRC.kerala_boats),
    lakshadweep:    unsplash(VERIFIED_SRC.goa_beach),
    kaziranga:      unsplash(VERIFIED_SRC.jungle_tiger),
};

// ─── Generic Fallbacks ────────────────────────────────────────────────────────

export const FALLBACK_IMAGES = {
    attraction: unsplash(VERIFIED_SRC.taj_mahal),
    restaurant: unsplash('1567521464027-f127ff144326'), // Indian food
    hotel:      unsplash('1571896349842-33c89424de2d'), // Resort
    nature:     unsplash(VERIFIED_SRC.tea_gardens),
    beach:      unsplash(VERIFIED_SRC.goa_beach),
    mountain:   unsplash(VERIFIED_SRC.himalayas),
    spiritual:  unsplash(VERIFIED_SRC.south_temple),
    heritage:   unsplash(VERIFIED_SRC.india_generic),
    default:    unsplash(VERIFIED_SRC.india_generic),
};

export const GRADIENT_FALLBACKS: Record<string, string> = {
    nature:     'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)',
    spiritual:  'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    beach:      'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
    mountain:   'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
    heritage:   'linear-gradient(135deg, #92400e 0%, #451a03 100%)',
    food:       'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)',
    hotel:      'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
    default:    'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
};

// ─── Resolver Function ────────────────────────────────────────────────────────
export function getPlaceImage(name: string, category?: string): string {
    const key = name.toLowerCase().replace(/\s+/g, '');
    for (const [k, v] of Object.entries(DEST_IMAGES)) {
        if (key.includes(k) || k.includes(key)) return v;
    }
    if (category && FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES]) {
        return FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES];
    }
    return FALLBACK_IMAGES.default;
}

export function handleImgError(e: React.SyntheticEvent<HTMLImageElement | HTMLDivElement>, category?: string): void {
    const el = e.currentTarget;
    const gradient = GRADIENT_FALLBACKS[category || 'default'] || GRADIENT_FALLBACKS.default;
    if (el instanceof HTMLImageElement) { el.style.display = 'none'; if (el.parentElement) el.parentElement.style.background = gradient; }
    else { el.style.backgroundImage = 'none'; el.style.background = gradient; }
}
