/**
 * Parametric question generators. Every answer is computed in code (correct by
 * construction); distractors are built from real mistake patterns.
 * Each question carries a NON-ENUMERABLE `__check` closure that independently
 * recomputes the correct option text (mcq) or answer index (compare) for tests.
 *
 * Syntax: $ ... $ math, {a|b} fraction, ^{n} exponent (see js/core/math.js).
 */

// ---------- helpers ----------
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const shuffle = (r, arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const N = (x) => String(Number(Number(x).toFixed(6)));
const N2 = (x) => String(Number(Number(x).toFixed(2)));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const M = (s) => `$ ${s} $`;
const raw = (n, d) => `{${n}|${d}}`;
const fr = (n, d) => {
  const g = gcd(n, d);
  n /= g;
  d /= g;
  return d === 1 ? `${n}` : raw(n, d);
};
/** reduced fraction as math text; null when not positive */
const F = (n, d) => (n > 0 && d > 0 && Number.isInteger(n) && Number.isInteger(d) ? M(fr(n, d)) : null);
/** independent: recover reduced fraction from a decimal value by search */
const fracFromValue = (v) => {
  for (let dd = 1; dd <= 2000; dd++) {
    const nn = Math.round(v * dd);
    if (Math.abs(nn / dd - v) < 1e-9) return M(dd === 1 ? `${nn}` : raw(nn, dd));
  }
  return null;
};
const W = (v, f, trap) => (Number.isFinite(v) && v > 0 ? [f(v), trap] : null);
const cnt = (n, w) => {
  if (!Number.isInteger(n)) return `${N(n)} ${w[3]}`;
  if (n === 1) return w[0];
  if (n === 2) return w[1];
  if (n <= 10) return `${n} ${w[2]}`;
  return `${n} ${w[3]}`;
};
const RIYAL = ['ريال واحد', 'ريالان', 'ريالات', 'ريالاً'];
const DAY = ['يوم واحد', 'يومان', 'أيام', 'يوماً'];
const HOUR = ['ساعة واحدة', 'ساعتان', 'ساعات', 'ساعة'];
const riyal = (n) => cnt(n, RIYAL);
const days = (n) => cnt(n, DAY);
const hours = (n) => cnt(n, HOUR);
const km = (n) => `${N(n)} كم`;
const kmh = (n) => `${N(n)} كم/س`;
const deg = (n) => `${N(n)}°`;
const cm = (n) => `${N(n)} سم`;
const cm2 = (n) => `${N(n)} سم²`;
const pctT = (n) => `${N(n)}٪`;
const plain = (n) => N(n);

const V = {};

// ---------- frac ----------
V.frac = [
  // add / subtract unlike denominators
  (r, d) => {
    const mx = d === 1 ? 6 : d === 2 ? 9 : 12;
    let d1, d2, n1, n2;
    do {
      d1 = ri(r, 2, mx);
      d2 = ri(r, 2, mx);
      n1 = ri(r, 1, d1 - 1);
      n2 = ri(r, 1, d2 - 1);
    } while (d1 === d2 || gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1);
    const sub = r() < 0.5;
    if (sub && n1 * d2 < n2 * d1) [n1, d1, n2, d2] = [n2, d2, n1, d1];
    const s = sub ? -1 : 1;
    const op = sub ? '−' : '+';
    const num = n1 * d2 + s * n2 * d1;
    const den = d1 * d2;
    return {
      kind: 'mcq',
      stem: `ما ناتج $ ${raw(n1, d1)} ${op} ${raw(n2, d2)} $ ؟`,
      correct: F(num, den),
      wrong: [
        [F(n1 + s * n2, d1 + s * d2), `هذا الجواب يظهر عند ${sub ? 'طرح' : 'جمع'} البسطين والمقامين معاً. لكن المقامات لا تُجمع ولا تُطرح؛ لا بد من توحيدها أولاً.`],
        [F(n1 + s * n2, d1 * d2), 'عملتَ على البسطين فقط وضربتَ المقامين دون توحيد المقامات بشكل صحيح.'],
        [F(num + 1, den), null],
        [F(num + d1, den), null],
        [F(num + 2, den), null],
      ],
      solution: [
        `وحّد المقامين: المقام المشترك ${d1} × ${d2} = ${den}`,
        `$ ${raw(n1 * d2, den)} ${op} ${raw(n2 * d1, den)} $`,
        `${sub ? 'اطرح' : 'اجمع'} البسطين وأبقِ المقام: $ ${raw(num, den)} $` + (gcd(num, den) > 1 ? ' ثم اختصر الكسر' : ''),
      ],
      alt: { title: 'اجعل القطع متساوية أولاً', body: `لا يمكن ${sub ? 'طرح' : 'جمع'} قطع مختلفة الحجم. قسّم الكل إلى ${den} قطعة متساوية: الكسر الأول ${n1 * d2} قطعة والثاني ${n2 * d1} قطعة، والناتج ${num} قطعة من ${den}.` },
      check: () => {
        const v = n1 / d1 + s * (n2 / d2);
        return fracFromValue(v);
      },
    };
  },
  // compare two fractions
  (r, d) => {
    let n1, d1, n2, d2;
    const mode = r();
    if (d >= 2 && mode < 0.35) {
      const k = ri(r, 2, 9);
      n1 = k; d1 = k + 1; n2 = k + 1; d2 = k + 2;
      if (r() < 0.5) [n1, d1, n2, d2] = [n2, d2, n1, d1];
    } else if (mode < 0.6) {
      n1 = ri(r, 1, 5); d1 = ri(r, n1 + 1, 9);
      const k = ri(r, 2, 4);
      n2 = n1 * k; d2 = d1 * k;
    } else {
      d1 = ri(r, 3, 12); d2 = ri(r, 3, 12);
      n1 = ri(r, 1, d1 - 1); n2 = ri(r, 1, d2 - 1);
    }
    const x = n1 * d2, y = n2 * d1;
    const answer = x > y ? 0 : x < y ? 1 : 2;
    return {
      kind: 'compare',
      a: `$ ${raw(n1, d1)} $`,
      b: `$ ${raw(n2, d2)} $`,
      answer,
      solution: [
        `اضرب بالتقاطع: ${n1} × ${d2} = ${x} و ${n2} × ${d1} = ${y}`,
        answer === 0 ? `${x} > ${y} فالقيمة الأولى أكبر` : answer === 1 ? `${x} < ${y} فالقيمة الثانية أكبر` : `${x} = ${y} فالقيمتان متساويتان`,
      ],
      alt: { title: 'وحّد المقامين', body: `حوّل الكسرين إلى المقام ${d1 * d2}: يصبحان $ ${raw(x, d1 * d2)} $ و $ ${raw(y, d1 * d2)} $ ثم قارن البسطين مباشرة.` },
      check: () => {
        const df = n1 / d1 - n2 / d2;
        return Math.abs(df) < 1e-12 ? 2 : df > 0 ? 0 : 1;
      },
    };
  },
  // fraction of a quantity
  (r, d) => {
    const dd = pick(r, [2, 3, 4, 5, 6, 8, 10]);
    const n = ri(r, 1, dd - 1);
    const k = ri(r, 2, d === 1 ? 9 : 15);
    const m = dd * k;
    const c = (m / dd) * n;
    return {
      kind: 'mcq',
      stem: `ما قيمة $ ${raw(n, dd)} $ من العدد ${m} ؟`,
      correct: plain(c),
      wrong: [
        W(m / dd, plain, `هذا هو $ ${raw(1, dd)} $ من العدد فقط. بقي أن تضربه في البسط ${n}.`),
        W(m * n, plain, 'ضربتَ العدد في البسط ونسيتَ القسمة على المقام.'),
        W(m - c, plain, 'هذا هو الباقي بعد أخذ الجزء، وليس الجزء نفسه.'),
        W(c + dd, plain, null),
        W(c + n, plain, null),
      ],
      solution: [`قسّم ${m} على المقام ${dd}: ${m} ÷ ${dd} = ${k}`, `اضرب في البسط: ${k} × ${n} = ${c}`],
      alt: { title: 'قسّم ثم خذ', body: `قسّم العدد ${m} إلى ${dd} أجزاء متساوية، كل جزء ${k}. خذ ${n} من هذه الأجزاء: ${c}.` },
      check: () => plain((m * n) / dd),
    };
  },
];

// ---------- dec ----------
V.dec = [
  // multiply decimals
  (r, d) => {
    let A, B, ka, kb;
    do {
      A = ri(r, 2, d === 1 ? 9 : 19);
      B = ri(r, 2, 9);
      ka = d === 1 ? 1 : ri(r, 1, 2);
      kb = d === 1 ? 1 : ri(r, 1, 2);
    } while (A % 10 === 0);
    const a = N(A / 10 ** ka), b = N(B / 10 ** kb);
    const k = ka + kb;
    const c = (A * B) / 10 ** k;
    return {
      kind: 'mcq',
      stem: `ما قيمة $ ${a} × ${b} $ ؟`,
      correct: plain(c),
      wrong: [
        W(c * 10, plain, 'أخطأتَ في موضع الفاصلة العشرية: عدد الخانات العشرية في الناتج يساوي مجموعها في العددين.'),
        W(c / 10, plain, 'أخطأتَ في موضع الفاصلة العشرية: عدّ الخانات العشرية في العددين ثم اجمعها.'),
        W(parseFloat(a) + parseFloat(b), plain, 'جمعتَ العددين بدل ضربهما.'),
        W(c * 100, plain, null),
        W(c / 100, plain, null),
      ],
      solution: [`اضرب كأنهما عددان صحيحان: ${A} × ${B} = ${A * B}`, `عدد الخانات العشرية في العددين معاً = ${k}`, `ضع الفاصلة بعد ${k} خانة من اليمين: ${plain(c)}`],
      alt: { title: 'حوّلها إلى كسور', body: `${a} = ${A}/${10 ** ka} و ${b} = ${B}/${10 ** kb}. الضرب يعطي ${A * B}/${10 ** k} = ${plain(c)}.` },
      check: () => plain(parseFloat(a) * parseFloat(b)),
    };
  },
  // divide decimals
  (r, d) => {
    const dv = pick(r, [0.2, 0.5, 0.25, 0.4, 0.04, 0.05, 0.8]);
    const q = d === 1 ? ri(r, 2, 40) : ri(r, 20, 400) / 10;
    const dividend = q * dv;
    const sd = N(dividend);
    const sv = N(dv);
    return {
      kind: 'mcq',
      stem: `ما قيمة $ ${sd} ÷ ${sv} $ ؟`,
      correct: plain(q),
      wrong: [
        W(q / 10, plain, 'أخطأتَ في موضع الفاصلة بعد إزالتها من المقسوم عليه. حرّك الفاصلة في العددين بالمقدار نفسه.'),
        W(q * 10, plain, 'أخطأتَ في موضع الفاصلة: حرّك الفاصلة في المقسوم والمقسوم عليه بالمقدار نفسه ثم اقسم.'),
        W(dividend * dv, plain, 'ضربتَ بدل أن تقسم.'),
        W(q / 100, plain, null),
        W(q * 100, plain, null),
      ],
      solution: [`اجعل المقسوم عليه عدداً صحيحاً بضرب العددين في ${dv < 0.1 ? 100 : dv === 0.25 ? 100 : 10}`, `اقسم: الناتج ${plain(q)}`],
      alt: { title: 'كم مرة يدخل؟', body: `اسأل نفسك: كم مرة يدخل ${sv} في ${sd}؟ ${sv} × ${plain(q)} = ${sd}.` },
      check: () => plain(parseFloat(sd) / parseFloat(sv)),
    };
  },
];

// ---------- pct ----------
V.pct = [
  // discount
  (r, d) => {
    const p = pick(r, d === 1 ? [100, 200, 250, 400, 500] : [120, 150, 240, 360, 450, 640, 800]);
    const pc = pick(r, [10, 20, 25, 30, 40, 50].filter((x) => (p * x) % 100 === 0));
    const disc = (p * pc) / 100;
    const c = p - disc;
    return {
      kind: 'mcq',
      stem: `سلعة سعرها ${riyal(p)} عليها خصم ${pc}٪. كم سعرها بعد الخصم؟`,
      correct: riyal(c),
      wrong: [
        W(disc, riyal, 'هذا مقدار الخصم نفسه. السؤال يطلب السعر بعد الخصم فاطرحه من السعر الأصلي.'),
        W(p + disc, riyal, 'أضفتَ الخصم بدل أن تطرحه.'),
        W(p - pc, riyal, 'طرحتَ النسبة المئوية (العدد) من السعر مباشرة، لكن الخصم هو نسبة من السعر وليس عدداً ثابتاً.'),
        W(c + disc / 2, riyal, null),
        W(c - 10, riyal, null),
      ],
      solution: [`قيمة الخصم = ${pc}٪ × ${p} = ${disc}`, `السعر بعد الخصم = ${p} − ${disc} = ${c}`],
      alt: { title: `ادفع ${100 - pc}٪ مباشرة`, body: `بعد خصم ${pc}٪ تدفع ${100 - pc}٪ من السعر: ${100 - pc}٪ من ${p} = ${c}.` },
      check: () => riyal(p * (1 - pc / 100)),
    };
  },
  // increase
  (r, d) => {
    const p = pick(r, d === 1 ? [200, 400, 500, 800] : [120, 240, 350, 640, 900, 1200]);
    const pc = pick(r, [5, 10, 20, 25, 30, 50].filter((x) => (p * x) % 100 === 0));
    const inc = (p * pc) / 100;
    const c = p + inc;
    const who = pick(r, ['راتب موظف', 'سعر جهاز', 'إيجار شقة']);
    return {
      kind: 'mcq',
      stem: `${who} ${pick(r, ['قيمته', 'مقداره'])} ${riyal(p)} ارتفع بنسبة ${pc}٪. ما قيمته الجديدة؟`,
      correct: riyal(c),
      wrong: [
        W(inc, riyal, 'هذا مقدار الزيادة فقط. أضفه إلى القيمة الأصلية.'),
        W(p - inc, riyal, 'طرحتَ الزيادة بدل أن تضيفها.'),
        W(p + pc, riyal, 'أضفتَ النسبة (العدد) إلى القيمة مباشرة، لكن الزيادة نسبة من القيمة.'),
        W(c + inc / 2, riyal, null),
        W(c + 10, riyal, null),
      ],
      solution: [`مقدار الزيادة = ${pc}٪ × ${p} = ${inc}`, `القيمة الجديدة = ${p} + ${inc} = ${c}`],
      alt: { title: `القيمة الجديدة = ${100 + pc}٪`, body: `بعد الزيادة تصبح القيمة ${100 + pc}٪ من الأصلية: ${100 + pc}٪ من ${p} = ${c}.` },
      check: () => riyal(p * (1 + pc / 100)),
    };
  },
  // percent of a number
  (r, d) => {
    const pc = pick(r, d === 1 ? [10, 20, 25, 50] : [5, 15, 30, 40, 60, 75, 80]);
    const base = pick(r, [40, 60, 80, 120, 160, 200, 240, 320, 400, 480]).valueOf();
    const b = (base * pc) % 100 === 0 ? base : base * 5;
    const c = (b * pc) / 100;
    return {
      kind: 'mcq',
      stem: `ما قيمة ${pc}٪ من ${b} ؟`,
      correct: plain(c),
      wrong: [
        W(b - c, plain, `هذا هو الباقي بعد أخذ ${pc}٪. المطلوب ${pc}٪ نفسها.`),
        W(c * 10, plain, 'أخطأتَ في موضع الفاصلة عند القسمة على 100.'),
        W(c / 10, plain, 'أخطأتَ في موضع الفاصلة عند القسمة على 100.'),
        W(b + c, plain, null),
        W(pc + b / 10, plain, null),
      ],
      solution: [`${pc}٪ = ${pc} ÷ 100`, `${b} × ${pc} ÷ 100 = ${c}`],
      alt: { title: 'ابدأ من 1٪', body: `1٪ من ${b} = ${N(b / 100)}. إذن ${pc}٪ = ${N(b / 100)} × ${pc} = ${c}.` },
      check: () => plain((pc / 100) * b),
    };
  },
  // compare a% of b vs b% of a (or two different percents)
  (r, d) => {
    const eq = r() < 0.55;
    let a, b, c, e, A, B, text;
    if (eq) {
      a = ri(r, 5, 90); b = ri(r, 10, 400);
      if (a === b) b += 10;
      return {
        kind: 'compare',
        a: `${a}٪ من ${b}`,
        b: `${b}٪ من ${a}`,
        answer: 2,
        solution: [`${a}٪ من ${b} = (${a} × ${b}) ÷ 100`, `${b}٪ من ${a} = (${b} × ${a}) ÷ 100`, 'الناتجان متساويان'],
        alt: { title: 'القاعدة المختصرة', body: 'س٪ من ص تساوي ص٪ من س دائماً، لأن الناتج هو (س × ص) ÷ 100 في الحالتين، وترتيب الضرب لا يغيّر الناتج.' },
        check: () => {
          const x = (a / 100) * b, y = (b / 100) * a;
          return Math.abs(x - y) < 1e-9 ? 2 : x > y ? 0 : 1;
        },
      };
    }
    a = pick(r, [10, 20, 25, 30, 40, 50]); b = pick(r, [40, 60, 80, 120, 200]);
    c = pick(r, [10, 20, 25, 30, 40, 50]); e = pick(r, [40, 60, 80, 120, 200]);
    if (a * b === c * e) e += 20;
    A = a * b; B = c * e;
    return {
      kind: 'compare',
      a: `${a}٪ من ${b}`,
      b: `${c}٪ من ${e}`,
      answer: A > B ? 0 : 1,
      solution: [`${a}٪ من ${b} = ${N(A / 100)}`, `${c}٪ من ${e} = ${N(B / 100)}`, A > B ? 'الأولى أكبر' : 'الثانية أكبر'],
      alt: { title: 'احسب كلاً منهما', body: `لا تحكم من شكل الأعداد. ${a}٪ من ${b} = ${N(A / 100)} بينما ${c}٪ من ${e} = ${N(B / 100)}.` },
      check: () => {
        const x = (a / 100) * b, y = (c / 100) * e;
        return Math.abs(x - y) < 1e-9 ? 2 : x > y ? 0 : 1;
      },
    };
  },
  // percent change
  (r, d) => {
    const a = pick(r, [20, 40, 50, 60, 80, 100, 120, 200]);
    const pc = pick(r, [10, 20, 25, 30, 50, 75].filter((x) => (a * x) % 100 === 0));
    const b = a + (a * pc) / 100;
    const noun = pick(r, ['سعر', 'عدد الطلاب', 'الراتب']);
    return {
      kind: 'mcq',
      stem: `ارتفع ${noun} من ${a} إلى ${b}. ما نسبة الزيادة المئوية؟`,
      correct: pctT(pc),
      wrong: [
        W(((b - a) / b) * 100, (v) => pctT(Number(v.toFixed(1))), 'قسمتَ الزيادة على القيمة الجديدة. نسبة الزيادة تُحسب بالنسبة إلى القيمة الأصلية (القديمة).'),
        W(b - a, pctT, 'هذا مقدار الزيادة نفسه وليس نسبتها المئوية.'),
        W(pc * 2, pctT, null),
        W(pc + 10, pctT, null),
        W(pc + 5, pctT, null),
      ],
      solution: [`مقدار الزيادة = ${b} − ${a} = ${b - a}`, `النسبة = الزيادة ÷ القيمة الأصلية × 100 = ${b - a} ÷ ${a} × 100 = ${pc}٪`],
      alt: { title: 'النسبة إلى الأصل', body: `الأصل هو ${a}. زاد بمقدار ${b - a}، أي ${N((b - a) / a)} من الأصل، وهذا يساوي ${pc}٪.` },
      check: () => pctT(((b - a) / a) * 100),
    };
  },
];

// ---------- speed ----------
const HARMONIC = [[60, 40], [30, 60], [20, 30], [60, 90], [50, 75], [30, 45], [40, 120], [60, 120], [30, 90], [20, 60], [80, 120], [40, 60]];
const halfTime = (h) => (h === 1 ? 'ساعة ونصف' : h === 2 ? 'ساعتين ونصف' : h <= 10 ? `${h} ساعات ونصف` : `${h} ساعة ونصف`);

V.speed = [
  // distance = speed x time, with half hours
  (r, d) => {
    const s = pick(r, d === 1 ? [40, 60, 80, 100] : [50, 70, 90, 110, 120, 130]);
    const h = ri(r, 1, d === 1 ? 4 : 8);
    const half = r() < 0.8;
    const t = half ? h + 0.5 : h;
    const c = s * t;
    const veh = pick(r, ['سيارة', 'حافلة', 'شاحنة']);
    return {
      kind: 'mcq',
      stem: `${veh} سرعتها ${s} كم/س. كم كيلومتراً تقطع في ${half ? halfTime(h) : cnt(h, HOUR)}؟`,
      correct: km(c),
      wrong: [
        half ? W(s * h, km, `حسبتَ ${cnt(h, HOUR)} فقط. بقي النصف ساعة: ${s / 2} كم إضافية.`) : W(s * (h + 1), km, 'زدتَ ساعة على الزمن المعطى.'),
        W(s * h + s, km, half ? 'عاملتَ النصف ساعة على أنها ساعة كاملة.' : null),
        W(s + t, km, 'جمعتَ السرعة والزمن بدل ضربهما.'),
        W(c + s / 2, km, null),
        W(c - 10, km, null),
        W(c + 20, km, null),
      ],
      solution: ['المسافة = السرعة × الزمن', `${s} × ${N(t)} = ${N(c)}`],
      alt: { title: 'قسّم الزمن', body: half ? `${cnt(h, HOUR)} = ${s * h} كم، ونصف ساعة = ${s / 2} كم. المجموع ${N(c)} كم.` : `في كل ساعة تقطع ${s} كم، وبعد ${cnt(h, HOUR)} تقطع ${N(c)} كم.` },
      check: () => km(Array.from({ length: Math.round(t * 2) }, () => s / 2).reduce((x, y) => x + y, 0)),
    };
  },
  // average speed: two legs, or equal distances
  (r, d) => {
    if (r() < 0.5) {
      const [a, b] = pick(r, HARMONIC);
      const k = pick(r, [1, 1, 1]);
      const s1 = a * k, s2 = b * k;
      const c = (2 * s1 * s2) / (s1 + s2);
      return {
        kind: 'mcq',
        difficulty: 3,
        stem: `قطع رجل مسافة ما بسرعة ${s1} كم/س ثم عاد في الطريق نفسه بسرعة ${s2} كم/س. ما متوسط سرعته في الرحلة كاملة؟`,
        correct: kmh(c),
        wrong: [
          W((s1 + s2) / 2, kmh, `هذا المتوسط الحسابي للسرعتين. زمن الرحلتين مختلف، فالمتوسط الصحيح = المسافة الكلية ÷ الزمن الكلي.`),
          W(c + 2, kmh, null),
          W(c - 2, kmh, null),
          W(Math.sqrt(s1 * s2), (v) => kmh(N2(v)), null),
          W(c + 5, kmh, null),
        ],
        solution: ['افرض أن المسافة في اتجاه واحد = ' + s1 * s2, `زمن الذهاب = ${s2} ساعة وزمن العودة = ${s1} ساعة`, `المسافة الكلية = ${2 * s1 * s2} والزمن الكلي = ${s1 + s2}`, `المتوسط = ${2 * s1 * s2} ÷ ${s1 + s2} = ${N(c)}`],
        alt: { title: 'المتوسط = الكل ÷ الكل', body: 'لا تأخذ متوسط السرعتين. اجمع المسافات كلها واجمع الأزمنة كلها ثم اقسم. الرحلة البطيئة تستغرق وقتاً أطول فتسحب المتوسط نحوها.' },
        check: () => {
          const D = 1000 * s1 * s2; // any common distance, solved by time
          return kmh((2 * D) / (D / s1 + D / s2));
        },
      };
    }
    let t1, t2, s1, s2, tot;
    for (let i = 0; i < 200; i++) {
      t1 = ri(r, 2, 5); t2 = ri(r, 1, 4);
      s1 = ri(r, 4, 14) * 5; s2 = ri(r, 4, 14) * 5;
      tot = s1 * t1 + s2 * t2;
      if (s1 !== s2 && tot % (t1 + t2) === 0 && (s1 + s2) / 2 !== tot / (t1 + t2)) break;
      tot = -1;
    }
    if (tot < 0) throw new Error('no params');
    const c = tot / (t1 + t2);
    return {
      kind: 'mcq',
      difficulty: 2,
      stem: `سار رجل ${cnt(t1, HOUR)} بسرعة ${s1} كم/س ثم ${cnt(t2, HOUR)} بسرعة ${s2} كم/س. ما متوسط سرعته؟`,
      correct: kmh(c),
      wrong: [
        W((s1 + s2) / 2, kmh, `هذا متوسط السرعتين ${s1} و${s2}. المتوسط الصحيح يحتاج المسافة الكلية على الزمن الكلي.`),
        W(tot, kmh, 'هذه المسافة الكلية. ما زال عليك القسمة على الزمن الكلي.'),
        W(c + 2, kmh, null),
        W(c - 3, kmh, null),
        W(c + 5, kmh, null),
      ],
      solution: [`المسافة الكلية = ${s1 * t1} + ${s2 * t2} = ${tot} كم`, `الزمن الكلي = ${t1 + t2} ساعات`, `المتوسط = ${tot} ÷ ${t1 + t2} = ${N(c)}`],
      alt: { title: 'المتوسط = الكل ÷ الكل', body: 'اجمع المسافات كلها، واجمع الأزمنة كلها، ثم اقسم. لا تأخذ متوسط السرعتين.' },
      check: () => kmh((s1 * t1 + s2 * t2) / (t1 + t2)),
    };
  },
  // meeting (toward each other)
  (r, d) => {
    const s1 = ri(r, 4, 14) * 5, s2 = ri(r, 3, 12) * 5;
    const t = ri(r, 2, 8);
    const D = (s1 + s2) * t;
    return {
      kind: 'mcq',
      stem: `تبعد مدينتان ${D} كم. خرجت سيارة من الأولى بسرعة ${s1} كم/س وخرجت أخرى من الثانية في الوقت نفسه باتجاه الأولى بسرعة ${s2} كم/س. بعد كم ساعة تلتقيان؟`,
      correct: hours(t),
      wrong: [
        W(D / s1, (v) => hours(Number(v.toFixed(2))), 'قسمتَ المسافة على سرعة سيارة واحدة. السيارتان تقتربان معاً فتُجمع سرعتاهما.'),
        W(D / Math.abs(s1 - s2), (v) => hours(Number(v.toFixed(2))), 'طرحتَ السرعتين. الطرح يكون عند الملاحقة في الاتجاه نفسه، أما هنا فهما متقابلتان فتُجمع السرعتان.'),
        W(t + 1, hours, null),
        W(t * 2, hours, null),
        W(t + 2, hours, null),
      ],
      solution: [`سرعة الاقتراب = ${s1} + ${s2} = ${s1 + s2} كم/س`, `الزمن = المسافة ÷ سرعة الاقتراب = ${D} ÷ ${s1 + s2} = ${t}`],
      alt: { title: 'كأنهما سيارة واحدة', body: `كل ساعة تنقص المسافة بينهما ${s1 + s2} كم (${s1} + ${s2}). فتحتاج ${D} ÷ ${s1 + s2} = ${t} ساعات.` },
      check: () => {
        for (let x = 1; x < 1000; x++) if (s1 * x + s2 * x === D) return hours(x);
        return null;
      },
    };
  },
  // chasing (same direction)
  (r, d) => {
    const s2 = ri(r, 3, 10) * 5, s1 = s2 + ri(r, 2, 6) * 5;
    const t = ri(r, 2, 8);
    const G = (s1 - s2) * t;
    return {
      kind: 'mcq',
      difficulty: Math.max(2, d),
      stem: `تسير دراجة بسرعة ${s2} كم/س، وبعد أن ابتعدت ${G} كم انطلقت خلفها سيارة بسرعة ${s1} كم/س في الاتجاه نفسه. بعد كم ساعة تلحق السيارة بالدراجة؟`,
      correct: hours(t),
      wrong: [
        W(G / (s1 + s2), (v) => hours(Number(v.toFixed(2))), 'جمعتَ السرعتين. عند الملاحقة في الاتجاه نفسه تُطرح السرعتان لأن السيارة تقترب بالفرق بينهما.'),
        W(G / s1, (v) => hours(Number(v.toFixed(2))), 'قسمتَ المسافة على سرعة السيارة وحدها، متجاهلاً أن الدراجة تتحرك أيضاً.'),
        W(t + 1, hours, null),
        W(t * 2, hours, null),
        W(t + 2, hours, null),
      ],
      solution: [`سرعة الاقتراب = ${s1} − ${s2} = ${s1 - s2} كم/س`, `الزمن = ${G} ÷ ${s1 - s2} = ${t}`],
      alt: { title: 'الفرق بين السرعتين', body: `كل ساعة تقلّص السيارة الفجوة بمقدار ${s1 - s2} كم. الفجوة ${G} كم تحتاج ${t} ساعات.` },
      check: () => {
        for (let x = 1; x < 1000; x++) if (s1 * x === G + s2 * x) return hours(x);
        return null;
      },
    };
  },
];

// ---------- avg ----------
V.avg = [
  // mean after adding an element
  (r, d) => {
    let n, m, k, x;
    do {
      n = ri(r, 3, d === 1 ? 5 : 8);
      m = ri(r, 6, 30);
      k = ri(r, -4, 8);
      x = m + (n + 1) * k;
    } while (k === 0 || x <= 0);
    const c = m + k;
    return {
      kind: 'mcq',
      stem: `متوسط ${n} أعداد يساوي ${m}. أضفنا إليها عدداً جديداً هو ${x}. ما المتوسط الجديد؟`,
      correct: plain(c),
      wrong: [
        W((m + x) / 2, plain, `هذا متوسط ${m} و${x} فقط. الأعداد الأولى لها وزنها: عدّها كلها.`),
        W(m, plain, 'ظننتَ أن المتوسط لا يتغير. إضافة عدد مختلف عن المتوسط تغيّره.'),
        W(m - k, plain, 'اتجاه التغيّر معكوس: العدد الأكبر من المتوسط يرفعه، والأصغر يخفضه.'),
        W(c + 1, plain, null),
        W(c + 2, plain, null),
      ],
      solution: [`مجموع الأعداد الأولى = ${n} × ${m} = ${n * m}`, `المجموع الجديد = ${n * m} + ${x} = ${n * m + x}`, `المتوسط الجديد = ${n * m + x} ÷ ${n + 1} = ${c}`],
      alt: { title: 'ابدأ من المجموع', body: 'المتوسط × العدد = المجموع. اجمع الجديد إلى المجموع القديم ثم اقسم على العدد الجديد.' },
      check: () => {
        const arr = Array(n).fill(m);
        arr.push(x);
        return plain(arr.reduce((p, q) => p + q, 0) / arr.length);
      },
    };
  },
  // find the missing number
  (r, d) => {
    let cnum, M0, vals, sum, miss;
    do {
      cnum = ri(r, 4, d === 1 ? 5 : 6);
      M0 = ri(r, 8, 40);
      vals = Array.from({ length: cnum - 1 }, () => ri(r, 2, 2 * M0 - 2));
      sum = vals.reduce((p, q) => p + q, 0);
      miss = cnum * M0 - sum;
    } while (miss <= 0 || vals.includes(miss));
    const ws = ['أربعة', 'خمسة', 'ستة', 'سبعة'][cnum - 4];
    return {
      kind: 'mcq',
      stem: `متوسط ${ws} أعداد هو ${M0}. إذا كان ${cnum - 1} منها: ${vals.join('، ')}، فما العدد الباقي؟`,
      correct: plain(miss),
      wrong: [
        W(cnum * M0, plain, 'هذا مجموع الأعداد كلها. اطرح منه مجموع الأعداد المعلومة.'),
        W(M0, plain, 'المتوسط ليس بالضرورة هو العدد الناقص.'),
        W(Math.abs(sum - (cnum - 1) * M0), plain, null),
        W(miss + cnum, plain, null),
        W(miss + 3, plain, null),
      ],
      solution: [`مجموع الأعداد كلها = ${cnum} × ${M0} = ${cnum * M0}`, `مجموع المعلومة = ${sum}`, `العدد الباقي = ${cnum * M0} − ${sum} = ${miss}`],
      alt: { title: 'المتوسط يعطيك المجموع', body: `المتوسط × عدد الأعداد = المجموع الكلي (${cnum * M0}). ما بقي بعد طرح المعلوم هو العدد المطلوب.` },
      check: () => {
        for (let x = 1; x < 5000; x++) if ((sum + x) / cnum === M0) return plain(x);
        return null;
      },
    };
  },
];

// ---------- ratio ----------
V.ratio = [
  // workers - days (inverse)
  (r, d) => {
    const pool = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15];
    let w1, w2, d1;
    do {
      w1 = pick(r, pool); w2 = pick(r, pool);
      d1 = (w2 / gcd(w1, w2)) * ri(r, 1, 3);
    } while (w1 === w2 || d1 > 40 || (w1 * d1) / w2 === d1);
    const c = (w1 * d1) / w2;
    const job = pick(r, ['دهان جدار', 'حفر خندق', 'بناء سور', 'تعبئة مخزن']);
    return {
      kind: 'mcq',
      difficulty: Math.max(d, 2),
      stem: `${w1} عمال ينجزون عملاً (${job}) في ${days(d1)}. كم يوماً يحتاج ${w2} عمال لإنجاز العمل نفسه؟`,
      correct: days(c),
      wrong: [
        W((d1 * w2) / w1, (v) => days(Number(v.toFixed(2))), w2 > w1 ? 'ضربتَ بدل أن تقسم. زيادة العمال تُقلّل الأيام، فالجواب أصغر من ' + d1 + '.' : 'قسمتَ بالمقلوب. تقليل العمال يزيد الأيام، فالجواب أكبر من ' + d1 + '.'),
        W(d1 + (w2 - w1), days, 'عاملتَ المسألة كأنها جمع وطرح. العلاقة هنا عكسية وتُحل بالضرب والقسمة.'),
        W(d1 - (w2 - w1), days, 'عاملتَ المسألة كأنها جمع وطرح. العلاقة هنا عكسية وتُحل بالضرب والقسمة.'),
        W(c + 2, days, null),
        W(c + 1, days, null),
        W(c * 2, days, null),
      ],
      solution: [`حجم العمل = ${w1} × ${d1} = ${w1 * d1} عامل-يوم`, `الأيام المطلوبة = ${w1 * d1} ÷ ${w2} = ${c}`],
      alt: { title: w2 > w1 ? 'كلما زاد العمال قلّت الأيام' : 'كلما قلّ العمال زادت الأيام', body: `عدد العمال صار ${N(w2 / w1)} مثل القديم، فالأيام تصبح ${N(w1 / w2)} من القديمة: ${d1} × ${w1} ÷ ${w2} = ${c}.` },
      check: () => {
        const total = w1 * d1;
        for (let x = 1; x < 1000; x++) if (w2 * x === total) return days(x);
        return null;
      },
    };
  },
  // simple (direct) proportion
  (r, d) => {
    const item = pick(r, ['دفاتر', 'أقلام', 'كتب', 'علب عصير']);
    let a, c;
    do { a = ri(r, 3, 10); c = ri(r, 3, 10); } while (a === c);
    const u = ri(r, 2, d === 1 ? 6 : 12);
    const b = a * u;
    const cc = c * u;
    return {
      kind: 'mcq',
      stem: `إذا كان ثمن ${a} ${item} هو ${riyal(b)}، فكم ثمن ${c} ${item} من النوع نفسه؟`,
      correct: riyal(cc),
      wrong: [
        W(b + (c - a), riyal, 'جمعتَ الفرق في العدد إلى الثمن. العلاقة تناسب: الثمن يتغير بالضرب وليس بالجمع.'),
        W(b * c, riyal, 'ضربتَ الثمن في العدد الجديد دون أن تحسب سعر القطعة الواحدة.'),
        W(u, riyal, 'هذا سعر القطعة الواحدة فقط.'),
        W(cc + u, riyal, null),
        W(cc - u, riyal, null),
      ],
      solution: [`سعر القطعة الواحدة = ${b} ÷ ${a} = ${u}`, `ثمن ${c} = ${c} × ${u} = ${cc}`],
      alt: { title: 'سعر الواحدة أولاً', body: `اعرف ثمن قطعة واحدة (${u}) ثم اضربه في العدد المطلوب (${c}).` },
      check: () => riyal((b / a) * c),
    };
  },
];

