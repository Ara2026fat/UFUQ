// شرح بصري يتحرّك مع خطوات الحل: شريط أجزاء متساوية للتقسيم بنسبة.
import { h } from '../core/dom.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const COL = ['var(--saffron)', 'var(--teal)', 'var(--cyan)', 'var(--mk-blue)'];
const NS = 'xmlns="http://www.w3.org/2000/svg"';

/** spec = { t:'parts', r:[..], u, give:['total'|'share', i], ask:['share'|'total'|'diff', i] } */
export function vizParts(spec) {
  const { r, u } = spec; const S = r.reduce((a, b) => a + b, 0);
  const W = 296, X0 = 12, Y = 46, H = 44, uw = W / S;
  const start = []; r.reduce((a, b, i) => ((start[i] = a), a + b), 0);
  const xr = (unit) => X0 + W - unit * uw;            // من اليمين لليسار
  const gx = (i) => xr(start[i] + r[i]); const gw = (i) => r[i] * uw;
  const val = (i) => r[i] * u;
  let s = `<svg viewBox="0 0 320 184" class="fig viz" role="img" direction="ltr" ${NS}><title>شريط أجزاء متساوية</title>`;
  // stage 1: groups
  r.forEach((n, i) => {
    s += `<g data-v="1" class="vg vg${i}"><rect x="${gx(i)}" y="${Y}" width="${gw(i)}" height="${H}" rx="${i === 0 || i === r.length - 1 ? 8 : 0}" fill="${COL[i]}" opacity=".9"/>`;
    for (let k = 1; k < n; k++) s += `<line x1="${gx(i) + k * uw}" x2="${gx(i) + k * uw}" y1="${Y}" y2="${Y + H}" stroke="var(--card)" stroke-width="2"/>`;
    s += `<text x="${gx(i) + gw(i) / 2}" y="${Y - 10}" text-anchor="middle" class="vt">${AR(n)} ${n === 1 ? 'جزء' : n === 2 ? 'جزءان' : n <= 10 ? 'أجزاء' : 'جزءاً'}</text></g>`;
  });
  s += `<line data-v="1" x1="${X0}" x2="${X0 + W}" y1="${Y}" y2="${Y}" stroke="var(--card)" stroke-width="2"/>`;
  // stage 2: given
  const [gk, gi] = spec.give;
  if (gk === 'total') s += `<g data-v="2" class="vb"><path d="M${X0} ${Y + H + 8} v8 h${W} v-8" fill="none" stroke="var(--ink)" stroke-width="2"/><text x="${X0 + W / 2}" y="${Y + H + 36}" text-anchor="middle" class="vt big">المجموع = ${AR(S * u)}</text></g>`;
  else s += `<g data-v="2" class="vb"><path d="M${gx(gi)} ${Y + H + 8} v8 h${gw(gi)} v-8" fill="none" stroke="var(--ink)" stroke-width="2"/><text x="${gx(gi) + gw(gi) / 2}" y="${Y + H + 36}" text-anchor="middle" class="vt big">${AR(val(gi))}</text></g>`;
  // stage 3: one unit
  if (S <= 14) for (let k = 0; k < S; k++) s += `<text data-v="3" x="${xr(k) - uw / 2}" y="${Y + H / 2 + 5}" text-anchor="middle" class="vt unit">${AR(u)}</text>`;
  s += `<text data-v="3" x="160" y="${Y + H + 58}" text-anchor="middle" class="vt note">الجزء الواحد = ${AR(u)}</text>`;
  // stage 4: ask
  const [ak, ai] = spec.ask;
  if (ak === 'share') s += `<g data-v="4"><rect x="${gx(ai)}" y="${Y - 2}" width="${gw(ai)}" height="${H + 4}" rx="9" fill="none" stroke="var(--ink)" stroke-width="3"/><text x="${gx(ai) + gw(ai) / 2}" y="${Y + H + 88}" text-anchor="middle" class="vt big ans">الجواب ${AR(val(ai))}</text></g>`;
  else if (ak === 'total') s += `<text data-v="4" x="160" y="${Y + H + 88}" text-anchor="middle" class="vt big ans">المجموع ${AR(S * u)}</text>`;
  else { const mx = r.indexOf(Math.max(...r)), mn = r.indexOf(Math.min(...r)); s += `<text data-v="4" x="160" y="${Y + H + 88}" text-anchor="middle" class="vt big ans">الفرق = ${AR(val(mx))} − ${AR(val(mn))} = ${AR(val(mx) - val(mn))}</text>`; }
  s += '</svg>';
  const el = h('div', { class: 'vizbox', html: s });
  const parts = [...el.querySelectorAll('[data-v]')];
  const set = (n) => parts.forEach((p) => p.classList.toggle('on', +p.dataset.v <= n));
  set(1);
  return { el, set, max: 4 };
}

