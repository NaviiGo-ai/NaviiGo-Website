import type { Metadata, Viewport } from 'next';
import { Epilogue, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/MinimalNavbar';
import Providers from './providers';
import SocialButton from '@/components/shared/SocialButton';
import CustomCursor from '@/components/shared/CustomCursor';
import CookieConsent from '@/components/shared/CookieConsent';
import Script from 'next/script';

const epilogue = Epilogue({
  subsets: ['latin'],
  variable: '--font-epilogue',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF6F0' },
    { media: '(prefers-color-scheme: dark)', color: '#161412' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://naviigo.com'),
  title: {
    default: 'NaviiGo — The Connected Travel Companion',
    template: '%s | NaviiGo',
  },
  description: 'Travel should feel like an experience, not a project to manage. Discover, plan, and experience extraordinary journeys with NaviiGo.',
  keywords: 'NaviiGo, travel companion, curated itineraries, seamless discovery, travel experience, journey planner, India and beyond',
  openGraph: {
    title: 'NaviiGo — The Connected Travel Companion',
    description: 'Travel should feel like an experience, not a project to manage.',
    url: 'https://naviigo.com',
    siteName: 'NaviiGo',
    images: [
      {
        url: '/brand/naviigo-mark-primary.png',
        width: 1200,
        height: 630,
        alt: 'NaviiGo Travel Companion',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NaviiGo — The Connected Travel Companion',
    description: 'Travel should feel like an experience, not a project to manage.',
    images: ['/brand/naviigo-mark-primary.png'],
  },
  icons: {
    icon: '/brand/naviigo-mark-primary.png',
    apple: '/brand/naviigo-mark-primary.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${epilogue.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased selection:bg-brand-primary selection:text-white bg-paper-warm text-naviigo-text">
        <Providers>
          <CustomCursor />
          <div className="fixed right-0 top-1/3 z-50 rounded-l-lg overflow-hidden pointer-events-auto">
            <SocialButton />
          </div>
          <Navbar />
          <main className="relative z-10 w-full min-h-screen">{children}</main>
          <CookieConsent />
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
