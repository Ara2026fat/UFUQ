import { h } from '../core/dom.js';
import { playFiles } from '../core/speech.js';

let MANIFEST = null;
const manifest = () => (MANIFEST ? Promise.resolve(MANIFEST) : fetch('audio/manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => (MANIFEST = m)));
let current = null;

/** Small "listen" button; stays hidden unless audio/q-<id>/<part>.mp3 exists in the manifest. part: 0 = question, 1 = solution */
export function listenBtn(qid, part, label) {
  const b = h('button', { class: 'btn sm ghost listen', type: 'button', hidden: true }, '🔊 ' + label);
  manifest().then((m) => {
    const url = (m['q-' + qid] || [])[part];
    b.hidden = false;
    if (!url) { b.disabled = true; b.classList.add('later'); b.textContent = '🔊 ' + label + ' — لاحقاً'; b.title = 'الصوت لم يُدشَّن بعد'; return; }
    b.onclick = () => {
      if (current) { current.ctl.stop(); current.btn.textContent = current.text; const same = current.btn === b; current = null; if (same) return; }
      b.textContent = '⏹ إيقاف'; 
      const ctl = playFiles([url], { onEnd: () => { b.textContent = '🔊 ' + label; current = null; }, onFail: () => { b.textContent = '🔊 ' + label; current = null; } });
      current = { ctl, btn: b, text: '🔊 ' + label };
    };
  });
  return b;
}
