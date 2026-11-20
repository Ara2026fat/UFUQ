/** Shows every Western digit (0-9) as Arabic-Indic (٠-٩) in visible text — the real exam uses Arabic digits.
 *  Works on rendered text nodes only (attributes, ids, inputs, scripts untouched), so data and logic stay untouched. */
const MAP = '٠١٢٣٤٥٦٧٨٩';
const RE = /[0-9]/g;
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE']);
const conv = (s) => s.replace(RE, (d) => MAP[+d]);
function walk(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (RE.test(n.nodeValue) && !SKIP.has(n.parentNode && n.parentNode.nodeName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  RE.lastIndex = 0;
  const list = []; while (w.nextNode()) { list.push(w.currentNode); RE.lastIndex = 0; }
  list.forEach((n) => { n.nodeValue = conv(n.nodeValue); });
}
export function arabize(root = document.body) {
  walk(root);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') { if (/[0-9]/.test(m.target.nodeValue) && !SKIP.has(m.target.parentNode?.nodeName)) m.target.nodeValue = conv(m.target.nodeValue); }
      else m.addedNodes.forEach((n) => { if (n.nodeType === 3) { if (/[0-9]/.test(n.nodeValue) && !SKIP.has(n.parentNode?.nodeName)) n.nodeValue = conv(n.nodeValue); } else if (n.nodeType === 1) walk(n); });
    }
  }).observe(root, { childList: true, subtree: true, characterData: true });
}
