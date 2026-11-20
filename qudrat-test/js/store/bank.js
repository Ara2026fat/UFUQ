/** Lazy-loaded topic banks: data/bank/<topic>.json → repo.addSeed. Keeps first paint light and localStorage empty of seed data. */
import { repo } from './repo.js';

const loaded = new Map();           // topic -> Promise
export const passages = {};         // id -> {title, paras}
let INDEX = null, failed = false;
export const bankFailed = () => failed;
/** Bank location. Default: same site. Can point to a shared host (one bank for several apps) via localStorage 'qd1:bankUrl' or window.QK_BANK_URL. */
const BASE = (() => { try { return window.QK_BANK_URL || localStorage.getItem('qd1:bankUrl') || 'data/bank/'; } catch (e) { return 'data/bank/'; } })();

export function bankIndex() {
  return INDEX ? Promise.resolve(INDEX)
    : fetch(BASE + 'index.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((j) => (INDEX = j));
}
export const bankCounts = () => INDEX || {};

export function loadBank(topic) {
  if (!loaded.has(topic)) {
    loaded.set(topic, fetch(`${BASE}${topic}.json`).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((j) => { Object.assign(passages, j.passages || {}); repo.addSeed(j.questions || []); return j.questions.length; })
      .catch(() => { loaded.delete(topic); failed = true; return 0; }));
  }
  return loaded.get(topic);
}
export const loadBanks = (topics) => Promise.all(topics.map(loadBank));
export const loadAllBanks = async () => { const i = await bankIndex(); return loadBanks(Object.keys(i)); };
export const isLoaded = (topic) => loaded.has(topic);
