'use client';

import { Suspense } from 'react';
import SetupWizard from '@/components/features/itinerary/SetupWizard';

function PlanPageContent() {
  return <SetupWizard />;
}

export default function PlanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper-warm pt-24 sm:pt-32 flex flex-col items-center justify-center gap-3 text-brand-primary">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-naviigo-brown/60">
            Opening Editorial Workspace...
          </span>
        </div>
      }
    >
      <PlanPageContent />
    </Suspense>
  );
}
