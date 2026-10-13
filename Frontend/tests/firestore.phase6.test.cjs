/* Native Node regression tests against the actual TypeScript helpers. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileModule } = require('./helpers/compile-module.cjs');

function fixture() {
    const records = new Map();
    const operations = [];
    const auth = { currentUser: { uid: 'alice' } };
    const controls = { readError: false, writeError: false, transactionError: false, afterRead: null };
    const ref = (_db, ...parts) => ({ key: parts.join('/') });
    const snapshot = key => ({ id: key.split('/').at(-1), exists: () => records.has(key), data: () => records.get(key) });
    const getDoc = async reference => {
        if (controls.readError) throw new Error('Read unavailable');
        const value = snapshot(reference.key);
        if (controls.afterRead) { const callback = controls.afterRead; controls.afterRead = null; callback(); }
        return value;
    };
    let transactionTail = Promise.resolve();
    const firestore = {
        doc: ref, collection: ref, getDoc,
        query: reference => reference, orderBy: () => ({}), limit: () => ({}),
        getDocs: async reference => {
            if (controls.readError) throw new Error('Read unavailable');
            return { docs: [...records.keys()].filter(key => key.startsWith(reference.key + '/') && key.split('/').length === reference.key.split('/').length + 1).map(snapshot) };
        },
        setDoc: async (reference, data, options) => {
            if (controls.writeError) throw new Error('Write unavailable');
            records.set(reference.key, { ...(options?.merge ? records.get(reference.key) : {}), ...data });
            operations.push(['set', reference.key]);
        },
        updateDoc: async (reference, data) => { records.set(reference.key, { ...records.get(reference.key), ...data }); operations.push(['update', reference.key]); },
        deleteDoc: async reference => { records.delete(reference.key); operations.push(['delete', reference.key]); },
        serverTimestamp: () => 1,
        increment: value => value,
        runTransaction: (_db, callback) => {
            const run = transactionTail.then(async () => {
                const writes = [];
                const transaction = {
                    get: getDoc,
                    set: (reference, data) => writes.push(['set', reference.key, data]),
                    update: (reference, data) => writes.push(['update', reference.key, data]),
                    delete: reference => writes.push(['delete', reference.key]),
                };
                const result = await callback(transaction);
                if (controls.transactionError) throw new Error('Transaction unavailable');
                for (const [operation, key, data] of writes) {
                    if (operation === 'delete') records.delete(key);
                    else records.set(key, { ...(operation === 'update' ? records.get(key) : {}), ...data });
                    operations.push([operation, key]);
                }
                return result;
            });
            transactionTail = run.catch(() => {});
            return run;
        },
        Timestamp: { now: () => 1 },
    };
    const api = compileModule(path.join(__dirname, '../lib/firestore.ts'), {
        './firebase': { auth, db: {} }, 'firebase/firestore': firestore,
    });
    const owner = {
        userId: 'alice', destId: 'jaipur', destName: 'Jaipur',
        form: { destination: 'jaipur', destName: 'Jaipur', days: 2, interests: ['private'], email: 'private@example.test' },
        generatedData: {
            privateNotes: 'private',
            mapCenter: { lat: 26.9, lng: 75.8, userId: 'private' },
            dayPlans: [{ dayNumber: 9, activities: [{ activityId: 'activity-1', name: 'Fort', bookingRef: 'private', location: { name: 'Fort', privateNotes: 'private' } }] }],
        },
        status: 'completed', revisionId: 'rev_1',
    };
    records.set('users/alice/itineraries/trip-1', owner);
    return { api, records, operations, auth, controls, owner };
}

test('private owner detail reads only the owner path and preserves lifecycle', async () => {
    const f = fixture();
    const data = await f.api.getOwnerItinerary('alice', 'trip-1');
    assert.equal(data.status, 'completed');
    assert.equal(data.userId, 'alice');
    assert.equal(data.isPublic, false);
    f.records.set('itineraries/other', { shareProjection: true, isPublic: true });
    assert.equal(await f.api.getOwnerItinerary('alice', 'other'), null);
});

test('generation replays verify historical saved receipts while retaining the current owner revision', async () => {
    const f = fixture(); const owner = await f.api.getOwnerItinerary('alice', 'trip-1');
    const receipt = { status: 'committed', ownerUid: 'alice', itineraryId: 'trip-1', operationId: 'trip-1', revisionId: 'rev_0' };
    owner.receipt = receipt;
    assert.equal(f.api.confirmsGenerationReceipt(owner, receipt), true);
    assert.equal(owner.revisionId, 'rev_1');
    assert.equal(f.api.confirmsGenerationReceipt(owner, { ...receipt, ownerUid: 'bob' }), false);
    delete owner.receipt;
    assert.equal(f.api.confirmsGenerationReceipt(owner, receipt), false);
});

test('account switches and mismatched metadata reject owner results', async () => {
    const f = fixture();
    f.controls.afterRead = () => { f.auth.currentUser = { uid: 'bob' }; };
    await assert.rejects(f.api.getOwnerItinerary('alice', 'trip-1'), /account changed/);
    f.auth.currentUser = { uid: 'alice' };
    f.records.set('users/alice/itineraries/trip-1', { ...f.owner, ownerUid: 'bob' });
    await assert.rejects(f.api.getOwnerItinerary('alice', 'trip-1'), /mismatched ownership/);
});

test('history retains distinct operations with identical destinations and dates without deleting', async () => {
    const f = fixture();
    f.records.set('users/alice/itineraries/trip-2', { ...f.owner });
    const items = await f.api.getUserItineraries('alice');
    assert.equal(items.length, 2);
    assert.equal(f.records.size, 2);
    assert.equal(f.operations.length, 0);
    assert.equal(items[0].status, 'completed');
});

test('history transport failures remain errors rather than authoritative empty history', async () => {
    const f = fixture(); f.controls.readError = true;
    await assert.rejects(f.api.getUserItineraries('alice'), /unavailable/);
});

test('terminal and missing itineraries cannot be restarted or created by start', async () => {
    const f = fixture();
    await assert.rejects(f.api.setActiveItinerary('alice', 'trip-1'), /cannot be restarted/);
    await assert.rejects(f.api.setActiveItinerary('alice', 'missing'), /saved itinerary/);
    assert.equal(f.operations.length, 0);
});

test('starting preserves another active journey and propagates transaction failure', async () => {
    const f = fixture();
    f.owner.status = 'planned';
    f.records.set('users/alice/itineraries/other', { ...f.owner, status: 'active', isActive: true });
    await assert.rejects(f.api.setActiveItinerary('alice', 'trip-1'), /other active journey/);
    assert.equal(f.operations.length, 0);
    f.records.delete('users/alice/itineraries/other'); f.controls.transactionError = true;
    await assert.rejects(f.api.setActiveItinerary('alice', 'trip-1'), /unavailable/);
    assert.equal(f.owner.status, 'planned');
});

test('Passport read failures are surfaced and account switches discard stats', async () => {
    const f = fixture(); f.controls.readError = true;
    await assert.rejects(f.api.getPassportStamps('alice'), /unavailable/);
    f.controls.readError = false;
    f.controls.afterRead = () => { f.auth.currentUser = { uid: 'bob' }; };
    await assert.rejects(f.api.getPassportStats('alice'), /account changed/);
});

test('ending a journey is atomic, terminal, and does not restart on retry', async () => {
    const f = fixture(); f.owner.status = 'active'; f.owner.isActive = true;
    f.records.set('users/alice/tracking/trip-1', { isActive: true });
    f.controls.transactionError = true;
    await assert.rejects(f.api.cancelActiveItinerary('alice', 'trip-1'), /unavailable/);
    assert.equal(f.records.get('users/alice/itineraries/trip-1').status, 'active');
    f.controls.transactionError = false;
    await f.api.cancelActiveItinerary('alice', 'trip-1');
    await f.api.cancelActiveItinerary('alice', 'trip-1');
    assert.equal(f.records.get('users/alice/itineraries/trip-1').status, 'cancelled');
    assert.equal(f.records.get('users/alice/tracking/trip-1').isActive, false);
    await assert.rejects(f.api.setActiveItinerary('alice', 'trip-1'), /cannot be restarted/);
});

test('failed private saves throw and never fabricate saved IDs', async () => {
    const f = fixture(); f.controls.writeError = true;
    await assert.rejects(f.api.saveItineraryToFirestore('alice', { id: 'operation-1', destId: 'jaipur', destName: 'Jaipur', form: {}, generatedData: {} }), /unavailable/);
    assert.equal(f.records.has('users/alice/itineraries/operation-1'), false);
});

test('separate intentional saves stay separate and never create public copies', async () => {
    const f = fixture();
    const input = { destId: 'jaipur', destName: 'Jaipur', form: { startDate: '2026-11-01' }, generatedData: {} };
    const [first, second] = await Promise.all([f.api.saveItineraryToFirestore('alice', input), f.api.saveItineraryToFirestore('alice', input)]);
    assert.notEqual(first, second);
    assert.equal([...f.records.keys()].filter(key => key.startsWith('itineraries/')).length, 0);
});

test('sharing uses the saved owner plan and removes private fields at nested boundaries', async () => {
    const f = fixture();
    assert.equal(await f.api.createPublicShare('alice', 'share-one', { form: {}, generatedData: { privateNotes: 'forged preview' }, destName: 'Forged preview' }, 'trip-1'), 'share-one');
    const projection = f.records.get('itineraries/share-one');
    assert.equal(projection.destName, 'Jaipur');
    assert.equal(projection.form.interests, undefined);
    assert.equal(projection.form.email, undefined);
    assert.equal(projection.generatedData.privateNotes, undefined);
    assert.equal(projection.generatedData.mapCenter.userId, undefined);
    assert.equal(projection.generatedData.dayPlans[0].activities[0].bookingRef, undefined);
    assert.equal(projection.generatedData.dayPlans[0].activities[0].location.privateNotes, undefined);
    assert.equal(f.records.get('users/alice/itineraries/trip-1').publicShareId, 'share-one');
});

test('concurrent share requests reuse the acknowledged owner link', async () => {
    const f = fixture(); const input = { form: {}, generatedData: {}, destName: 'Jaipur' };
    const ids = await Promise.all([f.api.createPublicShare('alice', 'share-one', input, 'trip-1'), f.api.createPublicShare('alice', 'share-two', input, 'trip-1')]);
    assert.equal(ids[0], ids[1]);
    assert.equal([...f.records.keys()].filter(key => key.startsWith('itineraries/')).length, 1);
});

test('sharing rejects missing owner records and another user’s existing projection', async () => {
    const f = fixture(); const input = { form: {}, generatedData: {}, destName: 'Jaipur' };
    await assert.rejects(f.api.createPublicShare('alice', 'share-one', input, 'missing'), /Save the owner/);
    f.records.set('itineraries/share-one', { ownerUid: 'bob', shareProjection: true });
    await assert.rejects(f.api.createPublicShare('alice', 'share-one', input, 'trip-1'), /do not own/);
});

test('a failed unshare leaves the acknowledged public link and owner binding intact', async () => {
    const f = fixture();
    await f.api.createPublicShare('alice', 'share-one', { form: {}, generatedData: {}, destName: 'Jaipur' }, 'trip-1');
    f.controls.transactionError = true;
    await assert.rejects(f.api.unsharePublicShare('alice', 'share-one', 'trip-1'), /unavailable/);
    assert.equal(f.records.has('itineraries/share-one'), true);
    assert.equal(f.records.get('users/alice/itineraries/trip-1').publicShareId, 'share-one');
});

test('successful unshare clears the projection and private link atomically', async () => {
    const f = fixture();
    await f.api.createPublicShare('alice', 'share-one', { form: {}, generatedData: {}, destName: 'Jaipur' }, 'trip-1');
    await f.api.unsharePublicShare('alice', 'share-one', 'trip-1');
    assert.equal(f.records.has('itineraries/share-one'), false);
    assert.equal(f.records.get('users/alice/itineraries/trip-1').publicShareId, null);
});

test('account changes during share reads never dispatch public writes', async () => {
    const f = fixture(); f.controls.afterRead = () => { f.auth.currentUser = { uid: 'bob' }; };
    await assert.rejects(f.api.createPublicShare('alice', 'share-one', { form: {}, generatedData: {}, destName: 'Jaipur' }, 'trip-1'), /account changed/);
    assert.equal(f.records.has('itineraries/share-one'), false);
});
