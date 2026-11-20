import { getPart, topicInPart, skillInPart } from '../../store/part.js';
import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { repo } from '../../store/repo.js';
import * as eng from '../../engine/engine.js';
import { loadAllBanks } from '../../store/bank.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
const NS = 'http://www.w3.org/2000/svg';
const svg = (html, cls) => { const s = h('span', { class: cls || '' }); s.innerHTML = html; return s; };

/** بيانات اللوحة: كلها محسوبة من محاولات الطالب وحالة المهارات — لا أرقام ثابتة. */
export function dashData(days = 14) {
  const at = repo.attempts().filter((a) => topicInPart(a.topic)), by = {};
  at.forEach((a) => { const k = dayKey(a.at), o = (by[k] ||= { n: 0, ok: 0 }); o.n++; if (a.correct) o.ok++; });
  const series = [], now = new Date(); now.setHours(12, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) { const d = new Date(now.getTime() - i * 864e5), o = by[dayKey(d)] || { n: 0, ok: 0 }; series.push({ d, n: o.n, ok: o.ok, acc: o.n ? Math.round((o.ok / o.n) * 100) : null }); }
  let ov = []; try { ov = eng.overview().filter((x) => skillInPart(x)); } catch (e) { /* engine not ready */ }
  const total = at.length, ok = at.filter((a) => a.correct).length;
  const last7 = series.slice(-7), prev7 = series.slice(-14, -7);
  const acc7 = (arr) => { const n = arr.reduce((s, x) => s + x.n, 0), o = arr.reduce((s, x) => s + x.ok, 0); return n ? Math.round((o / n) * 100) : null; };
  const avg = ov.length ? Math.round(ov.reduce((s, x) => s + x.pct, 0) / ov.length) : 0;
  return { at, series, total, acc: total ? Math.round((ok / total) * 100) : 0, acc7: acc7(last7), accPrev: acc7(prev7), ov, avg,
    mastered: ov.filter((x) => x.status === 'mastered').length, streak: eng.engineState().streak || 0, open: repo.mistakes().filter((m) => topicInPart(m.q.topic)).length };
}

