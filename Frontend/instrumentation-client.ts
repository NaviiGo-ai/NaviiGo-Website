import * as Sentry from "@sentry/nextjs";

// Client-side error monitoring — Next.js 16 runs this file before hydration.
// With Turbopack this is the single sanctioned place for client Sentry.init
// (sentry.client.config.ts is deprecated for Turbopack builds).

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}

// Instrument App Router navigations as Sentry transactions.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
