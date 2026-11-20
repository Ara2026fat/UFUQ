/**
 * حصة مباشرة — اكتشاف الأسئلة داخل ملف PDF (بدون خادم).
 * 1) segmentPage: من نص الصفحة (pdf.js) نجد «علامة رقم السؤال» ثم نحسب مستطيل كل سؤال.
 * 2) calibrateBank: نربط ترقيم صفحات بنك الأستاذ برقم الصفحة الفعلي في الملف (إزاحة) مع تحقق بالنص.
 * ARAFAT ALRAJHI © 2026
 */

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** تطبيع عربي للمطابقة: يزيل التشكيل والهمزات ويُبقي الحروف فقط. */
export function normAr(s) {
  return String(s || '').normalize('NFKC')
    .replace(/[‎‏‪-‮ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^ء-ي]/g, '');
}
/** نص حر للبحث: حروف وأرقام. */
export function normSearch(s) {
  return String(s || '').normalize('NFKC').replace(/[ً-ْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)).toLowerCase().replace(/\s+/g, ' ').trim();
}
const toInt = (s) => {
  const t = String(s).trim().replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d));
  return /^\d{1,3}$/.test(t) ? +t : null;
};
const OPT_LETTERS = new Set(['ا', 'ب', 'ج', 'د', 'أ', 'هـ', 'ه']);

/** يجلب عناصر نص الصفحة بإحداثيات من أعلى اليسار (وحدة pdf نقطة). */
async function pageItems(page) {
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const items = [];
  for (const it of tc.items) {
    const str = it.str; if (!str || !str.trim()) continue;
    const [x, y] = vp.convertToViewportPoint(it.transform[4], it.transform[5]);
    items.push({ s: str, x, y, h: it.height || Math.abs(it.transform[3]) || 10, w: it.width || 0 });
  }
  return { w: vp.width, h: vp.height, items };
}

/** صفوف الأرقام المتعددة في أسفل الصفحة (مفتاح الإجابة) — ليست علامات أسئلة. */
function keyRows(items, h) {
  const ints = items.filter((it) => toInt(it.s) && it.y > h * 0.83).sort((a, b) => a.y - b.y);
  const groups = []; for (const it of ints) { const g = groups[groups.length - 1]; if (g && it.y - g[g.length - 1].y <= 5) g.push(it); else groups.push([it]); }
  return groups.filter((g) => g.length >= 3).flat();
}
function pickMarkers(items, expected, h) {
  const cand = []; const key = new Set(keyRows(items, h));
  for (const it of items) { if (key.has(it)) continue; const v = toInt(it.s); if (v && v <= 400) cand.push({ ...it, v, hb: Math.round(it.h) }); }
  if (!cand.length) return [];
  const hs = items.map((i) => i.h).sort((a, b) => a - b); const med = hs[Math.floor(hs.length / 2)] || 12;
  const groups = new Map();
  for (const c of cand) { if (!groups.has(c.hb)) groups.set(c.hb, []); groups.get(c.hb).push(c); }
  let best = null, bestScore = 0;
  for (const [, g] of groups) {
    const vals = g.map((c) => c.v); const uniq = new Set(vals);
    let score;
    if (expected && expected.size) { score = [...uniq].filter((v) => expected.has(v)).length - (vals.length - uniq.size) * 0.5; }
    else {
      if (uniq.size !== vals.length) continue; // أرقام مكررة = أرقام داخل الأسئلة لا علامات
      if (g[0].hb > med * 0.75) continue; // علامة الرقم تكون أصغر من نص السؤال (شارة صغيرة)، أما أرقام الخيارات فبحجم النص
      const sorted = [...uniq].sort((a, b) => a - b); let run = 1, mx = 1;
      for (let i = 1; i < sorted.length; i++) { run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1; mx = Math.max(mx, run); }
      score = mx >= 2 ? mx : (sorted.length === 1 ? 0.6 : 0);
    }
    if (score > bestScore) { bestScore = score; best = g; }
  }
  if (!best) return [];
  const seen = new Map();
  for (const c of best.sort((a, b) => a.y - b.y)) { if (!seen.has(c.v)) seen.set(c.v, c); }
  return [...seen.values()];
}

/** أوسع فجوة فارغة رأسية بين x1 و x2 → مركزها (حد العمودين). */
function widestGap(items, x1, x2) {
  const iv = items.filter((i) => i.x + i.w > x1 && i.x < x2).map((i) => [Math.max(x1, i.x), Math.min(x2, i.x + i.w)]).sort((a, b) => a[0] - b[0]);
  let best = null, cur = x1;
  for (const [a, b] of iv) { if (a - cur > (best ? best[1] - best[0] : 0)) best = [cur, a]; cur = Math.max(cur, b); }
  if (x2 - cur > (best ? best[1] - best[0] : 0)) best = [cur, x2];
  return best && best[1] - best[0] >= 6 ? (best[0] + best[1]) / 2 : null;
}

