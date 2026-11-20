/**
 * تسجيل الطالب بالاسم ورقم الجوال فقط.
 * يولّد التطبيق رقماً سرياً من ٤ أرقام ويحفظه في الجهاز دون أن يراه الطالب (الخادم يشترطه).
 * يُستعمل الرقم نفسه لاستعادة الدخول على نفس الجهاز إن مُسحت الجلسة.
 */
import { h } from './dom.js';
import { API_BASE } from './config.js';
import { isStaff } from './staff.js';
import { REPORT_WHATSAPP } from './brand.js';

const SKEY = 'qk_sess', PKEY = 'qk_dp';
const TEST_HOST = /github\.io$/.test(location.hostname);
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

export const session = () => read(SKEY);
if (TEST_HOST) { if (/welcome/.test(location.search)) { try { localStorage.removeItem(SKEY); } catch (e) { /* */ } } else if (!read(SKEY)) write(SKEY, { token: 'test-preview', name: 'تجربة', phone: '0500000000' }); }
export const needsRegistration = () => !session() && !isStaff() && !location.hash.startsWith('#/staff');

export async function api(path, { method = 'GET', body, token } = {}) {
  try {
    const r = await fetch(API_BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {}; try { data = await r.json(); } catch { /* ignore */ }
    return { status: r.status, data };
  } catch { return { status: 0, data: {} }; }
}

const latin = (s) => String(s).replace(/[٠-٩]/g, (c) => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g, (c) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c));
const cleanPhone = (v) => latin(v).replace(/[\s\-().+]/g, '');
const phoneOk = (v) => /^(05\d{8}|5\d{8}|9665\d{8}|009665\d{8}|\d{8,15})$/.test(cleanPhone(v));
const newPin = () => String(Math.floor(1000 + Math.random() * 9000));

const contactUrl = (t) => `https://wa.me/${REPORT_WHATSAPP}?text=${encodeURIComponent(t)}`;

