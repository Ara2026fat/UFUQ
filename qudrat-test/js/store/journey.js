import { storage } from './storage.js';
const DAY = 864e5;
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const at = (s) => new Date(s + 'T00:00:00');
export function journey() {
  let j = storage.get('journey', null);
  if (!j || !j.start) { j = { start: iso(new Date()), exam: null }; storage.set('journey', j); }
  return j;
}
export function setExam(dateStr) { const j = journey(); storage.set('journey', { ...j, exam: dateStr || null }); }
/** يحسب موضع الطالب في رحلته: اليوم، الإجمالي، المتبقي، المرحلة. */
export function where() {
  const j = journey(), today = at(iso(new Date())), start = at(j.start);
  const day = Math.max(1, Math.round((today - start) / DAY) + 1);
  let total = 22, left = null;
  if (j.exam) { left = Math.round((at(j.exam) - today) / DAY); total = Math.max(day, day + left); if (left < 0) left = null; }
  const remaining = left == null ? Math.max(0, total - day) : left;
  const phase = remaining <= 3 && (j.exam || day > 18) ? 'final' : day <= 7 ? 'base' : 'train';
  return { day, total, remaining, hasExam: !!j.exam && left != null, phase, exam: j.exam };
}
export const PHASES = {
  base: { t: 'التأسيس', b: 'ركّز على فهم المهارات الأساسية. لا تستعجل.' },
  train: { t: 'التدريب المكثّف', b: 'اعمل على أخطائك ونقاط ضعفك، وجرّب محاكاة قصيرة.' },
  final: { t: 'المراجعة الأخيرة', b: 'راجع أخطاءك وأفكار الحل. لا مواد جديدة الآن.' },
};

/* سجلّ الأيام النشطة (لشريط الاستمرارية عند المرشد) */
export function markActive() { const d = iso(new Date()), a = storage.get('active', []); if (a[a.length - 1] !== d) { a.push(d); storage.set('active', a.slice(-90)); } }
export function weekStrip() {
  const a = new Set(storage.get('active', [])), out = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * DAY); out.push({ on: a.has(iso(d)), today: i === 0, dow: d.getDay() }); }
  return out;
}
export function streakDays() {
  const a = new Set(storage.get('active', [])); let n = 0, i = a.has(iso(new Date())) ? 0 : 1;
  for (; i < 90; i++) { if (a.has(iso(new Date(Date.now() - i * DAY)))) n++; else break; }
  return { n, today: a.has(iso(new Date())), ever: a.size > 0 };
}
