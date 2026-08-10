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
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
      }
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
