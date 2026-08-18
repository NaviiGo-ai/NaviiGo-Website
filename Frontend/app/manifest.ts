import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NaviiGo | Spiritual Travel Planner',
    short_name: 'NaviiGo',
    description: 'Transform your journey with our Digital Pilgrim Passport and AI-powered temple itineraries.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617', // slate-950
    theme_color: '#0ea5e9', // sky-500
    icons: [
      {
        src: '/content.png', // The logo image
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
