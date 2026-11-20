// Offline shell: network-first (always fresh while online), cache fallback when offline.
// Audio is left to the network (range requests). Bump CACHE to invalidate.
const CACHE = 'qudrat-shell-v148';
const OFF = 'ufuq-offline-v1'; // ما حمّله الطالب من الإعدادات للاستخدام بدون إنترنت — لا يُحذف مع تحديث النسخة
self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== OFF).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
// ردّ من الملف المحمّل مسبقاً، مع دعم Range (للتقديم والتأخير في الفيديو)
async function fromOffline(r) {
  const c = await caches.open(OFF), hit = await c.match(r, { ignoreSearch: true });
  if (!hit) return null;
  const rg = r.headers.get('range');
  if (!rg) return hit;
  const m = /bytes=(\d*)-(\d*)/.exec(rg), buf = await hit.arrayBuffer(), n = buf.byteLength;
  const a = m && m[1] ? +m[1] : 0, b = m && m[2] ? Math.min(+m[2], n - 1) : n - 1;
  return new Response(buf.slice(a, b + 1), { status: 206, headers: { 'Content-Type': hit.headers.get('Content-Type') || 'video/mp4', 'Content-Range': `bytes ${a}-${b}/${n}`, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', (e) => {
  const r = e.request; const u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const big = u.pathname.includes('/audio/') || u.pathname.includes('/media/');
  if (big) { e.respondWith(fromOffline(r).then((x) => x || fetch(r))); return; }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    try { const res = await fetch(r); if (res.ok) c.put(r, res.clone()); return res; }
    catch (err) { const hit = (await c.match(r)) || (await fromOffline(r)); if (hit) return hit; throw err; }
  }));
});
