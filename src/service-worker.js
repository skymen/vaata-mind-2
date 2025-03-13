// Service Worker for Vaata Mind PWA
const CACHE_NAME = "vaata-mind-v1";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/version.json",
  "/logo.svg",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/site.webmanifest",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log("Service Worker activated");
        return self.clients.claim();
      })
  );
});

// Network-first approach
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (
    !event.request.url.startsWith(self.location.origin) &&
    !event.request.url.startsWith("https://cdnjs.cloudflare.com")
  ) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(event.request)
      .then((response) => {
        // Clone the response - one to return, one to cache
        const responseToCache = response.clone();

        // Only cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch((error) => {
        console.log("Fetch failed; returning cached response instead.", error);

        // If network fails, try the cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If there's nothing in cache either, you could return a custom offline page
          // return caches.match('/offline.html');
        });
      })
  );
});
