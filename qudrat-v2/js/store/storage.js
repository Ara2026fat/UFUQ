/**
 * Storage adapter. Today: localStorage (falls back to memory when blocked).
 * Later: swap this file for an API client; nothing above it changes.
 */
const NS = 'qd1:';
const mem = new Map();

function ls() {
  try { const k = '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch { return null; }
}
const store = ls();
export const storageMode = store ? 'localStorage' : 'memory';

export const storage = {
  get(key, fallback) {
    try {
      const raw = store ? store.getItem(NS + key) : mem.get(NS + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    const raw = JSON.stringify(value);
    try { store ? store.setItem(NS + key, raw) : mem.set(NS + key, raw); } catch { mem.set(NS + key, raw); }
  },
  remove(key) { try { store ? store.removeItem(NS + key) : mem.delete(NS + key); } catch { /* noop */ } },
  keys() {
    if (!store) return [...mem.keys()].map((k) => k.slice(NS.length));
    return Object.keys(store).filter((k) => k.startsWith(NS)).map((k) => k.slice(NS.length));
  },
};
