/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const imagekitEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline'
    https://www.youtube.com
    https://s.ytimg.com
    https://www.google.com/recaptcha/
    https://www.gstatic.com/recaptcha/
    https://accounts.google.com
    https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://www.gstatic.com/;
  img-src 'self' data: blob:
    ${imagekitEndpoint}
    https://img.youtube.com
    https://i.ytimg.com
    https://images.unsplash.com
    https://www.gstatic.com/;
  font-src 'self' https://www.gstatic.com/;
  frame-src 'self' blob:
    https://www.youtube.com
    https://youtube.com
    https://www.youtube-nocookie.com
    https://youtube-nocookie.com
    https://www.google.com/recaptcha/
    https://recaptcha.google.com/recaptcha/;
  connect-src 'self'
    https:
    http:
    wss:
    ws:
    ${apiUrl}
    ${socketUrl}
    https://*.onrender.com
    http://localhost:*
    https://localhost:*
    ${imagekitEndpoint}
    https://identitytoolkit.googleapis.com
    https://securetoken.googleapis.com
    https://www.googleapis.com
    https://accounts.google.com
    https://www.google.com/recaptcha/
    https://www.gstatic.com/recaptcha/
    https://firebaseinstallations.googleapis.com
    https://fcmregistrations.googleapis.com
    https://unpkg.com;
  media-src 'self' blob:
    https://www.youtube.com
    https://www.youtube-nocookie.com;
  worker-src 'self' blob:;
  manifest-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();

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
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
