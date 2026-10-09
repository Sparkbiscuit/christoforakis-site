/* Aloft offline cache, scoped to /aloft/ only.
   The game page is fetched from the network first so updates arrive right away, with the cached copy used offline.
   three.js comes from a pinned CDN URL that never changes, so it is kept in a cache of its own. */
const VERSION = 'aloft-0ce29fc769';
const CORE = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-64.png'];
const CDN_CACHE = 'aloft-cdn-three-0.170.0';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('aloft-') && k !== VERSION && k !== CDN_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) {
    if (!u.pathname.startsWith(new URL('./', location).pathname)) return;
    if (req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html')) {
      e.respondWith(fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(ca => ca.put('./', c)); } return res; })
        .catch(() => caches.match('./', { ignoreSearch: true })));
      return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(ca => ca.put(req, c)); } return res; })));
    return;
  }
  if (u.hostname === 'cdn.jsdelivr.net' && u.pathname.includes('/three@0.170.0/')) {
    e.respondWith(caches.open(CDN_CACHE).then(ca => ca.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok) ca.put(req, res.clone()); return res; }))));
  }
});
