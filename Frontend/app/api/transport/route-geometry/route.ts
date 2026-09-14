import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RoutePoint {
  lat: number;
  lng: number;
}

/**
 * Calculates spherical distance between two points in meters.
 */
function haversineDistance(p1: RoutePoint, p2: RoutePoint): number {
  const R = 6371e3; // metres
  const phi1 = (p1.lat * Math.PI) / 180;
  const phi2 = (p2.lat * Math.PI) / 180;
  const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * GET /api/transport/route-geometry
 * Server-side route calculation proxy to eliminate OSRM demo server browser warnings & CORS issues.
 * Query params:
 *   coords: semicolon-separated "lng,lat" pairs, e.g. "77.59,12.97;77.60,12.98"
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const coordsParam = searchParams.get('coords');

  if (!coordsParam) {
    return NextResponse.json({ error: 'Missing coords parameter' }, { status: 400 });
  }

  // Parse points
  const pairs = coordsParam.split(';').map((p) => {
    const [lng, lat] = p.split(',').map(Number);
    return { lng, lat };
  });

  if (pairs.some((p) => isNaN(p.lat) || isNaN(p.lng))) {
    return NextResponse.json({ error: 'Invalid coordinate format' }, { status: 400 });
  }

  // Attempt OSRM driving route server-to-server
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(osrmUrl, {
      headers: {
        'User-Agent': 'NaviiGo/1.0 (travel-app; contact@naviigo.com)',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // GeoJSON coordinates are [lng, lat], Leaflet wants [lat, lng]
        const latLngs: [number, number][] = (route.geometry.coordinates || []).map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        const distanceM = route.distance || 0;
        const durationS = route.duration || 0;

        const distanceStr =
          distanceM > 1000
            ? `${(distanceM / 1000).toFixed(1)} km`
            : `${Math.round(distanceM)} m`;

        const timeStr =
          durationS > 3600
            ? `${Math.floor(durationS / 3600)} hr ${Math.round((durationS % 3600) / 60)} min`
            : `${Math.max(1, Math.round(durationS / 60))} min`;

        return NextResponse.json({
          success: true,
          type: 'road',
          coordinates: latLngs,
          distance: distanceStr,
          time: timeStr,
        });
      }
    }
  } catch (err) {
    // Fall back smoothly to straight-line interpolation
    console.warn('[RouteGeometry] OSRM query failed, falling back to geodesic straight-line:', err);
  }

  // Fallback straight line coordinates & distance
  let totalDistanceM = 0;
  for (let i = 0; i < pairs.length - 1; i++) {
    totalDistanceM += haversineDistance(pairs[i], pairs[i + 1]);
  }

  const estDurationMin = Math.max(1, Math.round((totalDistanceM / 1000 / 35) * 60)); // 35 km/h avg
  const fallbackCoords: [number, number][] = pairs.map((p) => [p.lat, p.lng]);

  return NextResponse.json({
    success: true,
    type: 'direct',
    coordinates: fallbackCoords,
    distance:
      totalDistanceM > 1000
        ? `${(totalDistanceM / 1000).toFixed(1)} km (est)`
        : `${Math.round(totalDistanceM)} m (est)`,
    time: estDurationMin > 60
      ? `${Math.floor(estDurationMin / 60)} hr ${estDurationMin % 60} min`
      : `${estDurationMin} min`,
  });
}
