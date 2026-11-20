import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { isStaff } from '../../core/staff.js';

const T = [
  ['#/courses', 'book', 'الدورات', 'اختر ما يناسبك', 2],
  ['#/exam', 'clipcheck', 'محاكاة الاختبار', 'بالوقت الحقيقي', 3],
  ['#/solve', 'stairs', 'مسألة محلولة', 'خطوة بخطوة', 6],
  ['#/map', 'nodes', 'خريطة مهاراتي', 'أين أنت', 4],
  ['#/parent', 'users', 'تقرير الأسبوع', 'لولي الأمر', 5],
  ['#/settings', 'sliders', 'الإعدادات', 'المظهر والجولات', 7],
  ['#/help', 'book', 'المساعدة', 'كيف أستخدم أفق', 1],
];
export function moreView() {
  const ico = (n) => { const e = h('span', { class: 'ic' }); e.innerHTML = icon(n); return e; };
  return h('div', { class: 'fit more-fit' },
    h('h3', { class: 'sec-t' }, 'المزيد'),
    h('div', { class: 'qgrid' }, T.map(([to, ic, l, s, c]) => h('a', { class: `qt c${c}`, href: to }, ico(ic), h('b', null, l), h('small', null, s)))),
    h('section', { class: 'ad-card' },
      h('button', { class: 'btn primary block', type: 'button', onClick: async () => {
        const data = { title: 'أفق للقدرات — كمي ولفظي', text: 'منصة أفق لتعلّم القدرات كمي ولفظي بإشراف الأستاذ إبراهيم البربري', url: location.origin + location.pathname };
        try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
        try { await navigator.clipboard.writeText(data.url); alert('تم نسخ رابط التطبيق'); } catch (e) { /* */ }
      } }, 'شارك أفق مع أصدقائك')),
    h('div', { class: 'foot-links' }, h('a', { href: '#/privacy' }, 'الخصوصية'), h('a', { href: '#/terms' }, 'الشروط'),
      isStaff() ? null : h('a', { class: 'staff-door', href: '#/staff' }, h('span', { html: icon('lock') }), 'بوابة المعلّمين')));
}
