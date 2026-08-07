/* Trénink – service worker: appka funguje i bez internetu */
const CACHE = "trenink-v5";
const ASSETS = [
  "./", "./index.html", "./manifest.json",
  "./icon-192.png", "./icon-512.png", "./icon-maskable.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  /* stránku ber nejdřív ze sítě (ať máš vždy nejnovější verzi),
     když není signál, sáhni do cache */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put("./index.html", copy));
          return resp;
        })
        .catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  /* ostatní soubory nejdřív z cache – rychlé a offline */
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return resp;
    }).catch(() => hit))
  );
});
