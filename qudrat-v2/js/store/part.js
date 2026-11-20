// القسم الذي يتدرّب فيه الطالب الآن: «كمي» أو «لفظي». التدريب منفصل؛ الاختبارات (المحاكاة) هي التي تجمع القسمين.
const K = 'qd1:part';
export const PARTS = { quant: 'كمي', verbal: 'لفظي' };
export function getPart() {
  try { const v = localStorage.getItem(K); return v === 'verbal' ? 'verbal' : 'quant'; } catch { return 'quant'; }
}
const paint = () => { try { document.documentElement.dataset.part = getPart(); } catch { /* ignore */ } };
export function setPart(p) { try { localStorage.setItem(K, p === 'verbal' ? 'verbal' : 'quant'); } catch { /* ignore */ } paint(); }
paint();
export const isVerbalTopic = (t) => String(t).startsWith('v_');
export const topicInPart = (t, part = getPart()) => isVerbalTopic(t) === (part === 'verbal');
export const skillInPart = (x, part = getPart()) => (x.part === 'verbal') === (part === 'verbal');
