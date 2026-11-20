// العدد والمعدود في العربية: ٣–١٠ جمع، وما بعد العشرة مفرد منصوب (١٥ سؤالاً).
const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
function fmt(n, one, two, twoAcc, few, many, acc) {
  n = Math.abs(Math.round(Number(n) || 0));
  if (n === 0) return `لا ${few}`;
  if (n === 1) return one;
  if (n === 2) return acc ? twoAcc : two;
  if (n <= 10) return `${AR(n)} ${few}`;
  return `${AR(n)} ${many}`;
}
/** سؤال: ١ سؤال واحد، ٢ سؤالان، ٥ أسئلة، ١٥ سؤالاً (acc=true للمنصوب: سؤالين) */
export const qn = (n, acc = false) => fmt(n, 'سؤال واحد', 'سؤالان', 'سؤالين', 'أسئلة', 'سؤالاً', acc);
/** دقيقة: ١ دقيقة واحدة، ٢ دقيقتان، ٥ دقائق، ٢٥ دقيقة */
export const mn = (n, acc = false) => fmt(n, 'دقيقة واحدة', 'دقيقتان', 'دقيقتين', 'دقائق', 'دقيقة', acc);
