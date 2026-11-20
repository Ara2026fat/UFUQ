/**
 * حصة مباشرة — الأستاذ يفتح ملف PDF، يحلّ بخط يده فوق الصفحة أو على ورقة بيضاء،
 * ثم يصدّر ملفًا جديدًا بتاريخ الحصة. كل شيء على جهازه (لا رفع ولا خادم).
 * ARAFAT ALRAJHI © 2026
 */
import { h, toast } from '../../core/dom.js';
import { isStaff } from '../../core/staff.js';
import { idbGet, idbSet, idbDel } from './live-store.js';
import { openPicker } from './live-picker.js';
import { renderRegion, fingerprint } from './live-qseg.js';
import { createRecorder, recSupported, recoverRecording } from './live-rec.js';

const VENDOR = (p) => new URL(`../../../vendor/${p}`, import.meta.url).href;
const COLORS = [['#111111', 'أسود'], ['#1F63D6', 'أزرق'], ['#D8281C', 'أحمر'], ['#1E8E3E', 'أخضر']];
const A4 = 1.4142;

let pdfjsP = null;
const loadPdfjs = () => pdfjsP || (pdfjsP = import(VENDOR('pdfjs/pdf.min.mjs')).then((m) => { m.GlobalWorkerOptions.workerSrc = VENDOR('pdfjs/pdf.worker.min.mjs'); return m; }));
const loadPdfLib = () => import(VENDOR('pdflib/pdf-lib.esm.min.js'));

const today = () => new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const longDate = (d) => { try { return d.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return iso(d); } };

/* ---------- رسم الخطوط ---------- */
function drawStrokes(ctx, strokes, W, H, scale = 1) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const s of strokes) {
    const p = s.p; if (!p.length) continue;
    ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = s.w * W * scale;
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0] * W, p[0][1] * H, ctx.lineWidth / 2, 0, 7); ctx.fill(); continue; }
    ctx.beginPath(); ctx.moveTo(p[0][0] * W, p[0][1] * H);
    for (let i = 1; i < p.length - 1; i++) {
      const mx = (p[i][0] + p[i + 1][0]) / 2 * W, my = (p[i][1] + p[i + 1][1]) / 2 * H;
      ctx.quadraticCurveTo(p[i][0] * W, p[i][1] * H, mx, my);
    }
    const l = p[p.length - 1]; ctx.lineTo(l[0] * W, l[1] * H); ctx.stroke();
  }
}

