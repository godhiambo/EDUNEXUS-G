const CACHE_NAME = 'edunexus-pwa-v4';
const CURRICULUM_CACHE_NAME = 'edunexus-curriculum-docs-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event - Pre-cache core app shell assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing EduNexus SW v4 (Curriculum Offline Ready)...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching core app shell and static assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean up stale cache versions while keeping curriculum cache intact
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating EduNexus SW v4...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== CURRICULUM_CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Message Event - Receive explicit precache requests for curriculum documents & assets
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'CACHE_CURRICULUM_DOCS') {
    console.log('[Service Worker] Caching curriculum documents for offline classroom access:', event.data.documents);
    const urlsToCache = event.data.imageUrls || [];
    if (urlsToCache.length > 0) {
      caches.open(CURRICULUM_CACHE_NAME).then((cache) => {
        urlsToCache.forEach((url) => {
          fetch(url, { mode: 'cors' })
            .then((res) => {
              if (res.ok) cache.put(url, res);
            })
            .catch((err) => console.warn('[Service Worker] Could not precache document image:', url, err));
        });
      });
    }
  }

  if (event.data.type === 'VERIFY_OFFLINE_CACHE') {
    console.log('[Service Worker] Offline cache verification requested.');
  }
});

// Fetch Event - Handle offline navigation & asset/curriculum document caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Exclude API, Firebase Auth/Firestore, and WebSocket dev server requests from SW caching
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.includes('@vite') ||
    url.pathname.includes('/sockjs-node')
  ) {
    return;
  }

  // HTML / Page Navigation: Network-First strategy with Cache Fallback for offline support
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.warn('[Service Worker] Offline detected: serving cached index.html app shell');
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/');
          });
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Fonts, Images, Curriculum Media): Cache-First with Network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
          const responseClone = networkResponse.clone();
          const targetCache = url.pathname.includes('/documents/') || url.pathname.includes('/curriculum/')
            ? CURRICULUM_CACHE_NAME
            : CACHE_NAME;
          caches.open(targetCache).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.error('[Service Worker] Asset fetch failed and not cached:', err);
      });
    })
  );
});
