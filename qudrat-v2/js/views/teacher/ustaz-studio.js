/**
 * استوديو الأستاذ — إضافة شرح الأستاذ (تسجيل / رفع / نص / سبّورة) لكل وحدة ومرحلة.
 * المخزن: js/store/ustaz.js (انظر docs/learn-contract.md).
 * ARAFAT ALRAJHI © 2026
 */
import { h, toast } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import * as store from '../../store/ustaz.js';
import { tabbed } from '../../components/tabs.js';
import { REPORT_WHATSAPP } from '../../core/brand.js';

const STAGE_LABEL = { idea: 'الفكرة', rule: 'القاعدة', example: 'مثال', corner: 'ركن الأستاذ' };
const STAGE_HINT = {
  idea: 'اشرح فكرة الدرس بكلماتك: ما المقصود وما فائدته؟',
  rule: 'اشرح القاعدة وطريقة التفكير، وانتبه للفخاخ الشائعة.',
  example: 'حلّ مثالًا خطوة بخطوة أمام الطالب.',
  corner: 'مساحتك الحرّة: نصائح، حيل سريعة، أو أي شيء تحب إضافته.',
};
const TYPE_LABEL = { video: 'فيديو', audio: 'صوت', image: 'صورة', text: 'نص' };
const BIG_FILE = 150 * 1024 * 1024;
const BY = 'ustaz';

