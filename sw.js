/**
 * sw.js - Service Worker para GestorIA
 * Gestiona caché offline, assets estáticos, y estrategias de red
 */

const CACHE_NAME = 'gestorai-v8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/onboarding.html',
  '/app.html',
  '/privacidad.html',
  '/terminos.html',
  '/aviso-legal.html',
  '/cookies.html',
  '/css/main.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/groq.js',
  '/js/perfil.js',
  '/js/historial.js',
  '/js/chat.js',
  '/js/gdpr.js',
  '/js/herramientas/cuota.js',
  '/js/herramientas/irpf130.js',
  '/js/herramientas/finiquito.js',
  '/js/herramientas/indemnizacion.js',
  '/js/herramientas/modelo303.js',
  '/js/herramientas/calendario.js',
  '/manifest.json',
];

/**
 * Instala el Service Worker y precarga assets estáticos
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets...');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[SW] Some assets failed to cache:', error);
      });
    }).then(() => self.skipWaiting())
  );
});

/**
 * Activa el Service Worker y limpia caches antiguas
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Intercepta requests y aplica estrategia Cache-First para assets,
 * Network-First para HTML. Las navegaciones (HTML) nunca caen en
 * fallback a index.html para evitar que páginas incorrectas aparezcan.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Dejar pasar requests a otros dominios (APIs externas, fuentes, etc.)
  if (url.hostname !== self.location.hostname) {
    return;
  }

  // No interceptar rutas de API (Cloudflare Functions)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Cache-First para assets estáticos (JS, CSS, imágenes)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-First para HTML. Si la red falla, usa caché del HTML específico.
  // NUNCA devuelve index.html como fallback de otra página.
  if (
    request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback al HTML cacheado de ESA misma URL (nunca de otra)
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response(
              '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Sin conexión</title></head>' +
              '<body style="font-family:sans-serif;text-align:center;padding:2rem">' +
              '<h1>Sin conexión</h1><p>Comprueba tu conexión a internet e inténtalo de nuevo.</p>' +
              '<a href="/">Volver al inicio</a></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }

  // Para cualquier otra request, pasar directamente a la red
  event.respondWith(fetch(request));
});

/**
 * Maneja mensajes desde clientes (push, sync, etc.)
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