export function liveView() {
  if (!document.querySelector('link[href$="css/live.css"]')) document.head.append(h('link', { rel: 'stylesheet', href: new URL('../../../css/live.css', import.meta.url).href }));
  const root = h('div', { class: 'live' });
  if (!isStaff()) { root.append(h('p', { class: 'lv-note' }, 'هذه الصفحة للأستاذ والفريق فقط.')); return root; }

  const S = { pdf: null, bytes: null, name: '', entries: [], strokes: {}, cur: 0, tool: 'pen', color: COLORS[1][0], w: 0.0032, from: 1, to: 1, date: iso(today()), key: 'cur', rendering: 0, draw: true, mode: 'pdf', fp: '', seen: new Set(), includeAll: false };
  let saveT = null;
  const redo = [];

  const stage = h('div', { class: 'lv-stage' });
  const base = h('canvas', { class: 'lv-base' });
  const ink = h('canvas', { class: 'lv-ink' });
  stage.append(base, ink);
  const ictx = ink.getContext('2d');

  const pageLbl = h('span', { class: 'lv-pg' }, '');
  const bar = h('div', { class: 'lv-bar', hidden: true });
  const info = h('p', { class: 'lv-note' });
  const picker = h('div', { class: 'lv-open' });
  const wrap = h('div', { class: 'lv-wrap', hidden: true }, stage);

  const eid = (e) => (e.t === 'pdf' ? `p${e.i}` : e.t === 'q' ? `q${e.id}` : `b${e.id}`);
  const qCache = new Map();
  let seenT = null;
  const curE = () => S.entries[S.cur];
  const curStrokes = () => (S.strokes[eid(curE())] ||= []);

  function scheduleSave() {
    clearTimeout(saveT);
    saveT = setTimeout(async () => {
      try { await idbSet(S.key, { name: S.name, bytes: S.bytes, entries: S.entries, strokes: S.strokes, cur: S.cur, from: S.from, to: S.to, date: S.date, nextBlank: S.nextBlank || 1, mode: S.mode, fp: S.fp, seen: [...S.seen], at: Date.now() }); info.textContent = '✓ تم الحفظ تلقائيًا على هذا الجهاز'; }
      catch (e) { info.textContent = 'تعذّر الحفظ التلقائي (المساحة ممتلئة؟). صدّر ملفك قبل الإغلاق.'; }
    }, 900);
  }

  function repaintInk() { ictx.clearRect(0, 0, ink.width, ink.height); drawStrokes(ictx, curStrokes(), ink.width, ink.height); }

  /** ورقة سؤال: مقطع السؤال في الأعلى ومساحة كتابة بيضاء تحته. */
  async function drawQ(e, ctx, W, H, forExport) {
    const m = Math.round(W * 0.03), cvw = W - 2 * m, key = `${e.id}|${e.i}|${cvw}`;
    let c = qCache.get(key);
    if (!c) { const pg = await S.pdf.getPage(e.i); c = await renderRegion(pg, e.box, cvw); if (!forExport) { qCache.set(key, c); if (qCache.size > 12) qCache.delete(qCache.keys().next().value); } }
    const maxH = H * 0.5; let dw = c.width, dh = c.height; if (dh > maxH) { const k = maxH / dh; dw *= k; dh = maxH; }
    ctx.drawImage(c, (W - dw) / 2, m, dw, dh);
    const y = m + dh + m * 0.6;
    ctx.save(); ctx.strokeStyle = 'rgba(31,99,214,.45)'; ctx.lineWidth = Math.max(1, W / 700); ctx.setLineDash([W / 60, W / 90]);
    ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(W - m, y); ctx.stroke(); ctx.restore();
    if (!forExport) { ctx.strokeStyle = 'rgba(31,99,214,.09)'; ctx.lineWidth = 1; const g = W / 22; for (let yy = y + g; yy < H; yy += g) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); } }
  }

  async function showPage() {
    const e = curE(); if (!e) return;
    const token = ++S.rendering;
    pageLbl.textContent = `${S.cur + 1} / ${S.entries.length}${e.t === 'blank' ? ' (ورقة بيضاء)' : e.t === 'q' ? ' · ' + e.label : ''}`;
    clearTimeout(seenT); const sid = eid(e); seenT = setTimeout(() => { if (!S.seen.has(sid)) { S.seen.add(sid); scheduleSave(); } }, 2000);
    const avail = Math.min(stage.parentElement.clientWidth || 360, 1000);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cw, ch, page;
    if (e.t === 'pdf') { page = await S.pdf.getPage(e.i); const v1 = page.getViewport({ scale: 1 }); cw = avail; ch = Math.round(avail * v1.height / v1.width); }
    else { cw = avail; ch = Math.round(avail * A4); }
    if (token !== S.rendering) return;
    stage.style.width = `${cw}px`; stage.style.height = `${ch}px`;
    for (const c of [base, ink]) { c.width = Math.round(cw * dpr); c.height = Math.round(ch * dpr); c.style.width = `${cw}px`; c.style.height = `${ch}px`; }
    const bctx = base.getContext('2d'); bctx.fillStyle = '#fff'; bctx.fillRect(0, 0, base.width, base.height);
    if (e.t === 'pdf') {
      const vp = page.getViewport({ scale: base.width / page.getViewport({ scale: 1 }).width });
      try { await page.render({ canvasContext: bctx, viewport: vp }).promise; } catch (err) { /* تم الإلغاء */ }
    } else if (e.t === 'q') {
      try { await drawQ(e, bctx, base.width, base.height, false); } catch (err) { console.error(err); }
    } else {
      bctx.strokeStyle = 'rgba(31,99,214,.10)'; bctx.lineWidth = 1;
      const g = base.width / 22; for (let y = g; y < base.height; y += g) { bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(base.width, y); bctx.stroke(); }
    }
    if (token !== S.rendering) return;
    repaintInk();
    prev.disabled = S.cur === 0; next.disabled = S.cur === S.entries.length - 1;
    undoB.disabled = !curStrokes().length;
  }

  /* ---------- الكتابة ---------- */
  let cur = null;
  const pt = (ev) => { const r = ink.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height]; };
  ink.addEventListener('pointerdown', (ev) => {
    if (!S.draw) return;
    if (ev.pointerType === 'touch' && S.penOnly) return;
    ev.preventDefault(); ink.setPointerCapture(ev.pointerId);
    if (S.tool === 'erase') { cur = { erase: true }; eraseAt(pt(ev)); return; }
    const w = S.tool === 'hi' ? S.w * 6 : S.w * (ev.pointerType === 'pen' && ev.pressure ? 0.6 + ev.pressure : 1);
    cur = { c: S.tool === 'hi' ? '#FFE14D' : S.color, w, p: [pt(ev)], hi: S.tool === 'hi' };
  });
  ink.addEventListener('pointermove', (ev) => {
    if (!cur) return; ev.preventDefault();
    if (cur.erase) { eraseAt(pt(ev)); return; }
    const evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev];
    for (const e2 of (evs.length ? evs : [ev])) cur.p.push(pt(e2));
    repaintInk(); drawStrokes(ictx, [cur], ink.width, ink.height);
  });
  const endDraw = () => {
    if (!cur) return;
    if (!cur.erase) { curStrokes().push({ c: cur.c, w: cur.w, p: cur.p, hi: cur.hi }); redo.length = 0; }
    cur = null; repaintInk(); undoB.disabled = !curStrokes().length; scheduleSave();
  };
  ink.addEventListener('pointerup', endDraw); ink.addEventListener('pointercancel', endDraw);
  function eraseAt([x, y]) {
    const st = curStrokes(); const r = 0.025; const before = st.length;
    const keep = st.filter((s) => !s.p.some(([px, py]) => Math.hypot(px - x, (py - y) * (ink.height / ink.width)) < r));
    if (keep.length !== before) { S.strokes[eid(curE())] = keep; repaintInk(); }
  }

  /* ---------- أدوات ---------- */
  const go = (d) => { S.cur = Math.min(S.entries.length - 1, Math.max(0, S.cur + d)); showPage(); scheduleSave(); window.scrollTo({ top: 0 }); };
  const prev = h('button', { class: 'lv-btn', 'aria-label': 'الصفحة السابقة', onClick: () => go(-1) }, '→');
  const next = h('button', { class: 'lv-btn', 'aria-label': 'الصفحة التالية', onClick: () => go(1) }, '←');
  const undoB = h('button', { class: 'lv-btn', onClick: () => { const s = curStrokes(); const x = s.pop(); if (x) redo.push(x); repaintInk(); undoB.disabled = !s.length; scheduleSave(); } }, '↩️ تراجع');
  const toolBtns = {};
  const setTool = (t) => { S.tool = t; for (const [k, b] of Object.entries(toolBtns)) b.classList.toggle('on', k === t); ink.style.cursor = t === 'erase' ? 'cell' : 'crosshair'; };
  const mk = (k, label) => (toolBtns[k] = h('button', { class: 'lv-btn' + (k === S.tool ? ' on' : ''), onClick: () => setTool(k) }, label));
  const colorBtns = COLORS.map(([c, n]) => h('button', { class: 'lv-col' + (c === S.color ? ' on' : ''), style: `--c:${c}`, 'aria-label': n, onClick: (ev) => { S.color = c; setTool('pen'); colorBtns.forEach((b) => b.classList.remove('on')); ev.currentTarget.classList.add('on'); } }));
  const widthB = h('button', { class: 'lv-btn', onClick: () => { S.w = S.w < 0.004 ? 0.006 : S.w < 0.007 ? 0.0018 : 0.0032; widthB.textContent = S.w > 0.005 ? '✒️ عريض' : S.w < 0.0025 ? '✒️ رفيع' : '✒️ متوسط'; } }, '✒️ متوسط');
  const penOnly = h('button', { class: 'lv-btn', onClick: () => { S.penOnly = !S.penOnly; penOnly.classList.toggle('on', S.penOnly); toast(S.penOnly ? 'الكتابة بالقلم فقط، والإصبع للتمرير' : 'الكتابة بالقلم والإصبع'); ink.style.touchAction = S.penOnly ? 'pan-y pinch-zoom' : 'none'; } }, '🖊️ قلم فقط');

  function addBlank() {
    S.nextBlank = (S.nextBlank || 1);
    const id = S.nextBlank++;
    S.entries.splice(S.cur + 1, 0, { t: 'blank', id });
    go(1); toast('أُضيفت ورقة بيضاء بعد هذه الصفحة');
  }
  function removeBlank() {
    const e = curE(); if (e.t !== 'blank') return;
    if (!confirm('حذف هذه الورقة البيضاء وما كُتب عليها؟')) return;
    delete S.strokes[eid(e)]; S.entries.splice(S.cur, 1); S.cur = Math.max(0, S.cur - 1); showPage(); scheduleSave();
  }
  function clearPage() { if (!curStrokes().length) return; if (!confirm('مسح كل ما كُتب على هذه الصفحة؟')) return; S.strokes[eid(curE())] = []; repaintInk(); undoB.disabled = true; scheduleSave(); }

  const rangeFrom = h('input', { class: 'lv-num', type: 'number', min: 1, value: 1, inputmode: 'numeric' });
  const rangeTo = h('input', { class: 'lv-num', type: 'number', min: 1, value: 1, inputmode: 'numeric' });
  const dateIn = h('input', { class: 'lv-date', type: 'date', value: S.date });
  const gotoIn = h('input', { class: 'lv-num', type: 'number', min: 1, inputmode: 'numeric', placeholder: 'رقم' });
  rangeFrom.onchange = () => { S.from = +rangeFrom.value || 1; scheduleSave(); };
  rangeTo.onchange = () => { S.to = +rangeTo.value || S.entries.length; scheduleSave(); };
  dateIn.onchange = () => { S.date = dateIn.value || iso(today()); scheduleSave(); };
  const gotoGo = () => { const n = +gotoIn.value; if (!n) return; const idx = S.entries.findIndex((e) => e.t === 'pdf' && e.i === n); if (idx >= 0) { S.cur = idx; showPage(); scheduleSave(); gotoIn.value = ''; } else toast('رقم صفحة غير موجود'); };
  gotoIn.addEventListener('keydown', (e) => { if (e.key === 'Enter') gotoGo(); });

  /* ---------- نوافذ وملفات ---------- */
  const fmtSize = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} م.ب` : `${Math.max(1, Math.round(n / 1024))} ك.ب`);
  function download(file) { const url = URL.createObjectURL(file); const lnk = h('a', { href: url, download: file.name }); document.body.append(lnk); lnk.click(); lnk.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); }
  function modal(title, ...kids) {
    const ov = h('div', { class: 'lv-dlg', role: 'dialog' }); const box = h('div', { class: 'lv-dbox' }, h('b', { class: 'lv-dt' }, title), ...kids);
    ov.append(box); document.body.append(ov); return { close: () => ov.remove(), box };
  }
  /** نافذة «الملفات جاهزة»: مشاركة/تنزيل بنقرة جديدة من المستخدم (شرط iPad Safari للمشاركة). */
  function filesDialog(files, title = 'ملفات الحصة جاهزة') {
    const can = (list) => { try { return !!(navigator.canShare && navigator.canShare({ files: list })); } catch (e) { return false; } };
    const m = modal(title);
    for (const f of files) {
      m.box.append(h('div', { class: 'lv-frow' }, h('div', null, h('b', null, f.label), h('div', { class: 'lv-note' }, `${f.file.name} · ${fmtSize(f.file.size)}`)),
        h('div', { class: 'lv-row' },
          can([f.file]) ? h('button', { class: 'lv-btn sm go', onClick: async () => { try { await navigator.share({ files: [f.file], title: f.label }); } catch (e) { /* أُلغيت */ } } }, 'مشاركة') : null,
          h('button', { class: 'lv-btn sm', 'data-dl': f.file.name, onClick: () => download(f.file) }, '⬇ تنزيل'))));
    }
    if (files.length > 1 && can(files.map((f) => f.file))) m.box.append(h('button', { class: 'lv-btn go', onClick: async () => { try { await navigator.share({ files: files.map((f) => f.file), title: 'حصة أفق القدرات' }); } catch (e) { /* */ } } }, 'مشاركة الملفين معًا'));
    m.box.append(h('button', { class: 'lv-btn', onClick: m.close }, 'إغلاق'));
    return m;
  }

  /* ---------- التصدير ---------- */
  const expBtn = h('button', { class: 'lv-btn go', onClick: exportPdf }, '📄 تصدير ملف الحصة');
  const rangeRow = h('div', { class: 'lv-row' }, h('label', { class: 'lv-lbl' }, 'من صفحة', rangeFrom), h('label', { class: 'lv-lbl' }, 'إلى صفحة', rangeTo));
  const allChk = h('input', { type: 'checkbox', onChange: () => { S.includeAll = allChk.checked; } });
  const qRow = h('label', { class: 'lv-lbl', hidden: true }, allChk, 'تضمين كل الأسئلة المختارة (وليس ما شُرح فقط)');
  const qNote = h('p', { class: 'lv-note', hidden: true }, 'يُصدَّر ما فتحتَه أو كتبتَ عليه من الأسئلة والأوراق (الأسئلة التي لم تُفتح تُستثنى).');
  const syncMode = () => { const q = S.mode === 'q'; rangeRow.hidden = q; qRow.hidden = !q; qNote.hidden = !q; gotoRow.hidden = q; fullB.hidden = !q; };

  /** يبني ملف PDF الحصة ويعيد { bytes, name, count }. */
  async function buildPdf() {
    const { PDFDocument } = await loadPdfLib();
    const out = await PDFDocument.create();
    const date = S.date; const d = new Date(date + 'T12:00:00');
    const stamp = `حصة ${longDate(d)} — أفق القدرات · بإشراف الأستاذ إبراهيم البربري`;
    let picked, src = null;
    if (S.mode === 'q') {
      const explained = S.entries.filter((e) => S.seen.has(eid(e)) || (S.strokes[eid(e)] || []).length);
      picked = S.includeAll || !explained.length ? S.entries.slice() : explained;
    } else {
      src = await PDFDocument.load(S.bytes, { ignoreEncryption: true });
      const a = Math.max(1, Math.min(+rangeFrom.value || 1, S.pdf.numPages)); const b = Math.max(a, Math.min(+rangeTo.value || S.pdf.numPages, S.pdf.numPages));
      const iFrom = S.entries.findIndex((e) => e.t === 'pdf' && e.i === a); const iTo = S.entries.findIndex((e) => e.t === 'pdf' && e.i === b);
      picked = S.entries.slice(iFrom, iTo + 1);
    }
    const A4P = [595.28, 841.89]; let lastSize = A4P;
    { const cp = out.addPage(lastSize); const cv = document.createElement('canvas'); cv.width = 1240; cv.height = 1754; const c = cv.getContext('2d');
      const g = c.createLinearGradient(0, 0, 0, 1754); g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#DCE9FF'); c.fillStyle = g; c.fillRect(0, 0, 1240, 1754);
      try { const im = await new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = new URL('../../../icons/logo-sm.png', import.meta.url).href; }); c.drawImage(im, 470, 330, 300, 225); } catch (e) { /* بدون شعار */ }
      c.direction = 'rtl'; c.textAlign = 'center';
      c.fillStyle = '#123F9E'; c.font = '800 96px Tajawal, "Segoe UI", Tahoma, sans-serif'; c.fillText('أفق القدرات', 620, 700);
      c.fillStyle = '#B9820F'; c.font = '700 48px Tajawal, "Segoe UI", Tahoma, sans-serif'; c.fillText('قدرات كمي ولفظي', 620, 780);
      c.fillStyle = '#111'; c.font = '800 62px Tajawal, "Segoe UI", Tahoma, sans-serif'; c.fillText('ملف الحصة', 620, 950);
      c.font = '700 46px Tajawal, "Segoe UI", Tahoma, sans-serif'; c.fillText(longDate(d), 620, 1030);
      c.fillStyle = '#555'; c.font = '600 38px Tajawal, "Segoe UI", Tahoma, sans-serif'; c.fillText(S.name.replace(/\.pdf$/i, ''), 620, 1110);
      if (S.mode === 'q') c.fillText(`${picked.length} ${picked.length === 1 ? 'ورقة' : 'أوراق'} (أسئلة مختارة)`, 620, 1170);
      c.fillStyle = '#123F9E'; c.font = '700 40px Tajawal, "Segoe UI", Tahoma, sans-serif'; c.fillText('بإشراف الأستاذ إبراهيم البربري', 620, 1560);
      const pb = await new Promise((r) => cv.toBlob(r, 'image/png')); const pi = await out.embedPng(new Uint8Array(await pb.arrayBuffer())); cp.drawImage(pi, { x: 0, y: 0, width: lastSize[0], height: lastSize[1] }); }
    for (const e of picked) {
      let pg;
      if (e.t === 'pdf') { [pg] = await out.copyPages(src, [e.i - 1]); out.addPage(pg); lastSize = [pg.getWidth(), pg.getHeight()]; }
      else if (e.t === 'q') {
        pg = out.addPage(A4P);
        const px = 1600, py = Math.round(px * A4); const bc = document.createElement('canvas'); bc.width = px; bc.height = py; const bx = bc.getContext('2d');
        bx.fillStyle = '#fff'; bx.fillRect(0, 0, px, py); await drawQ(e, bx, px, py, true);
        const jb = await new Promise((r) => bc.toBlob(r, 'image/jpeg', 0.92)); const ji = await out.embedJpg(new Uint8Array(await jb.arrayBuffer()));
        pg.drawImage(ji, { x: 0, y: 0, width: A4P[0], height: A4P[1] });
      } else { pg = out.addPage([lastSize[0], lastSize[1] || lastSize[0] * A4]); }
      const w = pg.getWidth(), hgt = pg.getHeight();
      const cv = document.createElement('canvas'); const px = 1600; cv.width = px; cv.height = Math.round(px * hgt / w);
      const cx = cv.getContext('2d'); drawStrokes(cx, S.strokes[eid(e)] || [], cv.width, cv.height);
      if (e.t !== 'pdf') { cx.font = `700 ${Math.round(cv.width * 0.018)}px Tajawal, "Segoe UI", Tahoma, sans-serif`; cx.direction = 'rtl'; cx.textAlign = 'center'; cx.fillStyle = 'rgba(14,47,122,.55)'; cx.fillText(stamp, cv.width / 2, cv.height - cv.width * 0.012); }
      const png = await new Promise((r) => cv.toBlob(r, 'image/png'));
      const img = await out.embedPng(new Uint8Array(await png.arrayBuffer()));
      pg.drawImage(img, { x: 0, y: 0, width: w, height: hgt });
    }
    return { bytes: await out.save(), name: `hissa-ufuq-${date}.pdf`, count: picked.length + 1 };
  }
  async function exportPdf() {
    expBtn.disabled = true; const old = expBtn.textContent; expBtn.textContent = '⏳ جارٍ التجهيز…';
    try {
      const r = await buildPdf();
      const blob = new Blob([r.bytes], { type: 'application/pdf' }); const file = new File([blob], r.name, { type: 'application/pdf' });
      filesDialog([{ file, label: 'ملف الحصة (PDF)' }]);
      toast(`تم إنشاء ${r.name} (${r.count} صفحة)`);
    } catch (e) { console.error(e); toast('تعذّر إنشاء الملف: ' + (e.message || e)); }
    finally { expBtn.disabled = false; expBtn.textContent = old; }
  }

  /* ---------- تسجيل الحصة (فيديو) ---------- */
  let R = null; let pill = null, pillT = null;
  const recBtn = h('button', { class: 'lv-btn rec', onClick: () => (R && R.state === 'recording' ? finishSession() : askRecord()) }, '🔴 تسجيل الحصة');
  const mmss = (ms) => { const t = Math.floor(ms / 1000); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };
  function showPill() {
    pillT = h('span', { class: 'lv-rt' }, '00:00');
    const pb = h('button', { class: 'lv-pp', 'aria-label': 'إيقاف مؤقت', onClick: () => { if (!R) return; if (R.paused) { R.resume(); pb.textContent = '⏸'; } else { R.pause(); pb.textContent = '▶'; } } }, '⏸');
    pill = h('div', { class: 'lv-recpill', role: 'status' }, h('i', { class: 'lv-dot' }), pillT, pb); document.body.append(pill);
  }
  const hidePill = () => { if (pill) pill.remove(); pill = null; };
  const setRecUi = (on) => { recBtn.textContent = on ? '⏹ إنهاء وحفظ' : '🔴 تسجيل الحصة'; recBtn.classList.toggle('on', on); };
  function askRecord() {
    if (!recSupported()) { toast('هذا المتصفح لا يدعم تسجيل الفيديو. حدّث المتصفح أو جرّب Safari/Chrome حديثًا.'); return; }
    const mic = h('input', { type: 'checkbox', checked: true });
    const m = modal('تسجيل الحصة', h('p', { class: 'lv-note' }, 'يُسجَّل ما يظهر على اللوحة (السؤال وخط يدك) فيديو على جهازك. عند «إنهاء» يُحفظ الفيديو وملف PDF معًا.'),
      h('label', { class: 'lv-lbl' }, mic, 'تسجيل صوتي (الميكروفون) — سيطلب المتصفح إذنك'),
      h('div', { class: 'lv-row' }, h('button', { class: 'lv-btn go', onClick: () => { m.close(); startRec(mic.checked); } }, '● ابدأ التسجيل'), h('button', { class: 'lv-btn', onClick: () => m.close() }, 'إلغاء')));
  }
  async function startRec(wantMic) {
    if (wrap.hidden) { toast('افتح الملف أو الأسئلة أولًا'); return; }
    R = createRecorder({ sources: () => [base, ink], onTick: (ms, paused) => { if (pillT) pillT.textContent = (paused ? '⏸ ' : '') + mmss(ms); if (!root.isConnected && R && R.state === 'recording') leaveWhileRecording(); }, onEnded: (res) => { if (res && res.unexpected) onUnexpected(res); } });
    try {
      const { micErr } = await R.start({ wantMic });
      showPill(); setRecUi(true);
      if (wantMic && micErr) toast('لم يُسمح بالميكروفون — سيُسجَّل الفيديو بدون صوت');
      else if (wantMic) toast('بدأ التسجيل مع الصوت'); else toast('بدأ التسجيل');
    } catch (e) { console.error(e); R = null; toast('تعذّر بدء التسجيل: ' + (e.message || e)); }
  }
  async function leaveWhileRecording() { const r = R; R = null; hidePill(); const res = await r.stop(); if (res && res.blob) filesDialog([{ file: new File([res.blob], `hissa-ufuq-${S.date}.${res.ext}`, { type: res.blob.type }), label: 'تسجيل الحصة (فيديو)' }], 'حُفظ التسجيل'); }
  async function onUnexpected(res) { hidePill(); setRecUi(false); R = null; toast('توقّف التسجيل (قُفلت الشاشة أو انقطع المتصفح) — يمكنك حفظ ما سُجِّل'); await finishSession(res); }
  window.addEventListener('beforeunload', (e) => { if (R && R.state === 'recording') { e.preventDefault(); e.returnValue = ''; } });

  /** «إنهاء»: يوقف التسجيل ثم يجهّز PDF الحصة، ويعرض الملفين للمشاركة/التنزيل. */
  async function finishSession(early) {
    recBtn.disabled = true; expBtn.disabled = true; const busy = toastBusy('جارٍ تجهيز ملفات الحصة…');
    try {
      let video = early || null;
      if (R) { const r = R; R = null; hidePill(); setRecUi(false); video = await r.stop(); }
      const files = [];
      const r = await buildPdf();
      files.push({ file: new File([new Blob([r.bytes], { type: 'application/pdf' })], r.name, { type: 'application/pdf' }), label: `ملف الحصة (PDF) — ${r.count} صفحة` });
      if (video && video.blob && video.blob.size) files.push({ file: new File([video.blob], `hissa-ufuq-${S.date}.${video.ext}`, { type: video.blob.type || (video.ext === 'mp4' ? 'video/mp4' : 'video/webm') }), label: `فيديو الحصة (${mmss(video.ms || 0)})` });
      else if (video && video.error) toast('تعذّر تجميع الفيديو');
      filesDialog(files);
    } catch (e) { console.error(e); toast('تعذّر إنهاء الحصة: ' + (e.message || e)); }
    finally { busy(); recBtn.disabled = false; expBtn.disabled = false; }
  }

  /* ---------- فتح ملف / وضع الأسئلة ---------- */
  const home = () => {
    picker.replaceChildren(
      h('h1', null, '🎓 حصة مباشرة'),
      h('p', { class: 'lv-note' }, 'افتح ملف PDF من جهازك، ثم اكتب بخط يدك فوق الصفحات أو اختر أسئلة محددة لشرحها فقط. يمكنك تسجيل الحصة فيديو، وتصدير ملف بتاريخ الحصة. لا يُرفع شيء إلى أي مكان.'),
      h('button', { class: 'lv-btn go big', onClick: () => fileIn.click() }, '📂 اختر ملف PDF'));
    idbGet(S.key).then((s) => {
      if (!s || !s.bytes) return;
      picker.append(h('div', { class: 'lv-resume' },
        h('p', null, `آخر حصة محفوظة: ${s.name.replace(/\.pdf$/i, '')}${s.mode === 'q' ? ` (${s.entries.length} ورقة أسئلة)` : ''} — ${new Date(s.at).toLocaleString('ar')}`),
        h('button', { class: 'lv-btn big', onClick: async () => { try { await loadBytes(s.bytes, s.name, s); } catch (e) { toast('تعذّر استكمال الحصة'); } } }, '↩️ استكمال الحصة'),
        h('button', { class: 'lv-btn danger', onClick: async (ev) => { if (!confirm('حذف الحصة المحفوظة نهائيًا؟')) return; await idbDel(S.key); ev.target.closest('.lv-resume').remove(); } }, 'حذف المحفوظة')));
    }).catch(() => {});
    recoverRecording().then((r) => {
      if (!r || !r.blob.size) return;
      const box = h('div', { class: 'lv-resume' }, h('p', null, `وُجد تسجيل فيديو لم يُحفظ (${fmtSize(r.blob.size)}) من ${new Date(r.at).toLocaleString('ar')}`),
        h('button', { class: 'lv-btn big', onClick: () => filesDialog([{ file: new File([r.blob], `hissa-ufuq-recovered.${r.ext}`, { type: r.blob.type }), label: 'تسجيل غير مكتمل' }], 'استرجاع التسجيل') }, '💾 حفظ التسجيل'),
        h('button', { class: 'lv-btn danger', onClick: async () => { if (!confirm('حذف التسجيل نهائيًا؟')) return; await r.discard(); box.remove(); } }, 'حذف'));
      picker.append(box);
    });
  };
  function enterView() {
    picker.hidden = true; bar.hidden = false; wrap.hidden = false;
    title.textContent = S.name.replace(/\.pdf$/i, '');
    rangeFrom.max = rangeTo.max = S.pdf.numPages; rangeFrom.value = S.from; rangeTo.value = S.to; dateIn.value = S.date; allChk.checked = S.includeAll;
    syncMode(); showPage(); scheduleSave();
  }
  function showChoice() {
    picker.hidden = false; bar.hidden = true; wrap.hidden = true;
    picker.replaceChildren(h('h1', null, '📄 ' + S.name.replace(/\.pdf$/i, '')), h('p', { class: 'lv-note' }, `${S.pdf.numPages} صفحة. كيف تريد الحصة؟`),
      h('button', { class: 'lv-btn go big', onClick: () => openPick() }, '🎯 اختيار أسئلة محددة (حسب الدرس أو النوع أو الصعوبة)'),
      h('button', { class: 'lv-btn big', onClick: () => enterView() }, '📖 فتح الملف كاملًا والكتابة عليه'),
      h('button', { class: 'lv-btn', onClick: () => { home(); } }, 'رجوع'));
  }
  const hasInk = () => Object.values(S.strokes).some((a) => a && a.length);
  async function openPick() {
    try { await openPicker({ pdf: S.pdf, fp: S.fp, name: S.name, onStart: startFromQuestions, onClose: () => {} }); } catch (e) { console.error(e); toast('تعذّر فتح اختيار الأسئلة: ' + (e.message || e)); }
  }
  function startFromQuestions(entries) {
    if (hasInk() && !confirm('سيبدأ هذا حصة جديدة من الأسئلة المختارة، وسيُستبدل ما كتبته في الجلسة الحالية. متابعة؟')) return;
    S.entries = entries; S.strokes = {}; S.cur = 0; S.mode = 'q'; S.seen = new Set(); S.nextBlank = 1; qCache.clear(); redo.length = 0;
    enterView(); toast(`بدأت الحصة بـ ${entries.length} سؤالًا`);
  }
  function backToFull() {
    if (hasInk() && !confirm('العودة إلى الملف كاملًا ستستبدل ما كتبته على الأسئلة. متابعة؟')) return;
    S.entries = Array.from({ length: S.pdf.numPages }, (_, k) => ({ t: 'pdf', i: k + 1 })); S.strokes = {}; S.cur = 0; S.mode = 'pdf'; S.seen = new Set(); S.from = 1; S.to = Math.min(S.pdf.numPages, 10);
    enterView();
  }
  async function loadBytes(bytes, name, restore, choose) {
    const pdfjs = await loadPdfjs();
    S.bytes = bytes; S.name = name;
    S.pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
    S.fp = (restore && restore.fp) || fingerprint(bytes, S.pdf.numPages); qCache.clear();
    if (restore) { Object.assign(S, { entries: restore.entries, strokes: restore.strokes, cur: restore.cur || 0, from: restore.from, to: restore.to, date: restore.date, nextBlank: restore.nextBlank, mode: restore.mode || 'pdf', seen: new Set(restore.seen || []) }); }
    else { S.entries = Array.from({ length: S.pdf.numPages }, (_, k) => ({ t: 'pdf', i: k + 1 })); S.strokes = {}; S.cur = 0; S.from = 1; S.to = Math.min(S.pdf.numPages, 10); S.date = iso(today()); S.nextBlank = 1; S.mode = 'pdf'; S.seen = new Set(); }
    if (choose && !restore) showChoice(); else enterView();
  }
  const fileIn = h('input', { type: 'file', accept: 'application/pdf,.pdf', hidden: true, onChange: async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    const busy = toastBusy('جارٍ فتح الملف…');
    try { await loadBytes(new Uint8Array(await f.arrayBuffer()), f.name, null, true); } catch (e) { console.error(e); toast('تعذّر فتح الملف: ' + (e.message || e)); } finally { busy(); ev.target.value = ''; }
  } });
  const toastBusy = (m) => { const t = h('div', { class: 'toast' }, m); document.body.append(t); return () => t.remove(); };
  const title = h('b', { class: 'lv-title' }, '');
  title.hidden = true;
  home();
  if (window.__ufuqLib) { const pre = window.__ufuqLib; window.__ufuqLib = null; setTimeout(async () => { const done = toastBusy('جارٍ فتح الملف…'); try { await loadBytes(pre.bytes, pre.name, null, true); } catch (e) { console.error(e); toast('تعذّر فتح الملف: ' + (e.message || e)); } finally { done(); } }, 0); }

  const moreBtn = h('button', { class: 'lv-btn', 'aria-label': 'المزيد', onClick: () => { more.hidden = !more.hidden; } }, '⋯');
  const gotoRow = h('div', { class: 'lv-row' }, widthB, penOnly, h('label', { class: 'lv-lbl' }, 'اذهب إلى صفحة', gotoIn), h('button', { class: 'lv-btn sm', onClick: gotoGo }, 'اذهب'));
  const fullB = h('button', { class: 'lv-btn sm', hidden: true, onClick: backToFull }, '📖 الملف كاملًا');
  const more = h('div', { class: 'lv-more', hidden: true }, gotoRow,
    h('div', { class: 'lv-row' }, h('button', { class: 'lv-btn sm', onClick: removeBlank }, '🗑️ حذف الورقة البيضاء'), h('button', { class: 'lv-btn sm danger', onClick: clearPage }, 'مسح الصفحة'), h('button', { class: 'lv-btn sm', onClick: () => fileIn.click() }, '📂 ملف آخر'), fullB));
  bar.append(
    h('div', { class: 'lv-row tools' }, mk('pen', '✏️ قلم'), mk('hi', '🖍️ تظليل'), mk('erase', '🧽 ممحاة'), ...colorBtns, undoB),
    h('div', { class: 'lv-row nav' }, prev, pageLbl, next, h('button', { class: 'lv-btn', onClick: addBlank }, '➕ ورقة'), moreBtn),
    h('div', { class: 'lv-row act' }, h('button', { class: 'lv-btn', onClick: () => { if (S.mode === 'q' && !confirm('اختيار أسئلة جديدة سيبدأ حصة جديدة ويستبدل الحالية. متابعة؟')) return; openPick(); } }, '🎯 اختيار أسئلة'), recBtn),
    more,
  );
  const exportBox = h('div', { class: 'lv-export' },
    h('b', null, 'تصدير ملف الحصة'),
    h('div', { class: 'lv-row' }, h('label', { class: 'lv-lbl' }, 'تاريخ الحصة', dateIn)), rangeRow, qRow, qNote,
    expBtn, info);
  exportBox.hidden = true;
  const obs = new MutationObserver(() => { exportBox.hidden = bar.hidden; }); obs.observe(bar, { attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('resize', () => { if (!wrap.hidden && root.isConnected) showPage(); });
  root.append(picker, fileIn, bar, wrap, exportBox);
  setTool('pen');
  return root;
}
