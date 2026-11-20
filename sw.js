const CACHE = 'snow-gesh-v58-github-pages'
const SHELL = ['./', './index.html', './offline.html', './manifest.webmanifest']
self.addEventListener('install', event => { event.waitUntil((async () => { const cache = await caches.open(CACHE); await cache.addAll(SHELL); const response = await fetch('./index.html'); const html = await response.clone().text(); await cache.put('./index.html', response); const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]).filter(path => /^(?:\.?\/)?assets\//.test(path)); if (assets.length) await cache.addAll(assets) })()) })
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting() })
self.addEventListener('activate', event => event.waitUntil((async () => { await self.clients.claim(); const keys = await caches.keys(); await Promise.all(keys.filter(key => key.startsWith('snow-gesh-') && key !== CACHE).map(key => caches.delete(key))) })()))
self.addEventListener('fetch', event => {
  const request = event.request; if (request.method !== 'GET') return
  const url = new URL(request.url); if (url.origin !== location.origin) return
  if (request.mode === 'navigate') { event.respondWith((async () => { try { const response = await fetch(request); if (response.ok) { const cache = await caches.open(CACHE); await cache.put('./index.html', response.clone()) } return response } catch { return await caches.match('./index.html') || await caches.match('./offline.html') || Response.error() } })()); return }
  if (/\/(media|assets|models)\//.test(url.pathname) || ['style', 'script', 'image', 'font'].includes(request.destination)) { event.respondWith((async () => { const cached = await caches.match(request); if (cached) return cached; try { const response = await fetch(request); if (response.ok) { const cache = await caches.open(CACHE); await cache.put(request, response.clone()) } return response } catch { return Response.error() } })()) }
})
