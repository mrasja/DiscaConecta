import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /\/api\/(professionals|centros|escuelas)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-search',
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|webp|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\/(profesional|centro)\/.+/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages',
        expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  allowedDevOrigins: [
    '10.0.2.2',
    '192.168.0.*',
    '192.168.1.*',
    '192.168.2.*',
  ],
};

export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: { disable: true },
});