/**
 * يقسّم صفحة إلى أسئلة.
 * @returns {{w,h,mode:'q'|'page',qs:[{n,box:[x0,y0,x1,y1],txt}], text}}  الإحداثيات مُطبَّعة 0..1
 */
export async function segmentPage(page, expected = null) {
  const { w, h, items } = await pageItems(page);
  const text = normSearch(items.slice().sort((a, b) => a.y - b.y || b.x - a.x).map((i) => i.s).join(' '));
  const markers = pickMarkers(items, expected, h);
  if (!markers.length) return { w, h, mode: 'page', qs: [], text, hasText: items.length > 0 };

  // أعمدة العلامات
  const xs = markers.map((m) => m.x).sort((a, b) => a - b);
  const clusters = []; for (const x of xs) { const c = clusters[clusters.length - 1]; if (c && x - c.max < 100) { c.max = x; c.sum += x; c.n++; } else clusters.push({ min: x, max: x, sum: x, n: 1 }); }
  const cx = clusters.map((c) => c.sum / c.n);
  const bounds = [0]; // حدود الأعمدة
  for (let i = 0; i < cx.length - 1; i++) bounds.push(widestGap(items, cx[i] + 4, cx[i + 1] - 120) ?? (cx[i] + 16));
  bounds.push(w);
  if (cx.length === 1) { // عمود واحد مستعمل: هل الصفحة بعمودين؟
    const g = widestGap(items, w * 0.35, w * 0.65);
    if (g) { if (cx[0] > w / 2) { bounds[0] = g; } else { bounds[1] = g; } }
  }
  const colOf = (m) => { let k = 0; for (let i = 0; i < cx.length; i++) if (Math.abs(m.x - cx[i]) < Math.abs(m.x - cx[k])) k = i; return k; };

  // أسفل الصفحة: صف أرقام «مفتاح الإجابة» إن وُجد
  const kr = keyRows(items, h);
  const keyTop = kr.length ? Math.min(...kr.map((i) => i.y - i.h)) - 8 : null;
  const limit = keyTop ?? h * 0.93;

  const qs = [];
  const byCol = new Map(); for (const m of markers) { const k = colOf(m); if (!byCol.has(k)) byCol.set(k, []); byCol.get(k).push(m); }
  for (const [k, ms] of byCol) {
    ms.sort((a, b) => a.y - b.y);
    let xa, xb;
    if (cx.length === 1) { xa = bounds[0]; xb = bounds[1]; } else { xa = bounds[k]; xb = bounds[k + 1]; }
    xa = Math.max(xa, 0); xb = Math.min(xb, w);
    ms.forEach((m, i) => {
      const top = Math.max(0, m.y - m.h - 6);
      const nextTop = i + 1 < ms.length ? ms[i + 1].y - ms[i + 1].h - 6 : limit;
      // آخر حرف خيار (أ ب ج د) داخل مجال السؤال
      const inCol = items.filter((it) => it.x >= xa - 2 && it.x <= xb && it.y > m.y && it.y < nextTop);
      const letters = inCol.filter((it) => OPT_LETTERS.has(it.s.trim()));
      let bottom = nextTop - 2;
      if (letters.length >= 2) bottom = Math.min(bottom, Math.max(...letters.map((l) => l.y)) + 30);
      else if (i + 1 >= ms.length && inCol.length) bottom = Math.min(bottom, Math.max(...inCol.map((l) => l.y)) + 18);
      bottom = Math.max(bottom, top + 40);
      const inReg = items.filter((it) => it.x >= xa - 2 && it.x <= xb && it.y >= top && it.y <= bottom);
      const txt = normSearch(inReg.sort((a, b) => a.y - b.y || b.x - a.x).map((i) => i.s).join(' '));
      qs.push({ n: m.v, box: [xa / w, top / h, xb / w, Math.min(bottom, h) / h], txt });
    });
  }
  qs.sort((a, b) => a.n - b.n);
  return { w, h, mode: 'q', qs, text };
}

/** يقسّم الملف كله (مع تقدم) ويعيد مصفوفة بنتائج كل صفحة. */
export async function segmentAll(pdf, expectedByPage, onProgress, isCancelled) {
  const out = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    if (isCancelled && isCancelled()) break;
    const page = await pdf.getPage(p);
    const r = await segmentPage(page, expectedByPage ? expectedByPage(p) : null);
    out.push({ p, ...r }); page.cleanup();
    if (onProgress && (p % 4 === 0 || p === pdf.numPages)) onProgress(p, pdf.numPages);
  }
  return out;
}

