import test from 'node:test';
import assert from 'node:assert';
import { searchTrains, searchCabs, getCoordinates } from '../travel-search';
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
