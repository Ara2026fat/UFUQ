import { getPart } from '../../store/part.js';
import { h } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import { tabbed } from '../../components/tabs.js';
import { LOGO } from '../../core/icons.js';
import { videosOf } from './unit.js';
import { unitOpen, lockedChip } from '../../core/trial.js';
import { getUnits, listItems, loadShipped, unitStatus, STAGES } from '../../store/ustaz.js';

const STATUS = { new: ['جديد', 'new'], progress: ['قيد التعلّم', 'progress'], done: ['أتقنتُ', 'done'] };
const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const hasUstaz = (id) => { try { return STAGES.some((s) => (listItems(id, s) || []).length > 0); } catch (e) { return false; } };

/** «أتعلّم» — the foundation track: one card per unit, in curriculum order. */
export function learnHubView() {
  const root = h('div', { class: 'lt-hub' }, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  (async () => {
    let data = null;
    try { data = await getUnits(); await loadShipped(); } catch (e) { /* offline / missing */ }
    if (getPart() === 'verbal') { root.replaceChildren(h('header', { class: 'lt-hero' }, h('div', null, h('h1', null, 'أتعلّم'), h('p', null, 'تأسيس اللفظي سيُضاف بعد اعتماد الأستاذ لمحتواه.'))), h('a', { class: 'btn primary', href: '#/practice?mode=quick' }, 'تدرّب على اللفظي')); return; }
    const track = data && data.tracks && data.tracks[0];
    const ids = track ? track.units.filter((id) => data.units[id]) : [];
    const head = h('header', { class: 'lt-hero' },
      h('span', { class: 'lt-logo', html: LOGO }),
      h('div', null, h('h1', null, 'أتعلّم'), h('p', null, 'تأسيس القدرات الكمي خطوة خطوة: فكرة، قاعدة، مثال، ركن الأستاذ، ثم سؤال يتأكّد من فهمك.')));
    const note = h('aside', { class: 'lt-note', 'aria-label': 'تنبيه' },
      h('b', null, 'هنا تتعلّم فقط. '),
      'التمرين والاختبار قسمان منفصلان: ',
      h('a', { href: '#/practice?mode=quick' }, 'التدريب'), ' و', h('a', { href: '#/exam' }, 'المحاكاة'), '.');
    if (!ids.length) {
      root.replaceChildren(head, note, h('div', { class: 'empty' }, h('p', null, 'تعذّر تحميل وحدات التعلّم الآن. تحقق من الاتصال ثم أعد المحاولة.'),
        h('button', { class: 'btn', type: 'button', onClick: () => location.reload() }, 'إعادة المحاولة')));
      return;
    }
    const nv = ids.reduce((n, id) => n + videosOf(id).length, 0);
    const vban = nv ? h('a', { class: 'lt-vban', href: '#/ustaz-lessons' }, h('span', { class: 'lt-vic', 'aria-hidden': 'true' }, '🎬'),
      h('span', null, h('b', null, 'دروس الأستاذ المصوّرة'), h('small', null, `${AR(nv)} دروس — اضغط للمشاهدة`)), h('span', { class: 'lt-go', 'aria-hidden': 'true' }, '‹')) : null;
    const done = ids.filter((id) => unitStatus(id) === 'done').length;
    const cards = ids.map((id, i) => {
      const u = data.units[id]; const [label, cls] = STATUS[unitStatus(id)] || STATUS.new;
      const lk = !unitOpen(id);
      return h('li', null, h('a', { class: `lt-ucard ${cls}${lk ? ' locked' : ''}`, href: `#/unit/${id}` },
        h('span', { class: 'lt-num', 'aria-hidden': 'true' }, AR(i + 1)),
        h('span', { class: 'lt-utxt' },
          h('span', { class: 'lt-utitle', html: rich(u.title) }),
          h('span', { class: 'lt-badges' },
            lk ? lockedChip() : h('span', { class: `lt-chip ${cls}` }, label),
            (() => { const n = videosOf(id).length; return n ? h('span', { class: 'lt-chip ustaz' }, `🎬 ${AR(n)} ${n === 1 ? 'فيديو' : 'فيديوهات'} للأستاذ`) : hasUstaz(id) ? h('span', { class: 'lt-chip ustaz' }, 'فيه شرح الأستاذ') : null; })())),
        h('span', { class: 'lt-go', 'aria-hidden': 'true' }, '‹')));
    });
    // وحدات المسار في تبويبات متساوية (حتى ٦ وحدات لكل تبويب)
    const per = Math.ceil(ids.length / Math.ceil(ids.length / 6)), chunks = [];
    for (let a = 0; a < ids.length; a += per) chunks.push([a, Math.min(a + per, ids.length) - 1]);
    root.replaceChildren(head, vban,
      h('div', { class: 'lt-prog', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': ids.length, 'aria-valuenow': done, 'aria-label': 'تقدّمك في المسار' },
        h('i', { style: `width:${Math.round(done / ids.length * 100)}%` }), h('small', null, `أتقنتَ ${AR(done)} من ${AR(ids.length)}`)),
      tabbed({ key: 'learn-hub', tabs: chunks.map(([a, b], k) => ({ id: 'c' + k, label: a === b ? `الوحدة ${AR(a + 1)}` : `الوحدات ${AR(a + 1)}–${AR(b + 1)}`,
        render: () => h('div', { class: 'stack' }, h('h2', { class: 'lt-sec' }, track.title || 'المسار'), h('ol', { class: 'lt-list' }, cards.slice(a, b + 1))) })) }), note);
  })();
  return root;
}
