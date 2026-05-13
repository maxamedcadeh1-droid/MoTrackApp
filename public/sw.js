/**
 * MoTrack Service Worker
 * Handles caching, offline support, and background sync
 */

const CACHE_NAME = 'motrack-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];
const IS_LOCALHOST = ['localhost', '127.0.0.1', '::1'].includes(self.location.hostname);

// Install event - cache static assets
self.addEventListener('install', (event) => {
  if (IS_LOCALHOST) {
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (IS_LOCALHOST) {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => Promise.all(cacheNames.map((name) => caches.delete(name))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
    return;
  }

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  const requestUrl = new URL(event.request.url);

  // Never cache Vite dev-server files. They must always come from the server.
  if (IS_LOCALHOST || requestUrl.pathname.startsWith('/@vite') || requestUrl.pathname.startsWith('/src/') || requestUrl.searchParams.has('t')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put('/index.html', responseClone);
              });
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html').then((cachedResponse) => cachedResponse || caches.match('/offline.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version, but also update cache in background
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Update cache if we got a valid response
              if (networkResponse && networkResponse.status === 200) {
                const cacheClone = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, cacheClone);
                  });
              }
              return networkResponse;
            })
            .catch(() => {
              // Network failed, return cached version (already returned above)
              return cachedResponse;
            });

          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline - return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            // Return empty response for other requests
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'motrack-sync') {
    event.waitUntil(
      // When back online, sync any pending actions
      syncPendingActions()
    );
  }
});

async function syncPendingActions() {
  // This would sync any pending habit completions, etc.
  // Implementation depends on your offline queue system
  console.log('MoTrack: Background sync completed');
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/motrack-icon-192.png',
    badge: '/motrack-icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
    },
    actions: [
      {
        action: 'open',
        title: 'Open MoTrack',
      },
      {
        action: 'close',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MoTrack', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
