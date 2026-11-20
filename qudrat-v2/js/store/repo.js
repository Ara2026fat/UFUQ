import { isStaff } from '../core/staff.js';
/** Data access layer. Views never touch storage directly. */
import { storage } from './storage.js';
import { SEED as DEMO } from '../data/demo-questions.js';
import { GENERATED } from '../data/generated-questions.js';
import { USTAZ } from '../data/ustaz-questions.js';

const BASE = [...USTAZ, ...DEMO, ...GENERATED];

const listeners = new Set();
const emit = () => listeners.forEach((f) => f());

/**
 * Questions = shipped seed (in memory, may grow as topic banks lazy-load) + a small overlay in storage:
 *   qedits  {id: question}  edited/status-changed copies of seed questions
 *   qcustom [question]      questions created in the app (generated, teacher-made)
 *   qgone   [id]            removed ids
 * The seed itself is never written to localStorage (thousands of questions would overflow it).
 */
const seed = new Map(BASE.map((x) => [x.id, x]));
let cache = null;
const bust = () => { cache = null; };
let migrated = false;
function migrate() {
  if (migrated) return; migrated = true;
  const legacy = storage.get('questions');
  if (!legacy) return;
  const edits = storage.get('qedits', {}), custom = storage.get('qcustom', []), have = new Set(custom.map((x) => x.id));
  legacy.forEach((x) => {
    const s0 = seed.get(x.id);
    if (!s0) { if (!have.has(x.id)) custom.push(x); }
    else if ((x.updatedAt || 0) > (s0.updatedAt || 0) || x.status !== s0.status) edits[x.id] = x;
  });
  storage.set('qedits', edits); storage.set('qcustom', custom); storage.remove('questions');
}
function allQ() {
  if (cache) return cache;
  migrate();
  const edits = storage.get('qedits', {}), gone = new Set(storage.get('qgone', []));
  const list = [];
  seed.forEach((x, id) => { if (!gone.has(id)) list.push(edits[id] || x); });
  storage.get('qcustom', []).forEach((x) => { if (!gone.has(x.id) && !seed.has(x.id)) list.push(x); });
  return (cache = list);
}
const byId = () => { const m = new Map(); allQ().forEach((x) => m.set(x.id, x)); return m; };
let idx = null;
const attemptsList = () => storage.get('attempts', []);

export const repo = {
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  // session / role (demo switcher — real auth comes with the backend phase)
  role() { return isStaff() ? storage.get('role', 'student') : 'student'; },
  setRole(r) { storage.set('role', r); emit(); },

  // ---- questions ----
  questions: allQ,
  get: (id) => { if (!idx || idx.size !== allQ().length) idx = byId(); return idx.get(id); },
  /** Adds lazily-loaded seed questions (topic banks). */
  addSeed(list) { let n = 0; list.forEach((x) => { if (!seed.has(x.id)) { seed.set(x.id, x); n++; } }); if (n) { bust(); idx = null; emit(); } return n; },
  seedCount: () => seed.size,
  /** What a student can see: demo + approved, never twin-only. */
  practiceQuestions: () => allQ().filter((x) => !x.twinOnly && ['demo', 'approved', 'generated', 'ustaz', 'ufuq'].includes(x.status)),
  save(question) {
    const next = { ...question, updatedAt: Date.now() };
    if (seed.has(next.id)) { const e = storage.get('qedits', {}); e[next.id] = next; storage.set('qedits', e); }
    else { const c = storage.get('qcustom', []).filter((x) => x.id !== next.id); c.push(next); storage.set('qcustom', c); }
    bust(); idx = null; emit();
  },
  setStatus(id, status) {
    const x = repo.get(id); if (x) repo.save({ ...x, status });
  },
  remove(id) {
    storage.set('qgone', [...new Set([...storage.get('qgone', []), id])]);
    storage.set('qcustom', storage.get('qcustom', []).filter((x) => x.id !== id));
    const e = storage.get('qedits', {}); delete e[id]; storage.set('qedits', e);
    bust(); idx = null; emit();
  },

  // ---- attempts ----
  attempts: attemptsList,
  recordAttempt(a) {
    const list = attemptsList();
    list.push({ at: Date.now(), ...a });
    storage.set('attempts', list.slice(-2000));
    if (!a.correct) {
      const r = new Set(storage.get('resolved', [])); r.delete(a.qid); storage.set('resolved', [...r]);
    }
    emit();
  },
  tagLastAttempt(patch) {
    const list = attemptsList();
    if (list.length) { Object.assign(list[list.length - 1], patch); storage.set('attempts', list); }
  },
  resolve(qid) {
    const r = new Set(storage.get('resolved', [])); r.add(qid); storage.set('resolved', [...r]); emit();
  },
  flagForTeacher(qid, reason) {
    const f = storage.get('flags', []).filter((x) => x.qid !== qid);
    f.push({ qid, reason, at: Date.now() }); storage.set('flags', f); emit();
  },
  flags: () => storage.get('flags', []),

  /** latest attempt per question is wrong and not resolved by a correct twin */
  mistakes() {
    const resolved = new Set(storage.get('resolved', []));
    const last = new Map();
    for (const a of attemptsList()) last.set(a.qid, a);
    return [...last.values()]
      .filter((a) => !a.correct && !resolved.has(a.qid))
      .map((a) => ({ attempt: a, q: repo.get(a.qid) }))
      .filter((m) => m.q && !m.q.twinOnly)
      .reverse();
  },

  topicStats() {
    const s = {};
    for (const a of attemptsList()) {
      const t = (s[a.topic] ||= { n: 0, ok: 0, recent: [] });
      t.n++; if (a.correct) t.ok++;
      t.recent.push(a.correct ? 1 : 0); if (t.recent.length > 10) t.recent.shift();
    }
    for (const t of Object.values(s)) t.acc = Math.round((t.recent.reduce((x, y) => x + y, 0) / t.recent.length) * 100);
    return s;
  },

  mostMissed(limit = 5) {
    const m = new Map();
    for (const a of attemptsList()) {
      const e = m.get(a.qid) || { qid: a.qid, n: 0, wrong: 0 };
      e.n++; if (!a.correct) e.wrong++; m.set(a.qid, e);
    }
    return [...m.values()].filter((e) => e.wrong > 0).sort((a, b) => b.wrong - a.wrong).slice(0, limit)
      .map((e) => ({ ...e, q: repo.get(e.qid) })).filter((e) => e.q);
  },

  // ---- data tools (admin) ----
  exportAll() {
    return Object.fromEntries(storage.keys().map((k) => [k, storage.get(k)]));
  },
  importAll(obj) {
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.questions)) throw new Error('ملف غير صالح');
    for (const [k, v] of Object.entries(obj)) storage.set(k, v);
    emit();
  },
  resetAll() { storage.keys().forEach((k) => k !== 'role' && storage.remove(k)); emit(); },
  resetProgress() { ['attempts', 'resolved', 'flags'].forEach((k) => storage.remove(k)); emit(); },
};
