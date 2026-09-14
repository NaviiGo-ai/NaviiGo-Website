import { NextRequest, NextResponse } from 'next/server';
import { badRequest, validateString, KNOWN_COMPANIONS, KNOWN_VIBES } from '@/lib/validation';
import { applyRateLimit } from '@/lib/rateLimit';
import { getAuthenticExplorationData, AUTHENTIC_DESTINATIONS } from '@/lib/data/authenticExplorationData';

// In-memory server cache with 7-day TTL
interface CacheRecord {
  data: any;
  timestamp: number;
  expiry: number;
}
const serverDeepDiveCache = new Map<string, CacheRecord>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * POST /api/explore/deep-dive
 * Returns authentic destination intelligence.
 * Tier 1: In-memory server cache (0ms)
 * Tier 2: Verified curated destination intelligence repository (0ms, 0 Gemini tokens)
 * Tier 3: Python backend proxy with timeout
 * Tier 4: Synthetic procedural generator (0 Gemini tokens)
 */
export async function POST(req: NextRequest) {
    // 30 requests/min per IP
    const limited = applyRateLimit(req, 30, 60_000, 'ai');
    if (limited) return limited;

    try {
        const body = await req.json();

        // ── Validation ────────────────────────────────────────────────
        const destination = validateString(body.destination, 'destination', 100);
        if (!destination) {
            return badRequest('destination is required and must be a non-empty string under 100 characters.');
        }

        const companion = (body.companion && KNOWN_COMPANIONS.has(body.companion))
          ? body.companion
          : 'Solo';

        const vibe = (body.vibe && KNOWN_VIBES.has(body.vibe))
          ? body.vibe
          : 'Authentic Exploration';

        const cacheKey = `${destination.toLowerCase().trim()}::${companion.toLowerCase().trim()}::${vibe.toLowerCase().trim()}`;

        // ── Tier 1: Check Server Cache ──────────────────────────────
        const cached = serverDeepDiveCache.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
            return NextResponse.json({ ...cached.data, cached: true });
        }

        // ── Tier 2: Check Curated Knowledge Repository ──────────────
        const destKey = destination.toLowerCase().trim();
        const hasCurated = Object.keys(AUTHENTIC_DESTINATIONS).some(
          k => destKey.includes(k) || k.includes(destKey)
        );

        if (hasCurated) {
            const curatedData = getAuthenticExplorationData(destination, companion, vibe);
            serverDeepDiveCache.set(cacheKey, {
                data: curatedData,
                timestamp: Date.now(),
                expiry: Date.now() + CACHE_TTL_MS,
            });
            return NextResponse.json({ ...curatedData, cached: true, tier: 'curated' });
        }

        // ── Tier 3: Python backend proxy (with short 3.5s timeout) ──
        const baseUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);

            const pythonResponse = await fetch(`${baseUrl}/api/explore/deep-dive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination, companion, vibe }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (pythonResponse.ok) {
                const data = await pythonResponse.json();
                serverDeepDiveCache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                    expiry: Date.now() + CACHE_TTL_MS,
                });
                return NextResponse.json({ ...data, cached: false, tier: 'live-backend' });
            }
        } catch (backendErr) {
            // Python backend down or timed out -> fall through to Tier 4
        }

        // ── Tier 4: Procedural Synthetic Intelligence (0 Gemini Tokens) ─
        const fallbackData = getAuthenticExplorationData(destination, companion, vibe);
        serverDeepDiveCache.set(cacheKey, {
            data: fallbackData,
            timestamp: Date.now(),
            expiry: Date.now() + CACHE_TTL_MS,
        });

        return NextResponse.json({ ...fallbackData, cached: true, tier: 'synthetic' });

    } catch (error: any) {
        console.error('[Explore Deep-Dive API Error]:', error);
        // Guarantee fallback so user never gets broken screen
        const safeDestination = 'India';
        const fallback = getAuthenticExplorationData(safeDestination);
        return NextResponse.json({ ...fallback, cached: true, tier: 'emergency-fallback' });
    }
}
