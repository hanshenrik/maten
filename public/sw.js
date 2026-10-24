// The app no longer has a service worker, but browsers keep running an old
// one until they fetch a replacement; a 404 here would leave it in place,
// serving stale pages from its cache. Browsers check this file on every visit,
// so this replacement takes over open tabs (it has no fetch handler, so their
// requests go straight to the network), deletes the caches and unregisters.
// Keep it until no device can have the old worker installed.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      await self.registration.unregister();
    })(),
  );
});
