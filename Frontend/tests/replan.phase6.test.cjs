const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileModule } = require('./helpers/compile-module.cjs');
const op = 'a925d37b-75d4-4b20-93ad-8cc78f7872d1';
const proposal = { proposalId: op, itineraryId: 'trip', ownerUid: 'alice', operationId: op, baseRevisionId: 'rev_0', currentDayNumber: 9, summary: 'Rest', actions: [] };
const input = { itineraryId: 'trip', operationId: op, baseRevisionId: 'rev_0', currentDayNumber: 9, currentTime: '14:30', destinationTimezone: 'Asia/Kolkata', reason: 'I_AM_TIRED', completedActivityIds: ['done'], skippedActivityIds: [] };
function clientFixture() {
    const calls = [];
    const controls = { fail: false, tokenSwitch: false, responseSwitch: false, mismatchedToken: false, wrongReceipt: false, readSwitch: false };
    const auth = { currentUser: { uid: 'alice', getIdTokenResult: async () => {
        if (controls.tokenSwitch) auth.currentUser = { uid: 'bob' };
        return { token: 'synthetic-token', claims: { sub: controls.mismatchedToken ? 'bob' : 'alice' } };
    } } };
    let owner = { ownerUid: 'alice', userId: 'alice', id: 'trip', revisionId: 'rev_1', status: 'active', generatedData: { dayPlans: [] } };
    const receipt = { status: 'accepted', ownerUid: 'alice', itineraryId: 'trip', proposalId: op, operationId: op, previousRevisionId: 'rev_0', revisionId: 'rev_1' };
    owner.generatedData.revisionId = 'rev_1'; owner.acceptanceReceipts = { [op]: receipt };
    const api = compileModule(path.join(__dirname, '../lib/replanClient.ts'), {
        './firebase': { auth }, './firestore': { getOwnerItinerary: async () => { if (controls.readSwitch) auth.currentUser = { uid: 'bob' }; return owner; } },
    }, { fetch: async (url, init) => {
        calls.push({ url, body: JSON.parse(init.body) });
        if (controls.fail) throw new Error('connection lost after commit');
        if (controls.responseSwitch) auth.currentUser = { uid: 'bob' };
        return Response.json(url.endsWith('/accept') ? { success: true, receipt: { ...receipt, ...(controls.wrongReceipt ? { ownerUid: 'bob' } : {}) } } : { success: true, proposal });
    } });
    return { api, controls, calls, auth, receipt, setOwner: value => { owner = value; } };
}
test('replan uses the real display day and immutable progress IDs', () => {
    const f = clientFixture();
    const progress = f.api.replanProgress({ dayPlans: [{ dayNumber: 9, activities: [{ activityId: 'done', name: 'Duplicate name', status: 'completed' }, { activityId: 'skip', name: 'Duplicate name', status: 'skipped' }] }] });
    assert.deepEqual(JSON.parse(JSON.stringify(progress)), { completedActivityIds: ['done'], skippedActivityIds: ['skip'] });
    assert.throws(() => f.api.replanProgress({ dayPlans: [{ activities: [{ name: 'Legacy' }] }] }), /missing or repeated/);
    assert.throws(() => f.api.replanProgress({ dayPlans: [{ activities: [{ activityId: 'same' }, { activityId: 'same' }] }] }), /missing or repeated/);
});
test('account/token changes before send never submit another owner request', async () => {
    for (const flag of ['tokenSwitch', 'mismatchedToken']) {
        const f = clientFixture(); f.controls[flag] = true;
        await assert.rejects(f.api.requestReplan('alice', input)); assert.equal(f.calls.length, 0);
    }
});
test('account switches after response and owner refresh discard stale results', async () => {
    const f = clientFixture(); f.controls.responseSwitch = true;
    await assert.rejects(f.api.requestReplan('alice', input), /account changed/);
    const g = clientFixture(); g.controls.readSwitch = true;
    await assert.rejects(g.api.acceptReplan('alice', proposal, op), /account changed/);
});
test('acceptance sends only saved proposal identity and requires acknowledged owner revision', async () => {
    const f = clientFixture(); const owner = await f.api.acceptReplan('alice', proposal, op);
    assert.equal(owner.revisionId, 'rev_1');
    assert.deepEqual(f.calls[0].body, { itineraryId: 'trip', proposalId: op, baseRevisionId: 'rev_0', operationId: op });
    f.setOwner({ revisionId: 'rev_2' });
    await assert.rejects(f.api.acceptReplan('alice', proposal, op), /latest itinerary/);
});
test('ambiguous acceptance retries the same operation and rejects mismatched receipt', async () => {
    const f = clientFixture(); f.controls.fail = true;
    await assert.rejects(f.api.acceptReplan('alice', proposal, op), /unconfirmed/);
    f.controls.fail = false; await f.api.acceptReplan('alice', proposal, op);
    assert.equal(f.calls[0].body.operationId, f.calls[1].body.operationId);
    f.controls.wrongReceipt = true; await assert.rejects(f.api.acceptReplan('alice', proposal, op), /could not be confirmed/);
});

