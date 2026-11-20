/**
 * Adaptive engine — ported from أُفق (Ufuq). Decides WHAT the student practises:
 * mastery model, skill graph with prerequisites, freshness-aware question picking,
 * spaced review of mistakes, rotation / coverage rules, in-session adaptation.
 * State lives in localStorage 'qd1:eng' (small: no question bodies, only ids + counters).
 */
import { storage } from '../store/storage.js';
import { repo } from '../store/repo.js';
import { topicTitle, TOPICS } from '../data/taxonomy.js';

const KEY = 'eng';
export const ROTATE_AFTER = 6;
const DAY = 86400000;

/* ---------- skill graph ---------- */
let GRAPH = null;                                   // id -> {id,name,prereq,stage,part}
export async function loadGraph() {
  if (GRAPH) return GRAPH;
  const list = await fetch('data/engine/skills.json').then((r) => r.json()).catch(() => []);
  GRAPH = {};
  list.forEach((s) => (GRAPH[s.id] = s));
  return GRAPH;
}
export const graph = () => GRAPH || {};
/** Ustaz topics (and anything without a Ufuq skill) are free skills: no prerequisite, stage 'u'. */
export function skillOf(q) { return q.skill || q.topic; }
export function skillInfo(id) {
  return graph()[id] || { id, name: topicTitle(id) || id, prereq: null, stage: 'u', stageName: 'الأستاذ', part: id.startsWith('v_') ? 'verbal' : 'quant' };
}
export const partOf = (id) => skillInfo(id).part;
const diffOf = (q) => q.d5 || ({ 1: 2, 2: 3, 3: 4 }[q.difficulty] || 3);

/* ---------- state ---------- */
const fresh = () => ({
  start: Date.now(), skills: {}, review: [], asked: {}, tagCount: {}, qMiss: {},
  targetDiff: 2, streak: 0, bestStreak: 0, lastActive: null, sessionCount: 0,
  lastActiveSkill: null, sameSkillRun: 0, roundsDone: {}, history: [], duel: null, examLog: [], lastExamDay: null, preset: 'steady',
});
let S = null;
export const state = () => (S ||= { ...fresh(), ...(storage.get(KEY, null) || {}) });
const save = () => storage.set(KEY, S);
export const today = () => Math.floor((Date.now() - state().start) / DAY);
const sk = (id) => (state().skills[id] ||= { status: 'new', window: [], days: [], first: null, last: null, ignore: 0, coldUntil: -1, paused: false, stuckSince: null, times: [] });

/* ---------- mastery (verbatim model: accuracy governs; speed is a hidden bonus only) ---------- */
const acc = (st) => (st.window.length ? st.window.filter(Boolean).length / st.window.length : 0);
export function evaluate(id) {
  const st = sk(id);
  if (!st.window.length) { st.status = 'new'; return; }
  const a = acc(st), sess = st.days.length, span = st.last - st.first;
  st.status = a >= 0.8 && sess >= 3 && span >= 5 ? 'mastered' : a >= 0.8 && sess >= 3 ? 'near' : 'building';
  if (st.status === 'building' && st.stuckSince === null) st.stuckSince = st.first;
  if (st.status !== 'building') st.stuckSince = null;
}
export const STATUS_LABEL = { new: 'لم تبدأ', building: 'قيد البناء', near: 'تقترب', mastered: 'بنيتَها', paused: 'مؤجَّلة' };
function poolSize(id) { return all().filter((q) => skillOf(q) === id).length || 1; }
export function mastery(id) {
  const st = state().skills[id]; if (!st || !st.window.length) return 0;
  const n = st.window.length, a = acc(st);
  const pAcc = a * Math.min(1, n / 10) * 55;
  const pDays = Math.min(1, st.days.length / 5) * 20;
  const seen = Object.keys(S.asked).filter((qid) => { const q = repo.get(qid); return q && skillOf(q) === id; }).length;
  const pCover = Math.min(1, seen / Math.min(poolSize(id), 40)) * 15;
  const pSpan = Math.min(1, (st.last - st.first) / 10) * 10;
  const gate = Math.min(1, a / 0.8);
  let v = pAcc + (pDays + pCover + pSpan) * gate;
  const t = [...(st.times || [])].sort((x, y) => x - y), md = t.length ? t[Math.floor(t.length / 2)] : null;
  if (md !== null && a >= 0.75) v += md <= 25 ? 4 : md <= 45 ? 2 : 0;
  if (st.paused) v *= 0.9;
  return Math.max(0, Math.min(100, Math.round(Math.min(v, a * 100 + 8))));
}
export const masteryWord = (p) => (p >= 85 ? 'راسخة' : p >= 65 ? 'قويّة' : p >= 40 ? 'تنمو' : p >= 15 ? 'في أوّلها' : 'لم تبدأ');

