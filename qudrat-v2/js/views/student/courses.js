import { h } from '../../core/dom.js';
import { tabbed } from '../../components/tabs.js';
import { isTrial } from '../../core/trial.js';

/* الدورات: هيكل موحّد (المدة · المسار · الإيقاع · الاختبارات) من data/courses.json.
   كل دورة تعرض قبل الدخول: الهدف، ماذا ستتعلم، لمن هي، الفائدة، وهل أنت جاهز لها. */
let CACHE = null;
const load = () => (CACHE ? Promise.resolve(CACHE) : fetch('data/courses.json').then((r) => r.json()).then((j) => (CACHE = j)).catch(() => (CACHE = { courses: [], readiness: [] })));
const AR = (n) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const list = (a) => h('ul', { class: 'crs-ul' }, a.map((x) => h('li', null, x)));
const block = (t, body) => h('section', { class: 'crs-b' }, h('h4', null, t), body);

export function coursesView() {
  const root = h('div', { class: 'fit crs' }, h('h3', { class: 'sec-t' }, 'الدورات'), h('p', { class: 'muted' }, 'اختر ما يناسب وقتك ومستواك.'));
  load().then((D) => root.append(...D.courses.map((c) => h('a', { class: 'card crs-card' + (c.status === 'soon' ? ' soon' : ''), href: `#/course/${c.id}` },
    h('div', { class: 'row', style: 'justify-content:space-between;align-items:center' }, h('b', null, c.title), h('span', { class: 'badge info' }, c.status === 'soon' ? 'قريباً' : c.badge)),
    h('p', { class: 'small', style: 'margin:6px 0 0' }, c.tagline),
    h('small', { class: 'muted' }, `${c.track} · ${c.rhythm}`)))));
  return root;
}

export function courseView(ctx) {
  const root = h('div', { class: 'fit crs' });
  load().then((D) => {
    const c = D.courses.find((x) => x.id === ctx.params.id);
    if (!c) { root.append(h('p', null, 'لم نجد هذه الدورة.'), h('a', { class: 'btn ghost', href: '#/courses' }, 'كل الدورات')); return; }
    const head = h('div', { class: 'crs-head' }, h('a', { class: 'small', href: '#/courses' }, '‹ الدورات'), h('h3', { class: 'sec-t' }, c.title),
      h('p', { class: 'muted small' }, `${c.badge} · ${c.track}`));
    const about = () => h('div', { class: 'stack' }, block('هدف الدورة', h('p', null, c.goal)), block('ماذا ستتعلم', list(c.learn)), block('ماذا ستستفيد', list(c.benefit)),
      block('الإيقاع', h('p', null, c.rhythm)));
    const who = () => h('div', { class: 'stack' }, block('لمن هذه الدورة', list(c.forWho)), block('ليست مناسبة لـ', list(c.notFor)));
    const plan = () => !c.plan.length ? h('div', { class: 'card' }, h('p', null, 'برنامج هذه الدورة قيد الإعداد بإشراف الأستاذ، وسنعلن عند فتحها.'))
      : h('div', { class: 'stack' }, c.plan.map((p) => h('div', { class: 'card crs-day' }, h('b', null, `اليوم ${AR(p.d)}`), h('span', null, p.t),
        h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, p.a.map(([l, to]) => h('a', { class: 'btn ghost sm', href: to }, l))))));
    const ready = () => {
      const out = h('div', { class: 'card', hidden: true }), picks = {};
      const qs = D.readiness.map((r, i) => h('div', { class: 'crs-q' }, h('p', null, r.q), h('div', { class: 'row', style: 'gap:6px' },
        ['نعم', 'لا'].map((l, k) => h('button', { class: 'btn ghost sm', type: 'button', onClick: (e) => { picks[i] = k === 0; [...e.currentTarget.parentNode.children].forEach((b) => b.classList.remove('primary')); e.currentTarget.classList.add('primary'); verdict(); } }, l)))));
      const verdict = () => {
        if (Object.keys(picks).length < D.readiness.length) return;
        const basics = D.readiness.every((r, i) => r.w !== 'b' || picks[i]), time = picks[3];
        let t = basics ? (time ? 'أنت جاهز لهذه الدورة إن كان هدفك التثبيت والمراجعة.' : 'أساسك جيد والوقت قصير: الأنسب لك الدورة المكثّفة للاختبار الورقي.') : (time ? 'ننصحك بالبدء بدورة التأسيس لتقوية الأساس أولاً.' : 'ابدأ بالأساسيات الأهم أولاً داخل الدورة المكثّفة، ولا تتجاوز ما لم تتقنه.');
        out.hidden = false; out.replaceChildren(h('b', null, 'التوصية'), h('p', null, t));
      };
      return h('div', { class: 'stack' }, h('p', { class: 'muted small' }, 'أربعة أسئلة سريعة تعرف بها هل هذه الدورة مناسبة لك الآن:'), ...qs, out);
    };
    root.append(head, tabbed({ key: 'course-' + c.id, tabs: [{ id: 'a', label: 'نظرة عامة', render: about }, { id: 'w', label: 'لمن؟', render: who }, { id: 'p', label: 'البرنامج', render: plan }, { id: 'r', label: 'هل أنا جاهز؟', render: ready }] }),
      c.status === 'soon' ? h('p', { class: 'muted small' }, 'هذه الدورة غير مفتوحة بعد.') : isTrial() ? h('div', { class: 'card' }, h('b', null, '🔒 الدورة الكاملة'), h('p', { class: 'muted small' }, 'تُفتح قريباً. أنت الآن في التجربة المجانية: جرّب الوحدات المفتوحة والتدريب اليومي والقسم المصغّر.'), h('a', { class: 'btn ghost sm', href: '#/learn-hub' }, 'ابدأ التجربة')) : h('a', { class: 'btn primary block', href: c.plan[0] ? c.plan[0].a[0][1] : '#/practice' }, 'ابدأ اليوم الأول'));
  });
  return root;
}
