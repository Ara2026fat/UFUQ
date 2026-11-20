import { h, toast } from '../../core/dom.js';
import { qn } from '../../core/plural.js';
import { rich } from '../../core/math.js';
import { repo } from '../../store/repo.js';
import { STATUS, TOPICS, topicTitle } from '../../data/taxonomy.js';
import { tabbed } from '../../components/tabs.js';
import { generate, GENERATABLE } from '../../data/generators.js';
import { loadAllBanks } from '../../store/bank.js';

const plain = (q) => (q.type === 'compare' ? `قارن: ${q.a} ، ${q.b}` : q.stem);

const PAGE = 8;
const SECTIONS = [
  ['all', 'الكل', () => true],
  ['quant', 'كمي', (q) => !String(q.topic).startsWith('v_')],
  ['verbal', 'لفظي', (q) => String(q.topic).startsWith('v_')],
  
];

export function contentView(ctx) {
  const f = { status: ctx.query.status || '', topic: '', text: '' };
  const count = h('span', { class: 'muted small' });
  const panes = {}; // id -> { paint }
  let tabsEl = null;

  const filtered = () => repo.questions().filter((q) => !q.twinOnly)
    .filter((q) => !f.status || q.status === f.status)
    .filter((q) => !f.topic || q.topic === f.topic)
    .filter((q) => !f.text || plain(q).includes(f.text));

  function paintAll(resetPage) {
    const rows = filtered();
    count.textContent = qn(rows.length);
    if (tabsEl) {
      const btns = tabsEl.querySelectorAll('.tb-btn');
      SECTIONS.forEach(([, label, fn], i) => { if (btns[i]) btns[i].textContent = `${label} (${rows.filter(fn).length})`; });
    }
    Object.values(panes).forEach((p) => p.paint(rows, resetPage));
  }

  function row(q) {
    const st = STATUS[q.status] || STATUS.draft;
    const approved = q.status === 'approved';
    return h('div', { class: 'item' },
      h('div', { class: 'grow' },
        h('div', { class: 't', html: rich(plain(q)) }),
        h('div', { class: 'row small muted' }, h('span', null, topicTitle(q.topic)), h('span', { class: `badge ${st.cls}` }, st.label))),
      h('button', { class: `btn sm ${approved ? '' : 'primary'}`, type: 'button',
        onClick: () => { repo.setStatus(q.id, approved ? 'draft' : 'approved'); toast(approved ? 'أُعيد إلى مسودة' : 'تم الاعتماد'); paintAll(false); } },
        approved ? 'سحب الاعتماد' : 'اعتماد'),
      h('a', { class: 'btn sm', href: `#/t/edit/${q.id}` }, 'تعديل'));
  }

  function section(id, fn) {
    let page = 0;
    const listEl = h('div', { class: 'list' });
    const prev = h('button', { class: 'btn sm', type: 'button', onClick: () => { page--; draw(); top(); } }, 'السابق');
    const next = h('button', { class: 'btn sm', type: 'button', onClick: () => { page++; draw(); top(); } }, 'التالي');
    const info = h('span', { class: 'muted small' });
    const pager = h('div', { class: 'row between', style: 'align-items:center' }, next, info, prev);
    const node = h('div', { class: 'stack' }, pager, listEl);
    let rows = [];
    const top = () => { try { node.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch { /* */ } };
    function draw() {
      const pages = Math.max(1, Math.ceil(rows.length / PAGE));
      page = Math.min(Math.max(0, page), pages - 1);
      const slice = rows.slice(page * PAGE, page * PAGE + PAGE);
      listEl.replaceChildren(...(slice.length ? slice.map(row) : [h('div', { class: 'card empty' }, 'لا نتائج.')]));
      info.textContent = rows.length ? `صفحة ${page + 1} من ${pages}` : '';
      prev.disabled = page <= 0; next.disabled = page >= pages - 1;
      pager.hidden = pages <= 1;
    }
    panes[id] = { paint(all, reset) { rows = all.filter(fn); if (reset) page = 0; draw(); } };
    panes[id].paint(filtered(), true);
    return node;
  }

  const sel = (opts, key, ph) => h('select', { 'aria-label': ph, onChange: (e) => { f[key] = e.target.value; paintAll(true); } },
    h('option', { value: '' }, ph), opts.map(([v, l]) => h('option', { value: v, selected: f[key] === v ? '' : null }, l)));

  tabsEl = tabbed({ key: 'content', tabs: SECTIONS.map(([id, label, fn]) => ({ id, label, render: () => section(id, fn) })) });
  const root = h('div', { class: 'stack' },
    h('div', { class: 'row between' }, h('div', { class: 'page-head', style: 'margin:0' }, h('h1', null, 'المحتوى'), count),
      h('a', { class: 'btn primary', href: '#/t/new' }, 'سؤال جديد')),
    h('div', { class: 'toolbar' },
      sel(Object.entries(STATUS).map(([k, v]) => [k, v.label]), 'status', 'كل الحالات'),
      sel(Object.entries(TOPICS), 'topic', 'كل المواضيع'),
      h('button', { class: 'btn sm', type: 'button', title: 'يولّد 10 أسئلة للموضوع المحدد ويضيفها بوسم مولَّد', onClick: () => {
        const t = f.topic; if (!GENERATABLE.includes(t)) return toast('اختر موضوعاً يدعم التوليد من القائمة');
        for (let i = 0; i < 10; i++) repo.save(generate(t, 1 + (i % 3))); toast('أُضيف 10 أسئلة مولَّدة للمراجعة'); paintAll(false);
      } }, 'ولّد 10 أسئلة'),
      h('input', { type: 'search', placeholder: 'بحث في النص', 'aria-label': 'بحث', onInput: (e) => { f.text = e.target.value; paintAll(true); } })),
    tabsEl);
  paintAll(true);
  loadAllBanks().then(() => paintAll(false)).catch(() => {}); // بنوك الأسئلة تُحمَّل عند الطلب: نُحمّلها كلها ليظهر المحتوى كاملاً
  return root;
}
