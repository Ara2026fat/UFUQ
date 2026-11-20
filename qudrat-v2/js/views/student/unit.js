import { h } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import { isStaff } from '../../core/staff.js';
import { getUnits, listItems, loadShipped, mediaURL, markStage, setChecked, STAGES } from '../../store/ustaz.js';
import { unitOpen, lockCard } from '../../core/trial.js';

const ORDER = ['idea', 'rule', 'example', 'corner', 'check'];
const LABEL = { idea: 'الفكرة', rule: 'القاعدة', example: 'مثال', corner: 'ركن الأستاذ', check: 'تأكّد' };
const USTAZ = 'الأستاذ إبراهيم البربري';
const LET = ['أ', 'ب', 'ج', 'د', 'هـ'];
const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const mark = (t) => rich(t).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');
const para = (t, cls) => h('div', { class: `lt-p ${cls || ''}`, html: mark(t) });

/** One Ustaz item (video/audio/image/text), always labelled with his name. */
export function itemNode(it) {
  const box = h('figure', { class: `lt-item ${it.type}` });
  if (it.title) box.append(h('figcaption', null, it.title));
  if (it.type === 'text') box.append(h('p', { class: 'lt-itext' }, it.text || ''));
  else {
    const slot = h('div', { class: 'lt-slot' }, h('small', { class: 'muted' }, 'جارٍ التحميل…'));
    box.append(slot);
    mediaURL(it).then((src) => {
      if (!src) { slot.replaceChildren(h('small', { class: 'muted' }, 'تعذّر تحميل الملف')); return; }
      const m = it.type === 'video' ? h('video', { controls: true, playsinline: true, preload: 'metadata', src, poster: it.poster || null })
        : it.type === 'audio' ? h('audio', { controls: true, preload: 'metadata', src })
          : h('img', { src, alt: it.title || 'صورة من الأستاذ', loading: 'lazy' });
      slot.replaceChildren(m);
    }).catch(() => slot.replaceChildren(h('small', { class: 'muted' }, 'تعذّر تحميل الملف')));
  }
  box.append(h('span', { class: 'lt-by' }, USTAZ));
  return box;
}

export const videosOf = (unitId) => STAGES.flatMap((st) => (listItems(unitId, st) || []).filter((it) => it.type === 'video').map((it) => ({ ...it, stage: st })));

function emptyBox(unitId, big) {
  return h('div', { class: `lt-empty${big ? ' big' : ''}`, role: 'note' },
    h('b', null, 'شرح الأستاذ سيظهر هنا'),
    h('small', null, big ? 'لم يضف الأستاذ محتوى لهذه الوحدة بعد. يمكنك المتابعة بشرح أفق.' : 'لم يُضَف بعد.'),
    isStaff() ? h('a', { class: 'btn sm', href: `#/t/studio/${unitId}` }, 'افتح الاستوديو لإضافته') : null);
}

function ustazBlock(unitId, stage) {
  const items = listItems(unitId, stage) || [];
  return h('section', { class: 'lt-ustaz', 'aria-label': 'ركن الأستاذ' },
    h('h3', null, 'ركن الأستاذ ', h('small', null, USTAZ)),
    items.length ? items.map(itemNode) : emptyBox(unitId, false));
}

