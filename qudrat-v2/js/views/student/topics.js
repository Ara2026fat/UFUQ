import { h } from '../../core/dom.js';
import { qn } from '../../core/plural.js';
import { icon } from '../../core/icons.js';
import { bankIndex, bankCounts } from '../../store/bank.js';
import { repo } from '../../store/repo.js';
import { GROUPS, topicTitle } from '../../data/taxonomy.js';
import { hasLesson } from './lesson.js';
import { hasGuided } from './learn.js';
import { getPart } from '../../store/part.js';
import { GENERATABLE } from '../../data/generators.js';

const GI = { num: 'calc', app: 'chart', geo: 'shapes', cnt: 'puzzle', ufq: 'star', verbal: 'pen', exam: 'clock' };
const GC = { num: 1, app: 2, geo: 3, cnt: 4, ufq: 5, verbal: 6, exam: 7 };
let CUR = null;
export function topicsView() {
  const wrap = h('div', { class: 'fit' }, topicsInner(wrap0));
  function wrap0() { wrap.replaceChildren(topicsInner(wrap0)); }
  bankIndex().then(wrap0);
  return wrap;
}

function topicsInner(redraw) {
  const stats = repo.topicStats();
  const count = {};
  repo.practiceQuestions().forEach((q) => { count[q.topic] = (count[q.topic] || 0) + 1; });
  const bc = bankCounts(); Object.keys(bc).forEach((t) => { count[t] = Math.max(count[t] || 0, bc[t]); });
  const vp = getPart() === 'verbal', GS = GROUPS.filter((x) => (x.id === 'verbal') === vp);
  const g = GS.find((x) => x.id === CUR) || GS[0];
  const ico = (id) => { const e = h('span', { class: 'ic' }); e.innerHTML = icon(GI[id] || 'book'); return e; };

  const tabs = h('div', { class: 'gtabs', role: 'tablist' }, GS.map((x) =>
    h('button', { class: `gtab c${GC[x.id] || 1}`, role: 'tab', 'aria-selected': x.id === g.id ? 'true' : 'false', onClick: () => { CUR = x.id; redraw(); } }, ico(x.id), h('span', null, x.title))));

  const tiles = h('div', { class: 'tgrid' }, g.topics.map((t) => {
    const n = count[t] || 0, lesson = hasLesson(t), gen = GENERATABLE.includes(t), guided = hasGuided(t + '-full');
    const ok = n || lesson || gen;
    return h('div', { class: 'ttile', 'aria-disabled': ok ? null : 'true' },
      h(n ? 'a' : 'span', { class: 'tt', href: n ? `#/practice?topic=${t}` : null }, topicTitle(t)),
      h('span', { class: 'tc' }, n ? `${qn(n)}${stats[t] ? ` · ${stats[t].acc}٪` : ''}` : 'قريباً'),
      h('div', { class: 'tact' },
        guided ? h('a', { href: `#/learn/${t}-full`, 'aria-label': 'درس موجَّه' }, '🎓') : null,
        lesson ? h('a', { href: `#/lesson/${t}`, 'aria-label': 'شرح صوتي' }, '🔊') : null,
        gen ? h('a', { href: `#/practice?topic=${t}&gen=1`, 'aria-label': 'أسئلة جديدة' }, '∞') : null));
  }));

  return h('div', { class: 'tpage' }, tabs, h('h3', { class: 'sec-t' }, g.title), tiles);
}
