import { h } from '../../core/dom.js';
import { qn, mn } from '../../core/plural.js';
import { rich } from '../../core/math.js';
import { repo } from '../../store/repo.js';
import { QuestionCard, optionsOf, stepsList } from '../../components/question.js';
import { loadAllBanks } from '../../store/bank.js';
import * as eng from '../../engine/engine.js';
import { examOpen } from '../../core/trial.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const two = (n) => String(n).padStart(2, '0');
const clock = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return AR(two(Math.floor(t / 60)) + ':' + two(t % 60)); };
const clockH = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return AR(Math.floor(t / 3600) + ':' + two(Math.floor((t % 3600) / 60)) + ':' + two(t % 60)); };
const PART = { quant: 'كمي', verbal: 'لفظي' };
const GAP = 60000;                                   // فاصل ثابت بين الأقسام، ثم يبدأ القسم التالي تلقائياً
const LIVE = 'qk_exam_live';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(LIVE) || 'null'); } catch (e) { return null; } },
  set(v) { try { v ? localStorage.setItem(LIVE, JSON.stringify(v)) : localStorage.removeItem(LIVE); } catch (e) { /* */ } },
};

/**
 * محاكاة الاختبار الفعلية: أقسام بمؤقّت لكل قسم، الوقت لا يتوقف، ينتهي القسم تلقائياً بانتهائه،
 * لا رجوع إلى قسم انتهى، ولا ظهور للإجابة أو الشرح إلا بعد نهاية الاختبار كله.
 * الحالة تُحفظ على الجهاز: لو خرج الطالب أو أُغلقت الصفحة يستمر العدّ ويعود إلى اختباره.
 */
