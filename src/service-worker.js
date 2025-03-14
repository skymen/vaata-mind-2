// Service Worker for Vaata Mind PWA
const CACHE_NAME = "vaata-mind-v2";

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
  // Core JS files
  "/app.js",
  "/service-worker-registration.js",
  // Module files
  "/modules/Constants.js",
  "/modules/ViewManager.js",
  "/modules/Database.js",
  "/modules/NoteUtils.js",
  // Component files
  "/components/StatusMessage.js",
  "/components/ProgressMenu.js",
  "/components/DatePicker.js",
  "/components/NoteBadges.js",
  "/components/Autocomplete.js",
  // View files
  "/views/EditorView.js",
  "/views/MenuView.js",
  "/views/ExploreView.js",
  "/views/RecommendationView.js",
  "/views/TableView.js",
  "/views/SettingsView.js",
  // CSS files
  "/styles/style.css",
  "/styles/editor.css",
  "/styles/menu.css",
  "/styles/explore.css",
  "/styles/recommendation.css",
  "/styles/table.css",
  "/styles/settings.css",
  "/styles/components.css",
  "/styles/animations.css",
  // External dependencies
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
      .catch((error) => {
        console.error("Failed to cache some assets:", error);
        // Continue with installation even if some assets fail to cache
        self.skipWaiting();
      })
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

// Modified fetch strategy: Cache-first for static assets, network-first for everything else
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests except for allowed CDNs
  if (
    !url.origin.startsWith(self.location.origin) &&
    !url.origin.startsWith("https://cdnjs.cloudflare.com")
  ) {
    return;
  }

  // Cache-first strategy for static assets
  const isStaticAsset = STATIC_ASSETS.some((asset) => {
    // Handle both absolute and relative URLs
    const assetUrl = asset.startsWith("http")
      ? asset
      : new URL(asset, self.location.origin).href;
    return url.href === assetUrl || url.pathname === asset;
  });

  if (isStaticAsset) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              }
              return networkResponse;
            })
            .catch((error) => {
              console.log("Failed to update cached asset:", error);
            });

          // Return cached response immediately
          return cachedResponse;
        }

        // If not in cache, fetch from network and cache
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  } else {
    // Network-first for dynamic content
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log("Network fetch failed; trying cache:", error);
          return caches.match(event.request);
        })
    );
  }
});

// Handle offline fallback
self.addEventListener("fetch", (event) => {
  // Only handle navigation requests that fail
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/index.html");
      })
    );
  }
});
