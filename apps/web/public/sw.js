const APP_SHELL_CACHE = 'app-shell-v2';
const API_CACHE = 'api-cache-v2';
const IMAGE_CACHE = 'image-cache-v2';
const OFFLINE_URL = '/offline';
const API_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const APP_SHELL_URLS = [
  '/',
  '/offline',
  '/manifest.json',
];

const API_NETWORK_FIRST_PATHS = [
  '/api/v1/users/me',
  '/api/v1/batches',
  '/api/v1/notifications',
];

const IMAGE_HOSTS = [
  'res.cloudinary.com',
  'img.youtube.com',
  'i.ytimg.com',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll(APP_SHELL_URLS).catch(() => {
        // Non-fatal: offline page may not exist yet during build
      })
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

// Fetch: routing strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API network-first with stale fallback
  if (API_NETWORK_FIRST_PATHS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(networkFirstWithStaleFallback(request));
    return;
  }

  // CDN images: stale-while-revalidate
  if (IMAGE_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // Navigation requests: app shell cache-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Static assets (JS/CSS/fonts/icons): network-first for _next/static (hashed), cache-first for others
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(networkFirstWithStaleFallback(request));
    return;
  }

  if (url.pathname.match(/\.(woff2?|ttf|otf|eot|png|svg|ico)$/)) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstWithStaleFallback(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cloned = response.clone();
      const headers = new Headers(cloned.headers);
      headers.set('sw-cached-at', Date.now().toString());
      const body = await cloned.arrayBuffer();
      cache.put(request, new Response(body, { status: cloned.status, headers }));
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = parseInt(cached.headers.get('sw-cached-at') || '0', 10);
      if (Date.now() - cachedAt < API_CACHE_TTL_MS) return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
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
    return offline || new Response('Offline', { status: 503 });
  }
}

// Push notification handler (task 25.4)
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

// Notification click handler (task 25.4)
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
