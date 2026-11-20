import { passages } from '../store/bank.js';
import { listenBtn } from './listen.js';
import { h } from '../core/dom.js';
import { rich } from '../core/math.js';
import { isStaff } from '../core/staff.js';
import { COMPARE_OPTIONS, LETTERS, STATUS, topicTitle } from '../data/taxonomy.js';

export const optionsOf = (q) => (q.type === 'compare' ? COMPARE_OPTIONS : q.options);

/**
 * Question card. "compare" questions render as a balance that tilts after answering —
 * the Ustaz's fixed قارن بين format, presented visually.
 * Returns { el, reveal(picked) }.
 */
export function QuestionCard(q, { onPick, readonly = false } = {}) {
  const opts = optionsOf(q);
  const buttons = opts.map((text, i) =>
    h('button', {
      class: 'opt', type: 'button', 'data-i': i, disabled: readonly || null,
      onClick: () => onPick && onPick(i),
    },
      h('span', { class: 'ltr-letter' }, LETTERS[i]),
      h('span', { html: rich(text) }),
    ));

  const balance = q.type === 'compare'
    ? h('div', { class: 'balance', 'data-tilt': '' },
        h('div', { class: 'beam' }),
        h('div', { class: 'pans' },
          h('div', { class: 'pan' }, h('small', null, 'القيمة الأولى'), h('div', { class: 'val', html: rich(q.a) })),
          h('div', { class: 'pan' }, h('small', null, 'القيمة الثانية'), h('div', { class: 'val', html: rich(q.b) }))))
    : null;

  const st = STATUS[q.status] || STATUS.draft;
  const el = h('article', { class: 'q' },
    h('div', { class: 'q-meta' },
      h('span', { class: 'badge' }, topicTitle(q.topic)),
      isStaff() ? h('span', { class: 'dots', title: 'الصعوبة' }, [1, 2, 3].map((n) => h('i', { class: n <= (q.difficulty || 1) ? 'on' : '' }))) : null,
      isStaff() && q.noKey ? h('span', { class: 'badge', title: 'لا مفتاح مطبوع في ملف الأستاذ' }, 'الإجابة من حل الفريق') : null,
      isStaff() && q.status !== 'approved' ? h('span', { class: `badge ${st.cls}` }, st.label) : null),
    q.type === 'compare'
      ? h('div', { class: 'q-stem' }, q.stem ? h('span', { html: rich(q.stem) }) : 'قارن بين:')
      : h('div', { class: 'q-stem', html: rich(q.stem) }),
    q.passage && passages[q.passage]
      ? h('div', { class: 'qpassage' }, h('b', null, passages[q.passage].title), passages[q.passage].paras.map((t) => h('p', null, t)))
      : null,
    listenBtn(q.id, 0, 'استمع للسؤال'),
    q.fig ? h('div', { class: 'qfig', html: q.fig }) : null,
    balance,
    h('div', { class: `opts ${q.type === 'compare' ? 'two' : ''}` }, buttons));

  function reveal(picked) {
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) { b.classList.add('is-correct'); b.append(h('span', { class: 'tag' }, 'الصحيحة')); }
      else if (i === picked) { b.classList.add('is-wrong'); b.append(h('span', { class: 'tag' }, 'اختيارك')); }
    });
    if (balance) balance.dataset.tilt = q.answer === 0 ? 'first' : q.answer === 1 ? 'second' : 'even';
  }
  if (readonly && q.answer != null) reveal(-1);
  return { el, reveal };
}

export const stepsList = (steps) => h('ol', { class: 'steps' }, steps.map((s) => h('li', { html: rich(s) })));

// حلّ يظهر خطوة خطوة: يكشف الطالب كل خطوة بنفسه فيتابع الفكرة ولا يُغمر بها.
export function stepReveal(steps, onStep) {
  const items = steps.map((s) => h('li', { html: rich(s), hidden: true }));
  const list = h('ol', { class: 'steps reveal' }, items);
  let n = 0;
  const btn = h('button', { class: 'btn sm accent', type: 'button', onClick: () => {
    if (n >= items.length) return;
    items[n].hidden = false; items[n].classList.add('in'); n++; if (onStep) onStep(n, items.length);
    if (n >= items.length) btn.style.display = 'none'; else btn.textContent = 'الخطوة التالية';
  } }, 'ابدأ بالخطوة الأولى');
  return h('div', { class: 'stack reveal-wrap' }, list, items.length > 1 ? btn : null, items.length === 1 ? (items[0].hidden = false, null) : null);
}