// ---------- pow ----------
const pw = (a, e) => `$ ${a}^{${e}} $`;
V.pow = [
  // same base multiply / divide (as a power)
  (r, d) => {
    const a = pick(r, [2, 3, 5, 7, 10]);
    const mul = r() < 0.5;
    let m, n;
    if (mul) { m = ri(r, 2, 9); n = ri(r, 2, 9); }
    else { n = ri(r, 2, 6); m = n + ri(r, 2, 6); }
    const e = mul ? m + n : m - n;
    const op = mul ? '×' : '÷';
    return {
      kind: 'mcq',
      stem: `ما قيمة $ ${a}^{${m}} ${op} ${a}^{${n}} $ ؟`,
      correct: pw(a, e),
      wrong: [
        [pw(a, mul ? m * n : m / n), mul ? 'هذا ناتج ضرب الأسس. عند ضرب قوى لها الأساس نفسه تُجمع الأسس.' : 'قسمتَ الأسس. عند قسمة قوى لها الأساس نفسه تُطرح الأسس.'],
        [pw(a, mul ? m - n : m + n), mul ? 'طرحتَ الأسس، والطرح للقسمة. الضرب يعني جمع الأسس.' : 'جمعتَ الأسس، والجمع للضرب. القسمة تعني طرح الأسس.'],
        [pw(a * a, e), 'الأساس لا يتغير عند ضرب القوى أو قسمتها.'],
        [pw(2 * a, e), 'الأساس لا يتغير.'],
        [pw(a, e + 1), null],
        [pw(a, e - 1), null],
      ].map((x) => (x[0].includes('.') || x[0].includes('{0}') || x[0].includes('{-') ? null : x)),
      solution: [`الأساس واحد، فنـ${mul ? 'جمع' : 'طرح'} الأسس: ${m} ${mul ? '+' : '−'} ${n} = ${e}`, `الناتج $ ${a}^{${e}} $`],
      alt: { title: 'اكتبها مفكوكة', body: mul ? `${a} مضروبة في نفسها ${m} مرات، ثم ${n} مرات أخرى. عدد المرات كلها ${m + n}.` : `من ${m} عاملاً ${a} نشطب ${n} عاملاً، يبقى ${m - n}.` },
      check: () => {
        const vals = [m, n].map((p) => BigInt(a) ** BigInt(p));
        const res = mul ? vals[0] * vals[1] : vals[0] / vals[1];
        for (let x = 0; x < 40; x++) if (BigInt(a) ** BigInt(x) === res) return pw(a, x);
        return null;
      },
    };
  },
  // numeric value of a division / multiplication of same-base powers
  (r, d) => {
    const a = pick(r, [2, 3, 5]);
    const n = ri(r, 2, 4), m = n + ri(r, 2, 3);
    const e = m - n;
    const c = a ** e;
    return {
      kind: 'mcq',
      stem: `ما قيمة $ ${a}^{${m}} ÷ ${a}^{${n}} $ ؟`,
      correct: plain(c),
      wrong: [
        W(e * a, plain, 'ضربتَ الأساس في الفرق بين الأسس بدل أن ترفعه إلى هذا الفرق.'),
        W(a ** (e + 1), plain, null),
        W(a ** (e - 1), plain, null),
        W(a ** (m + n), plain, 'جمعتَ الأسس، والقسمة تعني طرحها.'),
        W(a * a * e, plain, null),
      ],
      solution: [`نطرح الأسس: ${m} − ${n} = ${e}`, `$ ${a}^{${e}} = ${c} $`],
      alt: { title: 'احسب كل قوة', body: `${a}^${m} = ${a ** m} و ${a}^${n} = ${a ** n}. القسمة: ${a ** m} ÷ ${a ** n} = ${c}.` },
      check: () => plain(a ** m / a ** n),
    };
  },
  // compare a^b vs b^a
  (r, d) => {
    let a, b;
    const eqCase = r() < 0.2;
    if (eqCase) { a = 2; b = 4; } else { do { a = ri(r, 2, d === 1 ? 5 : 8); b = ri(r, 2, d === 1 ? 5 : 8); } while (a === b || (a * b === 8 && a + b === 6)); }
    if (r() < 0.5) [a, b] = [b, a];
    const x = BigInt(a) ** BigInt(b), y = BigInt(b) ** BigInt(a);
    return {
      kind: 'compare',
      a: pw(a, b),
      b: pw(b, a),
      answer: x > y ? 0 : x < y ? 1 : 2,
      solution: [`${a}^${b} = ${x}`, `${b}^${a} = ${y}`, x > y ? 'الأولى أكبر' : x < y ? 'الثانية أكبر' : 'متساويتان'],
      alt: { title: 'احسبهما فعلاً', body: 'لا تُخمّن من شكل الأعداد؛ القاعدة "الأساس الأكبر أكبر" قد تخذلك. احسب كلاً منهما.' },
      check: () => {
        const l1 = b * Math.log(a), l2 = a * Math.log(b);
        return Math.abs(l1 - l2) < 1e-9 ? 2 : l1 > l2 ? 0 : 1;
      },
    };
  },
];

