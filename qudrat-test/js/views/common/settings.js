import { helpEnabled, setHelpEnabled, helpAll } from '../../core/help.js';
import { h, toast } from '../../core/dom.js';
import { storage } from '../../store/storage.js';
import { repo } from '../../store/repo.js';
import { tabbed } from '../../components/tabs.js';
import { COPYRIGHT, BUILD, REPORT_WHATSAPP } from '../../core/brand.js';
import { session } from '../../core/auth.js';
import { isTrial } from '../../core/trial.js';

export const VERSION = '١٫٠ — النسخة التجريبية';
export const getPrefs = () => ({ theme: 'auto', size: 'm', calm: false, ...storage.get('prefs', {}) });
export function applyPrefs() {
  const p = getPrefs(), r = document.documentElement;
  if (p.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', p.theme);
  r.style.fontSize = { s: '15px', m: '16px', l: '18px', xl: '20px' }[p.size] || '16px';
  r.classList.toggle('calm', !!p.calm);
}
const setPref = (k, v) => { storage.set('prefs', { ...getPrefs(), [k]: v }); applyPrefs(); };

const seg = (label, key, opts) => {
  const cur = getPrefs()[key];
  const box = h('div', { class: 'set-seg', role: 'group', 'aria-label': label },
    opts.map(([v, t]) => h('button', { type: 'button', class: 'btn sm ' + (cur === v ? 'primary' : 'ghost'), 'aria-pressed': String(cur === v),
      onClick: () => { setPref(key, v); box.querySelectorAll('button').forEach((b, i) => { const on = opts[i][0] === v; b.className = 'btn sm ' + (on ? 'primary' : 'ghost'); b.setAttribute('aria-pressed', String(on)); }); } }, t)));
  return h('div', { class: 'set-row' }, h('div', { class: 'set-l' }, h('b', null, label)), box);
};

const ABIC = { user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 4-6 8-6s8 2 8 6', phone: 'M9.5 2h5A2.5 2.5 0 0117 4.5v15a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 017 19.5v-15A2.5 2.5 0 019.5 2zM11 18h2', book: 'M3 5h7a2 2 0 012 2v13a2 2 0 00-2-2H3zM21 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7z', chat: 'M4 5h16v11H9l-5 4z', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7', cal: 'M6 5h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2zM4 10h16M9 3v4M15 3v4', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z' };
const abIc = (k) => h('span', { class: 'ab-ic', html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ABIC[k]}"/></svg>` });
const abCard = (ic, t, sub, val, href) => h(href ? 'a' : 'div', { class: 'ab-c', ...(href ? { href, ...(href.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {}) } : {}) }, abIc(ic), h('b', null, t), h('small', null, sub), val ? h('em', null, val) : null);
function aboutPane() {
  const nm = String((session() || {}).name || '').trim();
  const wa = REPORT_WHATSAPP ? `https://wa.me/${REPORT_WHATSAPP}?text=${encodeURIComponent(`استفسار\nالنسخة: ${BUILD}\nالتفاصيل: `)}` : null;
  const t1 = h('div', { class: 'ab-g' },
    abCard('user', 'اسمك', 'يظهر في التحية وحده', nm || null),
    abCard('phone', 'التطبيق', 'الإصدار ' + VERSION, BUILD),
    abCard('cal', 'جدولي', 'ساعات المذاكرة وأوقات الجولات', null, '#/plan'),
    abCard('star', 'ميزان الإتقان', 'نقيس بالفهم لا بالوقت', 'قليلٌ دائمٌ خيرٌ من كثيرٍ منقطع'));
  const t2 = h('div', { class: 'ab-g' },
    abCard('book', 'كيف تستخدم أفق', 'شرح بالصور لكل شاشة', null, '#/help'),
    abCard('chat', 'تواصل مع أفق', 'ملاحظة أو تصحيح في سؤال', null, wa),
    abCard('shield', 'الخصوصية', 'ما نحفظه وما لا نحفظه', null, '#/privacy'),
    abCard('doc', 'شروط الاستخدام', 'الإطلاق التجريبي', null, '#/terms'));
  const t3 = h('div', { class: 'ab-ft' },
    h('img', { src: 'icons/logo-sm.png', alt: '' }),
    h('h2', null, 'أفق قدرات كمي ولفظي'),
    h('div', { class: 'ab-pt' }, 'ثمرة شراكة تعليمية'),
    h('div', { class: 'ab-nm' }, h('span', null, 'عرفات الراجحي'), h('i', null, '◆'), h('span', null, 'الأستاذ إبراهيم البربري')),
    h('div', { class: 'ab-cr' }, '© ٢٠٢٦ أفق — جميع الحقوق محفوظة'),
    h('div', { class: 'ab-q' }, 'لا تحفظ الحل… افهم لماذا أخطأت'));
  return h('section', { class: 'about' }, tabbed({ key: 'about', tabs: [{ id: 'A0', label: 'عني', render: () => t1 }, { id: 'A1', label: 'المساعدة', render: () => t2 }, { id: 'A2', label: 'من نحن', render: () => t3 }] }));
}

function exportData() {
  const data = {}; storage.keys().forEach((k) => { data[k] = storage.get(k); });
  const blob = new Blob([JSON.stringify({ app: 'ufuq-qudrat', v: 1, at: new Date().toISOString(), data })], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'ufuq-progress.json' }); document.body.append(a); a.click(); a.remove();
  toast('حُفظت نسخة من تقدّمك');
}
function importData(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const j = JSON.parse(rd.result);
      if (j.app !== 'ufuq-qudrat' || typeof j.data !== 'object') throw new Error('bad');
      Object.entries(j.data).forEach(([k, v]) => { if (k !== 'role') storage.set(k, v); });
      toast('استُعيد تقدّمك'); setTimeout(() => location.reload(), 700);
    } catch { toast('هذا الملف ليس نسخة صالحة'); }
  };
  rd.readAsText(file);
}


