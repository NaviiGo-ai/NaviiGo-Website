'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Global error boundary.
 *
 * This component REPLACES the root layout, so the stylesheet imported by
 * layout.tsx is not guaranteed to be present. Everything here is therefore
 * styled inline against the Soul of India palette rather than with Tailwind
 * classes, which would render unstyled if the sheet is missing.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: '#1C1A19',
          color: '#F5EDE4',
          fontFamily: 'Lato, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '5rem',
              height: '5rem',
              borderRadius: '9999px',
              background: 'rgba(178, 34, 34, 0.10)',
              border: '1px solid rgba(178, 34, 34, 0.30)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ fontSize: '2.25rem', color: '#B22222' }} aria-hidden="true">
              !
            </span>
          </div>
          <h1
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: '1.875rem',
              fontWeight: 700,
              margin: '0 0 0.75rem',
              color: '#F5EDE4',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ color: '#B8AFA6', maxWidth: '28rem', margin: '0 0 2rem', lineHeight: 1.6 }}>
            Our monitoring team has been automatically notified about this issue. We apologize for the inconvenience!
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#FF9933',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '1rem',
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
