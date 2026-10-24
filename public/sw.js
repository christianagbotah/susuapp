/* ============================================================
   iSusuPro Ghana — Service Worker (PWA v2)
   Offline-first shell for Android/iOS (via PWA or Capacitor),
   Windows/macOS (via Tauri webview or browser install), and web.
   Strategy:
     - App shell & static assets: cache-first with background refresh
     - Next.js static chunks: stale-while-revalidate
     - API calls: network-only (financial data must be live)
     - Offline fallback: /offline.html
   ============================================================ */

const VERSION = 'isusupro-v2';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const OFFLINE_URL = '/offline.html';

const SHELL_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ).then(() => self.clients.claim())
    )
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache financial APIs or auth
  if (url.pathname.startsWith('/api/')) return;

  // Navigations: network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets (Next.js chunks, fonts, images): stale-while-revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    /\.(css|js|woff2?|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone()).catch(() => {});
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