test('historical acceptance replays confirm their saved receipt and render a later owner revision', async () => {
    const f = clientFixture();
    f.setOwner({ revisionId: 'rev_2', generatedData: { revisionId: 'rev_2', dayPlans: [] }, acceptanceReceipts: { [op]: f.receipt } });
    assert.equal((await f.api.acceptReplan('alice', proposal, op)).revisionId, 'rev_2');
});
test('terminal journeys are read-only and nonsequential day numbers retain their identity', () => {
    const f = clientFixture();
    for (const status of ['completed', 'cancelled', 'canceled']) assert.throws(() => f.api.canChangeItinerary({ status }), /journey has ended/);
    const ids = compileModule(path.join(__dirname, '../lib/itineraryIdentity.ts'), {});
    assert.equal(ids.itineraryDayIndex([{ dayNumber: 3 }, { dayNumber: 9 }], 9), 1);
    assert.equal(ids.itineraryDayNumber({ dayNumber: 9 }, 1), 9);
    assert.equal(ids.itineraryDayIndex([{ dayNumber: 3 }, { dayNumber: 9 }], 2), -1);
});
function proxyFixture(response) {
    const calls = [];
    const api = compileModule(path.join(__dirname, '../lib/replanProxy.ts'), {
        'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
        './rateLimit': { applyRateLimit: () => null, getProxyHeaders: () => ({}) },
    }, { process: { env: { NODE_ENV: 'test' } }, fetch: async (url, init) => { calls.push({ url, body: JSON.parse(init.body), headers: init.headers }); return response; } });
    const request = (body, headers = {}) => new Request('http://localhost/api/replan', { method: 'POST', headers: { Authorization: 'Bearer synthetic-token', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
    return { api, calls, request };
}
test('replan proxy strips caller ownership and proposal bodies while preserving operation/day identity', async () => {
    const f = proxyFixture(Response.json({ success: true, proposal }));
    assert.equal((await f.api.proxyReplan(f.request({ ...input, userId: 'bob', proposalData: { actions: ['forged'] } }), false)).status, 200);
    assert.equal(f.calls[0].body.currentDayNumber, 9); assert.equal(f.calls[0].body.userId, undefined); assert.equal(f.calls[0].body.proposalData, undefined);
    assert.equal(f.calls[0].headers['Idempotency-Key'], op);
});
test('accept proxy sends exactly identity fields and rejects unconfirmed backend success', async () => {
    const f = proxyFixture(Response.json({ success: true }));
    assert.equal((await f.api.proxyReplan(f.request({ ...input, proposalId: op, proposalData: { forged: true } }), true)).status, 502);
    assert.deepEqual(Object.keys(f.calls[0].body).sort(), ['baseRevisionId', 'itineraryId', 'operationId', 'proposalId']);
});
test('replan proxy rejects missing auth, invalid times, and conflicting operations before send', async () => {
    const f = proxyFixture(Response.json({ success: true, proposal }));
    assert.equal((await f.api.proxyReplan(f.request(input, { Authorization: '' }), false)).status, 401);
    assert.equal((await f.api.proxyReplan(f.request({ ...input, currentTime: '99:00' }), false)).status, 400);
    assert.equal((await f.api.proxyReplan(f.request(input, { 'Idempotency-Key': 'other' }), false)).status, 400);
    assert.equal(f.calls.length, 0);
});