/** خط الدقة + أعمدة عدد الأسئلة */
function trendSvg(series, W = 340, H = 118) {
  const pad = { l: 8, r: 8, t: 8, b: 16 }, iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, n = series.length;
  const x = (i) => pad.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1)), y = (v) => pad.t + ih - (v / 100) * ih;
  const maxN = Math.max(4, ...series.map((s) => s.n)), bw = Math.max(5, iw / n - 6);
  let g = '';
  [0, 50, 100].forEach((v) => { g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" stroke-opacity="${v === 50 ? .18 : .1}" stroke-dasharray="${v === 50 ? '3 4' : ''}"/>`; });
  series.forEach((s, i) => { if (s.n) { const bh = Math.max(3, (s.n / maxN) * ih * .55); g += `<rect x="${x(i) - bw / 2}" y="${pad.t + ih - bh}" width="${bw}" height="${bh}" rx="3" fill="#F0B323" fill-opacity=".38"/>`; } });
  const pts = series.map((s, i) => (s.acc == null ? null : [x(i), y(s.acc)])).filter(Boolean);
  if (pts.length > 1) g += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#1F63D6" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>`;
  pts.forEach((p, i) => { g += `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 5 : 3.4}" fill="#fff" stroke="#1F63D6" stroke-width="2.6"/>`; });
  const lab = (i, a) => `<text x="${x(i)}" y="${H - 3}" font-size="9.5" fill="currentColor" fill-opacity=".6" text-anchor="${a}">${AR(series[i].d.getDate())}/${AR(series[i].d.getMonth() + 1)}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="تطوّر نسبة الصواب خلال آخر ${AR(n)} يوماً" style="display:block;direction:ltr">${g}${lab(0, 'start')}${lab(n - 1, 'end')}</svg>`;
}

/** خريطة النشاط: ٢٨ يوماً */
function heat(d28) {
  const mx = Math.max(1, ...d28.map((s) => s.n));
  return h('div', { class: 'heat', role: 'img', 'aria-label': 'نشاطك خلال آخر ٢٨ يوماً' }, d28.map((s) => {
    const l = !s.n ? 0 : s.n >= 10 ? 4 : s.n >= 6 ? 3 : s.n >= 3 ? 2 : 1;
    return h('i', { class: `h${l}`, title: `${AR(s.d.getDate())}/${AR(s.d.getMonth() + 1)} — ${AR(s.n)}` });
  }));
}

const arrow = (a, b) => (a == null || b == null ? '' : a > b ? '▲' : a < b ? '▼' : '■');

export function progressView() {
  const wrap = h('div', { class: 'fit' }, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  loadAllBanks().then(() => eng.loadGraph()).then(() => {
    const D = dashData(14), D28 = dashData(28).series;
    const kpi = (ic, c, val, lab) => h('div', { class: `kpi c${c}` }, svg(icon(ic), 'ic'), h('b', null, val), h('small', null, lab));
    const started = D.ov.filter((x) => x.pct > 0 || x.status !== 'new');
    const weak = [...started].sort((a, b) => a.pct - b.pct).slice(0, 4);
    const delta = D.acc7 != null && D.accPrev != null ? D.acc7 - D.accPrev : null;
    const empty = !D.total;
    wrap.replaceChildren(
      h('div', { class: 'kpis' },
        kpi('flame', 1, AR(D.streak), 'أيام متتالية'),
        kpi('check', 2, AR(D.total), 'محاولة'),
        kpi('target', 3, `${AR(D.acc)}٪`, 'دقتك'),
        kpi('xcircle', 4, AR(D.open), 'أخطاء مفتوحة')),
      h('section', { class: 'dcard mastery' },
        h('div', { class: 'mring', style: `--p:${D.avg}`, role: 'img', 'aria-label': `متوسط الإتقان ${AR(D.avg)}٪` }, h('b', null, `${AR(D.avg)}٪`)),
        h('div', { class: 'grow' }, h('h3', null, 'إتقان المهارات'),
          h('p', null, `${AR(D.mastered)} من ${AR(D.ov.length)} مهارة متقنة`),
          h('div', { class: 'bar' }, h('i', { style: `width:${D.ov.length ? (D.mastered / D.ov.length) * 100 : 0}%` })),
          h('small', null, 'الإتقان يُبنى بالصواب أولاً ثم الاستمرار عبر الأيام.'))),
      h('section', { class: 'dcard' },
        h('div', { class: 'row between' }, h('h3', null, 'نموّك في آخر ١٤ يوماً'),
          delta != null ? h('small', { class: `dl ${delta >= 0 ? 'up' : 'down'}` }, `${arrow(D.acc7, D.accPrev)} ${AR(Math.abs(delta))}٪ عن الأسبوع السابق`) : null),
        empty ? h('p', { class: 'muted small' }, 'ابدأ تدريباً ليظهر نموّك هنا.') : svg(trendSvg(D.series)),
        h('div', { class: 'lg' }, h('span', null, h('i', { class: 'l1' }), 'نسبة الصواب'), h('span', null, h('i', { class: 'l2' }), 'عدد الأسئلة'))),
      h('div', { class: 'two' },
        h('section', { class: 'dcard' }, h('h3', null, 'نشاطك ٢٨ يوماً'), heat(D28)),
        h('section', { class: 'dcard weak' }, h('h3', null, 'تحتاج انتباهاً'),
          weak.length ? weak.map((x) => h('a', { href: `#/practice?mode=daily&skill=${x.id}`, class: 'wr' }, h('span', null, x.name), h('b', null, `${AR(x.pct)}٪`), h('div', { class: `bar ${x.pct < 40 ? 'warn' : ''}` }, h('i', { style: `width:${Math.max(4, x.pct)}%` }))))
            : h('p', { class: 'muted small' }, 'تظهر هنا مهاراتك الأضعف بعد أول تدريب.'))),
      h('a', { class: 'btn primary block', href: '#/map' }, 'خريطة مهاراتي كاملة'));
  });
  return wrap;
}

/** بطاقة الرئيسية المصغّرة: حلقة الإتقان + خط النمو + السلسلة + الدقة، وتفتح اللوحة. */
export function miniDash() {
  const D = dashData(7), s = D.series;
  const spark = (() => {
    const W = 120, H = 34, pts = s.map((v, i) => (v.acc == null ? null : [4 + (i * (W - 8)) / 6, 4 + (H - 8) - (v.acc / 100) * (H - 8)])).filter(Boolean);
    if (!D.total) return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}"><line x1="4" x2="${W - 4}" y1="${H - 5}" y2="${H - 5}" stroke="#fff" stroke-opacity=".35" stroke-dasharray="3 4"/></svg>`;
    const line = pts.length > 1 ? `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#FFD25A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    const last = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="direction:ltr">${line}${last ? `<circle cx="${last[0]}" cy="${last[1]}" r="3.6" fill="#fff" stroke="#FFD25A" stroke-width="2"/>` : ''}</svg>`;
  })();
  const m = (ic, v, l) => h('div', { class: 'mm' }, svg(icon(ic), 'mi'), h('b', null, v), h('small', null, l));
  return h('a', { class: 'minidash', href: '#/progress', 'aria-label': 'افتح لوحة تقدّمي' },
    h('div', { class: 'mring sm', style: `--p:${D.avg}` }, h('b', null, `${AR(D.avg)}٪`)),
    h('div', { class: 'grow' }, h('div', { class: 'mt' }, 'لوحة تقدّمي', h('span', { class: 'chev' }, '‹')), svg(spark, 'spk'),
      h('div', { class: 'mms' }, m('flame', AR(D.streak), 'يوم'), m('check', AR(D.total), 'محاولة'), m('target', `${AR(D.acc)}٪`, 'دقة'))));
}