export function examView() {
  const root = h('div', { class: 'exam-root' }, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  loadAllBanks().then(() => eng.loadGraph()).then(() => { eng.state(); init(); });
  let E = null, timer = null;

  /* ---------- حالة ---------- */
  function persist() {
    if (!E) return;
    store.set({ mode: E.mode, sec: E.sec, phase: E.phase, ids: E.items.map((q) => q.id), answers: E.answers, flag: [...E.flag], idx: E.idx,
      startedAt: E.startedAt, endsAt: E.endsAt, nextAt: E.nextAt, seen: [...E.seen], began: E.began,
      secs: E.secs.map((s) => ({ n: s.n, right: s.right, total: s.total, blank: s.blank, used: s.used, part: s.part, rows: s.rows.map((r) => [r.q.id, r.picked]) })) });
  }
  function restore(L) {
    const spec = eng.EXAMS[L.mode]; if (!spec) return false;
    const secs = (L.secs || []).map((s) => ({ ...s, rows: s.rows.map(([id, picked]) => ({ q: repo.get(id), picked })).filter((r) => r.q) }));
    E = { mode: L.mode, spec, sec: L.sec, phase: L.phase, items: (L.ids || []).map((id) => repo.get(id)).filter(Boolean), answers: L.answers || {}, flag: new Set(L.flag || []), idx: L.idx || 0,
      startedAt: L.startedAt, endsAt: L.endsAt, nextAt: L.nextAt, seen: new Set(L.seen || []), secs, began: L.began || Date.now() };
    return true;
  }
  function live(on) {
    document.body.classList.toggle('exam-live', on);
    window.onbeforeunload = on ? (e) => { e.preventDefault(); e.returnValue = ''; return ''; } : null;
  }
  function stop() { clearInterval(timer); timer = null; live(false); }
  const partName = (items) => { const s = new Set(items.map((q) => eng.partOf(eng.skillOf(q)))); return s.size === 1 ? PART[[...s][0]] : 'مختلط'; };

  /* ---------- البداية ---------- */
  function init() {
    const L = store.get();
    if (L && restore(L)) return resume();
    start();
  }
  function resume() {
    const left = E.phase === 'run' ? E.endsAt - Date.now() : null;
    root.replaceChildren(
      h('div', { class: 'card stack', style: 'text-align:center' },
        h('h2', null, 'لديك اختبار جارٍ'),
        h('p', { class: 'muted' }, `${E.spec.name} — القسم ${AR(E.sec + 1)} من ${AR(E.spec.sections)}. الوقت لا يتوقف أثناء غيابك.`),
        left != null ? h('p', null, left > 0 ? `المتبقي من القسم: ${clock(left)}` : 'انتهى وقت هذا القسم أثناء غيابك.') : null,
        h('button', { class: 'btn primary', type: 'button', onClick: advance }, 'تابع الاختبار'),
        h('button', { class: 'btn ghost', type: 'button', onClick: () => leave(true) }, 'انسحاب من الاختبار')));
  }
  function start() {
    stop(); E = null;
    const info = eng.examInfo();
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', null, 'محاكاة الاختبار'), h('p', null, 'اختبار فعلي بشروط الاختبار الحقيقي: وقت محدد لكل قسم، بلا شرح أثناء الحل، ولا رجوع إلى قسم انتهى.')),
      info.sinceLast != null && info.sinceLast >= 14 ? h('div', { class: 'pending-note' }, `مضى ${AR(info.sinceLast)} يوماً على آخر نموذج كامل، وحان موعد نموذج جديد.`) : null,
      h('div', { class: 'stack' }, Object.entries(eng.EXAMS).map(([k, sp]) => h('button', { class: 'card stack', type: 'button', style: 'text-align:start;cursor:pointer', onClick: () => (examOpen(k) ? intro(k) : toastLock()) },
        h('b', null, (examOpen(k) ? '' : 'مقفل: ') + sp.name), h('span', { class: 'muted small' }, `${sp.sections > 1 ? AR(sp.sections) + ' أقسام' : 'قسم واحد'} — ${qn(sp.per)} — ${mn(sp.mins)} للقسم`), h('span', { class: 'small' }, sp.note)))),
      info.log.length ? h('section', { class: 'card stack' }, h('h3', null, 'نتائجك السابقة'),
        ...info.log.slice().reverse().map((l) => h('div', { class: 'row between small' }, h('span', null, `${eng.EXAMS[l.mode]?.name || l.mode} — اليوم ${AR(l.day + 1)}`), h('b', null, `${AR(l.right)} / ${AR(l.total)}`)))) : null);
  }
  function toastLock() { const b = root.querySelector('.ex-lock') || h('div', { class: 'pending-note ex-lock' }); b.textContent = 'هذا النموذج في الدورة الكاملة. في التجربة المجانية جرّب «القسم المصغّر».'; if (!b.isConnected) root.prepend(b); }

  /* ---------- تعليمات قبل البدء (لا يبدأ الوقت قبل الضغط) ---------- */
  function intro(mode) {
    const sp = eng.EXAMS[mode], totalQ = sp.sections * sp.per, totalMin = sp.sections * sp.mins;
    const rules = [
      `${qn(totalQ)} في ${sp.sections > 1 ? AR(sp.sections) + ' أقسام' : 'قسم واحد'}${sp.sections > 1 ? `، ${qn(sp.per)} لكل قسم` : ''}.`,
      `لكل قسم مؤقّت ${mn(sp.mins)}، ويُغلق القسم تلقائياً عند انتهاء وقته.${sp.sections > 1 ? ` المجموع ${mn(totalMin)}.` : ''}`,
      'تتنقّل بين أسئلة القسم الواحد وتغيّر إجاباتك بحرية، لكن إذا انتقلت إلى قسم جديد فلا عودة إلى ما قبله.',
      'الوقت لا يتوقف: لو خرجتَ من الصفحة يستمر العدّ.',
      'لا تظهر الإجابة الصحيحة ولا الشرح إلا بعد نهاية الاختبار.',
      'يُمنع استخدام الآلة الحاسبة والجوال. جهّز ورقة وقلماً للحل.',
    ];
    if (sp.sections > 1) rules.splice(3, 0, 'بين كل قسمين فاصل قصير، ثم يبدأ القسم التالي تلقائياً.');
    root.replaceChildren(
      h('div', { class: 'card stack' },
        h('h2', null, sp.name),
        h('p', { class: 'muted' }, 'اقرأ التعليمات، فالوقت يبدأ لحظة الضغط على «ابدأ الاختبار».'),
        h('ul', { class: 'ex-rules' }, rules.map((r) => h('li', null, r))),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onClick: () => begin(mode) }, 'ابدأ الاختبار'),
          h('button', { class: 'btn ghost', type: 'button', onClick: start }, 'رجوع'))));
  }
  function begin(mode) {
    const spec = eng.EXAMS[mode];
    E = { mode, spec, sec: 0, phase: 'run', items: [], answers: {}, flag: new Set(), idx: 0, startedAt: 0, endsAt: 0, nextAt: 0, seen: new Set(), secs: [], began: Date.now() };
    live(true); openSection(Date.now());
  }
  function openSection(at) {
    E.items = eng.buildExamSection(E.spec, E.sec, E.seen);
    if (!E.items.length) { stop(); store.set(null); root.replaceChildren(h('div', { class: 'empty' }, h('h2', null, 'لا أسئلة كافية'), h('button', { class: 'btn', type: 'button', onClick: start }, 'رجوع'))); return; }
    E.phase = 'run'; E.idx = 0; E.answers = {}; E.flag = new Set(); E.startedAt = at; E.endsAt = at + E.spec.mins * 60000;
    persist(); runTimer(); show();
  }
  /** متابعة اختبار محفوظ: يستهلك الوقت الذي مضى أثناء الغياب (أقسام انتهت أو فاصل انقضى). */
  function advance() {
    live(true);
    for (let guard = 0; guard < 12; guard++) {
      const now = Date.now();
      if (E.phase === 'run' && now >= E.endsAt) { if (finishSection(E.endsAt)) return; continue; }
      if (E.phase === 'gap' && now >= E.nextAt) { E.sec++; E.phase = 'run'; E.items = eng.buildExamSection(E.spec, E.sec, E.seen); E.idx = 0; E.answers = {}; E.flag = new Set(); E.startedAt = E.nextAt; E.endsAt = E.nextAt + E.spec.mins * 60000; continue; }
      break;
    }
    persist(); runTimer(); E.phase === 'gap' ? showGap() : show();
  }

  /* ---------- المؤقّت ---------- */
  function runTimer() { clearInterval(timer); timer = setInterval(tick, 500); tick(); }
  function tick() {
    if (!E || !root.isConnected) { clearInterval(timer); timer = null; live(false); return; }     // خرج الطالب: الحالة محفوظة والعدّ يستمر
    const now = Date.now();
    if (E.phase === 'gap') {
      const l = E.nextAt - now, g = root.querySelector('#exGap');
      if (l <= 0) { advance(); return; }
      if (g) g.textContent = clock(l);
      return;
    }
    const left = E.endsAt - now, c = root.querySelector('#exClock'), t = root.querySelector('#exTotal');
    if (c) { c.textContent = clock(left); c.classList.toggle('low', left <= 300000); c.classList.toggle('crit', left <= 60000); }
    if (t) t.textContent = clockH(left + (E.spec.sections - E.sec - 1) * E.spec.mins * 60000);
    const b = root.querySelector('#exBar'); if (b) b.style.width = Math.max(0, Math.min(100, left / (E.spec.mins * 600))) + '%';
    if (left <= 0) finishSection(E.endsAt);
  }

  /* ---------- شاشة القسم ---------- */
  function show() {
    const q = E.items[E.idx], total = E.items.length;
    const card = QuestionCard(q, { onPick: (i) => { E.answers[q.id] = i; persist(); mark(); pal(); count(); } });
    const mark = () => card.el.querySelectorAll('.opt').forEach((b, i) => b.classList.toggle('picked', E.answers[q.id] === i));
    mark();
    const grid = h('div', { class: 'ex-pal' });
    const pal = () => grid.replaceChildren(...E.items.map((x, i) => h('button', { type: 'button', 'aria-label': `السؤال ${AR(i + 1)}`,
      class: `ex-q${i === E.idx ? ' cur' : ''}${E.answers[x.id] != null ? ' done' : ''}${E.flag.has(x.id) ? ' flag' : ''}`, onClick: () => { E.idx = i; persist(); show(); } }, AR(i + 1))));
    pal();
    const cnt = h('small', { class: 'muted', id: 'exCnt' });
    const count = () => { cnt.textContent = `أجبتَ عن ${AR(E.items.filter((x) => E.answers[x.id] != null).length)} من ${AR(total)}`; };
    count();
    const part = partName(E.items);
    root.replaceChildren(
      h('div', { class: 'ex-top' },
        h('div', { class: 'stack', style: 'gap:2px' },
          h('b', null, `القسم ${AR(E.sec + 1)} من ${AR(E.spec.sections)} — ${part}`),
          E.spec.sections > 1 ? h('small', { class: 'muted' }, 'المتبقي للاختبار كله ', h('span', { id: 'exTotal', dir: 'ltr' }, clockH(E.endsAt - Date.now() + (E.spec.sections - E.sec - 1) * E.spec.mins * 60000))) : null),
        h('b', { id: 'exClock', class: 'ex-clock', dir: 'ltr' }, clock(E.endsAt - Date.now()))),
      h('div', { class: 'bar' }, h('i', { id: 'exBar', style: 'width:100%' })),
      h('div', { class: 'card stack' }, h('div', { class: 'row between' }, h('small', { class: 'muted' }, `السؤال ${AR(E.idx + 1)} من ${AR(total)}`), cnt), card.el),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', disabled: E.idx === 0 || null, onClick: () => { E.idx--; persist(); show(); } }, 'السابق'),
        h('button', { class: 'btn', type: 'button', onClick: () => { E.flag.has(q.id) ? E.flag.delete(q.id) : E.flag.add(q.id); persist(); show(); } }, E.flag.has(q.id) ? 'إلغاء العلامة' : 'علّم للعودة'),
        E.idx < total - 1 ? h('button', { class: 'btn primary', type: 'button', onClick: () => { E.idx++; persist(); show(); } }, 'التالي') : h('button', { class: 'btn accent', type: 'button', onClick: confirmEnd }, 'إنهاء القسم')),
      grid,
      h('div', { class: 'row between' },
        h('small', { class: 'muted' }, 'تنقّل بحرية داخل القسم. بعد إنهائه لا رجوع إليه.'),
        h('button', { class: 'btn sm ghost', type: 'button', onClick: confirmLeave }, 'انسحاب')));
    tick();
  }
  function ask(msg, yesText, onYes) {
    const box = h('div', { class: 'ex-sheet', role: 'dialog' },
      h('div', { class: 'card stack' }, h('p', null, msg),
        h('div', { class: 'row' }, h('button', { class: 'btn accent', type: 'button', onClick: () => { box.remove(); onYes(); } }, yesText), h('button', { class: 'btn', type: 'button', onClick: () => box.remove() }, 'إلغاء'))));
    root.append(box);
  }
  function confirmEnd() {
    const blank = E.items.filter((q) => E.answers[q.id] == null).length, flagged = E.flag.size;
    ask(`${blank ? `بقي ${qn(blank)} بلا إجابة. ` : ''}${flagged ? `لديك ${qn(flagged)} معلَّم للعودة. ` : ''}أتنهي القسم؟ لا رجوع إليه بعد ذلك.`, 'إنهاء القسم', () => finishSection(Date.now()));
  }
  function confirmLeave() { ask('الانسحاب يلغي هذا الاختبار ولا تُحتسب نتيجته. أتنسحب؟', 'انسحاب', () => leave(false)); }
  function leave() { stop(); store.set(null); E = null; start(); }

  /* ---------- نهاية القسم ---------- */
  /** يُرجع true حين انتهى الاختبار كله (عُرضت النتيجة). */
  function finishSection(at) {
    const used = Math.max(0, Math.min(E.spec.mins * 60000, at - E.startedAt));
    const rows = E.items.map((q) => ({ q, picked: E.answers[q.id] ?? null }));
    rows.forEach(({ q, picked }) => { if (picked != null) { const ok = picked === q.answer; eng.record(q, ok, { picked, ms: 0 }); repo.recordAttempt({ qid: q.id, topic: q.topic, choice: picked, correct: ok, ms: 0, mode: 'exam' }); } });
    const right = rows.filter((r) => r.picked === r.q.answer).length;
    E.secs.push({ n: E.sec + 1, part: partName(E.items), right, total: rows.length, blank: rows.filter((r) => r.picked == null).length, used, rows });
    E.items.forEach((q) => E.seen.add(q.id));
    if (E.sec + 1 >= E.spec.sections) { done(); return true; }
    E.phase = 'gap'; E.nextAt = at + GAP; E.items = []; E.answers = {}; E.flag = new Set();
    persist();
    if (Date.now() < E.nextAt) showGap();
    return false;
  }
  function showGap() {
    const nextPart = E.spec.alt[(E.sec + 1) % E.spec.alt.length];
    const last = E.secs[E.secs.length - 1];
    root.replaceChildren(h('div', { class: 'card stack', style: 'text-align:center' },
      h('h2', null, `انتهى القسم ${AR(E.sec + 1)}`),
      h('p', { class: 'muted' }, `القسم ${AR(E.sec + 2)} (${PART[nextPart] || 'مختلط'}) يبدأ تلقائياً بعد`),
      h('div', { class: 'ex-clock big', id: 'exGap', dir: 'ltr' }, clock(E.nextAt - Date.now())),
      h('p', { class: 'small muted' }, 'لا تظهر النتيجة إلا في نهاية الاختبار، ولا رجوع إلى القسم المنتهي.'),
      h('button', { class: 'btn primary', type: 'button', onClick: () => { E.nextAt = Date.now(); advance(); } }, 'ابدأ القسم التالي الآن')));
    void last;
  }

  /* ---------- النتيجة ---------- */
  function done() {
    stop(); store.set(null);
    const R = E.secs.reduce((a, x) => a + x.right, 0), T = E.secs.reduce((a, x) => a + x.total, 0), pct = T ? Math.round((R / T) * 100) : 0;
    const usedAll = E.secs.reduce((a, x) => a + x.used, 0);
    eng.logExam({ day: eng.today(), mode: E.mode, right: R, total: T });
    const bySkill = {};
    E.secs.forEach((s) => s.rows.forEach(({ q, picked }) => { const id = eng.skillOf(q), o = (bySkill[id] ||= { n: 0, r: 0 }); o.n++; if (picked === q.answer) o.r++; }));
    const wrong = E.secs.flatMap((s) => s.rows.filter((r) => r.picked !== r.q.answer));
    root.replaceChildren(
      h('div', { class: 'card stack' }, h('h1', null, `${AR(R)} من ${AR(T)}`), h('p', { class: 'muted' }, `${E.spec.name} — النسبة ${AR(pct)}٪ — الزمن المستغرق ${AR(Math.round(usedAll / 60000))} دقيقة`),
        ...E.secs.map((s) => h('div', { class: 'row between small' }, h('span', null, `القسم ${AR(s.n)} (${s.part})`), h('span', null, `${AR(s.right)} / ${AR(s.total)} — بلا إجابة ${AR(s.blank)} — ${AR(Math.round(s.used / 60000))} د`)))),
      h('section', { class: 'card stack' }, h('h3', null, 'حسب المهارة'),
        ...Object.entries(bySkill).sort((a, b) => a[1].r / a[1].n - b[1].r / b[1].n).map(([id, v]) => h('div', { class: 'row between small' }, h('span', null, eng.skillInfo(id).name), h('b', null, `${AR(v.r)} / ${AR(v.n)}`)))),
      h('section', { class: 'stack' }, h('h3', null, `راجع أخطاءك (${AR(wrong.length)})`),
        ...wrong.map(({ q, picked }) => { const o = optionsOf(q); return h('details', { class: 'card' }, h('summary', { html: rich(q.stem || 'قارن') }),
          h('p', { class: 'small' }, picked == null ? 'لم تجب. ' : ['اخترتَ ', h('b', { html: rich(o[picked]) }), '. '], 'الصحيح: ', h('b', { html: rich(o[q.answer]) })),
          q.traps?.[picked] ? h('div', { class: 'pending-note', html: rich(q.traps[picked]) }) : null, q.solution?.length ? stepsList(q.solution) : null); })),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onClick: start }, 'نموذج آخر'), h('a', { class: 'btn', href: '#/mistakes' }, 'دفتر أخطائي'), h('a', { class: 'btn ghost', href: '#/map' }, 'خريطة مهاراتي')));
    E = null;
  }
  return root;
}