/* ---------- pool ---------- */
const all = () => repo.practiceQuestions().filter((q) => q.status !== 'review');
let BY = null, BYN = -1;
function bySkill() {
  const a = all(); if (BY && BYN === a.length) return BY;
  BY = {}; a.forEach((q) => (BY[skillOf(q)] ||= []).push(q)); BYN = a.length; return BY;
}
export const skillsWithContent = () => Object.keys(bySkill());
const hasContent = (id) => (bySkill()[id] || []).length > 0;

/** Difficulty first, freshness second: someone who exhausted the easy ones repeats easy, never leaps to the hardest. */
/** احتياطي مخفي (status 'backup'): لا يظهر إلا حين تقلّ أسئلة مهارة عند صعوبة ما عن ٣ — يسدّ فجوات المستويات السهلة والمتوسطة. */
let BK = null, BKN = -1;
function backupOf(id) {
  const a = repo.questions(); if (!BK || BKN !== a.length) { BK = {}; a.filter((q) => q.status === 'backup').forEach((q) => (BK[skillOf(q)] ||= []).push(q)); BKN = a.length; }
  return BK[id] || [];
}
export function pool(id, diff, used, part) {
  let A = (bySkill()[id] || []).filter((q) => !used.has(q.id));
  if (A.filter((q) => diffOf(q) === diff).length < 3) { const b = backupOf(id).filter((q) => !used.has(q.id) && diffOf(q) === diff); if (b.length) A = A.concat(b); }
  if (!A.length) return null;
  const isFresh = (q) => S.asked[q.id] == null, age = (q) => S.asked[q.id] || 0;
  const at = A.filter((q) => diffOf(q) === diff), freshAt = at.filter(isFresh);
  let best;
  if (freshAt.length >= 3) best = shuffled(freshAt);          // shuffled: every fresh question stays reachable, not only the first 8 in bank order
  else if (at.length >= 3) {
    const seen = at.filter((q) => !isFresh(q)).sort((a, b) => age(a) - age(b));
    const step = A.filter((q) => isFresh(q) && Math.abs(diffOf(q) - diff) === 1).sort((a, b) => diffOf(a) - diffOf(b));
    best = freshAt.concat(seen.slice(0, 6), step.slice(0, Math.max(3, 14 - at.length)));
  } else best = [...A].sort((a, b) => Math.abs(diffOf(a) - diff) - Math.abs(diffOf(b) - diff) || (isFresh(b) ? 1 : 0) - (isFresh(a) ? 1 : 0) || age(a) - age(b));
  return best[Math.floor(Math.random() * Math.min(best.length, 8))];
}

/* ---------- skill selection ---------- */
const prereqOk = (id) => { const p = skillInfo(id).prereq; if (!p || !hasContent(p)) return true; const s = state().skills[p]; return !!s && (s.status === 'near' || s.status === 'mastered'); };
const mine = () => skillsWithContent();
const untouched = () => mine().filter((id) => !sk(id).paused && sk(id).days.length === 0);
export function chooseActive(opts = {}) {
  const ids = mine().filter((id) => !opts.part || partOf(id) === opts.part);
  const pool_ = ids.length ? ids : mine();
  if (opts.force && hasContent(opts.force)) return opts.force;
  const s = state();
  if (s.lastActiveSkill && s.sameSkillRun >= ROTATE_AFTER) {
    const o = pool_.filter((id) => id !== s.lastActiveSkill && !sk(id).paused && sk(id).status !== 'mastered' && prereqOk(id));
    if (o.length) return (o.filter((id) => sk(id).days.length === 0)[0]) || o[0];
  }
  const cands = pool_.filter((id) => !sk(id).paused && prereqOk(id) && sk(id).status !== 'mastered');
  const quiet = cands.filter((id) => sk(id).ignore < 3), c = quiet.length ? quiet : cands;
  if (!c.length) return pool_[0] || mine()[0] || null;
  const rank = { building: 0, near: 1, new: 2 };
  // building skills first, then near, then new; ties by least-recent; Ufuq's foundations (stage s1) before later stages
  c.sort((a, b) => rank[sk(a).status] - rank[sk(b).status] || (sk(a).last ?? -1) - (sk(b).last ?? -1) || String(skillInfo(a).stage).localeCompare(skillInfo(b).stage));
  return c[0];
}
const masteredSkills = () => mine().filter((id) => ['mastered', 'near'].includes(sk(id).status));

