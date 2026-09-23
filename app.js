/* ═══════════════════════════════════════════════════════════
   أُفق — تدريب القدرات والتحصيلي وستيب
   © ٢٠٢٦ عرفات الراجحي · Arafat AlRajhi · جميع الحقوق محفوظة.

   هذا العمل — الأسئلة ومفاتيح الحلّ والمنهجية والتصميم —
   مملوك لصاحبه. لا يُنسخ ولا يُعاد نشره ولا يُشتقّ منه
   عملٌ آخر، كلًّا أو جزءًا، بلا إذن خطّيّ مسبق.

   All rights reserved. Unauthorized copying, redistribution,
   or derivative use of this content is prohibited.
   ═══════════════════════════════════════════════════════════ */

/* البنك ومفاتيح الحلّ في ملفّين مستقلّين: تحميلٌ واحد يُخزَّن على الجهاز،
   فلا يُعاد تنزيل ٤٫٥ ميجا كلّما صحّحنا سطرًا في التطبيق. */
const DATA = window.__BANK, LESSONS = window.__KEYS;
const Q = DATA.questions;
const SKILLS = {}, SKILL_LIST = [];
DATA.stages.forEach(st => st.domains.forEach(dm => dm.skills.forEach(sk => {
  const s = Object.assign({}, sk, { stage: st.id, stageName: st.name, track: st.track || 'qudurat',
    domain: dm.id, domainName: dm.name });
  SKILLS[sk.id] = s; SKILL_LIST.push(s);
})));
const trackStages = t => DATA.stages.filter(s => (s.track || 'qudurat') === t);
const trackSkills = t => SKILL_LIST.filter(s => s.track === t);
const PASSAGES = {};
(DATA.passages || []).forEach(x => PASSAGES[x.id] = x);
const CARDS = (DATA.cards || []);
const cardsBySkill = {};
CARDS.forEach(c => (cardsBySkill[c.skill] = cardsBySkill[c.skill] || []).push(c));
const qBySkill = {};
Q.forEach(q => (qBySkill[q.skill] = qBySkill[q.skill] || []).push(q));
const hasContent = id => (qBySkill[id] || []).length > 0 || (cardsBySkill[id] || []).length > 0;
function ensureSkills() {
  if (!S.skills || typeof S.skills !== 'object') S.skills = {};
  SKILL_LIST.forEach(x => {
    if (!S.skills[x.id]) S.skills[x.id] = { status: 'new', window: [], days: [], first: null,
      last: null, ignore: 0, coldUntil: -1, paused: false, stuckSince: null, level: null, times: [] };
  });
}
const mySkills = () => { ensureSkills(); return trackSkills(S.track); };
const trackReady = () => mySkills().some(s => hasContent(s.id));

const THEMES = [{"id": "night", "name": "ليلي", "dark": true, "void": "#0E1017", "lift": "#1A1F33", "glow": "#666B82"}, {"id": "obsidian", "name": "أوبسيديان", "dark": true, "void": "#0C0C0E", "lift": "#1E1C18", "glow": "#6B675F"}, {"id": "petrol", "name": "بترولي", "dark": true, "void": "#0A1416", "lift": "#16292C", "glow": "#5F7274"}, {"id": "forest", "name": "أخضر عميق", "dark": true, "void": "#0B1210", "lift": "#17251F", "glow": "#667369"}, {"id": "plum", "name": "برقوقي", "dark": true, "void": "#120E15", "lift": "#241B2A", "glow": "#736879"}, {"id": "royal", "name": "أزرق ملكي", "dark": true, "void": "#0A101C", "lift": "#16233D", "glow": "#626D85"}, {"id": "paper", "name": "ورقي", "dark": false, "void": "#F4F2EC", "lift": "#FFFFFF", "glow": "#8E92A0"}, {"id": "sand", "name": "رملي", "dark": false, "void": "#F2EBDF", "lift": "#FFFAF1", "glow": "#978B79"}, {"id": "mint", "name": "نعناعي", "dark": false, "void": "#EDF4F0", "lift": "#FFFFFF", "glow": "#869691"}, {"id": "grey", "name": "رمادي", "dark": false, "void": "#EEF0F3", "lift": "#FFFFFF", "glow": "#8B93A1"}];
function themeGrid() {
  const ph = breathePhase();
  return `<div class="brcard ${S.theme === 'breathe' ? 'sel' : ''}" data-act="setTheme" data-arg="breathe">
    <div class="brh"><span class="brdot"></span>يتنفّس مع اليوم</div>
    <div class="brs">يتبدّل المظهر مع ساعات يومك — الآن: <b>${esc(ph.name)}</b></div>
  </div>
  <div class="eyebrow" style="margin:16px 0 10px">أو اختر ثابتًا</div>
  <div class="thgrid">
    <button class="thcard ${S.theme === 'auto' ? 'sel' : ''}" data-act="setTheme" data-arg="auto">
      <span class="thsw" style="display:block;background:linear-gradient(135deg,#0E1017 0 50%,#F4F2EC 50% 100%)"></span>تلقائي</button>
    ${THEMES.map(t => `<button class="thcard ${S.theme === t.id ? 'sel' : ''}" data-act="setTheme" data-arg="${t.id}">
      <span class="thsw" style="display:block;background:linear-gradient(140deg,${t.lift},${t.void})">
        <i style="background:${t.glow}"></i></span>${esc(t.name)}</button>`).join('')}
  </div>`;
}
function themeSheet() {
  if (S.sheet !== 'theme') return '';
  return `<div class="sheet" data-act="closeSheet"><div class="sheet-in" data-stop>
    <div class="grab"></div>
    <div class="eyebrow" style="margin-bottom:12px">المظهر</div>
    ${themeGrid()}
    <div class="tswitch ${S.haptics === false ? '' : 'on'}" data-act="toggleHaptics">
      <div><div class="lb">اهتزاز اللمس</div>
      <div class="sub">ارتجاجة خفيفة عند الاختيار والتنقّل</div></div>
      <span class="kn"><i></i></span>
    </div>
  </div></div>`;
}
/* ── يتنفّس مع اليوم: المظهر يتبع ساعة الطالب لا ذوقه فقط ── */
const BREATHE = [
  { from: 4,  to: 7,  id: 'royal', name: 'الفجر' },
  { from: 7,  to: 11, id: 'paper', name: 'الصباح' },
  { from: 11, to: 15, id: 'sand',  name: 'الظهيرة' },
  { from: 15, to: 18, id: 'grey',  name: 'العصر' },
  { from: 18, to: 21, id: 'plum',  name: 'المغرب' },
  { from: 21, to: 28, id: 'night', name: 'الليل' }
];
function breathePhase() {
  const h = new Date().getHours();
  return BREATHE.find(p => (h >= p.from && h < p.to) || (p.to > 24 && h < p.to - 24)) || BREATHE[5];
}
function breatheTick() {
  if (S.theme !== 'breathe') { if (S.breatheTimer) { clearInterval(S.breatheTimer); S.breatheTimer = null; } return; }
  const now = breathePhase().id;
  if (S.breatheAt && S.breatheAt !== now) { S.breatheShifts = (S.breatheShifts || 0) + 1; }
  S.breatheAt = now;
  applyTheme();
  breatheAsk();
}
function breatheStart() {
  if (S.breatheTimer) clearInterval(S.breatheTimer);
  S.breatheAt = breathePhase().id; S.breatheShifts = S.breatheShifts || 0;
  S.breatheTimer = setInterval(breatheTick, 120000);
}
/* المراجعة اللطيفة: يسأل مرّة واحدة بعد أن يرى الطالب التغيّر بعينه */
function breatheAsk() {
  if (S.theme !== 'breathe' || S.breatheAsked || (S.breatheShifts || 0) < 1) return;
  if (document.getElementById('brAsk')) return;
  S.breatheAsked = true;
  const d = document.createElement('div');
  d.id = 'brAsk'; d.className = 'brask';
  d.innerHTML = '<div class="brtx">المظهر يتغيّر مع ساعات يومك.<br><span>إن كان لا يريحك، أعِده ثابتًا في أيّ وقت.</span></div>' +
    '<div class="brbt"><button data-br="keep">يناسبني</button><button data-br="fix">أعِده ثابتًا</button></div>';
  document.body.appendChild(d);
  d.addEventListener('click', e => {
    const b = e.target.closest('[data-br]'); if (!b) return;
    if (b.dataset.br === 'fix') { S.theme = 'night'; S.themeLocked = true; if (S.breatheTimer) clearInterval(S.breatheTimer); S.breatheTimer = null; applyTheme(); }
    d.remove();
    if (typeof render === 'function') render();
  });
  setTimeout(() => { const x = document.getElementById('brAsk'); if (x) x.remove(); }, 14000);
}

function applyTheme() {
  let t = S.theme;
  if (t === 'breathe') t = breathePhase().id;
  else if (t === 'auto') t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'paper' : 'night';
  document.getElementById('shell').dataset.theme = t;
  const m = document.querySelector('meta[name=theme-color]');
  const th = THEMES.find(x => x.id === t);
  if (m && th) m.setAttribute('content', th.void);
  const tr = TRACKS[S.track];
  if (tr) {
    const sh = document.getElementById('shell');
    const light = th && !th.dark;
    sh.style.setProperty('--glow', light ? (tr.accentDay || tr.accent) : tr.accent);
    sh.style.setProperty('--glow-tint', light ? (tr.tintDay || tr.tint) : tr.tint);
    sh.dataset.track = tr.id;
    sh.dataset.mode = light ? 'day' : 'night';
  }
}

/* ---------- helpers ---------- */
/* حدّ الجلسات المجّانية — صفرٌ يعني بلا جدار اشتراك */
const FREE_LIMIT = 0;

/* ══════ نسخة أُفق ══════
   يُرفع الرقم مع كل تحديث، ويظهر في «عن أُفق»، ويُستعمل لكشف الجديد. */
const APP_VERSION = '9.3.0';
const APP_DATE = '٩ سبتمبر ٢٠٢٦';
const APP_BUILD = 118;   /* يطابق رقم ufuq-vNN في sw.js */

const AR = '٠١٢٣٤٥٦٧٨٩';
const isLTR = s => {
  const t = String(s || '');
  const ar_ = (t.match(/[\u0621-\u064A]/g) || []).length;
  const la = (t.match(/[A-Za-z]/g) || []).length;
  return la > ar_;
};
const ar = n => String(n).replace(/\d/g, d => AR[+d]);
/* أُزيلت كتلة البيان المؤقّت: كانت تستبدل ./manifest.webmanifest ببيان من blob:
   بأيقونة SVG — وكروم يرفض الاثنين، فلا يعرض زرّ التثبيت أبدًا.
   البيان الحقيقي مربوط في رأس الصفحة، والأيقونات PNG بقياسَي ١٩٢ و٥١٢. */
/* نظام تثبيت واحد فقط — انظر deferredPrompt أسفل الملفّ */
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const el = document.getElementById('app');
const tabsEl = document.getElementById('tabs');
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/* ---------- state ---------- */
let S;
let paceTimer = null;
function freshState() {
  const skills = {};
  SKILL_LIST.forEach(s => skills[s.id] = {
    status: 'new', window: [], days: [], first: null, last: null,
    ignore: 0, coldUntil: -1, paused: false, stuckSince: null, level: null, times: []
  });
  return {
    day: 0, screen: 'name', haptics: true, name: '', visits: 0, skills, review: [], asked: {},
    sessionCount: 0, streak: 0, lastActive: null, session: null,
    targetDiff: 2, size: 30, reminder: '٨:٠٠ م', examDays: 90,
    paid: true, diag: null, lastSummary: null, corrected: [],
    tagCount: {}, tipsSeen: [], tip: null, track: 'qudurat', shareReport: true, tracks: {},
    theme: 'night', sheet: null, pace: false, paceHist: [],
    introIdx: 0, seenLessons: [], lessonFor: null, history: [], logOpen: null,
    todayCount: 0, anchor: 'maghrib', whyCount: 0, passOpen: true,
    cardState: {}, cardSess: null, cardShow: false, lastCards: null,
    notes: [], noteSeen: null, qMiss: {}, duel: null, stopOffer: false, iosHinted: false, grade: null,
    installAsked: false, installed: false, installReady: false,
    devUnlocked: false,
    preset: 'steady', sched: null, roundsDone: {}, showPct: false,
    prTab: 0, exPick: null, exPickFor: null, vizMode: 'rings', lastBackup: null,
    lastActiveSkill: null, sameSkillRun: 0, phaseSeen: null, course: null, goal: null, courses: [],
    lastBackupDay: null, restored: null, nudgeSeen: null,
    focus: 'all',
    forceSkill: null,
    lastExamDay: null, examLog: [],
    suggestion: null, activeStage: 's1'
  };
}

/* ---------- فصل المسارات: دفتر مستقلّ لكل اختبار ---------- */
const TRACK_FIELDS = ['day','streak','lastActive','sessionCount','asked','review','history',
  'notes','noteSeen','qMiss','duel','preset','sched','roundsDone','lastExamDay','examLog','vizMode','lastBackup','lastBackupDay','focus','phaseSeen','course','goal','courses',
  'seenLessons','activeStage','targetDiff','size','sizeManual','audio','examDays','corrected','tagCount','todayCount','lastWeak',
  'diag','lastSummary','session','anchor','reminder','logOpen','suggestion','introIdx','whyCount',
  'cardState','cardSess','lastCards','paceHist'];
function blankTrack(t) {
  const st0 = trackStages(t)[0];
  return {
    day: 0, streak: 0, lastActive: null, sessionCount: 0, asked: {}, review: [], history: [],
    seenLessons: [], activeStage: st0 ? st0.id : 's1', targetDiff: 2, size: 30,
    examDays: t === 'qudurat' ? 90 : 60,
    corrected: [], tagCount: {}, todayCount: 0, diag: null, lastSummary: null, session: null,
    anchor: 'maghrib', reminder: '٨:٠٠ م', logOpen: null, suggestion: null, introIdx: 0,
    whyCount: 0, cardState: {}, cardSess: null, lastCards: null, paceHist: []
  };
}
function saveTrack() {
  if (!S.tracks) S.tracks = {};
  const o = {};
  TRACK_FIELDS.forEach(f => o[f] = S[f]);
  S.tracks[S.track] = o;
}
function loadTrack(t) {
  if (!S.tracks) S.tracks = {};
  const o = S.tracks[t] || blankTrack(t);
  TRACK_FIELDS.forEach(f => S[f] = o[f]);
  S.tracks[t] = o;
}
function trackDays(t) {
  const o = (S.tracks || {})[t];
  return t === S.track ? (S.day || 0) : (o ? o.day || 0 : 0);
}
function trackStreak(t) {
  const o = (S.tracks || {})[t];
  return t === S.track ? (S.streak || 0) : (o ? o.streak || 0 : 0);
}

/* ---------- mastery model ---------- */
function acc(st) {
  if (!st.window.length) return 0;
  return st.window.filter(Boolean).length / st.window.length;
}
function evaluate(id) {
  const st = S.skills[id];
  if (!st.window.length) { st.status = 'new'; return; }
  const a = acc(st), sess = st.days.length, span = (st.last - st.first);
  if (a >= 0.8 && sess >= 3 && span >= 5) st.status = 'mastered';
  else if (a >= 0.8 && sess >= 3) st.status = 'near';
  else st.status = 'building';
  if (st.status === 'building' && st.stuckSince === null) st.stuckSince = st.first;
  if (st.status !== 'building') st.stuckSince = null;
}
const statusLabel = { new: 'لم تبدأ', building: 'قيد البناء', near: 'تقترب', mastered: 'بنيتَها', paused: 'مؤجَّلة' };

/* ══════════ مقياس الإتقان ══════════
   أربعة أوزان: الدقّة ٥٥، والثبات عبر الأيام ٢٠، والاتّساع ١٥، والرسوخ ١٠.
   والسرعة مُعامِلٌ خفيّ لا يُعرض ولا يُذكر: ترفع النتيجة قليلًا حين تكون الدقّة
   عالية أصلًا، ولا تخفضها أبدًا — فلا يتعلّم الطالب أن يستعجل. */
function medianTime(st) {
  const t = (st.times || []).slice().sort((a, b) => a - b);
  if (!t.length) return null;
  return t[Math.floor(t.length / 2)];
}
function mastery(id) {
  const st = S.skills[id]; if (!st) return 0;
  const n = st.window.length;
  if (!n) return 0;
  const a = acc(st);
  /* الدقّة: تُخصم قليلًا حين تكون العيّنة صغيرة، فلا يقفز الرقم من إجابتين */
  const conf = Math.min(1, n / 10);
  const pAcc = a * conf * 55;
  /* الثبات: عدد الأيام المتفرّقة التي لُمست فيها المهارة */
  const pDays = Math.min(1, (st.days.length || 0) / 5) * 20;
  /* الاتّساع: كم من أسئلة المهارة رآها فعلًا */
  const pool = (qBySkill[id] || []).length || 1;
  const seen = Object.keys(S.asked || {}).filter(qid => {
    const q = byQ(qid); return q && q.skill === id;
  }).length;
  const pCover = Math.min(1, seen / Math.min(pool, 40)) * 15;
  /* الرسوخ: طول المدّة بين أول لمسة وآخرها */
  const span = (st.last != null && st.first != null) ? st.last - st.first : 0;
  const pSpan = Math.min(1, span / 10) * 10;
  /* الدقّة حاكمةٌ لا شريكة.
     كانت نقاط السلوك (الأيام والاتّساع والرسوخ) تُمنح كاملةً مهما كانت الدقّة،
     فيُظهر التطبيق ٨٤٪ لطالب دقّته ٦٠٪ — وهذه إشارةٌ كاذبة تُطمئنه قبل أوانه.
     الآن: نقاط السلوك تتناسب مع الدقّة، والنسبة لا تتجاوز الدقّة إلا بهامش صغير. */
  const gate = Math.min(1, a / 0.80);
  let v = pAcc + (pDays + pCover + pSpan) * gate;
  /* المعامل الخفيّ */
  const md = medianTime(st);
  if (md !== null && a >= 0.75) {
    if (md <= 25) v += 4; else if (md <= 45) v += 2;
  }
  if (st.paused) v *= 0.9;
  const ceiling = a * 100 + 8;      /* لا يُظهَر إتقانٌ يفوق دقّته بأكثر من ثمانٍ */
  return Math.max(0, Math.min(100, Math.round(Math.min(v, ceiling))));
}
function masteryWord(p) {
  if (p >= 85) return 'راسخة';
  if (p >= 65) return 'قويّة';
  if (p >= 40) return 'تنمو';
  if (p >= 15) return 'في أوّلها';
  return 'لم تبدأ';
}
/* النسبة لا تُعرض أثناء اليوم: الرقم الذي يُراقَب يتحوّل إلى قلق.
   يُفتح القفل حين تكتمل جولات اليوم — فيصير مكافأةً لا مقياسًا يُلاحَق. */
function pctUnlocked() {
  if (S.showPct) return true;
  const rs = myRounds();
  const done = ((S.roundsDone || {})[S.day] || []).length;
  return rs.length > 0 && done >= rs.length;
}
function overallMastery() {
  const ms = mySkills().filter(x => hasContent(x.id));
  if (!ms.length) return 0;
  return Math.round(ms.reduce((a, x) => a + mastery(x.id), 0) / ms.length);
}
/* حلقة مئوية صغيرة تُرسم بالـSVG فتتبع سمة الطالب */
function ring(p, size) {
  const r = (size - 7) / 2, c = 2 * Math.PI * r, off = c * (1 - p / 100);
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="3.5"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--glow)" stroke-width="3.5"
      stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 ${size/2} ${size/2})"/>
  </svg>`;
}

/* ---------- question pool ---------- */
function isClean(q) { return !S.cleanOnly || q.origin !== 'sourced'; }
function cleanCount(skillId) {
  return (qBySkill[skillId] || []).filter(q => q.origin !== 'sourced').length;
}
/* اختيار السؤال — قاعدتان تمنعان الحفظ بدل الفهم:
   ① لا يعود سؤالٌ ما دام في المهارة سؤالٌ لم يُرَ بعد. كان يعود بعد سبعة أيام،
      فيراه الطالب ثماني مرّات في شهرين فيحفظ الجواب ويبدو متقنًا وهو ليس كذلك.
   ② حين تنفد الجدّة، نعود إلى الأقدم عهدًا لا إلى الأقرب.
   والاختيار من شريحة واسعة لا من ثلاثة، فلا يتشابه طالبان. */
function pool(skillId, diff, used, noImg) {
  const all = (qBySkill[skillId] || []).filter(q =>
    !used.has(q.id) && !(noImg && q.img) && isClean(q));
  if (!all.length) return null;
  const never = all.filter(q => S.asked[q.id] == null);
  let base;
  if (never.length) {
    base = never;
  } else {
    const byAge = all.slice().sort((a, b) => (S.asked[a.id] || 0) - (S.asked[b.id] || 0));
    base = byAge.slice(0, Math.max(6, Math.ceil(byAge.length * 0.4)));
  }
  let best = base.filter(q => q.d === diff);
  if (best.length < 3) {
    const near = base.slice().sort((a, b) => Math.abs(a.d - diff) - Math.abs(b.d - diff));
    best = best.concat(near.filter(q => best.indexOf(q) < 0)).slice(0, Math.max(6, best.length));
  }
  const span = Math.min(best.length, 8);
  return best[Math.floor(Math.random() * span)];
}

/* ---------- skill selection ---------- */
function stageSkills(stage) {
  return mySkills().filter(s => s.stage === stage && hasContent(s.id));
}
function prereqOk(s) {
  if (!s.prereq) return true;
  const p = S.skills[s.prereq];
  return p.status === 'near' || p.status === 'mastered';
}
/* تركيز الطالب: يختار قسمًا فيلزمه التطبيق حتى يبدّله بنفسه.
   نمط التفكير في اللفظيّ غيره في الكمّيّ، والتنقّل بينهما يوميًّا يُشتّت. */
function focusOK(id) {
  if (S.track !== 'qudurat') return true;
  const f = S.focus || 'all';
  return f === 'all' || partOf(id) === f;
}
function focusSkills() {
  const m = mySkills().filter(x => focusOK(x.id) && hasContent(x.id));
  return m.length ? m : mySkills();
}
/* ══════ ضمان الشموليّة ══════
   الجدولة كانت تتمسّك بالمهارة حتى تُبنى، فيمضي شهران ولم يرَ الطالب نصف مهاراته.
   قاعدتان تحلّان ذلك:
   ① دوران: لا تزيد الجلسات المتتالية على مهارة واحدة عن ستّ.
   ② سباق مع الوقت: إذا لم يبقَ من الأيام إلا بقدر ما يكفي المهارات التي لم تُبدأ،
      قُدِّمت المهارة الجديدة على تعميق القديمة — لأن مرورًا سطحيًّا على الكلّ
      خيرٌ من إتقان النصف وجهل النصف يوم الاختبار. */
const ROTATE_AFTER = 6;

/* ══════════ مراحل الاستعداد للقدرات ══════════
   ثلاثة أشهر مقسّمة كما انتهى إليه الحساب:
   أربعة أسابيع لفظيّ (٦ مهارات) — ثمّ خمسة كمّيّ (١٠ مهارات) — ثمّ ثلاثة للمراجعة والنماذج.
   واللفظيّ أولًا لأن ستّ مهارات أسرع في إعطاء شعور بالإنجاز من عشر. */
const PLAN_PHASES = [
  { until: 28, focus: 'verbal', name: 'المرحلة اللفظية',
    note: 'ستّ مهارات لفظية. أربعة أسابيع تكفيها بجلستين يوميًّا.' },
  { until: 63, focus: 'quant',  name: 'المرحلة الكمّية',
    note: 'عشر مهارات كمّية. خمسة أسابيع — وهي أطول المراحل لأنها أوسعها.' },
  { until: 999, focus: 'all',   name: 'مرحلة المراجعة',
    note: 'الاثنان معًا: أخطاؤك ونماذج كاملة. هنا يُقاس ما بنيتَه.' }
];
function phaseNow() {
  if (S.track !== 'qudurat') return null;
  return PLAN_PHASES.find(p => S.day < p.until) || PLAN_PHASES[PLAN_PHASES.length - 1];
}
function phaseLeft() {
  const p = phaseNow(); if (!p || p.until > 900) return null;
  return Math.max(0, p.until - S.day);
}
function untouchedSkills() {
  return focusSkills().filter(x => {
    const st = S.skills[x.id];
    return st && !st.paused && (st.days || []).length === 0 && hasContent(x.id);
  });
}
function coverageUrgent() {
  /* الإلحاح يُقاس بنهاية المرحلة لا بنهاية الأفق.
     فالمرحلة اللفظية أربعة أسابيع لستّ مهارات — وإن لم تُبدأ كلّها فيها لم تُبدأ بعدها.
     وهذا ما كان يحجب نصف المهارات: المراحل تمرّ والجدولة تعمّق في ثلاث. */
  const ph = phaseLeft();
  const left = ph != null ? ph : Math.max(0, (S.examDays || 90) - S.day);
  const un = untouchedSkills().length;
  if (!un) return false;
  return left / un < 4;
}
function chooseActive() {
  /* وصلة مباشرة: إن طُلبت مهارة بعينها من الخريطة أو من مفتاحها، فهي المقصودة */
  if (S.forceSkill) {
    const f = mySkills().find(x => x.id === S.forceSkill);
    S.forceSkill = null;
    if (f && hasContent(f.id)) return f;
  }
  /* ① دوران بعد ستّ جلسات متتالية على المهارة نفسها */
  if (S.lastActiveSkill && (S.sameSkillRun || 0) >= ROTATE_AFTER) {
    const others = focusSkills().filter(x => x.id !== S.lastActiveSkill
      && !S.skills[x.id].paused && S.skills[x.id].status !== 'mastered' && prereqOk(x));
    if (others.length) {
      const fresh = others.filter(x => (S.skills[x.id].days || []).length === 0);
      return (fresh.length ? fresh : others)[0];
    }
  }
  /* ② سباق مع الوقت: مهارة لم تُبدأ تتقدّم.
     وعند الإلحاح يُرفع شرط المتطلَّب السابق — لأن مهارةً رآها الطالب ولو بلا تمهيد
     خيرٌ من مهارةٍ لم يرَها قطّ لأن ما قبلها لم يُتقَن. */
  if (coverageUrgent()) {
    const un = untouchedSkills();
    const ready = un.filter(x => prereqOk(x));
    const pick = ready.length ? ready : un;
    if (pick.length) return pick[0];
  }
  const all = stageSkills(S.activeStage).filter(x => focusOK(x.id))
    .filter(s => !S.skills[s.id].paused && prereqOk(s) && S.skills[s.id].status !== 'mastered');
  // المرفوضة ٣ مرات فأكثر تخرج من الاقتراح الرئيسي وتعود ضمنيًا داخل الجلسة
  const quiet = all.filter(s => S.skills[s.id].ignore < 3);
  const cands = quiet.length ? quiet : all;
  if (!cands.length) {
    const st2 = trackStages(S.track)[1];
    const next = (st2 ? stageSkills(st2.id) : []).filter(s =>
      !S.skills[s.id].paused && S.skills[s.id].status !== 'mastered' && focusOK(s.id));
    return next[0] || focusSkills()[0] || stageSkills(S.activeStage)[0] || mySkills()[0];
  }
  const rank = { building: 0, near: 1, new: 2 };
  cands.sort((a, b) => {
    const ra = rank[S.skills[a.id].status], rb = rank[S.skills[b.id].status];
    if (ra !== rb) return ra - rb;
    return (S.skills[a.id].last ?? -1) - (S.skills[b.id].last ?? -1);
  });
  return cands[0];
}
function chooseReturning(activeId) {
  const c = mySkills().filter(s => hasContent(s.id) && s.id !== activeId)
    .filter(s => { const st = S.skills[s.id]; return !st.paused && st.ignore >= 3 && S.day >= st.coldUntil; });
  if (!c.length) return null;
  c.sort((a, b) => S.skills[b.id].ignore - S.skills[a.id].ignore);
  return c[0];
}
function masteredSkills() {
  return mySkills().filter(s => hasContent(s.id) && ['mastered', 'near'].includes(S.skills[s.id].status));
}

/* ---------- session generation ---------- */
/* ══════ تشكيل محطّات الدورة ══════
   كل محطّة لها شكلها. بلا هذا تصير المحطّات السبع جلسةً واحدة بأسماء مختلفة. */
function stationSession(kind) {
  const size = S.size, used = new Set(), items = [];
  const c = S.course, sk = c ? (c.skills || []) : [];
  const add = (q, role) => { if (q && !used.has(q.id)) { used.add(q.id);
    items.push({ qid: q.id, role, done: false }); } };
  const fill = (id, n, d) => { for (let i = 0; i < n; i++) add(pool(id, d, used), 'active'); };
  const dueNow = (ids) => S.review
    .filter(r => { const q = byQ(r.qid); return r.due <= S.day && q && (!ids || ids.includes(q.skill)); })
    .sort((a, b) => a.due - b.due);
  const myWrong = (ids) => {
    const seen = new Set();
    return (c && c.log || []).reduce((a, e) => a.concat(e.wrong || []), [])
      .filter(id => { const q = byQ(id); if (!q) return false;
        if (ids && !ids.includes(q.skill)) return false;
        if (seen.has(id)) return false; seen.add(id); return true; });
  };
  const act = S.forceSkill || (sk[0] || chooseActive().id);

  if (kind === 'intro') {
    /* التعارف: سؤالان من كل مهارة بصعوبتين — ليعرف أُفق نقطة البداية */
    sk.forEach(id => { fill(id, 2, 2); fill(id, 2, 3); fill(id, 2, 4); });
    while (items.length < 12 && sk.length) fill(sk[items.length % sk.length], 1, 3);
  } else if (kind === 'drill') {
    /* التدريب: المهارة وحدها بصعوبة متدرّجة بعد قراءة مفتاحها */
    fill(act, Math.round(size * 0.3), 2);
    fill(act, Math.round(size * 0.45), 3);
    fill(act, size - items.length, 4);
  } else if (kind === 'firm') {
    /* التثبيت: أصعب، ومعه أخطاء هذه المهارة نفسها */
    myWrong([act]).slice(0, Math.round(size * 0.3))
      .forEach(id => add(byQ(id), 'review'));
    fill(act, Math.round(size * 0.4), 4);
    fill(act, size - items.length, 5);
  } else if (kind === 'link') {
    /* الوصل: أخطاء المهارتين الأوليين مشتبكة حتى لا تنفصلا في ذهنه */
    const two = sk.slice(0, 2);
    myWrong(two).slice(0, Math.round(size * 0.5)).forEach(id => add(byQ(id), 'review'));
    dueNow(two).slice(0, 4).forEach(r => add(byQ(r.qid), 'review'));
    let i = 0; while (items.length < size && two.length) { fill(two[i++ % two.length], 1, 4); }
  } else if (kind === 'review') {
    /* المراجعة الكبرى: مهارات الدورة كلّها متناوبة */
    let i = 0;
    while (items.length < size && sk.length) {
      const id = sk[i++ % sk.length];
      fill(id, 1, 3 + (i % 3));
    }
  } else if (kind === 'notes') {
    /* دفتر الأخطاء: ما أخطأ فيه في الدورة كلّها */
    myWrong(sk).slice(0, size).forEach(id => add(byQ(id), 'review'));
    dueNow(sk).slice(0, size - items.length).forEach(r => add(byQ(r.qid), 'review'));
    let i = 0; while (items.length < Math.min(size, 20) && sk.length) fill(sk[i++ % sk.length], 1, 4);
  } else if (kind === 'revive') {
    /* العودة بعد غياب: إنعاشٌ سهل من مهارات الدورة */
    let i = 0;
    while (items.length < 12 && sk.length) { fill(sk[i++ % sk.length], 1, 2); }
  } else return null;

  if (items.length < 6) return null;
  return { items, idx: 0, right: 0, wrong: 0, rStreak: 0, wStreak: 0,
    skill: kind === 'drill' || kind === 'firm' ? act : null,
    returning: null, resume: false, station: kind, size: items.length };
}

function buildSession() {
  /* محطّة دورةٍ؟ فلها شكلها الخاصّ */
  if (S.stationKind) {
    const ss = stationSession(S.stationKind);
    if (ss) { S.forceSkill = null; return ss; }
  }
  const size = S.size;
  const gap = S.lastActive === null ? 0 : S.day - S.lastActive;
  const resume = gap > 7;
  const used = new Set(), items = [];
  const push = (q, role) => { if (q) { used.add(q.id); items.push({ qid: q.id, role, done: false }); } };

  if (resume) {
    const m = masteredSkills();
    for (let i = 0; i < 6; i++) {
      const s = m.length ? m[i % m.length] : chooseActive();
      push(pool(s.id, i < 3 ? 1 : 2, used), 'warmup');
    }
    return { items, idx: 0, right: 0, wrong: 0, rStreak: 0, wStreak: 0,
      skill: null, returning: null, resume: true, size: items.length };
  }

  const active = chooseActive();
  if (S.lastActiveSkill === active.id) S.sameSkillRun = (S.sameSkillRun || 0) + 1;
  else { S.lastActiveSkill = active.id; S.sameSkillRun = 1; }
  let returning = size >= 15 ? chooseReturning(active.id) : null;
  if (returning && S.track === 'qudurat' && !samePart(returning.id, active.id)) returning = null;
  const st = S.skills[active.id];
  let diff = S.targetDiff;
  if (st.stuckSince !== null && S.day - st.stuckSince > 10) diff = Math.max(1, diff - 2);

  const nWarm = Math.max(1, Math.round(size * 0.17));
  const nReview = Math.max(1, Math.round(size * 0.25));
  const nRet = returning ? 1 : 0;
  const nActive = size - nWarm - nReview - nRet;

  /* الإحماء والمراجعة من قسم المهارة النشطة نفسه */
  const PART = partOf(active.id);
  const inPart = id => S.track !== 'qudurat' || partOf(id) === PART;
  const warmPool = masteredSkills().filter(x => inPart(x.id));
  const warm = [], act = [], rev = [], ret = [];
  for (let i = 0; i < nWarm; i++) {
    const s = warmPool.length ? warmPool[i % warmPool.length] : active;
    const q = pool(s.id, 1, used); if (q) { used.add(q.id); warm.push({ qid: q.id, role: 'warmup', done: false }); }
  }
  const due = S.review
    .filter(r => { const q = byQ(r.qid); return r.due <= S.day && q && inPart(q.skill); })
    .sort((a, b) => a.due - b.due).slice(0, nReview);
  due.forEach(r => { if (!used.has(r.qid)) { used.add(r.qid); rev.push({ qid: r.qid, role: 'review', done: false }); } });

  const order = [0, 1, -1, 1, 0, -1, 1, 0];
  // التلاشي التدريجي: في أول جلسة على مهارة، تُعرض الخطوات ثم تُحذف من آخرها
  const firstTime = (S.skills[active.id].days || []).length === 0;
  let faded = 0;
  for (let i = 0; i < nActive + (nReview - rev.length); i++) {
    const d = Math.min(5, Math.max(1, diff + (order[i % order.length])));
    const q = pool(active.id, d, used);
    if (!q) continue;
    used.add(q.id);
    const it = { qid: q.id, role: 'active', done: false };
    if (firstTime && faded < 3 && (q.steps || []).length >= 2) {
      it.fade = faded + 1;   // ١ = تُخفى الخطوة الأخيرة، ٢ = خطوتان، ٣ = بلا خطوات
      faded++;
    }
    act.push(it);
  }
  if (returning) {
    const mode = S.skills[returning.id].ignore >= 5 ? 'direct'
      : S.skills[returning.id].ignore === 4 ? 'explain_first' : 'embedded';
    const q = pool(returning.id, 1, used);
    if (q) { used.add(q.id); ret.push({ qid: q.id, role: 'returning', mode, done: false }); }
  }

  // ordering: warmup → returning/review → active (hard in middle) → easy close
  act.sort((a, b) => byQ(a.qid).d - byQ(b.qid).d);
  const easyTail = act.splice(0, Math.min(2, act.length));
  const mid = act;
  let seq = [...warm, ...ret, ...rev.slice(0, 1), ...mid, ...rev.slice(1), ...easyTail];

  // إن نفد مخزون المهارة النشطة، تُملأ الجلسة من مهارات المجال نفسه
  if (seq.length < size) {
    const filler = mySkills().filter(s => hasContent(s.id) && s.id !== active.id
      && !S.skills[s.id].paused && s.domain === active.domain && prereqOk(s)
      && inPart(s.id));
    for (const s of filler) {
      while (seq.length < size) {
        const q = pool(s.id, S.targetDiff, used);
        if (!q) break;
        used.add(q.id);
        seq.splice(seq.length - Math.min(2, seq.length), 0, { qid: q.id, role: 'active', done: false });
      }
      if (seq.length >= size) break;
    }
  }

  // ضمان ألّا تقتصر الجلسة على مهارة واحدة
  const distinct = () => new Set(seq.map(x => byQ(x.qid).skill)).size;
  if (distinct() < 3) {
    /* التنويع لا يكسر القسم: نبحث في القسم نفسه، فإن لم نجد اكتفينا بما لدينا */
    const others = mySkills().filter(s => hasContent(s.id) && !S.skills[s.id].paused
      && !seq.some(x => byQ(x.qid).skill === s.id) && prereqOk(s) && inPart(s.id));
    for (const s of others) {
      if (distinct() >= 3) break;
      const q = pool(s.id, Math.max(1, S.targetDiff - 1), used);
      if (q) { used.add(q.id); seq.splice(Math.max(2, seq.length - 3), 0,
        { qid: q.id, role: 'active', done: false }); }
    }
  }

  // أسئلة القطعة الواحدة تبقى متجاورة: نعيد ترتيب seq كاملًا
  (() => {
    const groups = [], seen = new Map();
    seq.forEach(x => {
      const pz = byQ(x.qid).passage;
      if (!pz) { groups.push([x]); return; }
      if (seen.has(pz)) seen.get(pz).push(x);
      else { const g = [x]; seen.set(pz, g); groups.push(g); }
    });
    seq = groups.flat();
  })();

  /* السؤال الذي هزمك: يعود وحده بعد أسبوعين، في آخر الجلسة */
  if (S.duel && S.duel.due <= S.day && byQ(S.duel.qid) && !seq.some(x => x.qid === S.duel.qid)) {
    seq.push({ qid: S.duel.qid, role: 'duel', done: false });
  }
  return { items: seq, idx: 0, right: 0, wrong: 0, rStreak: 0, wStreak: 0,
    skill: active.id, part: PART, returning: returning ? returning.id : null, resume: false, size: seq.length };
}
const byQ = id => Q.find(q => q.id === id);

/* ══════ وضع الأقسام: محاكاة بنية الاختبار الحقيقية ══════
   القدرات الورقي: ٥ أقسام × ٢٤ سؤالًا × ٢٥ دقيقة، لفظي وكمّي متناوبة، ١٢٥ دقيقة.
   القدرات المحوسب: ٩٦ سؤالًا / ١٣٥ دقيقة، ~٨٠ ثانية للسؤال.
   التحصيلي والبترول: ٥ أقسام × ٢٢ سؤالًا × ٢٥ دقيقة، بلا حاسبة.
   القاعدة الجامعة: لا رجوع إلى قسم انتهى — وهذا ما لا يدرَّب عليه أحد. */
const EXAM = {
  qudurat: { name:'القدرات — الورقي', sections:5, per:24, mins:25, total:120,
    alt:['verbal','quant'], note:'خمسة أقسام متناوبة بين اللفظي والكمّي. لا رجوع إلى قسم انتهى.' },
  tahsili: { name:'التحصيلي', sections:5, per:22, mins:25, total:110,
    note:'خمسة أقسام، بلا آلة حاسبة. الأرقام مصمّمة للحلّ الذهنيّ.' },
  kfupm:   { name:'اختبار القبول', sections:5, per:22, mins:25, total:110,
    note:'خمسة أقسام، بلا آلة حاسبة، على مقرّرَي الأول والثاني الثانوي.' },
  step:    { name:'ستيب', sections:4, per:25, mins:25, total:100,
    note:'أربعة أقسام متتابعة.' },
  aramco:  { name:'محاكاة', sections:3, per:20, mins:20, total:60,
    note:'ثلاثة أقسام قصيرة.' }
};
const VERBAL_SK = ['completion','analogy','odd_one','association','reading','context_error'];
/* القدرات قسمان لا يختلطان: لفظيّ وكمّيّ.
   الاختبار يفصل بينهما بالتناوب، والجلسة التدريبية يجب أن تفصل كذلك —
   لأن انتقال الذهن بين نمطين في جلسة واحدة يكلّفه ولا يفيده. */
const PART_NAME = { verbal: 'لفظيّ', quant: 'كمّيّ' };
function partOf(skillId) { return VERBAL_SK.includes(skillId) ? 'verbal' : 'quant'; }
function samePart(a, b) { return partOf(a) === partOf(b); }
function examSpec() { return EXAM[S.track] || EXAM.tahsili; }
function examBuild(secIdx) {
  const sp = examSpec(), used = new Set((S.exam && S.exam.seen) || []);
  let ids = [];
  const mine = mySkills().map(x => x.id);
  let allow = mine;
  if (sp.alt) {
    const want = sp.alt[secIdx % sp.alt.length];
    allow = mine.filter(id => want === 'verbal' ? VERBAL_SK.includes(id) : !VERBAL_SK.includes(id));
    if (!allow.length) allow = mine;
  }
  const bag = Q.filter(q => allow.includes(q.skill) && !used.has(q.id));
  for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
  ids = bag.slice(0, sp.per).map(q => q.id);
  return ids;
}
function examStart(mode) {
  const base = examSpec();
  const sp = (mode === 'mini')
    ? Object.assign({}, base, { sections: 1, name: base.name + ' — قسم واحد' })
    : base;
  S.exam = { mode: mode || 'full', sec: 0, idx: 0, seen: [], secs: [], answers: {}, spec: sp,
    endsAt: Date.now() + sp.mins * 60000, items: examBuild(0), done: false };
  go('exam');
}
function examNextSection() {
  const e = S.exam, sp = e.spec;
  const right = e.items.filter(id => e.answers[id] && e.answers[id].ok).length;
  const blank = e.items.filter(id => !e.answers[id]).length;
  e.secs.push({ n: e.sec + 1, right, total: e.items.length, blank,
    used: Math.max(0, sp.mins * 60000 - (e.endsAt - Date.now())) });
  e.seen = e.seen.concat(e.items);
  if (e.sec + 1 >= sp.sections) {
    e.done = true;
    /* لا يُحتسب موعدًا إلا النموذج الكامل — القسم الواحد تدريبٌ على الإيقاع */
    if (e.mode === 'full') {
      S.lastExamDay = S.day;
      const R = e.secs.reduce((a, x) => a + x.right, 0), T = e.secs.reduce((a, x) => a + x.total, 0);
      S.examLog = (S.examLog || []).concat([{ day: S.day, right: R, total: T }]).slice(-8);
    }
    saveState(); go('examDone'); return;
  }
  e.sec += 1; e.idx = 0; e.items = examBuild(e.sec);
  e.endsAt = Date.now() + sp.mins * 60000;
  go('examBreak');
}
function examTick() {
  const e = S.exam;
  if (!e || e.done || S.screen !== 'exam') return;
  const left = e.endsAt - Date.now();
  const el = document.getElementById('exClock');
  if (el) {
    const t = Math.max(0, Math.floor(left / 1000));
    el.textContent = ar(String(Math.floor(t / 60)).padStart(2,'0')) + ':' + ar(String(t % 60).padStart(2,'0'));
    el.classList.toggle('low', t <= 120);
  }
  const bar = document.getElementById('exBar');
  if (bar) bar.style.width = Math.max(0, Math.min(100, left / (e.spec.mins * 600))) + '%';
  if (left <= 0) examNextSection();
}
setInterval(examTick, 500);

/* ── صباح الأمس: سطر يكتبه الطالب لنفسه، يعود إليه غدًا بخطّه ── */
function noteComposer() {
  const today = (S.notes || []).some(n => n.day === S.day);
  if (today) {
    const n = (S.notes || []).find(x => x.day === S.day);
    return `<div class="notec done"><div class="eyebrow">لنفسك غدًا</div>
      <p class="notetx">${esc(n.text)}</p></div>`;
  }
  return `<div class="notec"><div class="eyebrow">لنفسك غدًا</div>
    <p class="soft" style="margin:6px 0 12px">سطر واحد. لن يقرأه أحد سواك.</p>
    <input id="noteIn" class="notefield" type="text" maxlength="90"
      autocomplete="off" enterkeyhint="done" placeholder="ما الذي تريد أن تقوله لنفسك غدًا؟">
    <button class="btn ghost" data-act="saveNote" style="margin-top:10px">اختِم اليوم</button></div>`;
}
/* ── التدريب شيء، والاختبار شيء آخر ──
   التدريب يوميّ قصير، يشرح بعد كل سؤال، ولا يُحاسب.
   الاختبار يأتي بعد أن يشرب الطالب الأفكار: بنِسَب الاختبار الحقيقي،
   بلا شرح أثناءه، وبمؤقّت — ثم يُفتح كلّ شيء بعده. */
/* ── الاختبار الدوريّ: كل أربعة عشر يومًا نموذج كامل ──
   التدريب يبني، والاختبار يقيس. وبينهما مسافة مقصودة: أسبوعان
   يكفيان ليتغيّر شيء حقيقيّ، ولا يطولان حتى يُنسى القياس. */
const EXAM_EVERY = 14;
function examDue() {
  if (!examReady().ok) return null;
  const last = S.lastExamDay;
  if (last == null) return S.sessionCount >= 4 ? { first: true, over: 0 } : null;
  const over = S.day - last - EXAM_EVERY;
  return over >= 0 ? { first: false, over } : null;
}
function examCountdown() {
  if (S.lastExamDay == null) return null;
  return Math.max(0, EXAM_EVERY - (S.day - S.lastExamDay));
}
function examReady() {
  const built = mySkills().filter(x => S.skills[x.id] &&
    (S.skills[x.id].status === 'mastered' || S.skills[x.id].status === 'near')).length;
  return { built, ok: S.sessionCount >= 3 || built >= 2 };
}
function examInvite() {
  const r = examReady(), sp = examSpec(), due = examDue();
  /* حان موعد القياس الدوريّ — نداءٌ صريح لا خيارٌ مدفون */
  if (due) return `<div class="exinv due">
    <div class="exih">${due.first ? 'أول اختبار كامل' : 'حان موعد اختبارك الدوريّ'}</div>
    <p class="exib">${due.first
      ? `درّبتَ ${ar(S.sessionCount)} جلسة. الآن نقيس أين أنت فعلًا — نموذج كامل بمواصفة الاختبار الحقيقي.`
      : `مضى ${ar(S.day - S.lastExamDay)} يومًا على آخر اختبار. الفرق بينهما هو تقدّمك الحقيقيّ.`}
      ${ar(sp.sections)} أقسام × ${ar(sp.per)} سؤالًا × ${ar(sp.mins)} دقيقة.</p>
    <div class="exsel">
      <button data-act="examOpen" data-arg="mini">
        <b>قسم واحد</b><span>${ar(sp.per)} سؤالًا · ${ar(sp.mins)} دقيقة</span></button>
      <button class="pri" data-act="examOpen" data-arg="full">
        <b>النموذج الكامل</b><span>${ar(sp.sections)} أقسام · ${ar(sp.sections * sp.mins)} دقيقة</span></button>
    </div>
  </div>`;
  if (!r.ok) {
    if (S.sessionCount < 2) return '';
    return `<div class="exinv locked">
      <div class="exih">الاختبار — لم يحن بعد</div>
      <p class="exib">يُفتح بعد أن تُتقن ثلاث مهارات أو تُكمل أربع جلسات.
        التدريب أولًا، والقياس بعده — لا العكس.</p>
      <span class="exia dim">أتقنتَ ${ar(r.built)} من ٣ ›</span>
    </div>`;
  }
  return `<div class="exinv">
    <div class="exih">الاختبار — لا تدريب</div>
    <p class="exib">بنِسَب الاختبار الحقيقي، وبمؤقّت، وبلا شرح أثناءه.
      ${esc(sp.note)}</p>
    <div class="exsel">
      <button data-act="examOpen" data-arg="mini">
        <b>قسم واحد</b><span>${ar(sp.per)} سؤالًا · ${ar(sp.mins)} دقيقة</span></button>
      <button data-act="examOpen" data-arg="full">
        <b>النموذج الكامل</b><span>${ar(sp.sections)} أقسام · ${ar(sp.sections * sp.mins)} دقيقة</span></button>
    </div>
  </div>`;
}
/* كانت الرئيسة تكدّس أربع بطاقات ثانوية فتطول. الآن واحدة بالأولوية. */
function oneCard() {
  return restoredCard() || backupNudge() || phaseCard() || noteBack()
      || gradeCard() || installInvite() || iosHint() || '';
}
/* بعد الاستعادة: يُطمأن الطالب أنه لم يبدأ من الصفر، ويُرى له أين وقف */
function restoredCard() {
  const r = S.restored;
  if (!r) return '';
  return `<div class="hoff" style="margin-top:14px">
    <div class="eyebrow">استُعيدت نسختك</div>
    <p class="hwhy" style="margin-top:8px;color:var(--ink)">
      ${esc(r.name)} — اليوم ${ar(r.day)} · ${esc(r.phase)}</p>
    <div class="kv" style="margin-top:10px"><span>الجلسات</span><span class="v num">${ar(r.sessions)}</span></div>
    <div class="kv"><span>السلسلة</span><span class="v num">${ar(r.streak)} ${r.streak === 1 ? 'يوم' : 'يومًا'}</span></div>
    <div class="kv"><span>مهارات بدأتَها</span><span class="v num">${ar(r.skills)}</span></div>
    <div class="kv" style="border:0"><span>أخطاء محفوظة</span><span class="v num">${ar(r.errors)}</span></div>
    <p class="hwhy" style="margin-top:10px">لم تبدأ من جديد. تابع من حيث وقفت.</p>
    <button class="btn" style="margin-top:12px" data-act="clearRestored">تمام</button>
  </div>`;
}
/* تذكير هادئ بالحفظ: كل أسبوعين، أو بعد نموذج كامل */
function backupNudge() {
  if (!S.name || (S.sessionCount || 0) < 5) return '';
  const last = S.lastBackupDay;
  const since = last == null ? S.day : S.day - last;
  if (since < 14) return '';
  if (S.nudgeSeen === S.day) return '';
  return `<div class="hoff" style="margin-top:14px">
    <div class="eyebrow">احفظ نسختك</div>
    <p class="hwhy" style="margin-top:8px">${last == null
      ? 'تقدّمك محفوظ في متصفّح هذا الجهاز وحده. مسحُ بياناته يمحوه.'
      : `مضى ${ar(since)} يومًا على آخر نسخة حفظتَها.`}
      احفظ ملفًّا وأرسله إلى نفسك — دقيقة تحمي ${ar(S.sessionCount)} جلسة.</p>
    <button class="btn" style="margin-top:12px" data-act="exportState">احفظ الآن</button>
    <button class="skipl" data-act="dismissNudge">لاحقًا</button>
  </div>`;
}
/* حين تتبدّل المرحلة، يقترح التطبيق التحوّل مرّةً واحدة ولا يفرضه */
function phaseCard() {
  const p = phaseNow();
  if (!p || !S.name) return '';
  const cur = S.focus || 'all';
  if (cur === p.focus) return '';
  if (S.phaseSeen === p.name) return '';
  return `<div class="hoff" style="margin-top:14px">
    <div class="eyebrow">${esc(p.name)}</div>
    <p class="hwhy" style="margin-top:8px">${esc(p.note)}</p>
    <button class="btn" style="margin-top:12px" data-act="takePhase" data-arg="${p.focus}">
      انتقل إلى ${p.focus === 'all' ? 'المراجعة' : 'القسم ' + PART_NAME[p.focus]}</button>
    <button class="skipl" data-act="dismissPhase" data-arg="${esc(p.name)}">أكمل على ما أنا عليه</button>
  </div>`;
}
function noteBack() {
  const ns = (S.notes || []).filter(n => n.day < S.day);
  if (!ns.length) return '';
  const n = ns[ns.length - 1];
  if (S.noteSeen === n.day) return '';
  const gap = S.day - n.day;
  const when = gap === 1 ? 'أمس' : `قبل ${ar(gap)} أيام`;
  return `<div class="noteback" data-act="closeNote">
    <div class="nbh">كتبتَ ${esc(when)}</div>
    <p class="nbt">${esc(n.text)}</p>
    <span class="nbx">شكرًا لك ✕</span></div>`;
}
/* ── الجلسة تعرف متى تتوقّف ── */
function stopCard() {
  if (!S.stopOffer) return '';
  return `<div class="stopc">
    <div class="sch">هذه المهارة تحتاج نفَسًا أطول</div>
    <p class="scb">ثلاثة أخطاء متتالية ليست فشلًا — هي إشارة أن اليوم كفى.
      إن أغلقتَها الآن فلن تنكسر سلسلتك، والغد يبدأ أسهل.</p>
    <div class="scbt">
      <button data-act="stopNow">نكملها غدًا</button>
      <button class="pri" data-act="stopGo">أكمل الآن</button>
    </div></div>`;
}

/* ---------- in-session adaptation ---------- */
function adapt(sess) {
  const nxt = sess.items[sess.idx];
  if (!nxt) return;
  const used = new Set(sess.items.map(i => i.qid));
  if (sess.wStreak >= 3) {
    const m = masteredSkills();
    const s = m.length ? m[0] : { id: sess.skill };
    const q = pool(s.id, 1, used);
    if (q) { sess.items[sess.idx] = { qid: q.id, role: 'warmup', done: false }; sess.wStreak = 0; }
  } else if (sess.rStreak >= 4 && nxt.role === 'active') {
    const q = pool(sess.skill, Math.min(5, byQ(nxt.qid).d + 1), used);
    if (q) { sess.items[sess.idx] = { qid: q.id, role: 'active', done: false }; sess.rStreak = 0; }
  }
}

/* ---------- recording ---------- */
function record(item, correct, skipped) {
  const q = byQ(item.qid);
  const st = S.skills[q.skill];
  S.asked[q.id] = S.day;
  const ok = correct && !skipped;
  st.window.push(ok); if (st.window.length > 15) st.window.shift();
  /* الزمن يُقاس ولا يُعرض للطالب أبدًا: عرضُه يدفعه إلى السرعة فيخطئ.
     ولا يُستعمل إلا مكافأةً حين تكون الدقّة عالية أصلًا. */
  if (S.qStart && S.qStartFor === q.id) {
    const sec = Math.min(180, Math.round((Date.now() - S.qStart) / 1000));
    if (sec >= 2) { st.times = st.times || []; st.times.push(sec); if (st.times.length > 15) st.times.shift(); }
  }
  S.qStart = null; S.qStartFor = null;
  if (!st.days.includes(S.day)) st.days.push(S.day);
  if (st.first === null) st.first = S.day;
  st.last = S.day;
  if (!ok) {
    if (!S.review.find(r => r.qid === q.id)) S.review.push({ qid: q.id, due: S.day + 1, interval: 1 });
  } else {
    const r = S.review.find(x => x.qid === q.id);
    if (r) {
      S.review = S.review.filter(x => x.qid !== q.id);
      if (!S.corrected.find(c => c.qid === q.id)) S.corrected.push({ qid: q.id, day: S.day });
    }
  }
  evaluate(q.skill);
}

function finishSession(sess) {
  const touched = [...new Set(sess.items.map(i => byQ(i.qid).skill))];
  const before = {}; touched.forEach(id => before[id] = S.skills[id].status);
  touched.forEach(evaluate);
  const changed = touched.filter(id => before[id] !== S.skills[id].status && S.skills[id].status !== 'building');
  /* عدّ الإخفاق لكل سؤال — منه تُولد «المبارزة» */
  S.qMiss = S.qMiss || {};
  let duelWon = null;
  sess.items.forEach(it => {
    if (it.role === 'duel') duelWon = !it.wrong;
    if (it.wrong) S.qMiss[it.qid] = (S.qMiss[it.qid] || 0) + 1;
    else if (S.qMiss[it.qid]) S.qMiss[it.qid] = 0;
  });
  if (duelWon !== null) {
    if (duelWon) { S.qMiss[S.duel.qid] = 0; S.duel = null; }
    else S.duel = { qid: S.duel.qid, due: S.day + 10 };
  }
  if (!S.duel) {
    const beaten = Object.keys(S.qMiss).filter(id => S.qMiss[id] >= 2 && byQ(id));
    if (beaten.length) S.duel = { qid: beaten[0], due: S.day + 14 };
  }
  markRoundDone();
  const pct = sess.items.length ? sess.right / sess.items.length : 0;
  if (pct > 0.85) S.targetDiff = Math.min(5, S.targetDiff + 1);
  else if (pct < 0.6) S.targetDiff = Math.max(1, S.targetDiff - 1);
  if (S.lastActive === null || S.day - S.lastActive <= 3) S.streak += 1; else S.streak = Math.max(S.streak, 1);
  S.todayCount = (S.lastActive === S.day ? (S.todayCount || 0) : 0) + 1;
  S.lastActive = S.day;
  S.sessionCount += 1;
  // advance review intervals
  S.review.forEach(r => { if (r.due <= S.day) { r.interval = Math.min(21, r.interval * 2 + 1); r.due = S.day + r.interval; } });
  S.paceHist = (S.paceHist || []);
  if (sess.timed >= 4) S.paceHist.push(Math.round(sess.time / sess.timed));
  if (S.paceHist.length > 10) S.paceHist.shift();
  S.history = S.history || [];
  S.history.unshift({
    day: S.day, right: sess.right, total: sess.items.length,
    pace: sess.timed >= 4 ? Math.round(sess.time / sess.timed) : null,
    items: sess.items.map(it => {
      const q = byQ(it.qid);
      const ci = q.choices.findIndex(c => c.c);
      return { skill: SKILLS[q.skill].name, stem: q.stem, role: it.role,
               d: q.d, chosen: it.choiceIdx, correct: ci,
               chosenT: it.choiceIdx == null ? null : q.choices[it.choiceIdx].t,
               correctT: q.choices[ci].t };
    })
  });
  if (S.history.length > 40) S.history.pop();
  S.lastSummary = {
    pace: sess.timed >= 4 ? Math.round(sess.time / sess.timed) : null,
    right: sess.right, total: sess.items.length, skill: sess.skill,
    changed, wrongQ: sess.items.filter(i => i.wrong).map(i => i.qid), resume: sess.resume,
    duelWon, stopped: !!sess.stopped
  };
  /* إن كانت الجلسة محطّةَ دورةٍ فُتحت بها، سجّلها وافتح التي بعدها */
  if (courseActive() && S.stationKind) {
    courseAdvance(sess.right, sess.items.length,
      sess.items.filter(i => i.wrong).map(i => i.qid));
    S.stationKind = null;
  }
  S.session = null;
}


/* ---------- الخطة: تتوقّع ولا تُلزِم، وتُعاد حسابها كل يوم ---------- */
const TRACK_THEME = { qudurat:'royal', tahsili:'forest', kfupm:'obsidian', step:'plum', aramco:'petrol' };
/* ══════════ المسارات المعروضة ══════════
   البترول وأرامكو مؤجَّلان: محتواهما باقٍ كاملًا في البنك ولا يُعرَضان للطالب.
   السبب أن مواصفتيهما لم تُدرَسا بالقدر الذي دُرست به القدرات والتحصيلي وستيب،
   وأن جمهورهما مختلف في وقته ورسالته. يُفتحان حين تكتمل الجاهزية.
   لإعادتهما: أضف 'kfupm' و'aramco' إلى OPEN_TRACKS — ولا حاجة إلى شيء آخر. */
const OPEN_TRACKS = ['qudurat', 'tahsili', 'step'];
const isOpenTrack = t => OPEN_TRACKS.includes(t);

const TRACKS = {
  qudurat: { id:'qudurat', accentDay:'#3A5F8F', tintDay:'rgba(58,95,143,.13)', name:'القدرات', stages:['s1','s2','s3'], accent:'#7FA8D9', tint:'rgba(127,168,217,.13)',
    journey:'رحلة التفكير', verb:'تُفكّر', motto:'الاختبار لا يسأل عمّا حفظتَ، بل عن كيف تفكّر.',
    tag:'طريقة التفكير', glyph:'<circle cx="24" cy="24" r="15"/><path d="M24 9v30M9 24h30"/>' },
  tahsili: { id:'tahsili', accentDay:'#2E6E56', tintDay:'rgba(46,110,86,.13)', name:'التحصيلي', stages:['s1','s2','s3'], accent:'#7CC7A6', tint:'rgba(124,199,166,.13)',
    journey:'رحلة المواد الأربع', verb:'تُتقن', motto:'أربع مواد لا تُختصر — تُبنى مادةً مادة.',
    tag:'أربع مواد علمية', glyph:'<path d="M18 8v14L9 38h30l-9-16V8"/><path d="M15 8h18"/>' },
  kfupm:   { id:'kfupm', accentDay:'#8A6420', tintDay:'rgba(138,100,32,.13)',   name:'البترول', stages:['s1','s2','s3'], accent:'#D9A96A', tint:'rgba(217,169,106,.13)',
    journey:'رحلة القبول', verb:'تستعدّ', motto:'لا حاسبة هنا — والأرقام نظيفة عمدًا.',
    tag:'علوم ومهارات', glyph:'<path d="M24 6 40 34H8z"/><path d="M24 20v8"/><circle cx="24" cy="34" r="1.6"/>' },
  step:    { id:'step', accentDay:'#6A4E96', tintDay:'rgba(106,78,150,.13)',    name:'ستيب',    stages:['s1','s2','s3'], accent:'#B79BD6', tint:'rgba(183,155,214,.13)',
    journey:'رحلة اللغة', verb:'تتمكّن', motto:'اللغة تُبنى بالتكرار لا بالحفظ.',
    tag:'كفاية الإنجليزية', glyph:'<path d="M10 34V14a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v20"/><path d="M10 34h28"/><path d="M18 22h12M18 28h8"/>' },
  aramco:  { id:'aramco', accentDay:'#9C4545', tintDay:'rgba(156,69,69,.13)',  name:'أرامكو',  stages:['s1','s2','s3'], accent:'#D98C8C', tint:'rgba(217,140,140,.13)',
    journey:'رحلة التوظيف', verb:'تجهز', motto:'سرعة ودقّة معًا — هذا ما يُقاس.',
    tag:'رياضيات وإنجليزية', glyph:'<path d="M8 38V20l16-12 16 12v18"/><path d="M18 38V26h12v12"/>' }
};
function makeSuggestion() {
  if (!S.sizeManual) { const z = decideSize(); S.size = (z && typeof z === 'object') ? (z.v || 30) : (+z || 30); }
  return makeSuggestion__inner.apply(null, arguments);
}
// ── عرض السؤال بحسب نوعه — لا قالب واحد ──
function stemView(q) {
  const raw = String(q.stem || '');
  const L = raw.split('\n').map(x => x.trim()).filter(Boolean);
  const ltr = isLTR(raw) ? ' ltr' : '';

  // ① التناظر — زوج مقابل زوج
  if (q.skill === 'analogy') {
    let m = raw.match(/^\s*(.+?)\s*:\s*(.+?)\s*(?:::|∷)\s*[؟?]\s*$/);
    if (!m) { const p2 = raw.replace(/\s*[:：]\s*/g, ':').split(':');
      if (p2.length === 2 && p2[0].trim() && p2[1].trim() && raw.length < 60)
        m = [raw, p2[0].trim(), p2[1].trim()]; }
    if (m) return `<div class="sv sv-an">
      <div class="an-p"><span class="an-w">${esc(m[1])}</span>
        <span class="an-c">:</span><span class="an-w">${esc(m[2])}</span></div>
      <div class="an-vs">تُقابِلها</div>
      <div class="an-p ask"><span class="an-w q">؟</span>
        <span class="an-c">:</span><span class="an-w q">؟</span></div>
    </div>`;
  }

  // ② المفردة الشاذّة — بطاقات لا سطر
  if (q.skill === 'odd_one') {
    let words = null, ask = raw;
    if (L.length > 1) {
      const cand = L[L.length - 1].split(/\s*·\s*|\s*[-–—]\s*|\s*،\s*/).filter(Boolean);
      if (cand.length >= 3) { words = cand; ask = L.slice(0, -1).join(' '); }
    }
    if (!words) return `<div class="sv sv-od"><p class="sv-ask big">${esc(ask)}</p>
      <p class="od-hint">اختر الخارجة عن الجماعة من الخيارات</p></div>`;
    return `<div class="sv sv-od">
      <p class="sv-ask">${esc(ask)}</p>
      <div class="chips">${words.map((w, i) =>
        `<span class="chip" style="--d:${i * 80}ms">${esc(w.trim())}</span>`).join('')}</div>
    </div>`;
  }

  // ③ المقارنات — لوحان متقابلان
  if (q.skill === 'comparisons') {
    let a = null, b = null, head = '';
    if (L.length >= 2) {
      const fa = L.find(x => /^القيمة الأولى/.test(x));
      const fb = L.find(x => /^القيمة الثانية/.test(x));
      if (fa && fb) { a = fa.replace(/^القيمة الأولى\s*:?\s*/, ''); b = fb.replace(/^القيمة الثانية\s*:?\s*/, '');
        head = L.filter(x => x !== fa && x !== fb).join(' '); }
    }
    if (!a) { const m = raw.match(/أ\)\s*([^ب]+?)\s*ب\)\s*(.+)$/s);
      if (m) { a = m[1].trim(); b = m[2].trim();
        head = raw.slice(0, raw.indexOf('أ)')).replace(/قارن بين[^:]*:?/, '').trim(); } }
    if (a && b) return `<div class="sv sv-cmp">
      ${head ? `<p class="sv-ask">${esc(head)}</p>` : ''}
      <div class="cmp2">
        <div class="cv"><span class="cl">الأولى</span><span class="cx${ltr}">${esc(a)}</span></div>
        <div class="cmid">؟</div>
        <div class="cv"><span class="cl">الثانية</span><span class="cx${ltr}">${esc(b)}</span></div>
      </div>
    </div>`;
  }

  // ④ الخطأ السياقي — الجملة في بطاقة اقتباس
  if (q.skill === 'context_error') {
    const ask = L.length > 1 ? L[0] : 'أيّ الكلمات الآتية وُضعت في غير موضعها الصحيح؟';
    const sent = L.length > 1 ? L.slice(1).join(' ') : raw;
    return `<div class="sv sv-ce">
      <p class="sv-ask">${esc(ask)}</p>
      <div class="quote"><span class="qm">”</span>${esc(sent)}</div>
    </div>`;
  }

  // ⑤ إكمال الجمل — الفراغ يُبرز
  if (q.skill === 'completion' || q.skill === 'sp_word' || q.skill === 'sp_tense'
      || q.skill === 'sp_prep' || q.skill === 'sp_agree' || q.skill === 'sp_article') {
    const marked = esc(raw)
      .replace(/\.{4,}|_{3,}|\u2026{2,}/g, '<span class="blankx"></span>')
      .replace(/\s______\s/g, ' <span class="blankx"></span> ');
    if (marked.includes('blankx')) return `<div class="sv sv-cp">
      <p class="stem${ltr}">${marked}</p></div>`;
  }
  return `<p class="stem${ltr}">${esc(raw)}</p>`;
}
const ideaGlyph = sz => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none"
  stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 3.2 4.6 7v10L12 20.8 19.4 17V7Z"/><path d="M12 3.2v17.6M4.6 7 12 10.8 19.4 7"/></svg>`;
const trackGlyph = (id, sz) => `<svg viewBox="0 0 48 48" width="${sz}" height="${sz}" fill="none"
  stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TRACKS[id].glyph}</svg>`;
function buildPlan() {
  const daysLeft = Math.max(1, S.examDays - S.day);
  const weeks = Math.max(1, Math.round(daysLeft / 7));
  const last = trackStages(S.track).slice(-1)[0];
  const pool = mySkills().filter(s => s.stage !== (last && last.id) && !S.skills[s.id].paused);
  const done = pool.filter(s => S.skills[s.id].status === 'mastered').length;
  const left = Math.max(1, pool.length - done);
  // العمق: كلما اتسع الوقت، زادت الجلسات لكل مهارة — لا العكس.
  // الحد الأدنى ٤ جلسات أسبوعيًا لأن العادة لا تتكوّن بأقل من ذلك.
  const FLOOR = 7, CEIL = 11;
  let depth = Math.min(12, Math.max(5, Math.round((weeks * FLOOR) / left)));
  let rhythm = Math.ceil((left * depth) / weeks);
  let mode, note, coverage = 'كاملة';
  if (rhythm < FLOOR) { rhythm = FLOOR; depth = Math.round((rhythm * weeks) / left); }
  if (rhythm > CEIL)  { rhythm = CEIL; depth = 5; coverage = 'بأولوية'; }

  if (weeks >= 16)      { mode = 'عميق';
      note = `الوقت يتسع للعمق: نحو ${ar(depth)} جلسات لكل مهارة، ومراجعة أطول. والإيقاع يبقى يوميًا — لأن التقدّم يأتي من أيام لا تنقطع، لا من أيام طويلة متباعدة.`; }
  else if (rhythm <= 4) { mode = 'مريح';   note = 'معك وقت. التغطية كاملة بلا ضغط.'; }
  else if (rhythm <= 5) { mode = 'متوازن'; note = 'الوقت يكفي بإيقاع ثابت.'; }
  else                  { mode = 'مركّز';  note = 'الوقت ضيق — نبدأ بالمهارات الأكثر تكرارًا في الاختبار.'; }
  const stages = trackStages(S.track).map(st => {
    const n = mySkills().filter(s => s.stage === st.id).length;
    const share = st.id === (last && last.id) ? 0.12
      : (mySkills().filter(s => s.stage === st.id && !S.skills[s.id].paused).length / pool.length) * 0.88;
    return { id: st.id, name: st.name, skills: n, weeks: Math.max(1, Math.round(weeks * share)) };
  });
  const months = Math.round(weeks / 4.33);
  const span = weeks >= 13
    ? `${ar(months)} ${months === 1 ? 'شهر' : months === 2 ? 'شهران' : months <= 10 ? 'أشهر' : 'شهرًا'}`
    : `${ar(weeks)} ${weeks === 1 ? 'أسبوع' : weeks === 2 ? 'أسبوعان' : 'أسابيع'}`;
  return { daysLeft, weeks, months, span, rhythm, depth, mode, note, coverage, done, total: pool.length, stages };
}



/* ---------- ماذا يستطيع ولي الأمر أن يفعل ---------- */
function parentActions() {
  const gap = S.lastActive === null ? null : S.day - S.lastActive;
  const days = new Set();
  mySkills().forEach(s => (S.skills[s.id].days || []).forEach(d => { if (S.day - d < 7) days.add(d); }));
  const stuck = mySkills().filter(s => { const st = S.skills[s.id];
    return st.status === 'building' && st.stuckSince !== null && (S.day - st.stuckSince) > 10; });
  const fresh = mySkills().filter(s => S.skills[s.id].status === 'mastered'
    && (S.day - S.skills[s.id].last) < 7);
  const near = mySkills().filter(s => S.skills[s.id].status === 'near');
  const left = Math.max(0, S.examDays - S.day);
  const out = [];

  if (S.sessionCount === 0) out.push({ t:'افتحه معه أول مرة',
    b:'الجلسة الأولى اثنا عشر سؤالًا. اجلس بجانبه فيها ثم اتركه — البداية المشتركة تكفي، والمتابعة اليومية تفسدها.' });

  if (gap !== null && gap >= 5) out.push({ t:`عاد بعد انقطاع ${ar(gap)} أيام`,
    b:'لا تبدأ بسؤال «ليش ما ذاكرت؟». اقترح جلسة قصيرة فقط — من الإعدادات، حجم «قصيرة ٦ أسئلة». العودة أهم من الكمية، والتطبيق يخفّض الصعوبة تلقائيًا عند الاستئناف.' });

  stuck.slice(0, 1).forEach(s => out.push({ t:`«${s.name}» متعثّرة منذ أكثر من عشرة أيام`,
    b:'هذه الحالة تعني أن التكرار وحده لن يحلّها — ينقصه الفهم لا التمرين. اجلس معه ربع ساعة على هذه المهارة تحديدًا، أو ابحث له عن شرح قصير لها وحدها. لا تفتح غيرها.' }));

  fresh.slice(0, 1).forEach(s => out.push({ t:`أكمل «${s.name}» هذا الأسبوع`,
    b:'اذكرها بالاسم. «شفت إنك خلّصت ' + s.name + '» أوقع بكثير من «برافو» — التقدير المحدد يُصدَّق، والعام يُتجاهل.' }));

  if (near.length && !stuck.length) out.push({ t:`«${near[0].name}» على وشك الاكتمال`,
    b:'جلستان أو ثلاث وتكتمل. هذه أفضل لحظة لتشجيع خفيف — قربُ الإنجاز يدفع أكثر من أي تذكير.' });

  if (days.size >= 1 && days.size < 3 && (gap === null || gap < 5)) out.push({
    t:'الإيقاع متقطّع — المشكلة موعد لا انضباط',
    b:'من يذاكر يومين في الأسبوع لم يفشل في الالتزام، بل لم يحجز وقتًا ثابتًا بعد. اسأله: «متى أنسب وقت لك؟» ثم اضبط التذكير عليه من الإعدادات. الموعد المرتبط بشيء يفعله أصلًا — بعد العشاء، بعد التمرين — يثبت أسرع من أي تذكير متكرر.' });

  if (days.size >= 4 && !stuck.length) out.push({ t:'الإيقاع مستقر — لا تفعل شيئًا',
    b:'أصعب إجراء وأنفعها. التدخّل عند الاستقرار يحوّل العادة إلى واجب، والعادة أهش مما تبدو في أسابيعها الأولى.' });

  if (left <= 30 && days.size < 3) out.push({ t:`بقي ${ar(left)} يومًا على الاختبار`,
    b:'الإيقاع أقل من المطلوب والوقت يضيق. الأنفع الآن ليس زيادة الساعات، بل تثبيت موعد يومي واحد — بعد صلاة المغرب مثلًا — وربطه بشيء يفعله أصلًا.' });

  if (!out.length) out.push({ t:'لا يوجد ما يستدعي تدخّلك',
    b:'الوضع طبيعي هذا الأسبوع. اكتفِ بالسؤال العام: «كيف ماشي معك أفق؟» واترك له الإجابة.' });

  return out.slice(0, 2);
}

/* ---------- التقرير الأسبوعي لولي الأمر ---------- */
function weekReport() {
  const days = new Set();
  SKILL_LIST.forEach(s => (S.skills[s.id].days || []).forEach(d => { if (S.day - d < 7) days.add(d); }));
  const built = mySkills().filter(s => S.skills[s.id].status === 'mastered');
  const near  = mySkills().filter(s => S.skills[s.id].status === 'near');
  const active = S.suggestion ? S.suggestion.name : (chooseActive() || {}).name;
  const gap = S.lastActive === null ? null : S.day - S.lastActive;
  let state, tone;
  if (gap === null)      { state = 'لم يبدأ بعد'; tone = 'warn'; }
  else if (gap >= 7)     { state = `انقطاع ${ar(gap)} أيام`; tone = 'warn'; }
  else if (days.size >= 4) { state = 'إيقاع ثابت'; tone = 'good'; }
  else if (days.size >= 2) { state = 'إيقاع متقطّع'; tone = 'mid'; }
  else                     { state = 'نشاط ضعيف هذا الأسبوع'; tone = 'warn'; }
  return { days: days.size, built, near, active, streak: S.streak, state, tone,
           weeks: buildPlan().span, rhythm: buildPlan().rhythm };
}




/* ---------- بطاقات المصطلحات: استرجاع متباعد ---------- */
function cardSession(skillId, n) {
  const all = (cardsBySkill[skillId] || []);
  if (!all.length) return null;
  const st = S.cardState || (S.cardState = {});
  const due = all.filter(c => !st[c.id] || st[c.id].due <= S.day);
  const pick = (due.length ? due : all).slice(0, n);
  return { cards: pick, idx: 0, right: 0, skill: skillId };
}
function cardAnswer(ok) {
  const cs = S.cardSess, c = cs.cards[cs.idx];
  const st = S.cardState[c.id] || { box: 0 };
  st.box = ok ? Math.min(5, st.box + 1) : 0;
  st.due = S.day + [1, 2, 4, 8, 16, 30][st.box];
  S.cardState[c.id] = st;
  if (ok) cs.right++;
  cs.idx++;
  if (cs.idx >= cs.cards.length) { S.cardSess = null; go('cardsDone'); }
  else { S.cardShow = false; render(); }
}

/* ---------- مرساة العادة ---------- */
const ANCHORS = [
  { id:'school',  t:'بعد المدرسة', b:'أول ما تصل' },
  { id:'maghrib', t:'بعد المغرب',  b:'قبل العشاء' },
  { id:'isha',    t:'بعد العشاء',  b:'آخر الليل مرهق' },
  { id:'sport',   t:'بعد التمرين', b:'الذهن صافٍ' },
  { id:'before',  t:'قبل الجوال',  b:'قبل أن تفتحه' },
  { id:'clock',   t:'وقت أحدده',   b:'ساعة ثابتة' }
];

/* ══════════ جدول الجولات اليومية ══════════
   أثر التوزيع: ثلاث جولات قصيرة تفوق جلسةً واحدة بالمدّة نفسها.
   والتقديم مسموح بلا حدّ — أمّا التأخير فتذكيرٌ واحد هادئ، لا لوم. */
const ROUND_KINDS = {
  new:    { t: 'مهارة جديدة', b: 'أصعب جولة — ولذلك أوّلها' },
  review: { t: 'أخطاء اليوم',  b: 'ما أخطأتَ فيه يعود وحده' },
  ideas:  { t: 'أفكار وبطاقات', b: 'قراءة لا حساب — قبل النوم بساعة' }
};
/* جدولان مستقلّان: أيام الدراسة تختلف عن نهاية الأسبوع.
   والمواعيد الافتراضية تتجنّب ما بين المغرب والعشاء. */
/* الطالب يزيد جولاته وينقصها بنفسه حتى ثماني جولات في اليوم.
   الأنماط اقتراحٌ لا سقف. */
const MAX_ROUNDS = 8;
const ROUND_TEMPLATE = [
  { at: '15:30', mins: 15, kind: 'new' },    { at: '16:45', mins: 15, kind: 'new' },
  { at: '18:00', mins: 12, kind: 'review' }, { at: '19:15', mins: 12, kind: 'new' },
  { at: '20:30', mins: 12, kind: 'review' }, { at: '21:30', mins: 10, kind: 'new' },
  { at: '22:15', mins: 8,  kind: 'ideas' },  { at: '22:50', mins: 8,  kind: 'review' }
];
const ROUND_PRESETS = {
  light:  { name: 'خفيف', week: [{ at: '16:30', mins: 15, kind: 'new' },
                                 { at: '21:00', mins: 10, kind: 'review' }],
                          wknd: [{ at: '11:00', mins: 15, kind: 'new' },
                                 { at: '17:00', mins: 10, kind: 'review' }] },
  steady: { name: 'ثابت', week: [{ at: '16:30', mins: 15, kind: 'new' },
                                 { at: '21:00', mins: 12, kind: 'review' },
                                 { at: '22:15', mins: 8,  kind: 'ideas' }],
                          wknd: [{ at: '10:30', mins: 18, kind: 'new' },
                                 { at: '17:00', mins: 12, kind: 'review' },
                                 { at: '21:00', mins: 8,  kind: 'ideas' }] },
  full:   { name: 'مكثّف', week: [{ at: '15:30', mins: 15, kind: 'new' },
                                 { at: '17:30', mins: 12, kind: 'new' },
                                 { at: '21:00', mins: 15, kind: 'review' },
                                 { at: '22:15', mins: 8,  kind: 'ideas' }],
                          wknd: [{ at: '10:00', mins: 20, kind: 'new' },
                                 { at: '13:00', mins: 15, kind: 'new' },
                                 { at: '17:00', mins: 15, kind: 'review' },
                                 { at: '21:00', mins: 10, kind: 'ideas' }] }
};
/* نهاية الأسبوع في السعودية: الجمعة والسبت */
function isWeekend() { const d = new Date().getDay(); return d === 5 || d === 6; }
function dayKey() { return isWeekend() ? 'wknd' : 'week'; }
function roundKind(k) { return ROUND_KINDS[k] || ROUND_KINDS.new; }
function nowMin() { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
function hm2min(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fmtTime(t) {
  const [h, m] = t.split(':').map(Number);
  const pm = h >= 12, h12 = h % 12 === 0 ? 12 : h % 12;
  return ar(h12) + ':' + ar(String(m).padStart(2, '0')) + (pm ? ' م' : ' ص');
}
function myRounds(key) {
  const k = key || dayKey();
  if (!S.sched) S.sched = {};
  if (!S.sched[k] || !S.sched[k].length)
    S.sched[k] = ROUND_PRESETS[S.preset || 'steady'][k].map(r => Object.assign({}, r));
  return S.sched[k];
}
/* حالة كلّ جولة اليوم: تمّت · حان وقتها · قادمة · فاتت */
function roundState(i) {
  const r = myRounds()[i];
  const done = (S.roundsDone || {})[S.day] || [];
  if (!r) return 'done';
  if (done.includes(i)) return 'done';
  const t = hm2min(r.at), n = nowMin();
  if (n < t - 90) return 'later';
  if (n > t + 45) return 'late';
  return 'now';
}
function nextRound() {
  const rs = myRounds();
  for (let i = 0; i < rs.length; i++) { const st = roundState(i); if (st !== 'done') return { i, st, r: rs[i] }; }
  return null;
}
function markRoundDone() {
  const nx = nextRound(); if (!nx) return;
  S.roundsDone = S.roundsDone || {};
  const d = S.roundsDone[S.day] || [];
  if (!d.includes(nx.i)) d.push(nx.i);
  S.roundsDone[S.day] = d;
  /* لا نحتفظ إلا بآخر ثلاثة أيام */
  Object.keys(S.roundsDone).forEach(k => { if (S.day - (+k) > 3) delete S.roundsDone[k]; });
}
function roundsCard() {
  const rs = myRounds();
  if (!rs.length || !S.name) return '';
  const done = (S.roundsDone || {})[S.day] || [];
  const nx = nextRound();
  return `<div class="rnds">
    <div class="rnh"><span>جولات اليوم${isWeekend() ? ' · إجازة' : ''}</span>
      <span class="rnn num">${ar(done.length)} من ${ar(rs.length)}</span></div>
    ${rs.map((r, i) => { const st = roundState(i); const k = ROUND_KINDS[r.kind];
      return `<div class="rnr ${st}">
        <span class="rnd"></span>
        <span class="rnt">${esc(k.t)}<em>${esc(fmtTime(r.at))} · ${ar(r.mins)} دقيقة</em></span>
        <span class="rns">${st === 'done' ? '✓' : st === 'now' ? 'الآن' : st === 'late' ? 'فاتت' : ''}</span>
      </div>`; }).join('')}
    ${nx && nx.st === 'late'
      ? `<p class="rnl">كان موعد «${esc(ROUND_KINDS[nx.r.kind].t)}» ${esc(fmtTime(nx.r.at))}.
         لا بأس — ${ar(nx.r.mins)} دقيقة الآن تكفي.</p>`
      : nx && nx.st === 'later'
      ? `<p class="rnl dim">التالية ${esc(fmtTime(nx.r.at))}. وتستطيع تقديمها متى شئت — التقديم لا يُحسب تأخيرًا.</p>`
      : ''}
  </div>`;
}

/* ---------- المحطة القادمة: أقرب إنجاز متوقّع ---------- */
function nextStation() {
  const cands = mySkills().filter(s => hasContent(s.id) && !S.skills[s.id].paused
    && ['building', 'near'].includes(S.skills[s.id].status));
  if (!cands.length) {
    const a = chooseActive();
    return a ? { name: a.name, days: 5, first: true } : null;
  }
  const rhythm = Math.max(1, buildPlan().rhythm);
  let best = null;
  for (const s of cands) {
    const st = S.skills[s.id];
    const needSess = Math.max(0, 3 - st.days.length);
    const needSpan = Math.max(0, 5 - ((st.last ?? S.day) - (st.first ?? S.day)));
    const d = Math.max(needSpan, Math.ceil(needSess * 7 / rhythm));
    if (!best || d < best.days) best = { name: s.name, days: Math.max(1, d), status: st.status };
  }
  return best;
}

/* ---------- suggestion ---------- */
function makeSuggestion__inner() {
  const active = chooseActive();
  const st = S.skills[active.id];
  let why;
  if (S.lastSummary && S.lastSummary.wrongQ.length && byQ(S.lastSummary.wrongQ[0]).skill === active.id)
    why = 'أخطاؤك أمس تركّزت هنا';
  else if (st.status === 'building') why = 'واصل ما بدأتَه — لم تكتمل بعد';
  else if (st.status === 'near') why = 'جلسة واحدة أو اثنتان وتكتمل';
  else if (S.diag) why = 'هذه نقطة البداية من نتيجة التشخيص';
  else why = 'بداية المرحلة الأولى';
  if (S.lastActive !== null && S.day - S.lastActive > 7) why = 'نبدأ بشيء خفيف بعد الانقطاع';
  const anc = ANCHORS.find(a => a.id === S.anchor);
  let gain;
  if (st.status === 'near') gain = `بعدها: تكتمل «${active.name}»`;
  else if (st.status === 'building') gain = `بعدها: تقترب «${active.name}» من الاكتمال`;
  else gain = `بعدها: تظهر «${active.name}» على خريطتك`;
  return { skill: active.id, name: active.name, size: S.size, why, gain };
}

/* ---------- horizon map (signature) ---------- */
function horizonSVG(sky) {
  const stages = trackStages(S.track);
  const cur = Math.max(0, stages.findIndex(s => s.id === S.activeStage));
  const pts = [{ x: 320, y: 148, r: 7, o: 1 }, { x: 195, y: 116, r: 5, o: .5 }, { x: 78, y: 96, r: 3.5, o: .26 }];
  let g = '';
  stages.forEach((st, i) => {
    const p = pts[i] || pts[2], here = i === cur;
    const op = here ? 1 : (i < cur ? .55 : p.o);
    g += `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${here ? 'var(--glow)' : 'var(--ink)'}" opacity="${op}"/>`;
    if (here) g += `<circle cx="${p.x}" cy="${p.y}" r="15" fill="none" stroke="var(--glow)" stroke-width="1" opacity=".33"/>`;
    g += `<text x="${p.x}" y="${p.y + (here ? 30 : 24)}" text-anchor="middle" class="hz-label${here ? ' here' : ''}" opacity="${here ? 1 : op + .12}">${st.name}</text>`;
    if (here) g += `<text x="${p.x}" y="${p.y - 22}" text-anchor="middle" class="hz-you">أنت هنا</text>`;
  });

  // سماء متراكمة: كل مهارة مكتملة تصير ضوءًا. لا تنطفئ أبدًا.
  let stars = '';
  if (sky) {
    const seedOf = id => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffff; return h; };
    const place = (s, big) => {
      const h = seedOf(s.id);
      const x = 44 + (h % 1000) / 1000 * 396;
      const t = (x - 40) / 400;                       // ارتفاع خط الأفق عند x
      const hy = 152 - 60 * Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - t)) * 0.55) - 14 * (1 - t);
      const y = 34 + ((h >> 5) % 1000) / 1000 * Math.max(20, hy - 46);
      const r = big ? 2.6 : 1.7;
      const op = big ? 0.95 : 0.42;
      return { x: x.toFixed(1), y: y.toFixed(1), r, op };
    };
    mySkills().forEach(s => {
      const st = S.skills[s.id];
      if (st.status !== 'mastered' && st.status !== 'near') return;
      const big = st.status === 'mastered';
      const q = place(s, big);
      stars += `<circle cx="${q.x}" cy="${q.y}" r="${q.r}" fill="${big ? 'var(--grow)' : 'var(--near)'}" opacity="${q.op}"/>`;
      if (big) stars += `<circle cx="${q.x}" cy="${q.y}" r="${q.r * 3.2}" fill="var(--grow)" opacity=".085"/>`;
    });
  }

  return `<div class="horizon${sky ? ' tall' : ''}"><svg viewBox="${sky ? '0 24 380 164' : '0 84 380 104'}" preserveAspectRatio="xMidYMid meet" aria-label="خريطة المراحل">
    ${stars}
    <path d="M392,152 Q250,124 195,116 Q120,106 -12,92" fill="none" stroke="var(--line)" stroke-width="1.4"/>
    ${g}</svg></div>`;
}


/* ---------- العلامة ---------- */
// ── الأفق: مقياس التقدّم بهويّة الاسم ──
function horizonBar(done, total, label) {
  const p = total ? Math.max(0, Math.min(1, done / total)) : 0;
  const W = 300, H = 66;
  const cx = 30 + p * (W - 60);
  const arc = Math.sin(p * Math.PI);
  const cy = 50 - arc * 30;
  const r = 8 + arc * 3.4;
  const up = 1 - Math.max(0, (cy - 20) / 30);
  return `<div class="hz" role="progressbar" aria-valuenow="${done}" aria-valuemax="${total}">
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" aria-hidden="true">
      <defs>
        <linearGradient id="hzl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="var(--glow)" stop-opacity=".12"/>
          <stop offset=".5" stop-color="var(--glow)" stop-opacity=".55"/>
          <stop offset="1" stop-color="var(--glow)" stop-opacity=".12"/></linearGradient>
        <radialGradient id="hzg"><stop offset="0" stop-color="var(--glow)" stop-opacity=".5"/>
          <stop offset="1" stop-color="var(--glow)" stop-opacity="0"/></radialGradient>
        <clipPath id="hzc"><rect x="0" y="0" width="${W}" height="50"/></clipPath>
      </defs>
      <g clip-path="url(#hzc)">
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r*3.6).toFixed(1)}"
          fill="url(#hzg)" opacity="${(up*.9).toFixed(2)}"/>
        <circle class="hz-sun" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}"
          fill="var(--glow)" opacity="${(.35 + up*.65).toFixed(2)}"/>
      </g>
      <path d="M14,50 Q${W/2},${(50 - 7 - p*5).toFixed(1)} ${W-14},50"
        fill="none" stroke="url(#hzl)" stroke-width="2.4" stroke-linecap="round"/>
    </svg>
    <div class="hz-t"><span>${esc(label || '')}</span>
      <span class="hz-n">${ar(done)} / ${ar(total)}</span></div>
  </div>`;
}
function markSVG(h, shine) {
  /* هذا هو شعار الأيقونة نفسه: شمسٌ نصف بازغة وأشعّة وطريق يتّجه إليها.
     كان في التطبيق شعارٌ آخر (حرف أ مع قوس) فاختلف عمّا يراه الطالب على شاشته. */
  const u = 'mk' + h + (shine ? 's' : '');
  const rays = [];
  for (let k = 0; k < 5; k++) {
    const ang = Math.PI + (k + 0.5) * (Math.PI / 5);
    const x1 = 256 + Math.cos(ang) * 132, y1 = 250 + Math.sin(ang) * 132;
    const x2 = 256 + Math.cos(ang) * (k === 2 ? 192 : k === 1 || k === 3 ? 176 : 162);
    const y2 = 250 + Math.sin(ang) * (k === 2 ? 192 : k === 1 || k === 3 ? 176 : 162);
    rays.push(`<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}"
      stroke="var(--glow)" stroke-opacity=".82" stroke-width="17" stroke-linecap="round"/>`);
  }
  return `<svg width="${h}" height="${h}" viewBox="0 40 512 430" aria-hidden="true"
    class="ufmark${shine ? ' shine' : ''}">
    <defs>
      <linearGradient id="${u}sun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--glow)"/>
        <stop offset="1" stop-color="var(--glow)" stop-opacity=".72"/></linearGradient>
      <linearGradient id="${u}rd" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--glow)" stop-opacity=".55"/>
        <stop offset="1" stop-color="var(--glow)"/></linearGradient>
    </defs>
    ${rays.join('')}
    <path d="M 148 250 a 108 108 0 0 1 216 0 z" fill="url(#${u}sun)"/>
    <path d="M 40 292 Q 256 236 472 292" fill="none" stroke="var(--glow)"
      stroke-opacity=".75" stroke-width="13" stroke-linecap="round"/>
    <path d="M 248 272 C 300 318 206 344 240 386 L 118 468 L 400 468 L 306 384
             C 276 344 352 320 268 272 Z" fill="url(#${u}rd)"/>
  </svg>`;
}

/* ---------- معلومات الاختبار ---------- */
const FACTS = [
  { id:'no_fail', kind:'fact', t:'لا نجاح ولا رسوب في القدرات',
    b:'الدرجة من ١٠٠ فقط، وكل جامعة تضع حدها الأدنى. الاختبار يقيس طريقة تفكيرك، لا كمية ما حفظته.', lowScore:0.5 },
  { id:'no_penalty', kind:'fact', t:'الخطأ لا يُخصم من درجتك',
    b:'لا عقوبة على الإجابة الخاطئة. ترك السؤال فارغًا خسارة مؤكدة، والتخمين بعد الحذف مكسب محتمل.', skip:1 },
  { id:'attempts', kind:'fact', t:'معك خمس فرص في القدرات',
    b:'فرصتان ورقيتان كحد أقصى، والبقية محوسبة. المحاولة الأولى ليست مصيرية — كثيرون يرفعون درجتهم في الثانية.', sessions:2 },
  { id:'no_calc', kind:'fact', t:'لا آلة حاسبة في القاعة',
    b:'ولهذا أرقام القدرات مختارة لتُحلّ ذهنيًا. إن وجدت نفسك في حساب طويل، فغالبًا هناك طريق أقصر.',
    tags:['miscalculated','wrong_divisor','wrong_factor','wrong_percent'], n:2 },
  { id:'computerized', kind:'fact', t:'المحوسب يعتمد على بنك أسئلة',
    b:'ولهذا التدرّب على الأفكار المتكررة يرفع درجتك فعليًا. الورقي يتجدد كل سنة، فالتجميعات أقل نفعًا فيه.', sessions:4 },
  { id:'experimental', kind:'fact', t:'بعض الأسئلة تجريبية ولا تُحسب',
    b:'الاختبار يضم أسئلة اختبارية لا تدخل في درجتك. السؤال الذي أعجزك قد لا يكون محسوبًا أصلًا.', hard:2 },
  { id:'balance', kind:'fact', t:'اللفظي يساوي الكمي',
    b:'إتقان الكمي وحده لا يرفع نتيجتك. الأسئلة تتناوب بين القسمين، ولكل قسم ٢٥ دقيقة.', sessions:3 },
  { id:'last_week', kind:'fact', t:'الأسبوع الأخير: راجع ولا تفتح جديدًا',
    b:'المهارة الجديدة تحتاج أيامًا لتثبت. في آخر أسبوع، أخطاؤك السابقة أعلى عائد من أي درس.', daysLeft:7 },
  { id:'night_before', kind:'fact', t:'ليلة الاختبار: النوم أهم',
    b:'المراجعة المتأخرة تُنهك أكثر مما تُضيف. جهّز أوراقك ونم مبكرًا — الذهن المرتاح يكسب درجات.', daysLeft:1 },
  { id:'tahsili_weight', kind:'fact', t:'التحصيلي: نصفه من ثالث ثانوي',
    b:'التوزيع تقريبًا ٢٠٪ من أول ثانوي، ٣٠٪ من ثاني، ٥٠٪ من ثالث. مراجعتك ليست متساوية بين السنوات.', sessions:6 }
];

/* ---------- التوجيه: مهارات تُكتسب من الخطأ ---------- */
const TIPS = [
  { id:'read_ask', t:'حدّد المطلوب قبل أن تحسب',
    b:'أخطاؤك الأخيرة كانت حلولًا صحيحة لسؤال مختلف. اقرأ آخر سطر مرة ثانية قبل أن تختار.',
    tags:['took_other_share','found_other_share','solved_for_other','took_larger_share','took_smaller_share','took_middle_share','solved_for_red','self_read_ask'], n:3 },
  { id:'unit_share', t:'قيمة الجزء ليست النصيب',
    b:'بعد قسمة المجموع على عدد الأجزاء، تبقى خطوة واحدة: الضرب في عدد أجزاء المطلوب.',
    tags:['unit_as_share','unit_as_answer'], n:2 },
  { id:'order', t:'انتبه لترتيب النسبة',
    b:'«أ إلى ب» ليست «ب إلى أ». حدّد أيّهما يُذكر أولًا قبل الحساب.',
    tags:['reversed_order','reversed_application','reversed_division','reversed_operation'], n:2 },
  { id:'edge', t:'جرّب الكسر والصفر والواحد',
    b:'في المقارنات، القاعدة التي تصحّ مع ٢ قد تنقلب مع ٠٫٥. اختبر حالتين قبل أن تحكم.',
    tags:['assumed_integer','assumed_fraction','special_case_only','assumed_symmetry'], n:2 },
  { id:'base', t:'كل نسبة مئوية تحتاج أساسًا',
    b:'اسأل: نسبة من ماذا؟ الزيادة تُقاس من القيمة القديمة، لا الجديدة.',
    tags:['wrong_base','absolute_as_percent','number_as_percent','new_over_old'], n:2 },
  { id:'inverse', t:'ليست كل علاقة طردية',
    b:'كلما زاد العمال قلّ الزمن. إن كان أحدهما يزيد والآخر ينقص، اضرب بدل أن تقسم.',
    tags:['direct_instead_inverse','swapped_values'], n:1 },
  { id:'relation_first', t:'سمِّ العلاقة قبل أن تختار',
    b:'في التناظر، حدّد العلاقة بكلمات: «أداة ووظيفتها»، «جزء من كل». ثم ابحث عن الخيار الذي تنطبق عليه الجملة نفسها.',
    tags:['analogy_mismatch'], n:3 },
  { id:'read_all', t:'اقرأ الجملة كاملة قبل الاختيار',
    b:'في إكمال الجمل والخطأ السياقي، المعنى يكتمل في آخر الجملة. الاختيار من نصفها الأول أكثر أخطائك.',
    tags:['completion_mismatch','context_error_mismatch'], n:3 },
  { id:'transition', t:'الصعوبة الآن علامة تقدّم',
    b:'أنت انتقلت من الفهم إلى التطبيق، وهذه النقلة تشعر بالصعوبة دائمًا. الأسئلة لم تصعب — بدأت تختبرك فعلًا. جلستان أو ثلاث وتتضح.',
    struggleNew:true },
  { id:'backsolve', t:'عوّض بالخيارات',
    b:'حين يتعقّد الحل، جرّب الخيار الأوسط في السؤال. غالبًا تصل في محاولتين.', hard:2 },
  { id:'stall', t:'لا تعلق في سؤال',
    b:'إن تجاوزت دقيقة، انتقل. السؤال الذي يليه قد يكون أسهل، والوقت واحد لكليهما.', slow:1 },
  { id:'rush', t:'ثانيتان قبل الاختيار',
    b:'أسرع إجاباتك كانت أكثرها خطأً. توقّف لحظة بعد أن تحسب، وتأكّد أن هذا هو المطلوب.', fast:2 },
  { id:'eliminate', t:'ابدأ بالحذف',
    b:'حين لا تعرف، استبعد المستحيل أولًا. خياران بدل أربعة يجعلان التخمين في صالحك.', skip:2 }
];

function checkTip(sess) {
  if (sess.tipShown) return null;
  const pct = sess.items.length ? sess.right / Math.max(1, sess.idx + 1) : 1;
  for (const tip of FACTS.concat(TIPS)) {
    if (S.tipsSeen.some(x => x.id === tip.id)) continue;
    let hit = false;
    if (tip.tags) hit = tip.tags.reduce((a, g) => a + (S.tagCount[g] || 0), 0) >= tip.n;
    else if (tip.lowScore) hit = sess.idx >= 3 && pct < tip.lowScore;
    else if (tip.sessions) hit = S.sessionCount >= tip.sessions;
    else if (tip.daysLeft) hit = (S.examDays - S.day) <= tip.daysLeft;
    else if (tip.struggleNew) {
      const a = sess.skill && S.skills[sess.skill];
      hit = !!a && S.sessionCount >= 1 && a.window.length >= 4
            && a.window.filter(Boolean).length / a.window.length < 0.5 && a.days.length <= 2;
    }
    else if (tip.hard) hit = sess.hardWrong >= tip.hard;
    else if (tip.slow) hit = sess.slow >= tip.slow;
    else if (tip.fast) hit = sess.fast >= tip.fast;
    else if (tip.skip) hit = sess.skips >= tip.skip;
    if (hit) { sess.tipShown = true; S.tipsSeen.push({ id: tip.id, day: S.day }); return tip; }
  }
  return null;
}

/* ══════════ لوحة المعاينة — تُحذف في الإصدار الحقيقي ══════════ */
const PRESETS = {
  fresh: { label:'طالب جديد', build(){ markDiagDone(); } },
  mid: { label:'بعد ٥ جلسات', build(){
      markDiagDone();
      setSkill('analogy','mastered',12); setSkill('context_error','near',9);
      setSkill('odd_one','building',5); setSkill('completion','building',3);
      S.day = 7; S.streak = 6; S.sessionCount = 5; S.lastActive = 6; S.targetDiff = 3;
      S.review = (DATA.questions.slice(0,4)).map((q,i)=>({qid:q.id,due:S.day+i,interval:2}));
      S.corrected = DATA.questions.slice(4,7).map(q=>({qid:q.id,day:4}));
      S.tipsSeen = [{id:'no_fail',day:1},{id:'relation_first',day:3},{id:'no_penalty',day:4}];
      S.seenLessons = Object.keys(LESSONS.lessons);
      S.paid = true; } },
  weak: { label:'أداء ضعيف', build(){
      markDiagDone();
      setSkill('analogy','building',3); setSkill('context_error','building',2);
      S.day = 5; S.streak = 4; S.sessionCount = 4; S.lastActive = 4; S.targetDiff = 1;
      S.review = DATA.questions.slice(0,6).map(q=>({qid:q.id,due:S.day,interval:1}));
      S.tipsSeen = [{id:'no_fail',day:1},{id:'rush',day:2}]; S.paid = true;
      S.seenLessons = Object.keys(LESSONS.lessons);
      if (S.skills.analogy) S.skills.analogy.stuckSince = 0; } },
  away: { label:'عودة بعد انقطاع', build(){ PRESETS.mid.build(); S.day = 20; S.lastActive = 6; } },
  ignore: { label:'مهارة مرفوضة', build(){ PRESETS.mid.build();
      if (S.skills.context_error) S.skills.context_error.ignore = 3;
      if (S.skills.odd_one) S.skills.odd_one.ignore = 4; } },
  wall: { label:'جدار الاشتراك', build(){ PRESETS.mid.build(); S.paid = false; S.sessionCount = 5; } }
};
function markDiagDone() {
  const ids = mySkills().filter(s => hasContent(s.id)).slice(0,6).map(s=>s.id);
  S.diag = { plan:new Array(12).fill(ids[0]||'analogy'), seq:[], idx:12, correct:8, diff:3, scores:{} };
  ids.forEach((id,i) => S.diag.scores[id] = { c: i%2?1:2, n:2 });
  S.targetDiff = 2; S.suggestion = null;
}
function setSkill(id, status, right) {
  const st = S.skills[id]; if (!st) return;
  st.window = new Array(15).fill(true).map((_,i)=>i<right);
  st.days = status === 'building' ? [0,1] : [0,2,4];
  st.first = 0; st.last = status === 'mastered' ? 6 : 3;
  st.status = status;
}
function devApply(key) {
  const keep = S.size, rem = S.reminder, th = S.theme, tr = S.track;
  S = freshState();
S.visits = (S.visits || 0) + 1; S.size = keep; S.reminder = rem; S.theme = th; S.track = tr;
  PRESETS[key].build();
  S.suggestion = null; S.devOpen = false; go('home');
}
function devScreen(name) {
  S.devOpen = false;
  if (!S.diag) markDiagDone();
  /* لا تكتب على رحلة الطالب. المعاينة تعرض ولا تعدّل — هذا ما أفسد رحلة طالب حقيقيّ. */
  if (name === 'question' || name === 'explain') {
    S.suggestion = S.suggestion || makeSuggestion();
    ACTIONS.startSession();
    if (name === 'explain') {
      const s = S.session, q = byQ(s.items[0].qid);
      ACTIONS.answer(q.choices.findIndex(c => !c.c));
    }
    return;
  }
  if (name === 'summary') {
    const active = chooseActive();
    S.lastSummary = { right:9, total:12, skill:active && active.id, changed:active?[active.id]:[],
      wrongQ:(qBySkill[active && active.id]||[]).slice(0,3).map(q=>q.id), resume:false };
    if (active) S.skills[active.id].status = 'near';
  }
  go(name);
}
function devPanel() {
  const scr = [['welcome','الترحيب'],['diagResult','نتيجة التشخيص'],['save','حفظ الخريطة'],
    ['log','سجل الجلسات'],['cards','بطاقات المصطلحات'],['intro','التعريف'],['lesson','درس مهارة'],['plan','الخطة'],['report','تقرير ولي الأمر'],['pending','مسار قيد الإعداد'],
    ['home','جلسة اليوم'],['replace','تغيير الاقتراح'],['question','السؤال'],
    ['explain','الشرح'],['summary','ملخّص الجلسة'],['progress','التقدّم'],
    ['errors','أخطاؤك'],['settings','الإعدادات'],['paywall','جدار الاشتراك']];
  return `<div class="devpanel${S.devOpen ? ' on' : ''}" id="devpanel">
    <h4>حالة الطالب</h4>
    <div class="devgrid">${Object.entries(PRESETS).map(([k,v]) =>
      `<button data-preset="${k}">${v.label}</button>`).join('')}</div>
    <h4>الانتقال إلى شاشة</h4>
    <div class="devgrid">${scr.map(([k,n]) =>
      `<button data-screen="${k}">${n}</button>`).join('')}</div>
    <button class="devclose" data-devclose>إغلاق</button>
  </div>`;
}

/* ---------- render ---------- */
const FLOW = ['name','pick','welcome','home','learn','lesson','question','explain','summary','progress','errors','settings'];
function go(screen) {
  const a = FLOW.indexOf(S.screen), b = FLOW.indexOf(screen);
  S._dir = (a < 0 || b < 0) ? 0 : (b > a ? 1 : b < a ? -1 : 0);
  S.screen = screen; render();
}
/* حارس: أيّ عطل في رسم شاشة يُعرض بدل أن يُجمّد التطبيق —
   فلا يعلق الطالب أمام شاشة لا تستجيب. */
function safeScreen(name) {
  try { return SCREENS[name](); }
  catch (e) {
    console.error('screen', name, e);
    return `<div class="center" style="padding-top:60px">
      <div class="eyebrow">تعذّر فتح هذه الشاشة</div>
      <h1 style="margin-top:10px">لا شيء ضاع</h1>
      <p class="soft" style="margin-top:12px">تقدّمك محفوظ كما هو. عُد إلى اليوم وتابع،
        وأخبر المطوّر بهذه الرسالة:</p>
      <div class="glass" style="margin-top:16px"><p class="faint" style="direction:ltr;text-align:left">
        ${esc(name)} — ${esc(String(e && e.message || e))}</p></div>
      <div class="spacer"></div>
      <button class="btn" data-go="home">عُد إلى اليوم</button>
    </div>`;
  }
}
/* لكل تبويب جوٌّ خاصّ: موضع الضوء يتحرّك، ولون التمييز يتبدّل،
   والصفحة تنزلق من الجهة التي جئت منها. فيُحسّ الانتقال قبل أن يُقرأ. */
const PANE_AIR = [
  { wx: '18%', wy: '0%',   hue: '#8FA8D8' },
  { wx: '50%', wy: '-8%',  hue: '#E0D2B4' },
  { wx: '82%', wy: '2%',   hue: '#9ED0B4' },
  { wx: '50%', wy: '105%', hue: '#D8AE9A' },
  { wx: '12%', wy: '95%',  hue: '#C3A8D8' }
];
let _pane = 0;
function paneAir(i) {
  const a = PANE_AIR[i % PANE_AIR.length], root = document.documentElement;
  root.style.setProperty('--wx', a.wx);
  root.style.setProperty('--wy', a.wy);
  root.style.setProperty('--hue', a.hue);
  root.dataset.slide = (i > _pane) ? 'f' : (i < _pane ? 'b' : '');
  _pane = i;
}
function paneIndex() {
  if (S.screen === 'settings') return (S.setTab || 0);
  if (S.screen === 'progress') return (S.prTab || 0);
  if (S.screen === 'errors') return 3;
  if (S.screen === 'home') return 1;
  return 1;
}
/* ══════════ شاشة واحدة بلا تمرير ══════════
   بعد كل رسم نقيس الارتفاع المطلوب. إن تجاوز المتاح قليلًا، نصغّر
   المحتوى تصغيرًا محسوبًا حتى يدخل — بدل أن نجبر الطالب على التمرير.
   وإن تجاوزه كثيرًا (كقائمة أخطاء طويلة) نترك التمرير، فالتصغير حينها يضرّ. */
const FIT_FLOOR = 0.80;
function fitScreen(frame) {
  if (!frame || !el) return;
  frame.style.transform = '';
  frame.style.transformOrigin = 'top center';
  requestAnimationFrame(() => {
    try {
      const avail = el.clientHeight;
      const need = frame.scrollHeight;
      if (!avail || !need) return;
      if (need <= avail + 2) { el.style.overflowY = 'hidden'; return; }
      const k = avail / need;
      if (k >= FIT_FLOOR) {
        frame.style.transform = 'scale(' + k.toFixed(4) + ')';
        frame.style.width = (100 / k).toFixed(2) + '%';
        frame.style.marginInline = 'auto';
        el.style.overflowY = 'hidden';
      } else {
        frame.style.transform = '';
        frame.style.width = '';
        el.style.overflowY = 'auto';
      }
    } catch (e) {}
  });
}

function render() {
  markDirty();
  try { paneAir(paneIndex()); } catch (e) {}
  setTimeout(() => {
    document.querySelectorAll('.tin[data-round]').forEach(el => {
      el.onchange = () => { const i = +el.dataset.round, k = el.dataset.key || dayKey();
        const rs = myRounds(k);
        if (rs[i] && /^\d{2}:\d{2}$/.test(el.value)) { rs[i].at = el.value; saveState(); render(); } };
    });
  }, 0);
  const frame = document.createElement('div');
  const d = S._dir || 0;
  frame.className = 'fade' + (d > 0 ? ' inF' : d < 0 ? ' inB' : '');
  try { document.body.dataset.screen = S.screen; } catch (e) {}
  frame.innerHTML = (S.storageBlocked ? `<div class="blocked">
      <b>تعذّر حفظ تقدّمك</b>
      <span>المتصفّح يمنع الحفظ — قد تكون في وضع التصفّح الخفيّ، أو الذاكرة ممتلئة.
        يعمل أُفق الآن، لكنّ ما تنجزه لن يبقى بعد إغلاق الصفحة.</span>
    </div>` : '')
    + (SCREENS[S.screen] ? safeScreen(S.screen) : safeScreen('home'));
  let bb = document.getElementById('brandbar');
  const hideOn = ['name','pick','welcome','intro','diag','diagResult','save','paywall','question','exam'];
  if (!bb) { bb = document.createElement('div'); bb.id = 'brandbar';
    const sh = document.getElementById('shell');
    sh.insertBefore(bb, document.getElementById('app')); }
  bb.hidden = hideOn.includes(S.screen);
  try {
    const ss = S.session;
    const pr = ss && ss.items && ss.items.length
      ? Math.min(1, (ss.idx || 0) / ss.items.length) : 0;
    document.getElementById('shell').style.setProperty('--dawn', (0.06 + pr * 0.16).toFixed(3));
  } catch (e) {}
  bb.innerHTML = bb.hidden ? '' : `<span class="bmark">${markSVG(19, true)}</span>
    <span class="bname">أفق</span>
    <button class="gearbtn" data-go="settings" aria-label="الإعدادات">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>
      </svg></button>`;
  el.replaceChildren(frame);
  el.scrollTop = 0;
  fitScreen(frame);
  S._dir = 0;
  let sh = document.getElementById('sheetlayer');
  if (!sh) { sh = document.createElement('div'); sh.id = 'sheetlayer';
    document.getElementById('shell').appendChild(sh); }
  sh.innerHTML = themeSheet();
  if (paceTimer) { clearInterval(paceTimer); paceTimer = null; }
  const pf = document.getElementById('pacefill');
  if (pf && S.session) {
    const t0 = Date.now(), target = 60000;
    paceTimer = setInterval(() => {
      const el2 = document.getElementById('pacefill');
      if (!el2) { clearInterval(paceTimer); paceTimer = null; return; }
      const r = Math.min(1.35, (Date.now() - t0) / target);
      el2.style.width = Math.min(100, r * 74) + '%';
      el2.style.background = r < 0.85 ? 'var(--flat-line)' : r < 1.1 ? 'var(--near)' : 'var(--near)';
      el2.style.opacity = r < 0.85 ? '0.7' : '0.95';
    }, 500);
  }

  sh.querySelectorAll('[data-act]').forEach(b => b.onclick = e => {
    if (b.dataset.act === 'closeSheet' && e.target.closest('[data-stop]')) return;
    ACTIONS[b.dataset.act](b.dataset.arg);
  });
  void el.offsetHeight;              // إجبار إعادة تخطيط قبل تحريك التمرير
  el.scrollTop = 0;
  tabsEl.innerHTML = ['home', 'progress', 'errors', 'settings'].includes(S.screen) ? tabbar() : '';
  let dev = document.getElementById('devlayer');
  if (!dev) { dev = document.createElement('div'); dev.id = 'devlayer';
    document.getElementById('shell').appendChild(dev); }
  /* لوحة المعاينة أداةُ تطوير: أزرار «حالة الطالب» تكتب فوق تقدّم الطالب الحقيقيّ.
     فلا تظهر إلا بـ #dev في العنوان، أو بستّ نقرات متتابعة على العلامة. */
  const devAllowed = S.devUnlocked || (location.hash || '').indexOf('dev') >= 0;
  dev.innerHTML = devAllowed
    ? `<button class="devbtn" id="devopen" aria-label="لوحة المعاينة">⋯</button>${devPanel()}`
    : '';
  const dop = dev.querySelector('#devopen');
  if (dop) dop.onclick = () => { S.devOpen = true; render(); };
  dev.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => devApply(b.dataset.preset));
  dev.querySelectorAll('[data-screen]').forEach(b => b.onclick = () => devScreen(b.dataset.screen));
  const cl = dev.querySelector('[data-devclose]'); if (cl) cl.onclick = () => { S.devOpen = false; render(); };
  el.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ACTIONS[b.dataset.act](b.dataset.arg));
  tabsEl.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { haptic(11); go(b.dataset.go); });
  /* شريط العلامة خارج #app و#tabs، فلم تكن أزراره مربوطة إطلاقًا —
     ولذلك لم يعمل زرّ الترس في أيّ شاشة. */
  if (bb && !bb.hidden) {
    bb.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { haptic(11); go(b.dataset.go); });
    bb.querySelectorAll('[data-act]').forEach(b => b.onclick = () => ACTIONS[b.dataset.act](b.dataset.arg));
  }
  if (sh) {
    sh.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  }
  const mt = document.getElementById('markTap');
  if (mt) {
    let n = 0, t0 = 0;
    mt.onclick = () => {
      const now = Date.now();
      n = (now - t0 < 900) ? n + 1 : 1; t0 = now;
      if (n >= 5) { n = 0; S.admin = true; S.audit = true; S.devUnlocked = true;
        S.name = S.name || 'المشرف';
        haptic(30); S.setTab = 7; go('settings'); }
    };
  }
  const ni = document.getElementById('nameIn');
  if (ni) {
    ni.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); ACTIONS.saveName(); } });
    ni.addEventListener('input', () => {
      const h = document.getElementById('nameHint');
      if (h) h.textContent = 'تستطيع إضافة اسم العائلة إن أحببت.'; });
    ['pointerup','click','touchend'].forEach(ev =>
      ni.addEventListener(ev, () => { try { ni.focus(); } catch (e) {} }, { passive: true }));
  }
  requestAnimationFrame(glideTab);
  el.querySelectorAll('.choice').forEach(b => b.addEventListener('pointermove', e => {
    const r = b.getBoundingClientRect();
    b.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    b.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true }));
  el.querySelectorAll('.choice,.btn').forEach(b => b.addEventListener('pointerdown', e => {
    haptic(8);
    const r = b.getBoundingClientRect();
    b.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
    b.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
  }, { passive: true }));
}
const TABICON = {
  home: '<path d="M4 10.5 12 4l8 6.5"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
  progress: '<path d="M4 19h16"/><path d="M7 19v-6"/><path d="M12 19V8"/><path d="M17 19v-9"/>',
  errors: '<path d="M12 4.5 20 19H4z"/><path d="M12 10v4"/><path d="M12 16.6v.1"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"/>'
};
function haptic(ms) {
  if (S.haptics === false) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
}
function tabbar() {
  const t = [['home', 'اليوم'], ['progress', 'التقدّم'], ['errors', 'أخطاؤك'], ['settings', 'الإعدادات']];
  return `<div class="tabbar">${t.map(([k, n]) =>
    `<button data-go="${k}" class="${S.screen === k ? 'sel' : ''}" aria-label="${n}">
      <span class="ic ${S.screen === k ? 'pop' : ''}"><svg viewBox="0 0 24 24">${TABICON[k]}</svg></span>
      <span class="lb">${n}</span></button>`).join('')}<span class="glide"></span></div>`;
}
function glideTab() {
  const bar = tabsEl.querySelector('.tabbar'); if (!bar) return;
  const sel = bar.querySelector('button.sel'), g = bar.querySelector('.glide');
  if (!sel || !g) return;
  const w = sel.offsetWidth * 0.44;
  const cx = sel.offsetLeft + sel.offsetWidth / 2 - w / 2;
  g.style.width = w + 'px';
  g.style.transform = `translateX(${cx}px)`;
}

function firstName() { return String(S.name || '').trim().split(/\s+/)[0] || 'صديقي'; }
function greetLine() {
  const h = new Date().getHours();
  const t = h < 12 ? 'صباح الخير' : h < 17 ? 'مساء الخير' : 'مساء الخير';
  const tn = TRACKS[S.track] ? TRACKS[S.track].name : '';
  if (!S.day && !S.sessionCount) return `${t} يا ${firstName()} — أول يوم لك في ${tn}`;
  if (S.lastActive === S.day) return `${t} يا ${firstName()}`;
  const gap = S.day - (S.lastActive ?? S.day);
  if (gap >= 3) return `عدتَ إلى ${tn} يا ${firstName()} — والعودة أهمّ من الانقطاع`;
  return `${t} يا ${firstName()}`;
}
function statSummary() {
  const sk = mySkills();
  const done = sk.filter(x => S.skills[x.id] && S.skills[x.id].status === 'mastered').length;
  const seen = sk.filter(x => S.skills[x.id] && (S.skills[x.id].seen || 0) > 0).length;
  const total = Object.values(S.asked || {}).reduce((a, b) => a + (Array.isArray(b) ? b.length : 0), 0)
    || (S.answered || 0);
  return { done, seen, total, sk: sk.length, sessions: S.sessionCount || 0, streak: S.streak || 0 };
}
function sessionRail() {
  const s = S.session;
  if (!s || !s.items || !s.items.length) return '';
  const pct = Math.round(100 * s.idx / s.items.length);
  return `<div class="rail"><i style="width:${pct}%"></i>
    <span class="rn">${ar(s.idx + 1)} / ${ar(s.items.length)}</span></div>`;
}
function dayToggle() {
  let t = S.theme;
  if (t === 'auto') t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'paper' : 'night';
  const th = THEMES.find(x => x.id === t);
  const light = th && !th.dark;
  return `<button class="daybtn" data-act="flipDay" aria-label="${light ? 'الوضع الليلي' : 'الوضع النهاري'}">
    ${light
      ? '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>'}
  </button>`;
}
function auditBar() {
  if (!S.admin) return '';
  let tot = 0, cln = 0, ready = 0, all = 0;
  mySkills().forEach(sk => {
    if (!hasContent(sk.id)) return;
    all++;
    const n = (qBySkill[sk.id] || []).length, c = cleanCount(sk.id);
    tot += n; cln += c;
    if (c >= 15) ready++;
  });
  const pct = tot ? Math.round(100 * cln / tot) : 0;
  return `<div class="auditbar ${S.audit ? 'on' : ''}" data-act="toggleAudit">
    <span class="dot"></span><span class="lb">وضع المراجعة</span>
    <span class="st">${S.audit ? 'مفعَّل' : 'متوقّف'}</span></div>
  <div class="auditbar clean ${S.cleanOnly ? 'on' : ''}" data-act="toggleClean">
    <span class="dot"></span><span class="lb">البنك النظيف فقط</span>
    <span class="st">${S.cleanOnly ? 'مفعَّل' : 'متوقّف'}</span></div>
  <div class="cleanbar">
    <div class="cb-h"><span>جاهزية ${esc(TRACKS[S.track].name)} تجاريًّا</span>
      <span class="cb-n">${ar(cln)} من ${ar(tot)}</span></div>
    <div class="cb-t"><i style="width:${pct}%"></i></div>
    <div class="cb-f">${ar(pct)}٪ أصليّ · ${ar(ready)} من ${ar(all)} مهارة بلغت ١٥ سؤالًا أصليًّا</div>
  </div>`;
}
function qMeta(q) {
  if (!(S.admin && S.audit) || !q) return '';
  const tag = (t, c) => `<span class="mchip ${c || ''}">${t}</span>`;
  const key = (q.choices.find(c => c.c) || {}).t || '—';
  return `<div class="qmeta">
    ${tag(q.id, 'id')}
    ${tag(SKILLS[q.skill] ? SKILLS[q.skill].name : q.skill)}
    ${tag('صعوبة ' + ar(q.d || 0))}
    ${q.verified ? tag('مدقَّق', 'ok') : tag('غير مدقَّق', 'warn')}
    ${q.srcVerified ? tag('قوبل بالمصدر', 'ok') : ''}
    ${q.edited ? tag('معدَّل', 'warn') : ''}
    ${q.hold ? tag('موقوف', 'warn') : ''}
    ${q.rel ? tag(q.rel + (q.dir ? ' · ' + q.dir : '')) : ''}
    ${q.errPattern ? tag(q.errPattern) : ''}
    ${q.groupBasis ? tag(q.groupBasis) : ''}
    ${q.qType ? tag(q.qType) : ''}
    ${q.compType ? tag(q.compType) : ''}
    ${q.assocType ? tag(q.assocType) : ''}
    ${tag('المفتاح: ' + key, 'key')}
    ${q.origin === 'sourced' ? tag('منقول', 'warn') : tag('أصليّ', 'ok')}
    ${q.src ? tag(q.src, 'src') : ''}
  </div>`;
}
function skillState(id) {
  const st = S.skills[id];
  if (st && st.status === 'mastered') return 'mastered';
  if ((S.seenLessons || []).includes(id)) return 'learned';
  return 'new';
}
function lessonCount() {
  return mySkills().filter(x => LESSONS.lessons[x.id]).length;
}
function learnedCount() {
  return mySkills().filter(x => LESSONS.lessons[x.id] && skillState(x.id) !== 'new').length;
}
function markWeak(r) {
  S.lastWeak = null;
  if (!r || !r.wrongQ || r.wrongQ.length < 2) return;
  const cnt = {};
  r.wrongQ.forEach(qid => {
    const q = byQ(qid);
    if (q && LESSONS.lessons[q.skill]) cnt[q.skill] = (cnt[q.skill] || 0) + 1;
  });
  let best = null;
  for (const k in cnt) if (!best || cnt[k] > cnt[best]) best = k;
  if (best && cnt[best] >= 2) S.lastWeak = best;
}
function keyInvite(r) {
  if (!r || !r.wrongQ || r.wrongQ.length < 2) return '';
  const cnt = {};
  r.wrongQ.forEach(qid => {
    const q = byQ(qid);
    if (q && LESSONS.lessons[q.skill]) cnt[q.skill] = (cnt[q.skill] || 0) + 1;
  });
  let best = null;
  for (const k in cnt) if (!best || cnt[k] > cnt[best]) best = k;
  if (!best || cnt[best] < 2) return '';
  const seen = (S.seenLessons || []).includes(best);
  const nm = SKILLS[best] ? SKILLS[best].name : '';
  return `<button class="invite" data-act="openLesson" data-arg="${best}">
    <span class="iv-t">${ar(cnt[best])} من أخطائك اليوم في ${esc(nm)}</span>
    <span class="iv-s">${seen ? 'راجِع مفتاح الحلّ' : 'مفتاح الحلّ ينتظرك'} ›</span>
  </button>`;
}
// ── الاستماع: يقرأ الشرح ولا يقرأ الأسئلة ولا القطع ──
const SPK = { on: false, id: null };
function stripTags(h) {
  return String(h).replace(/<br\s*\/?>/g, ' . ').replace(/<[^>]+>/g, ' ')
    .replace(/\*\*/g, '').replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ').trim();
}
function speakStop() {
  try { window.speechSynthesis.cancel(); } catch (e) {}
  SPK.on = false; SPK.id = null;
}
function speakText(txt, id) {
  if (!('speechSynthesis' in window)) return false;
  if (SPK.on && SPK.id === id) { speakStop(); render(); return true; }
  speakStop();
  const u = new SpeechSynthesisUtterance(stripTags(txt));
  u.lang = 'ar-SA'; u.rate = 0.92; u.pitch = 1;
  const vs = window.speechSynthesis.getVoices() || [];
  const ar = vs.find(v => /^ar/i.test(v.lang));
  if (ar) u.voice = ar;
  u.onend = () => { SPK.on = false; SPK.id = null; render(); };
  u.onerror = () => { SPK.on = false; SPK.id = null; render(); };
  SPK.on = true; SPK.id = id;
  try { window.speechSynthesis.speak(u); } catch (e) { SPK.on = false; return false; }
  render();
  return true;
}
function listenBtn(txt, id) {
  if (!S.audio || !('speechSynthesis' in window)) return '';
  const live = SPK.on && SPK.id === id;
  return `<button class="lsn ${live ? 'on' : ''}" data-act="speak" data-arg="${id}">
    <span class="lw">${live ? '<i></i><i></i><i></i>' : '◂))'}</span>${live ? 'إيقاف' : 'استمع'}</button>`;
}
function decideSize() {
  const st = S.streak || 0;
  if (st < 3) return 15;
  if (st < 10) return 25;
  return 40;
}
// ── مسار تعلّم الأفكار: ترتيب مقصود لا أبجديّ ──
const PATH = {
  qudurat: [
    ['الأساس', ['analogy', 'completion', 'algebra']],
    ['البناء', ['odd_one', 'context_error', 'ratios', 'percent', 'proportion']],
    ['الإتقان', ['association', 'reading', 'comparisons', 'geometry', 'averages', 'sequences', 'probability']]],
  tahsili: [
    ['الأساس', ['th_algebra', 'th_cell', 'th_atom', 'th_motion']],
    ['البناء', ['th_geo', 'th_gen', 'th_bond', 'th_energy']],
    ['الإتقان', ['th_stat', 'th_calc', 'th_sys', 'th_eco', 'th_react', 'th_sol', 'th_elec', 'th_wave']]],
  step: [
    ['الأساس', ['sp_tense', 'sp_word', 'sp_article']],
    ['البناء', ['sp_prep', 'sp_agree', 'sp_phrasal']],
    ['الإتقان', ['sp_detail', 'sp_main', 'sp_infer', 'sp_order', 'sp_punct']]],
  kfupm: [
    ['الأساس', ['kf_math', 'kf_general']],
    ['البناء', ['kf_phys', 'kf_chem', 'kf_bio']],
    ['الإتقان', ['kf_critical', 'kf_analysis', 'kf_cs']]],
  aramco: [] };
// ── أسماء الأفكار مشكَّلةً — لرفع اللبس ──
const IDEA_NAME = {
  ratios:'النِّسَب', proportion:'التناسُب', percent:'النِّسَب المئويّة',
  averages:'المعدَّلات', comparisons:'المُقارَنات', sequences:'المُتتابِعات',
  probability:'الاحتِمالات', algebra:'الجَبر والمُعادَلات', geometry:'الهَندَسة',
  analogy:'التَّناظُر اللفظيّ', odd_one:'المُفرَدة الشاذَّة',
  context_error:'الخَطأ السِّياقيّ', completion:'إكمال الجُمَل',
  association:'الارتِباط', reading:'استيعاب المَقروء',
  th_algebra:'الجَبر والمُتبايِنات', th_geo:'الهَندَسة والمُثلَّثات',
  th_stat:'الإحصاء والاحتِمال', th_calc:'النِّهايات والاشتِقاق',
  th_motion:'الحَرَكة والقُوى', th_energy:'الشُّغل والطاقة',
  th_elec:'الكَهرَباء والمِغناطيسيّة', th_wave:'المَوجات والضَّوء',
  th_atom:'التَّركيب الذَّرّيّ', th_bond:'الرَّوابِط والصِّيَغ',
  th_react:'التَّفاعُلات والحِسابات', th_sol:'المَحاليل والأحماض',
  th_cell:'الخَليّة والأيض', th_gen:'الوِراثة', th_sys:'أجهِزة الجِسم',
  th_eco:'التَّصنيف والبيئة',
  sp_tense:'الأزمِنة', sp_prep:'حُروف الجَرّ', sp_agree:'التَّطابُق',
  sp_word:'مَعنى المُفرَدة', sp_phrasal:'الأفعال المُركَّبة',
  sp_order:'ترتيب الجُمَل', sp_article:'أدَوات التَّعريف',
  sp_main:'الفِكرة الرَّئيسة', sp_detail:'التَّفاصيل', sp_infer:'الاستِنتاج',
  sp_punct:'التَّرقيم والحُروف الكبيرة',
  kf_math:'الرِّياضيّات', kf_phys:'الفيزياء', kf_chem:'الكيمياء', kf_bio:'الأحياء',
  kf_critical:'التَّفكير النّاقِد', kf_analysis:'تقييم المَعلومات',
  kf_cs:'مُعالَجة البَيانات', kf_general:'المَهارات العَدَديّة' };
const ideaName = id => IDEA_NAME[id] || (SKILLS[id] ? SKILLS[id].name : '');
function pathList() {
  const p = PATH[S.track] || [];
  const out = [];
  p.forEach(([stage, ids]) => ids.forEach(id => {
    if (LESSONS.lessons[id]) out.push({ id: id, stage: stage });
  }));
  // أيّ مفتاح لم يُذكر في الترتيب يُلحق آخرًا
  mySkills().forEach(x => {
    if (LESSONS.lessons[x.id] && !out.some(o => o.id === x.id))
      out.push({ id: x.id, stage: 'إضافات' });
  });
  return out;
}
function pathNext() {
  const seen = S.seenLessons || [];
  return pathList().find(o => !seen.includes(o.id)) || null;
}
function pathDone() {
  const L = pathList(), seen = S.seenLessons || [];
  return { done: L.filter(o => seen.includes(o.id)).length, total: L.length };
}
/* ══════════════════ الخيط: عقلٌ واحد يقرّر الخطوة التالية ══════════════════
   كل شاشة تسأله بدل أن تجتهد بنفسها — فلا تتناقض النصائح ولا تتكرّر.
   الترتيب مقصود: الخطأ الذي لم يُشرح أولًا، لأن الخطأ الذي لم يُشرح يتكرّر.
   ═══════════════════════════════════════════════════════════════════════ */

/* ══════════════ الدورة التدريبية ══════════════
   أسبوعان · أربع عشرة محطّة · ثلاث مهارات لفظيًّا وأربع كمّيًّا.
   مقفلة في الترتيب: لا تُفتَح محطّة حتى تُنجَز التي قبلها،
   لأن الترتيب هو قيمة الدورة، ومن يقفز يأخذ الأسئلة ويترك البناء.
   مفتوحة في الوقت: يخرج متى شاء فتُجمَّد ولا تُلغى، ويعود فيكمل. */


/* ══════════════ الرحلة ══════════════
   الدورة وحدها تُشعِر الطالب أنه أنهى حلقة. والرحلة تُشعِره أنه قطع مرحلةً
   من طريقٍ له نهاية معلومة. فالمهارات تُقسَّم على دورات، وعددها معلوم من أول يوم. */
function journeyPlan() {
  if (S.track === 'qudurat') {
    const v = mySkills().filter(x => partOf(x.id) === 'verbal' && hasContent(x.id)).length;
    const q = mySkills().filter(x => partOf(x.id) === 'quant'  && hasContent(x.id)).length;
    const legs = [];
    for (let i = 0; i < Math.ceil(v / 3); i++) legs.push({ part: 'verbal', name: 'لفظيّ ' + ar(i + 1) });
    for (let i = 0; i < Math.ceil(q / 4); i++) legs.push({ part: 'quant',  name: 'كمّيّ ' + ar(i + 1) });
    legs.push({ part: 'mix', name: 'المراجعة' });
    return legs;
  }
  const n = mySkills().filter(x => hasContent(x.id)).length;
  const legs = [];
  for (let i = 0; i < Math.ceil(n / 3); i++) legs.push({ part: 'other', name: 'الدورة ' + ar(i + 1) });
  legs.push({ part: 'mix', name: 'المراجعة' });
  return legs;
}
function journeyAt() { return (S.courses || []).length; }

/* شريط الرحلة — نقاطٌ على طريق، لا أرقام */
function journeyStrip(compact) {
  const legs = journeyPlan(), at = journeyAt();
  if (legs.length < 2) return '';
  const inC = !!courseActive();
  return `<div class="jstrip${compact ? ' mini' : ''}">
    ${compact ? '' : `<div class="jhead">
      <span class="jt">رحلتك</span>
      <span class="jn">${ar(Math.min(at + (inC ? 1 : 0), legs.length))} من ${ar(legs.length)}</span>
    </div>`}
    <div class="jline">
      ${legs.map((L, i) => {
        const st = i < at ? 'done' : (i === at && inC ? 'now' : 'next');
        return `<div class="jdot ${st} ${L.part}">
          <i></i><span>${esc(L.name)}</span>
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ══════════════ الهدف ══════════════ */
const GOALS = [
  { v: 70, t: 'جيّد', w: 'يفتح لك أبوابًا كثيرة' },
  { v: 80, t: 'متميّز', w: 'يضعك في المقدّمة' },
  { v: 85, t: 'عالٍ', w: 'يبلغ بك أصعب التخصّصات' },
  { v: 90, t: 'ممتاز', w: 'قليلٌ من يبلغه' }
];
function myGoal() { return S.goal || 85; }
function goalGap() {
  const last = (S.courses || []).slice(-1)[0];
  const now = last ? last.overall : null;
  if (now == null) return null;
  return { now, goal: myGoal(), gap: Math.max(0, myGoal() - now) };
}

/* الحلقة المزدوجة: الهدف خارجًا وأنتَ داخله */
function goalRing(now, goal, size) {
  const R = 52, C = 2 * Math.PI * R, sz = size || 150;
  const pn = Math.max(0, Math.min(100, now)) / 100;
  const pg = Math.max(0, Math.min(100, goal)) / 100;
  const band = now >= goal ? 'hit' : now >= goal - 8 ? 'near' : 'far';
  return `<div class="gring ${band}" style="width:${sz}px;height:${sz}px">
    <svg viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="${R}" class="gbg"/>
      <circle cx="60" cy="60" r="${R}" class="ggoal"
        stroke-dasharray="${(pg * C).toFixed(1)} ${C.toFixed(1)}"/>
      <circle cx="60" cy="60" r="${R}" class="gnow"
        stroke-dasharray="${(pn * C).toFixed(1)} ${C.toFixed(1)}"/>
    </svg>
    <div class="gmid">
      <div class="gv">${ar(now)}<em>٪</em></div>
      <div class="gg">الهدف ${ar(goal)}</div>
    </div>
  </div>`;
}

/* مشهد المسافة — درجاتٌ تُصعَد لا رقمٌ يُقرأ */
function gapScene(now, goal) {
  const gap = Math.max(0, goal - now);
  const steps = Math.max(1, Math.min(6, Math.ceil(gap / 2)));
  const done = gap === 0;
  return `<div class="gap ${done ? 'done' : ''}">
    <div class="gsteps">
      ${Array.from({ length: 6 }, (_, i) =>
        `<i class="${i < (6 - steps) || done ? 'on' : ''}" style="height:${28 + i * 11}px"></i>`).join('')}
    </div>
    <div class="gtext">
      ${done
        ? '<b>بلغتَ هدفك</b><span>ارفعه إن شئت، أو ثبّت ما وصلتَ إليه.</span>'
        : `<b>تفصلك ${ar(gap)} ${gap === 1 ? 'نقطة' : gap === 2 ? 'نقطتان' : 'نقاط'}</b>
           <span>عن هدفك. وكل دورةٍ تقرّبك خطوة.</span>`}
    </div>
  </div>`;
}

const COURSE_LEN = 14;
const COURSE_SKILLS = { verbal: 3, quant: 4, other: 3 };

/* بناء المحطّات: لكل مهارة ثلاث محطّات، وبينها وصلٌ ومراجعة وقياس */
function courseMap(skills) {
  const m = [];
  m.push({ k: 'intro', label: 'التعارف', why: 'أسئلة قصيرة تعرّف أُفق بنقطة بدايتك' });
  skills.forEach((sk, i) => {
    m.push({ k: 'key',   skill: sk, label: 'المفتاح',  why: 'اقرأ طريقة الحلّ قبل أن تتدرّب عليها' });
    m.push({ k: 'drill', skill: sk, label: 'التدريب',  why: 'أسئلة على المهارة بعد أن عرفتَ مفتاحها' });
    m.push({ k: 'firm',  skill: sk, label: 'التثبيت',  why: 'أسئلة أصعب، وأخطاؤك في هذه المهارة' });
    if (i === 1) m.push({ k: 'link', label: 'محطّة وصل', why: 'أخطاء المهارتين معًا حتى لا تنفصلا في ذهنك' });
  });
  m.push({ k: 'review', label: 'المراجعة الكبرى', why: 'مهارات الدورة مشتبكة في جلسة واحدة' });
  m.push({ k: 'notes',  label: 'دفتر أخطائك',    why: 'كل ما أخطأتَ فيه في هذه الدورة' });
  m.push({ k: 'test',   label: 'القياس',          why: 'نموذج مصغّر بمؤقّت — ليقول لك أين صرت' });
  return m.slice(0, COURSE_LEN);
}

function courseActive() {
  const c = S.course;
  return c && !c.finished ? c : null;
}
function courseStation(n) {
  const c = S.course; if (!c) return null;
  return (c.map || [])[n == null ? c.at : n] || null;
}
/* المحطّة متاحة إن كانت الحالية أو منجَزة — وما بعدها مقفل */
function stationState(i) {
  const c = S.course; if (!c) return 'lock';
  if (i < c.at) return 'done';
  if (i === c.at) return 'now';
  return 'lock';
}
/* غيابٌ طويل يستدعي محطّة عودة قبل الإكمال */
function courseStale() {
  const c = courseActive(); if (!c) return false;
  return c.lastDay != null && (S.day - c.lastDay) >= 5 && !c.revived;
}

function startCourse(part) {
  const p = part || (S.track === 'qudurat' ? (S.focus === 'quant' ? 'quant' : 'verbal') : 'other');
  const n = COURSE_SKILLS[p] || 3;
  /* نختار المهارات الأضعف التي لها محتوى — فالدورة تُبنى على حاجته لا على الترتيب */
  const pool = mySkills().filter(x => hasContent(x.id) &&
    (S.track !== 'qudurat' || partOf(x.id) === p));
  const picked = pool
    .map(x => ({ id: x.id, m: mastery(x.id), seen: (S.skills[x.id].days || []).length }))
    .sort((a, b) => (a.m - b.m) || (a.seen - b.seen))
    .slice(0, n).map(x => x.id);
  if (!picked.length) return false;
  S.course = {
    part: p, skills: picked, map: courseMap(picked),
    at: 0, startDay: S.day, lastDay: S.day, revived: false,
    log: [], finished: false, round: ((S.course && S.course.round) || 0) + 1
  };
  S.suggestion = null; S.session = null;
  saveState();
  return true;
}

/* تسجيل نتيجة محطّة ثمّ فتح التي بعدها */
function courseAdvance(right, total, wrongIds) {
  const c = courseActive(); if (!c) return;
  const st = courseStation();
  c.log.push({ at: c.at, k: st ? st.k : '', skill: st ? st.skill : null,
    right: right || 0, total: total || 0, wrong: (wrongIds || []).slice(0, 40), day: S.day });
  c.lastDay = S.day; c.revived = false;
  c.at += 1;
  if (c.at >= (c.map || []).length) {
    c.finished = true; c.endDay = S.day;
    /* تُقيَّد الدورة في سجلّ الرحلة، فيُقارَن بها ما بعدها */
    const R = courseReport();
    if (R) {
      S.courses = S.courses || [];
      S.courses.push({ round: c.round || 1, part: c.part, day: S.day,
        overall: R.overall, skills: R.rows.map(r => ({ id: r.id, acc: r.acc })) });
    }
  }
  saveState();
}

/* التقرير: قوّة وضعف وأفكار تُعاد */
function courseReport() {
  const c = S.course; if (!c) return null;
  const per = {};
  (c.log || []).forEach(e => {
    if (!e.skill) return;
    const p = per[e.skill] || (per[e.skill] = { right: 0, total: 0, wrong: [] });
    p.right += e.right; p.total += e.total; p.wrong = p.wrong.concat(e.wrong || []);
  });
  /* محطّات بلا مهارة (الوصل والمراجعة والقياس) تُوزَّع على مهارات الدورة */
  (c.log || []).filter(e => !e.skill).forEach(e => {
    (e.wrong || []).forEach(id => { const q = byQ(id); if (!q || !per[q.skill]) return;
      per[q.skill].wrong.push(id); });
  });
  const rows = (c.skills || []).map(id => {
    const p = per[id] || { right: 0, total: 0, wrong: [] };
    const acc = p.total ? Math.round(100 * p.right / p.total) : 0;
    return { id, name: SKILLS[id] ? SKILLS[id].name : id, acc,
      right: p.right, total: p.total, wrong: [...new Set(p.wrong)] };
  }).sort((a, b) => b.acc - a.acc);
  const tot = rows.reduce((a, r) => ({ right: a.right + r.right, total: a.total + r.total }),
    { right: 0, total: 0 });
  const overall = tot.total ? Math.round(100 * tot.right / tot.total) : 0;
  /* الأفكار التي تحتاج إعادة: أنواع المموّهات التي تكرّرت */
  const tags = {};
  rows.forEach(r => r.wrong.forEach(id => {
    const q = byQ(id); if (!q) return;
    const bad = q.choices.filter(ch => !ch.c && ch.tag);
    bad.forEach(ch => { tags[ch.tag] = (tags[ch.tag] || 0) + 0; });
  }));
  const ideas = [];
  rows.filter(r => r.acc < 75).forEach(r => {
    const L = LESSONS.lessons[r.id];
    if (L && L.idea) ideas.push({ skill: r.name, text: L.idea });
    else ideas.push({ skill: r.name, text: 'راجع مفتاح هذه المهارة قبل الدورة القادمة.' });
  });
  /* الفرق هو ما يُشعِره بالتطوّر — لا القيمة */
  const prev = (S.courses || []).filter(x => x.round !== (c.round || 1)).slice(-1)[0];
  rows.forEach(r => {
    const p = prev && (prev.skills || []).find(x => x.id === r.id);
    r.prev = p ? p.acc : null;
    r.delta = p ? r.acc - p.acc : null;
  });
  const prevOverall = prev ? prev.overall : null;
  const days = (c.endDay != null ? c.endDay : S.day) - c.startDay + 1;
  return { rows, overall, ideas, days, round: c.round || 1, prevOverall,
    goal: myGoal(), gap: Math.max(0, myGoal() - overall),
    part: c.part, strong: rows.filter(r => r.acc >= 80),
    weak: rows.filter(r => r.acc < 65) };
}

/* نصّ المشاركة — واتساب لا يقبل تنسيقًا فنجعله واضحًا بالرموز */
function reportText() {
  const R = courseReport(); if (!R) return '';
  const L = [];
  L.push('📘 تقرير دورة أُفق');
  L.push((S.name ? S.name + ' — ' : '') + 'الدورة ' + ar(R.round) +
    ' · ' + (R.part === 'quant' ? 'القسم الكمّيّ' : R.part === 'verbal' ? 'القسم اللفظيّ' : 'الدورة'));
  L.push('المدّة: ' + ar(R.days) + ' يومًا · النتيجة العامّة: ' + ar(R.overall) + '٪');
  L.push('');
  L.push('— المهارات —');
  R.rows.forEach(r => {
    const mark = r.acc >= 80 ? '🟢' : r.acc >= 65 ? '🟡' : '🔴';
    L.push(mark + ' ' + r.name + ': ' + ar(r.acc) + '٪  (' + ar(r.right) + ' من ' + ar(r.total) + ')');
  });
  if (R.strong.length) { L.push(''); L.push('✅ نقاط القوّة: ' + R.strong.map(r => r.name).join(' · ')); }
  if (R.weak.length)   { L.push('⚠️ يحتاج عملًا: ' + R.weak.map(r => r.name).join(' · ')); }
  L.push('');
  L.push('أُفق — من الثانوية إلى الجامعة');
  return L.join('\n');
}

function thread() {
  /* الدورة تسبق كل شيء: ما دامت جارية فالبطاقة الكبرى محطّتها التالية */
  const c = courseActive();
  if (c) {
    if (courseStale()) return { k: 'revive', act: 'reviveCourse', arg: null, go: null,
      label: 'عُدْ إلى دورتك', why: `غبتَ ${ar(S.day - c.lastDay)} أيام — محطّة قصيرة تنعش ما نسيتَ ثمّ تكمل` };
    const st = courseStation();
    if (st) return { k: 'station', act: 'runStation', arg: null, go: null,
      label: `المحطّة ${ar(c.at + 1)}: ${st.label}${st.skill ? ' · ' + SKILLS[st.skill].name : ''}`,
      why: st.why };
  }
  if (S.course && S.course.finished && !S.course.seen)
    return { k: 'report', act: null, arg: null, go: 'report',
      label: 'تقرير دورتك جاهز', why: 'ما أنجزتَه في أربع عشرة محطّة — وما يحتاج إعادة' };

  const due = (S.review || []).filter(r => r.due <= S.day).length;
  const seen = S.seenLessons || [];
  const ls = S.lastSummary;

  /* ١ · خطأ اليوم في مهارة لها مفتاح لم يُقرأ — أقوى لحظة تعليمية */
  if (ls && ls.wrongQ && ls.wrongQ.length) {
    const cnt = {};
    ls.wrongQ.forEach(id => { const q = byQ(id); if (q) cnt[q.skill] = (cnt[q.skill] || 0) + 1; });
    const cand = Object.keys(cnt)
      .filter(k => LESSONS.lessons[k] && !seen.includes(k))
      .sort((a, b) => cnt[b] - cnt[a])[0];
    if (cand) return { k: 'key', skill: cand, act: 'openLesson', arg: cand,
      go: null, label: `افتح مفتاح ${SKILLS[cand] ? SKILLS[cand].name : ''}`,
      why: `أخطأتَ فيها ${ar(cnt[cand])} ${cnt[cand] === 1 ? 'مرّة' : 'مرّات'} — والمفتاح لم تقرأه بعد` };
  }

  /* ٢ · مهارة تكرّر خطؤه فيها ولها مفتاح */
  const w = S.lastWeak;
  if (w && LESSONS.lessons[w] && !seen.includes(w))
    return { k: 'key', skill: w, act: 'openLesson', arg: w, go: null,
      label: `افتح مفتاح ${SKILLS[w] ? SKILLS[w].name : ''}`,
      why: 'تكرّر خطؤك فيها — والمفتاح لم تقرأه بعد' };

  /* ٣ · أخطاء استحقّت المراجعة اليوم */
  if (due >= 3) return { k: 'review', act: null, go: 'errors',
    label: `راجِع ${ar(due)} من أخطائك`,
    why: 'استحقّت المراجعة اليوم — والمراجعة في وقتها تُثبّت' };

  /* ٤ · حان الاختبار الدوريّ */
  try { if (examDue()) return { k: 'exam', act: 'examOpen', arg: 'full', go: null,
    label: 'حان موعد قياسك', why: 'أسئلة لم ترها، بمؤقّت — هذا وحده يقول أين أنت' }; } catch (e) {}

  /* ٥ · مفتاح جديد في مسارك */
  const nx = pathNext();
  if (nx) { const pd = pathDone();
    return { k: 'key', skill: nx.id, act: 'openLesson', arg: nx.id, go: null,
      label: `مفتاح ${SKILLS[nx.id] ? SKILLS[nx.id].name : ''}`,
      why: `${nx.stage} · المفتاح ${ar(pd.done + 1)} من ${ar(pd.total)} في مسارك` }; }

  /* ٦ · وإلا فالتدريب */
  const g = S.suggestion || makeSuggestion();
  return { k: 'drill', skill: g.skill, act: 'startSession', arg: null, go: null,
    label: `${ar(g.size)} سؤالًا في ${g.name}`, why: g.why };
}

/* همسة «ثمّ» — تقول أين ينتهي المسار قبل أن يبدأ. ليست زرًّا بارزًا. */
function thenWhisper() {
  const n = thread();
  /* أثناء الدورة لا همسة تنافس المحطّة. وبعدها عرضُ بدءِ دورةٍ جديدة. */
  if (n.k === 'station' || n.k === 'revive' || n.k === 'report') return '';
  if (!S.course || S.course.finished)
    return `<button class="thenw" data-act="beginCourse">ابدأ دورةً جديدة — أسبوعان بأربع عشرة محطّة ›</button>`;
  if (n.k === 'drill') return '';
  return `<button class="thenw" data-act="startSession">ثمّ: ${ar((S.suggestion || makeSuggestion()).size)} سؤالًا في ${esc(SKILLS[nextStep().skill].name)} ›</button>`;
}

/* تسليمة النتيجة — زرٌّ واحد يتغيّر نصّه بحسب ما حدث فعلًا */
function handOff() {
  const n = thread();
  const attr = n.act ? `data-act="${n.act}"${n.arg ? ` data-arg="${esc(n.arg)}"` : ''}`
                     : `data-go="${n.go}"`;
  const t = { key: 'خطوتك التالية', review: 'ما ينتظرك',
              exam: 'حان القياس', drill: '' }[n.k] || '';
  if (n.k === 'drill') return '';
  return `<div class="hoff">
    <div class="eyebrow">${esc(t)}</div>
    <button class="btn" ${attr} style="margin-top:10px">${esc(n.label)}</button>
    <p class="hwhy">${esc(n.why)}</p>
  </div>`;
}

/* وصلة من سؤال إلى فكرته — تُستعمل في الشرح ودفتر الأخطاء */
/* التطبيق يقود: كل سؤال يقول لماذا وقع هنا بالذات.
   الطالب الذي يعرف سبب السؤال يعامله معاملةً مختلفة. */
function roleNote(item, sess) {
  const n = sess.idx + 1, tot = sess.items.length;
  if (item.role === 'duel') return '';
  if (item.role === 'review')
    return `<p class="rolen"><i>↺</i> أخطأتَ فيه من قبل — تذكّر قبل أن تقرأ الخيارات.</p>`;
  if (item.role === 'warm' || n === 1)
    return `<p class="rolen"><i>◦</i> نبدأ هادئين. هذا سؤال تمهيد.</p>`;
  if (n === tot)
    return `<p class="rolen"><i>✦</i> آخر أسئلة الجلسة.</p>`;
  if (item.role === 'stretch' || (item.d && item.d >= 5))
    return `<p class="rolen"><i>▲</i> هذا أصعب ممّا سبق — خُذ وقتك.</p>`;
  return '';
}
function keyLink(skillId, label) {
  if (!skillId || !LESSONS.lessons[skillId]) return '';
  const seen = (S.seenLessons || []).includes(skillId);
  const nm = SKILLS[skillId] ? SKILLS[skillId].name : '';
  return `<button class="klink" data-act="openLesson" data-arg="${esc(skillId)}">
    <span class="kl-i">✦</span>
    <span class="kl-t">${esc(label || (seen ? `راجِع فكرة ${nm}` : `هذه فكرة ${nm}`))}</span>
    <span class="kl-a">›</span></button>`;
}

/* وصلة من مفتاح إلى تدريب قصير عليه */
function drillLink(skillId) {
  if (!skillId || !hasContent(skillId)) return '';
  const nm = SKILLS[skillId] ? SKILLS[skillId].name : '';
  return `<button class="klink go" data-act="drillSkill" data-arg="${esc(skillId)}">
    <span class="kl-i">◆</span>
    <span class="kl-t">جرّبها الآن على ${esc(nm)}</span>
    <span class="kl-a">›</span></button>`;
}

function nextStep() {
  const g = S.suggestion || makeSuggestion();
  const sk = g.skill, hasKey = !!LESSONS.lessons[sk];
  const seen = (S.seenLessons || []).includes(sk);
  const w = S.lastWeak;
  if (w && LESSONS.lessons[w])
    return { kind: 'key', skill: w, why: 'تكرّر خطؤك فيها أمس — راجِع المفتاح أوّلًا' };
  const nx = pathNext();
  if (nx) {
    const pd = pathDone();
    return { kind: 'key', skill: nx.id,
      why: `${nx.stage} · المفتاح ${ar(pd.done + 1)} من ${ar(pd.total)} في مسارك` };
  }
  if (hasKey && !seen)
    return { kind: 'key', skill: sk, why: 'مهارة جديدة — ابدأ بمفتاح حلّها' };
  return { kind: 'drill', skill: sk, why: g.why };
}
/* ══════════ البطاقة القائدة ══════════
   أُفق يقود ولا يترك الطالب يتجوّل. فالبطاقة الكبرى هي قرار «الخيط» نفسه
   لا خيارًا منافسًا له: مفتاحٌ يُقرأ، أو خطأٌ يُراجَع، أو نموذجٌ حان وقته،
   أو تدريب. وما عداه همسٌ باهت تحتها.
   وقاعدتها: فعلٌ واحد بارز في الشاشة، والباقي يخفت. */
const LEAD_HEAD = {
  key:    'خطوتك الآن',
  review: 'ما ينتظرك',
  exam:   'حان وقت القياس',
  drill:  'جلسة اليوم'
};
const LEAD_BADGE = {
  key:    'مفتاح الحلّ',
  review: 'دفتر أخطائك',
  exam:   'نموذج كامل',
  drill:  null
};
/* ══════════ الاستماع ══════════
   لا ملفّات صوتية: يتكلّم المتصفّح نفسه بـ speechSynthesis.
   فلا حجم يُحمَّل، ولا كلفة استضافة، ويعمل بلا إنترنت بعد أول فتح.
   والنصّ لا يُرى إلا بعد الإجابة — وإلا صار قراءةً لا استماعًا. */
const SPEAK = {
  ok: () => typeof speechSynthesis !== 'undefined',
  voice: null,
  pick() {
    if (this.voice) return this.voice;
    const vs = speechSynthesis.getVoices() || [];
    this.voice = vs.find(v => /^en-GB/i.test(v.lang))
              || vs.find(v => /^en-US/i.test(v.lang))
              || vs.find(v => /^en/i.test(v.lang)) || null;
    return this.voice;
  },
  say(text, rate) {
    if (!this.ok()) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = this.pick(); if (v) u.voice = v;
      u.lang = (v && v.lang) || 'en-US';
      u.rate = rate || 0.92;
      u.onend = () => { S.speaking = false; const b = document.getElementById('playbtn');
        if (b) b.classList.remove('on'); };
      S.speaking = true;
      speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) {} S.speaking = false; }
};

/* لوحة الاستماع: زرّ تشغيل ومرّات محدودة كما في الاختبار الحقيقيّ */
function listenPane(q, item) {
  if (!q.listen) return '';
  const used = item.played || 0;
  const left = Math.max(0, 2 - used);
  if (!SPEAK.ok()) {
    return `<div class="listen noaudio">
      <div class="lbl">الاستماع</div>
      <p class="p-para">${esc(q.listen)}</p>
      <div class="faint">متصفّحك لا يدعم النطق، فعُرض النصّ بدلًا منه.</div>
    </div>`;
  }
  return `<div class="listen">
    <button class="playbtn${S.speaking ? ' on' : ''}" id="playbtn" data-act="playListen"
      ${left ? '' : 'disabled'}>
      <span class="pico">▶</span>
      <span>${used ? 'أعِد الاستماع' : 'استمع'}</span>
    </button>
    <div class="faint">${left ? `يبقى ${ar(left)} من مرّتين` : 'انتهت مرّتاك — أجب بما سمعت'}</div>
  </div>`;
}


/* السنة الهجرية بجوار الميلادية في حقوق النشر — فالطالب سعوديّ ويقرأ بالتاريخين */
function hijriYear() {
  try {
    const p = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { year: 'numeric' })
      .formatToParts(new Date()).find(x => x.type === 'year');
    if (!p) return null;
    const n = parseInt(String(p.value).replace(/[^0-9٠-٩]/g, '')
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)), 10);
    return (n > 1300 && n < 1600) ? n : null;
  } catch (e) { return null; }
}


/* ══════════════ لوحة المطوّر ══════════════
   لا تظهر للطالب. تُفتَح بسبع نقرات على رقم النسخة، وتبقى مفتوحة حتى تُقفَل بيد صاحبها.
   فيها ما يحتاجه المالك لاختبار التطبيق: السفر في الزمن، وإحصاء البنك،
   ووضع المراجعة، والتحكّم في الدورات، والمسارات المؤجّلة. */
function devPanel() {
  const T = {};
  (Q || []).forEach(q => {
    const sk = SKILLS[q.skill]; if (!sk) return;
    const tr = sk.track || '?';
    const t = T[tr] || (T[tr] = { n: 0, orig: 0, skills: {} });
    t.n++; if (q.origin === 'original') t.orig++;
    t.skills[q.skill] = (t.skills[q.skill] || 0) + 1;
  });
  const NAMES = { qudurat: 'القدرات', tahsili: 'التحصيلي', step: 'ستيب', kfupm: 'البترول', aramco: 'أرامكو' };
  const trackRows = Object.keys(NAMES).filter(k => T[k]).map(k => {
    const t = T[k];
    const thin = Object.values(t.skills).filter(v => v < 180).length;
    const all = Object.keys(t.skills).length;
    return `<div class="dvrow">
      <span class="dvn">${esc(NAMES[k])}${OPEN_TRACKS.includes(k) ? '' : ' <em>مؤجَّل</em>'}</span>
      <span class="dvv">${ar(t.n)}</span>
      <span class="dvs ${thin ? 'warn' : 'ok'}">${thin ? ar(thin) + ' دون العتبة' : '✓ مكتمل'}</span>
    </div>`;
  }).join('');
  const tot = (Q || []).length;
  const orig = (Q || []).filter(q => q.origin === 'original').length;
  const c = S.course;
  const found = S.devFound && S.devFound !== '__none__' ? byQ(S.devFound) : null;

  return `
  <div class="devhead">
    <div class="dvbadge">وضع المطوّر</div>
    <p class="note" style="padding:6px 0 0">لا يراه الطالب. يبقى مفتوحًا حتى تُقفله من أسفل هذه الصفحة.</p>
  </div>

  <div class="group"><div class="group-h"><span class="t">البنك</span></div>
    <div class="card">
      <div class="dvstats">
        <div><b>${ar(tot)}</b><span>سؤالًا</span></div>
        <div><b>${ar(Math.round(100 * orig / Math.max(1, tot)))}٪</b><span>أصليّ</span></div>
        <div><b>${ar((PASSAGES || []).length)}</b><span>قطعة</span></div>
        <div><b>${ar((Q || []).filter(q => q.listen).length)}</b><span>استماع</span></div>
      </div>
      ${trackRows}
    </div>
  </div>

  <div class="group"><div class="group-h"><span class="t">السفر في الزمن</span></div>
    <div class="card">
      <div class="kv"><span>اليوم الحاليّ</span><span class="v num">${ar(S.day || 1)}</span></div>
      <div class="dvbtns">
        <button class="mini" data-act="devDay" data-arg="-7">− أسبوع</button>
        <button class="mini" data-act="devDay" data-arg="-1">− يوم</button>
        <button class="mini" data-act="devDay" data-arg="1">+ يوم</button>
        <button class="mini" data-act="devDay" data-arg="7">+ أسبوع</button>
      </div>
      <p class="note" style="padding:10px 0 0">يُظهر أثر المراجعة المتباعدة، ومحطّة العودة بعد الغياب، وتجميد السلسلة.</p>
    </div>
  </div>

  <div class="group"><div class="group-h"><span class="t">الدورة</span></div>
    <div class="card">
      <div class="kv"><span>الحالة</span><span class="v">${c
        ? (c.finished ? 'منتهية' : `المحطّة ${ar(c.at + 1)} من ${ar((c.map || []).length)}`)
        : 'لا دورة'}</span></div>
      <div class="kv"><span>الدورات المنجزة</span><span class="v num">${ar((S.courses || []).length)}</span></div>
      <div class="dvbtns">
        <button class="mini" data-act="devFinishStation" ${courseActive() ? '' : 'disabled'}>أنجز محطّة</button>
        <button class="mini" data-act="devFinishCourse" ${courseActive() ? '' : 'disabled'}>أنهِ الدورة</button>
        <button class="mini" data-act="devClearCourses">صفّر الدورات</button>
      </div>
    </div>
  </div>

  <div class="group"><div class="group-h"><span class="t">وضع المراجعة</span>
    <button class="sw ${S.audit ? 'on' : ''}" data-act="toggleAudit"><i></i></button></div>
    <p class="note">يُظهر تحت كل سؤال: رقمه، ومهارته، وصعوبته، ووسم كل مموّه. لمراجعة البنك أثناء الحلّ.</p>
  </div>

  <div class="group"><div class="group-h"><span class="t">الأصليّ فقط</span>
    <button class="sw ${S.cleanOnly ? 'on' : ''}" data-act="toggleClean"><i></i></button></div>
    <p class="note">يحصر الجلسات في الأسئلة المؤلَّفة، ويستبعد ما سواها.</p>
  </div>

  <div class="group"><div class="group-h"><span class="t">المسارات المؤجَّلة</span>
    <button class="sw ${S.showParked ? 'on' : ''}" data-act="devParked"><i></i></button></div>
    <p class="note">يُظهر البترول وأرامكو في شاشة الاختيار لتجربتهما. لا يراهما الطالب.</p>
  </div>

  <div class="group"><div class="group-h"><span class="t">ابحث عن سؤال</span></div>
    <div class="card">
      <div class="dvfind">
        <input id="devq" class="tin" placeholder="رقم السؤال — مثل jv014" dir="ltr" value="${esc(S.devFound && S.devFound !== '__none__' ? S.devFound : '')}">
        <button class="mini" data-act="devFind">ابحث</button>
      </div>
      ${S.devFound === '__none__' ? '<p class="note" style="color:var(--near)">لا سؤال بهذا الرقم.</p>' : ''}
      ${found ? `<div class="dvq">
        <div class="dvqh">${esc(SKILLS[found.skill] ? SKILLS[found.skill].name : found.skill)} · صعوبة ${ar(found.d || 0)}${found.passage ? ' · قطعة ' + esc(found.passage) : ''}</div>
        <div class="dvqs">${esc(found.stem)}</div>
        ${found.choices.map(ch => `<div class="dvqc ${ch.c ? 'ok' : ''}">${ch.c ? '✓' : '·'} ${esc(ch.t)}${ch.tag ? ` <em>${esc(ch.tag)}</em>` : ''}</div>`).join('')}
      </div>` : ''}
    </div>
  </div>

  <div class="group"><div class="group-h"><span class="t">الحالة الكاملة</span></div>
    <button class="btn ghost" data-act="devExport">نزّل حالة التطبيق ملفًّا</button>
    <p class="note" style="padding-top:8px">كل ما في ذاكرة التطبيق بصيغة JSON — لفحص خللٍ أو إرساله للمراجعة.</p>
  </div>

  <button class="btn danger" data-act="devLock" style="margin-top:22px">أقفل وضع المطوّر</button>
  `;
}


/* ══════════════ قرارات أُفق ══════════════
   ما كان خيارًا للطالب صار قرارًا لأُفق — يُعرَض مع سببه لا كزرٍّ يحتار فيه.
   لأن الطالب الذي يرى عشرة أزرار لا يعرف أين يضغط، ومن لا يعرف لا يبدأ. */

/* الأيام حتى الاختبار إن حدّده */
function daysToExam() {
  try {
    if (!S.examDate) return null;
    const d = Math.round((new Date(S.examDate) - new Date()) / 86400000);
    return isFinite(d) ? d : null;
  } catch (e) { return null; }
}

/* الدقّة العامّة من نوافذ المهارات التي بدأها */
function overallAcc() {
  const ws = Object.keys(S.skills || {}).map(k => S.skills[k])
    .filter(st => st && st.window && st.window.length);
  if (!ws.length) return 0.75;
  const hit = ws.reduce((a, st) => a + st.window.filter(Boolean).length, 0);
  const tot = ws.reduce((a, st) => a + st.window.length, 0);
  return tot ? hit / tot : 0.75;
}

/* القسم: لفظيّ أم كمّيّ — بحسب المرحلة وما بقي من الوقت */
function ufqFocus() {
  if (S.track !== 'qudurat') return { v: 'both', why: 'هذا المسار قسمٌ واحد' };
  let ph = null; try { ph = phaseNow(); } catch (e) {}
  const left = daysToExam();
  if (left != null && left <= 21)
    return { v: 'both', why: 'اقترب اختبارك — فالتناوب بين القسمين أنفع الآن' };
  if (ph && ph.part === 'quant')
    return { v: 'quant', why: 'أنت في المرحلة الكمّية — والتركيز فيها أسرع من التنقّل' };
  return { v: 'verbal', why: 'تبدأ باللفظيّ لأن مهاراته أقلّ عددًا فتشعر بالإنجاز أبكر' };
}

/* حجم الجلسة: يكبر مع الثبات ويصغر عند التعثّر */
function ufqSize() {
  const acc = overallAcc();
  const st = S.streak || 0;
  if (acc < 0.6) return { v: 20, why: 'صغّرناها قليلًا حتى تستقرّ دقّتك' };
  if (st >= 7 && acc >= 0.8) return { v: 35, why: 'ثباتك ودقّتك يحتملان جلسةً أطول' };
  return { v: 30, why: 'الحجم الذي أثبت أنه أنسب للأكثر' };
}

/* الإيقاع اليوميّ: جولتان إلا عند ضيق الوقت */
function ufqPace() {
  const left = daysToExam();
  if (left != null && left <= 14) return { v: 3, why: 'بقي وقتٌ قصير — فثلاث جولات قصيرة' };
  if ((S.streak || 0) === 0 && (S.sessionCount || 0) < 4)
    return { v: 1, why: 'نبدأ بجولةٍ واحدة حتى تثبت العادة' };
  return { v: 2, why: 'جولتان قصيرتان تُثبّتان أكثر من جلسةٍ واحدة بالمدّة نفسها' };
}

/* تُطبَّق القرارات في كل يومٍ جديد، ويبقى للطالب أن يخالفها مرّةً من «متقدّم» */
function applyDecisions() {
  if (S.manualOverride) return;
  const f = ufqFocus(), z = ufqSize(), p = ufqPace();
  S.focus = f.v;
  S.size = (typeof z.v === 'number' && isFinite(z.v)) ? z.v : 30;
  S.preset = p.v >= 3 ? 'full' : (p.v === 1 ? 'light' : 'steady');
  S._why = { focus: f.why, size: z.why, pace: p.why };
  S._val = { focus: f.v, size: z.v, pace: p.v };
}

/* بطاقة القرار: ما قرّره أُفق ولماذا — لا زرّ فيها */
function decisionCard() {
  applyDecisions();
  const w = S._why || {}, v = S._val || {};
  const FN = { verbal: 'القسم اللفظيّ', quant: 'القسم الكمّيّ', both: 'القسمان معًا' };
  const rows = [
    ['قسمك اليوم', FN[v.focus] || '—', w.focus],
    ['حجم الجلسة', ar(v.size || 30) + ' سؤالًا', w.size],
    ['جولات اليوم', ar(v.pace || 2) + (v.pace === 1 ? ' جولة' : ' جولات'), w.pace]
  ];
  return `<div class="decide">
    <div class="dh"><span class="di">✦</span><b>قرّرها أُفق لك</b></div>
    ${rows.map(([k, val, why]) => `<div class="drow">
      <div class="dk">${esc(k)}</div>
      <div class="dv">${esc(val)}</div>
      <div class="dw">${esc(why || '')}</div>
    </div>`).join('')}
    <details class="fold"><summary>أريد أن أختار بنفسي</summary>
      <div class="note">أُفق يعيد النظر في هذه الثلاثة كل يوم بحسب دقّتك وثباتك وما بقي من وقتك.
        وإن أردتَ تعطيلها وضبطها بيدك فذلك في «جهازك ← متقدّم» — ولا ننصح به.</div>
    </details>
  </div>`;
}

function leadCard(again) {
  const g = S.suggestion || makeSuggestion();
  const n = thread();
  /* الدورة تُعرَض بشكلها الخاصّ: مسارٌ لا جلسة */
  if (n.k === 'station' || n.k === 'revive') {
    const c = S.course, map = (c && c.map) || [];
    return `${journeyStrip(true)}
    <div class="lead key" data-act="${n.act}">
      <div class="ld-h">دورتك · ${ar(Math.min(c.at + 1, map.length))} من ${ar(map.length)}</div>
      <div class="ld-t">${esc(n.label)}</div>
      <div class="ld-w">${esc(n.why)}</div>
      <div class="ld-f"><span class="ld-b">ابدأ المحطّة</span>
        <span class="ld-a">›</span></div>
    </div>
    <button class="detour" data-go="course">اعرض مسار الدورة كاملًا</button>`;
  }
  if (n.k === 'report') {
    return `<div class="lead key" data-go="creport">
      <div class="ld-h">دورتك · اكتملت</div>
      <div class="ld-t">${esc(n.label)}</div>
      <div class="ld-w">${esc(n.why)}</div>
      <div class="ld-f"><span class="ld-b">اعرض التقرير</span><span class="ld-a">›</span></div>
    </div>`;
  }
  /* «أعد» بعد جلسةٍ أُنجزت تبقى تدريبًا مهما قال الخيط */
  const k = again && n.k !== 'exam' ? 'drill' : n.k;
  const act = k === 'drill' ? (again ? 'again' : 'startSession') : n.act;
  const arg = k === 'drill' ? null : n.arg;
  const go  = k === 'drill' ? null : n.go;
  const attr = act ? `data-act="${act}"${arg ? ` data-arg="${esc(arg)}"` : ''}`
                   : `data-go="${go}"`;
  const title = k === 'drill' ? SKILLS[nextStep().skill].name : n.label;
  const why   = k === 'drill' ? g.why : (n.why || g.why);
  const badge = LEAD_BADGE[k];
  return `<div class="lead ${k === 'drill' ? 'drill' : 'key'}" ${attr}>
    <div class="ld-h">${esc(TRACKS[S.track].journey)} · ${esc(LEAD_HEAD[k] || 'خطوتك الآن')}</div>
    <div class="ld-t">${esc(title)}</div>
    <div class="ld-w">${esc(why)}</div>
    <div class="ld-f">
      <span class="ld-b">${badge ? esc(badge) : `${ar(g.size)} سؤالًا`}</span>
      ${badge ? `<span class="ld-n">ثم ${ar(g.size)} سؤالًا</span>` : ''}
      <span class="ld-a">›</span>
    </div>
  </div>`;
}
/* الرئيسة: مركز ثقل واحد.
   التحية سطر، والجولات سطر، والإحصاءات موضعها «التقدّم» لا هنا. */
function greetCard() {
  return `<p class="gline">${esc(greetLine())}</p>`;
}
/* سطر الجولات: ثلاث نقاط ونصّ واحد — لا بطاقة */
function roundsLine() {
  const rs = myRounds();
  if (!rs.length || !S.name) return '';
  const done = ((S.roundsDone || {})[S.day] || []).length;
  const nx = nextRound();
  const dots = rs.map((r, i) => {
    const stt = roundState(i);
    return `<i class="rdot ${stt}"></i>`;
  }).join('');
  const note = nx
    ? (nx.st === 'late'
        ? `كان موعد «${esc(roundKind(nx.r.kind).t)}» ${esc(fmtTime(nx.r.at))} — لا بأس`
        : nx.st === 'now'
          ? `حان وقت «${esc(roundKind(nx.r.kind).t)}»`
          : `التالية ${esc(fmtTime(nx.r.at))}`)
    : 'أتممتَ جولات اليوم';
  return `<div class="rline" data-go="settings">
    <span class="rdots">${dots}</span>
    <span class="rtxt">${esc(done)}‏/‏${ar(rs.length)} · ${note}</span>
  </div>`;
}

/* ---------- screens ---------- */
function deltaReport() {
  const H = (S.history || []).filter(h => h.total >= 4);
  if (H.length < 4) return null;
  const half = Math.min(Math.floor(H.length / 2), 8);
  const recent = H.slice(0, half), older = H.slice(half, half * 2);
  if (!older.length) return null;
  const acc = a => { let r = 0, t = 0; a.forEach(h => { r += h.right; t += h.total; });
    return t ? r / t : 0; };
  const pace = a => { const v = a.map(h => h.pace).filter(x => x);
    return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
  // لكل مهارة: صواب حديث مقابل قديم
  const bySk = {};
  const tally = (arr, key) => arr.forEach(h => (h.items || []).forEach(it => {
    const k = it.skill; bySk[k] = bySk[k] || { nr: 0, nt: 0, or: 0, ot: 0 };
    bySk[k][key + 't']++; if (it.chosen === it.correct) bySk[k][key + 'r']++; }));
  tally(recent, 'n'); tally(older, 'o');
  const gains = Object.keys(bySk).map(k => {
    const b = bySk[k];
    if (b.nt < 3 || b.ot < 3) return null;
    return { name: k, was: b.or / b.ot, now: b.nr / b.nt, d: (b.nr / b.nt) - (b.or / b.ot), n: b.nt };
  }).filter(Boolean).sort((a, b) => b.d - a.d);
  return {
    accWas: acc(older), accNow: acc(recent),
    paceWas: pace(older), paceNow: pace(recent),
    sessions: H.length, up: gains.filter(g => g.d > .05).slice(0, 3),
    down: gains.filter(g => g.d < -.05).slice(-2).reverse()
  };
}
function deltaPanel() {
  const r = deltaReport();
  if (!r) return `<div class="dlt soonly"><span class="dl-i">◈</span>
    <div><b>ما تغيّر فيك</b> — يظهر هنا بعد أربع جلسات.
      نقارن أداءك الأخير بما قبله، ونُريك أثر التكرار بالأرقام.</div></div>`;
  const dAcc = Math.round(100 * (r.accNow - r.accWas));
  const dPace = (r.paceWas && r.paceNow) ? Math.round(r.paceWas - r.paceNow) : null;
  const arrow = v => v > 0 ? '<span class="up">▲</span>' : v < 0 ? '<span class="dn">▼</span>' : '<span class="fl">—</span>';
  return `<div class="dlt">
    <div class="dl-h"><span class="dl-i">◈</span>ما تغيّر فيك
      <span class="dl-s">آخر ${ar(Math.min(r.sessions, 8))} جلسات مقابل ما قبلها</span></div>
    <div class="dl-g">
      <div class="dl-c"><div class="dl-n">${arrow(dAcc)} ${ar(Math.abs(dAcc))}<small>نقطة</small></div>
        <div class="dl-l">في الإجابة الصحيحة</div>
        <div class="dl-w">${ar(Math.round(100*r.accWas))}٪ ← ${ar(Math.round(100*r.accNow))}٪</div></div>
      ${dPace !== null ? `<div class="dl-c"><div class="dl-n">${arrow(dPace)} ${ar(Math.abs(dPace))}<small>ثانية</small></div>
        <div class="dl-l">في زمن السؤال</div>
        <div class="dl-w">${ar(Math.round(r.paceWas))} ← ${ar(Math.round(r.paceNow))} ثانية</div></div>` : ''}
    </div>
    ${r.up.length ? `<div class="dl-row"><span class="dl-t up">تقدّمتَ</span>
      <span>${r.up.map(g => `${esc(g.name)} <b class="up">+${ar(Math.round(100*g.d))}</b>`).join(' · ')}</span></div>` : ''}
    ${r.down.length ? `<div class="dl-row"><span class="dl-t dn">تراجعتَ</span>
      <span>${r.down.map(g => `${esc(g.name)} <b class="dn">${ar(Math.round(100*g.d))}</b>`).join(' · ')}</span></div>` : ''}
    <p class="dl-f">${r.accNow > r.accWas
      ? 'هذا أثر التكرار المتباعد — لا الحظّ. واصل على إيقاعك.'
      : r.accNow < r.accWas
      ? 'التراجع بعد التقدّم طبيعيّ حين تدخل مهارات أصعب. الأسئلة التي تخطئ فيها تعود إليك.'
      : 'ثباتك على المستوى نفسه مع أسئلة أصعب تقدّمٌ في الحقيقة.'}</p>
  </div>`;
}


/* ══════════════ قائمة الإعدادات ══════════════
   صفوفٌ بقيمها الحالية — يرى الطالب كل شيء في شاشةٍ واحدة،
   وكل صفٍّ يفتح شاشته وحده فلا يزاحمه غيره. */
function settingsList() {
  let rounds = 0; try { rounds = (myRounds(S.schedTab || 'week') || []).length; } catch (e) {}
  const FN = { verbal: 'لفظيّ', quant: 'كمّيّ', both: 'القسمان' };
  const V = {
    name: S.name || '—',
    goal: ar(myGoal()),
    exam: S.examIn ? ('بعد ' + ar(S.examIn) + ' يومًا') : 'لم يُحدَّد',
    plan: (FN[S.focus] || '—') + ' · ' + ar(S.size || 30) + ' سؤالًا',
    remind: rounds ? (ar(rounds) + (rounds === 1 ? ' جولة' : ' جولات')) : 'بلا تذكير',
    look: (S.audio ? 'صوت مفعَّل' : 'صوت مطفأ'),
    ver: APP_VERSION.split('.').map(x => ar(x)).join('٫')
  };
  const row = (id, ic, label, val, sub) => `<button class="srow" data-act="openRow" data-arg="${id}">
    <span class="sic">${ic}</span>
    <span class="sbd"><b>${esc(label)}</b>${sub ? `<em>${esc(sub)}</em>` : ''}</span>
    <span class="sv">${esc(val || '')}</span>
    <span class="sar">‹</span></button>`;
  return `<div class="top backtop sview">
    <button class="backb" data-go="home" aria-label="رجوع">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>اليوم</span></button>
    <span class="eyebrow" style="margin:0">الإعدادات</span></div>

  <div class="idcard">
    <span class="av" style="color:var(--glow)">${trackGlyph(S.track, 26)}</span>
    <div class="who"><b>${esc(S.name || '—')}</b><span>${esc(TRACKS[S.track].name)}</span></div>
    <button class="mini" data-act="editName">غيّر</button>
  </div>

  <div class="slist">
    <div class="sgrp">حسابك</div>
    ${row('goal', '◎', 'هدفك في الاختبار', V.goal)}
    ${row('exam', '⏱', 'موعد اختبارك', V.exam)}

    <div class="sgrp">تدريبك</div>
    ${row('plan', '✦', 'ما يقرّره أُفق', V.plan, 'القسم والحجم والجولات')}
    ${row('remind', '◔', 'مواعيد التذكير', V.remind)}

    <div class="sgrp">جهازك</div>
    ${row('look', '◐', 'المظهر والصوت', V.look)}
    ${row('share', '⤴', 'المشاركة والتثبيت', '')}
    ${row('data', '⛁', 'بياناتك ونسختك', '')}

    <div class="sgrp">عن أُفق</div>
    ${row('about', 'ⓘ', 'عن أُفق وشروطه', V.ver)}
    ${S.devUnlocked ? row('dev', '✦', 'المطوّر', 'مفتوح') : ''}
  </div>`;
}

function settingsPanels() {
  if (S.setTab == null) S.setTab = 0;
  if (S.screen !== 'settings') S.setRow = null;
  const pausable = mySkills().filter(s => hasContent(s.id));
  const paused = pausable.filter(s => S.skills[s.id].paused);
  return `<div class="hidden-top" style="display:none">
    <button class="backb" data-go="home" aria-label="رجوع">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>اليوم</span></button>
    <span class="eyebrow" style="margin:0">الإعدادات</span></div>
  <div class="idcard">
    <span class="av" style="color:var(--glow)">${trackGlyph(S.track, 26)}</span>
    <div class="who"><b>${esc(S.name || '—')}</b><span>${esc(TRACKS[S.track].name)} · ${esc(TRACKS[S.track].tag)}</span></div>
    <button class="mini" data-act="editName">الاسم</button>
  </div>
  <button class="goalcard" data-go="goal">
    <div class="gcnum">${ar(myGoal())}</div>
    <div class="gcbody"><b>هدفك في الاختبار</b>
      <span>${(S.courses||[]).length ? `آخر دورة ${ar((S.courses||[]).slice(-1)[0].overall)}٪` : 'اضغط لتغييره'}</span></div>
    <span class="gcarrow">›</span>
  </button>
  <div class="stabs four"><button class="stb ${S.setTab===0?'on':''}" data-act="setTab" data-arg="0">الدراسة</button><button class="stb ${S.setTab===5?'on':''}" data-act="setTab" data-arg="5">التذكير</button><button class="stb ${S.setTab===6?'on':''}" data-act="setTab" data-arg="6">جهازك</button><button class="stb ${S.setTab===4?'on':''}" data-act="setTab" data-arg="4">عن أُفق</button>${S.devUnlocked ? `<button class="stb dev ${S.setTab===7?'on':''}" data-act="setTab" data-arg="7">المطوّر</button>` : ''}</div>
<div class="spane">
${S.setTab===7 && S.devUnlocked ? devPanel() : ''}
${S.setTab===0 ? `
  ${decisionCard()}
  <div class="group"><div class="group-h"><span class="t">متى اختبارك؟</span></div>
    <div class="card">
      <p class="note" style="padding:0 0 12px">حدّده ليعرف أُفق كم بقي، فيضبط قراراته على ما تبقّى.</p>
      <div class="seg3">
        ${[[30,'بعد شهر'],[60,'بعد شهرين'],[90,'بعد ٣ أشهر'],[0,'لم أحدّد']].map(([d,lbl]) =>
          `<button class="sg ${(S.examIn||0)===d?'on':''}" data-act="setExam" data-arg="${d}">${esc(lbl)}</button>`).join('')}
      </div>
    </div>
  </div>

  ${S.track === 'qudurat' ? `
  ` : ''}
  
` : ''}
${S.setTab===5 ? `
  <div class="group" style="margin-top:14px"><div class="group-h"><span class="t">متى تذاكر؟</span></div>
    <p class="note" style="margin-bottom:10px">اربط جلستك بشيء تفعله أصلًا كل يوم.
      الموعد المرتبط بحدث يثبت أسرع من ساعة تُنسى.</p>
    <div class="thgrid">
      ${ANCHORS.map(a => `<button class="thcard ${S.anchor === a.id ? 'sel' : ''}"
        data-act="setAnchor" data-arg="${a.id}" style="padding:13px 8px;text-align:center">
        <span style="display:block;font-family:var(--display);font-size:14px;color:var(--ink);margin-bottom:3px">${esc(a.t)}</span>
        <span style="font-size:11.5px">${esc(a.b)}</span></button>`).join('')}
    </div>
    ${S.anchor === 'clock' ? `<div class="card" style="margin-top:10px">
      <div class="kv" style="border:0;padding:0"><span>الساعة</span><span class="v">${S.reminder}</span></div>
    </div>` : ''}
  </div>
  <div class="card">
    <div class="kv" style="border:0;padding:0"><span>إعادة التشخيص</span>
      <span class="v">متاح بعد ${ar(14)} يومًا</span></div>
  </div>
  
  
  
  
  ${S.devUnlocked ? `<div class="dev"><h3>محاكاة (للعرض فقط)</h3>
    <div class="seg">
      <button data-act="advance" data-arg="1">+ يوم</button>
      <button data-act="advance" data-arg="3">+ ٣ أيام</button>
      <button data-act="advance" data-arg="9">+ ٩ أيام</button>
    </div></div>` : ''}
` : ''}
${S.setTab===6 ? `<div class="subtabs"><button class="sub ${(S.devTab||0)===0?'on':''}" data-act="devTabSet" data-arg="0">المظهر والجهاز</button><button class="sub ${(S.devTab||0)===1?'on':''}" data-act="devTabSet" data-arg="1">المشاركة</button><button class="sub ${(S.devTab||0)===2?'on':''}" data-act="devTabSet" data-arg="2">بياناتك</button></div>` : ''}
${(S.setTab===6 && (S.devTab||0)===0) ? `
  <div class="group"><div class="group-h"><span class="t">المظهر</span></div>
    ${themeGrid()}
  </div>
` : ''}
${(S.setTab===6 && (S.devTab||0)===0) ? `
  <div class="group" style="margin-top:14px"><div class="group-h"><span class="t">النسخة</span></div>
    <div class="card">
      <div class="kv" data-act="devTap" style="cursor:default;-webkit-user-select:none;user-select:none"><span>نسخة أُفق</span><span class="v num">${APP_VERSION.split('.').map(x=>ar(x)).join('٫')}${S.devHint && !S.devUnlocked ? ` <em style="color:var(--ink-faint);font-style:normal;font-size:11px">· ${ar(S.devHint)}</em>` : ''}</span></div>
      <div class="kv"><span>تمّ التحديث بتاريخ</span><span class="v">${esc(APP_DATE)}</span></div>
      <div class="kv" style="border:0"><span>الحالة</span><span class="v">محدَّث</span></div>
      <button class="btn ghost" style="margin-top:10px" data-act="checkUpdate">ابحث عن تحديث</button>
    </div>
  </div>
  <div class="group"><div class="group-h"><span class="t">التطبيق على جهازك</span></div>
    ${installCard()}
    ${installDiag()}
  </div>
  <div class="group"><div class="group-h"><span class="t">الاستماع</span>
    <button class="sw ${S.audio ? 'on' : ''}" data-act="toggleAudio"><i></i></button></div>
    <p class="note">يقرأ التطبيق شرح مفاتيح الحلّ صوتيًّا. الأسئلة وقطع الاستيعاب تبقى قراءةً — لأن الاختبار قراءة.</p>
  </div>
` : ''}
${(S.setTab===6 && (S.devTab||0)===1) ? `
  <div class="group"><div class="group-h"><span class="t">مشاركة التقدّم</span></div>
    <div class="card">
      <div class="kv" style="border:0;padding:0 0 10px">
        <span>تقرير أسبوعي إلى ولي الأمر</span>
        <span class="v">${S.shareReport ? 'مفعّل' : 'متوقف'}</span></div>
      <p class="note">يتضمن: أيام نشاطك، وما أكملته، وما يحتاج وقتًا أطول — مع اقتراحات لكيفية دعمك.<br>
        لا يتضمن: درجاتك، ولا أخطاءك، ولا أسئلتك.</p>
      <div class="seg" style="margin-top:12px">
        <button data-act="toggleShare" data-arg="1" class="${S.shareReport ? 'sel' : ''}">مفعّل</button>
        <button data-act="toggleShare" data-arg="0" class="${!S.shareReport ? 'sel' : ''}">متوقف</button>
      </div>
      <button class="btn ghost" style="text-align:right;width:auto;padding-inline-start:0;margin-top:6px"
        data-go="report">اعرض ما سيصله ›</button>
    </div>
  </div>
  ${(S.flags || []).length ? `` : ''}
  <div class="group"><div class="group-h"><span class="t">تواصل مع المطوّر</span></div>
    <p class="note">ملاحظاتك تُحسّن الأداة. اكتب لنا إن وجدتَ خطأً أو سؤالًا مكرّرًا أو فكرة.</p>
    <button class="btn ghost" style="margin-top:11px" data-act="contactDev">أرسل ملاحظة</button>
    ${(S.flags && S.flags.length) ? `<p class="note" style="margin-top:10px">
      سجّلتَ ${ar(S.flags.length)} ملاحظة على أسئلة — تُرفَق تلقائيًّا.</p>` : ''}
  </div>
  ${!isStandalone() ? `<div class="group"><div class="group-h"><span class="t">تثبيت على الجهاز</span></div>
    <p class="note">${isIOS()
      ? 'من متصفّح سفاري: اضغط زرّ المشاركة ⇧ ثم «إضافة إلى الشاشة الرئيسية».'
      : 'يعمل كتطبيق كامل بلا متصفّح، ويشتغل بلا إنترنت.'}</p>
    ${(!isIOS() && deferredPrompt) ? `<button class="btn" style="margin-top:11px" data-act="installApp">ثبّت الآن</button>` : ''}
  </div>` : ''}
` : ''}
${S.setTab===4 ? `
  <div class="abt">
    <div class="abmark">${markSVG(48)}</div>
    <h2 class="abn">أُفق</h2>
    <p class="abv">النسخة ${APP_VERSION.split('.').map(x=>ar(x)).join('٫')} · ${ar(mySkills().length)} مهارة في مسارك</p>
    <p class="abv" style="margin-top:5px">آخر تحديث ${esc(APP_DATE)}</p>
    <p class="abd">تدريبٌ يوميّ قصير على اختبارات القدرات والتحصيلي وستيب.
      بُني على فكرة واحدة: <b>الاستمرار قبل الكمّية</b> — عشر دقائق كلّ يوم
      تفعل ما لا تفعله عشر ساعات في يوم واحد.</p>
  </div>
  
  
  
  <div class="group"><div class="group-h"><span class="t">ما يميّزه</span></div>
    <div class="card">
      <div class="kv"><span>السلسلة تُجمَّد ولا تُصفَّر</span><span class="v">انقطاعك لا يمحو ما بنيت</span></div>
      <div class="kv"><span>الجلسة تعرف متى تتوقّف</span><span class="v">ثلاثة أخطاء = يكفي اليوم</span></div>
      <div class="kv"><span>لا مقارنة بغيرك</span><span class="v">لا لوحات صدارة ولا ترتيب</span></div>
      <div class="kv" style="border:0"><span>لا وعود بالاختصار</span><span class="v">لا طريق قصيرًا يُباع لك</span></div>
    </div>
  </div><div class="group"><div class="group-h"><span class="t">خصوصيّتك</span></div>
    <div class="card"><p class="note" style="padding:0">كلّ تقدّمك محفوظ <b>على جهازك وحده</b>.
      لا خادم، ولا حساب، ولا بيانات تُرسل إلى أيّ جهة — ولا إلينا.
      مسحُ بيانات المتصفّح يمسح تقدّمك، فثبّت التطبيق لتحفظه.</p></div>
  </div><div class="group"><div class="group-h"><span class="t">المصادر</span></div>
    <div class="card"><p class="note" style="padding:0">الأسئلة مؤلَّفة أصلًا على المواصفات المعلَنة
      لاختبارات هيئة تقويم التعليم والتدريب. وما استُعين به من مراجع فللمعايرة
      — للأسلوب والصعوبة والتوزيع — لا للنقل.</p></div>
  </div><div class="group"><div class="group-h"><span class="t">شروط الاستعمال</span></div>
    <div class="card"><p class="note" style="padding:0">
      أُفق للاستعمال الشخصيّ للطالب وحده. لا يجوز نسخ أسئلته ولا مفاتيح الحلّ
      ولا إعادة نشرها ولا استعمالها في منتج آخر — كلًّا أو جزءًا — بلا إذن خطّيّ مسبق.
      وأيّ تدريس جماعيّ أو تجاريّ يحتاج ترخيصًا.
    </p></div>
  </div>
  <div class="credit">
    <div class="crm">© ${ar(new Date().getFullYear())}${hijriYear() ? ` · ${ar(hijriYear())}هـ` : ''} عرفات الراجحي</div>
    <div class="crs">Arafat AlRajhi · جميع الحقوق محفوظة</div>
    <div class="crs">أداة تعليمية — غير تابعة لهيئة تقويم التعليم والتدريب ولا معتمدة منها</div>
  </div>
` : ''}
${(S.setTab===6 && (S.devTab||0)===2) ? `
  <div class="group"><div class="group-h"><span class="t">نسخة احتياطية</span></div>
    <div class="card">
      <p class="note" style="padding:0 0 12px">تقدّمك محفوظ في متصفّح هذا الجهاز وحده.
        مسحُ بيانات المتصفّح يمحوه. احفظ نسخة كل أسبوع، أو قبل تغيير الجهاز.</p>
      <div class="kv"><span>ما لديك الآن</span>
        <span class="v">${ar(S.sessionCount || 0)} جلسة · ${ar((S.review || []).length)} خطأ · ${ar((S.seenLessons || []).length)} مفتاحًا</span></div>
      <div class="kv"><span>آخر نسخة حفظتَها</span>
        <span class="v">${S.lastBackup ? esc(S.lastBackup) : 'لم تحفظ بعد'}</span></div>
      <button class="btn" style="margin-top:12px" data-act="exportState">احفظ نسخة الآن</button>
      <button class="btn ghost" data-act="importState">استعد من نسخة</button>
    </div>
  </div>
  <div class="group"><div class="group-h"><span class="t">رحلة التفكير</span></div>
    <div class="card">
      <div class="kv" style="border:0;padding:0 0 10px">
        <span>مفاتيح قرأتَها</span>
        <span class="v num">${ar((S.seenLessons || []).length)} من ${ar(Object.keys(LESSONS.lessons).length)}</span>
      </div>
      <button class="btn ghost" data-act="resetJourney">صفّر الرحلة وابدأ من أوّلها</button>
      <p class="note" style="padding-top:8px">يمحو ما قُرئ من المفاتيح فقط.
        لا يمسّ أسئلتك ولا أخطاءك ولا تقدّمك في المهارات.</p>
    </div>
  </div>

  <div class="group danger"><div class="group-h"><span class="t">مسح كل شيء</span></div>
    <div class="card">
      <p class="note" style="padding:0 0 12px">يمحو تقدّمك كلَّه من هذا الجهاز:
        أيّامك وسلسلتك وأخطاءك وإتقانك ودوراتك. ويعود أُفق كأنك تفتحه لأول مرّة.</p>
      <p class="note" style="padding:0 0 14px;color:var(--near)">احفظ نسخةً أولًا إن أردتَ العودة إليها يومًا.</p>
      <button class="btn danger" data-act="wipeAsk">امسح كل بياناتي</button>
    </div>
  </div>

  <div class="group"><div class="group-h"><span class="t">أفق ليس كل استعدادك</span></div>
    <p class="note" style="margin-bottom:10px">أفق يضمن ألّا يمرّ يوم بلا تدريب، ويتتبّع أخطاءك.
      لكن التأسيس والشرح المطوّل مكانهما خارجه:</p>
    <div class="card">
      <div class="kv"><span>تأسيس الكمي</span><span class="v">كتاب المعاصر</span></div>
      <div class="kv"><span>تدريب وتجميعات</span><span class="v">دورات متخصصة</span></div>
      <div class="kv"><span>اللفظي</span><span class="v">تدريب مباشر بلا تأسيس</span></div>
      <div class="kv"><span>التجميعات</span><span class="v">أسئلة السنوات الماضية</span></div>
    </div>
  </div>
  <div class="group" style="margin-top:14px"><div class="group-h"><span class="t">الخروج من المسار</span></div>
    <p class="note" style="margin-bottom:12px">أنت الآن في منصّة ${esc(TRACKS[S.track].name)} وحدها.
      تقدّمك فيها محفوظ، وسيبقى كما هو إن خرجتَ وعدتَ.</p>
    <button class="btn ghost" data-act="leaveTrack">الخروج إلى اختيار الاختبار</button>
  </div>
` : ''}
      <button data-act="reset">تصفير</button>
    </div>
    <p class="note" style="margin-top:10px">تقديم الأيام يُظهر أثر شرط التباعد الزمني في الإتقان، وحصانة الاستئناف بعد الانقطاع.</p>
`;

}

const SCREENS = {



/* ══════════ تأكيد المسح ══════════ */
wipe: () => {
  const two = S.wipeStep === 2;
  return `<div class="lwrap wipe">
    <div class="wicon">${two ? '⚠' : '🗑'}</div>
    <h2 class="wt">${two ? 'تأكيد أخير' : 'مسح كل بياناتك'}</h2>
    <p class="ws">${two
      ? 'لا رجعة بعد هذه الخطوة. سيبدأ أُفق فارغًا كأنك تفتحه لأول مرّة.'
      : 'سيُمحى تقدّمك كلّه من هذا الجهاز ولا يمكن استرجاعه إلا من نسخةٍ حفظتَها.'}</p>
    <div class="wlist">
      ${[['يومك', ar(S.day || 1)], ['جلساتك', ar(S.sessionCount || 0)],
         ['سلسلتك', ar(S.streak || 0) + ' يومًا'],
         ['أخطاؤك المحفوظة', ar((S.review || []).length)]]
        .map(([k, v]) => `<div class="wrow"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
    </div>
    ${!two ? '<p class="wnote">احفظ نسخةً من الإعدادات قبل المسح إن أردتَ العودة إليها.</p>' : ''}
    <button class="btn danger" data-act="wipeConfirm">${two ? 'نعم، امسح كل شيء' : 'متابعة'}</button>
    <button class="skipl" data-act="wipeCancel">رجوع — لا تمسح شيئًا</button>
  </div>`;
},

/* ══════════ الهدف ══════════ */
goal: () => {
  const g = myGoal();
  return `<div class="lwrap">
    <div class="chead">
      <button class="back" data-go="home">‹ الرئيسة</button>
      <div class="ctitle">ما الدرجة التي تريدها؟</div>
      <div class="csub">لتعرف كم يفصلك عنها في كل دورة</div>
    </div>
    <div class="gpick">
      ${GOALS.map(x => `<button class="gopt ${x.v === g ? 'on' : ''}" data-act="setGoal" data-arg="${x.v}">
        <div class="gnum">${ar(x.v)}</div>
        <div class="gname">${esc(x.t)}</div>
        <div class="gwhy">${esc(x.w)}</div>
      </button>`).join('')}
    </div>
    <p class="gfoot">يمكنك تغييره متى شئت من الإعدادات.</p>
    <button class="btn" data-go="home">تمام</button>
  </div>`;
},

/* ══════════ افتتاح الدورة ══════════ */
copen: () => {
  const c = S.course;
  if (!c) return SCREENS.home();
  const prev = (S.courses || []).slice(-1)[0];
  const carried = prev ? (c.skills || []).filter(id =>
    (prev.skills || []).some(x => x.id === id && x.acc < 65)) : [];
  return `<div class="lwrap copen">
    <div class="cohead">
      <div class="coring">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" class="cobg"/>
          <circle cx="60" cy="60" r="50" class="cofg" stroke-dasharray="0 314"/>
        </svg>
        <div class="conum">${ar(c.round || 1)}</div>
      </div>
      <h2 class="cot">دورتك ${ar(c.round || 1)}</h2>
      <p class="cos">أسبوعان · أربع عشرة محطّة · ${ar((c.skills || []).length)} مهارات</p>
    </div>
    ${journeyStrip()}
    <div class="colbl">ستعمل على</div>
    ${(c.skills || []).map((id, i) => {
      const carry = carried.includes(id);
      return `<div class="coskill ${carry ? 'carry' : ''}">
        <div class="con">${ar(i + 1)}</div>
        <div><b>${esc(SKILLS[id] ? SKILLS[id].name : id)}</b>
          ${carry ? '<span>جاءت من ضعفك في الدورة السابقة</span>' : ''}</div>
      </div>`;
    }).join('')}
    ${carried.length ? `<div class="conote">
      <b>${ar(carried.length)} منها</b> اخترناها لك لأنها كانت أضعف ما عندك. فضعفُ أمسِ صار موضوع اليوم.
    </div>` : ''}
    <button class="btn" data-go="course">ابدأ الدورة ›</button>
  </div>`;
},

/* ══════════ مسار الدورة ══════════ */
course: () => {
  const c = S.course;
  if (!c) return SCREENS.home();
  const map = c.map || [];
  const pct = Math.round(100 * Math.min(c.at, map.length) / map.length);
  return `<div class="lwrap">
    <div class="chead">
      <button class="back" data-go="home">‹ الرئيسة</button>
      <div class="ctitle">دورتك — ${esc(c.part === 'quant' ? 'القسم الكمّيّ' : c.part === 'verbal' ? 'القسم اللفظيّ' : 'أسبوعان')}</div>
      <div class="csub">${ar(Math.min(c.at, map.length))} من ${ar(map.length)} محطّة · الدورة ${ar(c.round || 1)}</div>
      <div class="cbar"><i style="width:${pct}%"></i></div>
    </div>
    ${journeyStrip()}
    <ol class="path">
      ${map.map((st, i) => {
        const k = stationState(i);
        const done = k === 'done', now = k === 'now';
        const res = (c.log || []).find(e => e.at === i);
        return `<li class="stn ${k}">
          <div class="sdot">${done ? '✓' : now ? ar(i + 1) : '🔒'}</div>
          <div class="sbody">
            <div class="sname">${esc(st.label)}${st.skill ? ` · ${esc(SKILLS[st.skill].name)}` : ''}</div>
            <div class="swhy">${now ? esc(st.why) : done && res && res.total
              ? `${ar(res.right)} من ${ar(res.total)}` : esc(st.why)}</div>
            ${now ? '<button class="btn sgo" data-act="runStation">ابدأ هذه المحطّة ›</button>' : ''}
          </div>
        </li>`;
      }).join('')}
    </ol>
    ${c.finished ? '<button class="btn" data-go="creport">اعرض تقرير الدورة ›</button>' : ''}
  </div>`;
},

/* ══════════ تقرير الدورة ══════════ */
creport: () => {
  const R = courseReport();
  if (!R) return SCREENS.home();
  const band = a => a >= 80 ? 'hi' : a >= 65 ? 'mid' : 'lo';
  const word = a => a >= 80 ? 'متينة' : a >= 65 ? 'تحتاج تثبيتًا' : 'تحتاج عملًا';
  return `<div class="lwrap rep">
    <div class="rhead">
      <div class="rring ${band(R.overall)}">
        <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="rbg"/>
          <circle cx="60" cy="60" r="52" class="rfg"
            stroke-dasharray="${(R.overall / 100 * 326.7).toFixed(1)} 326.7"/></svg>
        <div class="rnum">${ar(R.overall)}<span>٪</span></div>
      </div>
      <h2 class="rtitle">تقرير دورتك</h2>
      <p class="rsub">${esc(S.name || '')}${S.name ? ' — ' : ''}الدورة ${ar(R.round)} · ${ar(R.days)} يومًا</p>
      ${R.prevOverall != null ? `<div class="rdelta ${R.overall >= R.prevOverall ? 'up' : 'dn'}">
        ${ar(R.prevOverall)}٪ <em>←</em> ${ar(R.overall)}٪
        <b>${R.overall >= R.prevOverall ? '▲' : '▼'} ${ar(Math.abs(R.overall - R.prevOverall))}</b>
      </div>` : ''}
    </div>

    <div class="rgoal">
      ${goalRing(R.overall, R.goal, 160)}
      ${gapScene(R.overall, R.goal)}
    </div>

    ${journeyStrip()}

    <div class="rsec">
      <div class="rlbl">مهاراتك في هذه الدورة</div>
      ${R.rows.map(r => `<div class="rrow ${band(r.acc)}">
        <div class="rtop"><span class="rname">${esc(r.name)}</span>
          <span class="racc">${ar(r.acc)}٪${r.delta != null && r.delta !== 0
            ? `<em class="rd ${r.delta > 0 ? 'up' : 'dn'}">${r.delta > 0 ? '▲' : '▼'}${ar(Math.abs(r.delta))}</em>` : ''}</span></div>
        <div class="rmeter">
          ${r.prev != null ? `<u style="width:${r.prev}%"></u>` : ''}
          <i style="width:${r.acc}%"></i>
        </div>
        <div class="rfoot"><span>${r.prev != null ? `كانت ${ar(r.prev)}٪` : `${ar(r.right)} من ${ar(r.total)}`}</span><span>${word(r.acc)}</span></div>
      </div>`).join('')}
    </div>

    ${R.strong.length ? `<div class="rcard good">
      <div class="rct">نقاط قوّتك</div>
      <p>${R.strong.map(r => esc(r.name)).join(' · ')}</p>
      <div class="rnote">أتقنتَها في هذه الدورة. لا تُنفِق عليها وقتًا كثيرًا في القادمة.</div>
    </div>` : ''}

    ${R.weak.length ? `<div class="rcard warn">
      <div class="rct">ما يحتاج عملًا</div>
      <p>${R.weak.map(r => esc(r.name)).join(' · ')}</p>
      <div class="rnote">ابدأ دورتك القادمة بها، واقرأ مفاتيحها قبل التدريب.</div>
    </div>` : ''}

    ${R.ideas.length ? `<div class="rsec">
      <div class="rlbl">أفكار تحتاج إعادتها</div>
      ${R.ideas.map(x => `<div class="ridea">
        <div class="ritag">${esc(x.skill)}</div>
        <p>${esc(x.text)}</p></div>`).join('')}
    </div>` : ''}

    <div class="ract">
      <button class="btn wa" data-act="shareReport">شارِك التقرير مع والديك</button>
      <button class="btn ghost" data-act="copyReport">${S.copied ? 'نُسخ ✓' : 'انسخ النصّ'}</button>
      <button class="btn ghost" data-act="repeatCourse">أعِد هذه الدورة</button>
      <button class="skipl" data-act="seenReport">تمام — إلى الرئيسة</button>
    </div>
  </div>`;
},


name: () => `<div class="namewrap">
  <div class="namelogo"><span id="markTap" style="cursor:pointer">${markSVG(50)}</span></div>
  <div class="eyebrow" style="text-align:center">أفق</div>
  <h1 style="text-align:center;margin-top:8px">ما اسمك؟</h1>
  <p class="soft" style="text-align:center;margin-top:10px">اسمك الأول يكفي.</p>
  <input id="nameIn" class="namefield" type="text" inputmode="text"
    autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false"
    enterkeyhint="go" placeholder="اكتب اسمك هنا" value="${esc(S.name || '')}">
  <p class="faint" id="nameHint" style="margin-top:10px;min-height:18px;text-align:center">
    تستطيع إضافة اسم العائلة إن أحببت.</p>
  <button class="btn namebtn" data-act="saveName">تابِع</button>
  <button class="btn ghost" data-act="skipName">تخطّي — ادخل بلا اسم</button>
</div>`,

pick: () => `<div class="center">
  <div class="top" style="padding:0"><span class="eyebrow" style="margin:0">أفق</span>
    <button class="iconbtn" data-act="openTheme" aria-label="المظهر">◐</button></div>
  <div style="margin-top:14px">
    <h1 style="font-size:26px">أهلًا ${esc(firstName())}</h1>
    <p class="soft" style="margin-top:8px">أيّ اختبار تستعدّ له؟<br>تستطيع تغييره في أيّ وقت.</p>
  </div>
  <div class="tracks">
    ${Object.values(TRACKS).filter(t => isOpenTrack(t.id)).map(t => {
      const dd = trackDays(t.id), sk = trackStreak(t.id);
      const note = dd ? `اليوم ${ar(dd + 1)}${sk > 1 ? ` · ${ar(sk)} متتابعة` : ''}` : 'لم يبدأ بعد';
      return `<button class="tcard ${S.track === t.id ? 'sel' : ''} ${dd ? 'started' : ''}"
      data-act="chooseTrack" data-arg="${t.id}" style="--a:${t.accent};--at:${t.tint}">
      <span class="ic">${trackGlyph(t.id, 30)}</span>
      <span class="tx"><span class="nm">${esc(t.name)}</span>
      <span class="tg">${esc(t.tag)}</span></span>
      <span class="st">${note}</span></button>`; }).join('')}
  </div>
  <div class="spacer" style="min-height:10px"></div>
</div>`,

welcome: () => {
  const t = TRACKS[S.track];
  return `<div class="center">
  <div class="top" style="padding:0"><button class="back" data-go="pick">رجوع ›</button>
    <button class="iconbtn" data-act="openTheme" aria-label="المظهر">◐</button></div>
  <div class="wglyph">${trackGlyph(S.track, 46)}</div>
  <h1 style="text-align:center;font-size:27px;margin-top:14px">${esc(t.journey)}</h1>
  <p class="wmotto">${esc(t.motto)}</p>
  <div class="spacer"></div>
  <button class="btn" data-act="startDiag">ابدأ — ${ar(12)} سؤالًا نعرف بها مستواك</button>
  <button class="btn ghost" data-act="startIntro">أوّلًا: عرّفني بالاختبار</button>
</div>`;
},

diag: () => {
  const d = S.diag;
  if (!d.seq[d.idx]) {
    const pick = pool(d.plan[d.idx], d.diff, new Set(d.seq), true);
    d.seq[d.idx] = pick ? pick.id : pool(d.plan[d.idx], d.diff, new Set(), true).id;
  }
  const q = byQ(d.seq[d.idx]);
  return `<div class="dots">${d.plan.map((_, i) =>
    `<span class="dot ${i < d.idx ? 'on' : i === d.idx ? 'now' : ''}"></span>`).join('')}</div>
  <div class="skilltag">تشخيص</div>
  ${stemView(q)}
  ${q.choices.map((c, i) => `<button class="choice" data-act="diagAns" data-arg="${i}">${esc(c.t)}</button>`).join('')}`;
},

diagResult: () => {
  const d = S.diag;
  const ranked = Object.entries(d.scores).map(([id, v]) => ({ id, name: SKILLS[id].name, r: v.c / v.n }))
    .sort((a, b) => b.r - a.r);
  const strong = ranked.slice(0, 2), start = ranked.slice(-2).reverse();
  const lvl = d.correct / d.plan.length;
  const line = lvl >= 0.7 ? 'أنت في وضع جيد — تبدأ من المرحلة الأولى بثقة.'
    : lvl >= 0.4 ? 'لستَ في نقطة الصفر — تبدأ من المرحلة الأولى.'
    : 'البداية من الأساسيات، وهذا طبيعي تمامًا.';
  return `<div class="top"></div>
  <h1>${line}<br><span class="soft" style="font-size:19px">ومعك ${ar(S.examDays)} يومًا.</span></h1>
  <div class="glass" style="margin-top:20px;padding-top:8px">
    ${horizonSVG()}
    <hr class="rule" style="margin:6px 0 18px">
    <div class="eyebrow" style="margin-bottom:7px">أقوى ما ظهر</div>
    <p>${strong.map(s => esc(s.name)).join('، ')}</p>
    <hr class="rule" style="margin:14px 0">
    <div class="eyebrow" style="margin-bottom:7px">تبدأ من</div>
    <p>${start.map(s => esc(s.name)).join('، ')}</p>
    <hr class="rule" style="margin:14px 0 10px">
    <p class="note">صورة مبدئية من ${ar(12)} سؤالًا — تدقّ خلال أسبوعك الأول مع كل جلسة.</p>
  </div>
  <div class="dr-go">
    <button class="btn" data-act="toSave">ابدأ جلستك الأولى ←</button>
    <button class="skipl" data-act="share">شارك خريطتك</button>
  </div>`;
},



pending: () => {
  const t = TRACKS[S.track];
  const total = mySkills().length;
  return `<div class="top"><button class="back" data-go="welcome">رجوع ›</button></div>
  <div class="eyebrow">مسار ${esc(t.name)}</div>
  <h1>الخريطة جاهزة — والأسئلة قيد الإعداد</h1>
  <p class="soft" style="margin-top:12px">حدّدنا ${ar(total)} مهارة في هذا المسار وبنينا ترتيبها.
    لن نعرض عليك أسئلة قبل أن يراجعها مختص.</p>
  <div class="glass" style="margin-top:20px;padding:10px 18px 16px">${horizonSVG()}</div>
  ${trackStages(S.track).map(st => `<div class="group" style="margin-top:18px">
    <div class="group-h"><span class="t">${esc(st.name)}</span></div>
    ${st.domains.map(dm => `<div class="srow"><span class="pip build"></span>${esc(dm.name)}
      <span class="meta">${ar(dm.skills.length)} مهارات</span></div>`).join('')}</div>`).join('')}
  <div class="spacer" style="min-height:24px"></div>
  <button class="btn" data-act="backQudurat">جرّب مسار القدرات الآن</button>`;
},


report: () => {
  const r = weekReport(), acts = parentActions();
  const col = r.tone === 'good' ? 'var(--grow)' : r.tone === 'mid' ? 'var(--near)' : '#C79191';
  const stuck = mySkills().filter(s => { const st = S.skills[s.id];
    return st.status === 'building' && st.stuckSince !== null && (S.day - st.stuckSince) > 10; });
  return `<div class="top"><button class="back" data-go="settings">رجوع ›</button>
    <span class="eyebrow" style="margin:0">تقرير الأسبوع</span></div>
  <div class="glass">
    <div class="eyebrow">الحالة</div>
    <h2 style="color:${col}">${esc(r.state)}</h2>
    <hr class="rule" style="margin:16px 0">
    <div style="display:flex;gap:26px;align-items:baseline">
      <div><div class="big num" style="font-size:30px">${ar(r.days)}</div>
        <div class="faint">أيام نشاط</div></div>
      <div><div class="big num" style="font-size:30px">${ar(r.rhythm)}</div>
        <div class="faint">المستهدف</div></div>
      <div><div class="big num" style="font-size:30px">${ar(r.built.length)}</div>
        <div class="faint">مهارات مكتملة</div></div>
    </div>
  </div>

  <div class="group"><div class="group-h"><span class="t">كيف تدعمه هذا الأسبوع</span></div>
    ${acts.map(a => `<div class="tip" style="margin:0 0 10px">
      <div class="t">${esc(a.t)}</div><div class="b">${esc(a.b)}</div></div>`).join('')}
  </div>

  ${stuck.length ? `<div class="group"><div class="group-h"><span class="t">يحتاج وقتًا أطول</span></div>
    ${stuck.map(s => `<div class="srow"><span class="pip build"></span>${esc(s.name)}
      <span class="meta">منذ ${ar(S.day - S.skills[s.id].stuckSince)} يومًا</span></div>`).join('')}</div>` : ''}

  ${r.built.length ? `<div class="group"><div class="group-h"><span class="t">ما أنجزه</span>
    <span class="n num">${ar(r.built.length)}</span></div>
    ${r.built.map(s => `<div class="srow"><span class="pip built"></span>${esc(s.name)}</div>`).join('')}</div>` : ''}

  <div class="group"><div class="group-h"><span class="t">يعمل الآن على</span></div>
    <div class="srow"><span class="pip near"></span>${esc(r.active || '—')}
      <span class="meta">${esc(r.weeks)} حتى الاختبار</span></div></div>

  <hr class="rule">
  <p class="note">التقرير يعرض ما تستطيع مساعدته فيه — لا درجاته ولا أخطاءه.
    الطالب الذي يعرف أن كل خطأ يُنقل يبدأ بتجنّب الصعب، فيصلك تقرير جميل عن طالب لا يتعلّم.</p>
  <div style="margin-top:18px"><button class="btn" data-act="sendReport">إرسال إلى ولي الأمر</button></div>`;
},


intro: () => {
  const i = S.introIdx || 0;
  const cards = (LESSONS.intros && LESSONS.intros[S.track]) || LESSONS.intro;
  const c = cards[i];
  const last = i === cards.length - 1;
  return `<div class="center">
    <div class="top" style="padding:0"><span class="eyebrow" style="margin:0">${esc(TRACKS[S.track].journey)}</span>
      <span class="faint num">${ar(i+1)} / ${ar(cards.length)}</span></div>
    <div class="icard">
      <span class="ic-n">${ar(i+1)}</span>
      <h1 class="ic-t">${esc(c.t)}</h1>
      <p class="ic-b">${esc(c.b)}</p>
      ${c.k ? `<div class="ic-k"><span class="ic-q">”</span>${esc(c.k)}</div>` : ''}
    </div>
    <div class="spacer"></div>
    <button class="btn" data-act="introNext">${last ? `ابدأ — ${ar(12)} سؤالًا نعرف بها مستواك` : 'التالي'}</button>
    ${i ? `<button class="btn ghost" data-act="introBack">رجوع</button>`
        : `<button class="btn ghost" data-act="skipIntro">تجاوز</button>`}
  </div>`;
},

lesson: () => {
  const id = S.lessonFor, L = LESSONS.lessons[id];
  if (!L) { return SCREENS.home(); }
  const bold = t => String(t == null ? '' : t).replace(/\*\*(.+?)\*\*/g, (m, x) => '<b>' + esc(x) + '</b>');
  const DISP = L.disp || L.name;
  const picked = (S.exPickFor === id && S.exPick != null);
  const right = L.exAns;
  const hasEx = !!(L.ex && L.exOpts && L.exOpts.length);

  /* ══ المشهد الأول: جرّب — لا شرح قبل المحاولة ══ */
  if (!picked && hasEx) {
    return `<div class="lwrap key2">
      <div class="k2top">
        <button class="back" data-go="${S.lessonFrom === 'home' ? 'home' : 'learn'}">‹ رجوع</button>
        <div class="k2e">مفتاح</div>
        <div class="k2t">${esc(DISP)}</div>
      </div>
      <div class="k2q">${esc(L.ex)}</div>
      <div class="k2ops">
        ${L.exOpts.map((o, k) => `<button class="k2o" data-act="exPick" data-arg="${k}"
          style="--d:${60 + k * 70}ms">${esc(o)}</button>`).join('')}
      </div>
      <div class="k2hint">جرّب أولًا — ثمّ ينكشف المفتاح</div>
    </div>`;
  }

  /* ══ المشهد الثاني: الانكشاف — شاشةٌ واحدة بتبويبات، بلا تمرير ══ */
  const ok = picked && S.exPick === right;
  const chosen = picked ? (L.exOpts || [])[S.exPick] : null;
  const steps = (L.steps || []).map(x => `<li>${bold(x)}</li>`).join('');
  const drill = (L.drill || []).map(x => `<li>${bold(x)}</li>`).join('');
  const con = L.contrast || [];

  const TABS = [];
  TABS.push(['المفتاح', `
    <div class="k2card">
      <div class="k2cl">احفظ هذه</div>
      <div class="k2ct">${bold(L.key || L.what || L.name)}</div>
      ${L.card ? `<div class="k2cc">${esc(L.card)}</div>` : ''}
      ${listenBtn((L.card || '') + '. ' + (L.key || ''), 'card')}
    </div>`]);
  if (steps) TABS.push(['لماذا', `<ol class="k2l big">${steps}</ol>`]);
  if (L.trap || con.length >= 2) TABS.push(['الفخّ', `
    ${L.trap ? `<div class="k2b trap"><p>${bold(L.trap)}</p></div>` : ''}
    ${con.length >= 2 ? `<div class="k2face">
      <div class="k2f bad"><div class="k2fl">يسقط</div><p>${bold(con[0])}</p></div>
      <div class="k2f good"><div class="k2fl">يثبت</div><p>${bold(con[1])}</p></div>
    </div>` : ''}`]);
  if (drill) TABS.push(['الطريقة', `<ol class="k2l big">${drill}</ol>`]);

  const kt = Math.min(S.k2tab || 0, TABS.length - 1);

  return `<div class="lwrap key2 rev">
    <div class="k2top slim">
      <button class="back" data-go="${S.lessonFrom === 'home' ? 'home' : 'learn'}">‹ رجوع</button>
      <div class="k2e">مفتاح</div>
      <div class="k2t">${esc(DISP)}</div>
    </div>

    ${hasEx ? `<div class="k2res ${ok ? 'ok' : 'no'}">
      <span class="k2m">${ok ? '✓' : '✕'}</span>
      <div>
        <b>${ok ? 'أصبتَ' : 'اخترتَ ' + esc(chosen || '')}</b>
        <span>${esc((L.exOpts || [])[right] || '')} هو الصواب</span>
      </div>
    </div>` : ''}

    <div class="k2tabs">
      ${TABS.map(([n], k) => `<button class="k2tb ${k === kt ? 'on' : ''}"
        data-act="k2tab" data-arg="${k}">${esc(n)}</button>`).join('')}
    </div>

    <div class="k2pane" key="${kt}">${TABS[kt][1]}</div>

    <button class="btn k2go" data-act="drillSkill" data-arg="${esc(id)}">جرّبها على أسئلة ›</button>
  </div>`
},


log: () => {
  const h = S.history || [];
  if (!h.length) return `<div class="top"><button class="back" data-go="home">رجوع ›</button>
    <span class="eyebrow" style="margin:0">سجل الجلسات</span></div>
    <p class="soft" style="margin-top:30px">لم تكتمل جلسة بعد. أنهِ جلسة ثم عد إلى هنا.</p>`;
  const open = S.logOpen;
  return `<div class="top"><button class="back" data-go="home">رجوع ›</button>
    <span class="eyebrow" style="margin:0">سجل الجلسات</span></div>
  <p class="note" style="margin-bottom:14px">لأغراض المراجعة والتطوير — يُحذف مع لوحة المعاينة.</p>
  ${h.map((s, i) => `<div class="card" style="margin-bottom:10px">
    <div class="kv" style="border:0;padding:0;cursor:pointer" data-act="logToggle" data-arg="${i}">
      <span>اليوم ${ar(s.day + 1)} — ${ar(s.right)} من ${ar(s.total)}</span>
      <span class="v num">${s.pace ? ar(s.pace) + ' ث/سؤال' : ''} ${open === i ? '▾' : '‹'}</span>
    </div>
    ${open === i ? `<hr class="rule" style="margin:12px 0">
      ${s.items.map((it, j) => `<div style="padding:9px 0;border-bottom:1px solid var(--line)">
        <div style="display:flex;gap:8px;align-items:baseline">
          <span style="color:${it.chosen === it.correct ? 'var(--grow)' : it.chosen == null ? 'var(--ink-faint)' : 'var(--near)'};font-size:13px">
            ${it.chosen === it.correct ? '✓' : it.chosen == null ? '—' : '✗'}</span>
          <span class="faint">${ar(j+1)}. ${esc(it.skill)} · صعوبة ${ar(it.d)} · ${
            it.role === 'warmup' ? 'تهيئة' : it.role === 'review' ? 'مراجعة' : it.role === 'returning' ? 'عائدة' : 'نشطة'}</span>
        </div>
        <div style="font-size:14px;line-height:1.7;margin-top:5px">${esc(it.stem.slice(0, 90))}${it.stem.length > 90 ? '…' : ''}</div>
        ${it.chosen === it.correct ? '' : `<div class="faint" style="margin-top:4px">
          اختار: ${it.chosenT ? esc(it.chosenT) : 'تخطّى'} — الصحيح: ${esc(it.correctT)}</div>`}
      </div>`).join('')}` : ''}
  </div>`).join('')}`;
},


why: () => {
  const s = S.session, item = s.items[s.idx], q = byQ(item.qid);
  const right = item.choiceIdx === q.choices.findIndex(c => c.c);
  const opts = right
    ? [['calc','حسبتُها خطوة بخطوة'],['knew','عرفتُها فورًا'],['guess','خمّنتُ ووافق']]
    : [['ask','لم أحدّد المطلوب جيدًا'],['calc','فهمتُ لكن أخطأتُ في التنفيذ'],['guess','خمّنتُ']];
  return horizonBar(s.idx, s.items.length, 'جلسة اليوم')
  + `<div class="skilltag">${esc(SKILLS[q.skill].name)}</div>
  <div class="center" style="padding:10px 0">
    <div class="eyebrow">قبل أن ترى الحل</div>
    <h2>${right ? 'كيف وصلتَ إليها؟' : 'أين تظنّ أن الخطأ حدث؟'}</h2>
    <p class="faint" style="margin-top:10px">سؤال واحد — يجعل ما بعده يثبت أكثر.</p>
    <div style="margin-top:22px">
      ${opts.map(([k, t]) => `<button class="choice" data-act="explainWhy" data-arg="${k}">${t}</button>`).join('')}
    </div>
  </div>`;
},


cards: () => {
  const cs = S.cardSess;
  if (!cs) return SCREENS.home();
  const c = cs.cards[cs.idx];
  return `<div class="dots">${cs.cards.map((_, i) =>
    `<span class="dot ${i < cs.idx ? 'on' : i === cs.idx ? 'now' : ''}"></span>`).join('')}</div>
  <div class="skilltag">${esc(SKILLS[cs.skill] ? SKILLS[cs.skill].name : 'مصطلحات')}</div>
  <div class="center" style="padding:14px 0">
    <div class="glass">
      <div class="eyebrow">المصطلح</div>
      <h1 style="margin-bottom:0">${esc(c.t)}</h1>
      ${S.cardShow ? `<hr class="rule"><p class="soft">${esc(c.d)}</p>` : ''}
    </div>
    <div class="spacer" style="min-height:26px"></div>
    ${S.cardShow
      ? `<button class="btn" data-act="cardOk">تذكّرتُها</button>
         <button class="btn ghost" data-act="cardNo">لم أتذكّر</button>`
      : `<p class="faint" style="text-align:center;margin-bottom:14px">حاول أن تستحضر المعنى قبل أن تكشف.</p>
         <button class="btn" data-act="cardFlip">اكشف</button>`}
  </div>`;
},

cardsDone: () => `<div class="center">
  <div class="glass">
    <div class="eyebrow">انتهت البطاقات</div>
    <h1>${ar(S.lastCards ? S.lastCards.right : 0)} من ${ar(S.lastCards ? S.lastCards.total : 0)}</h1>
    <p class="soft" style="margin-top:10px">ما لم تتذكّره سيعود غدًا. وما تذكّرتَه سيتباعد.</p>
  </div>
  <div class="spacer"></div>
  <button class="btn" data-go="home">تم</button>
</div>`,

plan: () => {
  const pl = buildPlan();
  return `<div class="top"></div>
  <div class="eyebrow">خطتك حتى الاختبار</div>
  <h1>${esc(pl.span)}<span class="soft" style="font-size:18px"> — إيقاع ${esc(pl.mode)}</span></h1>
  <div class="glass" style="margin-top:20px">
    <div style="display:flex;gap:22px;align-items:baseline">
      <div><div class="big num" style="font-size:34px">${ar(pl.rhythm)}</div>
        <div class="faint">جلسات أسبوعيًا</div></div>
      <div><div class="big num" style="font-size:34px">${ar(Math.round(S.size * 1.05))}</div>
        <div class="faint">دقيقة في الجلسة</div></div>
    </div>
    <hr class="rule" style="margin:18px 0">
    ${pl.stages.map((st, i) => `<div class="srow">
      <span class="pip ${i === 0 ? 'near' : 'build'}"></span>${esc(st.name)}
      <span class="meta">${ar(st.skills)} مهارات في ${ar(st.weeks)} ${st.weeks === 1 ? 'أسبوع' : 'أسابيع'}</span>
    </div>`).join('')}
  </div>
  ${(() => { const st = nextStation(); return st ? `<div class="glass" style="margin-top:14px;padding:18px 20px">
    <div class="eyebrow">محطتك القادمة</div>
    <h2>${esc(st.name)}</h2>
    <p class="soft" style="margin-top:8px">تكتمل خلال ${ar(st.days)} ${st.days === 1 ? 'يوم' : 'أيام'} تقريبًا${st.first ? ' من أول جلسة' : ''}.</p>
  </div>` : ''; })()}
  <p class="faint" style="margin-top:18px">${esc(pl.note)}</p>
  <p class="faint" style="margin-top:10px;color:var(--glow)">
    هذه الخطة تُعاد حسابها كل يوم. لا يوجد فيها «متأخر».</p>
  <div class="spacer" style="min-height:18px"></div>
  <button class="btn" data-act="saved">ابدأ جلستك الأولى</button>`;
},

save: () => `<div class="center">
  <div class="glass">
    <div class="eyebrow">خطوة واحدة</div>
    <h1>احفظ خريطتك</h1>
    <p class="soft" style="margin-top:10px">حتى تعود إليها غدًا من أي جهاز.</p>
    <hr class="rule">
    <div class="kv" style="border:0;padding:0"><span>رقم الجوال</span>
      <span class="v" dir="ltr" style="letter-spacing:.06em">05X XXX XXXX</span></div>
  </div>
  <div class="spacer"></div>
  <button class="btn" data-act="saved">حفظ</button>
  <button class="btn ghost" data-act="saved">لاحقًا</button>
</div>`,

home: () => {
  if (!S.suggestion) S.suggestion = makeSuggestion();
  const g = S.suggestion;
  /* جدار الاشتراك مطفأ حتى تُقرّر التسعير — FREE_LIMIT = 0 يعني بلا حدّ.
     لتفعيله لاحقًا: اجعله ٥ أو ما تشاء. */
  if (FREE_LIMIT > 0 && !S.paid && S.sessionCount >= FREE_LIMIT) return SCREENS.paywall();
  const doneToday = S.lastActive === S.day && (S.todayCount || 0) > 0;
  const head = `<div class="top"><span class="brand" style="color:var(--glow)">${trackGlyph(S.track, 22)}
      <span class="eyebrow" style="margin:0">${esc(TRACKS[S.track].name)}</span></span>
    <span class="topr"><span class="faint num">اليوم ${ar(S.day + 1)}</span>${dayToggle()}</span></div>`
    + auditBar() + greetCard();
  if (doneToday) return head + `
  <div class="spacer" style="flex:.4;min-height:0"></div>
  <div class="glass">
    <div class="eyebrow">اليوم</div>
    <h1 style="margin-bottom:12px">${S.todayCount === 1 ? 'أنهيتَ جلسة اليوم'
      : `${ar(S.todayCount)} جلسات اليوم`}</h1>
    <p class="soft">${S.todayCount === 1
      ? 'جلسة واحدة اليوم. والثانية أنفع من الأولى.'
      : 'التكرار هو ما يثبّت الفكرة — واصل ما دام في يومك متسع.'}</p>
    <hr class="rule" style="margin:20px 0 16px">
    <p style="color:var(--glow);font-size:14.5px">${esc(g.gain)}</p>
    ${gradeNote()}
  </div>
  ${leadCard(true)}
  ${roundsLine()}
  ${thenWhisper()}
  ${oneCard()}
  <div class="spacer" style="flex:.85;min-height:16px"></div>
  ${mySkills().some(s => (cardsBySkill[s.id] || []).length)
    ? `<button class="btn ghost" data-act="startCards">بطاقات المصطلحات ›</button>` : ''}
  ${examInvite()}
  <button class="btn ghost" data-act="endDay">اكتفيتُ اليوم</button>`;
  return head + `
  <div class="spacer" style="flex:.4;min-height:0"></div>
  <div class="glass">
    <div class="eyebrow">جلسة اليوم</div>
    <h1 style="margin-bottom:12px">${ar(g.size)} سؤالًا في ${esc(g.name)}</h1>
    <p class="soft">${esc(g.why)}</p>
    <div style="margin-top:16px"><span class="pill">${ar(g.size)} سؤالًا</span></div>
    <hr class="rule" style="margin:20px 0 16px">
    <p style="color:var(--glow);font-size:14.5px">${esc(g.gain)}</p>
  </div>
  ${leadCard()}
  ${roundsLine()}
  ${thenWhisper()}
  ${oneCard()}
  <div class="spacer" style="flex:.85;min-height:16px"></div>
  ${mySkills().some(s => (cardsBySkill[s.id] || []).length)
    ? `<button class="btn ghost" data-act="startCards">بطاقات المصطلحات ›</button>` : ''}
  ${examInvite()}`;
},

learn: () => {
  const list = pathList(), seen = S.seenLessons || [];
  const pd = pathDone(), nx = pathNext();
  const rest = mySkills().filter(x => !LESSONS.lessons[x.id] && hasContent(x.id));
  const LBL = { new: '', learned: 'تعلّمتَها', mastered: 'أتقنتَها' };
  let n = 0, curStage = '';
  const rows = list.map(o => {
    n++;
    const st = skillState(o.id);
    const isNext = nx && nx.id === o.id;
    const isSeen = seen.includes(o.id);
    const head = o.stage !== curStage ? (curStage = o.stage,
      `<div class="pstage">${esc(o.stage)}</div>`) : '';
    return head + `<button class="prow ${isSeen ? 'done' : ''} ${isNext ? 'now' : ''}"
        data-act="openLesson" data-arg="${o.id}">
      <span class="pn">${isSeen ? '✓' : ar(n)}</span>
      <span class="pt"><span class="nm">${esc(SKILLS[o.id].name)}</span>
        ${isNext ? '<span class="pnow">خطوتك الآن</span>'
                 : (isSeen && st !== 'new' ? `<span class="pst">${LBL[st]}</span>` : '')}</span>
      <span class="ar">›</span></button>`;
  }).join('');
  const pct = pd.total ? Math.round(100 * pd.done / pd.total) : 0;
  return `<div class="top"><button class="back" data-go="home">رجوع ›</button>
    <span class="eyebrow" style="margin:0">${esc(TRACKS[S.track].name)}</span></div>
  <h1 style="margin-top:6px">${esc(TRACKS[S.track].journey)}</h1>
  <p class="soft" style="margin-top:9px;line-height:1.9">مفاتيح الحلّ مرتّبة كما تُبنى:
    الأساس أوّلًا، ثم ما ينبني عليه. لا تقفز — كل مفتاح يمهّد لما بعده.</p>
  ${(pd.total && pd.done === pd.total) ? `<div class="pdone">
      <div class="pd-m">${markSVG(30)}</div>
      <div class="pd-t">أتممتَ ${esc(TRACKS[S.track].journey)}</div>
      <div class="pd-b">مررتَ على ${ar(pd.total)} مفتاحًا كلها. من هنا يقودك التطبيق
        إلى ما تخطئ فيه — لا إلى ما لم تره.</div>
    </div>` : ''}
  ${pd.total ? `<div class="pbar"><div class="pb-h"><span>${ar(pd.done)} من ${ar(pd.total)} مفتاحًا</span>
      <span class="pb-n">${ar(pct)}٪</span></div>
    <div class="pb-t"><i style="width:${pct}%"></i></div></div>` : ''}
  ${list.length ? `<div class="pmap">${rows}</div>`
   : `<div class="glass" style="margin-top:18px"><p class="soft">
      مفاتيح هذا الاختبار قيد الإعداد. تدرَّب الآن، وستجدها هنا حين تكتمل.</p></div>`}
  ${rest.length ? `<div class="eyebrow" style="margin-top:24px">مهارات بلا مفتاح بعد</div>
    <div class="skmap dim">${rest.map(x =>
      `<div class="skrow soon"><span class="dot"></span><span class="nm">${esc(x.name)}</span>
       <span class="st">قريبًا</span></div>`).join('')}</div>` : ''}
  <div class="spacer" style="min-height:20px"></div>`;
},

replace: () => {
  const cur = S.suggestion.skill;
  const alts = SKILL_LIST.filter(s => hasContent(s.id) && s.id !== cur && !S.skills[s.id].paused).slice(0, 4);
  return `<div class="top"><button class="back" data-go="home">رجوع ›</button></div>
  <h2>ماذا تفضّل اليوم؟</h2>
  <p class="faint" style="margin-top:8px">اختيارك يُغيّر اقتراحات الأيام القادمة.</p>
  <div style="margin-top:22px">
    ${alts.map(s => `<button class="choice" data-act="pickSkill" data-arg="${s.id}">${esc(s.name)}
      <span class="mark">${statusLabel[S.skills[s.id].status]}</span></button>`).join('')}
  </div>
  <hr class="rule">
  <div class="eyebrow">حجم الجلسة</div>
  <div class="seg">
    ${[15, 25, 40].map(n => `<button data-act="setSize" data-arg="${n}" class="${S.size === n ? 'sel' : ''}">
      ${n === 15 ? 'يوم مزدحم' : n === 25 ? 'المعتاد' : 'مكثّفة'}<b>${ar(n)} سؤالًا</b></button>`).join('')}
  </div>`;
},

question: () => {
  const s = S.session, item = s.items[s.idx], q = byQ(item.qid);
  s.qStart = Date.now();
  const pre = item.mode === 'explain_first';
  // تنويع الإشارة: السؤال العائد يأتي بترتيب خيارات مختلف
  if (!item.order) {
    item.order = q.choices.map((_, k) => k);
    if (item.role === 'review') {
      for (let k = item.order.length - 1; k > 0; k--) {
        const j = Math.floor(Math.random() * (k + 1));
        [item.order[k], item.order[j]] = [item.order[j], item.order[k]];
      }
    }
  }
  return `<div class="dots">${s.items.map((_, i) =>
    `<span class="dot ${i < s.idx ? 'on' : i === s.idx ? 'now' : ''}"></span>`).join('')}</div>
  ${S.pace ? `<div class="pacebar"><i id="pacefill"></i></div>` : ''}
  ${sessionRail()}
  <div class="skilltag">${esc(SKILLS[q.skill].name)}${
    ''}</div>
  ${S.track === 'qudurat' ? `<div class="parttag">القسم ${esc(PART_NAME[s.part || partOf(q.skill)])}</div>` : ''}
  ${pre ? `<div class="diag" style="margin-top:14px">${esc(q.steps[0])} — تذكير سريع قبل السؤال</div>` : ''}
  ${roleNote(item, s)}
  ${item.role === 'duel' ? `<div class="duelpre"><span class="dmark">✦</span>هذا السؤال هزمك مرّتين.<span>مضى عليه أسبوعان. جرّبه الآن.</span></div>` : ''}
  ${q.passage && PASSAGES[q.passage] ? (() => {
      const ps = PASSAGES[q.passage];
      return `<div class="passage${S.passOpen === false ? ' folded' : ''}">
        <button class="p-head" data-act="togglePassage">
          <span>${esc(ps.title)}</span>
          <span class="faint">${S.passOpen === false ? 'إظهار النص ›' : 'إخفاء النص'}</span>
        </button>
        ${S.passOpen === false ? '' : ps.paras.map((t, i) =>
          `<p class="p-para"><b>(${ar(i+1)})</b> ${esc(t)}</p>`).join('')}
      </div>`;
    })() : ''}
  ${listenPane(q, item)}
  ${q.fig ? `<figure class="fig-wrap">${q.fig}</figure>` : ''}
  ${q.img && !q.fig ? `<figure class="qimg"><img src="${q.img}" alt="" loading="lazy"></figure>` : ''}
  ${stemView(q)}
  ${item.fade && item.fade <= 2 ? (() => {
      const show = q.steps.slice(0, Math.max(0, q.steps.length - item.fade));
      return `<div class="faded">
        <div class="lbl">الخطوات — أكمِل ما نقص</div>
        ${show.map(s => `<div class="st">${esc(s)}</div>`).join('')}
        ${Array.from({length: item.fade}, () => `<div class="st blank"></div>`).join('')}
      </div>`;
    })() : ''}
  ${item.order.map((i, n) => `<button class="choice pop${isLTR(q.choices[i].t) ? ' ltr' : ''}" style="--d:${70 + n * 65}ms" data-act="answer" data-arg="${i}">${esc(q.choices[i].t)}</button>`).join('')}
  ${qMeta(q)}
  <div style="display:flex;justify-content:flex-end;margin-top:6px"><button class="btn ghost"
    style="width:auto;padding:12px 2px;font-size:13px;opacity:.75" data-act="skip">تخطّي</button></div>`;
},

explain: () => {
  const s = S.session, item = s.items[s.idx], q = byQ(item.qid);
  SPEAK.stop();
  /* نصّ الاستماع لا يُرى قبل الإجابة، ويُرى بعدها ليُقارَن بما سُمع */
  const heard = q.listen ? `<div class="listen script">
      <div class="lbl">ما سمعتَه</div>
      <p class="p-para ltr">${esc(q.listen)}</p>
    </div>` : '';
  const correctIdx = q.choices.findIndex(c => c.c);
  const chosen = item.choiceIdx;
  const right = chosen === correctIdx;
  const note = (!right && chosen != null) ? q.choices[chosen].note : null;
  const flagged = (S.flags || []).some(f => f.id === q.id);
  const T = [];
  T.push([right ? 'أحسنت' : 'الجواب', `
    ${q.fig ? `<figure class="fig-wrap sm">${q.fig}</figure>` : ''}
    ${q.img && !q.fig ? `<figure class="qimg sm"><img src="${q.img}" alt="" loading="lazy"></figure>` : ''}
    ${(!right && chosen != null) ? `<div class="choice chosen${isLTR(q.choices[chosen].t) ? ' ltr' : ''}" style="cursor:default">${esc(q.choices[chosen].t)}
      <span class="mark">اخترتَ</span></div>` : ''}
    <div class="choice right${isLTR(q.choices[correctIdx].t) ? ' ltr' : ''}" style="cursor:default">${esc(q.choices[correctIdx].t)}<span class="mark">✓</span></div>
    ${note ? `<div class="diag">${esc(note)}</div>` : ''}
    ${!right ? `<p class="faint" style="margin-top:16px">سيعود هذا في المراجعة</p>` : ''}`]);
  T.push(['الخطوات', `<ol class="steps num">${q.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`]);
  if (S.tip) T.push([S.tip.kind === 'fact' ? 'عن الاختبار' : 'مهارة', `
    <div class="tip${S.tip.kind === 'fact' ? ' fact' : ''}" style="margin-top:0">
      <div class="t">${esc(S.tip.t)}</div><div class="b">${esc(S.tip.b)}</div></div>`]);
  T.push(['السؤال', `
    <div class="qrecall">${q.stem}</div>
    ${qMeta(q)}
    ${flagged
      ? `<div class="flagged">شكرًا — سُجّل هذا السؤال للمراجعة</div>`
      : (S.flagFor === q.id
        ? `<div class="flagpick"><p class="fq">ما الملاحظة؟</p>
            <button class="fbo" data-act="flagWhy" data-arg="unclear">السؤال غير واضح</button>
            <button class="fbo" data-act="flagWhy" data-arg="dup">رأيتُ هذا السؤال من قبل</button>
            <button class="fbo" data-act="flagWhy" data-arg="wrong">أظنّ الإجابة خاطئة</button>
            <button class="fbx" data-act="flagCancel">إلغاء</button></div>`
        : `<button class="flagbtn" data-act="flagQ" data-arg="${q.id}">
          <span class="fi">؟</span>لديّ ملاحظة على السؤال</button>`)}`]);
  const cur = Math.min(S.expTab || 0, T.length - 1);
  return `<div class="lwrap">
    <div class="lbar">
      ${horizonBar(s.idx + 1, s.items.length, '')}
      <div class="exhead"><span class="skilltag" style="margin:0">${esc(SKILLS[q.skill].name)}</span>
        <span class="exmark ${right ? 'ok' : 'no'}">${right ? '✓' : '✕'}</span></div>
      <div class="ltabs">${T.map(([n], k) =>
        `<button class="lt ${k === cur ? 'on' : ''}" data-act="expTab" data-arg="${k}">${esc(n)}</button>`).join('')}</div>
    </div>
    <div class="lpane">${T[cur][1]}</div>
    ${heard}
    ${!right ? keyLink(q.skill) : ''}
    ${stopCard()}
    <div class="lfoot">
      ${cur < T.length - 1
        ? `<button class="btn ghost" data-act="expTab" data-arg="${cur + 1}">${esc(T[cur + 1][0])} ›</button>
           <button class="skipl" data-act="next">التالي ←</button>`
        : `<button class="btn" data-act="next">التالي</button>`}
    </div>
  </div>`;
},

summary: () => {
  const r = S.lastSummary;
  const pct = r.right / r.total;
  const changedName = r.changed.length ? SKILLS[r.changed[0]].name : null;
  const changedStatus = r.changed.length ? S.skills[r.changed[0]].status : null;
  let head, sub;
  if (r.resume) { head = 'عدتَ — وهذا يكفي اليوم'; sub = 'الغد يبدأ من حيث توقفت.'; }
  else if (changedName) {
    head = `${changedName} ${changedStatus === 'mastered' ? 'اكتملت' : 'تقدّمت'}`;
    sub = changedStatus === 'mastered' ? 'أصبحت ضمن ما بنيتَه.' : 'وأصبحت «تقترب» من الاكتمال.';
  } else if (pct < 0.4) {
    head = `${SKILLS[r.skill] ? SKILLS[r.skill].name : 'هذه المهارة'} تحتاج وقتًا`;
    sub = 'جلسة الغد ستبدأ أسهل.';
  } else { head = 'تقدّمتَ اليوم'; sub = `واصلت البناء في ${SKILLS[r.skill] ? SKILLS[r.skill].name : 'مهارتك'}.`; }
  const tomorrow = makeSuggestion();
  return `<div class="center" style="padding-top:18px">
    <div class="crest">
      <svg viewBox="0 0 300 108" width="100%" height="108" aria-hidden="true">
        <defs>
          <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="var(--glow)" stop-opacity=".1"/>
            <stop offset=".5" stop-color="var(--glow)" stop-opacity=".6"/>
            <stop offset="1" stop-color="var(--glow)" stop-opacity=".1"/></linearGradient>
          <radialGradient id="cg"><stop offset="0" stop-color="var(--glow)" stop-opacity=".45"/>
            <stop offset="1" stop-color="var(--glow)" stop-opacity="0"/></radialGradient>
          <clipPath id="cc"><rect x="0" y="0" width="300" height="86"/></clipPath>
        </defs>
        <g clip-path="url(#cc)">
          <circle class="cr-h" cx="150" cy="86" r="66" fill="url(#cg)"/>
          <circle class="cr-s" cx="150" cy="86" r="15" fill="var(--glow)"/>
          <g class="cr-ray" stroke="var(--glow)" stroke-width="1.6" stroke-linecap="round" opacity=".5">
            <path d="M150,42 v-13"/><path d="M186,52 l9,-9"/><path d="M114,52 l-9,-9"/>
            <path d="M203,86 h13"/><path d="M97,86 h-13"/>
          </g>
        </g>
        <path d="M18,86 Q150,72 282,86" fill="none" stroke="url(#cl)" stroke-width="2.4"
          stroke-linecap="round"/>
      </svg>
      <h1 class="cr-t">${esc(head)}</h1>
      <p class="soft cr-b">${esc(sub)}</p>
    </div>
    <div class="glass">
      <div class="sgrid">
        <div><b>${ar(r.right)}<span>/${ar(r.total)}</span></b><span>صحيحة</span></div>
        ${r.wrongQ.length ? `<div><b>${ar(r.wrongQ.length)}</b><span>للمراجعة</span></div>` : ''}
        ${r.pace ? `<div><b>${ar(r.pace)}<span>ث</span></b><span>للسؤال</span></div>` : ''}
      </div>
      ${r.pace ? `<p class="faint" style="margin-top:11px">${
        r.pace > 75 ? 'أبطأ من إيقاع الاختبار — وهو نحو دقيقة للسؤال'
        : r.pace < 25 ? 'أسرع من إيقاع الاختبار' : 'قريب من إيقاع الاختبار'}</p>` : ''}
      <hr class="rule" style="margin:14px 0 11px">
      <p class="faint">جلسة الغد: ${esc(tomorrow.name)}</p>
    </div>
    ${r.duelWon ? `<div class="duelwin"><div class="dwrays"></div>
      <div class="dwt">هزمتَه</div>
      <p class="dwb">السؤال الذي أخطأتَ فيه مرّتين — أصبتَه اليوم.</p></div>` : ''}
    ${(markWeak(r), '')}
    ${handOff()}
    ${noteComposer()}
    <div class="spacer"></div>
    <button class="btn ghost" data-act="done">اكتفيتُ اليوم</button>
    <button class="btn ghost" data-act="shareCard">شارِك بطاقة النتيجة</button>
  </div>`;
},

exam: () => {
  const e = S.exam, sp = e.spec, q = byQ(e.items[e.idx]);
  if (!q) return '<div class="center"><p class="soft">لا أسئلة كافية لهذا القسم.</p><button class="btn" data-act="examQuit">خروج</button></div>';
  const ans = e.answers[q.id];
  return `<div class="exbar"><i id="exBar"></i></div>
  <div class="extop">
    <span class="exsec">القسم ${ar(e.sec + 1)} من ${ar(sp.sections)}</span>
    <span class="exclock" id="exClock">٢٥:٠٠</span>
  </div>
  <div class="exdots">${e.items.map((id, i) =>
    `<button class="exd ${i === e.idx ? 'now' : ''} ${e.answers[id] ? 'ans' : ''}"
      data-act="examJump" data-arg="${i}" aria-label="${ar(i+1)}"></button>`).join('')}</div>
  <div class="exq">
    <div class="skilltag">${esc(SKILLS[q.skill] ? SKILLS[q.skill].name : '')}</div>
    ${q.fig ? `<figure class="fig-wrap">${q.fig}</figure>` : ''}
    ${q.passage && PASSAGES[q.passage] ? `<div class="passage">${
      PASSAGES[q.passage].paras.map((t,i)=>`<p class="p-para"><b>(${ar(i+1)})</b> ${esc(t)}</p>`).join('')}</div>` : ''}
    <p class="exstem">${esc(q.stem)}</p>
    ${q.choices.map((c, k) => `<button class="choice${ans && ans.k === k ? ' on' : ''}${isLTR(c.t) ? ' ltr' : ''}"
      data-act="examPick" data-arg="${k}">${esc(c.t)}</button>`).join('')}
  </div>
  <div class="exnav">
    <button data-act="examMove" data-arg="-1" ${e.idx === 0 ? 'disabled' : ''}>السابق</button>
    ${e.idx === e.items.length - 1
      ? `<button class="pri" data-act="examEndSec">أنهِ القسم</button>`
      : `<button class="pri" data-act="examMove" data-arg="1">التالي</button>`}
  </div>`;
},

examBreak: () => {
  const e = S.exam, last = e.secs[e.secs.length - 1];
  return `<div class="center" style="padding-top:40px">
    <div class="eyebrow">انتهى القسم ${ar(last.n)}</div>
    <h1 style="margin-top:10px">القسم ${ar(e.sec + 1)} جاهز</h1>
    <p class="soft" style="margin-top:12px">أجبتَ ${ar(last.total - last.blank)} من ${ar(last.total)}${
      last.blank ? ` وتركتَ ${ar(last.blank)} فارغًا` : ''}.</p>
    <div class="glass" style="margin-top:22px">
      <p class="faint">لا يمكنك العودة إلى قسم انتهى — كما في القاعة تمامًا.
      كلّ قسم ${ar(e.spec.mins)} دقيقة مستقلّة.</p>
    </div>
    <div class="spacer"></div>
    <button class="btn" data-act="examGo">ابدأ القسم ${ar(e.sec + 1)}</button>
    <button class="btn ghost" data-act="examQuit">أوقف المحاكاة</button>
  </div>`;
},

examDone: () => {
  const e = S.exam;
  const R = e.secs.reduce((a, s) => a + s.right, 0);
  const T = e.secs.reduce((a, s) => a + s.total, 0);
  const B = e.secs.reduce((a, s) => a + s.blank, 0);
  const worst = e.secs.slice().sort((a, b) => (a.right / a.total) - (b.right / b.total))[0];
  const rushed = e.secs.filter(s => s.blank >= 3);
  return `<div class="center" style="padding-top:26px">
    <div class="eyebrow">انتهت المحاكاة</div>
    <h1 style="margin-top:10px">${ar(R)} من ${ar(T)}</h1>
    <p class="soft" style="margin-top:10px">${esc(e.spec.name)} — ${ar(e.spec.sections)} أقسام كاملة.</p>
    <div class="glass" style="margin-top:20px">
      ${e.secs.map(s => `<div class="exrow">
        <span>القسم ${ar(s.n)}</span>
        <span class="exmini"><i style="width:${Math.round(100*s.right/s.total)}%"></i></span>
        <span class="num">${ar(s.right)}/${ar(s.total)}</span>
      </div>`).join('')}
      <hr class="rule" style="margin:14px 0 12px">
      <p class="faint">${B ? `تركتَ ${ar(B)} سؤالًا بلا إجابة — وفي الاختبار الحقيقي لا فرق بين الخطأ والفراغ، فالتخمين أفضل من الترك.` : 'لم تترك سؤالًا واحدًا فارغًا. هذا وحده مكسب.'}</p>
    </div>
    ${(S.examLog || []).length > 1 ? `<div class="glass" style="margin-top:14px">
      <div class="eyebrow">مقارنةً بما قبله</div>
      ${S.examLog.slice(-4).map(x => `<div class="exrow">
        <span>اليوم ${ar(x.day)}</span>
        <span class="exmini"><i style="width:${Math.round(100*x.right/x.total)}%"></i></span>
        <span class="num">${ar(Math.round(100*x.right/x.total))}٪</span></div>`).join('')}
    </div>` : ''}
    <div class="glass" style="margin-top:14px">
      <div class="eyebrow">ما يقوله هذا</div>
      <p class="soft" style="margin-top:8px">${
        rushed.length ? `القسم ${ar(rushed[0].n)} انتهى وقتُه قبل أسئلته — إيقاعك يحتاج ضبطًا هناك.`
        : `أنهيتَ أقسامك في وقتها. الإيقاع ليس مشكلتك.`}</p>
      <p class="soft" style="margin-top:8px">أضعف أقسامك: القسم ${ar(worst.n)} بـ${ar(worst.right)} من ${ar(worst.total)}.</p>
    </div>
    <div class="spacer"></div>
    <button class="btn" data-act="examQuit">عُد إلى التدريب</button>
  </div>`;
},

progress: () => {
  const groups = [['mastered', 'بنيتَ'], ['near', 'تقترب'], ['building', 'قيد البناء']];
  const paused = mySkills().filter(s => S.skills[s.id].paused);
  if (S.prTab == null) S.prTab = 0;
  const PT = ['التطوّر', 'الخريطة', 'الرحلة'];
  return `<div class="top backtop">
    <button class="backb" data-go="home" aria-label="رجوع">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>اليوم</span></button>
    <span class="eyebrow" style="margin:0">خريطتك</span></div>
  <div class="stabs" style="margin-bottom:14px">
    ${PT.map((n, i) => `<button class="stb ${S.prTab === i ? 'on' : ''}"
      data-act="prTab" data-arg="${i}">${n}</button>`).join('')}
  </div>
  ${S.prTab === 0 ? `
  ${vizPane()}
  ${deltaPanel()}
  ${pctUnlocked() ? `<div class="glass mtop">
    <div class="mring">${ring(overallMastery(), 76)}<span class="mrv num">${ar(overallMastery())}<em>٪</em></span></div>
    <div class="mtx"><div class="eyebrow">إتقانك الكلّي</div>
      <p class="mtw">${esc(masteryWord(overallMastery()))}</p>
      <p class="faint">يُحسب من دقّتك وثباتك عبر الأيام واتّساع ما رأيت.</p></div>
  </div>
  <button class="btn ghost" data-act="shareCard" style="margin-bottom:14px">بطاقة تقدّمك — للمشاركة</button>`
  : `<div class="glass mlock">
    <div class="mlk">${ring(0, 62)}<span class="mli">✦</span></div>
    <div class="mtx"><div class="eyebrow">إتقانك الكلّي</div>
      <p class="mtw" style="color:var(--ink)">يُفتح في آخر اليوم</p>
      <p class="faint">أنهِ جولات اليوم ثم عُد — الرقم مكافأةٌ لا مقياسٌ يُلاحَق أثناء العمل.</p></div>
  </div>`}
  ` : ''}
  ${S.prTab === 2 ? `
  <div class="glass" style="padding:10px 18px 16px">${horizonSVG(true)}
    <hr class="rule" style="margin:4px 0 14px">
    <div style="display:flex;justify-content:space-between;align-items:baseline">
      <span class="faint">${(() => { const m = mySkills().filter(s => S.skills[s.id].status === 'mastered').length;
        return m ? `${ar(m)} ${m === 1 ? 'ضوء' : 'أضواء'} في سمائك` : 'سماؤك تُضاء مع كل مهارة تكتمل'; })()}</span>
      <span class="faint num">${ar(buildPlan().rhythm)} جلسات أسبوعيًا</span>
    </div>
    ${(() => { const st = nextStation(); return st ? `<hr class="rule" style="margin:14px 0 12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span class="faint">المحطة القادمة</span>
        <span style="font-size:14px">${esc(st.name)} <span class="faint num">— ${ar(st.days)} ${st.days === 1 ? 'يوم' : 'أيام'}</span></span>
      </div>` : ''; })()}
    </div>
  ` : ''}
  ${S.prTab === 1 ? `
  ${groups.map(([k, label]) => {
    const list = mySkills().filter(s => S.skills[s.id].status === k && !S.skills[s.id].paused);
    if (!list.length) return '';
    const cls = k === 'mastered' ? 'built' : k === 'near' ? 'near' : 'build';
    return `<div class="group"><div class="group-h"><span class="t">${label}</span>
      <span class="n num">${ar(list.length)}</span></div>
      ${list.map(s => { const p = mastery(s.id), u = pctUnlocked(); return `<button class="srow mrow tap"
        data-act="drillSkill" data-arg="${esc(s.id)}">
        <span class="pip ${cls}"></span><span class="mnm">${esc(s.name)}</span>
        <span class="mbar"><i style="width:${u ? p : 0}%"></i></span>
        <span class="mpc num">${u ? ar(p) + '٪' : '—'}</span></button>`; }).join('')}</div>`;
  }).join('')}
  ${!mySkills().some(s => ['mastered','near','building'].includes(S.skills[s.id].status) && !S.skills[s.id].paused)
    ? `<p class="soft" style="margin-top:22px">خريطتك تمتلئ مع كل جلسة. ما تبنيه يظهر هنا.</p>` : ''}
  ${paused.length ? `<div class="group"><div class="group-h"><span class="t">مؤجَّلة</span>
    <span class="n num">${ar(paused.length)}</span></div>
    ${paused.map(s => `<div class="srow"><span class="pip paused"></span>${esc(s.name)}</div>`).join('')}</div>` : ''}
  ${S.tipsSeen.length ? `<div class="group"><div class="group-h"><span class="t">مهاراتك</span>
    <span class="n num">${ar(S.tipsSeen.length)}</span></div>
    ${S.tipsSeen.map(x => { const t = FACTS.concat(TIPS).find(y => y.id === x.id); return `<div class="srow">
      <span class="pip ${t.kind === 'fact' ? 'know' : 'near'}"></span>${esc(t.t)}</div>`; }).join('')}</div>` : ''}
  ` : ''}
  ${S.prTab === 2 ? `
  <hr class="rule">
  <p class="num">${S.streak === 0 ? 'تبدأ البناء اليوم'
    : ar(S.streak) + (S.streak === 1 ? ' يوم' : ' يومًا') + ' من البناء'}</p>
  <button class="btn ghost" style="text-align:right;width:auto;padding-inline-start:0"
    data-act="showExam">${S.showExam ? `${ar(Math.max(0, S.examDays - S.day))} يومًا حتى الاختبار` : 'كم بقي على الاختبار؟ ›'}</button>
  ` : ''}`;
},

errors: () => {
  const up = S.review.slice().sort((a, b) => a.due - b.due);
  const when = d => d - S.day <= 0 ? 'اليوم' : d - S.day === 1 ? 'غدًا' : `بعد ${ar(d - S.day)} أيام`;
  // تجميع بالمهارة — لا قائمة مسطّحة
  const by = {};
  up.forEach(r => { const q = byQ(r.qid); if (!q) return;
    (by[q.skill] = by[q.skill] || []).push(r); });
  const groups = Object.keys(by).sort((a, b) => by[b].length - by[a].length);
  const total = up.length;
  const done = (S.corrected || []).length;
  const rate = (total + done) ? Math.round(100 * done / (total + done)) : 0;
  const worst = groups[0];
  return `<div class="top backtop">
    <button class="backb" data-go="home" aria-label="رجوع">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>اليوم</span></button>
    <span class="eyebrow" style="margin:0">دفتر أخطائك</span></div>
  ${(total || done) ? `<div class="ebar">
    <div class="eb-r"><div class="eb-n">${ar(done)}</div><div class="eb-l">صحّحتَها</div></div>
    <div class="eb-sep"></div>
    <div class="eb-r"><div class="eb-n open">${ar(total)}</div><div class="eb-l">تنتظر</div></div>
    <div class="eb-sep"></div>
    <div class="eb-r"><div class="eb-n">${ar(rate)}٪</div><div class="eb-l">أُغلقت</div></div>
  </div>` : ''}
  ${worst ? `<div class="ehint"><span class="eh-i">◈</span>
    <div>أكثر ما يتكرّر خطؤك: <b>${esc(SKILLS[worst].name)}</b> —
      ${ar(by[worst].length)} ${by[worst].length === 1 ? 'سؤال' : 'أسئلة'}.
      ${LESSONS.lessons[worst] ? 'راجِع مفتاحه قبل أن تعود إليها.' : ''}</div>
    ${LESSONS.lessons[worst] ? `<button class="eh-b" data-act="openLesson" data-arg="${worst}">المفتاح ›</button>` : ''}
  </div>` : ''}
  ${groups.length ? groups.map(sk => {
    const rs = by[sk];
    return `<div class="egrp">
      <div class="eg-h"><span class="eg-n">${esc(SKILLS[sk].name)}</span>
        ${LESSONS.lessons[sk] ? `<button class="eg-k" data-act="openLesson" data-arg="${sk}">فكرتها ›</button>` : ''}
        <span class="eg-c num">${ar(rs.length)}</span></div>
      ${rs.map(r => { const q = byQ(r.qid);
        const soon = r.due - S.day <= 0;
        return `<div class="erow ${soon ? 'soon' : ''}">
          <span class="ed">${esc(when(r.due))}</span>
          <span class="et">${esc(q.stem.replace(/\n/g, ' · ').slice(0, 62))}…</span>
        </div>`; }).join('')}
    </div>`; }).join('')
    : `<div class="eempty"><div class="ee-m">${markSVG(34)}</div>
       <p class="soft">لا أخطاء معلّقة.</p>
       <p class="faint" style="margin-top:8px">ما تخطئ فيه يُسجَّل هنا،
         ويعود إليك في جلساتك حتى تُغلقه.</p></div>`}
  <p class="note" style="margin-top:18px">أفق يتذكّر <b>متى</b> يعيد السؤال — لا <b>إجابته</b>.
    حين يعود، حاول أن تتذكّر قبل أن تنظر. المحاولة هي ما يثبّت، لا التكرار وحده.</p>`;
},

settings: () => {
  if (!S.setRow) return settingsList();
  const T = { plan: 'ما يقرّره أُفق', exam: 'موعد اختبارك', remind: 'مواعيد التذكير',
    look: 'المظهر والصوت', share: 'المشاركة والتثبيت', data: 'بياناتك ونسختك',
    about: 'عن أُفق', dev: 'المطوّر' };
  return `<div class="top backtop sview">
    <button class="backb" data-act="closeRow" aria-label="رجوع">
      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 6l6 6-6 6" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>الإعدادات</span></button>
    <span class="eyebrow" style="margin:0">${esc(T[S.setRow] || '')}</span></div>`
    + settingsPanels();
},

paywall: () => `<div class="center"><div class="glass">
  <div class="eyebrow">أكملتَ ${ar(5)} جلسات</div>
  <h1>بنيتَ ${ar(S.streak)} ${S.streak === 1 ? 'يومًا' : 'يومًا'} و${ar(SKILL_LIST.filter(s => ['mastered', 'near'].includes(S.skills[s.id].status)).length)} مهارات.</h1>
  <p class="soft" style="margin-top:10px">أكمل حتى الاختبار.</p>
  <hr class="rule">
  <div class="kv"><span>موسم — ٣ أشهر</span><span class="v">الأكثر اختيارًا</span></div>
  <div class="kv"><span>موسمان — ٦ أشهر</span><span class="v">سعر الشهر أقل</span></div>
  </div>
  <div class="spacer"></div>
  <button class="btn" data-act="pay">اشترك</button>
  <button class="btn ghost" data-act="pay">أرسل لولي الأمر</button>
</div>`
};

/* ---------- actions ---------- */
const ACTIONS = {
  toggleHaptics: () => { S.haptics = S.haptics === false; if (S.haptics) haptic(14); render(); },
  startIntro() { S.introIdx = 0; go('intro'); },
  introNext() {
    if (S.introIdx < LESSONS.intro.length - 1) { S.introIdx++; render(); return; }
    const a = chooseActive();
    if (a && LESSONS.lessons[a.id]) { S.lessonFor = a.id; S.lessonTab = 0; go('lesson'); }
    else ACTIONS.startDiag();
  },
  introBack() { S.introIdx--; render(); },
  skipIntro() { ACTIONS.startDiag(); },
  flagQ(qid) { S.flagFor = qid; haptic(12); render(); },
  flagWhy(kind) {
    const qid = S.flagFor; if (!qid) return;
    S.flags = S.flags || [];
    if (!S.flags.some(f => f.id === qid)) {
      const q = byQ(qid);
      S.flags.push({ id: qid, day: S.day, kind: kind, skill: q ? q.skill : '',
        stem: q ? q.stem.replace(/<[^>]+>/g, ' ').slice(0, 90) : '' });
    }
    S.flagFor = null; haptic(16); render();
  },
  flagCancel() { S.flagFor = null; haptic(9); render(); },
  clearFlags() { S.flags = []; haptic(10); render(); },
  openLesson(id) {
    if (!LESSONS.lessons[id]) return;
    S.lessonFor = id; S.lessonTab = 0; S.k2tab = 0; S.exPick = null; S.exPickFor = null; S.lessonFrom = 'learn';
    if (!S.seenLessons.includes(id)) S.seenLessons.push(id);
    /* محطّة المفتاح تُنجَز بقراءته — فتُفتَح التي بعدها عند الخروج */
    const c = courseActive(), st = c && courseStation();
    if (st && st.k === 'key' && st.skill === id) S.lessonIsStation = true;
    haptic(12); go('lesson');
  },

  expTab(i) { S.expTab = +i; haptic(9); render(); },
  speak(id) {
    const L = LESSONS.lessons[S.lessonFor];
    if (!L) return;
    const M = { card: (L.card || '') + ' . ' + (L.key || ''),
                spot: (L.spot || []).join(' . '),
                drill: (L.drill || []).join(' . '),
                trap: L.trap || '',
                contrast: (L.contrast || []).join(' . '),
                ex: L.ex || '' };
    speakText(M[id] || '', id);
  },
  lessonTab(i) { S.lessonTab = +i; haptic(9); render(); },
  lessonDone() { speakStop();
    if (S.lessonFrom === 'learn') { S.lessonFrom = null; go('learn'); return; }
    S.lastWeak = null;
    if (!S.seenLessons.includes(S.lessonFor)) S.seenLessons.push(S.lessonFor);
    S.suggestion = null; S.suggestion = makeSuggestion();
    S.suggestion.skill = S.lessonFor;
    S.suggestion.name = SKILLS[S.lessonFor].name;
    ACTIONS.startSession();
  },
  startDiag() {
    if (!trackReady()) { go('pending'); return; }
    const ids = mySkills().filter(s => hasContent(s.id)).slice(0, 6).map(s => s.id);
    const plan = [];
    while (plan.length < 12) ids.forEach(id => { if (plan.length < 12) plan.push(id); });
    S.diag = { plan, seq: [], idx: 0, correct: 0, diff: 2, scores: {} };
    ids.forEach(id => S.diag.scores[id] = { c: 0, n: 0 });
    go('diag');
  },
  diagAns(i) {
    const d = S.diag, q = byQ(d.seq[d.idx]);
    const ok = !!q.choices[+i].c;
    d.diff = Math.min(5, Math.max(1, d.diff + (ok ? 1 : -1)));
    d.scores[q.skill].n++; if (ok) { d.scores[q.skill].c++; d.correct++; }
    const st = S.skills[q.skill];
    st.window.push(ok); st.first = st.first ?? 0; st.last = 0;
    if (!st.days.includes(0)) st.days.push(0);
    d.idx++;
    if (d.idx >= d.plan.length) {
      Object.keys(d.scores).forEach(id => { S.skills[id].status = 'new'; S.skills[id].window = []; S.skills[id].days = []; S.skills[id].first = null; });
      S.targetDiff = d.correct / d.plan.length >= 0.7 ? 3 : d.correct / d.plan.length >= 0.4 ? 2 : 1;
      go('diagResult');
    } else render();
  },
  share() { toast('صورة خريطتك جاهزة للمشاركة — بلا بيانات شخصية'); },
  toSave() { go('plan'); },
  backQudurat() { ACTIONS.setTrack('qudurat'); go('welcome'); },
  saveName() {
    const inp = document.getElementById('nameIn');
    const v = (inp ? inp.value : '').trim().replace(/\s+/g, ' ');
    const hint = document.getElementById('nameHint');
    if (!v) {
      if (hint) hint.textContent = 'اكتب اسمك، أو اضغط «تخطّي».';
      if (inp) { inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 420);
        try { inp.focus(); } catch (e) {} }
      haptic(24); return;
    }
    S.name = v; haptic(14); go('pick');
  },
  skipName() { S.name = S.name || 'صديقي'; haptic(12); go('pick'); },
  devTap() {
    const now = Date.now();
    S._dt = (now - (S._dt0 || 0) < 1200) ? (S._dt || 0) + 1 : 1;
    S._dt0 = now;
    if (S._dt >= 7) {
      S._dt = 0; S.devUnlocked = true; S.admin = true;
      haptic(30); S.setTab = 7; saveState(); render(); return;
    }
    if (S._dt >= 4) { S.devHint = 7 - S._dt; render(); }
  },
  devLock() {
    S.devUnlocked = false; S.admin = false; S.audit = false; S.cleanOnly = false;
    S.showParked = false; S.setTab = 4; haptic(16); saveState(); render();
  },
  devDay(n) {
    const d = +n || 0;
    S.day = Math.max(1, (S.day || 1) + d);
    S.suggestion = null; haptic(9); saveState(); render();
  },
  devFinishStation() {
    const c = courseActive(); if (!c) return;
    courseAdvance(22, 28, []); haptic(12); render();
  },
  devFinishCourse() {
    const c = courseActive(); if (!c) return;
    let g = 0;
    while (courseActive() && g++ < 20) courseAdvance(18 + (g % 9), 28, []);
    haptic(18); go('creport');
  },
  devClearCourses() { S.course = null; S.courses = []; haptic(14); saveState(); render(); },
  devParked() {
    S.showParked = !S.showParked; haptic(12);
    try { OPEN_TRACKS.length = 0;
      ['qudurat','tahsili','step'].concat(S.showParked ? ['kfupm','aramco'] : [])
        .forEach(t => OPEN_TRACKS.push(t)); } catch (e) {}
    saveState(); render();
  },
  devFind() {
    const el = document.getElementById('devq');
    const v = el ? String(el.value || '').trim() : '';
    S.devFound = v ? (byQ(v) ? v : '__none__') : null; render();
  },
  devExport() {
    try {
      const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ufuq-state-day' + (S.day || 1) + '.json';
      a.click();
    } catch (e) {}
    haptic(12);
  },
  toggleAudit() { S.audit = !S.audit; haptic(S.audit ? 18 : 9); render(); },
  toggleClean() { S.cleanOnly = !S.cleanOnly; S.suggestion = null; haptic(16); render(); },
  chooseTrack(t) {
    haptic(12);
    if (!S.themeLocked && TRACK_THEME[t]) S.theme = TRACK_THEME[t];
    const btn = document.querySelector(`.tcard[data-arg="${t}"]`);
    const tr = TRACKS[t];
    const v = document.createElement('div');
    v.className = 'veil';
    v.style.setProperty('--a', tr.accent);
    if (btn) {
      const r = btn.getBoundingClientRect();
      v.style.setProperty('--ox', (r.left + r.width / 2) + 'px');
      v.style.setProperty('--oy', (r.top + r.height / 2) + 'px');
    }
    v.innerHTML = `<div class="vin"><span class="vg">${trackGlyph(t, 46)}</span>
      <span class="vn">${esc(tr.name)}</span><span class="vt">${esc(tr.tag)}</span></div>`;
    document.body.appendChild(v);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const D1 = reduce ? 0 : 620, D2 = reduce ? 0 : 480;
    setTimeout(() => {
      ACTIONS.setTrack(t); go('welcome');
      v.classList.add('out');
      setTimeout(() => v.remove(), D2 + 60);
    }, D1);
  },
  setTrack(t) {
    if (t === S.track) { render(); return; }
    saveTrack();
    S.track = t;
    loadTrack(t);
    render();
  },
  saved() { S.suggestion = null; go('home'); },
  devTabSet(n) { S.devTab = +n; haptic(9); render(); },
  openRow(id) {
    const M = { goal: [0, 0], exam: [0, 0], plan: [0, 0], remind: [5, 0],
      look: [6, 0], share: [6, 1], data: [6, 2], about: [4, 0], dev: [7, 0] };
    const m = M[id]; if (!m) return;
    if (id === 'goal') { go('goal'); return; }
    S.setRow = id; S.setTab = m[0]; S.devTab = m[1];
    haptic(10); render();
  },
  closeRow() { S.setRow = null; haptic(9); render(); },
  setTab(n) { S.devTab = 0; const M = { 1: 6, 2: 6, 3: 6 }; n = M[+n] != null ? M[+n] : +n;
    S.setTab = n; haptic(9); render(); },
  setSize2(n) { S.size = +n; S.sizeManual = true; render(); },
  async installApp() { haptic(16); doInstall(); },
  contactDev() {
    const fl = (S.flags || []).map(f =>
      `• ${f.kind === 'dup' ? 'مكرّر' : f.kind === 'wrong' ? 'إجابة' : 'غموض'} — ${f.id} — ${f.stem}`).join('\n');
    const body = `ملاحظة على تطبيق أفق\n\nالمسار: ${TRACKS[S.track].name}\nاليوم: ${S.day + 1}\n`
      + (fl ? `\nأسئلة مُبلَّغ عنها:\n${fl}\n` : '') + `\nملاحظتي:\n`;
    const url = 'https://wa.me/?text=' + encodeURIComponent(body);
    try { window.open(url, '_blank'); } catch (e) {}
    haptic(14);
  },
  toggleAudio() { S.audio = !S.audio; if (!S.audio) speakStop(); haptic(12); render(); },
  pickSkill(id) {
    const old = S.suggestion.skill;
    if (old !== id) S.skills[old].ignore += 1;
    if (S.skills[old].ignore >= 5) S.skills[old].coldUntil = S.day + 12;
    S.suggestion = { skill: id, name: SKILLS[id].name, size: S.size,
      why: 'اخترتَها بنفسك', gain: `بعدها: تتقدّم «${SKILLS[id].name}»` };
    go('home');
  },
  startSession() {
    const want = S.suggestion && S.suggestion.skill;
    if (want && LESSONS.lessons[want] && !S.seenLessons.includes(want) && S.screen !== 'lesson') {
      S.lessonFor = want; S.lessonTab = 0; go('lesson'); return;
    }
    if (want) S.seenLessons.includes(want) || S.seenLessons.push(want);
    const s = buildSession();
    if (S.suggestion && !s.resume) {
      const forced = S.suggestion.skill;
      if (forced !== s.skill) { S.session = buildSessionFor(forced); } else S.session = s;
    } else S.session = s;
    if (!S.session.items.length) { toast('لا توجد أسئلة كافية لهذه المهارة في هذا النموذج'); return; }
    go('question');
  },
  answer(i) {
    const s = S.session, item = s.items[s.idx], q = byQ(item.qid);
    const ok = !!q.choices[+i].c;
    const secs = (Date.now() - (s.qStart || Date.now())) / 1000;
    item.choiceIdx = +i; item.wrong = !ok;
    if (!ok) {
      const tag = q.choices[+i].tag;
      if (tag) S.tagCount[tag] = (S.tagCount[tag] || 0) + 1;
      if (q.d >= 4) s.hardWrong = (s.hardWrong || 0) + 1;
      if (secs < 8) s.fast = (s.fast || 0) + 1;
    }
    if (secs > 60) s.slow = (s.slow || 0) + 1;
    s.time = (s.time || 0) + Math.min(secs, 180);
    s.timed = (s.timed || 0) + 1;
    if (ok) { s.right++; s.rStreak++; s.wStreak = 0; } else { s.wrong++; s.wStreak++; s.rStreak = 0; }
    if (!ok && s.wStreak >= 3 && !s.stopAsked) { s.stopAsked = true; S.stopOffer = true; }
    const askWhy = (s.whyAsked || 0) < 2 && (!ok || Math.random() < 0.3) && s.idx >= 1;
    if (askWhy) { s.whyAsked = (s.whyAsked || 0) + 1; S.pendingRecord = { item, ok }; go('why'); return; }
    record(item, ok, false);
    S.tip = checkTip(s);
    go('explain');
  },
  skip() {
    const s = S.session, item = s.items[s.idx];
    item.choiceIdx = null; item.wrong = true;
    s.skips = (s.skips || 0) + 1;
    s.wStreak++; s.rStreak = 0;
    if (s.wStreak >= 3 && !s.stopAsked) { s.stopAsked = true; S.stopOffer = true; }
    record(item, false, true);
    S.tip = checkTip(s);
    go('explain');
  },
  startCards(skill) {
    const cs = cardSession(skill || (mySkills().find(s => (cardsBySkill[s.id] || []).length) || {}).id, 10);
    if (!cs) { toast('لا توجد بطاقات في هذا المسار بعد'); return; }
    S.cardSess = cs; S.cardShow = false; go('cards');
  },
  cardFlip() { S.cardShow = true; render(); },
  cardOk() { S.lastCards = { right: S.cardSess.right + 1, total: S.cardSess.cards.length }; cardAnswer(true); },
  cardNo() { S.lastCards = { right: S.cardSess.right, total: S.cardSess.cards.length }; cardAnswer(false); },
  explainWhy(kind) {
    const s = S.session, pr = S.pendingRecord;
    if (!pr) { go('explain'); return; }
    pr.item.how = kind;
    S.whyCount = (S.whyCount || 0) + 1;
    // التخمين الموفَّق لا يُحتسب إتقانًا
    record(pr.item, pr.ok && kind !== 'guess', false);
    if (kind === 'ask') S.tagCount['self_read_ask'] = (S.tagCount['self_read_ask'] || 0) + 1;
    if (kind === 'guess') s.skips = (s.skips || 0) + 0.5;
    S.pendingRecord = null;
    S.tip = checkTip(s);
    go('explain');
  },
  next() { S.expTab = 0;
    const s = S.session;
    S.tip = null;
    s.idx++;
    if (s.idx >= s.items.length) { finishSession(s); go('summary'); return; }
    adapt(s);
    go('question');
  },
  async shareCard() {
    const r = S.result || {}; haptic(14);
    const W = 1080, H = 1080, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const x = c.getContext('2d');
    const cs = getComputedStyle(document.getElementById('shell'));
    const V = k => (cs.getPropertyValue(k) || '').trim();
    const bg = V('--void') || '#0E1017', ink = V('--ink') || '#D6D9E6';
    const soft = V('--ink-soft') || '#9195AB', glow = V('--glow') || '#7FA8D9';
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.strokeStyle = glow; x.globalAlpha = .22; x.lineWidth = 3;
    x.strokeRect(56, 56, W - 112, H - 112); x.globalAlpha = 1;
    x.textAlign = 'center'; x.direction = 'rtl';
    x.fillStyle = soft; x.font = '400 34px system-ui,sans-serif';
    x.fillText('أفق · ' + TRACKS[S.track].name, W / 2, 190);
    x.fillStyle = ink; x.font = '300 66px system-ui,sans-serif';
    x.fillText(S.name ? S.name : 'جلسة اليوم', W / 2, 300);
    x.fillStyle = glow; x.font = '300 210px system-ui,sans-serif';
    x.fillText(ar(r.right || 0) + ' / ' + ar(r.total || 0), W / 2, 520);
    x.fillStyle = soft; x.font = '400 40px system-ui,sans-serif';
    x.fillText('إجابة صحيحة', W / 2, 590);
    x.globalAlpha = .3; x.strokeStyle = soft; x.lineWidth = 2;
    x.beginPath(); x.moveTo(200, 660); x.lineTo(W - 200, 660); x.stroke(); x.globalAlpha = 1;
    x.fillStyle = ink; x.font = '400 44px system-ui,sans-serif';
    x.fillText('اليوم ' + ar(S.day + 1) + ' · سلسلة ' + ar(S.streak || 0) + ' يومًا', W / 2, 740);
    if (r.pace) { x.fillStyle = soft; x.font = '400 36px system-ui,sans-serif';
      x.fillText('إيقاع ' + ar(r.pace) + ' ثانية للسؤال', W / 2, 810); }
    x.fillStyle = soft; x.globalAlpha = .7; x.font = '400 30px system-ui,sans-serif';
    x.fillText(TRACKS[S.track].motto, W / 2, 950); x.globalAlpha = 1;
    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    if (!blob) return;
    const file = new File([blob], 'ufuq.png', { type: 'image/png' });
    const txt = `${ar(r.right || 0)} من ${ar(r.total || 0)} في ${TRACKS[S.track].name} — أفق`;
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: txt }); return; } catch (e) { return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'ufuq.png'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  },
  done() { S.lastWeak = null; S.suggestion = null; go('home'); },
  again() { S.suggestion = makeSuggestion(); ACTIONS.startSession(); },
  endDay() { S.suggestion = null; S.day += 1; go('home'); },
  showExam() { S.showExam = !S.showExam; render(); },
  openPause() { S.openPause = true; render(); },
  logToggle(i) { S.logOpen = S.logOpen === +i ? null : +i; render(); },
  toggleShare(v) { S.shareReport = v === '1'; render(); },
  togglePassage() { S.passOpen = (S.passOpen === false); render(); },
  setAnchor(a) { S.anchor = a; render(); },
  dismissIOS() { S.iosHinted = true; haptic(9); render(); },
  prTab(i) { S.prTab = +i; haptic(7); render(); },
  clearRestored() { S.restored = null; haptic(9); saveState(); render(); },
  dismissNudge() { S.nudgeSeen = S.day; haptic(7); saveState(); render(); },
  beginCourse() {
    if (startCourse()) { haptic(16); go(S.goal ? 'copen' : 'goal'); } else { haptic(7); render(); }
  },
  runStation() {
    const c = courseActive(); if (!c) return;
    const st = courseStation(); if (!st) return;
    if (st.k === 'key' && st.skill) { ACTIONS.openLesson(st.skill); return; }
    if (st.k === 'test') { ACTIONS.examOpen('short'); return; }
    /* المحطّات الأخرى جلسة مركّبة بحسب نوعها */
    S.forceSkill = st.skill || null;
    S.stationKind = st.k;
    ACTIONS.startSession();
  },
  reviveCourse() {
    const c = courseActive(); if (!c) return;
    c.revived = true; c.lastDay = S.day;
    S.forceSkill = null; S.stationKind = 'revive';
    haptic(9); saveState();
    ACTIONS.startSession();
  },
  setGoal(v) {
    S.goal = +v; haptic(14); saveState();
    if (courseActive() && (S.course.at || 0) === 0) { go('copen'); return; }
    go('home');
  },
  repeatCourse() {
    const c = S.course; if (!c) return;
    const skills = (c.skills || []).slice();
    S.course = { part: c.part, skills, map: courseMap(skills), at: 0,
      startDay: S.day, lastDay: S.day, revived: false, log: [],
      finished: false, round: (c.round || 1) + 1 };
    haptic(16); saveState(); go('copen');
  },
  wipeAsk() { S.wipeStep = 1; haptic(12); go('wipe'); },
  wipeCancel() { S.wipeStep = 0; haptic(9); go('settings'); },
  /* تأكيدان لا واحد: الأول ينبّه، والثاني يطلب كتابة كلمة — فلا يقع المسح سهوًا */
  wipeConfirm() {
    if (S.wipeStep !== 2) { S.wipeStep = 2; haptic(14); render(); return; }
    /* نمسح كل ما يخصّ أُفق في هذا المتصفّح ولا نمسّ غيره */
    try {
      const drop = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k === SAVE_KEY || k.indexOf(SAVE_KEY) === 0)) drop.push(k);
      }
      drop.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    haptic(20);
    try { location.reload(); } catch (e) { S = freshState(); go('name'); }
  },
  seenReport() { if (S.course) { S.course.seen = true; saveState(); } go('home'); },
  shareReport() {
    const t = reportText();
    try {
      const url = 'https://wa.me/?text=' + encodeURIComponent(t);
      window.open(url, '_blank');
    } catch (e) {
      try { navigator.clipboard.writeText(t); } catch (e2) {}
    }
    haptic(12);
  },
  copyReport() {
    try { navigator.clipboard.writeText(reportText()); S.copied = true; } catch (e) {}
    haptic(9); render();
    setTimeout(() => { S.copied = false; render(); }, 2200);
  },
  takePhase(f) { S.phaseSeen = null; ACTIONS.setFocus(f); },
  dismissPhase(n) { S.phaseSeen = n; haptic(7); saveState(); render(); },
  playListen() {
    const s = S.session; if (!s) return;
    const item = s.items[s.idx], q = byQ(item.qid);
    if (!q || !q.listen) return;
    if ((item.played || 0) >= 2) return;
    item.played = (item.played || 0) + 1;
    haptic(9);
    SPEAK.say(q.listen);
    render();
  },
  setFocus(f) {
    if (!['all','verbal','quant'].includes(f)) return;
    S.focus = f; S.suggestion = null; S.forceSkill = null;
    haptic(14); saveState(); render();
  },
  addRound() {
    const k = S.schedTab || 'week';
    const rs = myRounds(k);
    if (rs.length >= MAX_ROUNDS) return;
    const t = ROUND_TEMPLATE[Math.min(rs.length, ROUND_TEMPLATE.length - 1)];
    rs.push(Object.assign({}, t));
    S.preset = 'custom'; haptic(14); saveState(); render();
  },
  dropRound() {
    const k = S.schedTab || 'week';
    const rs = myRounds(k);
    if (rs.length <= 1) return;
    rs.pop();
    S.preset = 'custom'; haptic(9); saveState(); render();
  },
  exportState() {
    try {
      const o = {}; Object.keys(S).forEach(k => { if (!NOSAVE.includes(k)) o[k] = S[k]; });
      o._v = 1; o._at = new Date().toISOString().slice(0, 10); o._app = 'ufuq';
      const blob = new Blob([JSON.stringify(o)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ufuq-' + (S.name || 'backup') + '-يوم' + (S.day + 1) + '-' + o._at + '.json';
      a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
      S.lastBackup = o._at; S.lastBackupDay = S.day; haptic(16); saveState(); render();
    } catch (e) { alert('تعذّر حفظ النسخة.'); }
  },
  importState() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const o = JSON.parse(r.result);
          if (!o || o._app !== 'ufuq') { alert('هذا ليس ملفّ نسخة من أُفق.'); return; }
          const base = freshState();
          Object.keys(o).forEach(k => { if (k[0] !== '_') base[k] = o[k]; });
          healState(base); ensureSkills.call(null);
          base.session = null; base.exam = null; base.screen = base.name ? 'home' : 'name';
          S = base; ensureSkills(); applyTheme(); saveState(); haptic(20);
          const ph = phaseNow();
          S.restored = {
            name: S.name || '', day: S.day + 1,
            phase: ph ? ph.name : (TRACKS[S.track] ? TRACKS[S.track].name : ''),
            sessions: S.sessionCount || 0, streak: S.streak || 0,
            skills: mySkills().filter(x => (S.skills[x.id].days || []).length).length,
            errors: (S.review || []).length, at: o._at || ''
          };
          go('home');
        } catch (e) { alert('تعذّرت قراءة الملفّ.'); }
      };
      r.readAsText(f);
    };
    inp.click();
  },
  checkUpdate() {
    haptic(10);
    if (!('serviceWorker' in navigator)) { alert('التحديث يعمل على الموقع لا على ملفّ محلّيّ.'); return; }
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) { alert('لم يُسجَّل عامل الخدمة بعد. أعد فتح التطبيق وأنت متّصل.'); return; }
      reg.update().then(() => {
        setTimeout(() => {
          if (!document.getElementById('updbar')) alert('أنت على أحدث نسخة.');
        }, 1200);
      }).catch(() => alert('تعذّر التحقّق. تأكّد من الاتصال.'));
    });
  },
  resetJourney() {
    S.seenLessons = [];
    S.lessonFor = null; S.exPick = null; S.exPickFor = null;
    haptic(16); saveState(); render();
  },
  /* وصلة: من أيّ موضع إلى تدريبٍ على مهارة بعينها */
  drillSkill(id) {
    if (!id || !hasContent(id)) return;
    S.suggestion = null;
    S.forceSkill = id;
    /* إن كان هذا مفتاح محطّة، فقراءته أنجزتها — والتدريب هو المحطّة التالية */
    if (S.lessonIsStation) {
      S.lessonIsStation = false;
      courseAdvance(0, 0, []);
      S.stationKind = 'drill';
    }
    haptic(14);
    try { ACTIONS.startSession(); } catch (e) { go('home'); }
  },
  setViz(m) { S.vizMode = m; haptic(9); saveState(); render(); },
  lessonNext() { S.lessonTab = (S.lessonTab || 0) + 1; haptic(9); render(); },
  lessonPrev() { S.lessonTab = Math.max(0, (S.lessonTab || 0) - 1); haptic(7); render(); },
  k2tab(n) { S.k2tab = +n; haptic(9); render(); },
  exPick(n) {
    S.exPick = +n; S.exPickFor = S.lessonFor; S.k2tab = 0;
    const L = LESSONS.lessons[S.lessonFor];
    haptic(L && +n === L.exAns ? 16 : 9); render();
  },
  shareCard() { haptic(12); shareProgress(); },
  setPreset(k) { S.preset = k;
    S.sched = { week: ROUND_PRESETS[k].week.map(r => Object.assign({}, r)),
                wknd: ROUND_PRESETS[k].wknd.map(r => Object.assign({}, r)) };
    haptic(12); saveState(); render(); },
  schedTab(k) { S.schedTab = k; haptic(7); render(); },
  installNow() { haptic(12); doInstall().then(ok => { if (!ok) { S.installAsked = true; render(); } }); },
  laterInstall() { S.installAsked = true; haptic(8); saveState(); render(); },
  setGrade(g) { S.grade = g; haptic(12); saveState(); render(); },
  examOpen(m) { haptic(12); examStart(m || 'full'); },
  examGo() { const e = S.exam; e.endsAt = Date.now() + e.spec.mins * 60000; go('exam'); },
  examPick(k) {
    const e = S.exam, q = byQ(e.items[e.idx]);
    e.answers[q.id] = { k: +k, ok: !!q.choices[+k].c };
    haptic(9);
    if (e.idx < e.items.length - 1) { e.idx += 1; render(); } else render();
  },
  examMove(d) { const e = S.exam; e.idx = Math.max(0, Math.min(e.items.length - 1, e.idx + (+d))); haptic(7); render(); },
  examJump(i) { S.exam.idx = +i; haptic(7); render(); },
  examEndSec() { haptic(14); examNextSection(); },
  examQuit() { S.exam = null; haptic(10); go('home'); },
  saveNote() {
    const el = document.getElementById('noteIn');
    const t = (el && el.value || '').trim();
    if (!t) { if (el) el.focus(); return; }
    S.notes = S.notes || [];
    S.notes.push({ day: S.day, text: t.slice(0, 90) });
    if (S.notes.length > 30) S.notes.shift();
    haptic(14); render();
  },
  closeNote() {
    const ns = (S.notes || []).filter(n => n.day < S.day);
    if (ns.length) S.noteSeen = ns[ns.length - 1].day;
    haptic(9); render();
  },
  stopGo() { S.stopOffer = false; haptic(10); render(); },
  stopNow() {
    S.stopOffer = false;
    const s = S.session;
    if (s) { s.items = s.items.slice(0, s.idx + 1); s.resume = true; s.stopped = true; finishSession(s); }
    haptic(14); go('summary');
  },
  setTheme(t) { S.themeLocked = true; S.theme = t;
    if (t === 'breathe') breatheStart();
    else if (S.breatheTimer) { clearInterval(S.breatheTimer); S.breatheTimer = null; }
    applyTheme(); render(); },
  flipDay() {
    let t = S.theme;
    if (t === 'auto') t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'paper' : 'night';
    const th = THEMES.find(x => x.id === t);
    const light = th && !th.dark;
    const DAY = { night:'paper', obsidian:'sand', petrol:'mint', forest:'mint', plum:'paper', royal:'grey' };
    const NIGHT = { paper:'night', sand:'obsidian', mint:'petrol', grey:'royal' };
    S.themeLocked = true;
    S.theme = light ? (NIGHT[t] || 'night') : (DAY[t] || 'paper');
    haptic(14); applyTheme(); render();
  },
  setPace(v) { S.pace = v === '1'; render(); },
  openTheme() { S.sheet = 'theme'; render(); },
  closeSheet() { S.sheet = null; render(); },
  sendReport() { toast('أُرسل التقرير — ويظهر لك دائمًا كما هو'); },
  setExam(d) {
    const n = +d;
    S.examIn = n;
    S.examDays = n ? n + S.day : null;
    S.examDate = n ? new Date(Date.now() + n * 86400000).toISOString() : null;
    haptic(12); saveState(); render();
  },
  togglePause(id) { S.skills[id].paused = !S.skills[id].paused; S.suggestion = null; render(); },
  advance(n) { S.day += +n; S.suggestion = null; render(); },
  reset() { const n = S.name; S = freshState(); S.name = n; go(n ? 'pick' : 'name'); },
  editName() { go('name'); },
  leaveTrack() { saveTrack(); haptic(14); go('pick'); },
  pay() { S.paid = true; S.suggestion = null; go('home'); }
};

function buildSessionFor(skillId) {
  const keep = S.activeStage;
  const orig = chooseActive;
  const s = (function () {
    const used = new Set(), items = [];
    const size = S.size;
    const nWarm = Math.max(1, Math.round(size * 0.17));
    const nReview = Math.max(1, Math.round(size * 0.25));
    const warmPool = masteredSkills();
    for (let i = 0; i < nWarm; i++) {
      const sk = warmPool.length ? warmPool[i % warmPool.length] : SKILLS[skillId];
      const q = pool(sk.id, 1, used); if (q) { used.add(q.id); items.push({ qid: q.id, role: 'warmup', done: false }); }
    }
    const due = S.review.filter(r => r.due <= S.day).slice(0, nReview);
    due.forEach(r => { if (!used.has(r.qid)) { used.add(r.qid); items.push({ qid: r.qid, role: 'review', done: false }); } });
    while (items.length < size) {
      const q = pool(skillId, Math.min(5, Math.max(1, S.targetDiff + (items.length % 3) - 1)), used);
      if (!q) break; used.add(q.id); items.push({ qid: q.id, role: 'active', done: false });
    }
    // أسئلة القطعة الواحدة تبقى متجاورة
    (() => {
      const groups = [], seen = new Map();
      items.forEach(x => {
        const pz = byQ(x.qid).passage;
        if (!pz) { groups.push([x]); return; }
        if (seen.has(pz)) seen.get(pz).push(x);
        else { const g = [x]; seen.set(pz, g); groups.push(g); }
      });
      items.length = 0; items.push(...groups.flat());
    })();
    return { items, idx: 0, right: 0, wrong: 0, rStreak: 0, wStreak: 0,
      skill: skillId, returning: null, resume: false, size: items.length };
  })();
  S.activeStage = keep;
  return s;
}

/* ══════════ الحفظ: بدونه يبدأ الطالب من الصفر كلّ مرّة ══════════ */
const SAVE_KEY = 'ufuq.v1';
const NOSAVE = ['session','exam','sheet','devOpen','pendingRecord','breatheTimer','stopOffer','_dir','tip','suggestion','restored','nudgeSeen'];
/* حجب التخزين: المتصفّح في وضع التصفّح الخفيّ أو ممتلئ.
   من StudyMate: يُنبَّه الطالب بدل أن يعمل ويفقد تقدّمه صامتًا. */
function saveState() {
  try {
    const o = {};
    Object.keys(S).forEach(k => { if (!NOSAVE.includes(k)) o[k] = S[k]; });
    o._at = new Date().toISOString().slice(0, 10);
    o._v = 1;
    localStorage.setItem(SAVE_KEY, JSON.stringify(o));
    S.storageBlocked = false;
  } catch (e) {
    if (!S.storageBlocked) { S.storageBlocked = true; try { render(); } catch (e2) {} }
  }
}
function daysBetween(a, b) {
  const d = (new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000;
  return isFinite(d) ? Math.max(0, Math.round(d)) : 0;
}
/* إصلاح ذاتيّ: من المستحيل أن يُتمّ الطالب كلّ المفاتيح في جلسات قليلة.
   إن وجدنا ذلك فهي حالة أفسدتها لوحة المعاينة — نعيدها إلى الصفر. */
function healState(b) {
  try {
    /* من كان على مسارٍ أُجّل يُنقَل إلى القدرات، ويبقى تقدّمه محفوظًا كما هو */
    if (b && b.track && !isOpenTrack(b.track)) {
      b.trackParked = b.track;
      b.track = 'qudurat';
      b.suggestion = null; b.forceSkill = null; b.session = null;
    }
    const total = Object.keys(LESSONS.lessons).length;
    const seen = (b.seenLessons || []).length;
    if (total && seen >= total && (b.sessionCount || 0) < Math.max(8, total / 3)) {
      b.seenLessons = [];
      b._healed = true;
    }
    /* وضع المطوّر يبقى ما دام مفتوحًا — ويُقفَل من تبويبه بيد صاحبه */
    if (!b.devUnlocked) { b.admin = false; b.audit = false; }
  } catch (e) {}
  return b;
}
function loadState() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  if (!raw) return false;
  let o; try { o = JSON.parse(raw); } catch (e) { return false; }
  if (!o || o._v !== 1) return false;
  const base = freshState();
  /* الدمج مع حالة جديدة: أيّ حقل نُضيفه لاحقًا لا يكسر حفظًا قديمًا */
  Object.keys(o).forEach(k => { if (k[0] !== '_') base[k] = o[k]; });
  if (base.skills) {
    const fresh = freshState().skills;
    Object.keys(fresh).forEach(id => { if (!base.skills[id]) base.skills[id] = fresh[id]; });
  }
  /* اليوم يتقدّم بالتقويم الحقيقي لا بزرّ */
  const today = new Date().toISOString().slice(0, 10);
  if (o._at) {
    const gap = daysBetween(o._at, today);
    if (gap > 0) { base.day = (base.day || 0) + gap; base.todayCount = 0; }
  }
  base.session = null; base.exam = null; base.sheet = null; base.stopOffer = false;
  healState(base);
  base.screen = (base.name && base.screen !== 'name') ? 'home' : (base.name ? 'home' : 'name');
  S = base;
  return true;
}
let _sv;
function markDirty() { clearTimeout(_sv); _sv = setTimeout(saveState, 400); }
window.addEventListener('pagehide', saveState);
window.addEventListener('beforeunload', saveState);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });

/* ══════════ مولّد QR مصغّر ══════════
   نمط البايت، مستوى تصحيح M، النسخ ١ إلى ٦ — يكفي لرابط قصير.
   مكتوب هنا كاملًا لأن البطاقة يجب أن تعمل بلا إنترنت. */
const QRC = (() => {
  const EXP = new Array(512), LOG = new Array(256);
  (() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 285; }
    for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
  const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  function genPoly(n) { let g = [1];
    for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) { ng[j] ^= mul(g[j], EXP[i]); ng[j + 1] ^= g[j]; } g = ng; }
    return g; }
  function ecc(data, n) { const g = genPoly(n), res = data.concat(new Array(n).fill(0));
    for (let i = 0; i < data.length; i++) { const f = res[i]; if (!f) continue;
      for (let j = 0; j < g.length; j++) res[i + j] ^= mul(g[j], f); }
    return res.slice(data.length); }
  /* [نسخة]: [إجمالي البايتات، بايتات التصحيح لكل كتلة، عدد كتل المجموعة١، كلمات بيانات الكتلة] */
  const V = { 1:[26,10,1,16], 2:[44,16,1,28], 3:[70,26,1,44], 4:[100,18,2,32], 5:[134,24,2,43], 6:[172,16,4,27] };
  const ALIGN = { 1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30], 6:[6,34] };
  function pick(len) { for (const v of [1,2,3,4,5,6]) { const [,ecn,blocks,dw] = V[v];
      if (blocks * dw >= len + 2) return v; } return null; }
  function encode(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    const ver = pick(bytes.length); if (!ver) return null;
    const [, ecn, blocks, dw] = V[ver];
    const bits = [];
    const push = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
    push(4, 4); push(bytes.length, 8);
    bytes.forEach(b => push(b, 8));
    const cap = blocks * dw * 8;
    for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);
    const words = []; for (let i = 0; i < bits.length; i += 8) { let v = 0;
      for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j]; words.push(v); }
    const pad = [0xEC, 0x11]; let pi = 0;
    while (words.length < blocks * dw) words.push(pad[pi++ % 2]);
    const dBlocks = [], eBlocks = [];
    for (let b = 0; b < blocks; b++) { const d = words.slice(b * dw, (b + 1) * dw);
      dBlocks.push(d); eBlocks.push(ecc(d, ecn)); }
    const out = [];
    for (let i = 0; i < dw; i++) dBlocks.forEach(b => out.push(b[i]));
    for (let i = 0; i < ecn; i++) eBlocks.forEach(b => out.push(b[i]));
    return { ver, words: out };
  }
  function build(text) {
    const e = encode(text); if (!e) return null;
    const ver = e.ver, N = ver * 4 + 17;
    const m = Array.from({ length: N }, () => new Array(N).fill(0));
    const res = Array.from({ length: N }, () => new Array(N).fill(false));
    const put = (r, c, v) => { if (r >= 0 && c >= 0 && r < N && c < N) { m[r][c] = v; res[r][c] = true; } };
    const finder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
        const rr = r + i, cc = c + j; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6))
          || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
        put(rr, cc, on ? 1 : 0); } };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    for (let i = 8; i < N - 8; i++) { const v = i % 2 === 0 ? 1 : 0; put(6, i, v); put(i, 6, v); }
    const al = ALIGN[ver];
    for (const r of al) for (const c of al) {
      if ((r < 9 && c < 9) || (r < 9 && c > N - 10) || (r > N - 10 && c < 9)) continue;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++)
        put(r + i, c + j, (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) ? 1 : 0); }
    put(N - 8, 8, 1);
    /* خانات معلومات الشكل — تُحجز الآن وتُملأ بعد اختيار القناع */
    /* المواضع بترتيب البِتّ i من ٠ إلى ١٤، صفًّا ثم عمودًا */
    const F1 = [];
    for (let i = 0; i <= 5; i++) F1.push([i, 8]);
    F1.push([7, 8], [8, 8], [8, 7]);
    for (let i = 9; i <= 14; i++) F1.push([8, 14 - i]);
    const F2 = [];
    for (let i = 0; i <= 7; i++) F2.push([8, N - 1 - i]);
    for (let i = 8; i <= 14; i++) F2.push([N - 15 + i, 8]);
    F1.concat(F2).forEach(([r, c]) => { res[r][c] = true; });
    /* وضع البيانات في الخانات الحرّة وحدها */
    const bits = []; e.words.forEach(w => { for (let i = 7; i >= 0; i--) bits.push((w >> i) & 1); });
    let bi = 0, up = true;
    for (let col = N - 1; col > 0; col -= 2) { if (col === 6) col--;
      for (let k = 0; k < N; k++) { const row = up ? N - 1 - k : k;
        for (let d = 0; d < 2; d++) { const c = col - d;
          if (res[row][c]) continue;
          m[row][c] = bi < bits.length ? bits[bi++] : 0; } }
      up = !up; }
    const MASK = [ (r,c)=>(r+c)%2===0, (r,c)=>r%2===0, (r,c)=>c%3===0, (r,c)=>(r+c)%3===0,
      (r,c)=>(((r/2)|0)+((c/3)|0))%2===0, (r,c)=>((r*c)%2)+((r*c)%3)===0,
      (r,c)=>((((r*c)%2)+((r*c)%3))%2)===0, (r,c)=>((((r+c)%2)+((r*c)%3))%2)===0 ];
    const FMT_M = [0x5412,0x5125,0x5E7C,0x5B4B,0x45F9,0x40CE,0x4F97,0x4AA0];
    let best = null;
    for (let mk = 0; mk < 8; mk++) {
      const g = m.map(r => r.slice());
      /* القناع لا يمسّ أنماط الوظيفة */
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
        if (!res[r][c] && MASK[mk](r, c)) g[r][c] ^= 1;
      const f = FMT_M[mk];
      F1.forEach(([r, c], i) => { g[r][c] = (f >> i) & 1; });
      F2.forEach(([r, c], i) => { g[r][c] = (f >> i) & 1; });
      g[N - 8][8] = 1;
      let pen = 0;
      for (let r = 0; r < N; r++) { let run = 1;
        for (let c = 1; c < N; c++) { if (g[r][c] === g[r][c-1]) { run++; if (run === 5) pen += 3; else if (run > 5) pen++; } else run = 1; } }
      for (let c = 0; c < N; c++) { let run = 1;
        for (let r = 1; r < N; r++) { if (g[r][c] === g[r-1][c]) { run++; if (run === 5) pen += 3; else if (run > 5) pen++; } else run = 1; } }
      for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++)
        if (g[r][c] === g[r][c+1] && g[r][c] === g[r+1][c] && g[r][c] === g[r+1][c+1]) pen += 3;
      let dark = 0; g.forEach(r => r.forEach(v => { if (v === 1) dark++; }));
      pen += Math.floor(Math.abs(dark * 100 / (N * N) - 50) / 5) * 10;
      if (best === null || pen < best.pen) best = { pen, g };
    }
    return best.g;
  }
  return { build };
})();

/* ══════════════════ أشكال التطوّر — أربعة أوضاع ══════════════════
   كلّها تُبنى من بيانات الطالب الحقيقية: S.history و S.corrected و S.skills.
   وكلّها SVG خالص يتلوّن بسمة الطالب ويعمل بلا إنترنت.
   ═══════════════════════════════════════════════════════════════ */
const VIZ = [
  { id: 'rings',   n: 'الحلقات', b: 'رحلتك كلّها في دائرة' },
  { id: 'horizon', n: 'الأفق',   b: 'الشمس ترتفع والأرض تتّسع' },
  { id: 'thread',  n: 'الخيط',   b: 'يغلظ حيث واظبت' },
  { id: 'witness', n: 'الشاهد',  b: 'دليلٌ لا رقم' }
];

/* يجمع السجلّ في أسابيع: [عدد الجلسات، الدقّة] */
function weeksOf(maxW) {
  const h = S.history || [];
  if (!h.length) return [];
  const today = S.day;
  const first = Math.min(...h.map(x => x.day));
  const nW = Math.min(maxW || 20, Math.max(1, Math.ceil((today - first + 1) / 7)));
  const out = [];
  for (let w = nW - 1; w >= 0; w--) {
    const hi = today - w * 7, lo = hi - 6;
    const inW = h.filter(x => x.day <= hi && x.day > lo - 1);
    const tot = inW.reduce((a, x) => a + x.total, 0);
    const rt = inW.reduce((a, x) => a + x.right, 0);
    out.push([inW.length, tot ? rt / tot : 0]);
  }
  return out;
}

/* ── أ · حلقات النموّ ── */
function vizRings() {
  const W = weeksOf(20);
  if (W.length < 1) return vizEmpty('أول حلقة تُرسم بعد جلستك الأولى');
  const S0 = 300, cx = S0 / 2, cy = S0 / 2;
  let r = 15, out = '';
  W.forEach(([s, acc], i) => {
    const th = 1.5 + Math.min(7, s) * 1.3;
    const op = s ? (0.22 + acc * 0.78) : 0.11;
    out += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="var(--glow)"
      stroke-opacity="${op.toFixed(2)}" stroke-width="${th.toFixed(1)}" class="vrg" style="--i:${i}"/>`;
    r += th + 3.2;
    if (r > S0 / 2 - 6) r = S0 / 2 - 6;
  });
  const gaps = W.filter(x => !x[0]).length;
  const sess = W.reduce((a, x) => a + x[0], 0);
  return `<svg viewBox="0 0 ${S0} ${S0}" class="vsvg">
    ${out}<circle cx="${cx}" cy="${cy}" r="6.5" fill="var(--glow)" class="vrg" style="--i:${W.length}"/>
  </svg>
  <div class="vfoot"><span>${ar(W.length)} ${W.length === 1 ? 'أسبوع' : 'أسبوعًا'} · ${ar(sess)} جلسة</span>
    <span>${gaps ? `${ar(gaps)} أسبوعًا بلا جلسة — وحلقاتها باقية` : 'بلا أسبوع فارغ'}</span></div>`;
}

/* ── ب · الأفق الذي يتّسع ── */
function vizHorizon() {
  const p = overallMastery() / 100;
  const skills = mySkills().filter(x => hasContent(x.id));
  const lit = skills.filter(x => mastery(x.id) >= 60).length;
  const Wd = 330, H = 220, hy = H * 0.60, r = 42, rise = p * 44;
  const span = (Wd - 56) * Math.max(0.06, skills.length ? lit / skills.length : 0.06);
  let marks = '';
  const n = Math.min(16, Math.max(6, skills.length));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1), x = 28 + t * (Wd - 56);
    const on = i < Math.round(n * (skills.length ? lit / skills.length : 0));
    marks += `<line x1="${x.toFixed(1)}" y1="${hy + 15}" x2="${x.toFixed(1)}" y2="${hy + (on ? 29 : 21)}"
      stroke="var(--glow)" stroke-opacity="${on ? '.85' : '.15'}" stroke-width="2.6"
      stroke-linecap="round" class="vmk" style="--i:${i}"/>`;
  }
  return `<svg viewBox="0 0 ${Wd} ${H}" class="vsvg">
    <defs>
      <linearGradient id="vsky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--glow)" stop-opacity="0"/>
        <stop offset="1" stop-color="var(--glow)" stop-opacity=".15"/></linearGradient>
      <linearGradient id="vsun" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--glow)"/><stop offset="1" stop-color="var(--glow)" stop-opacity=".72"/></linearGradient>
    </defs>
    <rect x="0" y="0" width="${Wd}" height="${hy}" fill="url(#vsky)"/>
    <g class="vsun"><path d="M ${Wd / 2 - r} ${(hy - rise).toFixed(1)} a ${r} ${r} 0 0 1 ${2 * r} 0 z" fill="url(#vsun)"/></g>
    <line x1="16" y1="${hy}" x2="${Wd - 16}" y2="${hy}" stroke="var(--glow)" stroke-opacity=".26" stroke-width="1.3"/>
    <line class="vland" x1="${((Wd - span) / 2).toFixed(1)}" y1="${hy}" x2="${((Wd + span) / 2).toFixed(1)}" y2="${hy}"
      stroke="var(--glow)" stroke-width="3.2" stroke-linecap="round"/>
    ${marks}
  </svg>
  <div class="vfoot"><span>${ar(lit)} من ${ar(skills.length)} مهارة مضيئة</span>
    <span class="num vpc">${ar(overallMastery())}٪</span></div>`;
}

/* ── ج · الخيط ── */
function vizThread() {
  const W = weeksOf(14);
  if (W.length < 2) return vizEmpty('الخيط يظهر بعد أسبوعين');
  const Wd = 330, H = 200, n = W.length, step = (Wd - 40) / (n - 1);
  const P = W.map(([s, a], i) => ({ x: 20 + i * step, y: H - 34 - (s ? a * (H - 70) : 0), s, a }));
  let segs = '';
  for (let i = 0; i < n - 1; i++) {
    const a = P[i], b = P[i + 1];
    const th = Math.max(1, 1 + ((Math.min(7, a.s) + Math.min(7, b.s)) / 2) * 0.85);
    const op = (!a.s || !b.s) ? 0.16 : 0.34 + ((a.a + b.a) / 2) * 0.66;
    segs += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"
      stroke="var(--glow)" stroke-opacity="${op.toFixed(2)}" stroke-width="${th.toFixed(1)}"
      stroke-linecap="round" class="vtl" style="--i:${i}"/>`;
  }
  const dots = P.map(p => p.s
    ? `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.3" fill="var(--glow)"/>`
    : `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.9" fill="none" stroke="var(--ink-faint)" stroke-width="1"/>`).join('');
  const first = W.find(x => x[0]), last = [...W].reverse().find(x => x[0]);
  const d = (first && last) ? Math.round((last[1] - first[1]) * 100) : 0;
  return `<svg viewBox="0 0 ${Wd} ${H}" class="vsvg">
    <line x1="14" y1="${H - 18}" x2="${Wd - 14}" y2="${H - 18}" stroke="var(--line)"/>
    ${segs}${dots}
  </svg>
  <div class="vfoot"><span>الارتفاع دقّتك · السُّمك مواظبتك</span>
    <span class="num">${d > 0 ? '+' : ''}${ar(d)} نقطة</span></div>`;
}

/* ── د · الشاهد ── */
function vizWitness() {
  const c = (S.corrected || []).filter(x => byQ(x.qid));
  if (!c.length) return vizEmpty('أول شاهد يظهر حين تُصيب سؤالًا أخطأتَ فيه');
  const pick = c[(S.day + (S.visits || 0)) % c.length];
  const q = byQ(pick.qid);
  const right = q.choices.find(x => x.c);
  const wrong = q.choices.find(x => !x.c && x.note);
  const gap = Math.max(1, pick.day - Math.max(0, pick.day - 14));
  return `<div class="vwit">
    <div class="wrow bad"><div class="wd">أخطأتَ فيه</div>
      <div class="wq">${esc(q.stem.slice(0, 80))}${q.stem.length > 80 ? '…' : ''}</div>
      ${wrong ? `<div class="wn">${esc(wrong.note)}</div>` : ''}</div>
    <div class="wrow good"><div class="wd">اليوم ${ar(pick.day)} — أصبتَه</div>
      <div class="wq">${esc(right ? right.t : '')}</div>
      <div class="wn">${esc(SKILLS[q.skill] ? SKILLS[q.skill].name : '')}</div></div>
    <p class="wpunch">هذا أنت.<br>لا رقم يقول هذا.</p>
  </div>
  <div class="vfoot"><span>${ar(c.length)} ${c.length === 1 ? 'شاهد' : 'شواهد'} حتى الآن</span>
    <span>يتبدّل كل يوم</span></div>`;
}

function vizEmpty(t) {
  return `<div class="vempty"><span class="vsp">✦</span><p>${esc(t)}</p></div>`;
}
function vizRender(id) {
  if (id === 'horizon') return vizHorizon();
  if (id === 'thread')  return vizThread();
  if (id === 'witness') return vizWitness();
  return vizRings();
}
function vizPane() {
  const id = S.vizMode || 'rings';
  const meta = VIZ.find(v => v.id === id) || VIZ[0];
  return `<div class="vhead"><div class="eyebrow">${esc(meta.b)}</div></div>
  <div class="vstage" key="${id}">${vizRender(id)}</div>
  <div class="vswitch">${VIZ.map(v => `<button class="vsw ${v.id === id ? 'on' : ''}"
    data-act="setViz" data-arg="${v.id}">${esc(v.n)}</button>`).join('')}</div>`;
}

/* ══════════ بطاقة التقدّم ══════════ */
function shareURL() {
  try {
    if (location.protocol.startsWith('http')) return location.origin + location.pathname.replace(/index\.html$/, '');
  } catch (e) {}
  return 'https://ufuq.app';
}
function drawCard() {
  const W = 1080, H = 1350, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const dark = !document.documentElement.dataset.mode || document.documentElement.dataset.mode !== 'day';
  const BG = dark ? '#0E1017' : '#F4F2EC', INK = dark ? '#E9E6DE' : '#1A1B20',
        SOFT = dark ? '#8C8779' : '#5C5A52', GOLD = dark ? '#E0D2B4' : '#7A6A46',
        LINE = dark ? 'rgba(233,230,222,.14)' : 'rgba(26,27,32,.14)';
  x.fillStyle = BG; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W/2, -120, 40, W/2, -120, 900);
  g.addColorStop(0, dark ? 'rgba(224,210,180,.10)' : 'rgba(122,106,70,.07)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, 700);
  x.textAlign = 'right'; x.direction = 'rtl';
  const M = W - 88;
  x.fillStyle = GOLD; x.font = '600 30px system-ui'; x.fillText('أُفق', M, 108);
  x.fillStyle = SOFT; x.font = '26px system-ui';
  x.fillText(TRACKS[S.track].name, M, 152);
  x.fillStyle = INK; x.font = '700 58px system-ui';
  x.fillText(esc(S.name || 'طالب') + '', M, 246);
  /* الحلقة */
  const p = overallMastery(), cx = 218, cy = 452, r = 128;
  x.lineWidth = 22; x.strokeStyle = LINE;
  x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  x.strokeStyle = GOLD; x.lineCap = 'round';
  x.beginPath(); x.arc(cx, cy, r, -Math.PI/2, -Math.PI/2 + Math.PI*2*p/100); x.stroke();
  x.textAlign = 'center'; x.fillStyle = INK; x.font = '700 74px system-ui';
  x.fillText(ar(p) + '٪', cx, cy + 24);
  x.textAlign = 'right';
  x.fillStyle = GOLD; x.font = '600 44px system-ui';
  x.fillText(masteryWord(p), M, 392);
  x.fillStyle = SOFT; x.font = '28px system-ui';
  x.fillText('إتقان ' + ar(mySkills().filter(s => hasContent(s.id)).length) + ' مهارة', M, 444);
  x.fillText(ar(S.streak || 0) + ' يومًا متتاليًا · ' + ar(S.sessionCount || 0) + ' جلسة', M, 494);
  /* أقوى خمس مهارات */
  let y = 640;
  x.fillStyle = LINE; x.fillRect(88, y - 46, W - 176, 2);
  x.fillStyle = SOFT; x.font = '24px system-ui'; x.fillText('أقوى مهاراتك', M, y);
  y += 56;
  mySkills().filter(s => hasContent(s.id))
    .map(s => ({ n: s.name, p: mastery(s.id) }))
    .sort((a, b) => b.p - a.p).slice(0, 5)
    .forEach(s => {
      x.fillStyle = INK; x.font = '30px system-ui'; x.fillText(s.n, M, y);
      x.fillStyle = LINE; x.fillRect(150, y - 14, 400, 12);
      x.fillStyle = GOLD; x.fillRect(150 + 400 * (1 - s.p / 100), y - 14, 400 * s.p / 100, 12);
      x.textAlign = 'left'; x.fillStyle = SOFT; x.font = '24px system-ui';
      x.fillText(ar(s.p) + '٪', 88, y); x.textAlign = 'right';
      y += 66;
    });
  /* رمز الاستجابة */
  const mtx = QRC.build(shareURL());
  if (mtx) {
    const n = mtx.length, cell = Math.floor(220 / n), size = cell * n;
    const qx = 88, qy = H - size - 132;
    x.fillStyle = dark ? '#E9E6DE' : '#FFFFFF';
    x.fillRect(qx - 14, qy - 14, size + 28, size + 28);
    x.fillStyle = '#0E1017';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
      if (mtx[r][c] === 1) x.fillRect(qx + c * cell, qy + r * cell, cell, cell);
    x.textAlign = 'left'; x.fillStyle = SOFT; x.font = '22px system-ui';
    x.fillText('امسح لتجرّبه', qx, qy + size + 44);
    x.textAlign = 'right';
  }
  x.fillStyle = SOFT; x.font = '26px system-ui';
  x.fillText('تدريب يوميّ على القدرات', M, H - 168);
  x.fillStyle = GOLD; x.font = '600 32px system-ui';
  x.fillText('أُفق', M, H - 122);
  return cv;
}
async function shareProgress() {
  let cv; try { cv = drawCard(); } catch (e) { return; }
  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if (!blob) return;
  const file = new File([blob], 'ufuq.png', { type: 'image/png' });
  const txt = `تقدّمي في أُفق — ${ar(overallMastery())}٪ · ${ar(S.streak || 0)} يومًا متتاليًا`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: txt }); return; } catch (e) { return; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ufuq-progress.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  window.open('https://wa.me/?text=' + encodeURIComponent(txt + ' — ' + shareURL()), '_blank');
}

/* ══════════ التثبيت ══════════
   أندرويد/كروم: يلتقط beforeinstallprompt فنعرض زرًّا حقيقيًّا.
   آيفون: لا واجهة برمجية للتثبيت — فنشرح الخطوة بالكلمات.
   وفي الحالين: صفحة الإعدادات تقول للمستخدم أين هو بالضبط. */
let deferredPrompt = null;
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const IS_ANDROID = /Android/.test(navigator.userAgent);
/* تشخيص حقيقيّ: نجلب البيان ونسأل عن التسجيل بدل الاعتماد على controller
   — الذي يبقى فارغًا في أول زيارة فيُوهم بالعطل. */
const DIAG = { https: false, manifest: null, sw: null, checked: false };
async function runDiag() {
  DIAG.https = location.protocol === 'https:' || location.hostname === 'localhost';
  try {
    const l = document.querySelector('link[rel="manifest"]');
    const r = await fetch(l ? l.getAttribute('href') : './manifest.webmanifest', { cache: 'no-store' });
    if (!r.ok) DIAG.manifest = 'خطأ ' + r.status;
    else { const j = await r.json();
      DIAG.manifest = (j.name && j.icons && j.icons.length >= 2 && j.start_url && j.display) ? true : 'ناقص'; }
  } catch (e) { DIAG.manifest = 'لم يُقرأ'; }
  if (!('serviceWorker' in navigator)) DIAG.sw = 'غير مدعوم';
  else if (!DIAG.https) DIAG.sw = 'يحتاج HTTPS';
  else { try { const rg = await navigator.serviceWorker.getRegistration();
      DIAG.sw = rg ? (rg.active ? true : 'يُسجَّل الآن') : 'لم يُسجَّل'; }
    catch (e) { DIAG.sw = 'خطأ'; } }
  DIAG.checked = true;
  try { if (S.screen === 'settings') render(); } catch (e) {}
}
setTimeout(runDiag, 1500); setTimeout(runDiag, 6000);
function isInstalled() {
  return window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.matchMedia && window.matchMedia('(display-mode: minimal-ui)').matches);
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e;
  try { S.installReady = true; if (!S.installAsked) render(); } catch (x) {}
});
window.addEventListener('appinstalled', () => {
  deferredPrompt = null; S.installed = true; S.installReady = false;
  try { render(); } catch (x) {}
});
async function doInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const r = await deferredPrompt.userChoice;
  deferredPrompt = null; S.installReady = false; S.installAsked = true;
  if (r && r.outcome === 'accepted') S.installed = true;
  saveState(); render();
  return true;
}
/* حالة التثبيت كما تظهر في الإعدادات */
function installState() {
  if (isInstalled() || S.installed) return { k: 'on', t: 'مثبَّت على جهازك', b: 'يفتح بملء الشاشة ويعمل بلا إنترنت.' };
  if (deferredPrompt) return { k: 'can', t: 'جاهز للتثبيت', b: 'يصير تطبيقًا مستقلًّا على جهازك، ويعمل بلا إنترنت.' };
  if (IS_IOS) return { k: 'ios', t: 'آيفون — التثبيت يدويّ',
    b: 'iOS لا يعطي التطبيقات زرّ تثبيت. في سفاري: المشاركة ⇧ أسفل الشاشة ← «إضافة إلى الشاشة الرئيسية».' };
  if (!DIAG.checked) return { k: 'no', t: 'نتحقّق…', b: 'لحظة واحدة.' };
  if (!DIAG.https) return { k: 'no', t: 'لا يمكن التثبيت من هنا',
    b: 'التثبيت يحتاج HTTPS. أنت تفتح التطبيق من ملفّ محلّيّ أو رابط غير آمن.' };
  if (DIAG.manifest !== true) return { k: 'no', t: 'بيان التطبيق لم يُقرأ',
    b: 'الحالة: ' + DIAG.manifest + ' — تأكّد أن manifest.webmanifest في المجلّد نفسه.' };
  if (DIAG.sw !== true) return { k: 'no', t: 'عامل الخدمة لم يعمل بعد',
    b: 'الحالة: ' + DIAG.sw + ' — أعد تحميل الصفحة مرّة واحدة ثم عُد إلى هنا.' };
  return { k: 'man', t: 'ثبّته من قائمة المتصفّح',
    b: IS_ANDROID
      ? 'الشروط الثلاثة سليمة. كروم يؤخّر زرّه التلقائي حتى تتصفّح قليلًا — اضغط ⋮ أعلى اليمين ثم «تثبيت التطبيق».'
      : 'الشروط الثلاثة سليمة. من قائمة المتصفّح اختر «تثبيت التطبيق».' };
}
function installCard() {
  const st = installState();
  return `<div class="inst ${st.k}">
    <div class="insh"><span class="insd"></span>${esc(st.t)}</div>
    <p class="insb">${esc(st.b)}</p>
    ${st.k === 'can' ? `<button class="btn" style="margin-top:12px" data-act="installNow">ثبّت أُفق الآن</button>` : ''}
  </div>`;
}
/* دعوة التثبيت في الرئيسة — مرّة واحدة، وبعد جلسة على الأقلّ */
function installInvite() {
  if (S.installAsked || S.installed || isInstalled()) return '';
  /* الحالة الأولى: المتصفّح جاهز — زرّ حقيقيّ يثبّت بضغطة */
  if (deferredPrompt) return `<div class="instinv">
    <div class="iih">ثبّت أُفق على جهازك</div>
    <p class="iib">يفتح بملء الشاشة، ويعمل بلا إنترنت، ولا تفقد تقدّمك.</p>
    <div class="iibt"><button data-act="laterInstall">ليس الآن</button>
      <button class="pri" data-act="installNow">ثبّته</button></div></div>`;
  /* الثانية: آيفون — لا واجهة برمجية للتثبيت في iOS، فالخطوة يدوية */
  if (IS_IOS) return `<div class="instinv">
    <div class="iih">ثبّت أُفق على شاشتك</div>
    <p class="iib">في سفاري: زرّ المشاركة <b>⇧</b> أسفل الشاشة ← «إضافة إلى الشاشة الرئيسية».
      آيفون لا يسمح للتطبيق أن يثبّت نفسه، فالخطوة عليك.</p>
    <div class="iibt"><button data-act="laterInstall">فهمت</button></div></div>`;
  /* الثالثة: أندرويد ولم يُطلق المتصفّح الحدث بعد — نشرح الطريق اليدويّ */
  if (location.protocol === 'https:') return `<div class="instinv">
    <div class="iih">ثبّت أُفق على جهازك</div>
    <p class="iib">من قائمة المتصفّح <b>⋮</b> أعلى الشاشة ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».
      وإن لم يظهر الخيار، أعِد تحميل الصفحة مرّة واحدة ثم جرّب.</p>
    <div class="iibt"><button data-act="laterInstall">لاحقًا</button></div></div>`;
  return '';
}

/* ── تشخيص التثبيت: يبيّن أيّ شرط ناقص بالضبط ── */
function installDiag() {
  if (!DIAG.checked) return '<div class="card" style="margin-top:10px"><p class="note" style="padding:0">نتحقّق من شروط التثبيت…</p></div>';
  const row = (ok, label, note) => {
    const good = ok === true;
    return `<div class="dgr"><span class="dgd ${good ? 'ok' : 'bad'}"></span>
      <span class="dgt">${esc(label)}</span>
      <span class="dgv">${good ? 'سليم' : esc(String(note !== undefined ? note : ok))}</span></div>`;
  };
  return `<div class="dgw" style="margin-top:10px">
    ${row(DIAG.https, 'اتّصال آمن HTTPS', 'غير آمن — التثبيت مستحيل')}
    ${row(DIAG.manifest, 'بيان التطبيق', DIAG.manifest)}
    ${row(DIAG.sw, 'عامل الخدمة', DIAG.sw)}
    ${row(!!deferredPrompt, 'زرّ التثبيت التلقائي', IS_IOS ? 'آيفون — يدويّ دائمًا' : 'لم يصل — ثبّت من ⋮')}
    ${row(isInstalled() || S.installed, 'مثبَّت الآن', 'لا')}
    <p class="note" style="padding:10px 0 0">إن بقي التثبيت متعثّرًا، أرسل صورة هذه اللوحة.</p>
  </div>`;
}

/* ── تلميح التثبيت على آيفون: يظهر مرّة واحدة في سفاري ── */
/* ── الصفّ الدراسي: التحصيلي ٢٠٪ أول و٣٠٪ ثانٍ و٥٠٪ ثالث.
      طالب الثاني الثانوي لم يدرس نصف الاختبار بعد — والصدق هنا أنفع من التهويل. ── */
const GRADES = [
  { id: 'g1', name: 'الأول الثانوي',  covered: 20 },
  { id: 'g2', name: 'الثاني الثانوي', covered: 50 },
  { id: 'g3', name: 'الثالث الثانوي', covered: 100 }
];
function gradeCard() {
  if (S.grade || !S.name || S.sessionCount < 1) return '';
  return `<div class="gradec">
    <div class="grh">في أيّ صفّ أنت؟</div>
    <p class="grb">يغيّر هذا ما أتوقّعه منك — لا ما أعرضه عليك.</p>
    <div class="grbt">${GRADES.map(g =>
      `<button data-act="setGrade" data-arg="${g.id}">${esc(g.name)}</button>`).join('')}</div>
  </div>`;
}
function gradeNote() {
  if (!S.grade || S.track !== 'tahsili') return '';
  const g = GRADES.find(x => x.id === S.grade);
  if (!g || g.covered >= 100) return '';
  return `<p class="faint" style="margin-top:10px">أنت في ${esc(g.name)} — ونحو ${ar(100 - g.covered)}٪ من التحصيلي
    من مقرّرٍ لم تدرسه بعد. ما تراه الآن هو ما تستطيع إتقانه اليوم، والباقي يأتي في وقته.</p>`;
}
function iosHint() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const stand = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (!isIOS || stand || S.iosHinted) return '';
  return `<div class="ioshint" data-act="dismissIOS">
    <div class="ioh">ثبّت أُفق على شاشتك</div>
    <p class="iob">اضغط زرّ المشاركة في سفاري ثم «إضافة إلى الشاشة الرئيسية».
      يفتح حينها بملء الشاشة، ويحفظ تقدّمك بأمان أكبر.</p>
    <span class="ioa">فهمت ✕</span></div>`;
}

/* عامل الخدمة: يعمل فقط عند التقديم من خادم — ويُتجاهَل بأمان من ملفّ محلّيّ */
/* ══════ كشف التحديث ══════
   حين يجد عامل الخدمة نسخةً جديدة ننبّه الطالب بشريط هادئ لا يقطع عمله.
   ولا يُطبَّق التحديث إلا بضغطه — فلا تُفقَد جلسةٌ جارية. */
let SW_WAITING = null;
function showUpdateBar() {
  if (document.getElementById('updbar')) return;
  const d = document.createElement('div');
  d.id = 'updbar';
  d.innerHTML = '<span class="ub-t">تتوفّر نسخة جديدة من أُفق</span>' +
    '<button class="ub-b" id="ubgo">تحديث</button>' +
    '<button class="ub-x" id="ubno" aria-label="لاحقًا">✕</button>';
  document.body.appendChild(d);
  document.getElementById('ubgo').onclick = () => {
    /* الحفظ أولًا دائمًا — لا يُحدَّث التطبيق وفي الذاكرة عملٌ لم يُكتب */
    try { saveState(); } catch (e) {}
    if (S.session && !S.session.done) {
      const bar = document.getElementById('updbar');
      if (bar && !bar.dataset.warned) {
        bar.dataset.warned = '1';
        bar.querySelector('.ub-t').textContent =
          'أنت في جلسة. تقدّمك محفوظ — اضغط مرّة أخرى للتحديث.';
        bar.querySelector('.ub-b').textContent = 'حدّث الآن';
        return;
      }
    }
    try { if (SW_WAITING) SW_WAITING.postMessage('skipWaiting'); } catch (e) {}
    setTimeout(() => location.reload(), 400);
  };
  document.getElementById('ubno').onclick = () => d.remove();
}
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (window.__reloading) return; window.__reloading = true; location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      INSTALL_DIAG.sw = true;
      if (reg.waiting) { SW_WAITING = reg.waiting; showUpdateBar(); }
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            SW_WAITING = nw; showUpdateBar();
          }
        });
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) { try { reg.update(); } catch (e) {} }
      });
    }).catch(() => { INSTALL_DIAG.sw = false; });
  });
}

/* ---------- boot ---------- */
if (!loadState()) S = freshState();
applyTheme();
if (S.theme === 'breathe') breatheStart();
render();
saveState();
// اختصار: #home أو #progress في العنوان يقفز مباشرة
if (location.hash.length > 1) { try { devScreen(location.hash.slice(1)); } catch (e) {} }
