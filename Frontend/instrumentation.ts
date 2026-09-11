import * as Sentry from "@sentry/nextjs";

// ─── Server & Edge error monitoring ─────────────────────────────────────────
// Next.js App Router instrumentation hook — loads the Sentry SDK for the
// Node.js (server components, route handlers) and Edge runtimes. Client-side
// monitoring lives in instrumentation-client.ts (Turbopack requires init there).

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Capture errors from Server Components, route handlers, middleware and proxies.
export const onRequestError = Sentry.captureRequestError;