/* التحميل للاستخدام بدون إنترنت: كل بند مستقل؛ الملفات تُحفظ في ذاكرة الجهاز ولا تُحذف مع تحديث التطبيق */
const OFF = 'ufuq-offline-v1';
const OFFITEMS = [
  { id: 'quant', title: 'الأسئلة — كمي', size: '٥ ميجابايت تقريباً', urls: async () => { const i = await (await fetch('data/bank/index.json')).json(); return Object.keys(i).filter((k) => !k.startsWith('v_')).map((k) => `data/bank/${k}.json`).concat(['data/bank/index.json']); } },
  { id: 'verbal', title: 'الأسئلة — لفظي', size: '٣ ميجابايت تقريباً', urls: async () => { const i = await (await fetch('data/bank/index.json')).json(); return Object.keys(i).filter((k) => k.startsWith('v_')).map((k) => `data/bank/${k}.json`); } },
  { id: 'video', title: 'الفيديوهات — دروس الأستاذ', size: '٤٣ ميجابايت تقريباً', urls: async () => { const j = await (await fetch('data/learn/ustaz-media.json')).json(); return Object.values(j.items).flat().flatMap((x) => [x.src, x.poster]).filter(Boolean).map((u) => u.split('?')[0]); } },
];
function offlinePane() {
  if (isTrial()) return h('div', { class: 'card stack' }, h('h3', null, '🔒 تحميل الملفات'), h('p', { class: 'muted' }, 'تحميل الأسئلة وفيديوهات الأستاذ للعمل دون إنترنت يُفتح مع الدورة الكاملة.'));
  const RUNS = [];
  const st = () => storage.get('offline', {});
  const rows = OFFITEMS.map((it) => {
    const msg = h('small', { class: 'muted' }), btn = h('button', { class: 'btn sm primary', type: 'button' }), del = h('button', { class: 'btn sm ghost', type: 'button', hidden: true }, 'احذف');
    const paint = () => { const on = !!st()[it.id]; msg.textContent = on ? 'محمّل — يعمل بدون إنترنت' : `غير محمّل · ${it.size}`; btn.textContent = on ? 'حدّث' : 'حمّل'; del.hidden = !on; };
    const run = async () => {
      btn.disabled = true;
      try {
        const urls = await it.urls(), c = await caches.open(OFF); let n = 0;
        for (const u of urls) { n++; msg.textContent = `جارٍ التحميل ${n} من ${urls.length}…`; const res = await fetch(u, { cache: 'reload' }); if (!res.ok) throw new Error(u); await c.put(u, res); }
        storage.set('offline', { ...st(), [it.id]: Date.now() }); try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* */ }
        toast(`تم تحميل «${it.title}»`);
      } catch { toast('تعذّر إكمال التحميل — تحقق من الاتصال وأعد المحاولة'); }
      btn.disabled = false; paint();
    };
    btn.onclick = run; RUNS.push(run);
    del.onclick = async () => {
      const c = await caches.open(OFF), urls = await it.urls().catch(() => []);
      await Promise.all(urls.map((u) => c.delete(u))); const s2 = st(); delete s2[it.id]; storage.set('offline', s2); paint(); toast('حُذف من جهازك');
    };
    paint();
    return h('div', { class: 'set-row' }, h('div', { class: 'set-l' }, h('b', null, it.title), msg), h('div', { class: 'row-wrap' }, btn, del));
  });
  const all = h('button', { class: 'btn primary block', type: 'button', onClick: async (e) => { e.currentTarget.disabled = true; for (const r of RUNS) await r(); e.currentTarget.disabled = false; } }, 'حمّل كل الملفات');
  return h('section', { class: 'card stack' }, h('h2', null, 'ملفات تحتاج إلى تحميلها'),
    h('p', { class: 'muted small' }, 'حمّل هذه الملفات (الأسئلة والفيديوهات) مرة واحدة ليعمل معك كل شيء مباشرة وبسرعة، حتى بدون إنترنت. يُفضَّل التحميل من شبكة واي فاي.'),
    all, ...rows);
}

