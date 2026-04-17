"use client";

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/AuthContext';
import { AIProvider } from '@/context/AIContext';
import { ReactLenis } from 'lenis/react';

export default function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactLenis root>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
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