async function attempt(name, phone) {
  if (TEST_HOST) return { ok: true, token: 'test-preview', name };
  const pin = read(PKEY) || newPin();
  write(PKEY, pin);
  const reg = await api('/api/register', { method: 'POST', body: { name, phone, pin } });
  if (reg.status === 201 && reg.data.token) return { ok: true, token: reg.data.token, name: reg.data.user?.name || name };
  if (reg.status === 409) { // الجوال مسجّل: نجرّب الدخول بالرقم المحفوظ على هذا الجهاز
    const lg = await api('/api/login', { method: 'POST', body: { login: phone, pin } });
    if (lg.status === 200 && lg.data.token) return { ok: true, token: lg.data.token, name: lg.data.user?.name || name };
    return { ok: false, msg: 'هذا الجوال مسجّل من قبل على جهاز آخر. تواصل معنا ونفعّله لك.', contact: true };
  }
  if (reg.status === 429) return { ok: false, msg: 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.' };
  if (reg.status === 0) return { ok: false, msg: 'تعذّر الاتصال. تأكد من الإنترنت وأعد المحاولة.' };
  if (reg.status === 400 && reg.data.error) return { ok: false, msg: reg.data.error };
  return { ok: false, msg: 'حدث خطأ مؤقت. أعد المحاولة بعد قليل.' };
}

/** شاشة التسجيل: تُحلّ الوعد حين ينجح التسجيل. */
export function showRegistration() {
  return new Promise((done) => {
    const st = document.createElement('style');
    st.textContent = `.reg{position:fixed;inset:0;z-index:99999;overflow:auto;display:flex;flex-direction:column;align-items:center;padding:34px 24px 28px;background:radial-gradient(90% 40% at 50% 0,rgba(240,196,92,.28),transparent 70%),linear-gradient(180deg,#EEF3FC 0,#FBF7EE 55%,#F7F0E0 100%);color:#12306B;font-family:var(--font);direction:rtl}
    .reg .rg-logo{width:132px;height:auto;margin-top:clamp(8px,6vh,54px)}
    .reg .rg-beta{margin-top:10px;font-size:.78rem;font-weight:700;color:#8A6410;border:1.5px solid #C9A24A;border-radius:99px;padding:3px 12px}
    .reg form{margin-top:clamp(18px,4vh,36px);max-width:360px;width:100%;display:flex;flex-direction:column;gap:14px;text-align:right}
    .reg h1{margin:0;font-size:1.7rem;text-align:center;font-family:'Amiri',var(--font),serif;color:#12306B}
    .reg p{margin:0 0 6px;color:#4B5F82;font-size:.95rem;line-height:1.7;text-align:center}
    .reg label{font-weight:700;font-size:.88rem;display:flex;flex-direction:column;gap:6px;color:#12306B}
    .reg input{font:inherit;font-size:1.1rem;padding:13px 14px;border-radius:14px;border:1.5px solid #D9CFB8;background:#fff;color:#12306B;width:100%;box-sizing:border-box}
    .reg input[name=phone]{direction:ltr;text-align:center;letter-spacing:.1em}
    .reg input:focus-visible,.reg button:focus-visible,.reg a:focus-visible{outline:3px solid #E5A93A;outline-offset:2px}
    .reg .err{min-height:1.3em;color:#B73A25;font-size:.88rem;font-weight:700;text-align:center}
    .reg .rg-go{border:0;border-radius:14px;padding:14px;font:inherit;font-size:1.1rem;font-weight:800;color:#fff;background:linear-gradient(180deg,#2E6FDB,#17469E);box-shadow:0 8px 18px -8px rgba(23,70,158,.6);cursor:pointer}
    .reg .rg-go:disabled{opacity:.7}
    .reg .rg-help{margin-top:auto;padding-top:22px;text-align:center;font-size:.82rem;color:#6A7A99;line-height:1.8;max-width:340px}
    .reg .rg-help a{color:#1C4FB0;font-weight:700;text-decoration:underline;text-underline-offset:3px}`;
    document.head.append(st);
    const name = h('input', { name: 'name', autocomplete: 'name', maxlength: 60, required: true, 'aria-label': 'الاسم' });
    const phone = h('input', { name: 'phone', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: 16, required: true, placeholder: '05XXXXXXXX', 'aria-label': 'رقم الجوال' });
    const err = h('div', { class: 'err', role: 'alert' });
    const btn = h('button', { type: 'submit', class: 'rg-go' }, 'ابدأ');
    const form = h('form', { novalidate: true },
      h('h1', null, 'أهلاً بك في أفق'),
      h('p', null, 'اسمك ورقم جوالك فقط، وتبدأ.'),
      h('label', null, 'الاسم', name),
      h('label', null, 'رقم الجوال', phone),
      err, btn);
    const help = h('div', { class: 'rg-help' }, 'نحفظ اسمك وجوالك ليتابع معك المعلّم. لا نشاركهما مع أحد.', h('br'),
      REPORT_WHATSAPP ? h('a', { target: '_blank', rel: 'noopener', href: contactUrl('أحتاج مساعدة في التسجيل في أفق') }, 'تواصل مع المطوّرين') : null);
    const box = h('div', { class: 'reg' }, h('img', { class: 'rg-logo', src: 'icons/logo-sm.png?v=4', alt: 'أفق' }), h('span', { class: 'rg-beta' }, 'نسخة تجريبية'), form, help);
    document.body.append(box);
    name.focus();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const n = name.value.trim().replace(/\s+/g, ' ');
      if (n.length < 2) { err.textContent = 'اكتب اسمك (حرفان على الأقل)'; name.focus(); return; }
      if (!phoneOk(phone.value)) { err.textContent = 'رقم الجوال غير صحيح'; phone.focus(); return; }
      err.textContent = ''; btn.disabled = true; btn.textContent = 'جارٍ التسجيل…';
      const r = await attempt(n, cleanPhone(phone.value));
      if (r.ok) { write(SKEY, { token: r.token, name: r.name, phone: cleanPhone(phone.value) }); box.remove(); st.remove(); done(); return; }
      err.textContent = r.msg; btn.disabled = false; btn.textContent = 'ابدأ';
    };
  });
}

/** تحقّق هادئ من الجلسة؛ إن أُبطلت (مثلاً أعادت الإدارة ضبط الحساب) نعيد التسجيل. */
export async function verifySession() {
  const s = session(); if (!s) return;
  const r = await api('/api/me', { token: s.token });
  if (r.status === 401) { drop(SKEY); location.reload(); }
}
