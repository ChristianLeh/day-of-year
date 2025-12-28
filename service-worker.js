// Versionieren für Updates
const CACHE_NAME = "daycounter-v0.0.2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/doy-icon-72.png",
  "./icons/doy-icon-96.png",
  "./icons/doy-icon-144.png",
  "./icons/doy-icon-192.png",
  "./icons/doy-icon-512.png"
];

/* ------------------ Install ------------------ */
self.addEventListener("install", event => {
  // Sofort aktivieren
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

/* ------------------ Activate ------------------ */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

/* ------------------ Fetch ------------------ */
self.addEventListener("fetch", event => {
  // Network-first für Navigation (HTML)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Update Cache
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Offline-First für alle anderen Assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

/* ------------------ Skip Waiting (für Banner + Reload) ------------------ */
self.addEventListener("message", event => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