/* ---------- session ---------- */
export function buildSession({ size = 10, part = null, force = null, kind = 'new' } = {}) {
  state();
  const used = new Set(), push = (arr, q, role, extra) => { if (q) { used.add(q.id); arr.push({ q, role, ...extra }); } };
  const active = chooseActive({ part, force });
  if (!active) return { items: [], skill: null };
  const s = S; s.sameSkillRun = s.lastActiveSkill === active ? s.sameSkillRun + 1 : 1; s.lastActiveSkill = active;
  const PART = partOf(active), inPart = (id) => partOf(id) === PART;
  const st = sk(active); let diff = s.targetDiff;
  if (st.stuckSince !== null && today() - st.stuckSince > 10) diff = Math.max(1, diff - 2);
  const nWarm = Math.max(1, Math.round(size * 0.17)), nReview = Math.max(1, Math.round(size * 0.25));
  const warmPool = masteredSkills().filter(inPart), warm = [], rev = [], act = [];
  for (let i = 0; i < nWarm; i++) push(warm, pool(warmPool.length ? warmPool[i % warmPool.length] : active, 1, used), 'warmup');
  s.review.filter((r) => r.due <= today()).sort((a, b) => a.due - b.due).forEach((r) => {
    const q = repo.get(r.qid); if (q && q.status !== 'review' && inPart(skillOf(q)) && rev.length < nReview && !used.has(q.id)) push(rev, q, 'review');
  });
  const order = [0, 1, -1, 1, 0, -1, 1, 0], nAct = size - warm.length - rev.length;
  const first = st.days.length === 0;
  for (let i = 0; i < nAct; i++) {
    const d = Math.min(5, Math.max(1, diff + order[i % order.length]));
    push(act, pool(active, d, used), 'active', first && i < 3 ? { fade: i + 1 } : {});
  }
  act.sort((a, b) => diffOf(a.q) - diffOf(b.q));
  const easyTail = act.splice(0, Math.min(2, act.length));
  let seq = [...warm, ...rev.slice(0, 1), ...act, ...rev.slice(1), ...easyTail];
  if (seq.length < size) {                                  // skill exhausted: fill from same-domain skills
    for (const id of mine().filter((x) => x !== active && !sk(x).paused && prereqOk(x) && inPart(x) && skillInfo(x).domain === skillInfo(active).domain)) {
      while (seq.length < size) { const q = pool(id, s.targetDiff, used); if (!q) break; push(seq, q, 'active'); }
      if (seq.length >= size) break;
    }
  }
  const distinct = () => new Set(seq.map((x) => skillOf(x.q))).size;
  if (distinct() < 3) for (const id of mine().filter((x) => !sk(x).paused && prereqOk(x) && inPart(x) && !seq.some((y) => skillOf(y.q) === x))) {
    if (distinct() >= 3) break; const q = pool(id, Math.max(1, s.targetDiff - 1), used); if (q) { used.add(q.id); seq.splice(Math.max(2, seq.length - 3), 0, { q, role: 'active' }); }
  }
  const groups = [], seen = new Map();                      // questions of one passage stay adjacent
  seq.forEach((x) => { const p = x.q.passage; if (!p) return groups.push([x]); if (seen.has(p)) seen.get(p).push(x); else { const g = [x]; seen.set(p, g); groups.push(g); } });
  seq = groups.flat();
  if (s.duel && s.duel.due <= today()) { const q = repo.get(s.duel.qid); if (q && !used.has(q.id)) seq.push({ q, role: 'duel' }); }
  if (kind === 'review') {                                   // review round: only what is due (falls back to a normal session when nothing is due)
    const dueOnly = seq.filter((x) => x.role === 'review' || x.role === 'duel');
    const extra = [];
    S.review.filter((r) => r.due <= today()).sort((a, b) => a.due - b.due).forEach((r) => { const q = repo.get(r.qid); if (q && q.status !== 'review' && !dueOnly.some((x) => x.q.id === q.id) && extra.length + dueOnly.length < Math.max(6, Math.round(size * 0.8))) extra.push({ q, role: 'review' }); });
    if (dueOnly.length + extra.length >= 3) seq = [...dueOnly, ...extra];
  }
  save();
  return { items: seq, skill: active, part: PART, kind };
}