/* ---------- أدوات ---------- */
const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const fmtSize = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} ميغابايت` : `${Math.max(1, Math.round(n / 1024))} كيلوبايت`);
const ready = (fn) => { try { return fn(); } catch (e) { return null; } };

/** نص بسيط: **عريض** + $ رياضيات $ + أسطر. */
export function formatText(text = '') {
  return rich(text).replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}

function mediaError(e, what = 'الكاميرا أو الميكروفون') {
  const n = e && e.name;
  if (!window.isSecureContext && !(navigator.mediaDevices)) return 'التسجيل يحتاج فتح التطبيق عبر رابط آمن (https).';
  if (n === 'NotAllowedError' || n === 'SecurityError') return `لم يُسمح بالوصول إلى ${what}. اضغط على أيقونة القفل بجانب عنوان الصفحة، اختر «سماح»، ثم أعد المحاولة.`;
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return `لم يُعثر على ${what} في هذا الجهاز.`;
  if (n === 'NotReadableError' || n === 'AbortError') return `${what} مستخدم من تطبيق آخر. أغلق التطبيقات الأخرى وأعد المحاولة.`;
  return `تعذّر بدء التسجيل (${(e && (e.message || e.name)) || 'خطأ غير معروف'}).`;
}

function pickMime(kind) {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  const list = kind === 'audio'
    ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    : ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4', 'audio/webm'];
  return list.find((m) => ready(() => MediaRecorder.isTypeSupported(m))) || '';
}

const stopStream = (s) => { if (s) s.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* ignore */ } }); };

/* ---------- العرض الرئيسي ---------- */
export function studioView(ctx = {}) {
  // اربط ملف الأنماط إن لم يربطه المنسّق
  if (!document.querySelector('link[href$="css/studio.css"]')) {
    document.head.append(h('link', { rel: 'stylesheet', href: new URL('../../../css/studio.css', import.meta.url).href }));
  }

  let units = [];
  let unitId = (ctx.params && ctx.params.id) || '';
  let stage = STAGES_OK(ctx.query && ctx.query.stage) ? ctx.query.stage : 'idea';
  let busy = false;
  let activeDispose = null; // تنظيف اللوحة المفتوحة (تحرير الكاميرا…)
  const disposers = new Set();

  const root = h('div', { class: 'studio stack' });
  const unitSel = h('select', { class: 'st-select', 'aria-label': 'اختر الوحدة', onChange: (e) => switchTo({ u: e.target.value }) });
  const tabsEl = h('div', { class: 'st-tabs', role: 'tablist', 'aria-label': 'مراحل الوحدة' });
  const hintEl = h('p', { class: 'st-hint' });
  const modesEl = h('div', { class: 'st-modes' });
  const panelEl = h('div', { class: 'st-panel' });
  const listEl = h('div', { class: 'st-list' });
  const listTitle = h('h2', { class: 'st-h2' });

  function disposeAll() { for (const d of [...disposers]) { try { d(); } catch (e) { /* ignore */ } } disposers.clear(); activeDispose = null; }
  const onHash = () => { disposeAll(); removeEventListener('hashchange', onHash); removeEventListener('pagehide', disposeAll); };
  addEventListener('hashchange', onHash);
  addEventListener('pagehide', disposeAll);

  function register(d) { disposers.add(d); return () => { disposers.delete(d); }; }

  function closePanel() { if (activeDispose) { activeDispose(); activeDispose = null; } panelEl.replaceChildren(); mode = ''; paintModes(); }

  function switchTo({ u, s }) {
    if (activeDispose && panelEl.querySelector('[data-recording]') && !confirm('يوجد تسجيل جارٍ. هل تريد إلغاءه والانتقال؟')) {
      unitSel.value = unitId; return;
    }
    closePanel();
    if (u != null) unitId = u;
    if (s != null) stage = s;
    paintAll();
  }

  /* ---------- الوحدات والمراحل ---------- */
  const stageCount = (u, s) => (ready(() => store.listItems(u, s)) || []).length;
  const unitTitle = (u) => (u && (u.title || u.id)) || '';

  function paintUnits() {
    unitSel.replaceChildren(...units.map((u) => {
      const filled = store.STAGES.filter((s) => stageCount(u.id, s) > 0).length;
      return h('option', { value: u.id, selected: u.id === unitId ? '' : null }, `${unitTitle(u)}  —  ${filled ? `✓ ${filled}/4 مراحل` : 'لا شرح بعد'}`);
    }));
    unitSel.value = unitId;
  }

  function paintTabs() {
    tabsEl.replaceChildren(...store.STAGES.map((s) => {
      const n = stageCount(unitId, s);
      return h('button', { type: 'button', role: 'tab', class: 'st-tab', 'aria-selected': s === stage ? 'true' : 'false', onClick: () => switchTo({ s }) },
        h('span', { class: 'st-tab-t' }, STAGE_LABEL[s]),
        h('span', { class: `st-tab-n${n ? ' on' : ''}` }, n ? `${n} ✓` : 'فارغ'));
    }));
    hintEl.textContent = STAGE_HINT[stage] || '';
  }

  let mode = '';
  const MODES = [
    ['rec', '🎥', 'تسجيل مباشر', 'كاميرا أو شاشة أو صوت'],
    ['up', '📁', 'رفع ملف', 'فيديو أو صوت أو صورة'],
    ['txt', '✍️', 'شرح كتابي', 'نص مع معادلات'],
    ['board', '🖊️', 'سبّورة', 'اكتب بخط يدك'],
  ];
  function paintModes() {
    modesEl.replaceChildren(...MODES.map(([k, ic, t, sub]) => h('button', {
      type: 'button', class: `st-mode${mode === k ? ' on' : ''}`, 'aria-pressed': mode === k ? 'true' : 'false', 'data-mode': k,
      onClick: () => openMode(mode === k ? '' : k),
    }, h('span', { class: 'st-mode-ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'st-mode-t' }, t), h('span', { class: 'st-mode-s' }, sub))));
  }

  async function commit(item, blob) {
    try {
      const saved = await store.addItem(unitId, stage, { by: BY, ...item }, blob);
      toast('تم الحفظ ✓');
      closePanel();
      paintAll();
      return saved;
    } catch (e) {
      toast('تعذّر الحفظ: ' + (e && e.message ? e.message : 'مساحة التخزين ممتلئة أو المتصفح يمنع الحفظ'), 5000);
      throw e;
    }
  }

  function openMode(k) {
    if (activeDispose && panelEl.querySelector('[data-recording]') && !confirm('يوجد تسجيل جارٍ. هل تريد إلغاءه؟')) return;
    if (activeDispose) { activeDispose(); activeDispose = null; }
    mode = k;
    paintModes();
    if (!k) { panelEl.replaceChildren(); return; }
    const make = { rec: recorderPanel, up: uploadPanel, txt: textPanel, board: boardPanel }[k];
    const { node, dispose } = make({ commit, register, close: () => closePanel() });
    activeDispose = dispose || null;
    panelEl.replaceChildren(node);
    panelEl.scrollIntoView && panelEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ---------- قائمة العناصر ---------- */
  const isShipped = (it) => !!it.src && !it.blobId;

  async function rebuild(items, fromIdx, order, mutate) {
    // أضِف نسخًا جديدة بالترتيب المطلوب أولًا ثم احذف الأصول (لا فقدان بيانات عند الفشل)
    busy = true; paintList();
    const added = [];
    try {
      for (const it of order) {
        let blob;
        if (it.blobId || (it.src && it.type !== 'text')) {
          blob = await (await fetch(await store.mediaURL(it))).blob();
        }
        const { id, ts, blobId, ...rest } = it;
        const copy = mutate && mutate.id === it.id ? { ...rest, ...mutate.patch } : rest;
        await store.addItem(unitId, stage, copy, blob);
        added.push(it);
      }
      for (const it of order) await store.removeItem(unitId, stage, it.id);
    } catch (e) {
      toast('تعذّر تنفيذ العملية: ' + (e && e.message ? e.message : 'خطأ'), 5000);
    }
    busy = false; paintAll();
  }

  async function rename(it, items, idx) {
    const t = prompt('الاسم الجديد:', it.title || '');
    if (t == null || !t.trim() || t.trim() === it.title) return;
    if (typeof store.renameItem === 'function') { await store.renameItem(unitId, stage, it.id, t.trim()); return paintAll(); }
    await rebuild(items, idx, items.slice(idx), { id: it.id, patch: { title: t.trim() } });
  }
  async function move(it, items, idx, dir) {
    const j = idx + dir;
    if (j < 0 || j >= items.length || isShipped(items[j]) || isShipped(it)) return;
    if (typeof store.moveItem === 'function') { await store.moveItem(unitId, stage, it.id, dir); return paintAll(); }
    const lo = Math.min(idx, j);
    const tail = items.slice(lo);
    const a = idx - lo; const b = j - lo;
    [tail[a], tail[b]] = [tail[b], tail[a]];
    if (tail.some(isShipped)) return toast('لا يمكن إعادة ترتيب عناصر مدمجة مع التطبيق');
    await rebuild(items, lo, tail);
  }
  async function del(it) {
    if (!confirm(`حذف «${it.title || TYPE_LABEL[it.type]}» نهائيًا؟`)) return;
    try { await store.removeItem(unitId, stage, it.id); toast('تم الحذف'); } catch (e) { toast('تعذّر الحذف'); }
    paintAll();
  }

  function itemPreview(it) {
    const box = h('div', { class: 'st-prev' });
    if (it.type === 'text') { box.append(h('div', { class: 'st-text', html: formatText(it.text || '') })); return box; }
    const tag = it.type === 'video' ? 'video' : it.type === 'audio' ? 'audio' : 'img';
    const el = h(tag, tag === 'img' ? { alt: it.title || 'صورة', loading: 'lazy' } : { controls: true, preload: 'metadata', playsinline: true });
    box.append(el);
    Promise.resolve(store.mediaURL(it)).then((u) => { if (u) el.src = u; }).catch(() => { box.replaceChildren(h('p', { class: 'st-err' }, 'تعذّر عرض الملف')); });
    return box;
  }

  function paintList() {
    const items = ready(() => store.listItems(unitId, stage)) || [];
    listTitle.textContent = `ما أضفته في «${STAGE_LABEL[stage]}» (${items.length})`;
    if (!items.length) { listEl.replaceChildren(h('div', { class: 'st-empty' }, 'لا يوجد شرح لهذه المرحلة بعد. اختر إحدى طرق الإضافة بالأعلى.')); return; }
    listEl.replaceChildren(...items.map((it, idx) => {
      const ship = isShipped(it);
      const dis = busy ? '' : null;
      return h('article', { class: 'st-item' },
        h('div', { class: 'st-item-h' },
          h('span', { class: `st-badge t-${it.type}` }, TYPE_LABEL[it.type] || it.type),
          h('strong', { class: 'st-item-t' }, it.title || 'بدون عنوان'),
          ship ? h('span', { class: 'st-ship' }, 'منشور مع التطبيق') : null,
          it.duration ? h('span', { class: 'st-dur' }, fmtTime(it.duration)) : null),
        itemPreview(it),
        ship ? null : h('div', { class: 'st-item-a' },
          h('button', { type: 'button', class: 'st-btn sm', disabled: dis || (idx === 0 ? '' : null), 'aria-label': 'تحريك للأعلى', onClick: () => move(it, items, idx, -1) }, '▲ أعلى'),
          h('button', { type: 'button', class: 'st-btn sm', disabled: dis || (idx === items.length - 1 ? '' : null), 'aria-label': 'تحريك للأسفل', onClick: () => move(it, items, idx, 1) }, '▼ أسفل'),
          h('button', { type: 'button', class: 'st-btn sm', disabled: dis, onClick: () => rename(it, items, idx) }, '✏️ تسمية'),
          h('button', { type: 'button', class: 'st-btn sm danger', disabled: dis, onClick: () => del(it) }, '🗑 حذف')));
    }));
    if (busy) listEl.prepend(h('div', { class: 'st-busy' }, 'جارٍ التنفيذ… لا تغلق الصفحة'));
  }

  function paintAll() { paintUnits(); paintTabs(); paintModes(); paintList(); }

  /* ---------- النسخ الاحتياطي ---------- */
  const importInput = h('input', { type: 'file', accept: '.zip,.json,application/zip,application/json', hidden: true, onChange: async (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (!confirm('سيُدمج محتوى الملف مع المحتوى الموجود على هذا الجهاز. متابعة؟')) return;
    try { await store.importBundle(f); toast('تم الاستيراد ✓'); paintAll(); } catch (err) { toast('الملف غير صالح: ' + (err && err.message ? err.message : ''), 5000); }
  } });
  async function sendToAdmin() {
    try {
      toast('جارٍ تجهيز الملف…');
      const { blob, count, name } = await store.exportZip();
      if (!count) return toast('لا يوجد شرح لإرساله بعد. أضف شيئًا أولًا.', 4000);
      const file = new File([blob], name, { type: 'application/zip' });
      const text = `شرح الأستاذ من استوديو أفق — ${count} عنصر. (ملف مضغوط: افتحه من الإدارة بخيار «استيراد»)`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: 'شرح الأستاذ — أفق', text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const a = h('a', { href: URL.createObjectURL(blob), download: name });
      document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast('نُزّل الملف. أُفتح واتساب الآن — أرفقه من «المستندات».', 6000);
      setTimeout(() => window.open(`https://wa.me/${REPORT_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'), 900);
    } catch (e) { toast('تعذّر تجهيز الملف: ' + (e && e.message ? e.message : ''), 5000); }
  }
  async function doExport() {
    try {
      const blob = await store.exportBundle();
      const a = h('a', { href: URL.createObjectURL(blob), download: `ustaz-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast('تم تنزيل النسخة الاحتياطية');
    } catch (e) { toast('تعذّر إنشاء النسخة: ' + (e && e.message ? e.message : ''), 5000); }
  }

  root.append(
    h('header', { class: 'st-head' },
      h('h1', null, 'استوديو الأستاذ'),
      h('p', { class: 'st-sub' }, 'سجّل شرحك أو ارفعه أو اكتبه، وسيظهر للطالب موسومًا باسم «الأستاذ إبراهيم البربري».')),
    h('section', { class: 'st-card' },
      h('label', { class: 'st-lbl', for: 'st-unit' }, '١) اختر الوحدة'),
      (unitSel.id = 'st-unit', unitSel),
      h('div', { class: 'st-lbl', style: 'margin-top:12px' }, '٢) اختر المرحلة'),
      tabsEl, hintEl),
    tabbed({ key: 'studio', tabs: [
      { id: 'add', label: 'إضافة شرح', render: () => h('section', { class: 'st-card' }, h('div', { class: 'st-lbl' }, '٣) أضف شرحك'), modesEl, panelEl) },
      { id: 'list', label: 'ما أضفته', render: () => h('section', { class: 'st-card' }, listTitle, listEl) },
      { id: 'backup', label: 'نسخ احتياطي', render: () => h('section', { class: 'st-card st-backup' },
        h('h2', { class: 'st-h2' }, 'نسخ احتياطي'),
        h('p', { class: 'st-note' }, 'ما تضيفه هنا يُحفظ على هذا الجهاز فقط إلى أن يُنشر مع التطبيق. لا تمسح بيانات المتصفح قبل أخذ نسخة. ولنشر الفيديوهات للطلاب تُسلَّم الملفات للمطوّر ليضعها في مجلد media/ustaz.'),
        h('div', { class: 'st-row' },
          h('button', { type: 'button', class: 'st-btn st-primary', onClick: sendToAdmin }, '📤 إرسال للإدارة (واتساب)'),
          h('button', { type: 'button', class: 'st-btn', onClick: doExport }, '⬇️ نسخة احتياطية'),
          h('button', { type: 'button', class: 'st-btn', onClick: () => importInput.click() }, '⬆️ استيراد'),
          importInput)) },
    ] }));

  /* ---------- تحميل ---------- */
  root.append(h('div', { class: 'st-loading', id: 'st-loading' }, 'جارٍ التحميل…'));
  Promise.resolve(store.getUnits()).then(async (data) => {
    try { await store.loadShipped(); } catch (e) { /* اختياري */ }
    units = normalizeUnits(data);
    if (!units.find((u) => u.id === unitId)) unitId = units[0] ? units[0].id : '';
    root.querySelector('#st-loading')?.remove();
    if (!units.length) { root.prepend(h('div', { class: 'st-empty' }, 'لا توجد وحدات بعد.')); return; }
    paintAll();
  }).catch(() => { root.querySelector('#st-loading')?.replaceChildren('تعذّر تحميل الوحدات. تحقق من الاتصال وأعد المحاولة.'); });

  return root;
}

function STAGES_OK(s) { return ['idea', 'rule', 'example', 'corner'].includes(s); }

function normalizeUnits(data) {
  let arr = [];
  if (Array.isArray(data)) arr = data;
  else if (data && Array.isArray(data.units)) arr = data.units;
  else if (data && data.units && typeof data.units === 'object') arr = Object.values(data.units);
  else if (data && typeof data === 'object') arr = Object.values(data).filter((v) => v && v.id);
  return arr.filter((u) => u && u.id).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/* ======================================================================
 *  تسجيل مباشر
 * ==================================================================== */
function recorderPanel({ commit, register }) {
  const hasMR = typeof MediaRecorder !== 'undefined';
  const hasCam = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasScreen = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) && !/iPhone|iPad|iPod/.test(navigator.userAgent);
  let source = 'camera';
  let stream = null; let extra = []; let rec = null; let chunks = []; let mimeUsed = ''; let kind = 'video';
  let elapsed = 0; let tickStart = 0; let timer = null; let state = 'idle'; let blob = null; let url = '';

  const node = h('div', { class: 'st-rec' });
  const unreg = register(cleanup);

  function cleanup() {
    clearInterval(timer); timer = null;
    if (rec && rec.state !== 'inactive') { rec.onstop = null; try { rec.stop(); } catch (e) { /* */ } }
    stopStream(stream); extra.forEach(stopStream); stream = null; extra = []; rec = null;
    if (url) { URL.revokeObjectURL(url); url = ''; }
  }

  const err = h('p', { class: 'st-err', role: 'alert', hidden: true });
  const showErr = (m) => { err.textContent = m; err.hidden = !m; };

  function draw() {
    if (state === 'idle') {
      node.replaceChildren(
        !hasMR || !hasCam ? h('p', { class: 'st-err' }, 'هذا المتصفح لا يدعم التسجيل المباشر. استخدم «رفع ملف» بعد تسجيل الفيديو بتطبيق الكاميرا.') : null,
        h('div', { class: 'st-lbl' }, 'ماذا تريد أن تسجّل؟'),
        h('div', { class: 'st-src' },
          srcBtn('camera', '📷', 'الكاميرا + الميكروفون', true),
          srcBtn('screen', '🖥️', 'شاشة الجهاز + الميكروفون', hasScreen),
          srcBtn('audio', '🎙️', 'صوت فقط', true)),
        !hasScreen ? h('p', { class: 'st-note' }, 'تسجيل الشاشة غير متاح في هذا الجهاز (مثل الآيفون والآيباد). استخدم تسجيل الشاشة المدمج في الجهاز ثم «رفع ملف».') : null,
        err,
        h('button', { type: 'button', class: 'st-btn big go', id: 'st-start', disabled: !hasMR || !hasCam ? '' : null, onClick: start }, '● ابدأ التسجيل'));
    } else if (state === 'recording' || state === 'paused') {
      const live = kind === 'video'
        ? h('video', { class: 'st-live', autoplay: true, muted: true, playsinline: true, 'aria-label': 'معاينة مباشرة' })
        : h('div', { class: 'st-live audio' }, h('span', { class: 'st-mic' }, '🎙️'), h('span', null, state === 'paused' ? 'متوقف مؤقتًا' : 'جارٍ تسجيل الصوت'));
      if (kind === 'video') { live.muted = true; live.srcObject = stream; live.play && live.play().catch(() => {}); }
      node.replaceChildren(
        live,
        h('div', { class: `st-timer${state === 'recording' ? ' rec' : ''}`, 'data-recording': '1', id: 'st-timer', 'aria-live': 'off' }, h('i', { class: 'st-dot' }), h('span', { id: 'st-time' }, fmtTime(elapsed))),
        err,
        h('div', { class: 'st-row ctl' },
          h('button', { type: 'button', class: 'st-btn big', id: 'st-pause', onClick: togglePause }, state === 'paused' ? '▶ استئناف' : '⏸ إيقاف مؤقت'),
          h('button', { type: 'button', class: 'st-btn big stop', id: 'st-stop', onClick: stop }, '■ إنهاء التسجيل')));
    } else if (state === 'review') {
      const title = h('input', { type: 'text', class: 'st-input', id: 'st-rec-title', placeholder: 'عنوان الشرح (مثال: شرح فكرة النسبة)', 'aria-label': 'عنوان الشرح', maxlength: '80' });
      const player = h(kind === 'video' ? 'video' : 'audio', { class: 'st-live', controls: true, playsinline: true, src: url });
      const saveBtn = h('button', { type: 'button', class: 'st-btn big go', id: 'st-save', onClick: async () => {
        saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ…';
        try { await commit({ type: kind, title: title.value.trim() || (kind === 'video' ? 'شرح بالفيديو' : 'شرح صوتي'), duration: Math.round(elapsed) }, blob); } catch (e) { saveBtn.disabled = false; saveBtn.textContent = 'حفظ'; }
      } }, 'حفظ');
      node.replaceChildren(
        h('div', { class: 'st-lbl' }, `معاينة التسجيل (${fmtTime(elapsed)} — ${fmtSize(blob.size)})`),
        player, title,
        h('div', { class: 'st-row ctl' }, saveBtn,
          h('button', { type: 'button', class: 'st-btn big', id: 'st-retake', onClick: () => { cleanup(); blob = null; elapsed = 0; state = 'idle'; showErr(''); draw(); } }, '↺ إعادة التسجيل')));
    }
  }

  function srcBtn(k, ic, label, ok) {
    return h('button', { type: 'button', class: `st-src-b${source === k ? ' on' : ''}`, 'data-src': k, disabled: ok ? null : '', 'aria-pressed': source === k ? 'true' : 'false',
      onClick: () => { source = k; draw(); } }, h('span', { 'aria-hidden': 'true' }, ic), h('span', null, label));
  }

  async function start() {
    showErr('');
    kind = source === 'audio' ? 'audio' : 'video';
    try {
      if (source === 'camera') {
        try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }); }
        catch (e) { if (e && (e.name === 'NotFoundError' || e.name === 'OverconstrainedError')) { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); } else throw e; }
      } else if (source === 'audio') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        const disp = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        extra.push(disp);
        let mic = null;
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); extra.push(mic); } catch (e) { /* بلا ميكروفون */ }
        const tracks = [...disp.getVideoTracks(), ...(mic ? mic.getAudioTracks() : disp.getAudioTracks())];
        stream = new MediaStream(tracks);
        disp.getVideoTracks()[0]?.addEventListener('ended', () => { if (state === 'recording' || state === 'paused') stop(); });
        if (!mic) toast('لم يُسمح بالميكروفون؛ سيُسجَّل بدون صوتك', 4000);
      }
    } catch (e) {
      cleanup();
      showErr(source === 'screen' ? (e && e.name === 'NotAllowedError' ? 'لم تختر شاشة للتسجيل أو أُلغي الإذن. اضغط «ابدأ التسجيل» ثم اختر الشاشة أو النافذة.' : mediaError(e, 'الشاشة')) : mediaError(e, source === 'audio' ? 'الميكروفون' : 'الكاميرا أو الميكروفون'));
      draw(); return;
    }
    mimeUsed = pickMime(kind);
    try { rec = mimeUsed ? new MediaRecorder(stream, { mimeType: mimeUsed }) : new MediaRecorder(stream); }
    catch (e) { cleanup(); showErr('هذا الجهاز لا يدعم صيغة التسجيل المطلوبة. جرّب «رفع ملف».'); draw(); return; }
    chunks = []; elapsed = 0;
    rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.onerror = () => { showErr('حدث خطأ أثناء التسجيل.'); };
    rec.onstop = () => {
      clearInterval(timer); timer = null;
      const type = (rec && rec.mimeType) || mimeUsed || (kind === 'video' ? 'video/webm' : 'audio/webm');
      blob = new Blob(chunks, { type: type.split(';')[0] });
      stopStream(stream); extra.forEach(stopStream); stream = null; extra = [];
      if (!blob.size) { showErr('لم يُسجَّل أي شيء. أعد المحاولة.'); state = 'idle'; draw(); return; }
      url = URL.createObjectURL(blob); state = 'review'; draw();
    };
    rec.start(1000);
    tickStart = Date.now(); state = 'recording';
    timer = setInterval(() => {
      if (state === 'recording') { const now = Date.now(); elapsed += (now - tickStart) / 1000; tickStart = now; }
      const t = node.querySelector('#st-time'); if (t) t.textContent = fmtTime(elapsed);
    }, 250);
    draw();
  }

  function togglePause() {
    if (!rec) return;
    if (state === 'recording') { elapsed += (Date.now() - tickStart) / 1000; rec.pause(); state = 'paused'; }
    else { tickStart = Date.now(); rec.resume(); state = 'recording'; }
    draw();
  }
  function stop() {
    if (!rec || rec.state === 'inactive') return;
    if (state === 'recording') elapsed += (Date.now() - tickStart) / 1000;
    state = 'stopping'; rec.stop();
  }

  draw();
  return { node, dispose: () => { cleanup(); unreg(); } };
}

/* ======================================================================
 *  رفع ملف
 * ==================================================================== */
function uploadPanel({ commit, register }) {
  let file = null; let url = '';
  const unreg = register(() => { if (url) URL.revokeObjectURL(url); });
  const node = h('div', { class: 'st-up' });
  const input = h('input', { type: 'file', id: 'st-file', class: 'st-file', accept: 'video/*,audio/*,image/*', onChange: (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    if (!/^(video|audio|image)\//.test(f.type)) { toast('نوع الملف غير مدعوم. اختر فيديو أو صوتًا أو صورة.', 4000); input.value = ''; return; }
    if (f.size > BIG_FILE && !confirm(`حجم الملف كبير (${fmtSize(f.size)}) وقد يبطئ الجهاز أو لا يُحفظ. الأفضل ضغطه أو قصّه. هل تريد المتابعة؟`)) { input.value = ''; return; }
    file = f; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(f); draw();
  } });

  function draw() {
    if (!file) {
      node.replaceChildren(
        h('label', { class: 'st-drop', for: 'st-file' }, h('span', { class: 'st-drop-ic', 'aria-hidden': 'true' }, '📁'), h('span', null, 'اضغط لاختيار ملف'), h('small', null, 'فيديو • صوت • صورة (يُفضَّل أقل من ١٥٠ ميغابايت)')),
        input);
      return;
    }
    const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
    const prev = h(type === 'image' ? 'img' : type, type === 'image' ? { class: 'st-live', src: url, alt: 'معاينة' } : { class: 'st-live', src: url, controls: true, playsinline: true, preload: 'metadata' });
    const title = h('input', { type: 'text', class: 'st-input', id: 'st-up-title', 'aria-label': 'العنوان', placeholder: 'عنوان الشرح', maxlength: '80', value: file.name.replace(/\.[^.]+$/, '') });
    const prog = h('progress', { class: 'st-prog', hidden: true });
    const saveBtn = h('button', { type: 'button', class: 'st-btn big go', id: 'st-up-save', onClick: async () => {
      saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ…'; prog.hidden = false;
      let dur = 0; if (type !== 'image') dur = Math.round(prev.duration && isFinite(prev.duration) ? prev.duration : 0);
      try { await commit({ type, title: title.value.trim() || 'شرح', duration: dur || undefined }, file); } catch (e) { saveBtn.disabled = false; saveBtn.textContent = 'حفظ'; prog.hidden = true; }
    } }, 'حفظ');
    node.replaceChildren(
      h('div', { class: 'st-lbl' }, `${file.name} — ${fmtSize(file.size)}`),
      file.size > BIG_FILE ? h('p', { class: 'st-err' }, 'تنبيه: الملف كبير جدًا.') : null,
      prev, title, prog,
      h('div', { class: 'st-row ctl' }, saveBtn,
        h('button', { type: 'button', class: 'st-btn big', onClick: () => { file = null; input.value = ''; draw(); } }, 'اختيار ملف آخر')));
  }
  draw();
  return { node, dispose: () => { if (url) URL.revokeObjectURL(url); unreg(); } };
}

/* ======================================================================
 *  شرح كتابي
 * ==================================================================== */
function textPanel({ commit }) {
  const ta = h('textarea', { class: 'st-input st-ta', id: 'st-ta', rows: '7', 'aria-label': 'نص الشرح', placeholder: 'اكتب الشرح هنا…\nمثال: النسبة **٣ : ٥** تعني $ {3|5} $\nالمربع: $ x^{2} $' });
  const title = h('input', { type: 'text', class: 'st-input', id: 'st-txt-title', 'aria-label': 'عنوان', placeholder: 'عنوان (اختياري)', maxlength: '80' });
  const prev = h('div', { class: 'st-text st-preview', id: 'st-txt-prev' }, h('span', { class: 'st-note' }, 'ستظهر المعاينة هنا'));
  const upd = () => { prev.innerHTML = ta.value.trim() ? formatText(ta.value) : '<span class="st-note">ستظهر المعاينة هنا</span>'; };
  ta.addEventListener('input', upd);
  function wrap(a, b = a, ph = 'نص') {
    const s = ta.selectionStart; const e = ta.selectionEnd; const sel = ta.value.slice(s, e) || ph;
    ta.setRangeText(a + sel + b, s, e, 'select'); ta.focus(); upd();
  }
  const saveBtn = h('button', { type: 'button', class: 'st-btn big go', id: 'st-txt-save', onClick: async () => {
    if (!ta.value.trim()) return toast('اكتب النص أولًا');
    saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ…';
    try { await commit({ type: 'text', title: title.value.trim() || 'شرح مكتوب', text: ta.value.trim() }); } catch (e) { saveBtn.disabled = false; saveBtn.textContent = 'حفظ'; }
  } }, 'حفظ');
  const node = h('div', { class: 'st-txt' },
    title,
    h('div', { class: 'st-fmt' },
      h('button', { type: 'button', class: 'st-btn sm', onClick: () => wrap('**') }, 'B عريض'),
      h('button', { type: 'button', class: 'st-btn sm', onClick: () => wrap('$ ', ' $', 'x^{2}') }, 'ƒ معادلة'),
      h('button', { type: 'button', class: 'st-btn sm', onClick: () => wrap('{', '}', '1|2') }, '½ كسر'),
      h('button', { type: 'button', class: 'st-btn sm', onClick: () => wrap('^{', '}', '2') }, 'x² أُسّ')),
    ta,
    h('p', { class: 'st-note' }, 'سطر جديد = ينتقل لسطر جديد. **كلمة** = عريض. المعادلات بين علامتي $ مثل: $ {3|5} + x^{2} $ (الكسر داخل { | }).'),
    h('div', { class: 'st-lbl' }, 'المعاينة'), prev,
    h('div', { class: 'st-row ctl' }, saveBtn));
  return { node, dispose() {} };
}

/* ======================================================================
 *  السبّورة
 * ==================================================================== */
function boardPanel({ commit }) {
  const W = 960; const H = 640;
  const COLORS = ['#111111', '#1F63D6', '#D8281C', '#1FAA6C', '#F2B51C'];
  let tool = 'pen'; let color = COLORS[0]; let size = 4;
  let drawing = false; let last = null; let dirty = false;
  const undo = [];
  const cv = h('canvas', { class: 'st-canvas', width: String(W), height: String(H), id: 'st-canvas', 'aria-label': 'سبّورة الكتابة بخط اليد' });
  const g = cv.getContext('2d', { willReadFrequently: true });
  const clearWhite = () => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); };
  clearWhite();
  g.lineCap = 'round'; g.lineJoin = 'round';
  const snap = () => { try { undo.push(g.getImageData(0, 0, W, H)); if (undo.length > 15) undo.shift(); } catch (e) { /* */ } };
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height), p: e.pointerType === 'pen' && e.pressure ? e.pressure : 0.5 }; };
  const stroke = (a, b) => {
    g.strokeStyle = tool === 'eraser' ? '#fff' : color;
    g.lineWidth = (tool === 'eraser' ? size * 5 : size) * (b.p ? 0.6 + b.p * 0.8 : 1);
    g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x + 0.01, b.y + 0.01); g.stroke();
  };
  cv.addEventListener('pointerdown', (e) => {
    e.preventDefault(); snap(); drawing = true; dirty = true;
    try { cv.setPointerCapture(e.pointerId); } catch (x) { /* */ }
    last = pos(e); stroke(last, last);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return; e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of (evs.length ? evs : [e])) { const p = pos(ev); stroke(last, p); last = p; }
  });
  const end = () => { drawing = false; last = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('lostpointercapture', end);

  const colorBtns = COLORS.map((c) => h('button', { type: 'button', class: 'st-color', style: `background:${c}`, 'aria-label': 'لون', 'data-c': c, onClick: () => { color = c; tool = 'pen'; sync(); } }));
  const penBtn = h('button', { type: 'button', class: 'st-btn sm', onClick: () => { tool = 'pen'; sync(); } }, '✏️ قلم');
  const eraBtn = h('button', { type: 'button', class: 'st-btn sm', onClick: () => { tool = 'eraser'; sync(); } }, '🧽 ممحاة');
  const sizeIn = h('input', { type: 'range', min: '2', max: '14', value: String(size), 'aria-label': 'سماكة الخط', class: 'st-range', onInput: (e) => { size = +e.target.value; } });
  function sync() {
    penBtn.classList.toggle('on', tool === 'pen'); eraBtn.classList.toggle('on', tool === 'eraser');
    colorBtns.forEach((b) => b.classList.toggle('on', tool === 'pen' && b.dataset.c === color));
  }
  sync();
  const title = h('input', { type: 'text', class: 'st-input', id: 'st-board-title', 'aria-label': 'عنوان', placeholder: 'عنوان السبّورة', maxlength: '80' });
  const saveBtn = h('button', { type: 'button', class: 'st-btn big go', id: 'st-board-save', onClick: () => {
    if (!dirty) return toast('اكتب شيئًا على السبّورة أولًا');
    saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ…';
    cv.toBlob(async (b) => {
      if (!b) { saveBtn.disabled = false; saveBtn.textContent = 'حفظ كصورة'; return toast('تعذّر إنشاء الصورة'); }
      try { await commit({ type: 'image', title: title.value.trim() || 'شرح على السبّورة' }, b); } catch (e) { saveBtn.disabled = false; saveBtn.textContent = 'حفظ كصورة'; }
    }, 'image/png');
  } }, 'حفظ كصورة');

  const node = h('div', { class: 'st-board' },
    h('div', { class: 'st-tools' }, penBtn, eraBtn, ...colorBtns, sizeIn),
    h('div', { class: 'st-canvas-wrap' }, cv),
    h('div', { class: 'st-row' },
      h('button', { type: 'button', class: 'st-btn', id: 'st-undo', onClick: () => { const s = undo.pop(); if (s) g.putImageData(s, 0, 0); } }, '↶ تراجع'),
      h('button', { type: 'button', class: 'st-btn', id: 'st-clear', onClick: () => { snap(); clearWhite(); dirty = false; } }, '🗑 مسح الكل')),
    title,
    h('div', { class: 'st-row ctl' }, saveBtn));
  return { node, dispose() { undo.length = 0; } };
}
