import { staffOnly } from '../../core/staff.js';
import { isTrial, TRIAL, lockCard } from '../../core/trial.js';
import { h } from '../../core/dom.js';
import { SOLVED, ORDER } from '../../data/solved.js';
import { simItem } from './learn.js';
import { playFiles, speakSequence, ttsSupported } from '../../core/speech.js';

const RATE = 0.87;
export const hasSolved = (id) => !!SOLVED[id];
let MANIFEST = null;
const manifest = () => (MANIFEST ? Promise.resolve(MANIFEST) : fetch('audio/manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => (MANIFEST = m)));

export function solveView(ctx) {
  const id = ctx.params.id && SOLVED[ctx.params.id] ? ctx.params.id : ORDER[0];
  if (isTrial() && ORDER.indexOf(id) >= TRIAL.solved) return lockCard('هذه المسألة في الدورة الكاملة', 'في التجربة المجانية تُفتح مسألتان محلولتان بالشرح الكامل.', ['#/', 'الرئيسية']);
  const P = SOLVED[id]; const N = P.steps.length; let i = -1; let ctl = null; let files = null; let alive = true;
  manifest().then((m) => { files = m['solve-' + id] || null; });

  /* voice: a recording if it exists, otherwise the device's Arabic voice */
  const stopVoice = () => { try { ctl && ctl.stop(); } catch (e) { /* ignore */ } ctl = null; if (ttsSupported()) speechSynthesis.cancel(); };
  const voiceLines = [P.qv, ...P.steps.map((s) => s.voice), P.tipv];
  function speak(k, btn) {
    stopVoice(); if (btn) btn.textContent = 'إيقاف';
    const end = () => { if (btn) btn.textContent = 'استمع'; };
    const tts = () => { if (ttsSupported()) ctl = speakSequence([voiceLines[k]], { rate: 0.85, onEnd: end }); else end(); };
    if (files && files[k]) ctl = playFiles([files[k]], { rate: RATE, onEnd: end, onFail: tts }); else tts();
  }
  const listenBtn = (k) => { const b = h('button', { class: 'btn ghost sm', type: 'button' }, 'استمع'); b.onclick = () => (b.textContent.startsWith('إيقاف') ? (stopVoice(), (b.textContent = 'استمع')) : speak(k, b)); return b; };

  const fig = h('div', { class: 'figbox', html: P.fig });
  const parts = [...fig.querySelectorAll('[data-s]')];
  const showStage = (n) => parts.forEach((e) => e.classList.toggle('on', +e.dataset.s <= n));
  showStage(1);
  const list = h('div', { class: 'stack solve-steps' });
  const ctlBox = h('div', { class: 'row' });
  const bar = h('div', { class: 'solve-bar' });

  function next(auto = true) {
    i += 1; const S = P.steps[i];
    list.querySelectorAll('.sstep.cur').forEach((e) => e.classList.remove('cur'));
    showStage(S.st);
    const lb = listenBtn(i + 1);
    const el = h('div', { class: 'sstep cur' }, h('h3', null, h('span', { class: 'sn' }, `${i + 1}`), ' ', S.h, lb), h('p', { class: 'spoken' }, S.voice), simItem({ tokens: S.tokens, note: S.note }));
    list.append(el); bar.style.setProperty('--p', `${((i + 1) / N) * 100}%`);
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (auto) speak(i + 1, lb);
    const again = h('button', { class: 'btn ghost', type: 'button', onClick: () => { stopVoice(); i = -1; list.replaceChildren(); next(false); } }, 'من البداية');
    ctlBox.replaceChildren(h('button', { class: 'btn primary', type: 'button', onClick: i === N - 1 ? finalQ : () => next() }, i === N - 1 ? 'جرّب الإجابة' : 'الخطوة التالية'), again);
  }

  function finalQ() {
    stopVoice(); let done = false;
    const msg = h('p', { class: 'lead', 'aria-live': 'polite' }, 'ما هي الإجابة الصحيحة؟');
    const btns = P.options.map((o, k) => h('button', { class: 'btn opt', type: 'button', onClick: (e) => {
      if (done) return;
      if (k === P.answer) { done = true; e.target.classList.add('right'); msg.textContent = `صحيح، الجواب ${o}. ${P.tipv}`; speak(N + 1); }
      else { e.target.classList.add('wrong'); e.target.disabled = true; msg.textContent = P.traps[k] || 'ليست هذه الإجابة، راجع الخطوات وحاول مرة أخرى.'; }
    } }, `${'أبجد'[k]}) ${o}`));
    ctlBox.replaceChildren(h('div', { class: 'card stack' }, msg, h('div', { class: 'row' }, btns)));
  }

  const tabs = h('nav', { class: 'solve-tabs', 'aria-label': 'المسائل' }, ORDER.map((k, n) => h('a', { href: `#/solve/${k}`, class: k === id ? 'on' : '' }, `مسألة ${n + 1}`)));
  const qHead = h('div', { class: 'qhead' }, h('p', { class: 'lead' }, P.qv), listenBtn(0));
  next(false);
  const root = h('div', { class: 'solve' },
    h('div', { class: 'page-head' }, h('h1', null, P.title), staffOnly(h('span', { class: 'badge demo' }, 'مسألة تجريبية بانتظار اعتماد الأستاذ'))),
    tabs, h('div', { class: 'card stack' }, qHead, fig, bar), list, ctlBox);
  const mo = new MutationObserver(() => { if (alive && !root.isConnected) { alive = false; stopVoice(); mo.disconnect(); } });
  mo.observe(document.body, { childList: true, subtree: true });
  return root;
}
