const APP_SHELL_CACHE = 'app-shell-v3';
const API_CACHE = 'api-cache-v3';
const IMAGE_CACHE = 'image-cache-v3';
const OFFLINE_URL = '/offline';

const APP_SHELL_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/test-series',
  '/batches',
];

const API_PATHS = [
  '/api/v1/users/me',
  '/api/v1/batches',
  '/api/v1/notifications',
  '/api/v1/test-series',
  '/api/v1/announcements',
];

const IMAGE_HOSTS = [
  'images.unsplash.com',
  'ik.imagekit.io',
  'res.cloudinary.com',
  'img.youtube.com',
  'i.ytimg.com',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll(APP_SHELL_URLS).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  const validCaches = [APP_SHELL_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Instagram-style Stale-While-Revalidate & Cache-First Routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API requests: Network first, fallback to Cache (Instagram style offline data)
  if (API_PATHS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirstWithStaleFallback(request));
    return;
  }

  // CDN & Unsplash images: Stale-While-Revalidate (Instant load from cache + lazy update)
  if (IMAGE_HOSTS.some((host) => url.hostname.includes(host))) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Navigation requests: App Shell cache-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Hashed static Next.js assets: Cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(staleWhileRevalidate(request, APP_SHELL_CACHE));
    return;
  }

  if (url.pathname.match(/\.(woff2?|ttf|otf|eot|png|svg|ico|jpg|jpeg|webp|apk)$/)) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || new Response('Offline Asset', { status: 503 });
  }
}

// Instagram-style API cache: Always return cached data when offline regardless of age
async function networkFirstWithStaleFallback(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline mode: Return cached API response if available
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(JSON.stringify({ error: 'Offline', message: 'Viewing cached mode offline.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('Offline Mode', { status: 503 });
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'allEdu', body: event.data.text(), data: {} };
  }
  const { title = 'allEdu', body = '', icon = '/icons/icon-192.png', data = {} } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/icons/icon-192.png',
      data,
      vibrate: [200, 100, 200],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const deepLink = event.notification.data?.deepLink || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === deepLink && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(deepLink);
    })
  );
});
