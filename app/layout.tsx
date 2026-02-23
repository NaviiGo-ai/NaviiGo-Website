import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NaviiGO — Travel Aggregator',
  description:
    'NaviiGO is an Indian travel aggregator for flights, hotels, trains, and buses. We redirect you to partners to book.',
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
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
