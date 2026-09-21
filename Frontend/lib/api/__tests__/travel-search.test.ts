import test from 'node:test';
import assert from 'node:assert';
import { searchTrains, searchCabs, searchFlights, searchHotels, getCoordinates } from '../travel-search';
import { CITY_CODES_MAP } from '@/lib/constants/destinations';

test('CITY_MAP coordinate hit avoids Geoapify', async (t) => {
  // We mock fetch globally to ensure it's NOT called.
  const originalFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error("Fetch should not be called");
  };

  try {
    // Delhi exists in CITY_MAP (or rather getDestinationById)
    const coords = await getCoordinates('Delhi', 'mock-key');
    assert.ok(coords);
    assert.strictEqual(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test('Unknown city uses Geoapify geocoding', async (t) => {
  const originalFetch = global.fetch;
  let fetchUrl = '';
  global.fetch = async (url: any) => {
    fetchUrl = url.toString();
    return {
      json: async () => ({
        features: [{ properties: { lat: 10, lon: 20 } }]
      })
    } as any;
  };

  try {
    const coords = await getCoordinates('UnknownCity', 'mock-key');
    assert.ok(coords);
    assert.strictEqual(coords.lat, 10);
    assert.strictEqual(coords.lng, 20);
    assert.ok(fetchUrl.includes('geocode/search'));
  } finally {
    global.fetch = originalFetch;
  }
});

test('Missing GEOAPIFY_API_KEY fails gracefully for geocoding', async (t) => {
  const coords = await getCoordinates('UnknownCityMissingKey', '');
  assert.strictEqual(coords, null);
});

test('searchTrains returns rail_handoff with no fake schedule/fare', async (t) => {
  const result = await searchTrains({ type: 'trains', from: 'Delhi', to: 'Agra', date: '2026-10-10', travelers: 1 });
  assert.strictEqual(result.length, 1);
  const handoff = result[0];
  assert.strictEqual(handoff.type, 'rail_handoff');
  assert.strictEqual(handoff.from, 'Delhi');
  assert.strictEqual(handoff.to, 'Agra');
  assert.strictEqual(handoff.title, 'Check live train availability');
  // ensure no fake data
  assert.strictEqual((handoff as any).number, undefined);
  assert.strictEqual((handoff as any).price, undefined);
});

test('searchCabs explicit non-live fare and Geoapify routing', async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'mock-key';

  global.fetch = async (url: any) => {
    const urlStr = url.toString();
    if (urlStr.includes('geocode')) {
      return { json: async () => ({ features: [{ properties: { lat: 10, lon: 20 } }] }) } as any;
    }
    if (urlStr.includes('routing')) {
      return { json: async () => ({ features: [{ properties: { distance: 50000, time: 3600 } }] }) } as any;
    }
    throw new Error('Unknown url');
  };

  try {
    const result = await searchCabs({ type: 'cabs', from: 'UnknownCity5', to: 'UnknownCity6', date: '2026-10-10', travelers: 1 });
    assert.strictEqual(result.length, 1);
    const handoff = result[0];
    
    assert.strictEqual(handoff.type, 'cab_handoff');
    assert.strictEqual(handoff.fareIsLive, false);
    assert.strictEqual(handoff.estimateSource, 'naviigo_distance_model');
    assert.strictEqual(handoff.distanceKm, 50); // 50000 meters
    assert.strictEqual(handoff.durationMinutes, 60); // 3600 seconds
    assert.ok(handoff.estimatedFareMin);
    assert.ok(handoff.estimatedFareMax);
  } finally {
    global.fetch = originalFetch;
    process.env.GEOAPIFY_API_KEY = originalEnv;
  }
});

test('searchCabs Geoapify routing timeout', async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'mock-key';

  global.fetch = async (url: any, opts: any) => {
    const urlStr = url.toString();
    if (urlStr.includes('geocode')) {
      return { json: async () => ({ features: [{ properties: { lat: 30, lon: 40 } }] }) } as any;
    }
    if (urlStr.includes('routing')) {
      // Simulate timeout
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });
    }
    throw new Error('Unknown url');
  };

  try {
    const result = await searchCabs({ type: 'cabs', from: 'UnknownCity3', to: 'UnknownCity4', date: '2026-10-10', travelers: 1 });
    assert.strictEqual(result.length, 1);
    const handoff = result[0];
    
    assert.strictEqual(handoff.type, 'cab_handoff');
    assert.strictEqual(handoff.distanceKm, null);
    assert.strictEqual(handoff.durationMinutes, null);
    assert.strictEqual(handoff.fareIsLive, false);
  } finally {
    global.fetch = originalFetch;
    process.env.GEOAPIFY_API_KEY = originalEnv;
  }
});

test('searchCabs Geoapify routing HTTP non-200 returns controlled handoff', async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'mock-key';

  global.fetch = async (url: any) => {
    const urlStr = url.toString();
    if (urlStr.includes('geocode')) {
      return { json: async () => ({ features: [{ properties: { lat: 30, lon: 40 } }] }) } as any;
    }
    if (urlStr.includes('routing')) {
      return { status: 500, ok: false } as any; // Simulate error
    }
    throw new Error('Unknown url');
  };

  try {
    const result = await searchCabs({ type: 'cabs', from: 'Non200City', to: 'Non200City2', date: '2026-10-10', travelers: 1 });
    assert.strictEqual(result.length, 1);
    const handoff = result[0];
    assert.strictEqual(handoff.distanceKm, null);
    assert.strictEqual(handoff.fareIsLive, false);
    assert.strictEqual((handoff as any).uberPrice, undefined);
  } finally {
    global.fetch = originalFetch;
    process.env.GEOAPIFY_API_KEY = originalEnv;
  }
});

