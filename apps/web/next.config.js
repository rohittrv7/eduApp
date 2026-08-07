/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const imagekitEndpoint =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io';

// Derive websocket URL from socket URL
const wsUrl = socketUrl.replace(/^http/, 'ws');

// Fix 13+14: Remove unsafe-eval & unsafe-inline from script-src
// Fix 14: Restrict connect-src to known domains only (no bare 'https:')
const cspParts = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for styles; script nonces would need runtime injection
  // unsafe-eval removed — if Next.js build breaks, add back only for dev
  [
    "script-src 'self'",
    'https://www.youtube.com',
    'https://s.ytimg.com',
    'https://www.google.com/recaptcha/',
    'https://www.gstatic.com/recaptcha/',
    'https://accounts.google.com',
    'https://unpkg.com',
  ].join(' '),
  "style-src 'self' 'unsafe-inline' https://www.gstatic.com/",
  [
    "img-src 'self' data: blob:",
    imagekitEndpoint,
    'https://img.youtube.com',
    'https://i.ytimg.com',
    'https://images.unsplash.com',
    'https://www.gstatic.com/',
    'https://*.onrender.com',
    'http://localhost:*',
  ].join(' '),
  "font-src 'self' https://www.gstatic.com/",
  [
    "frame-src 'self' blob:",
    'https://www.youtube.com',
    'https://youtube.com',
    'https://www.youtube-nocookie.com',
    'https://youtube-nocookie.com',
    'https://www.google.com/recaptcha/',
    'https://recaptcha.google.com/recaptcha/',
  ].join(' '),
  // connect-src: explicit list only — no bare 'https:' or 'http:'
  [
    "connect-src 'self'",
    apiUrl,
    apiUrl.replace('/api/v1', ''),
    socketUrl,
    wsUrl,
    'https://*.onrender.com',
    'http://localhost:*',
    'https://localhost:*',
    imagekitEndpoint,
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://www.googleapis.com',
    'https://accounts.google.com',
    'https://www.google.com/recaptcha/',
    'https://www.gstatic.com/recaptcha/',
    'https://firebaseinstallations.googleapis.com',
    'https://fcmregistrations.googleapis.com',
    'https://unpkg.com',
  ].join(' '),
  "media-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob: https://unpkg.com",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  // form-action: allow API for OAuth POST-back
  ["form-action 'self'", apiUrl.replace('/api/v1', '')].join(' '),
  "frame-ancestors 'none'",
];

const ContentSecurityPolicy = cspParts.join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const nextConfig = {
  transpilePackages: ['@educational/types', '@educational/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.onrender.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;
