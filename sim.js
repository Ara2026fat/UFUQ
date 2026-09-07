/* ══════════════════ محاكي أُفق ══════════════════
   طلابٌ افتراضيّون بأحوال مختلفة، وقفزٌ إلى أيّ شاشة.
   ملفّ منفصل تمامًا — لا يمسّ التطبيق ولا يُرفع مع النسخة الحقيقية.
   ═══════════════════════════════════════════════ */
(function () {

function rnd(a, b) { return a + Math.random() * (b - a); }
function seedSkills(st, level) {
  const ids = mySkills().map(x => x.id);
  ids.forEach((id, i) => {
    const k = st.skills[id];
    if (!k) return;
    const p = ids.length > 1 ? i / (ids.length - 1) : 0;
    const reach = level * (1.25 - p * 0.55);        // الأوائل أعمق
    if (reach < 0.12) { k.status = 'new'; return; }
    const n = Math.min(15, Math.round(reach * 14));
    const acc = Math.max(0.35, Math.min(0.95, 0.45 + reach * 0.45 + rnd(-0.07, 0.07)));
    k.window = Array.from({ length: n }, () => Math.random() < acc);
    k.days = Array.from({ length: Math.min(9, Math.max(1, Math.round(reach * 8))) },
      (_, d) => Math.max(1, st.day - d * 3));
    k.first = Math.max(1, st.day - Math.round(reach * 40));
    k.last = st.day - Math.floor(Math.random() * 3);
    k.times = Array.from({ length: Math.min(12, n) }, () => Math.round(rnd(16, 55)));
    k.status = acc > 0.82 && n >= 10 ? 'mastered' : acc > 0.72 ? 'near' : 'building';
  });
}
function seedHistory(st, weeks, gapWeeks) {
  st.history = [];
  for (let w = weeks - 1; w >= 0; w--) {
    if (gapWeeks.includes(w)) continue;
    const per = Math.round(rnd(4, 8));
    for (let j = 0; j < per; j++) {
      const day = Math.max(1, st.day - w * 7 - Math.floor(rnd(0, 7)));
      const total = 30, base = 0.52 + (weeks - w) / weeks * 0.30;
      st.history.unshift({ day, right: Math.round(total * Math.max(0.35, Math.min(0.96, base + rnd(-0.08, 0.08)))),
        total, pace: Math.round(rnd(28, 55)), items: [] });
    }
  }
  st.history.sort((a, b) => b.day - a.day);
  st.sessionCount = st.history.length;
}
function seedCorrected(st, n) {
  const pool = Q.filter(q => mySkills().some(s => s.id === q.skill));
  st.corrected = [];
  for (let i = 0; i < n && i < pool.length; i++) {
    const q = pool[Math.floor(Math.random() * pool.length)];
    st.corrected.push({ qid: q.id, day: Math.max(2, st.day - Math.round(rnd(1, 25))) });
  }
}
function seedReview(st, n) {
  const pool = Q.filter(q => mySkills().some(s => s.id === q.skill));
  st.review = [];
  for (let i = 0; i < n && i < pool.length; i++) {
    const q = pool[Math.floor(Math.random() * pool.length)];
    st.review.push({ qid: q.id, due: st.day + Math.round(rnd(-1, 6)), box: Math.round(rnd(1, 3)) });
  }
}

const PEOPLE = [
  { n: 'يومه الأول', b: 'لم يبدأ بعد', make(s) {
      s.name = 'سعد'; s.day = 0; s.streak = 0; s.sessionCount = 0; s.diag = null;
      s.screen = 'plan';
  }},
  { n: 'أسبوع', b: '٦ جلسات · بداية', make(s) {
      s.name = 'عبدالله'; s.day = 7; s.streak = 5; s.diag = { done: true };
      seedHistory(s, 1, []); seedSkills(s, 0.22); seedReview(s, 4); seedCorrected(s, 1);
      s.grade = 'g2'; s.screen = 'home';
  }},
  { n: 'شهر · انقطاع', b: '٤ أسابيع فيها أسبوع فارغ', make(s) {
      s.name = 'ريّان'; s.day = 30; s.streak = 6; s.diag = { done: true };
      seedHistory(s, 5, [2]); seedSkills(s, 0.48); seedReview(s, 9); seedCorrected(s, 5);
      s.grade = 'g2'; s.notes = [{ day: 29, text: 'أبطئ في المقارنات ولا تستعجل' }];
      s.lastExamDay = 18; s.examLog = [{ day: 18, right: 58, total: 110 }];
      s.screen = 'home';
  }},
  { n: 'شهران · متقدّم', b: 'اختباران · شواهد', make(s) {
      s.name = 'فيصل'; s.day = 62; s.streak = 19; s.diag = { done: true };
      seedHistory(s, 9, [4]); seedSkills(s, 0.82); seedReview(s, 12); seedCorrected(s, 11);
      s.grade = 'g3';
      s.lastExamDay = 48; s.examLog = [{ day: 12, right: 55, total: 110 },
        { day: 26, right: 63, total: 110 }, { day: 48, right: 78, total: 110 }];
      s.notes = [{ day: 61, text: 'راجع الأخطاء قبل النوم' }];
      s.qMiss = {}; s.screen = 'home';
  }},
  { n: 'متعثّر', b: 'دقّة منخفضة · انقطاعات', make(s) {
      s.name = 'ماجد'; s.day = 34; s.streak = 2; s.diag = { done: true };
      seedHistory(s, 5, [1, 3]); seedSkills(s, 0.30); seedReview(s, 14); seedCorrected(s, 2);
      s.grade = 'g1';
      mySkills().slice(0, 4).forEach(x => { const k = s.skills[x.id];
        if (k) { k.window = [false, false, true, false, false, true, false]; k.status = 'building'; } });
      s.screen = 'home';
  }},
  { n: 'قبل الاختبار', b: 'أسبوع متبقٍّ', make(s) {
      s.name = 'نايف'; s.day = 53; s.examDays = 60; s.streak = 24; s.diag = { done: true };
      seedHistory(s, 8, []); seedSkills(s, 0.9); seedReview(s, 6); seedCorrected(s, 14);
      s.grade = 'g3'; s.lastExamDay = 39;
      s.examLog = [{ day: 11, right: 61, total: 110 }, { day: 25, right: 72, total: 110 },
        { day: 39, right: 84, total: 110 }];
      s.screen = 'home';
  }}
];

const PLACES = [
  ['home', 'الرئيسة', s => { s.screen = 'home'; }],
  ['plan', 'الخطّة', s => { s.screen = 'plan'; }],
  ['progress0', 'التطوّر', s => { s.screen = 'progress'; s.prTab = 0; }],
  ['progress1', 'الخريطة', s => { s.screen = 'progress'; s.prTab = 1; }],
  ['progress2', 'الرحلة', s => { s.screen = 'progress'; s.prTab = 2; }],
  ['errors', 'أخطاؤك', s => { s.screen = 'errors'; }],
  ['lesson', 'فكرة', s => { const ids = Object.keys(LESSONS.lessons);
      s.lessonFor = ids[Math.floor(Math.random() * ids.length)];
      s.lessonTab = 0; s.exPick = null; s.exPickFor = null; s.screen = 'lesson'; }],
  ['session', 'جلسة', s => { try { ACTIONS.startSession(); } catch (e) { s.screen = 'home'; } }],
  ['summary', 'النتيجة', s => { const a = mySkills()[0];
      s.lastSummary = { right: 23, total: 30, skill: a && a.id, changed: a ? [a.id] : [],
        wrongQ: (qBySkill[a && a.id] || []).slice(0, 4).map(q => q.id), resume: false,
        duelWon: true, stopped: false };
      s.screen = 'summary'; }],
  ['exam', 'محاكاة', s => { try { examStart('mini'); } catch (e) { s.screen = 'home'; } }],
  ['settings0', 'إعدادات', s => { s.screen = 'settings'; s.setTab = 0; }],
  ['settings4', 'عن أُفق', s => { s.screen = 'settings'; s.setTab = 4; }]
];

const VIZS = [['rings', 'حلقات'], ['horizon', 'أفق'], ['thread', 'خيط'], ['witness', 'شاهد']];

let who = 3;
function apply(i) {
  who = i;
  const fresh = freshState();
  fresh.track = S.track || 'qudurat';
  fresh.theme = S.theme || 'night';
  fresh.vizMode = S.vizMode || 'rings';
  fresh.devUnlocked = true;
  S = fresh;
  ensureSkills();
  try { PEOPLE[i].make(S); } catch (e) { console.error(e); }
  applyTheme(); render(); paint();
}
function jump(fn) { try { fn(S); } catch (e) { console.error(e); } render(); paint(); }

function paint() {
  const bar = document.getElementById('simbar');
  if (!bar) return;
  const p = PEOPLE[who];
  bar.innerHTML =
    '<div class="simhead"><b>محاكي أُفق</b>' +
      '<span>' + p.n + ' · ' + p.b + '</span>' +
      '<button id="simmin">–</button></div>' +
    '<div class="simrow">' + PEOPLE.map((x, i) =>
      '<button class="simb' + (i === who ? ' on' : '') + '" data-p="' + i + '">' + x.n + '</button>').join('') + '</div>' +
    '<div class="simrow">' + PLACES.map((x, i) =>
      '<button class="simb sm" data-s="' + i + '">' + x[1] + '</button>').join('') + '</div>' +
    '<div class="simrow">' + VIZS.map(v =>
      '<button class="simb sm' + (S.vizMode === v[0] ? ' on' : '') + '" data-v="' + v[0] + '">' + v[1] + '</button>').join('') +
      TRACKS_LIST().map(t =>
      '<button class="simb sm' + (S.track === t.id ? ' on' : '') + '" data-t="' + t.id + '">' + t.name + '</button>').join('') +
    '</div>';
}
function TRACKS_LIST() {
  return Object.keys(TRACKS).map(k => ({ id: k, name: TRACKS[k].name }));
}

function init() {
  const bar = document.createElement('div');
  bar.id = 'simbar';
  document.body.appendChild(bar);
  const css = document.createElement('style');
  css.textContent =
    '#simbar{position:fixed;inset-inline:0;bottom:0;z-index:999;background:#0A0C12;' +
      'border-top:1px solid rgba(255,255,255,.12);padding:8px 10px calc(8px + env(safe-area-inset-bottom));' +
      'font-family:system-ui;direction:rtl;box-shadow:0 -12px 32px rgba(0,0,0,.5);transition:transform .3s}' +
    '#simbar.min{transform:translateY(calc(100% - 34px))}' +
    '.simhead{display:flex;align-items:center;gap:10px;font-size:12px;color:#8C8779;margin-bottom:7px}' +
    '.simhead b{color:#E0D2B4;font-size:12.5px}' +
    '.simhead span{flex:1;font-size:11px;color:#67635A}' +
    '#simmin{background:none;border:1px solid rgba(255,255,255,.15);color:#8C8779;border-radius:8px;' +
      'width:26px;height:22px;cursor:pointer;font-size:14px;line-height:1}' +
    '.simrow{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:5px}' +
    '.simb{flex:1 1 auto;padding:7px 9px;border-radius:9px;background:rgba(255,255,255,.05);' +
      'border:1px solid rgba(255,255,255,.09);color:#B9B4A6;font-family:inherit;font-size:11.5px;cursor:pointer}' +
    '.simb.sm{font-size:11px;padding:6px 8px}' +
    '.simb.on{background:rgba(224,210,180,.16);border-color:#E0D2B4;color:#E0D2B4}' +
    '#app{padding-bottom:150px !important}';
  document.head.appendChild(css);
  bar.addEventListener('click', function (e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'simmin') { bar.classList.toggle('min'); b.textContent = bar.classList.contains('min') ? '+' : '–'; return; }
    if (b.dataset.p != null) return apply(+b.dataset.p);
    if (b.dataset.s != null) return jump(PLACES[+b.dataset.s][2]);
    if (b.dataset.v) { S.vizMode = b.dataset.v; S.screen = 'progress'; S.prTab = 0; return jump(function () {}); }
    if (b.dataset.t) { try { saveTrack(); loadTrack(b.dataset.t); S.track = b.dataset.t; } catch (x) { S.track = b.dataset.t; }
      return jump(function (s) { s.screen = 'home'; }); }
  });
  apply(3);
}
if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 60);
else window.addEventListener('DOMContentLoaded', function () { setTimeout(init, 60); });
})();
