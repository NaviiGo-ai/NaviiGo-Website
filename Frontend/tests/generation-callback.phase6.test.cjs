const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { compileModule } = require('./helpers/compile-module.cjs');
const id = 'a925d37b-75d4-4b20-93ad-8cc78f7872d1';

function fixture() {
    const writes = [], cache = new Map();
    let stateIndex = 0;
    const initial = ['generating', { destination: 'jaipur', days: 2, operationId: id }, null, 'unknown', null, null, `owner:alice:${id}`];
    const Loading = () => null, Result = () => null;
    const jsx = (type, props) => ({ type, props });
    const auth = { currentUser: { uid: 'alice' } };
    const resultHelper = compileModule(path.join(__dirname, '../lib/generationResult.ts'), {});
    const api = compileModule(path.join(__dirname, '../app/itinerary/plan/[uuid]/page.tsx'), {
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
        react: {
            useState: () => { const index = stateIndex++; return [initial[index], value => writes.push({ index, value })]; },
            useCallback: callback => callback, useEffect() {}, useLayoutEffect() {}, Suspense: 'suspense',
        },
        'next/navigation': { useParams: () => ({ uuid: id }), useRouter: () => ({ push() {} }), useSearchParams: () => ({ get: () => null }) },
        'framer-motion': { motion: new Proxy({}, { get: (_target, name) => name }), AnimatePresence: 'animate' },
        '@/components/features/itinerary/LoadingScreen': { __esModule: true, default: Loading },
        '@/components/features/itinerary/ResultPage': { __esModule: true, default: Result },
        '@/lib/firestore': { getItineraryByUUID() {}, getOwnerItinerary() {} },
        '@/lib/generationResult': resultHelper,
        '@/lib/firebase': { auth },
        '@/lib/AuthContext': { useAuth: () => ({ user: { uid: 'alice' }, loading: false, signInWithGoogle() {} }) },
        '@/app/itinerary/data': { DEST_DATA: {} },
    }, { sessionStorage: { setItem: (key, value) => cache.set(key, value) } });
    const shell = api.default();
    const view = shell.props.children.type(shell.props.children.props);
    function find(node) {
        if (Array.isArray(node)) return node.map(find).find(Boolean);
        if (!node || typeof node !== 'object') return undefined;
        if (node.type === Loading) return node;
        return find(node.props?.children);
    }
    const loading = find(view);
    assert.ok(loading, 'The actual generation page must expose the LoadingScreen callback.');
    const generatedData = { revisionId: 'rev_0', dayPlans: [{ dayNumber: 9, activities: [{ activityId: 'fort', name: 'Backend-selected fort' }] }] };
    const owner = { id, ownerUid: 'alice', userId: 'alice', isPublic: false, revisionId: 'rev_0', form: { destination: 'jaipur' }, generatedData };
    return { done: loading.props.onDone, writes, cache, auth, owner, generatedData };
}

test('the actual generation completion callback renders and caches the nested authoritative payload', () => {
    const f = fixture(); f.done(f.owner);
    assert.equal(f.writes.find(item => item.index === 2).value, f.generatedData);
    const cached = JSON.parse(f.cache.get(`naviigo_plan_alice_${id}`));
    assert.equal(cached.generatedData.dayPlans[0].activities[0].name, 'Backend-selected fort');
    assert.equal(cached.generatedData.generatedData, undefined);
    assert.equal(f.writes.find(item => item.index === 3).value, 'confirmed-saved');
});

test('a native account change before the completion callback discards the stale envelope', () => {
    const f = fixture(); f.auth.currentUser.uid = 'bob'; f.done(f.owner);
    assert.equal(f.writes.length, 0); assert.equal(f.cache.size, 0);
});

test('foreign or malformed owner envelopes do not become a confirmed saved result', () => {
    for (const value of [{ ownerUid: 'bob' }, { generatedData: null }]) {
        const f = fixture(); f.done({ ...f.owner, ...value });
        assert.equal(f.writes.some(item => item.value === 'confirmed-saved'), false);
        assert.equal(f.writes.find(item => item.index === 0).value, 'error');
        assert.equal(f.cache.size, 0);
    }
});
