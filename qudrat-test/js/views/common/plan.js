import { h, toast } from '../../core/dom.js';
import * as eng from '../../engine/engine.js';
import { tabbed } from '../../components/tabs.js';
import * as jr from '../../store/journey.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

export function planView() {
  const cur = eng.getCustom();
  const data = { week: cur.week.map((r) => ({ ...r })), wknd: cur.wknd.map((r) => ({ ...r })) };
  const root = h('div', { class: 'stack' });

  const block = (key, title) => {
    const box = h('section', { class: 'card stack' });
    const draw = () => {
      box.replaceChildren(h('h2', null, title),
        ...data[key].map((r, i) => h('div', { class: 'set-row', style: 'display:grid;grid-template-columns:1.2fr 1.3fr .9fr auto;gap:6px;align-items:center' },
          h('input', { type: 'time', value: r.at, 'aria-label': 'الوقت', onChange: (e) => { r.at = e.target.value || r.at; } }),
          h('select', { 'aria-label': 'النوع', onChange: (e) => { r.kind = e.target.value; } },
            Object.entries(eng.ROUND_KINDS).map(([k, v]) => h('option', { value: k, selected: r.kind === k || null }, v.t))),
          h('select', { 'aria-label': 'المدة', onChange: (e) => { r.mins = +e.target.value; } },
            [5, 10, 15, 20, 30, 45, 60, 90].map((m) => h('option', { value: m, selected: r.mins === m || null }, `${AR(m)} د`))),
          h('button', { class: 'btn sm ghost', style: 'padding:6px 10px', 'aria-label': 'حذف', onClick: () => { data[key].splice(i, 1); draw(); } }, '✕'))),
        data[key].length < 8 ? h('button', { class: 'btn ghost', onClick: () => { data[key].push({ at: '18:00', mins: 15, kind: 'new' }); draw(); } }, '+ إضافة جلسة') : null,
        h('small', { class: 'muted' }, `المجموع: ${AR(data[key].reduce((a, r) => a + r.mins, 0))} دقيقة`));
    };
    draw(); return box;
  };

  const actions = () => h('div', { class: 'row-wrap' },
    h('button', { class: 'btn primary', onClick: () => { eng.setCustom(data); toast('حُفظ جدولك'); location.hash = '#/'; } }, 'حفظ جدولي'),
    h('a', { class: 'btn ghost', href: '#/settings' }, 'رجوع'));
  const examBox = h('section', { class: 'card stack' }, h('h2', null, 'تاريخ اختبارك'),
    h('input', { type: 'date', value: jr.journey().exam || '', 'aria-label': 'تاريخ الاختبار', onChange: (e) => { jr.setExam(e.target.value); toast('حُفظ التاريخ'); } }),
    h('small', { class: 'muted' }, 'نحسب منه أيام رحلتك ونغيّر مرحلتك تلقائياً (تأسيس ثم تدريب ثم مراجعة أخيرة).'));
  const weekBox = block('week', 'أيام الدراسة (الأحد – الخميس)'), wkndBox = block('wknd', 'الإجازة (الجمعة والسبت)');
  const pane = (box) => () => h('div', { class: 'stack' }, box, actions());

  root.append(
    h('h1', null, 'جدولي'),
    h('p', { class: 'muted' }, 'اختر كم مرة تتدرّب في اليوم، ومتى، وكم تدوم كل جلسة. الجلسات تظهر في الرئيسية وتقدر تقدّمها متى شئت.'),
    tabbed({ key: 'plan', tabs: [
      { id: 'exam', label: 'موعد الاختبار', render: pane(examBox) },
      { id: 'week', label: 'أيام الدراسة', render: pane(weekBox) },
      { id: 'wknd', label: 'الإجازة', render: pane(wkndBox) }] }));
  return root;
}
