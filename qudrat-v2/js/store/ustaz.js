/**
 * Ustaz corner + learning-track store. Contract: docs/learn-contract.md
 * localStorage: qd1:ustaz (items meta) / qd1:unitprog (progress); IndexedDB 'ufuq-ustaz' (media blobs).
 * Every storage access is guarded; an in-memory fallback keeps the session working.
 */
export const STAGES = ['idea', 'rule', 'example', 'corner'];
const K_ITEMS = 'qd1:ustaz', K_PROG = 'qd1:unitprog';
const BY = 'ustaz';

const mem = { items: {}, prog: {}, blobs: new Map() };
let unitsCache = null, shipped = null;

function lsGet(key, fallback) {
  try { const r = globalThis.localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function lsSet(key, val) {
  try { globalThis.localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
}
const readItems = () => { const v = lsGet(K_ITEMS, null); return v && typeof v === 'object' ? v : mem.items; };
function writeItems(o) { mem.items = o; lsSet(K_ITEMS, o); }
const readProg = () => { const v = lsGet(K_PROG, null); return v && typeof v === 'object' ? v : mem.prog; };
function writeProg(o) { mem.prog = o; lsSet(K_PROG, o); }
const key = (u, s) => `${u}:${s}`;

/* ---------- IndexedDB blobs ---------- */
let dbP = null;
function db() {
  if (dbP) return dbP;
  dbP = new Promise((res, rej) => {
    try {
      const r = globalThis.indexedDB.open('ufuq-ustaz', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('blobs');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  dbP.catch(() => {});
  return dbP;
}
async function putBlob(id, blob) {
  mem.blobs.set(id, blob);
  try {
    const d = await db();
    await new Promise((res, rej) => { const t = d.transaction('blobs', 'readwrite'); t.objectStore('blobs').put(blob, id); t.oncomplete = res; t.onerror = () => rej(t.error); });
  } catch { /* kept in memory only */ }
}
async function getBlob(id) {
  try {
    const d = await db();
    const b = await new Promise((res, rej) => { const q = d.transaction('blobs').objectStore('blobs').get(id); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
    if (b) return b;
  } catch { /* fall through */ }
  return mem.blobs.get(id) || null;
}
async function delBlob(id) {
  mem.blobs.delete(id);
  try {
    const d = await db();
    await new Promise((res, rej) => { const t = d.transaction('blobs', 'readwrite'); t.objectStore('blobs').delete(id); t.oncomplete = res; t.onerror = () => rej(t.error); });
  } catch { /* ignore */ }
}

/* ---------- data ---------- */
export async function getUnits() {
  if (unitsCache) return unitsCache;
  try { const r = await fetch('data/learn/units.json'); unitsCache = await r.json(); } catch { unitsCache = { version: 1, tracks: [], units: {} }; }
  return unitsCache;
}

export async function loadShipped() {
  if (shipped) return shipped;
  shipped = { items: {} };
  try {
    const r = await fetch('data/learn/ustaz-media.json');
    if (r.ok) { const j = await r.json(); if (j && j.items && typeof j.items === 'object') shipped = j; }
  } catch { /* manifest absent: empty */ }
  return shipped;
}

export function listItems(unitId, stage) {
  const k = key(unitId, stage);
  const sh = ((shipped && shipped.items && shipped.items[k]) || []).map((i) => ({ ...i, by: BY, shipped: true }));
  const loc = (readItems()[k] || []).map((i) => ({ ...i, by: BY }));
  return [...sh, ...loc].sort((a, b) => (a.ts || 0) - (b.ts || 0));
}

const uid = () => 'it_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export async function addItem(unitId, stage, item, blob) {
  const it = { id: uid(), type: 'text', title: '', text: '', ts: Date.now(), ...item, by: BY };
  if (blob) { it.blobId = it.id; await putBlob(it.blobId, blob); }
  const all = { ...readItems() };
  const k = key(unitId, stage);
  all[k] = [...(all[k] || []), it];
  writeItems(all);
  return it;
}

export async function removeItem(unitId, stage, id) {
  const all = { ...readItems() };
  const k = key(unitId, stage);
  const found = (all[k] || []).find((i) => i.id === id);
  all[k] = (all[k] || []).filter((i) => i.id !== id);
  writeItems(all);
  if (found && found.blobId) await delBlob(found.blobId);
}

export async function renameItem(unitId, stage, id, title) {
  const all = { ...readItems() }; const k = key(unitId, stage);
  all[k] = (all[k] || []).map((i) => (i.id === id ? { ...i, title } : i));
  writeItems(all);
}

/** dir: -1 = up, +1 = down (swaps timestamps with the neighbour among local items). */
export async function moveItem(unitId, stage, id, dir) {
  const all = { ...readItems() }; const k = key(unitId, stage);
  const arr = [...(all[k] || [])].sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const i = arr.findIndex((x) => x.id === id), j = i + (dir < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= arr.length) return;
  const t = arr[i].ts; arr[i] = { ...arr[i], ts: arr[j].ts }; arr[j] = { ...arr[j], ts: t };
  if (arr[i].ts === arr[j].ts) { arr[i].ts += dir; }
  all[k] = arr; writeItems(all);
}

export async function mediaURL(item) {
  if (!item) return '';
  if (item.blobId) {
    const b = await getBlob(item.blobId);
    if (b) return URL.createObjectURL(b);
  }
  return item.src || '';
}

/* ---------- export / import ---------- */
function blobToB64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1] || '');
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}
function b64ToBlob(b64, type) {
  const bin = atob(b64); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: type || 'application/octet-stream' });
}

export async function exportBundle() {
  const items = readItems(); const media = {};
  for (const list of Object.values(items)) {
    for (const it of list) {
      if (!it.blobId) continue;
      const b = await getBlob(it.blobId);
      if (b) media[it.blobId] = { type: b.type, data: await blobToB64(b) };
    }
  }
  return new Blob([JSON.stringify({ kind: 'ufuq-ustaz-bundle', version: 1, items, progress: readProg(), media })], { type: 'application/json' });
}


/* ---------- ZIP (بلا ضغط: الفيديو مضغوط أصلًا) للإرسال عبر واتساب ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
const le = (n, b) => { const a = new Uint8Array(b); for (let i = 0; i < b; i++) a[i] = (n >>> (8 * i)) & 255; return a; };
async function makeZip(files) { // files: [{name, data:Uint8Array}]
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), crc = crc32(f.data);
    const lh = [le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(crc, 4), le(f.data.length, 4), le(f.data.length, 4), le(nm.length, 2), le(0, 2), nm];
    parts.push(...lh, f.data);
    cen.push([le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(crc, 4), le(f.data.length, 4), le(f.data.length, 4), le(nm.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(off, 4), nm]);
    off += 30 + nm.length + f.data.length;
  }
  const cstart = off; let csize = 0;
  for (const c of cen) for (const x of c) { parts.push(x); csize += x.length; }
  parts.push(le(0x06054b50, 4), le(0, 2), le(0, 2), le(files.length, 2), le(files.length, 2), le(csize, 4), le(cstart, 4), le(0, 2));
  return new Blob(parts, { type: 'application/zip' });
}
async function readZip(file) { // STORE فقط (ما نكتبه نحن)
  const u = new Uint8Array(await file.arrayBuffer()), dv = new DataView(u.buffer), dec = new TextDecoder(), out = {};
  let e = u.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('zip');
  const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('zip');
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 24, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = dec.decode(u.subarray(p + 46, p + 46 + nl));
    if (method !== 0) throw new Error('unsupported');
    const lnl = dv.getUint16(lo + 26, true), lel = dv.getUint16(lo + 28, true), ds = lo + 30 + lnl + lel;
    out[name] = u.slice(ds, ds + size);
    p += 46 + nl + el + cl;
  }
  return out;
}

/** يجمع كل ما أضافه الأستاذ في ملف zip واحد (نصوص + وسائط) جاهز للإرسال. */
export async function exportZip() {
  const items = readItems(), files = [], media = {}; let count = 0;
  for (const list of Object.values(items)) {
    for (const it of list) {
      count++;
      if (!it.blobId) continue;
      const b = await getBlob(it.blobId);
      if (b) { const nm = 'media/' + it.blobId; media[it.blobId] = { type: b.type, file: nm }; files.push({ name: nm, data: new Uint8Array(await b.arrayBuffer()) }); }
    }
  }
  files.unshift({ name: 'bundle.json', data: new TextEncoder().encode(JSON.stringify({ kind: 'ufuq-ustaz-bundle', version: 2, items, progress: readProg(), media })) });
  return { blob: await makeZip(files), count, name: `ustaz-ufuq-${new Date().toISOString().slice(0, 10)}.zip` };
}

export async function importBundle(file) {
  let j, zf = null;
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (head[0] === 0x50 && head[1] === 0x4B) { zf = await readZip(file); j = JSON.parse(new TextDecoder().decode(zf['bundle.json'])); } else j = JSON.parse(await file.text());
  if (!j || j.kind !== 'ufuq-ustaz-bundle') throw new Error('bad bundle');
  const all = { ...readItems() };
  for (const [k, list] of Object.entries(j.items || {})) {
    const have = new Set((all[k] || []).map((i) => i.id));
    all[k] = [...(all[k] || []), ...list.filter((i) => !have.has(i.id)).map((i) => ({ ...i, by: BY }))];
  }
  for (const [id, m] of Object.entries(j.media || {})) await putBlob(id, m.file && zf ? new Blob([zf[m.file]], { type: m.type }) : b64ToBlob(m.data, m.type));
  writeItems(all);
  return Object.values(j.items || {}).reduce((n, l) => n + l.length, 0);
}

/* ---------- progress ---------- */
export function getProgress(unitId) {
  const p = readProg()[unitId];
  return { stages: { ...(p && p.stages) }, checked: p && typeof p.checked === 'boolean' ? p.checked : null, ts: (p && p.ts) || 0 };
}
function save(unitId, p) { const all = { ...readProg() }; all[unitId] = { ...p, ts: Date.now() }; writeProg(all); }
export function markStage(unitId, stage) {
  const p = getProgress(unitId); p.stages[stage] = true; save(unitId, p);
}
export function setChecked(unitId, ok) {
  const p = getProgress(unitId); p.checked = !!ok; save(unitId, p);
}
export function unitStatus(unitId) {
  const p = getProgress(unitId);
  if (p.checked === true) return 'done';
  return Object.keys(p.stages).length || p.checked === false ? 'progress' : 'new';
}
