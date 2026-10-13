'use client';
import { useEffect, useState, useCallback, useLayoutEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/features/itinerary/LoadingScreen';
import ResultPage from '@/components/features/itinerary/ResultPage';
import { getItineraryByUUID, getOwnerItinerary } from '@/lib/firestore';
import { useAuth } from '@/lib/AuthContext';


import { DEST_DATA } from '@/app/itinerary/data';

/**
 * /itinerary/plan/[uuid]
 *
 * Each generated itinerary has a unique UUID URL.
 * Owner detail pages read only users/{uid}/itineraries/{uuid}. Public data is
 * available only when the URL explicitly identifies a share projection.
 */
function ItineraryUUIDContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading, signInWithGoogle } = useAuth();
    const rawUuid = (params?.uuid as string) ?? '';
    const uuid = decodeURIComponent(rawUuid).trim().replace(/\s+/g, '-').toLowerCase();

    const [phase, setPhase] = useState<'loading-data' | 'generating' | 'result' | 'not-found' | 'access-denied' | 'error'>('loading-data');
    const [form, setForm] = useState<Record<string, unknown>>({});
    const [generatedData, setGeneratedData] = useState<any>(null);
    const [persistenceStatus, setPersistenceStatus] = useState<'confirmed-saved' | 'unsaved' | 'unknown' | 'public-share'>('unknown');
    const [ownerItineraryId, setOwnerItineraryId] = useState<string | null>(null);
    const [publicShareId, setPublicShareId] = useState<string | null>(null);
    const [loadedScopeKey, setLoadedScopeKey] = useState<string | null>(null);

    // Validate ID format on mount to prevent path traversal
    const isValidId = /^[a-zA-Z0-9_-]{1,128}$/.test(uuid);
    const isPublicShare = uuid.startsWith('share_') || searchParams.get('public') === '1';
    const isStaticPreview = Boolean(DEST_DATA[uuid.toLowerCase()]);
    const scopeKey = authLoading
        ? 'auth-pending'
        : isPublicShare
            ? `public:${uuid}`
            : user?.uid
                ? `owner:${user.uid}:${uuid}`
                : `owner:anonymous:${uuid}`;

    // Clear the previous account's result before the new account can paint it.
    // The scope gate below also prevents an old owner cache from being rendered
    // while Firebase is resolving the new session.
    useLayoutEffect(() => {
        let current = true;
        queueMicrotask(() => {
            if (!current) return;
            setPhase('loading-data');
            setForm({});
            setGeneratedData(null);
            setPersistenceStatus('unknown');
            setOwnerItineraryId(null);
            setPublicShareId(null);
            setLoadedScopeKey(null);
        });
        return () => { current = false; };
    }, [scopeKey]);

    useEffect(() => {
        if (authLoading || !uuid || !isValidId) {
            return;
        }

        if (!isPublicShare && !isStaticPreview && !user?.uid) {
            return;
        }

        if (!uuid || !isValidId) {
            return;
        }

        if (rawUuid !== uuid && typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/itinerary/plan/${uuid}`);
        }

        let isMounted = true;

        const loadData = async () => {
            try {
                // Owner data is never resolved from the public root collection.
                let data: any = null;
                if (isPublicShare) {
                    data = await getItineraryByUUID(uuid);
                } else if (user?.uid) {
                    data = await getOwnerItinerary(user.uid, uuid);
                }

                if (!isMounted) return;

                if (isPublicShare && (!data || data.isPublic === false || data.shareProjection !== true)) {
                    setPhase('not-found');
                    return;
                }

                if (data?.form) {
                    const loadedForm = isPublicShare
                        ? data.form ?? {}
                        : {
                            ...(data.form ?? {}),
                            uuid,
                            _uuid: uuid,
                            operationId: (data.form?.operationId as string | undefined) || uuid,
                            ...(data.publicShareId ? { publicShareId: data.publicShareId } : {}),
                        };
                    const expectedDays = Number(loadedForm.days) || 0;
                    const actualDays = Array.isArray(data.generatedData?.dayPlans) ? data.generatedData.dayPlans.length : 0;
                    const isComplete = actualDays > 0 && (expectedDays <= 1 || actualDays >= expectedDays);

                    if (isComplete) {
                        setForm(loadedForm);
                        setGeneratedData(data.generatedData);
                        setPersistenceStatus(isPublicShare ? 'public-share' : 'confirmed-saved');
                        setOwnerItineraryId(isPublicShare ? null : uuid);
                        setPublicShareId(isPublicShare ? null : data.publicShareId || data.shareId || null);
                        setLoadedScopeKey(scopeKey);
                        setPhase('result');
                        try {
                            const cacheKey = isPublicShare
                                ? `naviigo_public_plan_${uuid}`
                                : `naviigo_plan_${user?.uid}_${uuid}`;
                            sessionStorage.setItem(cacheKey, JSON.stringify({
                                form: loadedForm,
                                generatedData: data.generatedData,
                            }));
                        } catch {}
                        return;
                    }

                    // An owner stub is the only state that may enter generation.
                    // Public projections are read-only and never generate.
                    if (isPublicShare) {
                        setPhase('not-found');
                        return;
                    }
                    try {
                        sessionStorage.removeItem(`naviigo_plan_${uuid}`);
                    } catch {}
                    setForm(loadedForm);
                    setPersistenceStatus('unknown');
                    setOwnerItineraryId(uuid);
                    setLoadedScopeKey(scopeKey);
                    setPhase('generating');
                    return;
                }

                if (data?.generatedData) {
                    const loadedForm = data.form ?? {};
                    const scopedForm = isPublicShare
                        ? loadedForm
                        : {
                            ...loadedForm,
                            uuid,
                            _uuid: uuid,
                            operationId: (loadedForm.operationId as string | undefined) || uuid,
                            ...(data.publicShareId ? { publicShareId: data.publicShareId } : {}),
                        };
                    setForm(scopedForm);
                    setGeneratedData(data.generatedData);
                    setPersistenceStatus(isPublicShare ? 'public-share' : 'confirmed-saved');
                    setOwnerItineraryId(isPublicShare ? null : uuid);
                    setPublicShareId(isPublicShare ? null : data.publicShareId || data.shareId || null);
                    setLoadedScopeKey(scopeKey);
                    setPhase('result');
                    try {
                        const cacheKey = isPublicShare
                            ? `naviigo_public_plan_${uuid}`
                            : `naviigo_plan_${user?.uid}_${uuid}`;
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            form: scopedForm,
                            generatedData: data.generatedData,
                        }));
                    } catch {}
                    return;
                }

                // Static catalog pages are previews, not saved owner itineraries.
                const directStatic = DEST_DATA[uuid.toLowerCase()];
                if (directStatic) {
                    const defaultForm = {
                        destId: uuid,
                        destination: uuid,
                        destName: uuid.charAt(0).toUpperCase() + uuid.slice(1),
                        days: directStatic.dayPlans?.length || 3,
                        budget: 25000,
                        purpose: 'cultural',
                        group: 'solo',
                    };
                setForm(defaultForm);
                setGeneratedData(directStatic);
                setPersistenceStatus('unsaved');
                setLoadedScopeKey(scopeKey);
                setPhase('result');
                try {
                    sessionStorage.setItem(`naviigo_public_plan_${uuid}`, JSON.stringify({
                            form: defaultForm,
                            generatedData: directStatic,
                        }));
                    } catch {}
                    return;
                }

                // If we have neither, then not found
                setPhase('not-found');
                return;
            } catch (err) {
                console.warn('[UUID Page] Itinerary fetch failed:', err);
                if (!isMounted) return;
                setPhase('error');
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [authLoading, isPublicShare, isStaticPreview, user, user?.uid, uuid, isValidId, rawUuid, scopeKey]);

    /**
     * Called by LoadingScreen when generation completes.
     * LoadingScreen calls this only after validating the durable generation
     * receipt against the initiating UID and operation ID.
     */
    const handleGenerationDone = useCallback((data: any) => {
        if (data) {
            setGeneratedData(data);
            setPersistenceStatus('confirmed-saved');
            setOwnerItineraryId(uuid);
            setLoadedScopeKey(scopeKey);
            setPhase('result');
            try {
                sessionStorage.setItem(`naviigo_plan_${user?.uid}_${uuid}`, JSON.stringify({
                    form: { ...form, uuid, _uuid: uuid, operationId: (form.operationId as string | undefined) || uuid },
                    generatedData: data,
                }));
            } catch {}
        }
    }, [form, scopeKey, user, uuid, setGeneratedData, setPersistenceStatus, setOwnerItineraryId, setLoadedScopeKey, setPhase]);


    const handleReset = useCallback(() => {
        router.push('/itinerary');
    }, [router]);

    const handleDayView = useCallback((targetDay: number = 1, currentData?: any) => {
        const dayToOpen = typeof targetDay === 'number' && targetDay >= 1 ? targetDay : 1;
        const dataToSave = currentData || generatedData;
        if (dataToSave) {
            try {
                const cacheKey = isPublicShare || isStaticPreview
                    ? `naviigo_public_plan_${uuid}`
                    : `naviigo_plan_${user?.uid}_${uuid}`;
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    form,
                    generatedData: dataToSave,
                }));
            } catch {}
        }
        router.push(`/itinerary/plan/${uuid}/day/${dayToOpen}${isPublicShare ? '?public=1' : ''}`);
    }, [isPublicShare, isStaticPreview, uuid, router, form, generatedData, user]);

    if (phase === 'loading-data' || loadedScopeKey !== scopeKey) {
        return (
            <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-jungle-green-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-500 dark:text-muted-400">{isPublicShare ? 'Opening shared itinerary…' : 'Loading your saved itinerary…'}</p>
                </div>
            </div>
        );
    }

    if (phase === 'access-denied' || (!authLoading && !isPublicShare && !isStaticPreview && !user)) {
        return (
            <div className="min-h-screen bg-paper-warm pt-20 sm:pt-24 flex items-center justify-center px-6">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
                    <div className="text-5xl mb-5">🔒</div>
                    <h1 className="font-display font-black text-2xl uppercase text-naviigo-brown mb-3">Private itinerary</h1>
                    <p className="text-sm text-naviigo-brown/70 mb-7">Sign in with the account that owns this roadbook. Private itinerary details are not loaded from the public share collection.</p>
                    {!user ? (
                        <button type="button" onClick={signInWithGoogle} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-colors">
                            Sign in to continue
                        </button>
                    ) : (
                        <button type="button" onClick={() => router.push('/itinerary')} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-colors">
                            Return to planner
                        </button>
                    )}
                </motion.div>
            </div>
        );
    }

    if (phase === 'error') {
        return (
            <div className="min-h-screen bg-paper-warm pt-20 sm:pt-24 flex items-center justify-center px-6">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
                    <div className="text-5xl mb-5">⚠️</div>
                    <h1 className="font-display font-black text-2xl uppercase text-naviigo-brown mb-3">Could not open itinerary</h1>
                    <p className="text-sm text-naviigo-brown/70 mb-7">We could not confirm access to this itinerary. Your saved data was not changed.</p>
                    <button type="button" onClick={() => router.push('/passport')} className="bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-colors">
                        Open Passport
                    </button>
                </motion.div>
            </div>
        );
    }

    if (phase === 'not-found' || !uuid || !isValidId) {
        return (
            <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="text-6xl mb-6">🗺️</div>
                    <h1 className="text-2xl font-bold text-muted-900 dark:text-white mb-3">
                        Itinerary Not Found
                    </h1>
                    <p className="text-muted-500 dark:text-muted-400 text-sm mb-8">
                        This itinerary link may have expired (guest itineraries last 30 days) or the URL is invalid.
                    </p>
                    <button
                        onClick={() => router.push('/itinerary')}
                        className="bg-jungle-green-600 hover:bg-jungle-green-500 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors shadow-lg shadow-jungle-green-500/20"
                    >
                        Create a New Itinerary ✨
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {phase === 'generating' && (
                <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <LoadingScreen
                        form={form}
                        uuid={uuid}
                        onDone={handleGenerationDone}
                    />
                </motion.div>
            )}
            {phase === 'result' && (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResultPage
                        form={{ ...form, uuid, _uuid: uuid }}
                        generatedData={generatedData}
                        shareId={isPublicShare ? uuid : null}
                        publicShareId={publicShareId}
                        ownerItineraryId={ownerItineraryId}
                        readOnly={isPublicShare || isStaticPreview}
                        persistenceStatus={persistenceStatus}
                        onDayView={handleDayView}
                        onReset={handleReset}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function ItineraryUUIDPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-16 sm:pt-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-jungle-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <ItineraryUUIDContent />
        </Suspense>
    );
}
