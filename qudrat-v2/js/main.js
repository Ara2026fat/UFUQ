import { arabize } from './core/arabize.js';
import { createShell } from './components/shell.js';
import { route, parse, onRoute, setNotFound } from './core/router.js';
import { ROLES } from './core/nav.js';
import { repo } from './store/repo.js';
import { h } from './core/dom.js';
import { lessonView } from './views/student/lesson.js';
import { guidedView } from './views/student/learn.js';
import { solveView } from './views/student/solve.js';

import { homeView } from './views/student/home.js';
import { moreView } from './views/student/more.js';
import { topicsView } from './views/student/topics.js';
import { practiceView } from './views/student/practice.js';
import { mistakesView } from './views/student/mistakes.js';
import { ufLessonView, ideasView } from './views/student/uflesson.js';
import { examView } from './views/student/exam.js';
import { parentView } from './views/student/parent.js';
import { mapView } from './views/student/map.js';
import { progressView } from './views/student/progress.js';
import { teacherDashboard } from './views/teacher/dashboard.js';
import { contentView } from './views/teacher/content.js';
import { editorView } from './views/teacher/editor.js';
import { learnHubView } from './views/student/learn-hub.js';
import { ustazLessonsView } from './views/student/ustaz-lessons.js';
import { unitView } from './views/student/unit.js';
import { studioView } from './views/teacher/ustaz-studio.js';
import { liveView } from './views/teacher/live-session.js';
import { isStaff, unlockStaff } from './core/staff.js';
import { isTrial, lockCard } from './core/trial.js';
import { go } from './core/router.js';
import { libraryView } from './views/teacher/library.js';
import { planView } from './views/common/plan.js';
import { coursesView, courseView } from './views/student/courses.js';
import { settingsView, privacyView, termsView, helpView, applyPrefs } from './views/common/settings.js';
import { adminOverview, adminUsers, adminData } from './views/admin/admin.js';
import { LAUNCH_AT } from './core/config.js';
import { needsRegistration, showRegistration, verifySession } from './core/auth.js';
// يمنع ظهور كلمة null/undefined/false كنص عند تمرير قيم فارغة إلى append وreplaceChildren
for (const P of [Element.prototype, DocumentFragment.prototype]) for (const fn of ['append', 'prepend', 'replaceChildren']) { const o = P[fn]; P[fn] = function (...a) { return o.apply(this, a.filter((x) => x != null && x !== false)); }; }

// Route table = the navigation map (see docs/02-architecture.md)
const R = {
  student: ['/', '/topics', '/practice', '/mistakes', '/progress'],
  teacher: ['/t', '/t/content', '/t/new', '/t/edit/:id'],
  admin: ['/a', '/a/users', '/a/data'],
};
route('/', homeView); route('/more', moreView); route('/topics', topicsView); route('/practice', practiceView);
route('/lesson/:topic', lessonView); route('/learn/:id', guidedView); route('/solve', solveView); route('/solve/:id', solveView); route('/mistakes', mistakesView); route('/progress', progressView); route('/map', mapView); route('/parent', parentView); route('/exam', examView); route('/uf/:skill', ufLessonView); route('/ideas', ideasView);
route('/learn-hub', learnHubView); route('/ustaz-lessons', ustazLessonsView); route('/unit/:id', unitView); route('/t/live', liveView); route('/t/studio', studioView); route('/t/studio/:id', studioView);
route('/t', teacherDashboard); route('/t/content', contentView); route('/t/new', editorView); route('/t/edit/:id', editorView);
route('/t/library', libraryView); route('/a', adminOverview); route('/a/users', adminUsers); route('/a/data', adminData);
route('/courses', coursesView); route('/course/:id', courseView); route('/settings', settingsView); route('/plan', planView); route('/privacy', privacyView); route('/terms', termsView); route('/help', helpView);
route('/staff', () => {
  const err = h('p', { class: 'muted small', role: 'alert' });
  const inp = h('input', { inputmode: 'numeric', autocomplete: 'off', maxlength: 12, 'aria-label': 'رمز الفريق', type: 'password', placeholder: '••••', style: 'direction:ltr;text-align:center;font-size:1.4rem;letter-spacing:.35em;width:100%;max-width:320px;align-self:center;min-height:54px;border:1.5px solid var(--line);background:var(--card);border-radius:14px;padding:8px 14px;box-sizing:border-box' });
  return h('div', { class: 'card stack', style: 'max-width:420px;margin:24px auto;text-align:center' }, h('h2', null, 'دخول الفريق'), h('p', { class: 'muted' }, 'للأستاذ والإدارة فقط.'), inp, err,
    h('button', { class: 'btn primary', onClick: async () => { if (await unlockStaff(inp.value)) { location.hash = '#/t'; location.reload(); } else err.textContent = 'الرمز غير صحيح'; } }, 'دخول'));
});
setNotFound(() => h('div', { class: 'empty' }, h('h2', null, 'الصفحة غير موجودة'), h('a', { class: 'btn primary', href: '#/' }, 'الرئيسية')));

