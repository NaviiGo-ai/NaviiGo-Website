'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSavedItineraries } from '@/lib/savedItineraries';
import SetupWizard from '@/components/features/itinerary/SetupWizard';
import LoadingScreen from '@/components/features/itinerary/LoadingScreen';
import ResultPage from '@/components/features/itinerary/ResultPage';
import DayViewPage from '@/components/features/itinerary/DayViewPage';

type Phase = 'setup' | 'loading' | 'result' | 'dayview';

function ItineraryContent() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('setup');
  const [savedForm, setSavedForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId) {
      const all = getSavedItineraries();
      const match = all.find(i => i.id === loadId);
      if (match) {
        setSavedForm(match.form);
        setPhase('result');
      }
    }
  }, [searchParams]);

  const handleSetupDone = useCallback((form: Record<string, unknown>) => { setSavedForm(form); setPhase('loading'); }, []);
  const handleReset = useCallback(() => { setPhase('setup'); setSavedForm({}); }, []);

  return (
    <AnimatePresence mode="wait">
      {phase === 'setup' && <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><SetupWizard onDone={handleSetupDone} /></motion.div>}
      {phase === 'loading' && <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><LoadingScreen form={savedForm} onDone={() => setPhase('result')} /></motion.div>}
      {phase === 'result' && <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ResultPage form={savedForm} onDayView={() => setPhase('dayview')} onReset={handleReset} /></motion.div>}
      {phase === 'dayview' && <motion.div key="dayview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><DayViewPage form={savedForm} onBack={() => setPhase('result')} /></motion.div>}
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
