import { MetadataRoute } from 'next';
import { DESTINATIONS } from '@/app/itinerary/data';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://naviigo.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // Static core routes
  const routes = [
    '',
    '/explore',
    '/bookings',
    '/itinerary',
    '/passport',
    '/about',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic destination routes
  const destinationRoutes = DESTINATIONS.map((dest) => ({
    url: `${BASE_URL}/explore/${dest.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...destinationRoutes];
}
