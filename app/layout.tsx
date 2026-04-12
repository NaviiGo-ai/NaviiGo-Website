import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import Providers from './providers';
import { LazySocialButton, LazyMorphSurface, LazyWebGLBackground } from '@/components/shared/LazyComponents';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NaviiGo | The Ultimate Indian Spiritual Travel Tech & Aggregator',
  description: 'AI-Powered temple itineraries, digital pilgrim passports, and universal booking hub for cheap travel options across India.',
  keywords: 'India travel, seamless spiritual journey, digital passport, automatic temple stamps, AI itinerary generator, darshan timings planner, NaviiGO travel aggregator',
  openGraph: {
    title: 'NaviiGo | Indian Spiritual Travel Planner',
    description: 'Transform your journey with our Digital Pilgrim Passport and AI-powered temple itineraries.',
    url: 'https://naviigo.com',
    siteName: 'NaviiGo',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaviiGO Spiritual Travel Planner',
    description: 'Start your ultimate Indian journey with an AI agent specifically built for Darshan timings and seamless cabs.',
    images: ['https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80'],
  }
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>
          <LazySocialButton />
          <LazyWebGLBackground />
          <Navbar />
          <main>{children}</main>
          <LazyMorphSurface />
        </Providers>
      </body>
    </html>
  );
}