/** In-session adaptation: 3 wrong in a row → easy mastered warm-up; 4 right in a row → one step harder. */
export function adapt(sess, idx, rStreak, wStreak) {
  const nxt = sess.items[idx]; if (!nxt) return false;
  const used = new Set(sess.items.map((i) => i.q.id));
  if (wStreak >= 3) {
    // تعثّر داخل الجلسة: سؤال أسهل من المهارة نفسها (لتُبنى عليه)، ثم مراجعة بطاقة الفكرة؛ وإلا تمهيد من مهارة متقنة
    const m = masteredSkills(), easier = pool(sess.skill, Math.max(1, diffOf(nxt.q) - 2), used);
    const q = easier || pool(m.length ? m[0] : sess.skill, 1, used);
    if (q) { sess.items[idx] = { q, role: easier ? 'active' : 'warmup' }; return 'ease'; }
  } else if (rStreak >= 4 && nxt.role === 'active') {
    const q = pool(sess.skill, Math.min(5, diffOf(nxt.q) + 1), used);
    if (q) { sess.items[idx] = { q, role: 'active' }; return 'harder'; }
  }
  return false;
}

/* ---------- recording ---------- */
export function record(q, correct, { picked = null, ms = 0, role = 'active', skipReview = false } = {}) {
  state(); const id = skillOf(q), st = sk(id), d = today();
  S.asked[q.id] = d;
  st.window.push(!!correct); if (st.window.length > 15) st.window.shift();
  const sec = Math.min(180, Math.round(ms / 1000)); if (sec >= 2) { st.times.push(sec); if (st.times.length > 15) st.times.shift(); }
  if (!st.days.includes(d)) st.days.push(d);
  if (st.first === null) st.first = d; st.last = d;
  if (!correct) {
    if (!S.review.find((r) => r.qid === q.id)) S.review.push({ qid: q.id, due: d + 1, interval: 1 });
    const tag = q.tags && picked != null ? q.tags[String(picked)] : null;   // per-distractor diagnosis tag
    if (tag) S.tagCount[tag] = (S.tagCount[tag] || 0) + 1;
    S.qMiss[q.id] = (S.qMiss[q.id] || 0) + 1;
  } else { S.review = S.review.filter((r) => r.qid !== q.id); if (S.qMiss[q.id]) S.qMiss[q.id] = 0; }
  evaluate(id); save();
}
export function finishSession(sess, right, total, wrongIds = []) {
  state(); const d = today();
  const pct = total ? right / total : 0;
  if (pct > 0.85) S.targetDiff = Math.min(5, S.targetDiff + 1); else if (pct < 0.6) S.targetDiff = Math.max(1, S.targetDiff - 1);
  const gap = S.lastActive === null ? 0 : d - S.lastActive;
  S.streak = S.lastActive === null || gap <= 3 ? S.streak + 1 : 1; S.bestStreak = Math.max(S.bestStreak, S.streak);
  S.lastActive = d; S.sessionCount += 1;
  S.review.forEach((r) => { if (r.due <= d) { r.interval = Math.min(21, r.interval * 2 + 1); r.due = d + r.interval; } });
  const beaten = Object.keys(S.qMiss).filter((i) => S.qMiss[i] >= 2 && repo.get(i));
  if (S.duel) { if (!wrongIds.includes(S.duel.qid) && sess.items.some((i) => i.role === 'duel')) S.duel = null; else if (sess.items.some((i) => i.role === 'duel')) S.duel.due = d + 10; }
  if (!S.duel && beaten.length) S.duel = { qid: beaten[0], due: d + 14 };
  S.history.unshift({ day: d, right, total, skill: sess.skill }); S.history = S.history.slice(0, 40);
  markRoundDone();
  save();
}

