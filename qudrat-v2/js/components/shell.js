import { h } from '../core/dom.js';
import { icon, LOGO } from '../core/icons.js';
import { NAV, ROLES } from '../core/nav.js';
import { repo } from '../store/repo.js';
import { go } from '../core/router.js';
import { isStaff, lockStaff } from '../core/staff.js';

const brand = () => h('div', { class: 'brand' }, h('img', { class: 'logo-img', src: 'icons/logo-sm.png?v=4', alt: '', width: 62, height: 46 }),
  h('span', null, 'أفق قدرات كمي ولفظي'));

const link = (n, current) => {
  const active = n.exact ? current === n.to : current.startsWith(n.base || n.to.split('?')[0]);
  return h('a', { href: '#' + n.to, 'aria-current': active ? 'page' : null }, h('span', { html: icon(n.icon) }), h('span', null, n.label));
};

/** Builds the frame once; render(path) refreshes active state. Returns {el, view, render}. */
const BT = [
  { l: 'رحلتي', i: 'home', to: '/', m: (p) => p === '/' || p.startsWith('/progress') || p.startsWith('/map') || p.startsWith('/plan') },
  { l: 'أتعلّم', i: 'books', to: '/learn-hub', m: (p) => /^\/(learn-hub|topics|unit|ustaz-lessons|solve|courses)/.test(p) },
  { l: 'أتدرّب', i: 'bolt', to: '/practice?mode=quick', m: (p) => /^\/(practice|mistakes|ideas)/.test(p) },
  { l: 'أختبر', i: 'clipcheck', to: '/exam', m: (p) => p.startsWith('/exam') },
  { l: 'المزيد', i: 'list', to: '/more', m: (p) => /^\/(more|settings|help|report)/.test(p) },
];
export function createShell() {
  const role = () => repo.role();
  const sideNav = h('nav', { class: 'side-nav', 'aria-label': 'التنقل' });
  const tabbar = h('nav', { class: 'tabbar', 'aria-label': 'التنقل السفلي' });
  const dockIc = h('span', { class: 'dock-ic' }); dockIc.innerHTML = icon('grid');
  const sheetGrid = h('div', { class: 'sheet-grid' });
  const sheet = h('div', { class: 'sheet', onClick: (e) => { if (e.target === sheet) setOpen(false); } }, h('div', { class: 'sheet-panel', role: 'dialog', 'aria-label': 'القائمة' }, sheetGrid));
  const dock = h('button', { class: 'dock', 'aria-label': 'القائمة', 'aria-expanded': 'false', onClick: () => setOpen(!sheet.classList.contains('open')) }, dockIc);
  function setOpen(v) { sheet.classList.toggle('open', v); dock.setAttribute('aria-expanded', String(v)); dockIc.innerHTML = icon(v ? 'x' : 'grid'); }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  tabbar.append(sheet, dock);
  const btabs = h('nav', { class: 'btabs', 'aria-label': 'التنقل الرئيسي' });
  const view = h('main', { class: 'main', id: 'view', tabindex: '-1' });

  const picker = h('select', {
    class: 'role-pick', 'aria-label': 'تبديل الواجهة (عرض تجريبي)',
    onChange: (e) => { repo.setRole(e.target.value); go(ROLES[e.target.value].home); },
  }, Object.entries(ROLES).filter(([k]) => k !== 'admin').map(([k, v]) => h('option', { value: k }, v.label)));

  const el = h('div', { class: 'app' },
    h('aside', { class: 'side' }, brand(), sideNav,
      null),
    h('div', { class: 'col' },
      h('header', { class: 'top' }, h('a', { class: 'brand brand-top', href: '#/', 'aria-label': 'أفق قدرات كمي ولفظي' }, h('img', { class: 'logo-img', src: 'icons/logo-sm.png?v=4', alt: '', width: 68, height: 51 }), h('span', { class: 'brand-words' }, h('b', null, 'أفق'), h('small', null, 'قدرات كمي ولفظي'))), h('span', { class: 'spacer' }), h('span', { class: 'beta-pill', title: 'النسخة التجريبية' }, 'نسخة تجريبية'), h('a', { class: 'gear', href: '#/settings', 'aria-label': 'الإعدادات', title: 'الإعدادات' }, h('span', { html: icon('sliders') })), ),
      isStaff() ? h('div', { class: 'demo-bar' }, h('span', null, 'وضع الفريق'), picker, h('button', { class: 'btn ghost sm', onClick: () => { lockStaff(); location.hash = '#/'; location.reload(); } }, 'خروج')) : null,
      view),
    tabbar, btabs);

  function render(path) {
    const r = role();
    picker.value = r === 'admin' ? 'teacher' : r;
    const items = NAV[r];
    sideNav.replaceChildren(...items.map((n) => link(n, path)));
    const cur = (n) => (n.exact ? path === n.to : path.startsWith(n.base || n.to.split('?')[0]));
    sheetGrid.replaceChildren(...items.map((n, i) => {
      const ic = h('span', { class: 'ic' }); ic.innerHTML = icon(n.icon);
      return h('a', { class: `stile c${n.c || (i % 7) + 1}`, href: '#' + n.to, 'aria-current': cur(n) ? 'page' : null }, ic, h('b', null, n.label));
    }));
    setOpen(false);
    el.classList.toggle('has-btabs', r === 'student');
    btabs.replaceChildren(...BT.map((t) => h('a', { href: '#' + t.to, 'aria-current': t.m(path) ? 'page' : null }, h('span', { class: 'bt-ic', html: icon(t.i) }), h('span', { class: 'bt-l' }, t.l))));
  }
  return { el, view, render };
}
