// ─── Image Service ────────────────────────────────────────────────────────────
// Utilities for resolving images across the app.
// - Local destination images (primary)
// - Unsplash ID → full URL (legacy fallback)
// - Google Places photo reference → URL
// - Category-aware fallback with name-based hashing for variety
// - Fallback gradient for broken images


// ─── Unsplash ─────────────────────────────────────────────────────────────────

export function unsplashUrl(photoId: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    fit?: 'crop' | 'clip' | 'fill';
} = {}): string {
    const { width = 800, quality = 80, fit = 'crop' } = options;
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=${fit}&w=${width}&q=${quality}`;
}

// ─── Google Places Photo ──────────────────────────────────────────────────────

export function placesPhotoUrl(photoReference: string, maxWidth: number = 800): string {
    if (!photoReference) return '';
    // Serve bytes via the backend proxy so the API key never reaches the client.
    const base = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
    return `${base}/api/places/photo/${encodeURIComponent(photoReference)}?maxwidth=${maxWidth}`;
}

// ─── Fallback Gradient ────────────────────────────────────────────────────────

const FALLBACK_GRADIENTS: Record<string, string> = {
    nature: 'linear-gradient(135deg, #0f766e 0%, #064e3b 100%)',
    spiritual: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    beach: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
    mountain: 'linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%)',
    city: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
    food: 'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)',
    hotel: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)',
    default: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
};

export function getFallbackGradient(category?: string): string {
    return FALLBACK_GRADIENTS[category || 'default'] || FALLBACK_GRADIENTS.default;
}

// ─── Local Image Fallback Map ─────────────────────────────────────────────────
// DEPRECATED: We now use dynamic hash-based local images for everything.

// ─── Tag-to-Category Mapper ──────────────────────────────────────────────────
// Maps common Gemini/activity tags to image pool categories
const TAG_TO_CATEGORY: Record<string, string> = {
    'temple': 'temple', 'spiritual': 'spiritual', 'aarti': 'spiritual',
    'heritage': 'heritage', 'fort': 'fort', 'palace': 'palace', 'museum': 'museum',
    'beach': 'beach', 'nature': 'nature', 'lake': 'lake', 'garden': 'garden',
    'mountain': 'mountain', 'trekking': 'trekking', 'adventure': 'trekking',
    'market': 'market', 'shopping': 'shopping', 'bazaar': 'market',
    'food': 'food', 'restaurant': 'restaurant', 'cafe': 'food', 'street food': 'food',
    'hotel': 'hotel', 'resort': 'hotel', 'homestay': 'hotel', 'hostel': 'hotel',
    'waterfall': 'waterfall', 'sunset': 'sunset',
    'buddhist': 'spiritual', 'culture': 'heritage', 'history': 'heritage',
    'unesco': 'heritage', 'walk': 'nature',
    // Extended mappings for Gemini-generated tags
    'mosque': 'heritage', 'ghat': 'spiritual', 'church': 'heritage',
    'cave': 'heritage', 'ruins': 'heritage', 'architecture': 'heritage',
    'wildlife': 'nature', 'safari': 'nature', 'national park': 'nature',
    'valley': 'mountain', 'river': 'nature', 'hill': 'mountain',
    'yoga': 'spiritual', 'meditation': 'spiritual', 'pilgrimage': 'spiritual',
    'island': 'beach', 'coastal': 'beach', 'snorkeling': 'beach', 'diving': 'beach',
    'local': 'food', 'thali': 'food', 'biryani': 'food', 'seafood': 'food',
    'park': 'garden', 'botanical': 'garden', 'zoo': 'nature',
    'camping': 'trekking', 'rafting': 'trekking', 'paragliding': 'trekking',
};

/**
 * Infer image category from tags array or explicit category string.
 */
function inferCategory(tags?: string[], category?: string): string {
    if (category) {
        const lower = category.toLowerCase();
        if (TAG_TO_CATEGORY[lower]) return TAG_TO_CATEGORY[lower];
        return lower;
    }
    if (tags && tags.length > 0) {
        for (const tag of tags) {
            const lower = tag.toLowerCase();
            if (TAG_TO_CATEGORY[lower]) return TAG_TO_CATEGORY[lower];
        }
    }
    return 'default';
}

// ─── Smart Image Resolver ─────────────────────────────────────────────────────
// Returns the best image URL given a name and category.

export function resolveImage(
    unsplashId?: string,
    placesPhotoRef?: string,
    category?: string
): { url: string; type: 'unsplash' | 'places' | 'fallback' } {
    if (placesPhotoRef) {
        const url = placesPhotoUrl(placesPhotoRef);
        if (url) return { url, type: 'places' };
    }
    return { url: '', type: 'fallback' };
}

// ─── Image Error Handler ──────────────────────────────────────────────────────
// Use this as onError handler for images

export function handleImageError(
    event: React.SyntheticEvent<HTMLImageElement>,
    fallbackCategory?: string
): void {
    const img = event.currentTarget;
    img.style.display = 'none'; // hide broken image completely
}

// ─── Universal Image Source Resolver ──────────────────────────────────────────
// Handles full URLs, local paths, and legacy Unsplash IDs.
// Now with category-aware fallbacks and name-based hashing for variety.
// Use this everywhere: resolveImgSrc(item.img, 800, item.name, item.cuisine)

export function resolveImgSrc(src: string, width: number = 800, name?: string, _category?: string): string {
    if (!src || src === 'placeholder') {
        return '';
    }
    // Only accept full URLs (http/https)
    if (src.startsWith('http://') || src.startsWith('https://')) {
        return src;
    }
    // Everything else is considered unavailable; return empty string
    return '';
}



// ─── Verified Unsplash IDs for Indian Destinations ────────────────────────────
// DEPRECATED: Use local images instead. Kept for backward compatibility.
export const VERIFIED_IMAGES = {
    varanasi_bg: '1590132840509-3286380695c0',
    rajasthan_bg: '1477587458883-47145ed94245',
    himalayas_bg: '1585409677983-0f6c41ca9c3b',
    kerala_bg: '1602216056096-3b40cc0c9944',
    goa_bg: '1512343779784-a1d53b98b8ef',
    india_generic: '1524492412937-b28074a5d7da',
    houseboat: '1593693397690-362cb9666fc2',
    tea_gardens: '1626621341517-bbf3d9990a23',
    fort_palace: '1599661502283-a44ea24dfc74',
    beach: '1507525428034-b723cf961d3e',
    temple: '1582283925565-d053709d3bdf',
    waterfall: '1549366021-d6d0bdb29a8b',
    food_indian: '1567521464027-f127ff144326',
    biryani: '1631515243349-e0cb75fb8d4a',
    seafood: '1555396273-367ea4eb4db5',
    cafe: '1517248135467-4c7edcad34c4',
    resort: '1571896349842-33c89424de2d',
    hostel: '1564501049412-61c2a3083791',
    homestay: '1582719508461-905c673c825d',
    hotel_modern: '1566073771259-6a6300d73351',
};
