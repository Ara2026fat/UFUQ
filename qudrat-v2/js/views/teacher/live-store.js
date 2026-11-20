/** تخزين محلي (IndexedDB) لحصة مباشرة: الجلسة، بنك الأستاذ اليدوي، نتائج التقسيم، ومقاطع التسجيل. ARAFAT ALRAJHI © 2026 */
const DB = 'ufuq-live';
const idb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export const idbGet = async (k) => { const d = await idb(); return new Promise((res, rej) => { const q = d.transaction('s').objectStore('s').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
export const idbSet = async (k, v) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('s', 'readwrite'); t.objectStore('s').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); }); };
export const idbDel = async (k) => { const d = await idb(); return new Promise((res) => { const t = d.transaction('s', 'readwrite'); t.objectStore('s').delete(k); t.oncomplete = () => res(); t.onerror = () => res(); }); };
export const idbKeys = async (prefix) => { const d = await idb(); return new Promise((res, rej) => { const q = d.transaction('s').objectStore('s').getAllKeys(); q.onsuccess = () => res(q.result.filter((k) => String(k).startsWith(prefix))); q.onerror = () => rej(q.error); }); };
