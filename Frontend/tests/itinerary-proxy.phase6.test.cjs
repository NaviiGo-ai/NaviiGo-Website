/* Test the real Next.js handler with a synthetic backend. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileModule } = require('./helpers/compile-module.cjs');

const operationId = 'a925d37b-75d4-4b20-93ad-8cc78f7872d1';
function fixture(backend = null, fetchError = false) {
    const next = { NextResponse: { json: (body, init) => Response.json(body, init) } };
    const validation = compileModule(path.join(__dirname, '../lib/validation.ts'), { 'next/server': next });
    const forwarded = [];
    const receipt = { success: true, userId: 'alice', itinerary: { id: operationId, userId: 'alice' }, persistence: { status: 'saved', durable: true, replayed: false }, receipt: { operationId, itineraryId: operationId, ownerUid: 'alice', revisionId: 'rev_0', status: 'committed' } };
    const api = compileModule(path.join(__dirname, '../app/api/itinerary/generate/route.ts'), {
        'next/server': next,
        '@/lib/validation': validation,
        '@/lib/rateLimit': { applyRateLimit: () => null, getProxyHeaders: () => ({ 'Content-Type': 'application/json' }) },
    }, {
        process: { env: { NODE_ENV: 'test' } },
        fetch: async (url, init) => {
            forwarded.push({ url, init, body: JSON.parse(init.body) });
            if (fetchError) throw new Error('Synthetic timeout');
            return backend || Response.json(receipt);
        },
    });
    const input = { operationId, destination: 'jaipur', days: 2, budget: 0, preferences: {}, browsingSignals: {}, mustDo: [], routeStops: [], arrivalTime: null, hotelArea: '', group: null };
    const request = (body = input, headers = {}) => new Request('http://localhost/api/itinerary/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer synthetic-test-token', ...headers }, body: JSON.stringify(body) });
    return { api, input, request, forwarded, receipt };
}

test('generation forwards one operation identity and preserves supported zero/null/empty inputs', async () => {
    const f = fixture();
    const response = await f.api.POST(f.request({ ...f.input, userId: 'malicious-owner' }));
    assert.equal(response.status, 200);
    assert.equal(f.forwarded.length, 1);
    const forwarded = f.forwarded[0];
    assert.equal(forwarded.body.operationId, operationId);
    assert.equal(forwarded.init.headers['Idempotency-Key'], operationId);
    assert.equal(forwarded.body.budget, 0);
    assert.equal(forwarded.body.arrivalTime, null);
    assert.equal(forwarded.body.hotelArea, '');
    assert.equal(forwarded.body.userId, undefined);
    assert.deepEqual(forwarded.body.preferences, {});
    assert.deepEqual(forwarded.body.mustDo, []);
});

test('absent optional inputs remain absent', async () => {
    const f = fixture(); await f.api.POST(f.request({ operationId, destination: 'jaipur', days: 2, budget: 0 }));
    assert.equal('group' in f.forwarded[0].body, false);
    assert.equal('preferences' in f.forwarded[0].body, false);
    assert.equal('arrivalTime' in f.forwarded[0].body, false);
});

test('missing authentication and conflicting operation IDs fail before generation', async () => {
    const f = fixture();
    assert.equal((await f.api.POST(f.request(f.input, { Authorization: '' }))).status, 401);
    assert.equal((await f.api.POST(f.request(f.input, { 'Idempotency-Key': 'c8829dbd-c928-4ab9-95f5-4f6e87a9a7f2' }))).status, 400);
    assert.equal(f.forwarded.length, 0);
});

test('a successful preview without a durable receipt stays explicitly unsaved', async () => {
    const f = fixture(Response.json({ success: true, itinerary: { id: operationId } }));
    const response = await f.api.POST(f.request());
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.persistence.durable, false);
});

test('a mismatched receipt or response owner is rejected', async () => {
    const f = fixture();
    const bad = { ...f.receipt, userId: 'bob' };
    const other = fixture(Response.json(bad));
    assert.equal((await other.api.POST(other.request())).status, 502);
});

test('backend conflicts preserve their meaningful status and code', async () => {
    const f = fixture(Response.json({ code: 'IDEMPOTENCY_CONFLICT', detail: 'The operation belongs to a different request.' }, { status: 409 }));
    const response = await f.api.POST(f.request());
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, 'IDEMPOTENCY_CONFLICT');
});

test('provider failures do not expose raw internal details', async () => {
    const f = fixture(Response.json({ error: 'synthetic-secret-marker', code: 'PROVIDER_UNAVAILABLE' }, { status: 503 }));
    const response = await f.api.POST(f.request());
    assert.equal(response.status, 503);
    assert.equal((await response.text()).includes('synthetic-secret-marker'), false);
});

test('transport failures report ambiguity without fabricating a saved receipt', async () => {
    const f = fixture(null, true);
    const response = await f.api.POST(f.request());
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.persistence.status, 'ambiguous');
    assert.equal(body.receipt, undefined);
});
