import { h } from '../../core/dom.js';
import { rich } from '../../core/math.js';
import { repo } from '../../store/repo.js';
import { STATUS, topicTitle } from '../../data/taxonomy.js';
import { icon } from '../../core/icons.js';
import { LIB_FILES } from '../../data/library.js';
import { API_BASE } from '../../core/config.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const tile = (to, ic, label, sub, c) => { const i = h('span', { class: 'ic' }); i.innerHTML = icon(ic); return h('a', { class: `qt c${c}`, href: to }, i, h('b', null, label), sub ? h('small', null, sub) : null); };

const plain = (q) => (q.type === 'compare' ? `قارن: ${q.a} ، ${q.b}` : q.stem);

export function teacherDashboard() {
  const qs = repo.questions().filter((q) => !q.twinOnly);
  const by = (s) => qs.filter((q) => q.status === s).length;
  const flags = repo.flags().map((f) => ({ ...f, q: repo.get(f.qid) })).filter((f) => f.q);
  const missed = repo.mostMissed(5);
  const queue = qs.filter((q) => ['review', 'draft'].includes(q.status));

  const regs = h('small', null, '');
  try { const t = localStorage.getItem('qk_adm'); if (t) fetch(API_BASE + '/api/admin/students?limit=1', { headers: { Authorization: 'Bearer ' + t } }).then((r) => (r.ok ? r.json() : null)).then((d) => { const n = d && (d.total ?? d.count ?? (d.students || d.items || []).length); if (n != null) regs.textContent = `${AR(n)} مسجّل`; }).catch(() => {}); } catch (e) { /* */ }
  const regTile = tile('#/a/users', 'users', 'المسجّلون', null, 3); regTile.append(regs);
  const review = h('details', { class: 'card' }, h('summary', { style: 'cursor:pointer' }, h('b', null, 'مراجعة المحتوى'), ' ', h('small', { class: 'muted' }, `${AR(by('approved'))} معتمد · ${AR(by('review'))} بانتظارك`)),
    h('div', { class: 'stack' },
    h('div', { class: 'grid cols-4' },
      h('a', { class: 'tile', href: '#/t/content?status=approved' }, h('b', null, by('approved')), h('span', null, 'معتمد')),
      h('a', { class: 'tile', href: '#/t/content?status=review' }, h('b', null, by('review')), h('span', null, 'بانتظار اعتمادك')),
      h('a', { class: 'tile', href: '#/t/content?status=draft' }, h('b', null, by('draft')), h('span', null, 'مسودات')),
      h('a', { class: 'tile', href: '#/t/content?status=demo' }, h('b', null, by('demo')), h('span', null, 'تجريبي (للاستبدال)'))),

    h('section', null,
      h('div', { class: 'section-title' }, h('h2', null, 'تحتاج شرحاً أبسط'), h('span', { class: 'badge' }, 'حين لا ينجح الشرحان مع الطالب')),
      flags.length
        ? h('div', { class: 'list' }, flags.map((f) => h('a', { class: 'item', href: `#/t/edit/${f.q.id}` },
            h('div', { class: 'grow' }, h('div', { class: 't', html: rich(plain(f.q)) }), h('small', { class: 'muted' }, topicTitle(f.q.topic))),
            h('span', { class: 'btn sm' }, 'أضف شرحاً'))))
        : h('div', { class: 'card empty small' }, 'لا شيء الآن.')),

    h('section', null,
      h('div', { class: 'section-title' }, h('h2', null, 'الأكثر خطأً'), h('span', { class: 'badge demo' }, 'من محاولات هذا الجهاز فقط')),
      missed.length
        ? h('div', { class: 'list' }, missed.map((m) => h('a', { class: 'item', href: `#/t/edit/${m.q.id}` },
            h('div', { class: 'grow' }, h('div', { class: 't', html: rich(plain(m.q)) }), h('small', { class: 'muted' }, topicTitle(m.q.topic))),
            h('b', null, `${m.wrong}/${m.n}`))))
        : h('div', { class: 'card empty small' }, 'ستظهر هنا بعد أن يتدرّب الطلاب.')),

    queue.length
      ? h('section', null, h('div', { class: 'section-title' }, h('h2', null, 'بانتظار قرارك')),
          h('div', { class: 'list' }, queue.slice(0, 5).map((q) => h('a', { class: 'item', href: `#/t/edit/${q.id}` },
            h('div', { class: 'grow' }, h('div', { class: 't', html: rich(plain(q)) })), h('span', { class: `badge ${STATUS[q.status].cls}` }, STATUS[q.status].label)))))
      : null));
  return h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('h1', null, 'لوحة الفريق'), h('p', { class: 'muted' }, `${(new Date().getHours() < 12) ? 'صباح الخير' : (new Date().getHours() < 18 ? 'أهلاً بك' : 'مساء الخير')} يا أستاذ — هذه مساحتك، لا يراها غيرك`)),
    h('div', { class: 'qgrid' },
      tile('#/t/library', 'books', 'مكتبة الملفات', `${AR(LIB_FILES.length)} ملفاً`, 5),
      tile('#/t/live', 'pen', 'حصة مباشرة', 'افتح ملفاً واكتب عليه', 6),
      tile('#/t/studio', 'pen', 'استوديو الأستاذ', 'الدروس والتسجيل', 1),
      regTile,
      tile('#/t/content', 'list', 'المحتوى', 'الأسئلة وحالتها', 4),
      tile('#/t/new', 'plus', 'سؤال جديد', null, 2)),
    review);
}
