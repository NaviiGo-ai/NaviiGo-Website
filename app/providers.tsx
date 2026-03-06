"use client";

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/AuthContext';
import { ReactLenis } from '@studio-freight/react-lenis';

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
          {children}
        </AuthProvider>
      </ThemeProvider>
    </ReactLenis>
  );
}
