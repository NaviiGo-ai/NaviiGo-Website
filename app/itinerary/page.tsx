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
  const [phase, setPhase] = useState<Phase>('setup');
  const [savedForm, setSavedForm] = useState<Record<string, unknown>>({});
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [sharedItineraryId, setSharedItineraryId] = useState<string | null>(null);

  useEffect(() => {
    const loadId = searchParams.get('load');
    const shareId = searchParams.get('shareId');

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
  const handleReset = useCallback(() => { setPhase('setup'); setSavedForm({}); setGeneratedData(null); }, []);

  return (
    <AnimatePresence mode="wait">
      {phase === 'setup' && <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SetupWizard onDone={handleSetupDone} /></motion.div>}
      {phase === 'loading' && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoadingScreen form={savedForm} onDone={(data) => { setGeneratedData(data); setPhase('result'); }} /></motion.div>}
      {phase === 'result' && <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ResultPage form={savedForm} generatedData={generatedData} shareId={sharedItineraryId} onDayView={() => setPhase('dayview')} onReset={handleReset} /></motion.div>}
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