// ---------- roots ----------
const SQ = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];
const rt = (A) => `√${A}`;
const iroot = (A) => Math.round(Math.sqrt(A));
V.roots = [
  // combine roots of perfect squares
  (r, d) => {
    const pool = d === 1 ? SQ.slice(0, 7) : SQ;
    let A, B;
    do { A = pick(r, pool); B = pick(r, pool); } while (A === B);
    const op = pick(r, ['+', '+', '×', '−']);
    if (op === '−' && A < B) [A, B] = [B, A];
    const p = iroot(A), q = iroot(B);
    const c = op === '+' ? p + q : op === '−' ? p - q : p * q;
    const sq = (v) => N2(Math.sqrt(v));
    const inner = op === '+' ? A + B : op === '−' ? A - B : A * B;
    const trapMsg = op === '×' ? null : `هذا ${'√'}(${A} ${op} ${B}). الجذر لا يوزَّع على ${op === '+' ? 'الجمع' : 'الطرح'}: احسب كل جذر وحده ثم ${op === '+' ? 'اجمع' : 'اطرح'}.`;
    return {
      kind: 'mcq',
      stem: `ما قيمة $ ${rt(A)} ${op} ${rt(B)} $ ؟`,
      correct: plain(c),
      wrong: [
        op === '×' ? W(iroot(A) + iroot(B), plain, 'جمعتَ الجذرين بدل ضربهما.') : W(Math.sqrt(inner), sq, trapMsg),
        W(op === '+' ? p * q : p + q, plain, 'استخدمتَ عملية غير المطلوبة بين الجذرين.'),
        W(op === '×' ? A * B / 10 : A + B, plain, op === '×' ? null : 'جمعتَ العددين تحت الجذر دون أخذ الجذر.'),
        W(c + 1, plain, null),
        W(c + 2, plain, null),
        W(c - 1, plain, null),
      ],
      solution: [`${rt(A)} = ${p}`, `${rt(B)} = ${q}`, `${p} ${op} ${q} = ${c}`],
      alt: { title: 'اجذر كل واحد وحده', body: 'الجذر لا يوزَّع على الجمع ولا على الطرح. احسب كل جذر بمفرده ثم نفّذ العملية على الناتجين.' },
      check: () => {
        const x = Math.sqrt(A), y = Math.sqrt(B);
        return plain(op === '+' ? x + y : op === '−' ? x - y : x * y);
      },
    };
  },
  // sqrt of a sum of squares (trap)
  (r, d) => {
    const pairs = [[9, 16], [36, 64], [25, 144], [64, 225], [81, 144], [16, 9], [144, 25], [100, 576]];
    const [A, B] = pick(r, d === 1 ? pairs.slice(0, 3) : pairs);
    const c = iroot(A + B);
    return {
      kind: 'mcq',
      stem: `ما قيمة $ √(${A} + ${B}) $ ؟`,
      correct: plain(c),
      wrong: [
        W(iroot(A) + iroot(B), plain, `هذا √${A} + √${B}. الجذر لا يوزَّع على الجمع، فاجمع ما تحت الجذر أولاً.`),
        W(A + B, plain, 'هذا المجموع تحت الجذر. بقي أخذ الجذر التربيعي.'),
        W(c + 1, plain, null),
        W(c + 2, plain, null),
        W(c - 1, plain, null),
      ],
      solution: [`اجمع ما تحت الجذر أولاً: ${A} + ${B} = ${A + B}`, `√${A + B} = ${c}`],
      alt: { title: 'الجذر بعد الجمع', body: 'القوسان يعنيان أن الجمع يتم أولاً ثم الجذر. وجذر المجموع لا يساوي مجموع الجذور.' },
      check: () => {
        for (let x = 1; x < 100; x++) if (x * x === A + B) return plain(x);
        return null;
      },
    };
  },
  // sqrt of a product
  (r, d) => {
    const pairs = [[2, 8], [3, 12], [5, 20], [2, 18], [8, 32], [12, 27], [2, 50], [3, 48]];
    const [a, b] = pick(r, pairs);
    const c = iroot(a * b);
    return {
      kind: 'mcq',
      stem: `ما قيمة $ √${a} × √${b} $ ؟`,
      correct: plain(c),
      wrong: [
        W((a + b) / 2, plain, 'هذا المتوسط الحسابي للعددين وليس حاصل ضرب جذريهما.'),
        W(a * b, plain, 'هذا حاصل ضرب العددين. بقي أخذ الجذر التربيعي.'),
        W(a + b, plain, null),
        W(c + 1, plain, null),
        W(c + 2, plain, null),
      ],
      solution: [`√${a} × √${b} = √(${a} × ${b}) = √${a * b}`, `√${a * b} = ${c}`],
      alt: { title: 'اجمع الجذرين تحت جذر واحد', body: `حاصل ضرب جذرين يساوي جذر حاصل الضرب: ${a} × ${b} = ${a * b}، وجذره ${c}.` },
      check: () => {
        const v = Math.sqrt(a) * Math.sqrt(b);
        return plain(Math.round(v * 1e6) / 1e6);
      },
    };
  },
];