export function unitView(ctx) {
  const id = ctx.params.id;
  if (!unitOpen(id)) return lockCard('هذه الوحدة في الدورة الكاملة', 'في التجربة المجانية تتعلّم ثلاث وحدات كاملة: الكسور والنسب والنسبة المئوية.', ['#/learn-hub', 'العودة إلى أتعلّم']);
  const root = h('div', { class: 'lt-unit' }, h('p', { class: 'muted' }, 'جارٍ التحميل…'));
  const stopMedia = () => root.querySelectorAll('video,audio').forEach((m) => { try { m.pause(); } catch (e) { /* */ } });
  addEventListener('hashchange', stopMedia, { once: true });
  addEventListener('pagehide', stopMedia, { once: true });

  (async () => {
    let data = null;
    try { data = await getUnits(); await loadShipped(); } catch (e) { /* */ }
    const u = data && data.units && data.units[id];
    if (!u) { root.replaceChildren(h('div', { class: 'empty' }, h('h2', null, 'لا توجد وحدة بهذا الاسم'), h('a', { class: 'btn primary', href: '#/learn-hub' }, 'العودة إلى أتعلّم'))); return; }
    const list = (data.tracks && data.tracks[0] && data.tracks[0].units) || Object.keys(data.units);
    const next = data.units[list[list.indexOf(id) + 1]] || null;
    const stage = ORDER.includes(ctx.query && ctx.query.stage) ? ctx.query.stage : 'idea';
    const si = ORDER.indexOf(stage);
    try { markStage(id, stage); } catch (e) { /* */ }
    const go = (s) => `#/unit/${id}?stage=${s}`;

    const bar = h('nav', { class: 'lt-steps', 'aria-label': 'مراحل الوحدة' }, h('ol', null, ORDER.map((s, i) =>
      h('li', { class: i < si ? 'past' : i === si ? 'cur' : '' }, h('a', { href: go(s), 'aria-current': i === si ? 'step' : null, 'aria-label': `${AR(i + 1)}: ${LABEL[s]}` },
        h('i', null), h('span', null, LABEL[s]))))));
    const head = h('header', { class: 'lt-uhead' },
      h('a', { class: 'lt-back', href: '#/learn-hub' }, '› أتعلّم'),
      h('h1', { html: rich(u.title) }),
      u.status === 'ufuq-draft' ? h('span', { class: 'lt-draft' }, 'شرح أفق — قيد مراجعة الأستاذ') : null);

    const nvid = videosOf(id).length;
    const vhint = nvid && stage !== 'corner' ? h('a', { class: 'lt-vhint', href: go('corner') }, '🎬', h('span', null, `للأستاذ ${AR(nvid)} ${nvid === 1 ? 'فيديو' : 'فيديوهات'} تشرح هذه الوحدة — شاهدها في «ركن الأستاذ»`), h('span', { 'aria-hidden': 'true' }, '‹')) : null;
    const body = h('section', { class: `lt-stage s-${stage}`, 'aria-live': 'polite' });
    const nav = (prev, nxt) => h('div', { class: 'lt-nav' },
      prev ? h('a', { class: 'btn', href: go(prev) }, 'السابق') : h('span'),
      nxt ? h('a', { class: 'btn primary', href: go(nxt) }, nxt === 'check' ? 'إلى سؤال التأكّد' : 'التالي') : null);
    const prev = ORDER[si - 1]; const nxt = ORDER[si + 1];

    if (stage === 'idea') {
      body.append(h('h2', null, u.idea?.title || 'الفكرة'), para(u.idea?.body || '', 'lead'), ustazBlock(id, 'idea'), nav(null, 'rule'));
    } else if (stage === 'rule') {
      body.append(h('div', { class: 'lt-rule' }, h('span', { class: 'lt-tag' }, 'القاعدة'), h('h2', null, u.rule?.title || 'القاعدة'), para(u.rule?.body || ''),
        u.rule?.trap ? h('div', { class: 'lt-trap' }, h('b', null, 'انتبه للفخّ: '), h('span', { html: mark(u.rule.trap) })) : null),
        ustazBlock(id, 'rule'), nav(prev, nxt));
    } else if (stage === 'example') {
      const ex = u.example || { steps: [] }; const steps = ex.steps || []; let shown = 0;
      const ol = h('ol', { class: 'lt-steps-ex' });
      const ans = h('div', { class: 'lt-answer', hidden: true }, h('b', null, 'الناتج: '), h('span', { html: mark(ex.answer || '') }));
      const btn = h('button', { class: 'btn primary block', type: 'button' }, 'أرني الخطوة الأولى');
      btn.addEventListener('click', () => {
        if (shown < steps.length) {
          const li = h('li', { html: mark(steps[shown]) }); ol.append(li); shown++;
          li.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
        }
        if (shown >= steps.length) { ans.hidden = false; btn.hidden = true; } else btn.textContent = `الخطوة التالية (${AR(shown + 1)} من ${AR(steps.length)})`;
      });
      body.append(h('h2', null, 'مثال محلول'), h('div', { class: 'lt-prompt' }, para(ex.prompt || '')), ol, steps.length ? btn : null, ans,
        ustazBlock(id, 'example'), nav(prev, nxt));
      if (!steps.length) ans.hidden = false;
    } else if (stage === 'corner') {
      const own = listItems(id, 'corner') || [];
      const others = STAGES.filter((s) => s !== 'corner').map((s) => [s, listItems(id, s) || []]).filter(([, a]) => a.length);
      body.append(h('div', { class: 'lt-corner' }, h('h2', null, 'ركن الأستاذ'), h('p', { class: 'by' }, USTAZ),
        own.length ? own.map(itemNode) : emptyBox(id, true),
        others.length ? h('div', { class: 'lt-gallery' }, h('h3', null, 'من شروحات الأستاذ في المراحل الأخرى'),
          others.map(([s, a]) => h('div', { class: 'lt-gal-grp' }, h('h4', null, LABEL[s]), a.map(itemNode)))) : null),
        nav(prev, nxt));
    } else {
      const qs = u.checks || []; let qi = 0; let allOk = true;
      const box = h('div', { class: 'lt-check' });
      const render = () => {
        const q = qs[qi];
        if (!q) { box.replaceChildren(h('p', { class: 'lead' }, 'لا توجد أسئلة تأكّد لهذه الوحدة بعد.'), finish(false)); return; }
        const fb = h('div', { class: 'lt-fb', 'aria-live': 'polite' });
        const opts = h('div', { class: 'lt-opts', role: 'group' }, q.options.map((o, i) => h('button', { type: 'button', class: 'opt', 'data-i': i },
          h('span', { class: 'ltr-letter' }, LET[i]), h('span', { html: rich(o) }))));
        opts.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
          const i = +b.dataset.i; const ok = i === q.answer;
          opts.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          b.classList.add(ok ? 'is-correct' : 'is-wrong');
          if (ok) {
            fb.className = 'lt-fb ok';
            fb.replaceChildren(h('b', null, 'أحسنت! '), h('span', { html: mark(q.why || '') }), step(true));
          } else {
            allOk = false; try { setChecked(false); } catch (e) { /* */ }
            fb.className = 'lt-fb bad';
            fb.replaceChildren(h('b', null, 'ليست هذه. '), u.rule?.trap ? h('p', { html: mark(u.rule.trap) }) : null, q.why ? h('p', { html: mark(q.why) }) : null,
              h('div', { class: 'lt-row' }, h('a', { class: 'btn', href: go('rule') }, 'ارجع إلى القاعدة'),
                h('button', { class: 'btn primary', type: 'button', onClick: render }, 'جرّب مرة أخرى')));
          }
        }));
        box.replaceChildren(...[qs.length > 1 ? h('small', { class: 'muted' }, `السؤال ${AR(qi + 1)} من ${AR(qs.length)}`) : null, h('div', { class: 'lt-q', html: mark(q.stem) }), opts, fb].filter(Boolean));
      };
      const step = () => {
        if (qi + 1 < qs.length) return h('button', { class: 'btn primary block', type: 'button', onClick: () => { qi++; render(); } }, 'السؤال التالي');
        return finish(true);
      };
      const finish = (ok) => {
        if (ok) { try { setChecked(true); } catch (e) { /* */ } }
        const sk = u.practice?.skill || u.skill;
        return h('div', { class: 'lt-cta' },
          ok ? h('p', { class: 'lead' }, 'أتممتَ التأكّد. الآن ثبّت الفكرة بالتدريب.') : null,
          // real practice.js params: mode=daily forces the given skill (quick mode ignores `skill`)
          h('a', { class: 'btn primary block', href: `#/practice?mode=daily&skill=${encodeURIComponent(sk)}` }, 'إلى التدريب الموجّه'),
          next ? h('a', { class: 'btn block', href: `#/unit/${next.id}` }, `الوحدة التالية: ${next.title}`) : h('a', { class: 'btn block', href: '#/learn-hub' }, 'العودة إلى أتعلّم'));
      };
      body.append(h('h2', null, 'تأكّد من فهمك'), box, nav(prev, null));
      render();
    }
    root.replaceChildren(head, bar, vhint, body);
    scrollTo?.(0, 0);
  })();
  return root;
}
