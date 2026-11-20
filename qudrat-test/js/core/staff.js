/**
 * فصل واجهة الطالب عن واجهة الأستاذ والإدارة.
 * الطالب لا يرى شيئاً من أدوات المراجعة (حالات الأسئلة، ملاحظات الاعتماد، تبديل الواجهات).
 * يفتح الفريق عبر الرابط  #/staff  برمز خاص. (حماية خفيفة للمرحلة الحالية، والحسابات الحقيقية تأتي مع الخادم.)
 */
const HASH = 'd4ced582f35ea4e8faba5cce543b81aa9d5acf3d1372ba9c1b576ac14fb4ce0e';
const KEY = 'qk_staff';
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
export const isStaff = () => { try { return localStorage.getItem(KEY) === HASH; } catch (e) { return false; } };
export async function unlockStaff(code) {
  if ((await sha('qudrat-staff:' + String(code).trim())) !== HASH) return false;
  try { localStorage.setItem(KEY, HASH); } catch (e) { return false; }
  return true;
}
export const lockStaff = () => { try { localStorage.removeItem(KEY); localStorage.removeItem('qd1:role'); } catch (e) {} };
/** يعيد العنصر للفريق فقط، ولا شيء للطالب. */
export const staffOnly = (node) => (isStaff() ? node : null);
