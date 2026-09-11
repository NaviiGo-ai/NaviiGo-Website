// ─── Google Places API (New) ──────────────────────────────────────────────────
// Shared helpers for the v1 Places API (`places.googleapis.com/v1`).
//
// The three endpoints we use:
//   • places:searchText    — free-text lookup (named place / keyword query)
//   • places:searchNearby  — type-based lookup around a coordinate
//   • {photoName}/media    — photo bytes
//
// Two things differ from the legacy `maps.googleapis.com/maps/api/place/*` API:
//
//   1. The New API bills by the fields you ask for, so every request MUST send
//      an explicit `X-Goog-FieldMask`. Keep the masks below minimal — widening
//      one can move the call into a more expensive SKU.
//   2. Photo handles are no longer opaque strings but resource names of the
//      form `places/{placeId}/photos/{photoId}`. They contain slashes, so they
//      travel as a query parameter (`?name=`) rather than a path segment.

export const PLACES_API_BASE = 'https://places.googleapis.com/v1';

/** Max radius the New API accepts for a circle, in metres. */
export const MAX_CIRCLE_RADIUS = 50_000;

/** Max results the New API accepts for searchText / searchNearby. */
export const MAX_RESULT_COUNT = 20;

/**
 * Fields needed to render a place card.
 * `Widening this list can change the billing SKU` — see the module header.
 */
export const PLACE_FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.rating',
    'places.userRatingCount',
    'places.priceLevel',
    'places.shortFormattedAddress',
    'places.location',
    'places.regularOpeningHours.openNow',
    'places.types',
    'places.photos.name',
].join(',');

/** Minimal mask for the "find one photo for this place name" lookup. */
export const PHOTO_FIELD_MASK = 'places.photos.name';

// ─── Photo resource names ─────────────────────────────────────────────────────

// `places/{placeId}/photos/{photoId}`. Both segments are URL-safe identifiers,
// so anything containing `.`, `/` or `%` is rejected — which is what keeps a
// caller-supplied photo name from being used for path traversal upstream.
const PHOTO_NAME_RE = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export function isValidPhotoName(name: unknown): name is string {
    return typeof name === 'string' && name.length <= 512 && PHOTO_NAME_RE.test(name);
}

/**
 * Relative proxy path the browser should use for a photo. The API key stays on
 * the server — the client only ever sees our own route.
 */
export function placesPhotoProxyPath(photoName: string, maxWidth: number): string {
    return `/api/places/photo?name=${encodeURIComponent(photoName)}&maxwidth=${maxWidth}`;
}

// ─── Response normalisation ───────────────────────────────────────────────────

/** Maps the New API's `PRICE_LEVEL_*` enum onto the legacy 0–4 scale. */
export function mapPriceLevel(level: unknown): number | null {
    switch (level) {
        case 'PRICE_LEVEL_FREE': return 0;
        case 'PRICE_LEVEL_INEXPENSIVE': return 1;
        case 'PRICE_LEVEL_MODERATE': return 2;
        case 'PRICE_LEVEL_EXPENSIVE': return 3;
        case 'PRICE_LEVEL_VERY_EXPENSIVE': return 4;
        default: return null;
    }
}

export interface NormalizedPlace {
    id: string | null;
    name: string | null;
    rating: number;
    userRatingsTotal: number;
    priceLevel: number | null;
    vicinity: string | null;
    lat: number | null;
    lng: number | null;
    isOpen: boolean | null;
    types: string[];
    photoName: string | null;
}

/** Flattens one New-API place object into the shape the UI already consumes. */
export function normalizePlace(place: any): NormalizedPlace {
    const photoName = place?.photos?.[0]?.name;
    return {
        id: place?.id ?? null,
        name: place?.displayName?.text ?? null,
        rating: typeof place?.rating === 'number' ? place.rating : 0,
        userRatingsTotal: typeof place?.userRatingCount === 'number' ? place.userRatingCount : 0,
        priceLevel: mapPriceLevel(place?.priceLevel),
        vicinity: place?.shortFormattedAddress ?? null,
        lat: place?.location?.latitude ?? null,
        lng: place?.location?.longitude ?? null,
        isOpen: place?.regularOpeningHours?.openNow ?? null,
        types: Array.isArray(place?.types) ? place.types : [],
        photoName: isValidPhotoName(photoName) ? photoName : null,
    };
}

/**
 * Human-readable message for a failed New-API call. The New API encodes errors
 * as `{ error: { code, message, status } }` with a non-2xx HTTP status.
 */
export function placesApiError(payload: any, status: number): string {
    const message = payload?.error?.message;
    if (message) return `${status} ${message}`;
    return `HTTP ${status}`;
}
