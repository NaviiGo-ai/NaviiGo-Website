/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1'],
  serverExternalPackages: ['@pinecone-database/pinecone'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'www.gstatic.com',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    ];

    // Only apply strict CSP in production — dev mode needs open CSP for HMR/WebSockets
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com apis.google.com cdn.sentry.io www.googletagmanager.com tpwgts.com unpkg.com cdn.jsdelivr.net",
          "style-src 'self' 'unsafe-inline' fonts.googleapis.com accounts.google.com unpkg.com",
          "font-src 'self' fonts.gstatic.com",
          "connect-src 'self' wss: ws: *.googleapis.com *.google.com apis.google.com *.firebaseio.com *.firebaseapp.com identitytoolkit.googleapis.com securetoken.googleapis.com api.pinecone.io *.open-meteo.com *.sentry.io *.nominatim.openstreetmap.org nominatim.openstreetmap.org router.project-osrm.org www.googletagmanager.com www.google-analytics.com analytics.google.com tpwgts.com *.onrender.com ipapi.co unpkg.com *.basemaps.cartocdn.com *.apistp.com",
          "img-src 'self' data: blob: https:",
          "media-src 'self'",
          "frame-src 'self' *.firebaseapp.com accounts.google.com apis.google.com tpwgts.com",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      });
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "naviigo",
  project: "naviigo-website",
  silent: !process.env.CI, // Suppresses all logs
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
