import { h } from './dom.js';
import { isStaff } from './staff.js';

/**
 * التجربة المجانية: تذوّق محدود لكل طالب. الفريق بلا قيود، والدورة الكاملة تفتح لاحقاً بالتفعيل من الخادم.
 * (الحماية هنا خفيفة على الجهاز؛ القفل الحقيقي يأتي مع دفعة الخادم.)
 */
export const TRIAL = {
  practicePerDay: 3,                                  // جلسات تدريب في اليوم (٥–١٠ أسئلة لكل جلسة)
  openUnits: ['u_frac', 'u_ratios', 'u_percent'],     // وحدات أتعلّم المفتوحة (مع فيديوهات الأستاذ فيها)
  examModes: ['mini'],                                // المحاكاة: القسم المصغّر فقط
  solved: 2,                                          // عدد «المسائل المحلولة» المفتوحة
};
const FULL = 'qk_full';
export const isFull = () => { try { return isStaff() || localStorage.getItem(FULL) === '1'; } catch (e) { return isStaff(); } };
export const isTrial = () => !isFull();
export const unitOpen = (id) => isFull() || TRIAL.openUnits.includes(id);
export const examOpen = (m) => isFull() || TRIAL.examModes.includes(m);

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const read = () => { try { const o = JSON.parse(localStorage.getItem('qk_trial_use') || '{}'); return o.d === dayKey() ? o : { d: dayKey(), n: 0 }; } catch (e) { return { d: dayKey(), n: 0 }; } };
export const practiceLeft = () => (isFull() ? 99 : Math.max(0, TRIAL.practicePerDay - read().n));
export function usePractice() { if (isFull()) return; const o = read(); if (o.t && Date.now() - o.t < 90000) return; /* تحديث الصفحة لا يستهلك جلسة */ o.n += 1; o.t = Date.now(); try { localStorage.setItem('qk_trial_use', JSON.stringify(o)); } catch (e) { /* */ } }

/** بطاقة قفل موحّدة: ما الذي في الدورة الكاملة، ورجوع. */
export function lockCard(title, msg, back = ['#/', 'الرئيسية']) {
  return h('div', { class: 'empty trial-lock' },
    h('div', { class: 'tl-ic', 'aria-hidden': 'true' }, '🔒'),
    h('h2', null, title),
    h('p', { class: 'muted' }, msg),
    h('p', { class: 'small' }, 'أنت الآن في التجربة المجانية. الدورة الكاملة تفتح كل الوحدات والأسئلة والمحاكاة قريباً.'),
    h('a', { class: 'btn primary', href: back[0] }, back[1]));
}
export const lockedChip = () => h('span', { class: 'lt-chip locked' }, '🔒 الدورة الكاملة');
export { AR };
