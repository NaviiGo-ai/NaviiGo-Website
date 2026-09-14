import { NextResponse } from 'next/server';
import { OSM_CONFIG, verifyOsmCredentials, getOsmAuthUrl } from '@/lib/osm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/osm/verify
 * Live verification of OpenStreetMap OAuth 2.0 credentials & Nominatim geocoding.
 */
export async function GET() {
  try {
    const credVerification = await verifyOsmCredentials();

    // Also run a lightweight connectivity check to Nominatim
    let nominatimStatus = 'unknown';
    let samplePlace = null;
    try {
      const geoUrl = `${OSM_CONFIG.nominatimBase}/search?q=Delhi&format=json&limit=1`;
      const res = await fetch(geoUrl, {
        headers: { 'User-Agent': OSM_CONFIG.userAgent },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        nominatimStatus = 'connected';
        if (data && data[0]) {
          samplePlace = {
            name: data[0].display_name?.split(',')[0],
            lat: data[0].lat,
            lon: data[0].lon,
          };
        }
      } else {
        nominatimStatus = `HTTP ${res.status}`;
      }
    } catch (e: any) {
      nominatimStatus = `error: ${e.message}`;
    }

    let sampleAuthUrl = '';
    try {
      sampleAuthUrl = getOsmAuthUrl({
        redirectUri: 'http://localhost:3000/api/osm/callback',
        scopes: ['read_prefs'],
      });
    } catch {
      sampleAuthUrl = 'unavailable';
    }

    const payload = {
      success: credVerification.valid,
      service: 'OpenStreetMap (OSM)',
      credentials: {
        configured: Boolean(OSM_CONFIG.clientId && OSM_CONFIG.clientSecret),
        clientIdPreview: credVerification.clientIdPreview,
        verificationStatus: credVerification.valid ? 'VERIFIED_ACTIVE' : 'FAILED',
        message: credVerification.message,
      },
      endpoints: {
        authorize: OSM_CONFIG.authorizeUrl,
        token: OSM_CONFIG.tokenUrl,
        apiBase: OSM_CONFIG.apiBase,
        nominatim: OSM_CONFIG.nominatimBase,
      },
      sampleAuthUrl,
      nominatim: {
        status: nominatimStatus,
        samplePlace,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      status: credVerification.valid ? 200 : 500,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
