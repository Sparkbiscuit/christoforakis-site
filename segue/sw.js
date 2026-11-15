/* Segue offline cache: the app shell, plus previews and artwork you've already heard and seen. */
const SHELL = 'segue-shell-v1';
const MEDIA = 'segue-media-v1';
const MEDIA_MAX = 400;
const scope = self.registration.scope;

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(SHELL).then(c => c.addAll([scope, scope + 'manifest.webmanifest', scope + 'icons/icon.svg']).catch(() => {}))); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![SHELL, MEDIA].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function trim() {
  const c = await caches.open(MEDIA);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MEDIA_MAX; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // previews and artwork: cache first
  if (/audio-ssl\.itunes\.apple\.com$|mzstatic\.com$/.test(url.hostname) && !req.headers.has('range')) {
    e.respondWith((async () => {
      const c = await caches.open(MEDIA);
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok && (res.type === 'cors' || res.type === 'basic')) { c.put(req, res.clone()); trim(); }
      return res;
    })());
    return;
  }
  if (!url.href.startsWith(scope)) return;
  // hashed build assets never change
  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(SHELL).then(async c => (await c.match(req)) || fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; })));
    return;
  }
  // pages and config: network first, fall back to cache
  e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(SHELL).then(c => c.put(req, r.clone())); return r; })
    .catch(async () => (await caches.match(req)) || (req.mode === 'navigate' ? caches.match(scope) : Response.error())));
});
