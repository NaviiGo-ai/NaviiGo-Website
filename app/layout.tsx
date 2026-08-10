import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import Providers from './providers';
import { LazySocialButton, LazyMorphSurface, LazyWebGLBackground } from '@/components/shared/LazyComponents';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://naviigo.com'),
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
        url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80',
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
    images: ['https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1280&q=80'],
  },
  appleWebApp: {
    title: 'NaviiGo',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
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
      <body className="font-sans antialiased overflow-x-hidden">
        <Providers>
          <LazySocialButton />
          <LazyWebGLBackground />
          <Navbar />
          <main className="overflow-x-hidden">{children}</main>
          <Footer />
          <LazyMorphSurface />
        </Providers>

        {/* TravelPayouts White Label Script */}
        <Script
          src="https://tpwgts.com/wl_web/main.js?wl_id=16321"
          strategy="lazyOnload"
          type="module"
        />
      </body>
    </html>
  );
}
