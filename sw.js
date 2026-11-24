const CACHE = "snow-gesh-v76-static";
const PAGES = "snow-gesh-v76-pages";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((cache) => cache.add("/")).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== PAGES).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(PAGES).then((cache) => cache.put("/", response.clone()));
      return response;
    }).catch(() => caches.match("/")));
    return;
  }
  if (!url.pathname.startsWith("/assets/") && !url.pathname.startsWith("/images/") && !url.pathname.startsWith("/fonts/") && !url.pathname.startsWith("/media/") && !url.pathname.match(/\.(png|webmanifest)$/)) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
    return response;
  })));
});
