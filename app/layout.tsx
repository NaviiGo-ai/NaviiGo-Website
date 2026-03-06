import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import Providers from './providers';
import SocialButton from '@/components/shared/SocialButton';
import MorphSurface from '@/components/shared/MorphSurface';
import WebGLBackground from '@/components/shared/WebGLBackground';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NaviiGO | The Ultimate Indian Spiritual Travel Tech & Aggregator',
  description: 'AI-Powered temple itineraries, digital pilgrim passports, and universal booking hub for cheap travel options across India.',
  keywords: 'India travel, seamless spiritual journey, digital passport, automatic temple stamps, AI itinerary generator, darshan timings planner, NaviiGO travel aggregator',
  openGraph: {
    title: 'NaviiGO | Indian Spiritual Travel Planner',
    description: 'Transform your journey with our Digital Pilgrim Passport and AI-powered temple itineraries.',
    url: 'https://naviigo.com',
    siteName: 'NaviiGO',
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
      <body className="font-sans antialiased overflow-x-hidden">
        <Providers>
          <div className="fixed right-0 top-1/3 z-50 rounded-l-lg overflow-hidden">
            <SocialButton />
          </div>
          <WebGLBackground />
          <Navbar />
          <main>{children}</main>
          <MorphSurface />
        </Providers>
      </body>
    </html>
  );
}
