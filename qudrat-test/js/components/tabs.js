import { h } from '../core/dom.js';

/**
 * تبويبات موحّدة لكل صفحة طويلة: شاشة واحدة بدل النزول الطويل.
 * tabbed({ key, tabs:[{ id, label, render: () => Node }], initial })
 *  - تبديل بحركة ناعمة (تلاشي + انزلاق خفيف) وتمرير الإصبع يميناً/يساراً بين التبويبات.
 *  - شريط التبويبات يتمرّر أفقياً إن كثرت، والتبويب النشط يتوسّط تلقائياً.
 *  - يتذكّر آخر تبويب لكل صفحة (key) خلال الجلسة. الاتجاه RTL: التمرير لليسار = التبويب التالي.
 */
export function tabbed({ key = '', tabs, initial = 0, wrap = true, sub = false }) {
  const sk = 'qd1tab:' + key;
  let cur = initial;
  try { const v = key && sessionStorage.getItem(sk); if (v != null && tabs[+v]) cur = +v; } catch { /* */ }
  const strip = h('div', { class: 'tb-strip' + (wrap ? ' tb-wrap' : '') + (sub ? ' tb-sub' : ''), role: 'tablist' });
  const pane = h('div', { class: 'tb-pane', role: 'tabpanel' });
  const root = h('div', { class: 'tb' }, strip, pane);
  let dir = 0;
  const cache = {};
  const show = (i, animate = true) => {
    dir = i === cur ? 0 : (i > cur ? 1 : -1);
    cur = i;
    try { if (key) sessionStorage.setItem(sk, String(i)); } catch { /* */ }
    [...strip.children].forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    const on = strip.children[i]; if (!wrap && on && on.scrollIntoView) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: animate ? 'smooth' : 'auto' });
    const t = tabs[i];
    const node = cache[t.id] || (cache[t.id] = (typeof t.render === 'function' ? t.render() : t.render));
    pane.replaceChildren(node);
    pane.classList.remove('in-next', 'in-prev'); void pane.offsetWidth;
    if (animate && dir) pane.classList.add(dir > 0 ? 'in-next' : 'in-prev');
    pane.scrollTop = 0;
  };
  tabs.forEach((t, i) => strip.append(h('button', { type: 'button', role: 'tab', class: 'tb-btn', onClick: () => show(i), onKeydown: (e) => { if (e.key === 'ArrowLeft') show(Math.min(tabs.length - 1, cur + 1)); if (e.key === 'ArrowRight') show(Math.max(0, cur - 1)); } }, t.label)));
  // swipe
  let x0 = null, y0 = 0;
  if (!wrap) pane.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  if (!wrap) pane.addEventListener('touchend', (e) => {
    if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (dx < 0 && cur < tabs.length - 1) show(cur + 1); else if (dx > 0 && cur > 0) show(cur - 1);
  }, { passive: true });
  show(cur, false);
  root.select = (id) => { const i = tabs.findIndex((t) => t.id === id); if (i >= 0) show(i); };
  return root;
}
