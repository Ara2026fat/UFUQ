import { h, toast } from '../../core/dom.js';
import * as eng from '../../engine/engine.js';
import { loadAllBanks } from '../../store/bank.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/** تقرير ولي الأمر: أيام النشاط وما يحتاج وقتاً أطول فقط — بلا درجات ولا أخطاء. التطبيق حليف الطالب لا عين الأب عليه. */
export function parentView() {
  const wrap = h('p', { class: 'muted' }, 'جارٍ التحميل…');
  loadAllBanks().then(() => eng.loadGraph()).then(() => {
    const S = eng.engineState(), t = eng.today(), active = new Set((S.history || []).map((x) => x.day));
    const week = [...Array(7)].map((_, i) => { const d = t - 6 + i, dt = new Date(Date.now() - (6 - i) * 86400000); return { d, on: active.has(d), name: DAYS[dt.getDay()] }; });
    const n = week.filter((x) => x.on).length;
    const ov = eng.overview();
    const grew = ov.filter((x) => x.status === 'mastered' || x.status === 'near').map((x) => x.name);
    const slower = ov.filter((x) => x.status === 'building' && x.pct > 0).slice(0, 3).map((x) => x.name);
    const text = [`تقرير الأسبوع — أفق قدرات كمي ولفظي`, `أيام التدريب: ${AR(n)} من ٧`, `أطول تتابع: ${AR(S.bestStreak || 0)} يوماً`,
      grew.length ? `ما رسخ لديه: ${grew.join('، ')}` : null, slower.length ? `يحتاج وقتاً أطول (وهذا طبيعي): ${slower.join('، ')}` : null,
      'الأخطاء جزء من التعلّم؛ تشجيعك له هو الأهم.'].filter(Boolean).join('\n');
    wrap.replaceChildren(h('div', { class: 'page-head' }, h('h1', null, 'تقرير الأسبوع'), h('p', null, 'للمشاركة مع وليّ الأمر: أيام النشاط فقط، بلا درجات ولا أخطاء.')),
      h('section', { class: 'card stack' }, h('div', { class: 'row', style: 'gap:6px;flex-wrap:wrap' }, week.map((x) => h('div', { style: `text-align:center;min-width:44px;padding:6px;border-radius:12px;${x.on ? 'background:var(--teal,#0F6B78);color:#fff' : 'opacity:.5;border:1px solid currentColor'}` }, h('small', null, x.name), h('div', null, x.on ? '✓' : '·')))),
        h('b', null, `تدرّب ${AR(n)} أيام من ٧`), h('div', { class: 'muted small' }, `أطول تتابع: ${AR(S.bestStreak || 0)} يوماً — لا يُصفَّر أبداً`)),
      grew.length ? h('section', { class: 'card stack' }, h('h3', { style: 'margin:0' }, 'ما رسخ'), h('p', { style: 'margin:0' }, grew.join('، '))) : null,
      slower.length ? h('section', { class: 'card stack' }, h('h3', { style: 'margin:0' }, 'يحتاج وقتاً أطول'), h('p', { style: 'margin:0' }, slower.join('، ')), h('small', { class: 'muted' }, 'هذا طبيعي — المنهج يعيدها في موعدها.')) : null,
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: `https://wa.me/?text=${encodeURIComponent(text)}`, target: '_blank', rel: 'noopener' }, 'أرسل عبر واتساب'),
        h('button', { class: 'btn', type: 'button', onClick: () => navigator.clipboard?.writeText(text).then(() => toast('نُسخ التقرير')) }, 'انسخ')));
  });
  return wrap;
}
