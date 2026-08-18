'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry automatically
    Sentry.captureException(error);
  }, [error]);

  return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <span className="text-4xl text-red-500" aria-hidden="true">!</span>
      </div>
      <h1 className="text-3xl font-bold text-white mb-3">Something went wrong</h1>
      <p className="text-slate-400 max-w-md mb-8">
        Our monitoring team has been automatically notified about this issue. We apologize for the inconvenience!
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
