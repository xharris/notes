const static_dev = 'themepark-v1'
const assets = ['/', '/index.html', '/']

self.addEventListener('install', (installEvent) => {
  installEvent.waitUntil(
    caches.open(static_dev).then((cache) => {
      cache.addAll(assets)
    })
  )
})
