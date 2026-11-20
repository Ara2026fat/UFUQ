import { getPart } from '../../store/part.js';
import { h } from '../../core/dom.js';
import * as eng from '../../engine/engine.js';
import { loadLessons } from './uflesson.js';
import { tabbed } from '../../components/tabs.js';
import { loadAllBanks } from '../../store/bank.js';

const PARTS = [['quant', 'الكمي'], ['verbal', 'اللفظي'], ['ready', 'الجاهزية']];
const ring = (p) => `<svg viewBox="0 0 44 44" width="44" height="44"><circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" stroke-opacity=".15" stroke-width="4"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--teal,#0F6B78)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(113.1).toFixed(1)}" stroke-dashoffset="${(113.1 * (1 - p / 100)).toFixed(1)}" transform="rotate(-90 22 22)"/></svg>`;

/** خريطة المهارات: كل مهارة بإتقانها وحالتها، مرتبة بمراحل أُفق، والمتطلَّب السابق ظاهر. */
export function mapView() {
  const wrap = h('div', null, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  let ufHas = new Set();
  loadAllBanks().then(() => Promise.all([eng.loadGraph(), eng.loadErrFam()])).then(() => loadLessons()).then((L) => {
    ufHas = new Set(Object.keys(L.lessons || {}));
    const ov = eng.overview(), byId = Object.fromEntries(ov.map((x) => [x.id, x]));
    const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
    const row = (x) => h('div', { class: 'item' },
      h('span', { html: ring(x.pct), style: 'display:grid;place-items:center' }),
      h('div', { class: 'grow' }, h('div', { class: 't' }, x.name),
        h('small', { class: 'muted' }, x.status === 'new' ? 'لم تبدأ' : `${eng.masteryWord(x.pct)} — ${eng.STATUS_LABEL[x.status]}`,
          x.prereq && byId[x.prereq] ? ` — تحتاج: ${byId[x.prereq].name}` : '', x.due ? ` — ${x.due} للمراجعة` : '')),
      h('div', { class: 'row' }, ufHas.has(x.id) ? h('a', { class: 'btn sm ghost', href: `#/uf/${x.id}` }, 'درس') : null, h('a', { class: 'btn sm', href: `#/practice?mode=daily&skill=${x.id}` }, 'تدرّب')));
    // تبويب لكل مرحلة؛ المرحلة الطويلة تُقسَّم إلى أجزاء متساوية حتى لا يطول التبويب
    const CHUNK = 12, groups = [];
    PARTS.filter(([part]) => (part === 'verbal') === (getPart() === 'verbal')).forEach(([part]) => {
      const L = ov.filter((x) => x.part === part || (part === 'quant' && !['verbal', 'ready'].includes(x.part)));
      L.sort((a, b) => String(a.stage).localeCompare(String(b.stage)));
      const by = [];
      L.forEach((x) => { let g = by.find((k) => k.name === x.stageName); if (!g) by.push(g = { name: x.stageName || 'المهارات', items: [] }); g.items.push(x); });
      by.forEach((g) => {
        const n = Math.ceil(g.items.length / CHUNK), size = Math.ceil(g.items.length / n);
        for (let i = 0; i < n; i++) groups.push({ id: 'g' + groups.length, label: n > 1 ? `${g.name} ${AR(i + 1)}` : g.name, items: g.items.slice(i * size, (i + 1) * size) });
      });
    });
    const habits = eng.topHabits();
    const habitsCard = habits.length ? h('section', { class: 'card stack' }, h('h3', { style: 'margin:0' }, 'عادةٌ تستحق الانتباه'), ...habits.map((f) => h('div', null, h('b', null, f.t), h('p', { class: 'muted small', style: 'margin:4px 0 0' }, f.w)))) : null;
    const tabs = groups.map((g, i) => ({ id: g.id, label: g.label, render: () => h('div', { class: 'stack' }, i === 0 ? habitsCard : null, h('div', { class: 'list' }, g.items.map(row))) }));
    wrap.replaceChildren(h('div', { class: 'page-head' }, h('h1', null, 'خريطة مهاراتي'), h('p', null, 'الإتقان يحكمه الصواب أولاً، ثم الاستمرار عبر الأيام، ثم سعة ما حللتَه.')),
      tabs.length ? tabbed({ key: 'map', tabs }) : habitsCard);
  });
  return wrap;
}
