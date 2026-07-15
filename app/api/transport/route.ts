import { NextRequest, NextResponse } from 'next/server';
import { badRequest, validateLat, validateLng } from '@/lib/validation';

const GOOGLE_KEY = process.env.GOOGLE_DISTANCE_MATRIX_KEY;

/**
 * Smart Transport API — returns walking, auto, and cab estimates.
 * Uses Google Distance Matrix when key is available.
 * Falls back to OSRM (free, open-source) with formula-based pricing.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // ── Validation ────────────────────────────────────────────────────
    const fromLat = validateLat(searchParams.get('fromLat'));
    const fromLng = validateLng(searchParams.get('fromLng'));
    const toLat   = validateLat(searchParams.get('toLat'));
    const toLng   = validateLng(searchParams.get('toLng'));

    if (fromLat === null || searchParams.get('fromLat') === null) return badRequest('fromLat is required and must be a number between -90 and 90.');
    if (fromLng === null || searchParams.get('fromLng') === null) return badRequest('fromLng is required and must be a number between -180 and 180.');
    if (toLat === null   || searchParams.get('toLat')   === null) return badRequest('toLat is required and must be a number between -90 and 90.');
    if (toLng === null   || searchParams.get('toLng')   === null) return badRequest('toLng is required and must be a number between -180 and 180.');
    // ─────────────────────────────────────────────────────────────────

    // ── Helper: OSRM for free driving distance ─────────────────
    const getOSRM = async (mode: 'foot' | 'car') => {
        try {
            const profile = mode === 'foot' ? 'foot' : 'car';
            const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
            const res = await fetch(url, { next: { revalidate: 86400 } });
            const data = await res.json();
            if (data.code !== 'Ok') return null;
            return {
                distanceM: data.routes[0].distance,
                durationS: data.routes[0].duration,
            };
        } catch { return null; }
    };

    try {
        const [walkData, driveData] = await Promise.all([
            getOSRM('foot'),
            getOSRM('car'),
        ]);

        const distKm = driveData ? driveData.distanceM / 1000 : haversine(fromLat, fromLng, toLat, toLng);
        const driveMinutes = driveData ? Math.ceil(driveData.durationS / 60) : Math.ceil(distKm * 3);
        const walkMinutes = walkData ? Math.ceil(walkData.durationS / 60) : Math.ceil(distKm * 12);

        // Formula pricing (India estimates)
        const autoCost = Math.max(30, Math.round(distKm * 12)); // ₹12/km, min ₹30
        const cabCost = Math.max(60, Math.round(distKm * 18));  // ₹18/km, min ₹60

        // ── Google Distance Matrix (upgrade if key present) ─────
        if (GOOGLE_KEY && GOOGLE_KEY !== 'your_google_distance_matrix_key_here') {
            const gmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&mode=driving&key=${GOOGLE_KEY}`;
            const gmRes = await fetch(gmUrl, { next: { revalidate: 86400 } });
            const gmData = await gmRes.json();
            const gmRow = gmData.rows?.[0]?.elements?.[0];
            if (gmRow?.status === 'OK') {
                const gmDurationMin = Math.ceil((gmRow.duration?.value ?? (driveMinutes * 60)) / 60);
                return NextResponse.json({
                    distance: gmRow.distance?.text || `${distKm.toFixed(1)} km`,
                    options: [
                        { mode: 'Walking', emoji: '🚶', duration: `${walkMinutes} min`, cost: '₹0', tip: 'Healthy & free' },
                        { mode: 'Auto Rickshaw', emoji: '🛺', duration: `${gmDurationMin} min`, cost: `₹${autoCost}–${autoCost + 20}`, tip: 'Negotiate before boarding' },
                        { mode: 'Cab / Ola', emoji: '🚗', duration: `${gmDurationMin} min`, cost: `₹${cabCost}–${cabCost + 40}`, tip: 'Book via Ola/Rapido app' },
                    ],
                });
            }
        }

        // ── OSRM-based response ─────────────────────────────────
        return NextResponse.json({
            distance: distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`,
            options: [
                { mode: 'Walking', emoji: '🚶', duration: `${walkMinutes} min`, cost: '₹0', tip: distKm > 2.5 ? 'Far — consider auto' : 'Easy walk' },
                { mode: 'Auto Rickshaw', emoji: '🛺', duration: `${driveMinutes} min`, cost: `₹${autoCost}–${autoCost + 20}`, tip: 'Negotiate before boarding' },
                { mode: 'Cab / Ola', emoji: '🚗', duration: `${driveMinutes} min`, cost: `₹${cabCost}–${cabCost + 40}`, tip: 'Book via Ola/Rapido app' },
            ],
        });
    } catch (err) {
        return NextResponse.json({ distance: 'Unknown', options: [] });
    }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
