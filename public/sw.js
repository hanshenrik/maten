// Bump when the caching strategy changes; old caches are dropped on activate.
const CACHE_NAME = "maten-v8";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Astro puts a content hash in these file names, so they never change. */
const isImmutableAsset = (url) => url.pathname.startsWith("/_astro/");

/** Icons, the manifest and the like: cached, but refreshed in the background. */
const isStaticAsset = (url) =>
  /\.(png|svg|jpg|jpeg|webp|ico|woff2?|json|js|css)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pages are rendered on the server and depend on who is logged in, so they
  // always go to the network. Same for anything that isn't a same-origin GET.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.mode === "navigate"
  ) {
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached || network;
}
