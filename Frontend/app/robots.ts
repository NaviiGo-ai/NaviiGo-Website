import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://naviigo.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/itinerary/detail/', '/itinerary/tracking/', '/saved/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
