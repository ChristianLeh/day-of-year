const CACHE_NAME = "DayOfYear-v0.0.6";

const STATIC_ASSETS = [
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
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
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

  // Kontrolle sofort übernehmen
  self.clients.claim();
});

/* ------------------ Fetch ------------------ */
self.addEventListener("fetch", event => {
  const request = event.request;

  // HTML: Network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // JS & CSS: Network first (!!!)
  if (
    request.destination === "script" ||
    request.destination === "style"
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Sonst: Cache first
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});

/* ------------------ Skip Waiting ------------------ */
self.addEventListener("message", event => {
  if (event.data?.action === "skipWaiting") {
    self.skipWaiting();
  }
});
