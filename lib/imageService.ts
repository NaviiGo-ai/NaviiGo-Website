// ─── Image Service ────────────────────────────────────────────────────────────
// Utilities for resolving images across the app.
// - Local destination images (primary)
// - Unsplash ID → full URL (legacy fallback)
// - Google Places photo reference → URL
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
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !photoReference) return '';
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
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
// Maps legacy Unsplash IDs to local destination images for reliability.
// This ensures all itinerary images render even without Unsplash.

const UNSPLASH_TO_LOCAL: Record<string, string> = {
    // Nature / Backwaters
    '1593693397690-362cb9666fc2': '/destinations/kerala.jpg',
    '1602216056096-3b40cc0c9944': '/destinations/kerala.jpg',
    // Tea / Hills
    '1626621341517-bbf3d9990a23': '/destinations/ooty.jpg',
    // Heritage / Forts
    '1524492412937-b28074a5d7da': '/destinations/agra.png',
    '1599661502283-a44ea24dfc74': '/destinations/jaipur.png',
    // Beaches
    '1512343779784-a1d53b98b8ef': '/destinations/goa.jpg',
    '1507525428034-b723cf961d3e': '/destinations/goa.jpg',
    // Temples / Spiritual
    '1582283925565-d053709d3bdf': '/destinations/varanasi.png',
    '1585409677983-0f6c41ca9c3b': '/destinations/rishikesh.png',
    '1590132840509-3286380695c0': '/destinations/varanasi.png',
    // Waterfall / Wildlife
    '1549366021-d6d0bdb29a8b': '/destinations/coorg.jpg',
    // Food
    '1567521464027-f127ff144326': '/destinations/delhi.png',
    '1631515243349-e0cb75fb8d4a': '/destinations/hyderabad.jpg',
    '1555396273-367ea4eb4db5': '/destinations/goa.jpg',
    '1517248135467-4c7edcad34c4': '/destinations/manali.png',
    // Hotels
    '1571896349842-33c89424de2d': '/destinations/udaipur.png',
    '1564501049412-61c2a3083791': '/destinations/rishikesh.png',
    '1582719508461-905c673c825d': '/destinations/coorg.jpg',
    '1566073771259-6a6300d73351': '/destinations/mumbai.jpg',
    // Mountains
    '1477587458883-47145ed94245': '/destinations/jaisalmer.png',
    // Agra
    '1564507592333-c60657eea523': '/destinations/agra.png',
};

// ─── Smart Image Resolver ─────────────────────────────────────────────────────
// Returns the best image URL given a name and category.

export function resolveImage(
    unsplashId?: string,
    placesPhotoRef?: string,
    category?: string
): { url: string; type: 'unsplash' | 'places' | 'fallback' } {
    if (unsplashId) {
        // Check local mapping first
        if (UNSPLASH_TO_LOCAL[unsplashId]) {
            return { url: UNSPLASH_TO_LOCAL[unsplashId], type: 'fallback' };
        }
        return { url: unsplashUrl(unsplashId), type: 'unsplash' };
    }
    if (placesPhotoRef) {
        const url = placesPhotoUrl(placesPhotoRef);
        if (url) return { url, type: 'places' };
    }
    return { url: '/destinations/delhi.png', type: 'fallback' };
}

// ─── Image Error Handler ──────────────────────────────────────────────────────
// Use this as onError handler for images

export function handleImageError(
    event: React.SyntheticEvent<HTMLImageElement>,
    fallbackCategory?: string
): void {
    const img = event.currentTarget;
    img.src = '/destinations/delhi.png';
    img.onerror = null; // prevent infinite loop
}

// ─── Universal Image Source Resolver ──────────────────────────────────────────
// Handles full URLs, local paths, and legacy Unsplash IDs.
// Use this everywhere: resolveImgSrc(item.img, 800, item.name, item.cuisine)

export function resolveImgSrc(src: string, width: number = 800, name?: string, _category?: string): string {
    if (!src || src === 'placeholder') {
        return '/destinations/delhi.png';
    }
    // Already a full URL — use it directly
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    // Local path (e.g. /destinations/jaipur.png)
    if (src.startsWith('/')) return src;
    // If it looks like just a filename, try destinations folder
    if (!src.includes('/') && (src.endsWith('.png') || src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.webp'))) {
        return `/destinations/${src}`;
    }
    // Legacy Unsplash ID format (e.g. '1567521464027-f127ff144326')
    // When name is provided (restaurant/hotel cards), use the Unsplash CDN for unique images per ID
    // When no name (destination hero), use the local mapping for reliability
    if (/^\d+-[a-f0-9]+$/.test(src)) {
        if (name) {
            // Use Unsplash CDN — each ID is a unique photo
            return `https://images.unsplash.com/photo-${src}?auto=format&fit=crop&w=${width}&q=80`;
        }
        // For hero/destination backgrounds, use local mapping if available
        if (UNSPLASH_TO_LOCAL[src]) return UNSPLASH_TO_LOCAL[src];
        return `https://images.unsplash.com/photo-${src}?auto=format&fit=crop&w=${width}&q=80`;
    }
    // Check local mapping
    if (UNSPLASH_TO_LOCAL[src]) return UNSPLASH_TO_LOCAL[src];
    // Final fallback
    return '/destinations/delhi.png';
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
