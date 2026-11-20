import { h, toast } from '../../core/dom.js';
import { go } from '../../core/router.js';
import { LIB_FILES } from '../../data/library.js';

/** مكتبة ملفات الفريق: كل ملف بهويتنا، مصنّف بأكثر من تصنيف. التحميل من صفحة محمية بكلمة سر. */
const HOST = 'https://ufuq-files-x7k.pages.dev/f/';
const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const GROUPS = {
  q: [
    ['freq', 'الأسئلة الأكثر تكراراً', 'مرتبة من الأكثر تكراراً إلى الأقل', ['Q60']],
    ['days', 'تجميعات الأيام', 'الجمعة والسبت والأحد والخميس', ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07']],
    ['paper', 'الورقي ١٤٤٦', 'تجميعات الورقي وبنوك الخميس مساءً', ['Q08', 'Q09']],
    ['murshid', 'الفترة الأولى ١٤٤٧', '', ['Q10', 'Q11', 'Q16']],
    ['top260', 'أهم ٢٦٠ سؤالاً', '', ['Q14', 'Q15']],
    ['five', 'الورقي لخمس سنوات', '١١ جزءاً', Array.from({ length: 11 }, (_, i) => 'Q' + (40 + i))],
    ['red', 'الأقسام الحمراء', '١٤ جزءاً مرتبة بالأقسام', Array.from({ length: 14 }, (_, i) => 'Q' + (70 + i))],
    ['img', 'أسئلة بالصور', '', ['Q13']],
  ],
  v: [
    ['read', 'قطع القراءة', '', ['V02', 'V31']],
    ['vday', 'اللفظي الورقي', 'اللفظي الخميس الورقي والخميس مساءً', ['V01', 'V30']],
  ],
};
const pass = () => { try { return sessionStorage.getItem('ufuq_lib_pw') || ''; } catch { return ''; } };
async function fetchPdf(id) {
  let pw = pass();
  if (!pw) { pw = (prompt('كلمة سر المكتبة (مرة واحدة في هذه الجلسة):') || '').trim(); if (!pw) throw new Error('لم تُدخل كلمة السر'); }
  const r = await fetch(`${HOST}${id}.pdf`, { headers: { Authorization: 'Basic ' + btoa(':' + pw) } });
  if (r.status === 401) { try { sessionStorage.removeItem('ufuq_lib_pw'); } catch { /* */ } throw new Error('كلمة السر غير صحيحة'); }
  if (!r.ok) throw new Error('تعذّر جلب الملف');
  try { sessionStorage.setItem('ufuq_lib_pw', pw); } catch { /* */ }
  return new Uint8Array(await r.arrayBuffer());
}
const safeName = (f) => `أفق قدرات ${f.tags.includes('v') ? 'لفظي' : 'كمي'} - ${f.t.replace(/[\\/:*?"<>|]/g, '').replace(/\s*—\s*/g, ' - ')}.pdf`;

export function libraryView() {
  let tab = 'q', qtext = '';
  const body = h('div', { class: 'stack' }), tabs = h('div', { class: 'part-switch', role: 'tablist' });
  const byId = Object.fromEntries(LIB_FILES.map((f) => [f.id, f]));
  const busy = (btn, on) => { btn.disabled = on; btn.dataset.t ||= btn.textContent; btn.textContent = on ? 'جارٍ…' : btn.dataset.t; };
  const act = (f, mode) => async (e) => {
    const btn = e.currentTarget; busy(btn, true);
    try {
      const bytes = await fetchPdf(f.id), name = safeName(f);
      if (mode === 'live') { window.__ufuqLib = { bytes, name }; go('/t/live'); return; }
      const a = h('a', { href: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), download: name }); document.body.append(a); a.click(); a.remove();
      toast('تم التحميل');
    } catch (err) { toast(err.message || 'تعذّر'); } finally { busy(btn, false); }
  };
  const row = (f) => h('div', { style: 'display:flex;flex-direction:row;gap:8px;align-items:center;padding:8px 0;border-top:1px solid rgba(20,35,74,.08);text-align:start' },
    h('div', { style: 'flex:1;min-width:0' }, h('b', null, f.t), h('div', null, h('small', { class: 'muted' }, `${f.id} · ${AR(f.p)} صفحة`))),
    h('button', { class: 'btn primary sm', style: 'flex:none;width:auto', onClick: act(f, 'live') }, 'حصة'),
    h('button', { class: 'btn ghost sm', style: 'flex:none;width:auto', onClick: act(f, 'dl') }, 'تحميل'));
  const draw = () => {
    tabs.replaceChildren(...[['q', 'كمي'], ['v', 'لفظي']].map(([k, t]) => h('button', { role: 'tab', class: k === tab ? 'on' : '', 'aria-selected': String(k === tab), onClick: () => { tab = k; draw(); } }, t)));
    const secs = [];
    for (const [, title, sub, ids] of GROUPS[tab]) {
      const files = ids.map((i) => byId[i]).filter((f) => f && (!qtext || (f.id + ' ' + f.t + ' ' + f.d).includes(qtext)));
      if (!files.length) continue;
      const d = h('details', { class: 'card', open: qtext || null },
        h('summary', { style: 'cursor:pointer;display:flex;justify-content:space-between;gap:8px;align-items:center' },
          h('span', null, h('b', null, title), sub ? h('div', null, h('small', { class: 'muted' }, sub)) : null), h('span', { class: 'badge ok' }, AR(files.length))),
        ...files.map(row));
      secs.push(d);
    }
    body.replaceChildren(...(secs.length ? secs : [h('p', { class: 'muted' }, 'لا نتائج')]));
  };
  draw();
  return h('div', { class: 'stack' },
    h('h1', null, 'مكتبة الملفات'),
    tabs,
    h('input', { type: 'search', placeholder: 'ابحث بالرمز أو الاسم (مثل Q01 أو الجمعة)', 'aria-label': 'بحث', onInput: (e) => { qtext = e.target.value.trim(); draw(); } }),
    body,
    h('p', { class: 'muted small' }, '«حصة» يفتح الملف في الحصة المباشرة، و«تحميل» يحفظه على جهازك.'));
}
