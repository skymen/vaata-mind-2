// Cache names
const STATIC_CACHE_NAME = "vaata-mind-static-v1";
const DYNAMIC_CACHE_NAME = "vaata-mind-dynamic-v1";

// Assets to cache
const ASSETS = [
  "/",
  "/index.html",
  "/app.js",
  "/logo.svg",
  "/logo_white.svg",
  "/favicon-96x96.png",
  "/manifest.json",
  "/styles/style.css",
  "/styles/menu.css",
  "/styles/editor.css",
  "/styles/explore.css",
  "/styles/search.css",
  "/styles/recommendation.css",
  "/styles/table.css",
  "/styles/settings.css",
  "/styles/components.css",
  "/styles/animations.css",
  "/styles/pomodoro.css",
  "/modules/Constants.js",
  "/modules/ViewManager.js",
  "/modules/Firebase.js",
  "/modules/Database.js",
  "/modules/NoteUtils.js",
  "/components/Autocomplete.js",
  "/components/DatePicker.js",
  "/components/DialogBox.js",
  "/components/NoteBadges.js",
  "/components/ProgressMenu.js",
  "/components/StatusMessage.js",
  "/components/SubscriptionAnimation.js",
  "/components/SyncBubble.js",
  "/views/MenuView.js",
  "/views/EditorView.js",
  "/views/ExploreView.js",
  "/views/RecommendationView.js",
  "/views/TableView.js",
  "/views/SettingsView.js",
  "/views/PomodoroView.js",
  "/views/SearchView.js",
  "/service-worker-registration.js",
  "/version.json",
  "/assets/notification.mp3"
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log("Caching static assets");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(
            (key) => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME
          )
          .map((key) => {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - respond with cached resources or fetch from network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache if it's not a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response since it can only be consumed once
          const responseToCache = response.clone();

          // Cache the new resource
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If fetch fails (offline), return a fallback
          if (event.request.url.indexOf(".html") > -1) {
            return caches.match("/index.html");
          }
        });
    })
  );
});
