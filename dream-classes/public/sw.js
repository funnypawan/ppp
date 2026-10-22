// Dream Classes service worker — network-first app shell + offline fallback.
// Protected API/media responses are never cached.
const C = 'dream-v2';
const SHELL = ['/', '/css/style.css', '/manifest.webmanifest', '/icons/icon-512.png'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
));

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/uploads/')) return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(e.request);
      if (u.origin === self.location.origin && fresh.ok && (SHELL.includes(u.pathname) || u.pathname.startsWith('/css/') || u.pathname.startsWith('/icons/') || u.pathname.startsWith('/js/'))) {
        const cache = await caches.open(C);
        await cache.put(e.request, fresh.clone());
      }
      return fresh;
    } catch {
      return (await caches.match(e.request)) || (await caches.match('/')) || Response.error();
    }
  })());
});

self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : { title: 'Dream Classes', body: 'New update' };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: '/icons/icon-512.png', badge: '/icons/icon-512.png', data: { url: d.url || '/' } }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow(e.notification.data?.url || '/');
  }));
});
