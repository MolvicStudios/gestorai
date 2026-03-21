/**
 * sw.js - Service Worker para GestorIA
 * Gestiona caché offline, assets estáticos, y estrategias de red
 */

const CACHE_NAME = 'gestorai-v3';
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

const OFFLINE_URL = '/index.html';

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
 * Network-First para datos
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Excluir APIs de terceros (Groq, Mistral) y Cloudflare Functions
  if (
    url.hostname.includes('api.groq.com') ||
    url.hostname.includes('api.mistral.ai') ||
    url.pathname.startsWith('/api/') && !url.pathname.includes('/api/config')
  ) {
    // Network-only para APIs de IA
    event.respondWith(
      fetch(request).catch(() => {
        return new Response('Sin conexión a IA', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
    );
    return;
  }

  // Cache-First para assets estáticos (JS, CSS)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          return new Response('Asset no disponible offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Network-First para HTML + /api/config (IA + configuración)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si cae la red, intenta fallback en caché
        return caches.match(request).then((response) => {
          return response || caches.match(OFFLINE_URL);
        });
      })
  );
});

/**
 * Maneja mensajes desde clientes (push, sync, etc.)
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
