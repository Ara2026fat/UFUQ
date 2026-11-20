import { getPart } from '../../store/part.js';
import { staffOnly } from '../../core/staff.js';
import { qn } from '../../core/plural.js';
import { h } from '../../core/dom.js';
import { loadBank } from '../../store/bank.js';
import * as eng from '../../engine/engine.js';
import { loadAllBanks } from '../../store/bank.js';
import { tabbed } from '../../components/tabs.js';
import { repo } from '../../store/repo.js';

let LES = null;
export const loadLessons = () => (LES ? Promise.resolve(LES) : fetch('data/engine/lessons.json').then((r) => r.json()).then((j) => (LES = j)).catch(() => (LES = { lessons: {} })));
export const hasUfLesson = (skill) => !!(LES && LES.lessons[skill]);

const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/&lt;br\s*\/?&gt;/g, '<br>');
const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

/** {t:tag|tag} → number of bank distractors carrying that tag; {q} → number of questions of the skill (computed live, never stale). */
function live(text, skill) {
  const qs = repo.practiceQuestions().filter((q) => q.skill === skill);
  return String(text || '').replace(/\{t:([a-z_|]+)\}/g, (_, tags) => {
    const set = tags.split('|'); let n = 0;
    qs.forEach((q) => Object.values(q.tags || {}).forEach((t) => { if (set.includes(t)) n++; }));
    return `${AR(n)} مشتِّتًا`;
  }).replace(/\{q\}/g, () => qn(qs.length));
}

const SKILL_TOPIC = { ratios: 'ratio', proportion: 'ratio', percent: 'pct', averages: 'avg', probability: 'prob', sequences: 'seq', algebra: 'eq', geometry: 'geom', comparisons: 'cmp', data_read: 'data', analogy: 'v_analogy', completion: 'v_completion', context_error: 'v_context', odd_one: 'v_odd', association: 'v_assoc', reading: 'v_reading', timing: 'tm', mock: 'tm' };

/** درس أُفق للمهارة: ينقل شرح أُفق كما هو، مصنَّفاً «قيد مراجعة الأستاذ». الأساس يبقى شرح الأستاذ. */
export function ufLessonView(ctx) {
  const id = ctx.params.skill, wrap = h('div', null, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  Promise.all([loadLessons(), SKILL_TOPIC[id] ? loadBank(SKILL_TOPIC[id]) : 0]).then(() => {
    const L = LES.lessons[id];
    if (!L) { wrap.replaceChildren(h('div', { class: 'empty' }, h('h2', null, 'لا يوجد درس لهذه المهارة'), h('a', { class: 'btn primary', href: '#/map' }, 'خريطة المهارات'))); return; }
    const sec = (title, ...kids) => h('section', { class: 'card stack' }, h('h3', { style: 'margin:0' }, title), ...kids);
    const html = (t, cls) => h('div', { class: cls || '', html: md(live(t, id)) });
    const picked = h('div', { class: 'small muted' });
    const opts = h('div', { class: 'opts' }, (L.exOpts || []).map((o, i) => h('button', { type: 'button', class: 'opt', onClick: (e) => {
      opts.querySelectorAll('button').forEach((b, j) => { b.disabled = true; b.classList.toggle('ok', j === L.exAns); });
      if (i !== L.exAns) e.currentTarget.classList.add('bad');
      steps.hidden = false; picked.textContent = i === L.exAns ? 'أحسنت — هكذا تُحَل:' : 'ليس هذا — انظر كيف تُحَل:';
    } }, h('span', { html: md(o) }))));
    const steps = h('ol', { hidden: true }, (L.steps || []).map((s) => h('li', { html: md(s) })));
    const topic = SKILL_TOPIC[id];
    wrap.replaceChildren(
      h('div', { class: 'page-head' }, staffOnly(h('span', { class: 'badge gen' }, 'شرح من أُفق · قيد مراجعة الأستاذ')), h('h1', null, L.name),
        L.gloss ? h('p', { class: 'muted small' }, L.gloss) : null),
      h('div', { class: 'stack' },
        tabbed({ key: 'uf:' + id, tabs: [
          { id: 'idea', label: 'الفكرة', render: () => h('div', { class: 'stack' }, sec('ما هي؟', html(L.what)), sec('المفتاح', html(L.key, 'lead')),
            L.card ? h('div', { class: 'card', style: 'text-align:center;font-weight:700' }, md(L.card).replace(/<[^>]+>/g, '')) : null) },
          { id: 'ex', label: 'مثال', render: () => h('div', { class: 'stack' }, sec('مثال', h('div', { html: md(L.ex) }), opts, picked, steps)) },
          (L.spot || L.drill) ? { id: 'solve', label: 'التعرّف والحل', render: () => h('div', { class: 'stack' },
            L.spot ? sec('كيف تتعرّف عليها؟', h('ul', null, L.spot.map((s) => h('li', { html: md(s) })))) : null,
            L.drill ? sec('خطوات الحلّ', h('ol', null, L.drill.map((s) => h('li', { html: md(s) })))) : null) } : null,
          (L.trap || L.contrast) ? { id: 'trap', label: 'الفخاخ', render: () => h('div', { class: 'stack' },
            L.trap ? sec('الفخّ', html(L.trap)) : null,
            L.contrast ? sec('بين خطأ وصواب', h('ul', null, L.contrast.map((s) => h('li', { html: md(s) })))) : null) } : null,
        ].filter(Boolean) }),
        topic ? h('a', { class: 'btn primary block', href: `#/practice?topic=${topic}` }, 'تدرّب على هذه المهارة') : null,
        h('a', { class: 'btn ghost block', href: '#/map' }, 'خريطة مهاراتي')));
  });
  return wrap;
}

/** جولة «أفكار وشرح»: قراءة لا حساب — تفتح شرح المهارة التالية وتُحسب منجَزة. */
export function ideasView(ctx) {
  const wrap = h('p', { class: 'muted' }, 'جارٍ التحميل…');
  Promise.all([loadAllBanks(), eng.loadGraph(), loadLessons()]).then(() => {
    const id = eng.chooseActive({ part: getPart() }); eng.markRoundDone(ctx.query.r != null ? +ctx.query.r : undefined);
    const topic = SKILL_TOPIC[id] || id;
    location.replace(hasUfLesson(id) ? `#/uf/${id}` : `#/lesson/${topic}`);
  });
  return wrap;
}
