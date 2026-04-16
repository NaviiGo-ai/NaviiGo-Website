// ─── Image Service ────────────────────────────────────────────────────────────
// Utilities for resolving images across the app.
// - Unsplash ID → full URL
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

// ─── Verified Unsplash IDs for Indian Destinations ────────────────────────────
// These have been verified to load correctly.

export const VERIFIED_IMAGES = {
    // Backgrounds
    varanasi_bg: '1590132840509-3286380695c0',
    rajasthan_bg: '1477587458883-47145ed94245',
    himalayas_bg: '1585409677983-0f6c41ca9c3b',
    kerala_bg: '1602216056096-3b40cc0c9944',
    goa_bg: '1512343779784-a1d53b98b8ef',
    india_generic: '1524492412937-b28074a5d7da',

    // Attractions
    houseboat: '1593693397690-362cb9666fc2',
    tea_gardens: '1626621341517-bbf3d9990a23',
    fort_palace: '1599661502283-a44ea24dfc74',
    beach: '1507525428034-b723cf961d3e',
    temple: '1582283925565-d053709d3bdf',
    waterfall: '1549366021-d6d0bdb29a8b',

    // Food
    food_indian: '1567521464027-f127ff144326',
    biryani: '1631515243349-e0cb75fb8d4a',
    seafood: '1555396273-367ea4eb4db5',
    cafe: '1517248135467-4c7edcad34c4',

    // Hotels
    resort: '1571896349842-33c89424de2d',
    hostel: '1564501049412-61c2a3083791',
    homestay: '1582719508461-905c673c825d',
    hotel_modern: '1566073771259-6a6300d73351',
};

// ─── Smart Image Resolver ─────────────────────────────────────────────────────
// Returns the best image URL given a name and category.

export function resolveImage(
    unsplashId?: string,
    placesPhotoRef?: string,
    category?: string
): { url: string; type: 'unsplash' | 'places' | 'fallback' } {
    if (unsplashId) {
        return { url: unsplashUrl(unsplashId), type: 'unsplash' };
    }
    if (placesPhotoRef) {
        const url = placesPhotoUrl(placesPhotoRef);
        if (url) return { url, type: 'places' };
    }
    // Return a placeholder unsplash image as fallback
    const fallbackId = VERIFIED_IMAGES[category as keyof typeof VERIFIED_IMAGES] || VERIFIED_IMAGES.india_generic;
    return { url: unsplashUrl(fallbackId), type: 'fallback' };
}

// ─── Image Error Handler ──────────────────────────────────────────────────────
// Use this as onError handler for images

export function handleImageError(
    event: React.SyntheticEvent<HTMLImageElement>,
    fallbackCategory?: string
): void {
    const img = event.currentTarget;
    const fallbackId = VERIFIED_IMAGES[fallbackCategory as keyof typeof VERIFIED_IMAGES] || VERIFIED_IMAGES.india_generic;
    img.src = unsplashUrl(fallbackId, { width: 600 });
    img.onerror = null; // prevent infinite loop
}

// ─── Universal Image Source Resolver ──────────────────────────────────────────
// Handles both full URLs (Wikimedia, any https) and legacy Unsplash IDs.
// Use this everywhere: resolveImgSrc(item.img, 800)

export function resolveImgSrc(src: string, width: number = 800): string {
    if (!src) return unsplashUrl(VERIFIED_IMAGES.india_generic, { width });
    // Already a full URL
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    // Legacy Unsplash ID format
    return unsplashUrl(src, { width });
}
