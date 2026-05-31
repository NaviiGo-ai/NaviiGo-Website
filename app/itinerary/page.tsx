'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUserItineraries, joinSharedItinerary } from '@/lib/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SetupWizard from '@/components/features/itinerary/SetupWizard';
import LoadingScreen from '@/components/features/itinerary/LoadingScreen';
import ResultPage from '@/components/features/itinerary/ResultPage';
import DayViewPage from '@/components/features/itinerary/DayViewPage';

type Phase = 'setup' | 'loading' | 'result' | 'dayview';

function ItineraryContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('navii_itinerary_state');
        if (stored) return JSON.parse(stored).phase || 'setup';
    }
    return 'setup';
  });
  const [savedForm, setSavedForm] = useState<Record<string, unknown>>(() => {
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('navii_itinerary_state');
        if (stored) return JSON.parse(stored).savedForm || {};
    }
    return {};
  });
  const [generatedData, setGeneratedData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('navii_itinerary_state');
        if (stored) return JSON.parse(stored).generatedData || null;
    }
    return null;
  });
  const [sharedItineraryId, setSharedItineraryId] = useState<string | null>(null);

  useEffect(() => {
      if (typeof window !== 'undefined' && phase !== 'setup') {
          const loadId = searchParams.get('load');
          const shareId = searchParams.get('shareId');
          sessionStorage.setItem('navii_itinerary_state', JSON.stringify({ phase, savedForm, generatedData, loadId, shareId }));
      } else if (typeof window !== 'undefined' && phase === 'setup') {
          sessionStorage.removeItem('navii_itinerary_state');
      }
  }, [phase, savedForm, generatedData, searchParams]);

  useEffect(() => {
    const loadId = searchParams.get('load');
    const shareId = searchParams.get('shareId');

    // Prevent re-fetching if we just restored from sessionStorage for the exact same loadId/shareId
    if (typeof window !== 'undefined') {
        const storedStr = sessionStorage.getItem('navii_itinerary_state');
        if (storedStr) {
            const stored = JSON.parse(storedStr);
            if (loadId && stored.loadId === loadId && stored.phase !== 'setup') return;
            if (shareId && stored.shareId === shareId && stored.phase !== 'setup') return;
        }
    }

    if (shareId && user?.uid) {
      // Load shared itinerary
      getDoc(doc(db, 'itineraries', shareId)).then(async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSavedForm(data.form || {});
          setGeneratedData(data.generatedData || null);
          setSharedItineraryId(shareId);
          setPhase('result');
          await joinSharedItinerary(shareId, user.email || undefined);
        }
      }).catch(console.error);
    } else if (loadId && user?.uid) {
      // Load itinerary from Firestore
      getUserItineraries(user.uid).then((itineraries) => {
        const match = itineraries.find(i => i.id === loadId);
        if (match) {
          setSavedForm(match.form);
          setGeneratedData(match.generatedData || null);
          setPhase('result');
        }
      }).catch(console.error);
    }
  }, [searchParams, user]);

  const handleSetupDone = useCallback((form: Record<string, unknown>) => { setSavedForm(form); setPhase('loading'); }, []);
  const handleReset = useCallback(() => { setPhase('setup'); setSavedForm({}); setGeneratedData(null); sessionStorage.removeItem('navii_itinerary_state'); }, []);

  if (!isMounted) return null;

  return (
    <AnimatePresence mode="wait">
      {phase === 'setup' && <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SetupWizard onDone={handleSetupDone} /></motion.div>}
      {phase === 'loading' && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoadingScreen form={savedForm} onDone={(data) => { setGeneratedData(data); setPhase('result'); }} /></motion.div>}
      {phase === 'result' && <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ResultPage form={savedForm} generatedData={generatedData} shareId={sharedItineraryId} isLoaded={!!searchParams.get('load') || !!searchParams.get('shareId')} onDayView={() => setPhase('dayview')} onReset={handleReset} /></motion.div>}
      {phase === 'dayview' && <motion.div key="dayview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><DayViewPage form={savedForm} generatedData={generatedData} onBack={() => setPhase('result')} /></motion.div>}
    </AnimatePresence>
  );
}

export default function ItineraryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fc] dark:bg-[#0a0a0f] pt-20 flex items-center justify-center">Loading...</div>}>
      <ItineraryContent />
    </Suspense>
  );
}
