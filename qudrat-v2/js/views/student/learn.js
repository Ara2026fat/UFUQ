import { staffOnly } from '../../core/staff.js';
import { h } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import { playFiles } from '../../core/speech.js';
import { storage } from '../../store/storage.js';
import { QuestionCard, optionsOf, stepsList } from '../../components/question.js';
import { FULL, CHECKS, BOARD, sectionRanges } from '../../data/lessons-full.js';

const NS = 'http://www.w3.org/2000/svg';
function stripSvg(n, f) { // fraction strip: n equal parts, f filled, drawn one cell at a time
  const w = 40, svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${n * w + 4} 44`); svg.setAttribute('class', 'strip'); svg.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < n; i++) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', 2 + i * w); r.setAttribute('y', 4); r.setAttribute('width', w - 2); r.setAttribute('height', 36); r.setAttribute('rx', 5);
    r.setAttribute('class', i < f ? 'cell on' : 'cell'); r.style.animationDelay = `${i * 0.17}s`; svg.append(r);
  }
  return svg;
}

/* Step-by-step simulation of a method (simplify / multiply / cancel / divide).
 * tokens: {f:[num,den]} fraction | {t:'×'} operator | {s:'2'} plain | {br:true} line break.
 * Each token appears in turn (every 1s). Options: kn/kd = strike num/den (at `ka` s); flip = swap num/den and use `to` operator at `fa` s; hl = highlight result. */
export function simItem(it) {
  const wrap = h('div', { class: 'bw sim', 'aria-label': 'محاكاة طريقة الحل' });
  const line = h('div', { class: 'sline' }); wrap.append(h('span', { class: 'sim-tag' }, 'محاكاة'), line);
  let t = 0.2; let end = 0; let prevOp = null;
  const at = (el, d) => { el.style.animationDelay = `${d}s`; return el; };
  it.tokens.forEach((k) => {
    if (k.br) { line.append(h('span', { class: 'sbr' })); return; }
    let el;
    if (k.f) {
      el = h('span', { class: 'sfr' + (k.hl ? ' hl' : '') }, h('span', { class: 'n' }, k.f[0]), h('span', { class: 'l' }), h('span', { class: 'd' }, k.f[1]));
      if (k.kn) { const x = h('i', { class: 'strike' }); at(x, k.ka); el.querySelector('.n').append(x); }
      if (k.kd) { const x = h('i', { class: 'strike' }); at(x, k.ka); el.querySelector('.d').append(x); }
      if (k.flip) setTimeout(() => { if (!el.isConnected) return; el.classList.add('swap'); if (prevOp && prevOp.dataset.to) prevOp.textContent = prevOp.dataset.to; }, (k.fa) * 1000);
    } else if (k.t) { el = h('span', { class: 'sop' }, k.t); if (k.to) el.dataset.to = k.to; prevOp = el; }
    else { el = h('span', { class: 'sval' + (k.hl ? ' hl' : '') }, k.s); if (!/[\u0621-\u064A]/.test(k.s)) { el.setAttribute('dir', 'ltr'); el.style.unicodeBidi = 'isolate'; } }
    line.append(at(el, t)); end = t; t += 1;
  });
  if (it.note) wrap.append(at(h('div', { class: 'snote' }, it.note), end + 1.2));
  return wrap;
}
function boardItem(it) {
  if (it.k === 'sim') return simItem(it);
  if (it.k === 'bar') return h('div', { class: 'bw gauge' }, stripSvg(it.n, it.f));
  const mark = it.k === 'ok' ? '✓ ' : it.k === 'bad' ? '✗ ' : '';
  const el = h('div', { class: `bw ${it.k}` }, h('span', { class: 'pen' }, h('span', { class: 'ink', html: (mark ? `<b class="mk">${mark}</b>` : '') + rich(it.v) })));
  if (it.k === 't') el.append(h('i', { class: 'ul' }));
  return el;
}

const RATE = 0.87; // slower than recorded: ~13% (pitch preserved)
export const hasGuided = (id) => !!FULL[id];

/**
 * Guided lesson: the app leads. One section at a time ->
 *   listen -> "فهمت؟" -> (if yes) a one-question check -> continue.
 * A claim of understanding is not enough, so every section that has a check asks it.
 * Wrong answer: non-blaming note + simpler explanation + replay, one retry, then we move on and remember it.
 */
export function guidedView(ctx) {
  const id = ctx.params.id; const L = FULL[id];
  if (!L) return h('div', { class: 'empty' }, h('h2', null, 'لا يوجد درس موجَّه بهذا الاسم'), h('a', { class: 'btn primary', href: '#/topics' }, 'المواضيع'));

  const ranges = sectionRanges(L); const checks = CHECKS[id] || {}; const N = L.sections.length;
  const key = `learn:${id}`;
  const saved = storage.get(key, { i: 0, review: [] });
  const s = { i: Math.min(saved.i || 0, N), review: new Set(saved.review || []), files: null, ctl: null };
  const save = () => storage.set(key, { i: s.i, review: [...s.review] });

  const root = h('div', { class: 'learn' });
  const stop = () => { s.ctl?.stop(); s.ctl = null; };
  addEventListener('hashchange', stop, { once: true });
  fetch('audio/manifest.json').then((r) => (r.ok ? r.json() : null)).then((m) => { s.files = m && m[id]; }).catch(() => {});

  const head = (i) => h('div', { class: 'learn-head' },
    h('div', { class: 'steps-dots', role: 'progressbar', 'aria-valuenow': i, 'aria-valuemax': N, 'aria-label': `القسم ${i + 1} من ${N}` },
      L.sections.map((_, k) => h('i', { class: k < i ? 'done' : k === i ? 'cur' : '' }))),
    h('small', { class: 'muted', dir: 'ltr' }, `${Math.min(i + 1, N)} / ${N}`));

  /* ---------- start ---------- */
  function intro() {
    const resume = s.i > 0 && s.i < N;
    root.replaceChildren(
      h('div', { class: 'page-head' }, h('h1', null, L.title.replace(' (الدرس الكامل)', '')), staffOnly(h('span', { class: 'badge demo' }, 'مسودة بانتظار اعتماد الأستاذ'))),
      h('div', { class: 'card stack' },
        h('p', null, `سأشرح لك الدرس على ${N} أقسام قصيرة. بعد كل قسم أسألك: هل فهمت؟ ثم نتأكد بسؤال واحد، وبعده ننتقل.`),
        h('p', { class: 'muted small' }, 'تحتاج سماعة أو صوتاً مرتفعاً قليلاً.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onClick: () => { if (!resume) { s.i = 0; s.review.clear(); } section(); } }, resume ? `تابع من القسم ${s.i + 1}` : 'ابدأ الدرس'),
          resume ? h('button', { class: 'btn ghost', type: 'button', onClick: () => { s.i = 0; s.review.clear(); save(); section(); } }, 'ابدأ من أول الدرس') : null)));
  }

  /* ---------- one section ---------- */
  function section() {
    if (s.i >= N) return finish();
    stop(); save();
    const i = s.i; const sec = L.sections[i]; const [a, b] = ranges[i];
    const lines = sec.lines.map((t) => h('li', { class: 'seg' }, t));
    const mark = (k) => lines.forEach((e, j) => e.classList.toggle('now', j === k));
    const status = h('p', { class: 'caption', 'aria-live': 'polite' }, 'أشرح لك الآن…'); // shows the sentence being spoken
    const after = h('div', { class: 'stack' });

    const items = (BOARD[id]?.[i]) || [];
    const board = h('div', { class: 'board', 'aria-label': 'السبورة' }, h('span', { class: 'board-tag' }, 'سبورة مرسومة آلياً'));
    const reveal = (k) => items.filter((x) => x.at === k).forEach((x) => board.append(boardItem(x)));
    const card = h('div', { class: 'card learn-card' },
      h('h2', null, sec.h), items.length ? board : null, status,
      h('details', { class: 'fulltext' }, h('summary', null, 'النص كاملاً'), h('ol', { class: 'script plain' }, lines)), after);
    root.replaceChildren(head(i), card);

    function listen() {
      stop(); card.classList.remove('asking'); status.textContent = 'أشرح لك الآن…'; board.querySelectorAll('.bw').forEach((n) => n.remove());
      const done = () => { s.ctl = null; mark(-1); status.textContent = ''; ask(); };
      if (s.files?.length >= b) {
        s.ctl = playFiles(s.files.slice(a, b), { rate: RATE, gapMs: 450, onSegment: (k) => { mark(k); status.textContent = sec.lines[k]; reveal(k); board.scrollTo({ top: board.scrollHeight, behavior: 'smooth' }); }, onEnd: done, onFail: () => { s.ctl = null; items.forEach((x) => board.append(boardItem(x))); status.textContent = 'تعذّر تشغيل الصوت، اقرأ النص ثم تابع.'; ask(); } });
      } else { items.forEach((x) => board.append(boardItem(x))); status.textContent = 'لا يوجد صوت متاح، اقرأ النص ثم تابع.'; ask(); }
    }

    function ask() {
      after.replaceChildren(h('div', { class: 'ask-row' },
        h('h3', null, 'هل فهمت؟'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onClick: understood }, 'فهمت'),
          h('button', { class: 'btn', type: 'button', onClick: () => { s.review.add(i); save(); after.replaceChildren(); listen(); } }, 'لم أفهم، أعد الشرح'))));
    }

    function understood() {
      const q = checks[i];
      if (!q) return next();
      card.classList.add('asking');
      after.replaceChildren(h('p', { class: 'lead' }, 'ممتاز. دعنا نتأكد بسؤال واحد:'), check(q, 1));
    }

    function check(q, attempt) {
      const fb = h('div');
      const card = QuestionCard(q, { onPick: (p) => answer(p) });
      function answer(p) {
        const ok = p === q.answer;
        if (ok) {
          card.reveal(p);
          fb.replaceChildren(h('div', { class: 'fb ok' }, h('h3', null, attempt === 1 ? 'أحسنت، فهمتَ الفكرة' : 'أحسنت'),
            q.solution?.length ? h('details', null, h('summary', { class: 'small' }, 'كيف نحلّها؟'), stepsList(q.solution)) : null,
            h('div', { class: 'row', style: 'margin-top:10px' }, h('button', { class: 'btn primary', type: 'button', onClick: next }, i + 1 >= N ? 'إنهاء الدرس' : 'القسم التالي'))));
          return;
        }
        s.review.add(i); save();
        const opts = optionsOf(q); const trap = q.traps?.[p];
        if (attempt === 2) card.reveal(p);
        else { // first miss: lock the options and mark the pick, but do not give the answer away
          card.el.querySelectorAll('.opt').forEach((o) => { o.disabled = true; });
          card.el.querySelector(`.opt[data-i="${p}"]`)?.classList.add('is-wrong');
        }
        const box = h('div', { class: 'fb warn stack' },
          h('h3', null, attempt === 1 ? 'لنراجعها معاً' : 'لا بأس، سنكمل ونعود إليها'),
          trap ? h('div', { class: 'pending-note' }, h('b', null, 'قد يكون السبب: '), h('span', { html: rich(trap) })) : null,
          q.alt ? h('div', { class: 'alt' }, h('h4', null, q.alt.title), h('p', { style: 'margin:0', html: rich(q.alt.body) })) : null);
        if (attempt === 1) {
          box.append(h('div', { class: 'row' },
            h('button', { class: 'btn primary', type: 'button', onClick: () => { after.replaceChildren(h('p', { class: 'lead' }, 'حاول مرة أخرى:'), check(q, 2)); } }, 'حاول مرة ثانية'),
            h('button', { class: 'btn', type: 'button', onClick: () => { after.replaceChildren(); listen(); } }, 'أعد الشرح')));
        } else {
          box.append(h('p', { class: 'small', style: 'margin:0' }, 'الإجابة الصحيحة: ', h('b', { html: rich(opts[q.answer]) })),
            q.solution?.length ? stepsList(q.solution) : null,
            h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onClick: next }, i + 1 >= N ? 'إنهاء الدرس' : 'القسم التالي')));
        }
        fb.replaceChildren(box);
        fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return h('div', { class: 'stack' }, card.el, fb);
    }

    const next = () => { s.i = i + 1; section(); scrollTo(0, 0); };
    listen();
  }

  /* ---------- end ---------- */
  function finish() {
    stop(); s.i = N; save();
    const weak = [...s.review].sort((x, y) => x - y).map((k) => L.sections[k].h);
    root.replaceChildren(head(N), h('div', { class: 'card stack' },
      h('h1', null, 'أنهيتَ الدرس'),
      weak.length
        ? h('div', { class: 'pending-note' }, 'الأقسام التي تحتاج مراجعة: ', weak.join('، '), '.')
        : h('div', { class: 'fb ok' }, 'فهمتَ كل الأقسام من أول مرة.'),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: '#/practice?topic=frac' }, 'طبّق على أسئلة'),
        h('a', { class: 'btn', href: '#/practice?topic=frac&gen=1' }, 'أسئلة جديدة'),
        h('button', { class: 'btn ghost', type: 'button', onClick: () => { s.i = 0; s.review.clear(); save(); intro(); } }, 'أعد الدرس'))));
  }

  (s.i >= N ? finish : intro)();
  return root;
}