export function settingsView() {
  const file = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onChange: (e) => e.target.files[0] && importData(e.target.files[0]) });
  const secs = [
    h('section', { class: 'card stack' }, h('h2', null, 'المظهر'),
      seg('السمة', 'theme', [['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']]),
      seg('حجم الخط', 'size', [['s', 'صغير'], ['m', 'عادي'], ['l', 'كبير'], ['xl', 'أكبر']]),
      seg('الحركة', 'calm', [[false, 'عادية'], [true, 'هادئة (أقل حركة)']]),
      (() => { const cur = helpEnabled(); const box = h('div', { class: 'set-seg', role: 'group', 'aria-label': 'زر الشرح' }, [[true, 'مفعّل'], [false, 'متوقف']].map(([v, t]) => h('button', { type: 'button', class: 'btn sm ' + (cur === v ? 'primary' : 'ghost'), 'aria-pressed': String(cur === v), onClick: () => { setHelpEnabled(v); box.querySelectorAll('button').forEach((b, i) => { const on = !!i === !v; b.className = 'btn sm ' + (on ? 'primary' : 'ghost'); b.setAttribute('aria-pressed', String(on)); }); } }, t))); return h('div', { class: 'set-row' }, h('div', { class: 'set-l' }, h('b', null, 'زر الشرح (؟)'), h('small', { class: 'muted' }, 'يشرح لك كل أيقونة في التطبيق. أوقفه متى لم تعد بحاجة إليه.')), box); })()),
    h('section', { class: 'card stack' }, h('h2', null, 'جدولي'),
      h('p', { class: 'muted small' }, 'حدّد أوقات مذاكرتك وتدريبك في اليوم، وعدّلها متى شئت.'),
      h('a', { class: 'btn primary', href: '#/plan' }, 'ضبط جدولي')),
    h('section', { class: 'card stack' }, h('h2', null, 'تقدّمي'),
      h('p', { class: 'muted small' }, 'تقدّمك محفوظ على هذا الجهاز فقط. احتفظ بنسخة إن أردت نقله إلى جهاز آخر أو أمّنته من الضياع.'),
      h('div', { class: 'row-wrap' },
        h('button', { class: 'btn primary', onClick: exportData }, 'حفظ نسخة من تقدّمي'),
        h('button', { class: 'btn ghost', onClick: () => file.click() }, 'استعادة نسخة'),
        file),
      h('button', { class: 'btn ghost danger', onClick: () => { if (confirm('سيُمسح تقدّمك ونتائجك على هذا الجهاز ولا يمكن التراجع. هل أنت متأكد؟')) { repo.resetAll(); toast('مُسح التقدّم'); setTimeout(() => location.reload(), 600); } } }, 'مسح تقدّمي من هذا الجهاز')),
    h('section', { class: 'card stack' }, h('h2', null, 'المساعدة والسياسات'),
      h('div', { class: 'row-wrap' },
        REPORT_WHATSAPP ? h('select', { class: 'btn ghost', 'aria-label': 'تواصل مع المطوّرين', onChange: (e) => {
          const t = e.target.value; e.target.selectedIndex = 0; if (!t) return;
          window.open(`https://wa.me/${REPORT_WHATSAPP}?text=${encodeURIComponent(`${t}\nالنسخة: ${BUILD}\nالتفاصيل: `)}`, '_blank', 'noopener');
        } },
          h('option', { value: '' }, '💬 تواصل مع المطوّرين'),
          h('option', { value: 'بلاغ: خطأ في سؤال أو إجابة' }, 'خطأ في سؤال أو إجابة'),
          h('option', { value: 'بلاغ: مشكلة في التطبيق' }, 'مشكلة في عمل التطبيق'),
          h('option', { value: 'بلاغ: مشكلة في فيديو أو صوت' }, 'مشكلة في فيديو أو صوت'),
          h('option', { value: 'اقتراح لتحسين التطبيق' }, 'اقتراح لتحسين التطبيق'),
          h('option', { value: 'استفسار' }, 'استفسار آخر')) : null,
        h('a', { class: 'btn ghost', href: '#/help' }, 'مركز المساعدة'),
        h('a', { class: 'btn ghost', href: '#/privacy' }, 'سياسة الخصوصية'),
        h('a', { class: 'btn ghost', href: '#/terms' }, 'شروط الاستخدام'))),
    offlinePane(),
    aboutPane(),
    helpAll()];
  const names = ['المظهر', 'جدولي', 'تقدّمي', 'المساعدة', 'الملفات', 'عن التطبيق', 'شرح الأيقونات'];
  return h('div', { class: 'stack page-narrow' }, h('div', { class: 'page-head' }, h('h1', null, 'الإعدادات')), tabbed({ key: 'settings', tabs: names.map((label, i) => ({ id: 'T' + i, label, render: () => secs[i] })) }));
}