// ---------- angles ----------
const POLY = { 5: 'خماسي', 6: 'سداسي', 7: 'سباعي', 8: 'ثماني', 9: 'تساعي', 10: 'عشاري' };
V.angles = [
  // third angle of a triangle
  (r, d) => {
    let a, b;
    do { a = ri(r, 20, 90); b = ri(r, 20, 90); if (d === 1) { a = Math.round(a / 5) * 5; b = Math.round(b / 5) * 5; } } while (a + b > 160 || a + b < 40);
    const c = 180 - a - b;
    return {
      kind: 'mcq',
      stem: `في مثلث زاويتان قياسهما ${a}° و${b}°. كم قياس الزاوية الثالثة؟`,
      correct: deg(c),
      wrong: [
        W(a + b, deg, `هذا مجموع الزاويتين (${a}+${b}). المطلوب ما يكمل المجموع إلى 180.`),
        W(360 - a - b, deg, 'مجموع زوايا المثلث 180° وليس 360° (360° للشكل الرباعي).'),
        W(90 - (a + b) + 90 + 10, deg, null),
        W(c + 10, deg, null),
        W(c - 10, deg, null),
      ],
      solution: ['مجموع زوايا المثلث 180°', `180 − (${a} + ${b}) = ${c}`],
      alt: { title: 'ما تبقى من 180', body: 'ابدأ بـ 180 واطرح الزاويتين المعلومتين، فما تبقى هو الثالثة.' },
      check: () => deg([a, b].reduce((p, q) => p - q, 180)),
    };
  },
  // straight line / isosceles
  (r, d) => {
    if (r() < 0.5) {
      let a;
      do { a = ri(r, 20, 160); a = d === 1 ? Math.round(a / 5) * 5 : a; } while (a === 90 || a === 180 || a < 15);
      const c = 180 - a;
      return {
        kind: 'mcq',
        stem: `زاويتان متجاورتان على مستقيم واحد، قياس إحداهما ${a}°. كم قياس الأخرى؟`,
        correct: deg(c),
        wrong: [
          W(90 - a, deg, 'هذا مكمّل الزاوية إلى 90° (متتامتان). على المستقيم المجموع 180°.'),
          W(360 - a, deg, 'مجموع الزوايا على المستقيم 180° وليس 360°.'),
          W(a, deg, null),
          W(c + 10, deg, null),
          W(c - 10, deg, null),
        ],
        solution: ['الزاويتان المتجاورتان على مستقيم مجموعهما 180°', `180 − ${a} = ${c}`],
        alt: { title: 'نصف دورة', body: 'المستقيم يمثل نصف دورة كاملة أي 180°. اطرح الزاوية المعلومة من 180.' },
        check: () => deg(Array.from({ length: 180 }, (_, i) => i + 1).find((x) => x + a === 180)),
      };
    }
    const base = ri(r, 3, 17) * 5;
    const apex = 180 - 2 * base;
    if (apex <= 0) throw new Error('bad');
    return {
      kind: 'mcq',
      stem: `مثلث متساوي الساقين، قياس زاوية رأسه ${apex}°. كم قياس كل من زاويتي القاعدة؟`,
      correct: deg(base),
      wrong: [
        W(180 - apex, deg, 'هذا مجموع زاويتي القاعدة معاً. المطلوب قياس كل واحدة منهما.'),
        W(apex, deg, null),
        W(base + 10, deg, null),
        W((180 - apex) / 2 + 5, deg, null),
        W(base - 5, deg, null),
      ],
      solution: [`مجموع زاويتي القاعدة = 180 − ${apex} = ${180 - apex}`, `زاويتا القاعدة متساويتان: ${180 - apex} ÷ 2 = ${base}`],
      alt: { title: 'قسمة الباقي', body: 'زاويتا القاعدة في المثلث المتساوي الساقين متساويتان. اطرح زاوية الرأس من 180 ثم اقسم الباقي على 2.' },
      check: () => {
        for (let x = 1; x < 90; x++) if (2 * x + apex === 180) return deg(x);
        return null;
      },
    };
  },
  // polygon angle sum
  (r, d) => {
    const n = ri(r, 5, 10);
    const c = (n - 2) * 180;
    return {
      kind: 'mcq',
      stem: `ما مجموع قياسات الزوايا الداخلية في مضلع ${POLY[n]} (له ${n} أضلاع)؟`,
      correct: deg(c),
      wrong: [
        W(n * 180, deg, 'ضربتَ عدد الأضلاع في 180°. المضلع يُقسَّم إلى (ن − 2) مثلثاً.'),
        W((n - 1) * 180, deg, 'عدد المثلثات داخل المضلع هو ن − 2 وليس ن − 1.'),
        W(360, deg, 'هذا مجموع الزوايا الخارجية دائماً وليس الداخلية.'),
        W((n - 2) * 90, deg, null),
        W((n - 3) * 180, deg, null),
      ],
      solution: [`نقسّم المضلع بأقطار من رأس واحد إلى ${n} − 2 = ${n - 2} مثلثات`, `المجموع = ${n - 2} × 180 = ${c}`],
      alt: { title: 'عدّ المثلثات', body: `ارسم أقطاراً من رأس واحد: تحصل على ${n - 2} مثلثات، كل منها 180°.` },
      check: () => deg(n * 180 - 360),
    };
  },
  // one angle of a regular polygon
  (r, d) => {
    const n = pick(r, [5, 6, 8, 9, 10, 12]);
    const c = ((n - 2) * 180) / n;
    return {
      kind: 'mcq',
      difficulty: Math.max(2, d),
      stem: `ما قياس كل زاوية داخلية في مضلع منتظم له ${n} أضلاع؟`,
      correct: deg(c),
      wrong: [
        W(360 / n, deg, 'هذه الزاوية الخارجية. الداخلية تكمّلها إلى 180°.'),
        W((n - 2) * 180, deg, 'هذا مجموع الزوايا كلها. اقسمه على عدد الزوايا.'),
        W(180 - c + 10, deg, null),
        W(c + 10, deg, null),
        W(c - 10, deg, null),
      ],
      solution: [`المجموع = (${n} − 2) × 180 = ${(n - 2) * 180}`, `الزوايا متساوية: ${(n - 2) * 180} ÷ ${n} = ${N(c)}`],
      alt: { title: 'من الزاوية الخارجية', body: `الزاوية الخارجية = 360 ÷ ${n} = ${360 / n}°، والداخلية = 180 − ${360 / n} = ${N(c)}°.` },
      check: () => deg(180 - 360 / n),
    };
  },
];

