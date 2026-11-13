const CACHE = 'snow-gesh-v5-github-pages'
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE)) })
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (request.mode === 'navigate') { event.respondWith(fetch(request)); return }
  if (url.origin === location.origin && /\/(media|assets)\//.test(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, response.clone())))
      return response
    })))
  }
})
