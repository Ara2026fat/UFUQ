import { h, toast } from '../../core/dom.js';
import { repo } from '../../store/repo.js';
import { storageMode } from '../../store/storage.js';
import { FEATURES } from '../../core/features.js';
import { api } from '../../core/auth.js';
import { tabbed } from '../../components/tabs.js';

const USERS = [
  { name: 'الأستاذ إبراهيم البربري', role: 'الأستاذ', note: 'يعتمد المحتوى' },
  { name: 'طالب تجريبي ١', role: 'طالب', note: 'بيانات وهمية' },
  { name: 'طالب تجريبي ٢', role: 'طالب', note: 'بيانات وهمية' },
  { name: 'مشرف المحتوى', role: 'محرر', note: 'دور مستقبلي (اختياري)' },
];

export function adminOverview() {
  const qs = repo.questions().filter((q) => !q.twinOnly);
  const stats = () => h('div', { class: 'grid cols-4' },
    h('div', { class: 'tile' }, h('b', null, qs.length), h('span', null, 'سؤال')),
    h('div', { class: 'tile' }, h('b', null, qs.filter((q) => q.status === 'approved').length), h('span', null, 'معتمد')),
    h('div', { class: 'tile' }, h('b', null, repo.attempts().length), h('span', null, 'محاولة')),
    h('div', { class: 'tile' }, h('b', { style: 'font-size:1rem' }, storageMode), h('span', null, 'التخزين الحالي')));
  const on = FEATURES.filter((f) => f.on), later = FEATURES.filter((f) => !f.on);
  const featList = (arr, title) => () => h('section', { class: 'card stack' }, h('h2', null, `${title} (${arr.length})`), h('p', { class: 'muted small' }, 'كل خاصية جديدة تُضاف كمفتاح + مسار + عنصر تنقل، دون المساس بالباقي.'),
    arr.length ? h('div', { class: 'list' }, arr.map((f) => h('div', { class: 'item' }, h('div', { class: 'grow' }, f.title), h('span', { class: `badge ${f.on ? 'ok' : ''}` }, f.on ? 'مفعّل' : 'لاحقاً')))) : h('p', { class: 'muted' }, 'لا شيء.'));
  return h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('h1', null, 'الإدارة'), h('p', null, 'نظرة على حالة المنصة وما سيُفعَّل لاحقاً.')),
    tabbed({ key: 'admin', tabs: [
      { id: 'stats', label: 'نظرة', render: stats },
      { id: 'on', label: 'المفعّل', render: featList(on, 'خصائص مفعّلة') },
      { id: 'later', label: 'لاحقاً', render: featList(later, 'خصائص قادمة') },
    ] }));
}

const AKEY = 'qk_adm';
const fmt = (ms) => ms ? new Date(ms).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'medium', timeStyle: 'short' }) : '—';

export function adminUsers() {
  const root = h('div', { class: 'stack' });
  const head = h('div', { class: 'page-head' }, h('h1', null, 'المسجّلون'), h('p', null, 'الطلاب الذين سجّلوا في التطبيق، الأحدث أولاً.'));
  const body = h('div', { class: 'stack' });
  root.append(head, body);

  const loginBox = (msg) => {
    const pin = h('input', { inputmode: 'numeric', autocomplete: 'off', maxlength: 6, 'aria-label': 'الرقم السري للمشرف', style: 'direction:ltr;text-align:center;font-size:1.3rem;letter-spacing:.3em;max-width:240px' });
    const err = h('p', { class: 'muted small', role: 'alert' }, msg || '');
    const go = async () => {
      const r = await api('/api/login', { method: 'POST', body: { login: 'admin', pin: pin.value } });
      if (r.status === 200 && r.data.token) { try { localStorage.setItem(AKEY, r.data.token); } catch { /* */ } load(); }
      else err.textContent = r.status === 0 ? 'تعذّر الاتصال بالخادم' : 'الرقم غير صحيح أو الحساب مقفل مؤقتاً';
    };
    body.replaceChildren(h('div', { class: 'card stack', style: 'max-width:420px' },
      h('p', null, 'أدخل الرقم السري للمشرف (٦ أرقام) لعرض المسجّلين.'), pin, err,
      h('button', { class: 'btn primary', type: 'button', onClick: go }, 'دخول')));
  };

  const load = async () => {
    let tok = ''; try { tok = localStorage.getItem(AKEY) || ''; } catch { /* */ }
    if (!tok) return loginBox();
    body.replaceChildren(h('p', { class: 'muted' }, 'جارٍ التحميل…'));
    const r = await api('/api/admin/students?limit=500', { token: tok });
    if (r.status === 401 || r.status === 403) { try { localStorage.removeItem(AKEY); } catch { /* */ } return loginBox('انتهت الجلسة. أدخل الرقم من جديد.'); }
    if (r.status !== 200) { body.replaceChildren(h('p', { class: 'muted' }, 'تعذّر التحميل.'), h('button', { class: 'btn', type: 'button', onClick: load }, 'إعادة المحاولة')); return; }
    const list = r.data.students || [];
    body.replaceChildren(
      h('div', { class: 'row-wrap' }, h('span', { class: 'badge ok' }, `${r.data.total} مسجّل`),
        h('button', { class: 'btn sm', type: 'button', onClick: load }, 'تحديث'),
        h('button', { class: 'btn sm ghost', type: 'button', onClick: () => { try { localStorage.removeItem(AKEY); } catch { /* */ } loginBox(); } }, 'خروج')),
      list.length ? h('div', { class: 'list' }, list.map((u) => {
        const wa = /^05\d{8}$/.test(u.phone) ? `https://wa.me/966${u.phone.slice(1)}` : null;
        return h('div', { class: 'item' },
          h('div', { class: 'grow' }, h('div', { class: 't' }, u.name),
            h('small', { class: 'muted' }, `${u.phone} — سجّل ${fmt(u.created_at)} — آخر دخول ${fmt(u.last_login_at)}`)),
          wa ? h('a', { class: 'btn sm ghost', href: wa, target: '_blank', rel: 'noopener' }, 'واتساب') : null);
      })) : h('p', { class: 'muted' }, 'لا يوجد مسجّلون بعد.'));
  };
  load();
  return root;
}

export function adminData() {
  const file = h('input', { type: 'file', accept: 'application/json', class: 'sr', id: 'imp', onChange: async (e) => {
    try { repo.importAll(JSON.parse(await e.target.files[0].text())); toast('تم الاستيراد'); } catch { toast('ملف غير صالح'); }
  } });
  return h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('h1', null, 'البيانات'), h('p', null, 'نسخ احتياطي ونقل المحتوى بين الأجهزة حتى يتوفر الخادم.')),
    h('div', { class: 'card stack' },
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', type: 'button', onClick: () => {
          const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(repo.exportAll(), null, 2)], { type: 'application/json' })), download: 'qudrat-backup.json' });
          a.click(); } }, 'تصدير JSON'),
        h('label', { class: 'btn', for: 'imp' }, 'استيراد JSON'), file),
      h('div', { class: 'row' },
        h('button', { class: 'btn ghost', type: 'button', onClick: () => { if (confirm('مسح تقدّم الطلاب على هذا الجهاز؟')) { repo.resetProgress(); toast('تم'); } } }, 'مسح التقدّم'),
        h('button', { class: 'btn ghost danger', type: 'button', onClick: () => { if (confirm('إعادة المحتوى التجريبي وحذف كل التعديلات؟')) { repo.resetAll(); toast('أُعيد الضبط'); } } }, 'إعادة الضبط'))));
}