// ---------- quad ----------
V.quad = [
  // rectangle perimeter or area
  (r, d) => {
    let l = ri(r, 5, d === 1 ? 12 : 25), w = ri(r, 2, 4 + 4 * d);
    if (w >= l) l = w + ri(r, 1, 5);
    const ask = r() < 0.5 ? 'p' : 'a';
    if (ask === 'p') {
      const c = 2 * (l + w);
      return {
        kind: 'mcq',
        stem: `مستطيل طوله ${l} سم وعرضه ${w} سم. ما محيطه؟`,
        correct: cm(c),
        wrong: [
          W(l * w, cm, `هذه مساحة المستطيل (${l}×${w}). المحيط هو مجموع أطوال الأضلاع.`),
          W(l + w, cm, 'هذا نصف المحيط فقط. للمستطيل أربعة أضلاع.'),
          W(2 * l + w, cm, 'نسيتَ ضلعاً: للمستطيل ضلعان بطول الطول وضلعان بطول العرض.'),
          W(c + 4, cm, null),
          W(c - 2, cm, null),
        ],
        solution: ['المحيط = 2 × (الطول + العرض)', `2 × ${l + w} = ${c}`],
        alt: { title: 'تمشَّ حول المستطيل', body: `ضلعان من ${l} وضلعان من ${w}: ${l}+${l}+${w}+${w} = ${c}.` },
        check: () => cm([l, w, l, w].reduce((p, q) => p + q, 0)),
      };
    }
    const c = l * w;
    return {
      kind: 'mcq',
      stem: `مستطيل طوله ${l} سم وعرضه ${w} سم. ما مساحته؟`,
      correct: cm2(c),
      wrong: [
        W(2 * (l + w), cm2, `هذا المحيط. المساحة = الطول × العرض.`),
        W(l + w, cm2, 'جمعتَ البعدين بدل ضربهما.'),
        W(l * l, cm2, null),
        W(c + w, cm2, null),
        W(c - l, cm2, null),
      ],
      solution: ['المساحة = الطول × العرض', `${l} × ${w} = ${c}`],
      alt: { title: 'عدّ المربعات', body: `ارسم المستطيل بمربعات وحدتها 1 سم: ${w} صفوف في كل صف ${l} مربعات، فالمجموع ${c}.` },
      check: () => cm2(Array.from({ length: w }, () => l).reduce((p, q) => p + q, 0)),
    };
  },
  // missing side from perimeter
  (r, d) => {
    const w = ri(r, 3, 12), l = w + ri(r, 1, 10);
    const P = 2 * (l + w);
    return {
      kind: 'mcq',
      difficulty: Math.max(d, 2),
      stem: `محيط مستطيل ${P} سم وطوله ${l} سم. كم عرضه؟`,
      correct: cm(w),
      wrong: [
        W(P / 2, cm, 'هذا مجموع الطول والعرض. اطرح منه الطول.'),
        W(P - l, cm, 'طرحتَ الطول مرة واحدة من المحيط كله. المحيط يتضمن ضلعين من كل بُعد.'),
        W(P / 2 - l + 2, cm, null),
        W(w + 3, cm, null),
        W((P - l) / 2, cm, 'طرحتَ الطول مرة واحدة فقط من المحيط ثم قسمتَ.'),
      ],
      solution: [`الطول + العرض = ${P} ÷ 2 = ${P / 2}`, `العرض = ${P / 2} − ${l} = ${w}`],
      alt: { title: 'نصف المحيط', body: 'نصف المحيط يساوي الطول + العرض. اطرح الطول المعلوم لتحصل على العرض.' },
      check: () => {
        for (let x = 1; x < 500; x++) if (2 * (l + x) === P) return cm(x);
        return null;
      },
    };
  },
  // square: area <-> perimeter
  (r, d) => {
    const s = ri(r, 3, d === 1 ? 10 : 20);
    if (r() < 0.5) {
      const A = s * s;
      return {
        kind: 'mcq',
        stem: `مربع مساحته ${A} سم². ما محيطه؟`,
        correct: cm(4 * s),
        wrong: [
          W(s, cm, 'هذا طول الضلع فقط. المحيط أربعة أضلاع.'),
          W(A / 4, cm, 'قسمتَ المساحة على 4 بدل أخذ الجذر لإيجاد الضلع.'),
          W(2 * s, cm, 'هذا نصف المحيط.'),
          W(4 * s + 4, cm, null),
          W(A * 4, cm, null),
        ],
        solution: [`الضلع = √${A} = ${s}`, `المحيط = 4 × ${s} = ${4 * s}`],
        alt: { title: 'ابحث عن الضلع أولاً', body: `أي عدد إذا ضُرب في نفسه يعطي ${A}؟ إنه ${s}. ثم المحيط أربعة أضلاع.` },
        check: () => {
          for (let x = 1; x < 200; x++) if (x * x === A) return cm(4 * x);
          return null;
        },
      };
    }
    const P = 4 * s;
    return {
      kind: 'mcq',
      stem: `مربع محيطه ${P} سم. ما مساحته؟`,
      correct: cm2(s * s),
      wrong: [
        W(s, cm2, 'هذا طول الضلع. المساحة = الضلع × الضلع.'),
        W(P * P, cm2, null),
        W(2 * s, cm2, null),
        W(P * s / 2, cm2, null),
        W(s * s + s, cm2, null),
      ],
      solution: [`الضلع = ${P} ÷ 4 = ${s}`, `المساحة = ${s} × ${s} = ${s * s}`],
      alt: { title: 'الضلع ثم المساحة', body: 'المربع أضلاعه الأربعة متساوية، فالضلع ربع المحيط، والمساحة مربع الضلع.' },
      check: () => {
        for (let x = 1; x < 200; x++) if (4 * x === P) return cm2(x * x);
        return null;
      },
    };
  },
];