test('searchCabs Geoapify routing malformed JSON returns controlled handoff', async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'mock-key';

  global.fetch = async (url: any) => {
    const urlStr = url.toString();
    if (urlStr.includes('geocode')) {
      return { json: async () => ({ features: [{ properties: { lat: 30, lon: 40 } }] }) } as any;
    }
    if (urlStr.includes('routing')) {
      return { ok: true, json: async () => ({ unexpected: "data" }) } as any; // Simulate malformed JSON
    }
    throw new Error('Unknown url');
  };

  try {
    const result = await searchCabs({ type: 'cabs', from: 'Malformed', to: 'Malformed2', date: '2026-10-10', travelers: 1 });
    assert.strictEqual(result.length, 1);
    const handoff = result[0];
    assert.strictEqual(handoff.distanceKm, null);
    assert.strictEqual(handoff.fareIsLive, false);
  } finally {
    global.fetch = originalFetch;
    process.env.GEOAPIFY_API_KEY = originalEnv;
  }
});

test('searchCabs repeated request hits cache and does not fetch twice', async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'mock-key';

  let fetchCount = 0;
  global.fetch = async (url: any) => {
    fetchCount++;
    const urlStr = url.toString();
    if (urlStr.includes('geocode')) {
      return { json: async () => ({ features: [{ properties: { lat: 30, lon: 40 } }] }) } as any;
    }
    if (urlStr.includes('routing')) {
      return { ok: true, json: async () => ({ features: [{ properties: { distance: 50000, time: 3600 } }] }) } as any;
    }
    throw new Error('Unknown url');
  };

  try {
    // First call
    const result1 = await searchCabs({ type: 'cabs', from: 'CacheCityA', to: 'CacheCityB', date: '2026-10-10', travelers: 1 });
    const initialFetches = fetchCount;
    // Second call
    const result2 = await searchCabs({ type: 'cabs', from: 'CacheCityA', to: 'CacheCityB', date: '2026-10-10', travelers: 1 });
    
    assert.strictEqual(result1[0].distanceKm, 50);
    assert.strictEqual(result2[0].distanceKm, 50);
    assert.strictEqual(fetchCount, initialFetches); // No new fetches
  } finally {
    global.fetch = originalFetch;
    process.env.GEOAPIFY_API_KEY = originalEnv;
  }
});

// ── Hotel checkout tests ──

test('searchHotels with valid checkout includes check_out_date in SerpApi URL', async (t) => {
  const originalFetch = global.fetch;
  const originalEnv = process.env.SERPAPI_API_KEY;
  process.env.SERPAPI_API_KEY = 'mock-serpapi-key';

  let capturedUrl = '';
  global.fetch = async (url: any) => {
    capturedUrl = url.toString();
    return { json: async () => ({ properties: [] }) } as any;
  };

  try {
    await searchHotels({ type: 'hotels', from: '', to: 'Goa', date: '2026-10-10', checkout: '2026-10-12', travelers: 1 });
    assert.ok(capturedUrl.includes('check_out_date=2026-10-12'), 'SerpApi URL must include check_out_date');
    assert.ok(capturedUrl.includes('check_in_date=2026-10-10'), 'SerpApi URL must include check_in_date');
  } finally {
    global.fetch = originalFetch;
    process.env.SERPAPI_API_KEY = originalEnv;
  }
});

test('searchHotels rejects missing checkout', async (t) => {
  const result = await searchHotels({ type: 'hotels', from: '', to: 'Goa', date: '2026-10-10', travelers: 1 });
  assert.strictEqual(result.length, 0, 'Missing checkout must return empty results');
});

test('searchHotels rejects checkout <= checkin', async (t) => {
  const result = await searchHotels({ type: 'hotels', from: '', to: 'Goa', date: '2026-10-10', checkout: '2026-10-10', travelers: 1 });
  assert.strictEqual(result.length, 0, 'checkout == checkin must return empty results');

  const result2 = await searchHotels({ type: 'hotels', from: '', to: 'Goa', date: '2026-10-10', checkout: '2026-10-09', travelers: 1 });
  assert.strictEqual(result2.length, 0, 'checkout < checkin must return empty results');
});

// ── Unknown train station code tests ──

test('unknown train city returns null station code and generic handoff', async (t) => {
  const result = await searchTrains({ type: 'trains', from: 'Timbuktu', to: 'Atlantis', date: '2026-10-10', travelers: 1 });
  assert.strictEqual(result.length, 1);
  const handoff = result[0];
  assert.strictEqual(handoff.fromStationCode, null, 'Unknown city must not fabricate station code');
  assert.strictEqual(handoff.toStationCode, null, 'Unknown city must not fabricate station code');
  assert.strictEqual(handoff.type, 'rail_handoff');
});

// ── Unknown flight city IATA tests ──

test('unknown flight city does not fabricate IATA code', async (t) => {
  const result = await searchFlights({ type: 'flights', from: 'Timbuktu', to: 'Atlantis', date: '2026-10-10', travelers: 1 });
  assert.strictEqual(result.length, 0, 'Unknown cities must return empty flight results, not fabricated codes');
});
