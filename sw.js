/* Service worker for FX Discipline — enables offline app-shell caching.
   This is a real file (not a Blob URL), which is required for
   registration to work reliably across browsers. */
const CACHE_NAME = "fx-discipline-v3";
const PRECACHE_URLS = [
  "/", "/index.html", "/manifest.json",
  "/icons/icon-192.png", "/icons/icon-512.png",
  "/icons/icon-192-maskable.png", "/icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Network-first: always try to get the freshest version when online,
  // so updates to the app are picked up immediately on next load.
  // Only fall back to the cached copy if the network request fails
  // (i.e. genuinely offline), which is what offline support is for.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
