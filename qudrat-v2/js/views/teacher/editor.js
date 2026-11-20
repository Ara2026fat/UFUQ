import { h, toast } from '../../core/dom.js';
import { repo } from '../../store/repo.js';
import { go } from '../../core/router.js';
import { QuestionCard } from '../../components/question.js';
import { LETTERS, STATUS, TOPICS } from '../../data/taxonomy.js';

const blank = () => ({
  id: 'Q-' + Date.now().toString(36), topic: 'frac', type: 'mcq', stem: '', options: ['', '', '', ''], answer: 0,
  difficulty: 1, status: 'draft', solution: [], traps: {}, alt: { title: '', body: '' },
  source: { kind: 'teacher', note: 'أضافه الأستاذ' },
});

export function editorView(ctx) {
  const existing = ctx.params.id ? repo.get(ctx.params.id) : null;
  if (ctx.params.id && !existing) return h('div', { class: 'empty' }, 'السؤال غير موجود.');
  const q = structuredClone(existing || blank());
  q.options ||= ['', '', '', '']; q.alt ||= { title: '', body: '' }; q.traps ||= {};

  const preview = h('div', { class: 'card' });
  const paint = () => {
    const live = { ...q, options: q.options.map((o) => o || '…'), stem: q.stem || 'نص السؤال يظهر هنا', a: q.a || '…', b: q.b || '…' };
    preview.replaceChildren(QuestionCard(live, { readonly: true }).el);
  };
  const bind = (obj, key) => (e) => { obj[key] = e.target.value; paint(); };

  const text = (label, obj, key, opts = {}) => h('div', { class: 'field' }, h('label', null, label),
    opts.area ? h('textarea', { onInput: bind(obj, key), placeholder: opts.ph }, obj[key] ?? '') : h('input', { type: 'text', value: obj[key] ?? '', onInput: bind(obj, key), placeholder: opts.ph }),
    opts.hint ? h('span', { class: 'hint' }, opts.hint) : null);

  const optionsBox = h('div', { class: 'form-grid' });
  const compareBox = h('div', { class: 'form-grid' });
  const toggleType = () => { optionsBox.hidden = q.type === 'compare'; compareBox.hidden = q.type !== 'compare'; paint(); };

  q.options.forEach((_, i) => optionsBox.append(h('div', { class: 'opt-edit' },
    h('label', { class: 'row', style: 'gap:6px' }, h('input', { type: 'radio', name: 'ans', checked: q.answer === i ? '' : null, onChange: () => { q.answer = i; paint(); } }), h('b', null, LETTERS[i])),
    h('input', { type: 'text', 'aria-label': `الخيار ${LETTERS[i]}`, value: q.options[i], onInput: (e) => { q.options[i] = e.target.value; paint(); } }))));
  compareBox.append(
    text('القيمة الأولى', q, 'a'), text('القيمة الثانية', q, 'b'),
    h('div', { class: 'field' }, h('label', null, 'الإجابة الصحيحة'),
      h('select', { onChange: (e) => { q.answer = +e.target.value; paint(); } },
        ['الأولى أكبر', 'الثانية أكبر', 'متساويتان', 'المعطيات غير كافية'].map((l, i) => h('option', { value: i, selected: q.answer === i ? '' : null }, l)))));

  const sel = (label, obj, key, items, num) => h('div', { class: 'field' }, h('label', null, label),
    h('select', { onChange: (e) => { obj[key] = num ? +e.target.value : e.target.value; if (key === 'type') { q.answer = 0; toggleType(); } paint(); } },
      items.map(([v, l]) => h('option', { value: v, selected: String(obj[key]) === String(v) ? '' : null }, l))));

  const stepsTxt = h('div', { class: 'field' }, h('label', null, 'خطوات الحل (خطوة في كل سطر)'),
    h('textarea', { onInput: (e) => { q.solution = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean); } }, (q.solution || []).join('\n')));

  const traps = h('div', { class: 'form-grid' }, h('div', { class: 'lbl', style: 'font-weight:600' }, 'لماذا يغري الخيار الخاطئ؟ (اختياري)'),
    LETTERS.map((L, i) => h('div', { class: 'opt-edit' }, h('b', null, L),
      h('input', { type: 'text', placeholder: 'سبب اختياره عادةً', value: q.traps[i] || '', onInput: (e) => { q.traps[i] = e.target.value; } }))));

  function save(status) {
    if (q.type === 'mcq' && (!q.stem.trim() || q.options.some((o) => !o.trim()))) return toast('أكمل نص السؤال والخيارات الأربعة');
    if (q.type === 'compare' && (!q.a?.trim() || !q.b?.trim())) return toast('أدخل القيمتين');
    q.status = status || q.status;
    q.traps = Object.fromEntries(Object.entries(q.traps).filter(([, v]) => v?.trim()));
    repo.save(q); toast('تم الحفظ'); go('/t/content');
  }

  const root = h('div', { class: 'stack' },
    h('div', { class: 'page-head' }, h('h1', null, existing ? 'تعديل سؤال' : 'سؤال جديد'),
      h('p', null, 'للرياضيات: ضع التعبير بين علامتي دولار. الكسر ', h('span', { class: 'ltr' }, '{1|2}'), ' والأس ', h('span', { class: 'ltr' }, '^{2}'), ' — مثال: ', h('span', { class: 'ltr' }, '$ {1|2} + 3^{2} $'))),
    h('div', { class: 'split' },
      h('div', { class: 'form-grid' },
        h('div', { class: 'grid cols-2' },
          sel('الموضوع', q, 'topic', Object.entries(TOPICS)),
          sel('النوع', q, 'type', [['mcq', 'اختيار من متعدد'], ['compare', 'قارن بين']])),
        text('نص السؤال', q, 'stem', { area: true }), optionsBox, compareBox,
        sel('الصعوبة', q, 'difficulty', [[1, 'سهل'], [2, 'متوسط'], [3, 'صعب']], true),
        stepsTxt,
        text('شرح بديل أبسط — العنوان', q.alt, 'title'), text('شرح بديل أبسط — النص', q.alt, 'body', { area: true, hint: 'يظهر للطالب إذا أخطأ، بطريقة مختلفة عن الحل المعتاد.' }),
        traps,
        text('المصدر / ملاحظة الحقوق', q.source, 'note'),
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', type: 'button', onClick: () => save('approved') }, 'حفظ واعتماد'),
          h('button', { class: 'btn', type: 'button', onClick: () => save('draft') }, 'حفظ كمسودة'),
          h('a', { class: 'btn ghost', href: '#/t/content' }, 'إلغاء'),
          existing ? h('button', { class: 'btn ghost danger', type: 'button', onClick: () => { if (confirm('حذف هذا السؤال؟')) { repo.remove(q.id); go('/t/content'); } } }, 'حذف') : null)),
      h('div', { class: 'stack' }, h('h3', null, 'معاينة كما يراها الطالب'), preview, h('p', { class: 'muted small' }, `الحالة الحالية: ${STATUS[q.status]?.label || q.status}. المسودات لا تظهر للطلاب.`))));
  toggleType(); paint();
  return root;
}
