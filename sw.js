const CACHE = 'bible-v9';
const STATIC = [
  './', './index.html', './app.js', './style.css',
  './fonts/fonts.css', './fonts/Pretendard-Regular.woff2',
  './fonts/Pretendard-SemiBold.woff2', './fonts/Pretendard-Bold.woff2',
  './icon.svg', './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Bible data (bible-*.json): cache-first, background refresh
  if (url.pathname.includes('/data/bible-')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
  // Static assets: cache-first
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(r => {
      if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
      return r;
    }))
  );
});
