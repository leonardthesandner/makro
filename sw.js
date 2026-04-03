const CACHE = "makro-v4";
const ASSETS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
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
  if (e.request.url.includes("railway.app") ||
      e.request.url.includes("anthropic.com")) return;

  if (e.request.url.includes("fonts.googleapis.com") ||
      e.request.url.includes("fonts.gstatic.com") ||
      e.request.url.includes("unpkg.com")) {
    e.respondWith(
      caches.open(CACHE).then(c =>
        c.match(e.request).then(r => r || fetch(e.request).then(res => {
          c.put(e.request, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
