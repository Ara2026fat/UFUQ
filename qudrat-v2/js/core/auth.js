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
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

export const session = () => read(SKEY);
const TEST_HOST = /github\.io$/.test(location.hostname);
if (TEST_HOST && !read(SKEY)) write(SKEY, { token: 'test-preview', name: 'تجربة', phone: '0500000000' });
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
    st.textContent = `.reg{position:fixed;inset:0;z-index:99999;overflow:auto;display:grid;place-items:center;padding:20px;background:radial-gradient(120% 70% at 50% 0,rgba(255,226,140,.25),transparent 60%),linear-gradient(170deg,#1E5FCB,#143F9E 55%,#0A2160);font-family:var(--font);direction:rtl}
    .reg form{background:var(--card,#fff);color:var(--ink,#0D3A42);border-radius:22px;padding:24px 20px;max-width:380px;width:100%;display:flex;flex-direction:column;gap:12px;text-align:center;box-shadow:0 20px 50px -14px rgba(0,0,0,.5)}
    .reg h1{margin:0;font-size:1.35rem}.reg p{margin:0;color:var(--ink-2,#47666C);font-size:.95rem;line-height:1.7}
    .reg label{text-align:right;font-weight:700;font-size:.92rem;display:flex;flex-direction:column;gap:6px}
    .reg input{font:inherit;font-size:1.1rem;padding:12px;border-radius:12px;border:2px solid var(--line,#E3DAC6);background:var(--paper,#FAF6EE);color:inherit;width:100%;box-sizing:border-box}
    .reg input[name=phone]{direction:ltr;text-align:center;letter-spacing:.12em}
    .reg input:focus-visible,.reg button:focus-visible,.reg a:focus-visible{outline:3px solid #EE8A22;outline-offset:2px}
    .reg .err{min-height:1.4em;color:var(--bad,#C4432D);font-size:.9rem;font-weight:700}
    .reg small{color:var(--ink-3,#6B868B);font-size:.8rem}`;
    document.head.append(st);
    const name = h('input', { name: 'name', autocomplete: 'name', maxlength: 60, required: true, 'aria-label': 'الاسم' });
    const phone = h('input', { name: 'phone', type: 'tel', inputmode: 'tel', autocomplete: 'tel', maxlength: 16, required: true, placeholder: '05XXXXXXXX', 'aria-label': 'رقم الجوال' });
    const err = h('div', { class: 'err', role: 'alert' });
    const btn = h('button', { type: 'submit', class: 'btn primary' }, 'ابدأ');
    const form = h('form', { novalidate: true },
      h('h1', null, 'أهلاً بك في أفق'),
      h('p', null, 'اكتب اسمك ورقم جوالك لتبدأ. لا تحتاج رقماً سرياً ولا بريداً.'),
      h('label', null, 'الاسم', name),
      h('label', null, 'رقم الجوال', phone),
      err, btn,
      REPORT_WHATSAPP ? h('a', { class: 'btn ghost', target: '_blank', rel: 'noopener', href: contactUrl('أحتاج مساعدة في التسجيل في أفق') }, 'تواصل مع المطوّرين') : null,
      h('small', null, 'نحفظ اسمك وجوالك ليتابع معك المعلّم ويصلك جديد المنصة. لا نشاركهما مع أحد.'));
    const box = h('div', { class: 'reg' }, form);
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
