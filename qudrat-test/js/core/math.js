/**
 * Lightweight rich text for Arabic questions.
 *   $ ... $      -> LTR math span
 *   {a|b}        -> stacked fraction (inside math)
 *   √{x}         -> square root with overline
 *   ^{x}         -> superscript (inside math)
 * Input is escaped first, so author content can never inject HTML.
 * Later phase: swap the internals for KaTeX without touching callers.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function mathPart(s) {
  return s
    .replace(/\{([^{}|]+)\|([^{}|]+)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>')
    .replace(/√\{([^{}]+)\}/g, '<span class="rad">√<span class="radin">$1</span></span>')
    .replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
}

export function rich(text = '') {
  return esc(text)
    .split('$')
    .map((seg, i) => (i % 2 ? `<span class="mx">${mathPart(seg)}</span>` : seg.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>').replace(/√\{([^{}]+)\}/g, '<span class="rad">√<span class="radin">$1</span></span>')))
    .join('')
    .replace(/\n/g, '<br>');
}
