'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

interface AuthRequiredModalProps {
  open: boolean;
  onClose: () => void;
  dismissible?: boolean;
}

export default function AuthRequiredModal({ open, onClose, dismissible = true }: AuthRequiredModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && open) onClose();
  }, [user, open, onClose]);

  if (!open) return null;

  const close = () => {
    if (!busy) onClose();
  };

  const continueWithGoogle = async () => {
    setBusy(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (signInError) {
      setError((signInError as Error)?.message || 'Could not complete Google sign-in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${dismissible ? '' : 'bg-zinc-950/65 backdrop-blur-sm'}`} role="dialog" aria-modal="true" aria-labelledby="auth-required-title">
      {dismissible && <button aria-label="Close sign in" className="absolute inset-0 bg-zinc-950/65 backdrop-blur-sm" onClick={close} />}
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl dark:bg-zinc-900 sm:p-8">
        {dismissible && <button aria-label="Close" onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-lg leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white">×</button>}
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">◈</div>
        <h2 id="auth-required-title" className="text-2xl font-bold text-zinc-950 dark:text-white">Save your trip with NaviiGo</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Sign in with Google to generate, save, and revisit your personalized itinerary.</p>
        <button onClick={continueWithGoogle} disabled={busy} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
          {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <span className="text-lg">G</span>} Continue with Google
        </button>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
      </div>
    </div>
  );
}
