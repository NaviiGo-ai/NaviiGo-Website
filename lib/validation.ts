// ─── API Input Validation Helpers ─────────────────────────────────────────────
// Used by every route in /app/api to validate and sanitise inputs before
// they are forwarded to Python backends or third-party services.

import { NextResponse } from 'next/server';

// ── Known destination IDs (from app/itinerary/data.ts DESTINATIONS) ──────────
export const KNOWN_DEST_IDS = new Set([
    'delhi', 'jaipur', 'agra', 'varanasi', 'amritsar', 'lucknow',
    'udaipur', 'jodhpur', 'jaisalmer', 'pushkar',
    'manali', 'shimla', 'rishikesh', 'dharamshala', 'nainital', 'mussoorie', 'haridwar',
    'srinagar', 'ladakh', 'gulmarg',
    'kerala', 'goa', 'mysuru', 'hampi', 'pondicherry', 'ooty', 'coorg', 'hyderabad', 'madurai',
    'mumbai', 'kutch', 'dwarka',
    'kolkata', 'darjeeling', 'gangtok', 'puri',
    'shillong', 'tawang',
    'andaman', 'lakshadweep',
    'tirupati', 'ujjain', 'bodhgaya',
]);

// ── Known purpose IDs (from app/itinerary/data.ts PURPOSES) ──────────────────
export const KNOWN_PURPOSES = new Set([
    'spiritual', 'leisure', 'adventure', 'cultural', 'honeymoon', 'celebrate',
]);

// ── Known group IDs (from app/itinerary/data.ts GROUP_SIZES) ─────────────────
export const KNOWN_GROUPS = new Set([
    'solo', 'couple', 'family', 'friends', 'large',
]);

// ── Known companion options (explore/deep-dive) ───────────────────────────────
export const KNOWN_COMPANIONS = new Set(['Solo', 'Couple', 'Group of Friends', 'Family']);

// ── Known deep-dive vibes (explore/deep-dive) ────────────────────────────────
export const KNOWN_VIBES = new Set([
    'Authentic Exploration', 'Food & Culinary', 'Relaxation & Luxury', 'Budget Backpacking',
]);

// ── Known Google Places types (places/details) ────────────────────────────────
export const KNOWN_PLACE_TYPES = new Set([
    'restaurant', 'lodging', 'tourist_attraction', 'museum', 'park', 'bar',
    'cafe', 'shopping_mall', 'spa', 'amusement_park',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a 400 JSON response. Utility for early-exit validation. */
export function badRequest(message: string) {
    return NextResponse.json({ success: false, error: message }, { status: 400 });
}

/** Validates a string field: present, non-empty, within max length. */
export function validateString(
    value: unknown,
    fieldName: string,
    maxLength: number = 200,
): string | null {
    if (typeof value !== 'string' || value.trim().length === 0) return null;
    if (value.length > maxLength) return null;
    return value.trim();
}

/** Validates a number that must be within [min, max]. */
export function validateNumber(
    value: unknown,
    min: number,
    max: number,
): number | null {
    const n = Number(value);
    if (!isFinite(n) || n < min || n > max) return null;
    return n;
}

/** Validates a latitude value: numeric and within [-90, 90]. */
export function validateLat(value: unknown): number | null {
    return validateNumber(value, -90, 90);
}

/** Validates a longitude value: numeric and within [-180, 180]. */
export function validateLng(value: unknown): number | null {
    return validateNumber(value, -180, 180);
}

/** Validates that a value belongs to a known set. */
export function validateEnum<T>(value: unknown, knownSet: Set<T>): T | null {
    if (knownSet.has(value as T)) return value as T;
    return null;
}

/** Validates a URL is a real https:// URL (not file://, data:, etc.). */
export function validateHttpsUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== 'https:') return null;
        return value;
    } catch {
        return null;
    }
}

/** Validates an array of numbers (e.g. taste vectors). */
export function validateNumberArray(
    value: unknown,
    maxLength: number = 2048,
): number[] | null {
    if (!Array.isArray(value)) return null;
    if (value.length > maxLength) return null;
    if (!value.every((v) => typeof v === 'number' && isFinite(v))) return null;
    return value;
}
