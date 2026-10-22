// Dream Classes service worker — app-shell cache + offline page. Protected media is NOT cached.
const C = 'dream-v1';
const SHELL = ['/', '/css/style.css', '/manifest.webmanifest', '/icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.pathname.startsWith('/api/') || u.pathname.startsWith('/uploads/')) return; // always network for data/media
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
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
