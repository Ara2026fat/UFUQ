import { h } from '../../core/dom.js';
import { qn, mn } from '../../core/plural.js';
import { rich } from '../../core/math.js';
import { repo } from '../../store/repo.js';
import { QuestionCard, optionsOf, stepsList } from '../../components/question.js';
import { loadAllBanks } from '../../store/bank.js';
import * as eng from '../../engine/engine.js';
import { examOpen } from '../../core/trial.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const clock = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)); return AR(String(Math.floor(t / 60)).padStart(2, '0')) + ':' + AR(String(t % 60).padStart(2, '0')); };

/** محاكاة الاختبار: أقسام بمؤقّت، لا ظهور للإجابة الصحيحة أثناء القسم، ولا رجوع إلى قسم انتهى. */
export function examView() {
  const root = h('div', null, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  loadAllBanks().then(() => eng.loadGraph()).then(() => { eng.state(); start(); });
  let E = null, timer = null;

  function start() {
    const info = eng.examInfo();
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', null, 'محاكاة الاختبار'), h('p', null, 'تدرّب على الإيقاع نفسه: وقت محدّد، بلا شرح أثناء القسم، ولا رجوع إلى قسم انتهى. الشرح بعد الانتهاء.')),
      info.sinceLast != null && info.sinceLast >= 14 ? h('div', { class: 'pending-note' }, `مضى ${AR(info.sinceLast)} يوماً على آخر نموذج كامل — حان موعد نموذج جديد.`) : null,
      h('div', { class: 'stack' }, Object.entries(eng.EXAMS).map(([k, sp]) => h('button', { class: 'card stack', type: 'button', style: 'text-align:start;cursor:pointer', onClick: () => (examOpen(k) ? begin(k) : toastLock()) },
        h('b', null, (examOpen(k) ? '' : '🔒 ') + sp.name), h('span', { class: 'muted small' }, `${sp.sections > 1 ? AR(sp.sections) + ' أقسام' : 'قسم واحد'} — ${qn(sp.per)} — ${mn(sp.mins)} للقسم`), h('span', { class: 'small' }, sp.note)))),
      info.log.length ? h('section', { class: 'card stack' }, h('h3', null, 'نتائجك السابقة'),
        ...info.log.slice().reverse().map((l) => h('div', { class: 'row between small' }, h('span', null, `${eng.EXAMS[l.mode]?.name || l.mode} — اليوم ${AR(l.day + 1)}`), h('b', null, `${AR(l.right)} / ${AR(l.total)}`)))) : null);
  }

  function toastLock() { const b = root.querySelector('.ex-lock') || h('div', { class: 'pending-note ex-lock' }); b.textContent = 'هذا النموذج في الدورة الكاملة. في التجربة المجانية جرّب «القسم المصغّر».'; if (!b.isConnected) root.prepend(b); }
  function begin(mode) {
    const spec = eng.EXAMS[mode];
    E = { mode, spec, sec: 0, idx: 0, seen: new Set(), secs: [], all: [], answers: {} };
    openSection();
  }
  function openSection() {
    E.items = eng.buildExamSection(E.spec, E.sec, E.seen);
    if (!E.items.length) { root.replaceChildren(h('div', { class: 'empty' }, h('h2', null, 'لا أسئلة كافية'), h('button', { class: 'btn', type: 'button', onClick: start }, 'رجوع'))); return; }
    E.idx = 0; E.answers = {}; E.flag = new Set(); E.endsAt = Date.now() + E.spec.mins * 60000;
    clearInterval(timer); timer = setInterval(tick, 500); show();
  }
  function tick() {
    if (!root.isConnected) { clearInterval(timer); return; }
    const left = E.endsAt - Date.now(), c = root.querySelector('#exClock');
    if (c) { c.textContent = clock(left); c.classList.toggle('low', left <= 120000); }
    const b = root.querySelector('#exBar'); if (b) b.style.width = Math.max(0, Math.min(100, left / (E.spec.mins * 600))) + '%';
    if (left <= 0) endSection();
  }
  function show() {
    const q = E.items[E.idx], total = E.items.length, picked = E.answers[q.id];
    const card = QuestionCard(q, { onPick: (i) => { E.answers[q.id] = i; mark(); nav(); } });
    const mark = () => card.el.querySelectorAll('.opt').forEach((b, i) => b.classList.toggle('picked', E.answers[q.id] === i));
    mark();
    const grid = h('div', { class: 'row', style: 'flex-wrap:wrap;gap:6px' });
    const nav = () => grid.replaceChildren(...E.items.map((x, i) => h('button', { type: 'button', class: `chip`, 'aria-pressed': String(i === E.idx), style: `min-width:38px;${E.answers[x.id] != null ? 'font-weight:700;' : 'opacity:.6;'}${E.flag.has(x.id) ? 'outline:2px solid var(--saffron,#E8851A);' : ''}`, onClick: () => { E.idx = i; show(); } }, AR(i + 1))));
    nav();
    root.replaceChildren(
      h('div', { class: 'row between', style: 'align-items:center' },
        h('b', null, `${E.spec.name} — القسم ${AR(E.sec + 1)} من ${AR(E.spec.sections)}`),
        h('b', { id: 'exClock', dir: 'ltr', style: 'font-variant-numeric:tabular-nums' }, clock(E.endsAt - Date.now()))),
      h('div', { class: 'bar' }, h('i', { id: 'exBar', style: 'width:100%' })),
      h('div', { class: 'card stack' }, h('small', { class: 'muted' }, `السؤال ${AR(E.idx + 1)} من ${AR(total)}`), card.el),
      h('div', { class: 'row' },
        h('button', { class: 'btn', type: 'button', disabled: E.idx === 0 || null, onClick: () => { E.idx--; show(); } }, 'السابق'),
        h('button', { class: 'btn', type: 'button', onClick: () => { E.flag.has(q.id) ? E.flag.delete(q.id) : E.flag.add(q.id); show(); } }, E.flag.has(q.id) ? 'إلغاء العلامة' : '⚑ علّم للعودة'),
        E.idx < total - 1 ? h('button', { class: 'btn primary', type: 'button', onClick: () => { E.idx++; show(); } }, 'التالي') : h('button', { class: 'btn accent', type: 'button', onClick: confirmEnd }, 'إنهاء القسم')),
      grid, h('small', { class: 'muted' }, 'يمكنك التنقل وتغيير إجاباتك داخل القسم. عند إنهائه لا رجوع إليه.'));
    tick();
  }
  function confirmEnd() {
    const blank = E.items.filter((q) => E.answers[q.id] == null).length;
    if (blank && !confirm(`بقي ${qn(blank)} بلا إجابة. أتنهي القسم؟`)) return;
    endSection();
  }
  function endSection() {
    clearInterval(timer);
    const used = Math.max(0, E.spec.mins * 60000 - (E.endsAt - Date.now()));
    const rows = E.items.map((q) => ({ q, picked: E.answers[q.id] ?? null }));
    rows.forEach(({ q, picked }) => { if (picked != null) { const ok = picked === q.answer; eng.record(q, ok, { picked, ms: 0 }); repo.recordAttempt({ qid: q.id, topic: q.topic, choice: picked, correct: ok, ms: 0, mode: 'exam' }); } });
    const right = rows.filter((r) => r.picked === r.q.answer).length;
    E.secs.push({ n: E.sec + 1, right, total: rows.length, blank: rows.filter((r) => r.picked == null).length, used, rows });
    E.items.forEach((q) => E.seen.add(q.id));
    if (E.sec + 1 >= E.spec.sections) return done();
    root.replaceChildren(h('div', { class: 'card stack', style: 'text-align:center' },
      h('h2', null, `انتهى القسم ${AR(E.sec + 1)}`), h('p', { class: 'muted' }, 'استرح قليلاً. النتائج تظهر في النهاية، ولا رجوع إلى هذا القسم.'),
      h('button', { class: 'btn primary', type: 'button', onClick: () => { E.sec++; openSection(); } }, `ابدأ القسم ${AR(E.sec + 2)}`)));
  }
  function done() {
    const R = E.secs.reduce((a, x) => a + x.right, 0), T = E.secs.reduce((a, x) => a + x.total, 0);
    eng.logExam({ day: eng.today(), mode: E.mode, right: R, total: T });
    const bySkill = {};
    E.secs.forEach((s) => s.rows.forEach(({ q, picked }) => { const id = eng.skillOf(q), o = (bySkill[id] ||= { n: 0, r: 0 }); o.n++; if (picked === q.answer) o.r++; }));
    const wrong = E.secs.flatMap((s) => s.rows.filter((r) => r.picked !== r.q.answer));
    root.replaceChildren(
      h('div', { class: 'card stack' }, h('h1', null, `${AR(R)} من ${AR(T)}`), h('p', { class: 'muted' }, `${E.spec.name} — الأهم ما تتعلّمه من المراجعة أدناه`),
        ...E.secs.map((s) => h('div', { class: 'row between small' }, h('span', null, `القسم ${AR(s.n)}`), h('span', null, `${AR(s.right)} / ${AR(s.total)} — بلا إجابة ${AR(s.blank)} — ${AR(Math.round(s.used / 60000))} د`)))),
      h('section', { class: 'card stack' }, h('h3', null, 'حسب المهارة'),
        ...Object.entries(bySkill).sort((a, b) => a[1].r / a[1].n - b[1].r / b[1].n).map(([id, v]) => h('div', { class: 'row between small' }, h('span', null, eng.skillInfo(id).name), h('b', null, `${AR(v.r)} / ${AR(v.n)}`)))),
      h('section', { class: 'stack' }, h('h3', null, `راجع أخطاءك (${AR(wrong.length)})`),
        ...wrong.map(({ q, picked }) => { const o = optionsOf(q); return h('details', { class: 'card' }, h('summary', { html: rich(q.stem || 'قارن') }),
          h('p', { class: 'small' }, picked == null ? 'لم تجب. ' : ['اخترتَ ', h('b', { html: rich(o[picked]) }), '. '], 'الصحيح: ', h('b', { html: rich(o[q.answer]) })),
          q.traps?.[picked] ? h('div', { class: 'pending-note', html: rich(q.traps[picked]) }) : null, q.solution?.length ? stepsList(q.solution) : null); })),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onClick: start }, 'نموذج آخر'), h('a', { class: 'btn', href: '#/mistakes' }, 'دفتر أخطائي'), h('a', { class: 'btn ghost', href: '#/map' }, 'خريطة مهاراتي')));
  }
  return root;
}