/**
 * يحدد إزاحة ترقيم بنك الأستاذ: صفحة الملف = pg + offset. يختبر عينة صفحات ويقارن أرقام الأسئلة
 * المكتشفة بأرقام البنك، ثم يتحقق بمطابقة نص السؤال.
 * @returns {{ok:boolean, offset:number, score:number, verified:number, checked:number}}
 */
export async function calibrateBank(pdf, bank, stemKey) {
  const byPg = new Map();
  for (const q of bank) { if (!byPg.has(q.pg)) byPg.set(q.pg, []); byPg.get(q.pg).push(q); }
  const pgs = [...byPg.keys()].filter((p) => byPg.get(p).length >= 2).sort((a, b) => a - b);
  if (!pgs.length) return { ok: false, offset: 0, score: 0, verified: 0, checked: 0 };
  const step = Math.max(1, Math.floor(pgs.length / 14));
  const sample = pgs.filter((_, i) => i % step === 0).slice(0, 14);
  const cache = new Map();
  const seg = async (p) => { if (p < 1 || p > pdf.numPages) return null; if (!cache.has(p)) { const pg = await pdf.getPage(p); cache.set(p, await segmentPage(pg, null)); pg.cleanup(); } return cache.get(p); };
  let best = { off: 0, score: -1 }, second = -1;
  const scores = [];
  for (let off = -4; off <= 4; off++) {
    let sum = 0, cnt = 0;
    for (const p of sample) {
      const r = await seg(p + off); cnt++;
      if (!r || r.mode !== 'q') continue;
      const a = new Set(r.qs.map((q) => q.n)), b = new Set(byPg.get(p).map((q) => q.n));
      const inter = [...a].filter((v) => b.has(v)).length; sum += inter / (a.size + b.size - inter);
    }
    scores.push([off, sum / cnt]);
  }
  scores.sort((a, b) => b[1] - a[1]); best = { off: scores[0][0], score: scores[0][1] }; second = scores[1][1];
  const ok = best.score >= 0.45 && best.score - second >= 0.15;
  // تحقق نصي: تشابه مقاطع (4 أحرف) بين نص السؤال في البنك ونص منطقته في الصفحة (≥ 50%)
  let verified = 0, checked = 0;
  if (ok) {
    for (const p of sample) {
      const r = await seg(p + best.off); if (!r || r.mode !== 'q') continue;
      for (const q of byPg.get(p)) {
        const a = normLoose(String(q.stem || '').replace(/\$[^$]*\$/g, '')); const hit = r.qs.find((x) => x.n === q.n);
        if (a.length < 8 || !hit) continue;
        const t = normLoose(hit.txt); let m = 0, n = 0; for (let i = 0; i + 4 <= a.length; i++) { n++; if (t.includes(a.slice(i, i + 4))) m++; }
        checked++; if (m / n >= 0.5) verified++;
      }
    }
  }
  return { ok, offset: best.off, score: best.score, verified, checked };
}

/** مفتاح نصي قصير لسؤال من البنك (أول 16 حرفًا عربيًا بدون الألف والرموز الرياضية). */
export const normLoose = (s) => normAr(s).replace(/ا/g, ''); // يتسامح مع «اال» المزدوجة وفروق الهمزة في الملفات
export function stemKey(q) {
  const k = normLoose(String(q.stem || '').replace(/\$[^$]*\$/g, ''));
  return k.length >= 10 ? k.slice(0, 16) : '';
}

/** بصمة الملف: أول 64 ك.ب (FNV) + عدد الصفحات + الحجم. */
export function fingerprint(bytes, numPages) {
  let hsh = 2166136261; const n = Math.min(bytes.length, 65536);
  for (let i = 0; i < n; i++) { hsh ^= bytes[i]; hsh = Math.imul(hsh, 16777619) >>> 0; }
  let h2 = 5381; for (let i = bytes.length - 1, c = 0; i >= 0 && c < 4096; i--, c++) h2 = ((h2 << 5) + h2 + bytes[i]) >>> 0;
  return `${hsh.toString(16)}-${h2.toString(16)}-${numPages}-${bytes.length}`;
}

/** يرسم منطقة (مُطبَّعة) من صفحة pdf.js على لوحة بعرض معيّن. يعيد اللوحة. */
export async function renderRegion(page, box, width, canvas = document.createElement('canvas')) {
  const v1 = page.getViewport({ scale: 1 });
  const rw = (box[2] - box[0]) * v1.width, rh = (box[3] - box[1]) * v1.height;
  const sc = width / rw;
  canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(rh * sc));
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const vp = page.getViewport({ scale: sc });
  const task = page.render({ canvasContext: ctx, viewport: vp, transform: [1, 0, 0, 1, -box[0] * vp.width, -box[1] * vp.height] });
  await task.promise;
  return canvas;
}