/* ---------- views of state ---------- */
export function overview() {
  state();
  return mine().map((id) => ({ id, ...skillInfo(id), status: sk(id).status, pct: mastery(id), count: bySkill()[id].length, due: S.review.filter((r) => { const q = repo.get(r.qid); return q && skillOf(q) === id && r.due <= today(); }).length }));
}
export const dueCount = () => (state(), S.review.filter((r) => r.due <= today()).length);
export const engineState = () => state();

/* ---------- exam simulation (sections, timer, no return to a finished section) ---------- */
export const EXAMS = {
  full:  { name: 'نموذج كامل', sections: 5, per: 24, mins: 25, alt: ['verbal', 'quant'], note: 'خمسة أقسام متناوبة بين اللفظي والكمي، ٢٤ سؤالاً و٢٥ دقيقة لكل قسم. لا رجوع إلى قسم انتهى.' },
  quant: { name: 'قسم كمي', sections: 1, per: 24, mins: 25, alt: ['quant'], note: 'قسم كمي واحد بإيقاع الاختبار الحقيقي.' },
  verbal:{ name: 'قسم لفظي', sections: 1, per: 24, mins: 25, alt: ['verbal'], note: 'قسم لفظي واحد بإيقاع الاختبار الحقيقي.' },
  mini:  { name: 'قسم مصغّر', sections: 1, per: 10, mins: 10, alt: ['quant', 'verbal'], note: 'عشرة أسئلة في عشر دقائق — تدريب على الإيقاع.' },
};
const shuffled = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
/** One section: fresh questions first (never seen / oldest), spread round-robin across skills; a reading passage brings its questions together. */
export function buildExamSection(spec, secIdx, seen = new Set()) {
  state();
  const want = spec.alt[secIdx % spec.alt.length];
  const skills = shuffled(mine().filter((id) => partOf(id) === want));
  const age = (q) => (S.asked[q.id] == null ? -1 : S.asked[q.id]);
  const lists = skills.map((id) => shuffled(bySkill()[id].filter((q) => !seen.has(q.id))).sort((a, b) => age(a) - age(b)));
  const out = [], used = new Set(seen);
  let progress = true;
  while (out.length < spec.per && progress) {
    progress = false;
    for (const L of lists) {
      if (out.length >= spec.per) break;
      const q = L.find((x) => !used.has(x.id)); if (!q) continue;
      progress = true;
      const group = q.passage ? L.filter((x) => x.passage === q.passage && !used.has(x.id)).slice(0, 4) : [q];
      for (const g of group) { if (out.length < spec.per) { used.add(g.id); out.push(g); } }
    }
  }
  return out;
}
export function logExam(entry) {
  state(); S.examLog = [...(S.examLog || []), entry].slice(-12);
  if (entry.mode === 'full') S.lastExamDay = today(); save();
}
export const examInfo = () => (state(), { last: S.lastExamDay, log: S.examLog || [], sinceLast: S.lastExamDay == null ? null : today() - S.lastExamDay });

