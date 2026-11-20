import { getPart, isVerbalTopic } from '../../store/part.js';
import { h, shuffle, toast } from '../../core/dom.js';
import { qn } from '../../core/plural.js';
import { icon } from '../../core/icons.js';
import { rich } from '../../core/math.js';
import { repo } from '../../store/repo.js';
import * as eng from '../../engine/engine.js';
import { bankFailed, loadBank, loadBanks, loadAllBanks, bankIndex } from '../../store/bank.js';
import { go } from '../../core/router.js';
import { tabbed } from '../../components/tabs.js';
import { vizFor } from '../../components/viz.js';
import { QuestionCard, optionsOf, stepsList, stepReveal } from '../../components/question.js';
import { ERROR_TYPES, topicTitle } from '../../data/taxonomy.js';
import { listenBtn } from '../../components/listen.js';
import { hasUfLesson, loadLessons, ufLessonView } from './uflesson.js';
import { hasLesson, lessonView } from './lesson.js';
import { generate, GENERATABLE } from '../../data/generators.js';
import * as jr from '../../store/journey.js';
import { isTrial, practiceLeft, usePractice, lockCard } from '../../core/trial.js';

const SIZE = 5;
loadLessons();

function pickSession(query) {
  if (query.gen && query.topic && GENERATABLE.includes(query.topic)) {
    return Array.from({ length: SIZE }, (_, i) => generate(query.topic, 1 + Math.min(2, Math.floor(i / 2))));
  }
  const all = repo.practiceQuestions();
  if (query.q) { const one = repo.get(query.q); return one ? [one] : []; }
  if (query.topic) return shuffle(all.filter((x) => x.topic === query.topic)).slice(0, SIZE);
  // quick: unseen + weak topics first, at most 2 per topic
  const stats = repo.topicStats();
  const seen = new Set(repo.attempts().map((a) => a.qid));
  const score = (x) => (seen.has(x.id) ? 0 : 2) + (stats[x.topic] ? (100 - stats[x.topic].acc) / 100 : 0.5) + Math.random();
  const perTopic = {}; const out = [];
  const vp = getPart() === 'verbal';
  for (const x of all.filter((y) => isVerbalTopic(y.topic) === vp && y.topic !== 'tm').sort((a, b) => score(b) - score(a))) {
    if ((perTopic[x.topic] = (perTopic[x.topic] || 0) + 1) > 2) continue;
    out.push(x); if (out.length === SIZE) break;
  }
  return out;
}

function pickTwin(q) {
  if (q.twinId && repo.get(q.twinId)) return repo.get(q.twinId);
  const seen = new Set(repo.attempts().map((a) => a.qid));
  const pool = repo.questions().filter((x) => x.topic === q.topic && x.id !== q.id && ['demo', 'approved', 'generated', 'ustaz', 'ufuq'].includes(x.status));
  return pool.find((x) => !seen.has(x.id)) || pool[0] || null;
}

/** A session is self-contained: it re-renders itself in `root` without route changes. */
export function practiceView(ctx) {
  const wrap = h('div', null, h('div', { class: 'empty' }, h('p', null, 'جارٍ التحميل…')));
  const q = ctx.query;
  if (isTrial() && !q.q && q.mode !== 'retry' && !q.skill) { // تدريب مهارة من وحدة مفتوحة لا يُحسب من حصّة اليوم
    if (!practiceLeft()) return lockCard('انتهت جلسات اليوم التجريبية', 'جلسات التدريب المجانية ٣ في اليوم. عُد غداً لجلسات جديدة، أو راجع أخطاءك الآن.', ['#/mistakes', 'راجع أخطائي']);
    usePractice();
  }
  if (q.mode === 'daily') {
    loadAllBanks().then(() => eng.loadGraph()).then(() => {
      const sess = eng.buildSession({ size: q.skill && isTrial() ? 15 : 10, part: q.part || getPart(), force: q.skill || null, kind: q.kind || 'new' });
      ctx.daily = sess;
      wrap.replaceChildren(practiceInner(ctx));
    });
    return wrap;
  }
  const need = q.topic ? loadBank(q.topic) : q.q ? loadAllBanks() : (q.mode === 'quick' || !q.mode)
    ? bankIndex().then((i) => { const vp = getPart() === 'verbal'; return loadBanks(Object.keys(i).filter((t) => (t !== '_held' && t !== 'tm') && isVerbalTopic(t) === vp).sort(() => Math.random() - 0.5).slice(0, 4)); }) : loadAllBanks();
  Promise.resolve(need).then(() => wrap.replaceChildren(practiceInner(ctx)));
  return wrap;
}

