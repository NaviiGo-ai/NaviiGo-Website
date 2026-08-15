"use client";

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/AuthContext';
import { AIProvider } from '@/context/AIContext';
import { ReactLenis } from 'lenis/react';

  import { useEffect } from 'react';

  export default function Providers({
    children,
  }: Readonly<{ children: React.ReactNode }>) {
    useEffect(() => {
      if (!('serviceWorker' in navigator)) return;

      // A service worker must never cache Turbopack/HMR chunks. Unregister old
      // workers in development so source changes cannot be masked by stale JS.
      if (process.env.NODE_ENV !== 'production') {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
        caches.keys().then(keys => {
          keys.filter(key => key.startsWith('naviigo-')).forEach(key => caches.delete(key));
        });
        return;
      }

      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
    }, []);

    return (
      <ReactLenis root>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <AIProvider>
              {children}
            </AIProvider>
          </AuthProvider>
        </ThemeProvider>
      </ReactLenis>
    );
  }