/* ---------- daily rounds: three short rounds beat one long session (spacing effect). Moving a round earlier is never 'late'. ---------- */
export const ROUND_KINDS = {
  new: { t: 'مهارة جديدة', b: 'أصعب جولة — ولذلك أوّلها' },
  review: { t: 'أخطاء اليوم', b: 'ما أخطأتَ فيه يعود وحده' },
  ideas: { t: 'أفكار وشرح', b: 'قراءة لا حساب — قبل النوم بساعة' },
};
const R = (at, mins, kind) => ({ at, mins, kind });
export const ROUND_PRESETS = {
  light: { name: 'خفيف', week: [R('16:30', 15, 'new'), R('21:00', 10, 'review')], wknd: [R('11:00', 15, 'new'), R('17:00', 10, 'review')] },
  steady: { name: 'ثابت', week: [R('16:30', 15, 'new'), R('21:00', 12, 'review'), R('22:15', 8, 'ideas')], wknd: [R('10:30', 18, 'new'), R('17:00', 12, 'review'), R('21:00', 8, 'ideas')] },
  full: { name: 'مكثّف', week: [R('15:30', 15, 'new'), R('17:30', 12, 'new'), R('21:00', 15, 'review'), R('22:15', 8, 'ideas')], wknd: [R('10:00', 20, 'new'), R('13:00', 15, 'new'), R('17:00', 15, 'review'), R('21:00', 10, 'ideas')] },
};
export const isWeekend = () => { const d = new Date().getDay(); return d === 5 || d === 6; };   // Saudi weekend: Fri & Sat
export const getCustom = () => { state(); return S.custom || { week: ROUND_PRESETS.steady.week.map((r) => ({ ...r })), wknd: ROUND_PRESETS.steady.wknd.map((r) => ({ ...r })) }; };
export const setCustom = (c) => {
  state(); const clean = (a) => (a || []).filter((r) => /^\d{1,2}:\d{2}$/.test(r.at) && ROUND_KINDS[r.kind]).map((r) => ({ at: r.at.padStart(5, '0'), mins: Math.min(180, Math.max(5, +r.mins || 15)), kind: r.kind })).sort((a, b) => a.at.localeCompare(b.at)).slice(0, 8);
  S.custom = { week: clean(c.week), wknd: clean(c.wknd) }; S.preset = 'custom'; S.roundsDone = {}; save();
};
export const todayRounds = () => { state(); const k = isWeekend() ? 'wknd' : 'week'; return S.preset === 'custom' ? getCustom()[k] : (ROUND_PRESETS[S.preset] || ROUND_PRESETS.steady)[k]; };
export const setPreset = (p) => { state(); if (ROUND_PRESETS[p] || p === 'custom') { S.preset = p; save(); } };
export const preset = () => (state(), S.preset);
const hm = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export function roundState(i) {
  state(); const r = todayRounds()[i]; if (!r) return 'done';
  if (((S.roundsDone || {})[today()] || []).includes(i)) return 'done';
  const n = new Date().getHours() * 60 + new Date().getMinutes(), t = hm(r.at);
  return n < t - 90 ? 'later' : n > t + 45 ? 'late' : 'now';
}
export function nextRound() { const rs = todayRounds(); for (let i = 0; i < rs.length; i++) { const st = roundState(i); if (st !== 'done') return { i, st, r: rs[i] }; } return null; }
export function markRoundDone(i) {
  state(); const nx = i != null ? { i } : nextRound(); if (!nx) return;
  const d = today(), done = (S.roundsDone[d] ||= []); if (!done.includes(nx.i)) done.push(nx.i);
  Object.keys(S.roundsDone).forEach((k) => { if (d - +k > 3) delete S.roundsDone[k]; }); save();
}
export const roundsDoneToday = () => ((state().roundsDone || {})[today()] || []).length;

/* ---------- mistake patterns: distractor tag → one of 11 habit families (exact match, then substring) ---------- */
let ERR = null;
export const loadErrFam = async () => (ERR ||= await fetch('data/engine/errfam.json').then((r) => r.json()).catch(() => ({ fam: [], tag: {}, fuzz: [] })));
export function errFamily(tag) {
  if (!ERR || !tag) return null;
  const k = ERR.tag[tag] || (ERR.fuzz.find(([, keys]) => keys.some((x) => tag.includes(x))) || [])[0];
  return ERR.fam.find((f) => f.k === k) || null;
}
/** Habits worth a gentle word: families with at least 3 tagged mistakes. No counts are exposed to the student. */
export function topHabits(n = 2) {
  state(); const c = {};
  Object.entries(S.tagCount).forEach(([t, v]) => { const f = errFamily(t); if (f) c[f.k] = (c[f.k] || 0) + v; });
  return Object.entries(c).filter(([, v]) => v >= 3).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => ERR.fam.find((f) => f.k === k));
}
