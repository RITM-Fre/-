/* ══════════════════════════════════════════════════════════════════════════
   Signal Console — service worker
   Strategy:  precache the shell on install, then
              · same-origin  → stale-while-revalidate (instant, self-updating)
              · CDN assets   → cache-first (they are versioned/immutable)
              · navigations  → network-first with an offline shell fallback
   ══════════════════════════════════════════════════════════════════════════ */

const VERSION = 'v2.0.0';
const SHELL_CACHE = `signal-shell-${VERSION}`;
const RUNTIME_CACHE = `signal-runtime-${VERSION}`;

/* Everything the app needs to boot with the network switched off. */
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/app.css',
  './assets/js/core.js',
  './assets/js/tools-encoding.js',
  './assets/js/tools-cipher.js',
  './assets/js/tools-hash.js',
  './assets/js/tools-utility.js',
  './assets/js/tools-media.js',
  './assets/js/boot.js',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

/* Third-party libraries — pinned versions, safe to cache forever. */
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js',
  'https://cdn.jsdelivr.net/npm/hash-wasm@4',
  'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    await shell.addAll(SHELL_ASSETS.map((u) => new Request(u, { cache: 'reload' })))
      .catch((err) => console.warn('[Signal SW] shell precache partial:', err));

    const cdn = await caches.open(RUNTIME_CACHE);
    await Promise.all(CDN_ASSETS.map((url) =>
      fetch(url, { mode: 'cors' })
        .then((res) => (res && res.ok ? cdn.put(url, res) : null))
        .catch(() => null)
    ));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
    );
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.disable();
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never intercept API calls — they must always hit the worker/network.
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests → network first, fall back to the cached shell.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Third-party CDN → cache first.
  if (url.origin !== self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return hit || Response.error();
      }
    })());
    return;
  }

  // Same-origin assets → stale-while-revalidate.
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
