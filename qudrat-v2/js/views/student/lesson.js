import { staffOnly } from '../../core/staff.js';
import { h } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import { speakSequence, playFiles, ttsSupported, arabicVoice } from '../../core/speech.js';
import { LESSONS } from '../../data/lessons.js';
import { topicTitle } from '../../data/taxonomy.js';

export const hasLesson = (t) => !!LESSONS[t];

/** Voice lesson: short spoken segments, each highlighted while it plays. */
export function lessonView(ctx) {
  const t = ctx.params.topic; const L = LESSONS[t];
  if (!L) return h('div', { class: 'empty' }, h('h2', null, 'لا يوجد شرح صوتي لهذا الموضوع بعد'), h('a', { class: 'btn primary', href: '#/topics' }, 'المواضيع'));

  let ctl = null; let playing = false; let rate = 0.95;
  const segEls = L.script.map((s) => h('li', { class: 'seg' }, s));
  const btn = h('button', { class: 'btn primary', type: 'button' });
  const note = h('p', { class: 'pending-note', hidden: true });
  const audio = L.audio ? h('audio', { controls: true, src: L.audio, style: 'width:100%' }) : null;

  const mark = (i) => segEls.forEach((e, k) => e.classList.toggle('now', k === i));
  const setBtn = () => { btn.textContent = playing ? 'إيقاف' : 'استمع إلى الشرح'; };
  const stop = () => { ctl?.stop(); ctl = null; playing = false; mark(-1); setBtn(); };

  // Recorded audio (audio/manifest.json) wins over device text-to-speech when present.
  let files = null;
  fetch('audio/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { files = m && m[t]; }).catch(() => {});

  btn.onclick = () => {
    if (playing) return stop();
    if (files?.length) {
      playing = true; setBtn();
      ctl = playFiles(files, { rate: rate / 0.95, onSegment: mark, onEnd: stop, onFail: () => { files = null; stop(); btn.click(); } });
      return;
    }
    if (!ttsSupported()) { note.hidden = false; note.textContent = 'متصفحك لا يدعم القراءة الصوتية. يمكنك قراءة النص أدناه.'; return; }
    if (!arabicVoice()) { note.hidden = false; note.textContent = 'لم نجد صوتاً عربياً على جهازك، وقد يُقرأ النص بصوت آخر. سيُضاف تسجيل بصوت الأستاذ لاحقاً.'; }
    playing = true; setBtn();
    ctl = speakSequence(L.script, { rate, onSegment: mark, onEnd: stop });
  };
  setBtn();
  addEventListener('hashchange', stop, { once: true });

  const speed = h('select', { 'aria-label': 'سرعة القراءة', class: 'role-pick', onChange: (e) => { rate = +e.target.value; if (playing) { stop(); btn.click(); } } },
    [['0.8', 'بطيء'], ['0.95', 'عادي'], ['1.15', 'سريع']].map(([v, l]) => h('option', { value: v, selected: v === '0.95' ? '' : null }, l)));

  return h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('h1', null, L.title || topicTitle(t)), staffOnly(h('span', { class: 'badge demo' }, 'مسودة بانتظار اعتماد الأستاذ'))),
    h('div', { class: 'card stack' },
      audio || h('div', { class: 'row' }, btn, speed), note,
      L.rule ? h('div', { class: 'alt' }, h('h4', null, 'القاعدة'), h('div', { html: rich(L.rule) })) : null,
      L.example ? h('div', { class: 'alt' }, h('h4', null, 'مثال'), h('div', { html: rich(L.example.q) }), h('div', { style: 'margin-top:6px;font-weight:700', html: rich(L.example.a) })) : null,
      h('ol', { class: 'script' }, segEls)),
    h('div', { class: 'row' },
      h('a', { class: 'btn primary', href: `#/practice?topic=${t}` }, 'طبّق الآن'),
      h('a', { class: 'btn ghost', href: '#/topics' }, 'المواضيع')));
}