const F = (n) => AR(String(+n.toFixed(4)).replace('.', '٫'));
const finish = (s) => {
  const el = h('div', { class: 'vizbox', html: s + '</svg>' });
  const parts = [...el.querySelectorAll('[data-v]')];
  const set = (n) => parts.forEach((p) => p.classList.toggle('on', +p.dataset.v <= n));
  set(1);
  return { el, set, max: 4 };
};

/** شبكة ١٠٠ خانة للنسبة المئوية: spec = { t:'pct', p, n, ask:'part'|'whole' } */
export function vizPct({ p, n, ask }) {
  const C = 15, GX = 140, GY = 12, part = (n * p) / 100, unit = n / 100;
  let s = `<svg viewBox="0 0 320 180" class="fig viz" role="img" direction="ltr" ${NS}><title>شبكة مئة خانة</title>`;
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10), col = i % 10, x = GX + 150 - (col + 1) * C, y = GY + row * C;
    const f = Math.max(0, Math.min(1, p - i));
    s += `<rect x="${x}" y="${y}" width="${C - 1}" height="${C - 1}" rx="2" fill="var(--card)" stroke="var(--line)"/>`;
    if (f > 0) s += `<rect data-v="3" x="${x + (C - 1) * (1 - f)}" y="${y}" width="${(C - 1) * f}" height="${C - 1}" rx="2" fill="var(--saffron)"/>`;
  }
  const T = (v, y, cls, txt) => `<text data-v="${v}" x="68" y="${y}" text-anchor="middle" class="vt ${cls}">${txt}</text>`;
  if (ask === 'part') {
    s += T(1, 40, 'big', `الكل = ${F(n)}`) + T(1, 60, 'note', '= ١٠٠ خانة');
    s += T(2, 92, 'note', `كل خانة = ${F(unit)}`);
    s += T(3, 120, '', `${F(p)}٪ = ${F(p)} خانة`) + T(4, 150, 'big ans', `الجواب ${F(part)}`);
  } else {
    s += T(1, 40, 'big', `${F(p)}٪ = ${F(part)}`) + T(1, 60, 'note', `= ${F(p)} خانة`);
    s += T(2, 92, 'note', `كل خانة = ${F(unit)}`);
    s += T(3, 120, '', 'الكل = ١٠٠ خانة') + T(4, 150, 'big ans', `الجواب ${F(n)}`);
  }
  return finish(s);
}

/** أعمدة تتساوى عند المتوسط: spec = { t:'avg', v:[..] } */
export function vizAvg({ v }) {
  const n = v.length, S = v.reduce((a, b) => a + b, 0), m = S / n, mx = Math.max(...v);
  const W = 296, X0 = 12, base = 96, hMax = 74, bw = Math.min(34, (W / n) * 0.62), gap = W / n;
  const hh = (x) => (x / mx) * hMax;
  let s = `<svg viewBox="0 0 320 170" class="fig viz" role="img" direction="ltr" ${NS}><title>أعمدة ومتوسطها</title>`;
  v.forEach((x, i) => {
    const cx = X0 + W - gap * (i + 0.5);
    s += `<g data-v="1"><rect x="${cx - bw / 2}" y="${base - hh(x)}" width="${bw}" height="${hh(x)}" rx="5" fill="var(--teal)" opacity=".9"/><text x="${cx}" y="${base + 14}" text-anchor="middle" class="vt">${F(x)}</text></g>`;
  });
  s += `<line x1="${X0}" x2="${X0 + W}" y1="${base}" y2="${base}" stroke="var(--ink-3)"/>`;
  s += `<text data-v="2" x="160" y="${base + 38}" text-anchor="middle" class="vt big">المجموع = ${F(S)}</text>`;
  s += `<text data-v="3" x="160" y="${base + 58}" text-anchor="middle" class="vt note">نقسم على عدد القيم ${F(n)}</text>`;
  s += `<line data-v="4" x1="${X0}" x2="${X0 + W}" y1="${base - hh(m)}" y2="${base - hh(m)}" stroke="var(--saffron)" stroke-width="3" stroke-dasharray="7 5"/>`;
  s += `<text data-v="4" x="${X0 + 4}" y="${base - hh(m) - 6}" class="vt big ans">المتوسط ${F(m)}</text>`;
  return finish(s);
}

export const vizFor = (q) => {
  const z = q && q.viz; if (!z) return null;
  return z.t === 'parts' ? vizParts(z) : z.t === 'pct' ? vizPct(z) : z.t === 'avg' ? vizAvg(z) : null;
};
