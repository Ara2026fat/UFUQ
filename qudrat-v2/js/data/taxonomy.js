/**
 * Topic map. Topics are the ones that appear in the Ustaz's pamphlet.
 * Grouping/naming is a working draft pending his approval (see docs/01).
 */
export const GROUPS = [
  { id: 'num', title: 'الأعداد والعمليات', topics: ['arith', 'div', 'dec', 'frac', 'roots', 'pow', 'eq', 'conv'] },
  { id: 'app', title: 'النسب والتطبيقات', topics: ['pct', 'ratio', 'speed', 'avg'] },
  { id: 'geo', title: 'الهندسة', topics: ['angles', 'quad', 'area', 'circle', 'parallel', 'solid'] },
  { id: 'cnt', title: 'العد والتفكير', topics: ['seq', 'count', 'prob', 'clock', 'strat'] },
  { id: 'ufq', title: 'كمي — من أُفق', topics: ['geom', 'cmp', 'data'] },
  { id: 'verbal', title: 'اللفظي', topics: ['v_analogy', 'v_completion', 'v_context', 'v_odd', 'v_assoc', 'v_reading'] },
  { id: 'exam', title: 'إدارة الوقت والاختبار', topics: ['tm'] },
];

export const TOPICS = {
  arith: 'الحساب والأعداد الكبيرة', div: 'القسمة والأعداد الأولية', dec: 'الكسور العشرية',
  frac: 'الكسور', roots: 'الجذور', pow: 'الأسس', eq: 'المعادلات والمتطابقات', conv: 'التحويلات',
  pct: 'النسبة المئوية والربح', ratio: 'التناسب والعمل', speed: 'السرعة والمسافة والزمن', avg: 'المتوسط والإحصاء',
  angles: 'الزوايا والمثلثات', quad: 'المستطيل والأشكال الرباعية', area: 'المساحات والمظلل',
  circle: 'الدائرة', parallel: 'المستقيمات المتوازية', solid: 'المجسمات',
  seq: 'المتتاليات والأنماط', count: 'العد والتباديل', prob: 'الاحتمال', clock: 'زوايا الساعة', strat: 'استراتيجيات الحل',
  geom: 'الهندسة والقياس', cmp: 'المقارنة', data: 'الجداول والرسوم',
  v_analogy: 'التناظر اللفظي', v_completion: 'إكمال الجمل', v_context: 'الخطأ السياقي', v_odd: 'المفردة الشاذة', v_assoc: 'الارتباط والاختلاف', v_reading: 'استيعاب المقروء', tm: 'إدارة الوقت والمحاكاة',
};

export const topicTitle = (id) => TOPICS[id] || id;

export const ERROR_TYPES = [
  { id: 'misread', label: 'قرأت السؤال خطأً' },
  { id: 'method', label: 'لم أعرف الطريقة' },
  { id: 'calc', label: 'خطأ في الحساب' },
  { id: 'time', label: 'استعجلت' },
  { id: 'guess', label: 'خمّنت' },
];

export const STATUS = {
  demo: { label: 'تجريبي', cls: 'demo' },
  draft: { label: 'مسودة', cls: '' },
  review: { label: 'بانتظار الاعتماد', cls: 'info' },
  approved: { label: 'معتمد', cls: 'ok' },
  rejected: { label: 'مرفوض', cls: 'bad' },
  ustaz: { label: 'من ملف الأستاذ', cls: 'info' },
  ufuq: { label: 'من أُفق · قيد مراجعة الأستاذ', cls: 'gen' },
  generated: { label: 'مولَّد — يحتاج مراجعة', cls: 'gen' },
  backup: { label: 'احتياطي مخفي — يسدّ فجوات الصعوبة', cls: 'gen' },
};

export const COMPARE_OPTIONS = ['القيمة الأولى أكبر', 'القيمة الثانية أكبر', 'القيمتان متساويتان', 'المعطيات غير كافية'];
export const LETTERS = ['أ', 'ب', 'ج', 'د'];
