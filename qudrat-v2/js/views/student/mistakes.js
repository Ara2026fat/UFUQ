import { topicInPart } from '../../store/part.js';
import { h } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import { loadAllBanks } from '../../store/bank.js';
import { repo } from '../../store/repo.js';
import { optionsOf } from '../../components/question.js';
import { topicTitle, ERROR_TYPES } from '../../data/taxonomy.js';

export function mistakesView() {
  const wrap = h('div', null, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  loadAllBanks().then(() => wrap.replaceChildren(mistakesInner()));
  return wrap;
}

function mistakesInner() {
  const list = repo.mistakes().filter(({ q }) => topicInPart(q.topic));
  const plain = (s) => String(s).replace(/[$]/g, '');
  return h('div', null,
    h('div', { class: 'page-head' }, h('h1', null, 'دفتر أخطائي'), h('p', null, 'كل خطأ فرصة. أعد المحاولة بعد الشرح البديل.')),
    list.length
      ? h('div', { class: 'list' }, list.map(({ q, attempt }) => {
          const et = ERROR_TYPES.find((e) => e.id === attempt.errType);
          return h('a', { class: 'item', href: `#/practice?q=${q.id}&mode=retry` },
            h('div', { class: 'grow' },
              h('div', { class: 't wrap', html: rich(q.type === 'compare' ? `قارن: ${plain(q.a)} ، ${plain(q.b)}` : q.stem) }),
              h('div', { class: 'row small muted' }, h('span', { class: 'badge' }, topicTitle(q.topic)), et ? h('span', null, et.label) : null)),
            h('span', { class: 'btn sm' }, 'أعد المحاولة'));
        }))
      : h('div', { class: 'card empty' }, h('h3', null, 'دفترك نظيف'), h('p', null, 'لا أخطاء بانتظار المراجعة.'), h('a', { class: 'btn primary', href: '#/practice?mode=quick' }, 'تدرّب الآن')));
}
