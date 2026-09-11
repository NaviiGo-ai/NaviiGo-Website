import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

// Only initialise when a DSN is actually configured — otherwise the SDK logs
// "Sentry SDK disabled" noise on every boot with no way to send anything.
if (dsn) {
  Sentry.init({
    dsn,
    // 10% in production keeps volume reasonable; 100% in dev/test for fidelity.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
