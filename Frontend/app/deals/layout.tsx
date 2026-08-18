import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Travel Deals | NaviiGo',
  description: 'Compare prices across 500+ airlines and top hotels. Engineered by TravelPayouts & NaviiGo.',
};

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
