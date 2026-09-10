const VERSION = 'bizforce-pwa-v2'
const PRECACHE = ['/manifest.webmanifest', '/icon-192x192.png', '/icon-512x512.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Never cache HTML or RSC payloads containing response-specific nonces.
  if (req.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return

  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => new Response('You are offline. Reconnect to load BizForce.', { status: 503, headers: { 'Content-Type': 'text/plain' } })))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(VERSION).then((cache) => cache.put(req, copy))
        return res
      }))
    )
    return
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic' && !res.headers.get('Cache-Control')?.includes('no-store') && !res.headers.get('Content-Type')?.includes('text/html')) {
        const copy = res.clone()
        caches.open(VERSION).then((cache) => cache.put(req, copy))
      }
      return res
    }))
  )
})