function practiceInner(ctx) {
  const root = h('div');
  const s = { list: ctx.daily ? ctx.daily.items.map((i, n) => ({ ...i.q, __role: i.role, __di: n })) : pickSession(ctx.query), daily: ctx.daily || null, rs: 0, ws: 0, i: 0, ok: 0, wrong: [], t0: Date.now(), mode: ctx.daily ? 'daily' : ctx.query.mode || (ctx.query.gen ? 'gen' : ctx.query.topic ? 'topic' : 'retry') };

  if (!s.list.length) {
    return h('div', { class: 'empty' }, h('h2', null, 'لا توجد أسئلة متاحة'), bankFailed() ? h('p', { class: 'muted' }, 'تعذّر تحميل بنك الأسئلة — تحقّق من الاتصال ثم أعد المحاولة.') : null, h('a', { class: 'btn primary', href: '#/topics' }, 'المواضيع'));
  }

  const leave = () => go('/');

  function step() {
    if (s.i >= s.list.length) return result();
    const q = s.list[s.i];
    const twinOf = q.__twinOf || null;
    const started = Date.now();
    const fb = h('div');
    const card = QuestionCard(q, { onPick: (picked) => answer(picked) });

    const total = s.list.length;
    root.replaceChildren(
      h('div', { class: 'progress' },
        h('button', { class: 'x', type: 'button', 'aria-label': 'خروج', onClick: leave, html: icon('x') }),
        h('div', { class: 'bar', role: 'progressbar', 'aria-valuenow': s.i, 'aria-valuemax': total }, h('i', { style: `width:${(s.i / total) * 100}%` })),
        h('small', { class: 'muted', dir: 'ltr' }, `${s.i + 1} / ${total}`)),
      h('div', { class: 'card stack' }, twinOf ? h('span', { class: 'badge info' }, 'سؤال مشابه للتأكد') : null, card.el, fb));

    function answer(picked) {
      const correct = picked === q.answer; let eased = false;
      try { jr.markActive(); } catch (e) { /* */ }
      eng.record(q, correct, { picked, ms: Date.now() - started, role: q.__role });
      if (correct) { s.rs++; s.ws = 0; } else { s.ws++; s.rs = 0; }
      if (s.daily) { const pos = s.list.findIndex((x, n) => n > s.i && !x.__twinOf); if (pos >= 0 && s.list[pos].__di != null) { const di = s.list[pos].__di, a = eng.adapt(s.daily, di, s.rs, s.ws); if (a) { const it = s.daily.items[di]; s.list[pos] = { ...it.q, __role: it.role, __di: di }; if (a === 'ease') { s.ws = 0; eased = true; } else s.rs = 0; } } }
      repo.recordAttempt({ qid: q.id, topic: q.topic, choice: picked, correct, ms: Date.now() - started, mode: s.mode, twinOf });
      if (!correct && !repo.get(q.id)) repo.save({ ...q, __twinOf: undefined }); // keep generated mistakes in the notebook
      card.reveal(picked);
      if (correct) {
        if (twinOf) { repo.resolve(twinOf); }
        else if (s.mode === 'retry') repo.resolve(q.id);
        s.ok++;
        fb.replaceChildren(correctPanel(q, twinOf));
      } else {
        if (!twinOf) s.wrong.push(q.id);
        fb.replaceChildren(mistakePanel(q, picked, twinOf));
        if (eased) fb.prepend(h('div', { class: 'card', style: 'border-color:var(--gold-2,#C9921A);margin-bottom:10px' },
          h('b', null, 'تعثّرتَ في هذه المهارة عدة مرات — لا بأس.'),
          h('p', { class: 'small', style: 'margin:6px 0' }, 'راجع فكرتها بإيجاز ثم نكمل بسؤال أسهل نبني عليه.'),
          q.skill && hasUfLesson(q.skill) ? h('button', { class: 'btn primary sm', type: 'button', onClick: () => openOverlay(ufLessonView({ params: { skill: q.skill }, query: {} })) }, 'راجع بطاقة الفكرة') : null));
      }
      fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  const next = () => { s.i++; step(); };

  function correctPanel(q, twinOf) {
    const vz = vizFor(q);
    const steps = h('div', { hidden: true }, vz ? vz.el : null, stepReveal(q.solution, vz ? (k, n) => vz.set(Math.max(2, Math.round((k / n) * vz.max))) : null));
    return h('div', { class: 'fb ok' },
      h('h3', null, twinOf ? 'ممتاز — فهمتَ الفكرة' : 'أحسنت'),
      twinOf ? h('p', { class: 'small' }, 'حُلّ الخطأ السابق وخرج من دفتر أخطائك.') : null,
      q.solution.length ? h('button', { class: 'btn sm ghost', type: 'button', onClick: (e) => { steps.hidden = !steps.hidden; e.currentTarget.textContent = steps.hidden ? 'كيف نحلها؟' : 'إخفاء الحل'; } }, 'كيف نحلها؟') : null,
      listenBtn(q.id, 1, 'استمع للحل'),
      steps,
      h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', style: 'margin-top:8px', onClick: (e) => { const on = e.currentTarget.getAttribute('aria-pressed') === 'true'; e.currentTarget.setAttribute('aria-pressed', String(!on)); repo.tagLastAttempt({ errType: on ? null : 'guess' }); } }, 'خمّنتُها'),
      h('div', { class: 'row', style: 'margin-top:12px' }, h('button', { class: 'btn primary block', type: 'button', onClick: next }, s.i + 1 >= s.list.length ? 'النتيجة' : 'التالي')));
  }

  /** يعرض الدرس فوق الجولة دون مغادرتها، ثم يعيدك لنفس السؤال بزر واضح. */
  function openOverlay(node) {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const close = () => { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } ov.remove(); document.body.style.overflow = prev; };
    const ov = h('div', { class: 'sess-overlay', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'sess-ov-bar' }, h('button', { class: 'btn primary', type: 'button', onClick: close }, '← العودة لإكمال الجولة')),
      h('div', { class: 'sess-ov-body' }, node));
    document.body.append(ov); ov.scrollTop = 0;
  }

  function mistakePanel(q, picked, twinOf) {
    const opts = optionsOf(q);
    if (twinOf) repo.flagForTeacher(twinOf, 'twin-failed');
    const trap = q.traps?.[picked];

    // سبب الخطأ: اختيار واحد يمكن تغييره أو إلغاؤه، مع تأكيد ظاهر
    const said = h('small', { class: 'muted', role: 'status' }, 'اختياري — يساعدنا على اقتراح التدريب المناسب.');
    const chips = h('div', { class: 'row', style: 'flex-wrap:wrap' }, ERROR_TYPES.map((t) => h('button', {
      class: 'chip', type: 'button', 'aria-pressed': 'false', 'data-t': t.id,
      onClick: (e) => {
        const on = e.currentTarget.getAttribute('aria-pressed') === 'true';
        chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
        if (on) { repo.tagLastAttempt({ errType: null }); said.textContent = 'أُلغي التسجيل.'; return; }
        e.currentTarget.setAttribute('aria-pressed', 'true'); repo.tagLastAttempt({ errType: t.id }); said.textContent = `سُجّل: ${t.label} ✓ (اضغط عليه مرة أخرى لإلغائه)`;
      },
    }, t.label)));

    // الحل في تبويبات ثابتة: لا يختفي شيء عند الانتقال من طريقة لأخرى
    const stepsNode = () => { const vz = vizFor(q); return h('div', { class: 'stack' }, vz ? vz.el : null, q.solution.length ? stepReveal(q.solution, vz ? (k, n) => vz.set(Math.max(2, Math.round((k / n) * vz.max))) : null) : h('p', { class: 'muted small' }, 'سيضيف الأستاذ خطوات هذا الحل.'), listenBtn(q.id, 1, 'استمع للحل')); };
    const altNode = () => h('div', { class: 'alt' }, h('h4', null, q.alt?.title || 'طريقة أخرى'), h('p', { style: 'margin:0', html: rich(q.alt?.body || 'سيضيف الأستاذ شرحاً بديلاً لهذا السؤال.') }));
    const ideaNode = () => h('div', { class: 'stack' },
      q.skill && hasUfLesson(q.skill) ? h('button', { class: 'btn block', type: 'button', onClick: () => openOverlay(ufLessonView({ params: { skill: q.skill }, query: {} })) }, '📖 بطاقة الفكرة (أُفق)') : null,
      hasLesson(q.topic) ? h('button', { class: 'btn block', type: 'button', onClick: () => openOverlay(lessonView({ params: { topic: q.topic }, query: {} })) }, '🔊 استمع لشرح الموضوع كاملاً') : null,
      !(q.skill && hasUfLesson(q.skill)) && !hasLesson(q.topic) ? h('p', { class: 'muted small' }, 'لا توجد بطاقة فكرة لهذه المهارة بعد.') : null);
    const tabs = [{ id: 's', label: 'الحل', render: stepsNode }, { id: 'a', label: 'طريقة أخرى', render: altNode }, { id: 'i', label: 'الفكرة', render: ideaNode }];

    const label = s.i + 1 >= s.list.length ? 'النتيجة' : 'التالي';
    const twin = twinOf ? null : pickTwin(q);
    const actions = twinOf
      ? h('div', { class: 'stack' },
        h('div', { class: 'pending-note' }, 'لم تنجح الطريقتان معك — لا بأس. نبّهنا الأستاذ ليضيف شرحاً ثالثاً مختلفاً لهذه الفكرة، وبقي السؤال في دفتر أخطائك.'),
        h('button', { class: 'btn primary block', type: 'button', onClick: next }, label))
      : h('div', { class: 'stack' },
        h('div', { class: 'row', style: 'flex-wrap:wrap' },
          twin ? h('button', { class: 'btn accent', type: 'button', onClick: () => { s.list.splice(s.i + 1, 0, { ...twin, __twinOf: q.id }); next(); } }, 'جرّب سؤالاً مشابهاً') : null,
          h('button', { class: 'btn ghost', type: 'button', onClick: () => root.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, '↑ العودة للسؤال')),
        h('button', { class: 'btn primary block', type: 'button', onClick: next }, label));

    return h('div', { class: 'fb warn' }, h('div', { class: 'stack' },
      h('div', null, h('h3', null, 'لنكتشف أين انحرف الحل'),
        h('p', { class: 'small', style: 'margin:0' }, 'اخترتَ ', h('b', { html: rich(opts[picked]) }), ' والصحيح ', h('b', { html: rich(opts[q.answer]) }), '.')),
      trap ? h('div', { class: 'pending-note' }, h('b', null, 'قد يكون السبب: '), h('span', { html: rich(trap) })) : null,
      h('div', null, h('div', { class: 'lbl small', style: 'font-weight:600;margin-bottom:6px' }, 'ما الذي حدث؟'), chips, said),
      tabbed({ key: '', tabs, wrap: true, sub: true }),
      actions));
  }

  function result() {
    if (s.daily && !s.fin) { s.fin = true; eng.finishSession(s.daily, s.ok, s.list.length, s.wrong); }
    const main = s.list.filter((x) => !x.__twinOf).length;
    const mins = Math.max(1, Math.round((Date.now() - s.t0) / 60000));
    root.replaceChildren(h('div', { class: 'card stack result-card' },
      s.daily ? h('h1', null, 'أتممتَ الجولة — أحسنت') : h('h1', null, `${s.ok} من ${s.list.length} صحيحة`),
      h('p', { class: 'muted' }, `أنهيتَ ${qn(main, true)}. المعيار عندنا الإتقان لا الوقت.`),
      s.daily
        ? h('div', { class: 'fb ok' }, s.wrong.length ? 'ما احتاج وقتاً أطول سيعود إليك في موعده — هكذا يُبنى الفهم.' : 'سارت الجولة بسلاسة.')
        : s.wrong.length
        ? h('div', { class: 'pending-note' }, `${s.wrong.length} من الأسئلة محفوظة في «أخطائي» لتعود إليها بشرح أبسط.`)
        : h('div', { class: 'fb ok' }, 'لا أخطاء في هذه الجولة.'),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: s.daily ? `#/practice?mode=daily&k=${Date.now()}` : `#/practice?mode=quick&k=${Date.now()}` }, 'جولة أخرى'),
        s.wrong.length ? h('a', { class: 'btn', href: '#/mistakes' }, 'أخطائي') : null,
        h('a', { class: 'btn ghost', href: '#/' }, 'الرئيسية'))));
  }

  step();
  return root;
}
