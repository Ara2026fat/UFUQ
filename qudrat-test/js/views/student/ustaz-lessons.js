import { h } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import { isStaff } from '../../core/staff.js';
import { getUnits, loadShipped } from '../../store/ustaz.js';
import { tabbed } from '../../components/tabs.js';
import { itemNode, videosOf } from './unit.js';
import { unitOpen, lockCard } from '../../core/trial.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

/** عدد فيديوهات الأستاذ (للشارات في الرئيسية والمسار). */
export async function countVideos() {
  try { const d = await getUnits(); await loadShipped(); return Object.keys(d.units).reduce((n, id) => n + videosOf(id).length, 0); } catch (e) { return 0; }
}

/** «دروس الأستاذ المصوّرة» — كل فيديوهات الأستاذ في مكان واحد، مرتبة حسب الوحدة. */
export function ustazLessonsView() {
  const root = h('div', { class: 'lt-hub' }, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  const stop = () => root.querySelectorAll('video').forEach((m) => { try { m.pause(); } catch (e) { /* */ } });
  addEventListener('hashchange', stop, { once: true });
  (async () => {
    let data = null;
    try { data = await getUnits(); await loadShipped(); } catch (e) { /* */ }
    const ids = data ? ((data.tracks && data.tracks[0] && data.tracks[0].units) || Object.keys(data.units)).filter((id) => data.units[id]) : [];
    const groups = ids.map((id) => [id, videosOf(id)]).filter(([, v]) => v.length);
    const total = groups.reduce((n, [, v]) => n + v.length, 0);
    const head = h('header', { class: 'lt-hero' }, h('div', null, h('h1', null, '🎬 دروس الأستاذ المصوّرة'),
      h('p', null, total ? `${AR(total)} درس مشروح بالفيديو للأستاذ إبراهيم البربري، مرتّبة حسب الوحدة. اضغط على أي فيديو لمشاهدته.` : 'لم يُضف الأستاذ فيديوهات بعد.')));
    if (!groups.length) { root.replaceChildren(head, isStaff() ? h('a', { class: 'btn primary', href: '#/t/studio' }, 'افتح استوديو الأستاذ') : h('a', { class: 'btn', href: '#/learn-hub' }, 'العودة إلى أتعلّم')); return; }
    // تبويب لكل وحدة (تظهر كلها في شاشة واحدة)؛ الوحدة ذات الفيديوهات الكثيرة تُقسَّم لأجزاء بتبويبات فرعية
    const tabs = groups.map(([id, vids]) => {
      const plain = h('span', { html: rich(data.units[id].title) }).textContent.trim();
      const n = Math.ceil(vids.length / 3), size = Math.ceil(vids.length / n);
      const list = (i) => h('div', null, vids.slice(i * size, (i + 1) * size).map(itemNode));
      if (!unitOpen(id)) return { id, label: `🔒 ${plain} · ${AR(vids.length)}`, render: () => lockCard(`دروس «${plain}» في الدورة الكاملة`, `${AR(vids.length)} دروس مصوّرة للأستاذ في هذه الوحدة تُفتح مع الدورة الكاملة. المفتوح الآن: الكسور والنسب والنسبة المئوية.`, ['#/learn-hub', 'العودة إلى أتعلّم']) };
      return { id, label: `${plain} · ${AR(vids.length)}`, render: () => h('section', { class: 'lt-vgroup' },
        h('h2', { class: 'lt-sec' }, h('span', { html: rich(data.units[id].title) }), ' ', h('a', { class: 'lt-vlink', href: `#/unit/${id}?stage=corner` }, 'افتح الوحدة ‹')),
        n > 1 ? tabbed({ key: 'ustaz-lessons-' + id, wrap: true, sub: true, tabs: Array.from({ length: n }, (_, i) => ({ id: 'p' + i, label: `الدروس ${AR(i * size + 1)}–${AR(Math.min(vids.length, (i + 1) * size))}`, render: () => list(i) })) }) : list(0)) };
    });
    root.replaceChildren(head, tabbed({ key: 'ustaz-lessons', tabs, wrap: true }));
  })();
  return root;
}
