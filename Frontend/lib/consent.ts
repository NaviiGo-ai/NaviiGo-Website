'use client';

/**
 * Naviigo Privacy & Consent Manager (Strict GDPR / DPDP Mode)
 * Ensures no analytics (GA4, Vercel, PostHog, Mixpanel) run until explicit consent is granted.
 */

export interface ConsentState {
  essential: boolean;
  analytics: boolean;
  personalization: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'naviigo_cookie_consent_v1';

export function getCookieConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  // Strict GDPR mode: false until explicitly accepted
  return consent ? Boolean(consent.analytics) : false;
}

export function hasPersonalizationConsent(): boolean {
  const consent = getCookieConsent();
  return consent ? Boolean(consent.personalization) : false;
}

export function openCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('naviigo:open-cookie-preferences'));
}

export function onConsentChange(callback: (consent: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ConsentState>;
    callback(customEvent.detail);
  };
  window.addEventListener('naviigo:consent-updated', handler);
  return () => window.removeEventListener('naviigo:consent-updated', handler);
}
