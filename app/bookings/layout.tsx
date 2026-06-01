import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cheap Flights, Trains & Hotels | NaviiGo Bookings',
  description: 'Compare flights, trains, cabs, and hotels across India. Find the best travel deals and lowest prices for your spiritual journey.',
  openGraph: {
    title: 'Universal Booking Hub | NaviiGo',
    description: 'Compare and book the cheapest flights, trains, and hotels in one place.',
  }
};

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
