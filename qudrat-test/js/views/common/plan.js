import { h, toast } from '../../core/dom.js';
import * as eng from '../../engine/engine.js';
import { tabbed } from '../../components/tabs.js';
import * as jr from '../../store/journey.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

export function planView() {
  const cur = eng.getCustom();
  const data = { week: cur.week.map((r) => ({ ...r })), wknd: cur.wknd.map((r) => ({ ...r })) };
  const root = h('div', { class: 'stack' });

  const MINS = [5, 8, 10, 12, 15, 20, 30, 45, 60, 90];
  const ampm = (t) => { const [hh, mm] = (t || '00:00').split(':').map(Number); return `${AR(((hh + 11) % 12) + 1)}:${AR(String(mm).padStart(2, '0'))} ${hh < 12 ? 'ص' : 'م'}`; };
  const block = (key, title, sub) => {
    const box = h('section', { class: 'plan-block' });
    const draw = () => {
      const total = data[key].reduce((a, r) => a + r.mins, 0);
      box.replaceChildren(
        h('div', { class: 'pb-head' }, h('div', null, h('h2', null, title), h('small', null, sub)), h('span', { class: 'pb-total' }, h('b', null, AR(total)), ' دقيقة')),
        ...data[key].map((r, i) => {
          const tshow = h('span', { class: 'sess-time-show' }, ampm(r.at));
          const mshow = h('b', null, AR(r.mins));
          const step = (d) => { let k = MINS.findIndex((m) => m >= r.mins); if (k < 0) k = MINS.length - 1; k = Math.max(0, Math.min(MINS.length - 1, k + d)); r.mins = MINS[k]; draw(); };
          return h('div', { class: 'sess', 'data-kind': r.kind },
            h('div', { class: 'sess-top' },
              h('label', { class: 'sess-time' }, tshow, h('input', { type: 'time', value: r.at, 'aria-label': 'وقت الجلسة', onChange: (e) => { r.at = e.target.value || r.at; tshow.textContent = ampm(r.at); } })),
              h('button', { class: 'sess-del', 'aria-label': 'حذف الجلسة', onClick: () => { data[key].splice(i, 1); draw(); } }, '×')),
            h('div', { class: 'sess-kinds', role: 'radiogroup', 'aria-label': 'نوع الجلسة' },
              Object.entries(eng.ROUND_KINDS).map(([k, v]) => h('button', { type: 'button', class: 'sess-kind', role: 'radio', 'aria-checked': r.kind === k ? 'true' : 'false', onClick: () => { r.kind = k; draw(); } }, v.t))),
            h('div', { class: 'sess-dur' }, h('span', null, 'المدة'),
              h('div', { class: 'stepper' },
                h('button', { type: 'button', 'aria-label': 'أقل', onClick: () => step(-1) }, '−'),
                h('span', { class: 'sv' }, mshow, ' د'),
                h('button', { type: 'button', 'aria-label': 'أكثر', onClick: () => step(1) }, '+'))));
        }),
        data[key].length < 8 ? h('button', { class: 'sess-add', onClick: () => { data[key].push({ at: '18:00', mins: 15, kind: 'new' }); draw(); } }, '+ إضافة جلسة') : null);
    };
    draw(); return box;
  };

  const actions = () => h('div', { class: 'row-wrap' },
    h('button', { class: 'btn primary', onClick: () => { eng.setCustom(data); toast('حُفظ جدولك'); location.hash = '#/'; } }, 'حفظ جدولي'),
    h('a', { class: 'btn ghost', href: '#/settings' }, 'رجوع'));
  const days = () => { const e = jr.journey().exam; if (!e) return null; const d = Math.ceil((new Date(e + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5); return d; };
  const cd = h('div', { class: 'exam-cd' });
  const paintCd = () => { const d = days(); cd.replaceChildren(d == null ? h('span', null, 'حدّد التاريخ ونرتّب لك المراحل') : d >= 0 ? h('span', null, h('b', null, AR(d)), d === 1 ? ' يوم متبقٍّ' : ' يوماً متبقياً') : h('span', null, 'التاريخ مضى، اختر موعداً جديداً')); };
  paintCd();
  const examBox = h('section', { class: 'plan-block exam-box' }, h('h2', null, 'تاريخ اختبارك'), cd,
    h('input', { type: 'date', class: 'exam-date', value: jr.journey().exam || '', 'aria-label': 'تاريخ الاختبار', onChange: (e) => { jr.setExam(e.target.value); paintCd(); toast('حُفظ التاريخ'); } }),
    h('small', { class: 'muted' }, 'نحسب منه أيام رحلتك ونغيّر مرحلتك تلقائياً: تأسيس ثم تدريب ثم مراجعة أخيرة.'));
  const weekBox = block('week', 'أيام الدراسة', 'من الأحد إلى الخميس'), wkndBox = block('wknd', 'الإجازة', 'الجمعة والسبت');
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