// ---------- circle ----------
const pickPi = (r) => (r() < 0.5 ? { n: 22, dd: 7, v: 22 / 7, txt: '(استخدم $ π = {22|7} $)', mult: 7 } : { n: 314, dd: 100, v: 3.14, txt: '(استخدم π = 3.14)', mult: 1 });
V.circle = [
  // circumference
  (r, d) => {
    const pi = pickPi(r);
    const rad = pi.mult * ri(r, 1, pi.mult === 7 ? 4 : 12);
    const useD = r() < 0.4;
    const given = useD ? 2 * rad : rad;
    const c = (2 * pi.n * rad) / pi.dd;
    const area = (pi.n * rad * rad) / pi.dd;
    return {
      kind: 'mcq',
      stem: `ما محيط دائرة ${useD ? 'قطرها' : 'نصف قطرها'} ${given} سم؟ ${pi.txt}`,
      correct: cm(c),
      wrong: [
        W(area, cm, 'هذه مساحة الدائرة (π × نق²). المحيط = 2 × π × نق.'),
        W(c / 2, cm, useD ? 'نسيتَ أن المحيط = π × القطر كاملاً.' : 'نسيتَ مضاعفة نصف القطر: المحيط = 2 × π × نق.'),
        W(c * 2, cm, null),
        W(c + 2 * rad / 2 + 1, cm, null),
        W(c - 4, cm, null),
      ],
      solution: useD ? ['المحيط = π × القطر', `${pi.mult === 7 ? '22/7' : '3.14'} × ${given} = ${N(c)}`] : ['المحيط = 2 × π × نق', `2 × ${pi.mult === 7 ? '22/7' : '3.14'} × ${rad} = ${N(c)}`],
      alt: { title: 'القطر × π', body: `المحيط يساوي القطر (${2 * rad}) مضروباً في π تقريباً، أي ${N(c)} سم.` },
      check: () => cm(pi.v * 2 * rad),
    };
  },
  // area
  (r, d) => {
    const pi = pickPi(r);
    const rad = pi.mult * ri(r, 1, pi.mult === 7 ? 3 : 10);
    const area = (pi.n * rad * rad) / pi.dd;
    return {
      kind: 'mcq',
      difficulty: Math.max(d, 2),
      stem: `ما مساحة دائرة نصف قطرها ${rad} سم؟ ${pi.txt}`,
      correct: cm2(area),
      wrong: [
        W((2 * pi.n * rad) / pi.dd, cm2, 'هذا المحيط (2 × π × نق). المساحة = π × نق × نق.'),
        W((pi.n * rad) / pi.dd, cm2, 'نسيتَ تربيع نصف القطر: المساحة = π × نق².'),
        W((pi.n * (2 * rad) ** 2) / pi.dd, cm2, 'استخدمتَ القطر مكان نصف القطر.'),
        W(area + rad, cm2, null),
        W(area - rad, cm2, null),
      ],
      solution: ['المساحة = π × نق²', `${pi.mult === 7 ? '22/7' : '3.14'} × ${rad} × ${rad} = ${N(area)}`],
      alt: { title: 'نق مضروباً في نفسه', body: `اضرب نصف القطر في نفسه أولاً: ${rad} × ${rad} = ${rad * rad}، ثم في π.` },
      check: () => cm2(pi.v * rad * rad),
    };
  },
  // radius from circumference
  (r, d) => {
    const pi = pickPi(r);
    const rad = pi.mult * ri(r, 1, pi.mult === 7 ? 4 : 12);
    const c = (2 * pi.n * rad) / pi.dd;
    return {
      kind: 'mcq',
      difficulty: Math.max(d, 2),
      stem: `محيط دائرة ${N(c)} سم. كم طول نصف قطرها؟ ${pi.txt}`,
      correct: cm(rad),
      wrong: [
        W(2 * rad, cm, 'هذا القطر. نصف القطر نصفه.'),
        W(c / pi.v / 4, cm, null),
        W(rad + 1, cm, null),
        W(c / 2, cm, 'قسمتَ المحيط على 2 فقط دون القسمة على π.'),
        W(rad * 2 + 2, cm, null),
      ],
      solution: ['المحيط = 2 × π × نق', `نق = ${N(c)} ÷ (2 × ${pi.mult === 7 ? '22/7' : '3.14'}) = ${rad}`],
      alt: { title: 'اقسم على π ثم على 2', body: `القطر = المحيط ÷ π = ${2 * rad}، ونصف القطر نصفه = ${rad}.` },
      check: () => {
        for (let x = 1; x < 500; x++) if (Math.abs(2 * pi.v * x - c) < 1e-6) return cm(x);
        return null;
      },
    };
  },
];

