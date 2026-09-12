import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NaviiGo | Spiritual Travel Planner',
    short_name: 'NaviiGo',
    description: 'Transform your journey with our Digital Pilgrim Passport and AI-powered temple itineraries.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFF8F0', // warm ivory — matches --background
    theme_color: '#FF9933', // saffron — matches --primary
    // Inline SVG mark (data URI) so the PWA icon needs no local asset file.
    icons: [
      {
        src: `data:image/svg+xml,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="44" fill="#FF9933"/><path d="M56 136V56h16l48 56V56h16v80h-16l-48-56v56z" fill="#ffffff"/></svg>'
        )}`,
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
