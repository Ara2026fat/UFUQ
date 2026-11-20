/**
 * حصة مباشرة — «اختيار أسئلة» من أي ملف PDF.
 * - اكتشاف تلقائي لمستطيل كل سؤال (live-qseg.js) + ربط ببنك الأستاذ (موضوع/نوع/صعوبة) عند التعرف على ملفه.
 * - أداة يدوية: ارسم مستطيلًا على السؤال وصنّفه → يُحفظ في «بنكي» لهذا الملف (بصمة الملف) لإعادة استخدامه.
 * ARAFAT ALRAJHI © 2026
 */
import { h, toast } from '../../core/dom.js';
import { GROUPS, TOPICS } from '../../data/taxonomy.js';
import { idbGet, idbSet } from './live-store.js';
import { segmentAll, calibrateBank, stemKey, renderRegion, normSearch } from './live-qseg.js';

const TYPES = { mcq: 'اختيار من متعدد', compare: 'مقارنة' };
const DIFFS = { 1: 'سهل', 2: 'متوسط', 3: 'صعب' };
const SEG_V = 4;

export async function openPicker({ pdf, fp, name, onStart, onClose }) {
  const ov = h('div', { class: 'lq', role: 'dialog', 'aria-label': 'اختيار أسئلة' });
  document.body.append(ov); document.body.classList.add('lq-open');
  let closed = false;
  const close = () => { if (closed) return; closed = true; cancelled = true; ov.remove(); document.body.classList.remove('lq-open'); onClose && onClose(); };
  let cancelled = false;

  /* ---------- حالة ---------- */
  const St = { items: [], sel: [], tab: 'all', f: { topic: '', type: '', diff: '', q: '', from: '', to: '' }, limit: 40, cal: null, manual: [], pageCount: pdf.numPages };
  const pageCache = new Map();
  const getPage = async (p) => { if (!pageCache.has(p)) { if (pageCache.size > 6) { const k = pageCache.keys().next().value; try { (await pageCache.get(k)).cleanup(); } catch (e) { /* */ } pageCache.delete(k); } pageCache.set(p, pdf.getPage(p)); } return pageCache.get(p); };

  const head = h('div', { class: 'lq-head' }, h('b', null, '🎯 اختيار أسئلة'), h('span', { class: 'lq-sub' }, name.replace(/\.pdf$/i, '')), h('button', { class: 'lv-btn sm', onClick: close, 'aria-label': 'إغلاق' }, '✕'));
  const status = h('p', { class: 'lv-note lq-status' }, 'جارٍ تحليل الملف…');
  const filt = h('div', { class: 'lq-filters' });
  const tabs = h('div', { class: 'lq-tabs' });
  const body = h('div', { class: 'lq-body' });
  const foot = h('div', { class: 'lq-foot' });
  ov.append(head, status, filt, tabs, body, foot);

  /* ---------- التحليل ---------- */
  let USTAZ = [];
  try { USTAZ = (await import('../../data/ustaz-questions.js')).USTAZ; } catch (e) { USTAZ = []; }
  const sk = `seg:${SEG_V}:${fp}`;
  let seg = null;
  try { seg = await idbGet(sk); } catch (e) { seg = null; }
  async function analyse() {
    if (seg && seg.pages) { St.cal = seg.cal; return; }
    status.textContent = 'جارٍ مطابقة ترقيم الصفحات مع بنك الأستاذ…';
    let cal = { ok: false };
    try { cal = await calibrateBank(pdf, USTAZ, stemKey); } catch (e) { cal = { ok: false }; }
    const exp = new Map();
    if (cal.ok) for (const q of USTAZ) { const p = q.pg + cal.offset; if (!exp.has(p)) exp.set(p, new Set()); exp.get(p).add(q.n); }
    const pages = await segmentAll(pdf, cal.ok ? (p) => exp.get(p) || null : null, (p, n) => { status.textContent = `جارٍ تحديد الأسئلة في الصفحات… ${p} / ${n}`; }, () => cancelled);
    if (cancelled) return;
    seg = { cal, pages: pages.map((r) => ({ p: r.p, mode: r.mode, hasText: r.hasText, qs: r.qs.map((q) => ({ n: q.n, box: q.box.map((v) => +v.toFixed(4)), txt: q.txt.slice(0, 500) })), text: r.mode === 'page' ? (r.text || '').slice(0, 600) : '' })) };
    St.cal = cal; try { await idbSet(sk, seg); } catch (e) { /* ممتلئ */ }
  }
  const mkey = `bank:${fp}`;
  async function loadManual() { try { St.manual = (await idbGet(mkey)) || []; } catch (e) { St.manual = []; } }
  const saveManual = async () => { try { await idbSet(mkey, St.manual); } catch (e) { toast('تعذّر حفظ البنك على هذا الجهاز'); } };

  function build() {
    const cal = St.cal && St.cal.ok ? St.cal : null; const off = cal ? cal.offset : 0;
    const bankMap = new Map(); if (cal) for (const q of USTAZ) bankMap.set(`${q.pg + off}:${q.n}`, q);
    const items = []; const used = new Set();
    const manualKeys = new Set(St.manual.filter((m) => m.n != null).map((m) => `${m.p}:${m.n}`));
    for (const r of seg.pages) {
      if (r.mode === 'q') {
        for (const q of r.qs) {
          const key = `${r.p}:${q.n}`; if (manualKeys.has(key)) { used.add(key); continue; }
          const b = bankMap.get(key); if (b) used.add(key);
          const txt = q.txt || '';
          items.push({ id: `a${r.p}:${q.n}`, p: r.p, n: q.n, box: q.box, txt: normSearch((b && b.stem ? b.stem.replace(/\$/g, '') + ' ' : '') + txt), topic: b ? b.topic : '', type: b ? b.type : (/قارن/.test(txt) ? 'compare' : ''), diff: b ? b.difficulty : 0, bank: b ? b.id : '' });
        }
      } else items.push({ id: `pg${r.p}`, p: r.p, n: null, box: [0, 0, 1, 1], txt: r.text || '', topic: '', type: '', diff: 0, page: true });
    }
    if (cal) for (const [key, b] of bankMap) if (!used.has(key)) { const [p, n] = key.split(':').map(Number); if (p >= 1 && p <= pdf.numPages) items.push({ id: `b${p}:${n}`, p, n, box: null, txt: normSearch(b.stem || ''), topic: b.topic, type: b.type, diff: b.difficulty, bank: b.id }); }
    for (const m of St.manual) items.push({ id: m.id, p: m.p, n: m.n, box: m.box, txt: normSearch(m.label || ''), topic: m.topic || '', type: m.type || '', diff: m.diff || 0, manual: true, label: m.label });
    items.sort((a, b) => a.p - b.p || (a.n ?? 0) - (b.n ?? 0) || (a.box ? a.box[1] : 9) - (b.box ? b.box[1] : 9));
    St.items = items; St.byId = new Map(items.map((i) => [i.id, i]));
    St.sel = St.sel.filter((id) => St.byId.has(id));
  }

  const labelOf = (it) => it.page ? `صفحة ${it.p}` : `${it.manual && it.label ? it.label : (it.n != null ? `سؤال ${it.n}` : 'سؤال')} · ص${it.p}`;
  const tagsOf = (it) => [it.topic && (TOPICS[it.topic] || it.topic), it.type && (TYPES[it.type] || it.type), it.diff && DIFFS[it.diff], it.manual && 'يدوي'].filter(Boolean);

  /* ---------- فلاتر ---------- */
  const topicSel = h('select', { class: 'lq-in', 'aria-label': 'الدرس أو الموضوع', onChange: () => { St.f.topic = topicSel.value; St.limit = 40; renderList(); } });
  const typeSel = h('select', { class: 'lq-in', 'aria-label': 'نوع السؤال', onChange: () => { St.f.type = typeSel.value; St.limit = 40; renderList(); } });
  const diffSel = h('select', { class: 'lq-in', 'aria-label': 'الصعوبة', onChange: () => { St.f.diff = diffSel.value; St.limit = 40; renderList(); } });
  const qIn = h('input', { class: 'lq-in grow', type: 'search', placeholder: 'بحث في نص الأسئلة…', 'aria-label': 'بحث', onInput: () => { St.f.q = qIn.value; St.limit = 40; renderList(); } });
  const fromIn = h('input', { class: 'lq-in num', type: 'number', min: 1, placeholder: 'من ص', inputmode: 'numeric', onChange: () => { if (St.f.from === fromIn.value) return; St.f.from = fromIn.value; St.limit = 40; renderList(); } });
  const toIn = h('input', { class: 'lq-in num', type: 'number', min: 1, placeholder: 'إلى ص', inputmode: 'numeric', onChange: () => { if (St.f.to === toIn.value) return; St.f.to = toIn.value; St.limit = 40; renderList(); } });
  function fillFilters() {
    const has = (k) => new Set(St.items.map((i) => i[k]).filter(Boolean));
    const tp = has('topic'), ty = has('type'), df = has('diff');
    const opt = (v, t) => h('option', { value: v }, t);
    topicSel.replaceChildren(opt('', 'كل الدروس والمواضيع'));
    for (const g of GROUPS) { const ts = g.topics.filter((t) => tp.has(t)); if (ts.length) topicSel.append(h('optgroup', { label: g.title }, ts.map((t) => opt(t, TOPICS[t] || t)))); }
    const other = [...tp].filter((t) => !GROUPS.some((g) => g.topics.includes(t))); if (other.length) topicSel.append(h('optgroup', { label: 'أخرى' }, other.map((t) => opt(t, TOPICS[t] || t))));
    topicSel.append(opt('none', 'غير مصنّف'));
    typeSel.replaceChildren(opt('', 'كل الأنواع'), ...[...ty].map((t) => opt(t, TYPES[t] || t)), opt('none', 'غير محدد'));
    diffSel.replaceChildren(opt('', 'كل المستويات'), ...[1, 2, 3].filter((d) => df.has(d)).map((d) => opt(d, DIFFS[d])), opt('none', 'غير محدد'));
    topicSel.value = St.f.topic; typeSel.value = St.f.type; diffSel.value = St.f.diff;
  }
  filt.append(h('div', { class: 'lq-row' }, topicSel, typeSel, diffSel), h('div', { class: 'lq-row' }, qIn, fromIn, toIn, h('button', { class: 'lv-btn sm', onClick: () => { St.f = { topic: '', type: '', diff: '', q: '', from: '', to: '' }; qIn.value = fromIn.value = toIn.value = ''; fillFilters(); St.limit = 40; renderList(); } }, 'مسح')));

  function filtered() {
    const f = St.f; const q = normSearch(f.q); const a = +f.from || 0, b = +f.to || 1e9;
    const pass = (v, sel) => !sel || (sel === 'none' ? !v : String(v) === String(sel));
    return St.items.filter((i) => i.p >= a && i.p <= b && pass(i.topic, f.topic) && pass(i.type, f.type) && pass(i.diff, f.diff) && (!q || i.txt.includes(q) || labelOf(i).includes(q)));
  }

  /* ---------- صور مصغّرة (بالتتابع) ---------- */
  const thumbQ = []; let thumbBusy = false;
  async function pumpThumbs() {
    if (thumbBusy) return; thumbBusy = true;
    while (thumbQ.length && !closed) {
      const { it, cv } = thumbQ.shift(); if (!cv.isConnected) continue;
      try { const pg = await getPage(it.p); await renderRegion(pg, it.box, Math.round(Math.max(520, 360 * Math.min(devicePixelRatio || 1, 2))), cv); cv.classList.add('ok'); } catch (e) { /* */ }
    }
    thumbBusy = false;
  }
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); thumbQ.push(e.target._job); } pumpThumbs(); }, { root: body, rootMargin: '300px' });
  const thumb = (it) => { const cv = h('canvas', { class: 'lq-th' }); cv._job = { it, cv }; io.observe(cv); return cv; };

  /* ---------- القائمة ---------- */
  const toggle = (id) => { const k = St.sel.indexOf(id); if (k >= 0) St.sel.splice(k, 1); else St.sel.push(id); renderFoot(); };
  function card(it) {
    const on = St.sel.includes(it.id);
    const c = h('div', { class: 'lq-card' + (on ? ' on' : '') + (it.box ? '' : ' nobox'), role: 'button', tabindex: 0 });
    const check = h('span', { class: 'lq-chk' }, on ? '✓' : '');
    if (it.box) c.append(thumb(it)); else c.append(h('div', { class: 'lq-ph' }, 'لم يُحدَّد مكان السؤال تلقائيًا', h('button', { class: 'lv-btn sm', onClick: (e) => { e.stopPropagation(); openManual(it.p, it.n, it); } }, '✂️ حدّده يدويًا')));
    c.append(check, h('div', { class: 'lq-meta' }, h('b', null, labelOf(it)), h('div', { class: 'lq-tags' }, tagsOf(it).map((t) => h('span', { class: 'lq-tag' }, t)))));
    if (it.manual) c.append(h('button', { class: 'lv-btn sm danger lq-del', 'aria-label': 'حذف من بنكي', onClick: async (e) => { e.stopPropagation(); if (!confirm('حذف هذا السؤال من بنكي؟')) return; St.manual = St.manual.filter((m) => m.id !== it.id); await saveManual(); build(); fillFilters(); renderList(); renderFoot(); } }, '🗑️'));
    const act = () => { if (!it.box) { toast('حدّد مكان هذا السؤال يدويًا أولًا'); return; } toggle(it.id); c.classList.toggle('on', St.sel.includes(it.id)); check.textContent = St.sel.includes(it.id) ? '✓' : ''; };
    c.addEventListener('click', act); c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    return c;
  }
  function renderList() {
    if (St.tab !== 'all') return;
    const list = filtered(); const show = list.slice(0, St.limit);
    body.replaceChildren(
      h('div', { class: 'lq-bar' }, h('span', null, `${list.length} سؤالًا`),
        h('button', { class: 'lv-btn sm', onClick: () => { for (const i of list) if (i.box && !St.sel.includes(i.id)) St.sel.push(i.id); renderList(); renderFoot(); } }, 'تحديد المعروض'),
        h('button', { class: 'lv-btn sm', onClick: () => openManual(+St.f.from || 1) }, '✂️ تحديد يدوي')),
      h('div', { class: 'lq-grid' }, show.map(card)),
      ...(list.length > show.length ? [h('button', { class: 'lv-btn', onClick: () => { St.limit += 60; renderList(); } }, `عرض المزيد (${list.length - show.length})`)] : []),
      ...(!list.length ? [h('p', { class: 'lv-note' }, 'لا توجد أسئلة بهذه الفلاتر. جرّب «مسح» أو استعمل «تحديد يدوي».')] : []));
  }
  function renderSel() {
    const rows = St.sel.map((id, k) => { const it = St.byId.get(id); return h('div', { class: 'lq-row-sel' }, h('span', { class: 'lq-no' }, k + 1), thumb(it), h('b', null, labelOf(it)),
      h('span', { class: 'lq-acts' },
        h('button', { class: 'lv-btn sm', disabled: k === 0, 'aria-label': 'للأعلى', onClick: () => { [St.sel[k - 1], St.sel[k]] = [St.sel[k], St.sel[k - 1]]; renderSel(); } }, '↑'),
        h('button', { class: 'lv-btn sm', disabled: k === St.sel.length - 1, 'aria-label': 'للأسفل', onClick: () => { [St.sel[k + 1], St.sel[k]] = [St.sel[k], St.sel[k + 1]]; renderSel(); } }, '↓'),
        h('button', { class: 'lv-btn sm danger', 'aria-label': 'إزالة', onClick: () => { St.sel.splice(k, 1); renderSel(); renderFoot(); } }, '✕'))); });
    body.replaceChildren(rows.length ? h('div', { class: 'lq-selist' }, rows) : h('p', { class: 'lv-note' }, 'لم تختر أي سؤال بعد. ارجع إلى «الأسئلة» وانقر على السؤال لاختياره.'));
  }
  function renderTabs() {
    tabs.replaceChildren(
      h('button', { class: 'lv-btn' + (St.tab === 'all' ? ' on' : ''), onClick: () => { St.tab = 'all'; filt.hidden = false; renderTabs(); renderList(); } }, 'الأسئلة'),
      h('button', { class: 'lv-btn' + (St.tab === 'sel' ? ' on' : ''), onClick: () => { St.tab = 'sel'; filt.hidden = true; renderTabs(); renderSel(); } }, `المختارة (${St.sel.length})`));
  }
  function renderFoot() {
    renderTabs();
    foot.replaceChildren(h('span', { class: 'lq-cnt' }, `المختار: ${St.sel.length}`),
      h('button', { class: 'lv-btn', disabled: !St.sel.length, onClick: () => { St.sel = []; renderFoot(); if (St.tab === 'all') renderList(); else renderSel(); } }, 'إلغاء التحديد'),
      h('button', { class: 'lv-btn go', disabled: !St.sel.length, onClick: start }, '▶ ابدأ الحصة'));
  }
  function start() {
    const entries = St.sel.map((id, k) => { const it = St.byId.get(id); return { t: 'q', id: k + 1, i: it.p, box: it.box, label: labelOf(it), src: it.id }; });
    onStart(entries); close();
  }

  /* ---------- التحديد اليدوي ---------- */
  async function openManual(startPage, startN, fromItem) {
    const mv = h('div', { class: 'lq-man' });
    let pageNo = Math.min(Math.max(1, startPage || 1), pdf.numPages), rect = null, scale = 1;
    const cv = h('canvas', { class: 'lq-mcv' }); const hl = h('div', { class: 'lq-rect', hidden: true });
    const stage = h('div', { class: 'lq-mstage' }, cv, hl);
    const pgIn = h('input', { class: 'lq-in num', type: 'number', min: 1, max: pdf.numPages, value: pageNo, inputmode: 'numeric', onChange: () => { pageNo = Math.min(Math.max(1, +pgIn.value || 1), pdf.numPages); draw(); } });
    const nIn = h('input', { class: 'lq-in num', type: 'number', min: 1, placeholder: 'رقم', inputmode: 'numeric', value: startN || '' });
    const lblIn = h('input', { class: 'lq-in grow', type: 'text', placeholder: 'عنوان (اختياري)' });
    const tSel = h('select', { class: 'lq-in' }, h('option', { value: '' }, 'الموضوع…'), ...Object.entries(TOPICS).map(([k, v]) => h('option', { value: k }, v)));
    const ySel = h('select', { class: 'lq-in' }, h('option', { value: '' }, 'النوع…'), ...Object.entries(TYPES).map(([k, v]) => h('option', { value: k }, v)));
    const dSel = h('select', { class: 'lq-in' }, h('option', { value: '' }, 'الصعوبة…'), ...Object.entries(DIFFS).map(([k, v]) => h('option', { value: k }, v)));
    if (fromItem) { tSel.value = fromItem.topic || ''; ySel.value = fromItem.type || ''; dSel.value = fromItem.diff || ''; }
    const saveB = h('button', { class: 'lv-btn go', disabled: true, onClick: save }, '💾 حفظ في بنكي');
    const hint = h('p', { class: 'lv-note' }, 'اسحب بإصبعك أو بالقلم لرسم مستطيل حول السؤال، ثم صنّفه واحفظه.');
    const autoLayer = h('div', { class: 'lq-auto' }); stage.append(autoLayer);
    let task = null, dtoken = 0;
    async function draw() {
      const my = ++dtoken; if (task) { try { task.cancel(); } catch (e) { /* */ } try { await task.promise; } catch (e) { /* أُلغي */ } task = null; }
      pgIn.value = pageNo; rect = null; hl.hidden = true; saveB.disabled = true;
      const pg = await getPage(pageNo); const v1 = pg.getViewport({ scale: 1 });
      const avail = Math.min(mv.clientWidth - 8 || 340, 900); const dpr = Math.min(devicePixelRatio || 1, 2);
      scale = avail / v1.width; cv.style.width = `${avail}px`; cv.style.height = `${Math.round(v1.height * scale)}px`;
      cv.width = Math.round(avail * dpr); cv.height = Math.round(v1.height * scale * dpr);
      stage.style.width = cv.style.width; stage.style.height = cv.style.height;
      if (my !== dtoken) return;
      task = pg.render({ canvasContext: cv.getContext('2d'), viewport: pg.getViewport({ scale: cv.width / v1.width }) });
      try { await task.promise; } catch (e) { return; }
      if (my !== dtoken) return;
      autoLayer.replaceChildren(...St.items.filter((i) => i.p === pageNo && i.box && !i.page).map((i) => h('div', { class: 'lq-ab', style: `left:${i.box[0] * 100}%;top:${i.box[1] * 100}%;width:${(i.box[2] - i.box[0]) * 100}%;height:${(i.box[3] - i.box[1]) * 100}%` }, h('i', null, i.n ?? ''))));
      renderMine();
    }
    let drag = null;
    const rel = (e) => { const r = cv.getBoundingClientRect(); return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))]; };
    cv.style.touchAction = 'none'; stage.style.touchAction = 'none';
    stage.addEventListener('pointerdown', (e) => { stage.setPointerCapture(e.pointerId); drag = rel(e); rect = null; hl.hidden = false; upd(drag); });
    stage.addEventListener('pointermove', (e) => { if (drag) upd(rel(e)); });
    const up = (e) => { if (!drag) return; const p = rel(e); drag = null; const r = [Math.min(...[hl._a[0], p[0]]), Math.min(hl._a[1], p[1]), Math.max(hl._a[0], p[0]), Math.max(hl._a[1], p[1])]; if (r[2] - r[0] > 0.04 && r[3] - r[1] > 0.02) { rect = r; saveB.disabled = false; hint.textContent = 'تمام. أدخل رقم السؤال والتصنيف ثم احفظ — أو أعد الرسم.'; } else { hl.hidden = true; } };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    function upd(p) { const a = drag; hl._a = a; const x0 = Math.min(a[0], p[0]), y0 = Math.min(a[1], p[1]); Object.assign(hl.style, { left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: `${Math.abs(p[0] - a[0]) * 100}%`, height: `${Math.abs(p[1] - a[1]) * 100}%` }); }
    async function save() {
      if (!rect) return;
      const n = +nIn.value || null;
      St.manual = St.manual.filter((m) => !(n != null && m.p === pageNo && m.n === n));
      St.manual.push({ id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, p: pageNo, n, box: rect.map((v) => +v.toFixed(4)), label: lblIn.value.trim() || (n ? `سؤال ${n}` : 'سؤال يدوي'), topic: tSel.value, type: ySel.value, diff: +dSel.value || 0 });
      await saveManual(); build(); fillFilters(); toast('حُفظ في بنكي'); nIn.value = n ? n + 1 : ''; lblIn.value = ''; await draw(); renderFoot();
    }
    const mine = h('div', { class: 'lq-mine' });
    function renderMine() { const ms = St.manual.filter((m) => m.p === pageNo); mine.replaceChildren(...(ms.length ? [h('b', null, 'أسئلتي في هذه الصفحة')] : []), ...ms.map((m) => h('span', { class: 'lq-tag' }, m.label, ' ', h('a', { href: '#', onClick: async (e) => { e.preventDefault(); St.manual = St.manual.filter((x) => x.id !== m.id); await saveManual(); build(); fillFilters(); renderMine(); renderFoot(); } }, '✕')))); }
    mv.append(
      h('div', { class: 'lq-head' }, h('b', null, '✂️ تحديد يدوي'), h('button', { class: 'lv-btn sm', onClick: () => { mv.remove(); if (St.tab === 'all') renderList(); } }, '✓ تم')),
      h('div', { class: 'lq-row' }, h('button', { class: 'lv-btn sm', onClick: () => { pageNo = Math.max(1, pageNo - 1); draw(); } }, '→'), h('label', { class: 'lv-lbl' }, 'صفحة', pgIn), h('button', { class: 'lv-btn sm', onClick: () => { pageNo = Math.min(pdf.numPages, pageNo + 1); draw(); } }, '←'), h('span', { class: 'lv-note' }, `من ${pdf.numPages}`)),
      hint, h('div', { class: 'lq-mscroll' }, stage),
      h('div', { class: 'lq-row' }, h('label', { class: 'lv-lbl' }, 'رقم السؤال', nIn), lblIn), h('div', { class: 'lq-row' }, tSel, ySel, dSel), h('div', { class: 'lq-row' }, saveB), mine);
    ov.append(mv); await draw();
  }

  /* ---------- تشغيل ---------- */
  renderTabs(); renderFoot();
  try { await loadManual(); await analyse(); } catch (e) { console.error(e); status.textContent = 'تعذّر تحليل الملف: ' + (e.message || e); return { close }; }
  if (cancelled) return { close };
  build(); fillFilters(); renderList(); renderFoot();
  const nQ = St.items.filter((i) => !i.page && i.box).length, nP = St.items.filter((i) => i.page).length, nNo = St.items.filter((i) => !i.box).length;
  const cal = St.cal && St.cal.ok;
  status.textContent = `${cal ? `✓ تم التعرف على ملف الأستاذ وربطه ببنك الأسئلة (إزاحة الترقيم ${St.cal.offset >= 0 ? '+' : ''}${St.cal.offset}، وتحقق نصي ${St.cal.verified}/${St.cal.checked}). ` : 'ملف غير معروف: التصنيف بالنوع والنص فقط، ويمكنك التصنيف يدويًا. '}وُجد ${nQ} سؤالًا${nP ? ` و${nP} صفحة غير مقسّمة` : ''}${nNo ? `، و${nNo} بلا مكان محدد` : ''}.`;
  return { close };
}