// ---------- build / generate ----------
function build(topic, d, spec, r) {
  const q = {
    id: 'GEN-' + r().toString(36).slice(2, 10).padEnd(8, '0'),
    status: 'generated',
    source: { kind: 'generator', note: 'سؤال مولَّد آلياً — يحتاج مراجعة الأستاذ' },
    topic,
  };
  if (spec.kind === 'compare') {
    q.type = 'compare';
    if (spec.stem) q.stem = spec.stem;
    q.a = spec.a;
    q.b = spec.b;
    q.answer = spec.answer;
    q.traps = spec.traps || {};
  } else {
    if (!spec.correct) throw new Error('no correct');
    const seen = new Set([spec.correct]);
    const ws = [];
    for (const w of spec.wrong) {
      if (!w || !w[0] || seen.has(w[0])) continue;
      seen.add(w[0]);
      ws.push(w);
    }
    const take = [...shuffle(r, ws.filter((w) => w[1])), ...shuffle(r, ws.filter((w) => !w[1]))].slice(0, 3);
    if (take.length < 3) throw new Error('not enough distractors');
    const items = shuffle(r, [[spec.correct, null], ...take]);
    q.type = 'mcq';
    q.stem = spec.stem;
    q.options = items.map((x) => x[0]);
    q.answer = items.findIndex((x) => x[0] === spec.correct);
    q.traps = {};
    items.forEach((x, i) => { if (x[1]) q.traps[i] = x[1]; });
  }
  q.difficulty = d;
  q.solution = spec.solution;
  q.alt = spec.alt;
  q.updatedAt = Date.now();
  Object.defineProperty(q, '__check', { value: spec.check, enumerable: false });
  return q;
}

export const GENERATABLE = Object.keys(V);

export function generate(topic, difficulty = 1, rng = Math.random) {
  const list = V[topic];
  if (!list) throw new Error(`generate: unsupported topic "${topic}"`);
  const d = Math.min(3, Math.max(1, Math.round(difficulty) || 1));
  let last;
  for (let i = 0; i < 60; i++) {
    try {
      return build(topic, d, pick(rng, list)(rng, d), rng);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