const doc = (title, blocks, groups) => () => h('article', { class: 'stack page-narrow doc' },
  h('div', { class: 'page-head' }, h('h1', null, title)),
  tabbed({ key: 'doc:' + title, tabs: groups.map(([label, ...idx], i) => ({ id: 'D' + i, label, render: () => h('div', { class: 'card stack' }, ...idx.flatMap((k) => { const [hd, ...ps] = blocks[k]; return [h('h2', null, hd), ...ps.map((t) => h('p', null, t))]; })) })) }),
  h('p', { class: 'muted small' }, `آخر تحديث: ${BUILD} — النسخة التجريبية.`),
  h('a', { class: 'btn ghost', href: '#/settings' }, 'العودة للإعدادات'));

export const privacyView = doc('سياسة الخصوصية', [
  ['ما الذي نجمعه؟', 'عند أول استخدام نطلب اسمك ورقم جوالك فقط. نحفظهما على خادمنا ليتابع معك المعلّم ويصلك جديد المنصة، ولا نشاركهما مع أحد. لا نطلب بريداً ولا رقماً سرياً.'],
  ['أين يُحفظ تقدّمك؟', 'اسمك وجوالك يُحفظان على الخادم. أما تقدّمك ونتائج تمارينك وإعداداتك فتُحفظ على جهازك فقط داخل التخزين المحلي للمتصفح، ولا تُرسل إلى الخادم. إن مسحتَ بيانات الموقع من المتصفح أو غيّرتَ الجهاز فلن يظهر تقدّمك؛ لذلك نوفّر «حفظ نسخة من تقدّمي» في الإعدادات.'],
  ['الخطوط والاستضافة', 'يستخدم التطبيق خط جهازك للنصوص، ويحمّل خط الكتابة اليدوية من خدمة Google Fonts، وتُستضاف ملفات التطبيق على Netlify، وقد تسجّل الجهتان بيانات تقنية اعتيادية للطلبات (مثل عنوان الشبكة) وفق سياساتهما. لا نستخدم إعلانات ولا أدوات تتبّع أو تحليلات من أطراف ثالثة.'],
  ['تقرير ولي الأمر', 'يُنشأ التقرير على جهازك من نشاطك، ولا يُرسل إلا إذا اخترتَ مشاركته (واتساب أو نسخ). لا يتضمن درجات ولا قائمة بالأخطاء.'],
  ['حذف بياناتك', 'من الإعدادات اختر «مسح تقدّمي من هذا الجهاز»، أو امسح بيانات الموقع من إعدادات المتصفح.'],
  ['الأطفال', 'لا نجمع بيانات شخصية من أحد. ننصح أولياء الأمور بمتابعة استخدام أبنائهم للتطبيق.'],
  ['التغييرات', 'عند إضافة حسابات أو مزامنة عبر الإنترنت سنحدّث هذه السياسة قبل العمل بها، ونبيّن ما سيُحفظ ولماذا.'],
], [['ما نجمعه', 0], ['تقدّمك', 1], ['الاستضافة', 2], ['ولي الأمر', 3], ['الحذف والأطفال', 4, 5], ['التغييرات', 6]]);
export const termsView = doc('شروط الاستخدام', [
  ['النسخة التجريبية', 'تقدّم «أفق» هذه النسخة بوصفها الإطلاق التجريبي للمنصة، وتُوسَّع وتُحسَّن باستمرار بإشراف الأستاذ إبراهيم البربري، وقد تتغير بعض الميزات والمحتوى خلال هذه المرحلة. ملاحظاتك تصنع النسخة الكاملة، فلا تتردد في إرسالها.'],
  ['الغرض', 'التطبيق أداة تعليمية للتدرّب على القدرات (الكمي واللفظي). هو وسيلة مساعدة للتعلّم ولا يضمن نتيجة معيّنة في الاختبار.'],
  ['المحتوى', 'الأسئلة والشروحات والتصاميم والتسجيلات الصوتية حقوقها محفوظة لـ«أفق قدرات كمي ولفظي»، بإشراف الأستاذ إبراهيم البربري. يُسمح بالاستخدام الشخصي للدراسة، ولا يجوز نسخ المحتوى أو إعادة نشره أو بيعه.'],
  ['دقة المحتوى', 'نبذل جهدنا في دقة الأسئلة والحلول، وقد يخضع بعضها للمراجعة والتحديث. إن وجدتَ خطأً فأبلغنا عبر أيقونة البلاغ.'],
  ['الاستخدام المقبول', 'لا يجوز محاولة اختراق التطبيق أو الوصول إلى ما لم يُتَح لك أو استخدامه لغير غرضه التعليمي.'],
  ['التغييرات', 'قد تتغير ميزات التطبيق وهذه الشروط مع تطوّره، واستمرارك في الاستخدام يعني موافقتك على النسخة الحالية.'],
], [['النسخة التجريبية', 0], ['الغرض', 1], ['المحتوى', 2], ['الدقة', 3], ['الاستخدام والتغيير', 4, 5]]);
export const helpView = doc('مركز المساعدة', [
  ['كيف أبدأ؟', 'من الرئيسية افتح «جولة اليوم» وأتمّ جولاتها. يتكيّف التطبيق مع مستواك: يبسّط حين تتعثّر ويرفع الصعوبة حين تتقدّم.'],
  ['ماذا يحدث إذا أخطأت؟', 'تُعرض لك فكرة الحل ولماذا اخترتَ ذلك الخيار، ثم مثال مشابه. وتجد أسئلتك الخاطئة في «أخطائي» لتعيدها لاحقاً.'],
  ['هل أستخدمه بلا إنترنت؟', 'بعد فتحه مرة واحدة تعمل أغلب الصفحات دون اتصال، وبعض الأصوات والأسئلة تحتاج اتصالاً في أول استخدام.'],
  ['كيف أثبّته على جوالي؟', 'في أندرويد: قائمة المتصفح ثم «تثبيت التطبيق». في آيفون (سفاري): زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».'],
  ['فقدتُ تقدّمي أو غيّرتُ جهازي', 'التقدّم محفوظ على الجهاز فقط. استخدم «حفظ نسخة من تقدّمي» في الإعدادات ثم «استعادة نسخة» على الجهاز الجديد.'],
  ['الصوت لا يعمل', 'تأكد من رفع صوت الجهاز ومن أن المتصفح لا يمنع التشغيل التلقائي، ثم اضغط زر «استمع» من جديد.'],
  ['الإبلاغ عن خطأ أو اقتراح', 'اضغط أيقونة البلاغ في أعلى الشاشة لتصلنا رسالتك عبر واتساب مع رقم السؤال، واذكر ما لاحظتَه.'],
], [['البداية', 0, 1], ['دون إنترنت', 2], ['التثبيت', 3], ['تقدّمي', 4], ['الصوت', 5], ['الإبلاغ', 6]]);
