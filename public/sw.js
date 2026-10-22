// Bump when the caching strategy changes; old caches are dropped on activate.
const CACHE_NAME = "maten-v11";

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

/**
 * The pages behind the login wall. Their HTML is cached so the router can show
 * something instantly, and refreshed in the background. Paths under /login,
 * /signup and /auth are never cached.
 */
const isNavPage = (url) =>
  url.pathname === "/recipes" ||
  url.pathname === "/recipes/new" ||
  url.pathname.startsWith("/recipes/") ||
  url.pathname === "/plans" ||
  url.pathname === "/plans/new" ||
  url.pathname.startsWith("/plans/") ||
  url.pathname === "/shopping" ||
  url.pathname === "/library" ||
  url.pathname === "/settings";

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // A real navigation always goes to the network: it is the moment a login or
  // logout must take effect, so nothing stale may be shown. The page cache is
  // dropped too, since the user the cached pages were built for may have
  // changed.
  if (request.mode === "navigate") {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.delete(request)),
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(event, request));
    return;
  }

  // What is left is either an API call or the router's page fetch. The
  // router's fetch carries no Accept: text/html marker (it is a plain
  // fetch() with Accept: */*), so match by path instead and confirm HTML
  // by the response's content type. APIs always hit the network so data
  // changes are never delayed.
  if (isNavPage(url)) {
    event.respondWith(
      staleWhileRevalidate(event, request, true).then(async (response) => {
        if (isHtmlResponse(response)) return response;
        // Not HTML after all (an API hit on the same path); don't serve or
        // keep it, fetch the real thing from the network.
        await (await caches.open(CACHE_NAME)).delete(request);
        return fetch(request);
      }),
    );
  }
});

const isHtmlResponse = (response) =>
  (response.headers.get("content-type") ?? "").includes("text/html");

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

/**
 * Stale-while-revalidate. The cached copy is returned the moment it exists;
 * the network request continues in the background via event.waitUntil, so
 * it finishes even if the service worker would otherwise be idle.
 *
 * With `notify`, a page that was shown from the cache is told once a fresh
 * copy has been stored *and actually differs* from the one it is showing,
 * so the client can swap in the newer content. A byte-identical page (the
 * common case) never interrupts the user.
 */
async function staleWhileRevalidate(event, request, notify = false) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    const refresh = fetch(request)
      .then(async (response) => {
        if (response.ok) {
          const previous = await cached.clone().text();
          const fresh = await response.clone().text();
          await cache.put(request, response.clone());
          if (notify && fresh !== previous) {
            const clients = await self.clients.matchAll();
            for (const client of clients) {
              client.postMessage({ type: "page-refreshed", url: request.url });
            }
          }
        }
      })
      .catch(() => {});
    event.waitUntil(refresh);
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}
