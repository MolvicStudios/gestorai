const CACHE_NAME = 'gestorai-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app/dashboard.html',
  '/css/themes.css',
  '/css/main.css',
  '/css/components.css',
  '/js/auth.js',
  '/js/color-mode.js',
  '/js/plan-gate.js',
  '/js/ia-client.js',
  '/js/pdf-gen.js',
  '/js/ccaa-selector.js',
  '/js/cookie-banner.js',
  '/manifest.json',
  '/assets/logo.svg',
];

// Instalar: pre-cachear recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activar: limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network-first para HTML/API, Cache-first para assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear peticiones a Supabase, APIs externas, etc.
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // HTML: Network-first con fallback a cache
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // CSS, JS, imágenes: Cache-first con fallback a network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
