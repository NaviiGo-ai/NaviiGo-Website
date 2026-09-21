'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie, Sliders, Check, X, ChevronRight, Lock } from 'lucide-react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'naviigo_cookie_consent_v1';
const COOKIE_NAME = 'naviigo_consent_given';

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      essential: true, // Always true and cannot be disabled
      analytics: false, // Strict GDPR: requires explicit opt-in
      personalization: false,
      timestamp: '',
    };
  });

  const saveConsent = useCallback((prefs: CookiePreferences) => {
    try {
      const dataToSave = { ...prefs, timestamp: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Set first-party consent cookie with security flags (1 year expiry)
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const cookieValue = `status=${prefs.analytics ? 'all' : 'essential'}; Path=/; Max-Age=31536000; SameSite=Lax${isHttps ? '; Secure' : ''}`;
      document.cookie = `${COOKIE_NAME}=${cookieValue}`;

      // Notify other components or analytics scripts
      window.dispatchEvent(
        new CustomEvent('naviigo:consent-updated', { detail: dataToSave })
      );
    } catch (e) {
      console.warn('Unable to persist cookie consent:', e);
    }
    setIsOpen(false);
    setShowDetails(false);
  }, []);

  useEffect(() => {
    // Check if consent has already been given
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        // Small delay for buttery smooth entry after page loads
        const timer = setTimeout(() => setIsOpen(true), 900);
        return () => clearTimeout(timer);
      }
    } catch {
      setTimeout(() => setIsOpen(true), 0);
    }

    // Allow opening cookie preferences from anywhere (e.g. footer link)
    const handleOpen = () => {
      setShowDetails(true);
      setIsOpen(true);
    };
    window.addEventListener('naviigo:open-cookie-preferences', handleOpen);
    return () => window.removeEventListener('naviigo:open-cookie-preferences', handleOpen);
  }, []);

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      personalization: true,
      timestamp: '',
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      analytics: false,
      personalization: false,
      timestamp: '',
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Cookie and privacy preferences"
      role="dialog"
      aria-modal="false"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg z-[9999] animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#FAF6F0]/95 dark:bg-[#1A1614]/95 backdrop-blur-xl border border-stone-300/80 dark:border-stone-800/80 rounded-2xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] text-[#1F1A17] dark:text-[#F3EFEA] transition-all">
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EC6426]/10 text-[#EC6426] flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base tracking-tight">
                Your Privacy &amp; Journey Data
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Transparent · Minimal · Protected
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors rounded-lg"
            aria-label="Close cookie banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Concise Description */}
        <p className="mt-3 font-sans text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          We use essential cookies to securely save your itineraries and maintain your travel checkpoint progress.
          Optional analytics help us refine distance calculations and discover better local routes across India.
        </p>

        {/* Detailed Preferences Accordion */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
            {/* Category: Essential */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-stone-100/60 dark:bg-stone-900/60">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-xs text-[#1F1A17] dark:text-stone-100">
                    Essential Operations
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    <Lock className="w-2.5 h-2.5" /> Required
                  </span>
                </div>
                <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Authentication, itinerary UUID locking, Firestore persistence, and CSRF protection.
                </p>
              </div>
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded text-[#EC6426] cursor-not-allowed opacity-75"
                />
              </div>
            </div>

            {/* Category: Analytics */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-stone-100/60 dark:hover:bg-stone-900/40 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-xs text-[#1F1A17] dark:text-stone-100">
                    Route &amp; Performance Analytics
                  </span>
                </div>
                <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Helps us monitor navigation reliability, map loading speeds, and crash telemetry.
                </p>
              </div>
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="cookie-pref-analytics"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                  }
                  className="rounded text-[#EC6426] focus:ring-[#EC6426] cursor-pointer w-4 h-4"
                />
              </div>
            </div>

            {/* Category: Personalization */}
            <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-stone-100/60 dark:hover:bg-stone-900/40 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-xs text-[#1F1A17] dark:text-stone-100">
                    Taste Profile &amp; Preferences
                  </span>
                </div>
                <p className="font-sans text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                  Remembers your dietary choices, pace, and previously explored travel chapters.
                </p>
              </div>
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  id="cookie-pref-personalization"
                  checked={preferences.personalization}
                  onChange={(e) =>
                    setPreferences((prev) => ({ ...prev, personalization: e.target.checked }))
                  }
                  className="rounded text-[#EC6426] focus:ring-[#EC6426] cursor-pointer w-4 h-4"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-stone-500 dark:text-stone-400 hover:text-[#EC6426] py-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showDetails ? 'Hide Options' : 'Customise'}</span>
          </button>

          <div className="flex items-center gap-2">
            {showDetails ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#EC6426] text-white font-mono text-xs uppercase tracking-wider font-bold hover:bg-[#d55318] transition-all shadow-md active:scale-95"
              >
                Save Choices
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAcceptEssential}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 text-[#1F1A17] dark:text-stone-200 font-mono text-[11px] uppercase tracking-wider transition-all active:scale-95"
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#EC6426] text-white font-mono text-[11px] uppercase tracking-wider font-bold hover:bg-[#d55318] transition-all shadow-md active:scale-95"
                >
                  Accept All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer Policy Links */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#EC6426]" />
            <span>GDPR &amp; DPDP Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/privacy" className="hover:underline hover:text-[#EC6426] transition-colors">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:underline hover:text-[#EC6426] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
