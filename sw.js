/* أُفق — عامل الخدمة: يجعل التطبيق يعمل بلا إنترنت ويحدّث نفسه بهدوء. */
const V = 'ufuq-v10';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* الصفحة: من الشبكة أولًا لتصل التحديثات، ومن الذاكرة عند انقطاعها.
   البقيّة: من الذاكرة أولًا لتفتح فورًا. */
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const isDoc = r.mode === 'navigate' || (r.headers.get('accept') || '').includes('text/html');
  if (isDoc) {
    e.respondWith(
      fetch(r).then(res => {
        const copy = res.clone();
        caches.open(V).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then(x => x || caches.match('./')))
    );
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {
    if (res && res.status === 200 && res.type === 'basic') {
      const copy = res.clone();
      caches.open(V).then(c => c.put(r, copy));
    }
    return res;
  }).catch(() => hit)));
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