const shell = createShell();
document.getElementById('app').replaceChildren(shell.el);
applyPrefs();
shell.view.append(h('footer', { class: 'foot' }, h('div', { class: 'foot-links' }, h('a', { href: '#/help' }, 'المساعدة'), h('a', { href: '#/privacy' }, 'الخصوصية'), h('a', { href: '#/terms' }, 'الشروط'), h('a', { href: '#/settings' }, 'الإعدادات'), isStaff() ? null : h('a', { href: '#/staff' }, 'دخول الفريق'))));

function render() {
  const ctx = parse();
  // keep each role inside its own area
  const role = repo.role();
  if (!isStaff() && (ctx.path === '/t' || ctx.path.startsWith('/t/') || ctx.path === '/a' || ctx.path.startsWith('/a/'))) { go('/staff'); return; }
  const under = (p) => ctx.path === p || ctx.path.startsWith(p + '/');
  const area = under('/t') ? 'teacher' : under('/a') ? 'admin' : 'student';
  const common = ['/settings', '/privacy', '/terms', '/help', '/staff'].includes(ctx.path);
  if (!common && area !== role && ctx.view) { repo.setRole(area); }
  document.body.classList.toggle('learn-mode', ctx.path.startsWith('/learn/')); // focus layout: whole step on one screen
  const pure = ctx.path.startsWith('/learn/') || ctx.path.startsWith('/solve') || (ctx.path === '/practice' && !isStaff()); // clean focus page: no tab bar, header, icons or install bar
  document.body.classList.toggle('pure-mode', pure);
  let ex = document.getElementById('pure-exit');
  if (pure && !ex) { ex = document.createElement('a'); ex.id = 'pure-exit'; ex.href = '#/'; ex.textContent = 'خروج'; document.body.append(ex); }
  if (ex) { ex.hidden = !pure; ex.href = ctx.path === '/practice' ? '#/' : '#/topics'; }
  { const P = ctx.path; document.body.dataset.page = P === '/' ? 'journey' : /^\/(learn-hub|unit|topics|ustaz-lessons|courses?|lesson|learn)/.test(P) ? 'learn' : /^\/(practice|mistakes|ideas|solve)/.test(P) ? 'train' : P.startsWith('/exam') ? 'exam' : /^\/(more|settings|help|privacy|terms|plan|progress|map)/.test(P) ? 'more' : 'other'; }
  shell.render(ctx.path);
  // سياج التجربة المجانية: الطالب التجريبي يبقى داخل مساره (الرئيسية، أتعلّم بوحداتها المفتوحة، التدريب، المحاكاة المصغّرة، أخطائي، تقدّمي، المزيد)
  const FENCED = ['/topics', '/map', '/courses', '/course', '/lesson', '/ideas', '/parent'];
  const fenced = isTrial() && FENCED.some((f) => under(f));
  const node = fenced ? lockCard('هذا القسم في الدورة الكاملة', 'في التجربة المجانية مسارك: أتعلّم (ثلاث وحدات)، وثلاث جلسات تدريب يومياً، والمحاكاة المصغّرة.', ['#/learn-hub', 'العودة إلى أتعلّم']) : ctx.view(ctx);
  const foot = shell.view.querySelector('.foot');
  shell.view.replaceChildren(node, foot);
  shell.view.focus({ preventScroll: true });
  scrollTo(0, 0);
  document.title = 'أفق قدرات كمي ولفظي';
}
const boot = () => { onRoute(render); render(); verifySession(); };
const soon = () => {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;background:linear-gradient(#fff6d6,#e8f0ff);color:#14234A;font-family:Tajawal,system-ui,sans-serif';
  const left = Math.max(1, Math.ceil((new Date(LAUNCH_AT) - Date.now()) / 864e5));
  d.innerHTML = '<img src="icons/icon-192.png" alt="أفق" width="120" height="120" style="border-radius:28px"><h1 style="margin:0;font-size:26px">أفق قدرات كمي ولفظي</h1><p style="margin:0;font-size:19px;font-weight:700">يُفتح التطبيق الجمعة ٢٠ نوفمبر</p><p style="margin:0;font-size:15px;opacity:.8">بإشراف الأستاذ إبراهيم البربري<br>نراك قريباً، ونحن نجهّز لك كل شيء</p>';
  document.body.replaceChildren(d);
};
if (Date.now() < new Date(LAUNCH_AT) && !isStaff() && !location.hash.startsWith('#/staff')) soon();
else if (needsRegistration()) showRegistration().then(boot); else boot();

import { initInstall } from './core/install.js';
initInstall();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
arabize();
