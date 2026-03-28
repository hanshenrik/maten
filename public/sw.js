const CACHE_NAME = "maten-v2"; // Increment version
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/favicon.svg",
  "/favicon.png",
  "/apple-touch-icon.png",
];

// Install: Cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }),
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch: Optimized strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and external origins (except some CDNs if needed)
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // 2. Do NOT intercept navigations (let the browser handle SSR pages directly for speed)
  if (request.mode === "navigate") {
    // We let the browser handle it. This removes SW overhead for main page loads.
    return;
  }

  // 3. Stale-While-Revalidate for static assets (CSS, JS, Images, Fonts)
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|json)$/) &&
    !url.pathname.includes("manifest.json");

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((response) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
          return response || fetchPromise;
        });
      }),
    );
  }
});
