/* Official Firebase emulator integration tests. */
const { before, beforeEach, after, test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');

let environment;
before(async () => {
    const host = process.env.FIRESTORE_EMULATOR_HOST;
    if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('A loopback Firestore emulator is required; never run against production.');
    const [hostname, port] = host.split(':');
    environment = await initializeTestEnvironment({ projectId: 'demo-naviigo-phase6', firestore: { host: hostname, port: Number(port), rules: fs.readFileSync(path.join(__dirname, '../firestore.rules'), 'utf8') } });
});
beforeEach(async () => { await environment.clearFirestore(); });
after(async () => { if (environment) await environment.cleanup(); });
const db = uid => uid ? environment.authenticatedContext(uid).firestore() : environment.unauthenticatedContext().firestore();
const projection = (ownerUid = 'alice') => ({ shareId: 'share-one', shareProjection: true, isPublic: true, ownerUid, form: { destination: 'jaipur', days: 2 }, generatedData: { dayPlans: [] }, destName: 'Jaipur', createdAt: new Date(), updatedAt: new Date() });
const seed = async (record, document = 'itineraries/share-one') => environment.withSecurityRulesDisabled(async context => { await context.firestore().doc(document).set(record); });

test('owner private itineraries, preferences and Passport remain owner-only', async () => {
    for (const document of ['users/alice/itineraries/trip-one', 'users/alice/preferences/main', 'users/alice/passport/stats', 'users/alice/passport/stamps/entries/stamp-one']) {
        await assertSucceeds(db('alice').doc(document).set({ private: true }));
        await assertSucceeds(db('alice').doc(document).get());
        await assertFails(db('bob').doc(document).get());
        await assertFails(db().doc(document).get());
        await assertFails(db('bob').doc(document).set({ private: false }));
    }
});

test('authenticated creators can read a missing share ID before their transaction', async () => {
    await assertSucceeds(db('alice').doc('itineraries/share-one').get());
    await assertFails(db().doc('itineraries/share-one').get());
});

test('persisted proposals are readable only by their owner and writable only by the backend', async () => {
    const document = 'users/alice/itineraries/trip-one/proposals/proposal-one';
    await seed({ ownerUid: 'alice', actions: [] }, document);
    await assertSucceeds(db('alice').doc(document).get());
    await assertFails(db('bob').doc(document).get());
    await assertFails(db('alice').doc(document).set({ ownerUid: 'alice', actions: ['forged'] }));
    await assertFails(db('alice').doc(document).delete());
});

test('malformed legacy documents with projection flags still cannot expose private metadata', async () => {
    await seed({ ...projection(), bookingReference: 'private' });
    await assertFails(db().doc('itineraries/share-one').get());
});

test('an explicit owner projection is public and can be updated by that owner', async () => {
    await assertSucceeds(db('alice').doc('itineraries/share-one').set(projection()));
    await assertSucceeds(db().doc('itineraries/share-one').get());
    await assertSucceeds(db('alice').doc('itineraries/share-one').update({ destName: 'Updated Jaipur' }));
});

test('another user cannot take ownership by changing the incoming ownerUid', async () => {
    await seed(projection());
    await assertFails(db('bob').doc('itineraries/share-one').set(projection('bob')));
    await assertFails(db('bob').doc('itineraries/share-one').update({ ownerUid: 'bob' }));
});

test('the creator cannot transfer ownership or change the share identity', async () => {
    await seed(projection());
    await assertFails(db('alice').doc('itineraries/share-one').update({ ownerUid: 'bob' }));
    await assertFails(db('alice').doc('itineraries/share-one').update({ shareId: 'other' }));
});

test('anonymous writes and unscoped collaborator mutations are denied', async () => {
    await assertFails(db().doc('itineraries/share-one').set(projection()));
    await seed(projection());
    await assertFails(db().doc('itineraries/share-one').update({ destName: 'Changed' }));
    await assertFails(db('bob').doc('itineraries/share-one').update({ collaborators: 2 }));
    await assertFails(db('bob').doc('itineraries/share-one').update({ destName: 'Changed' }));
});

test('raw private form and generated metadata cannot be published', async () => {
    await assertFails(db('alice').doc('itineraries/share-one').set({ ...projection(), form: { preferences: { accessibilityNeeds: ['private'] } } }));
    await assertFails(db('alice').doc('itineraries/share-one').set({ ...projection(), generatedData: { privateNotes: 'private' } }));
    await assertFails(db('alice').doc('itineraries/share-one').set({ ...projection(), bookingReference: 'private' }));
});

test('ownerless legacy public records and private root records fail closed', async () => {
    await seed({ isPublic: true, form: {}, generatedData: {} });
    await assertFails(db().doc('itineraries/share-one').get());
    await assertFails(db('bob').doc('itineraries/share-one').update({ ownerUid: 'bob', shareProjection: true }));
    await seed({ ...projection(), isPublic: false });
    await assertFails(db().doc('itineraries/share-one').get());
});

test('unshare deletes only an owner projection and removes anonymous access', async () => {
    await seed(projection());
    await assertFails(db('bob').doc('itineraries/share-one').delete());
    await assertSucceeds(db('alice').doc('itineraries/share-one').delete());
    await assertFails(db().doc('itineraries/share-one').get());
});
