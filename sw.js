const CACHE = "makro-v3";
const STATIC = ["fonts.googleapis.com", "fonts.gstatic.com", "unpkg.com"];

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = e.request.url;

  // Backend-API: immer Netzwerk
  if (url.includes("railway.app") || url.includes("api.anthropic.com")) return;

  // index.html: immer frisch vom Netzwerk, Cache nur als Offline-Fallback
  if (url.endsWith("/") || url.includes("index.html")) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Fonts & CDN-Bibliotheken: Cache-first (ändern sich nicht)
  if (STATIC.some(s => url.includes(s))) {
    e.respondWith(
      caches.match(e.request).then(r =>
        r || fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  // Alles andere: Netzwerk mit Cache-Fallback
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
