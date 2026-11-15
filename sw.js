const CACHE = 'snow-gesh-v38-github-pages'
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE)) })
self.addEventListener('activate', event => event.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
])))
self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (request.mode === 'navigate') { event.respondWith(fetch(request)); return }
  if (url.origin === location.origin && /\/(media|assets|models)\//.test(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, response.clone())))
      return response
    })))
  }
})
