"use client";

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/AuthContext';
import { AIProvider } from '@/context/AIContext';
import LocomotiveScrollProvider from '@/components/providers/LocomotiveScrollProvider';
import { useEffect } from 'react';

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <AuthProvider>
        <AIProvider>
          <LocomotiveScrollProvider>
            {children}
          </LocomotiveScrollProvider>
        </AIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
