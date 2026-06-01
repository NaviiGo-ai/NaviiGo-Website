import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Destinations | NaviiGo',
  description: 'Discover the most beautiful and spiritual destinations across India. Uncover hidden gems, trending locations, and divine temples.',
  openGraph: {
    title: 'Explore India | NaviiGo',
    description: 'Find your next spiritual journey or leisure escape across India.',
  }
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
