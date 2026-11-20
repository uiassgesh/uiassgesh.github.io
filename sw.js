const CACHE = 'snow-gesh-v61-github-pages'
const SHELL = ['./', './index.html', './offline.html', './manifest.webmanifest']
const MEDIA = [
  './media/sheregesh-chairlift-base.jpg',
  './logo-mark.png',
  './icon-192.png',
  './media/rider.jpg',
  './media/forest.jpg',
  './media/resort-night.jpg',
  './media/resort.jpg',
  './media/lifts.jpg',
  './media/ride-demo.mp4',
  './media/forest-demo.mp4',
  './media/evening-demo.mp4',
]

async function cacheOne(cache, url) {
  try {
    const response = await fetch(url, { cache: 'reload' })
    if (response.ok) await cache.put(url, response)
  } catch { /* Один файл не должен мешать установке всего приложения. */ }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await Promise.all([...SHELL, ...MEDIA].map(url => cacheOne(cache, url)))
    try {
      const response = await fetch('./index.html', { cache: 'reload' })
      if (!response.ok) return
      const html = await response.clone().text()
      await cache.put('./index.html', response)
      const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
        .map(match => match[1])
        .filter(path => /^(?:\.?\/)?assets\//.test(path))
      await Promise.all(assets.map(url => cacheOne(cache, url)))
    } catch { /* Навигация использует уже сохранённую оболочку. */ }
  })())
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys()
  await Promise.all(keys.filter(key => key.startsWith('snow-gesh-') && key !== CACHE).map(key => caches.delete(key)))
  await self.clients.claim()
})()))

async function networkWithTimeout(request, milliseconds = 6000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), milliseconds)
  try { return await fetch(request, { signal: controller.signal }) }
  finally { clearTimeout(timer) }
}

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await networkWithTimeout(request)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const cache = await caches.open(CACHE)
        await cache.put('./index.html', response.clone())
        return response
      } catch {
        return await caches.match('./index.html') || await caches.match('./offline.html') || Response.error()
      }
    })())
    return
  }

  if (/\/(media|assets|models)\//.test(url.pathname) || ['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(request)
      if (cached) return cached
      try {
        const response = await networkWithTimeout(request, 12000)
        if (response.status === 200) {
          const cache = await caches.open(CACHE)
          await cache.put(request, response.clone())
        }
        return response
      } catch { return Response.error() }
    })())
  }
})
