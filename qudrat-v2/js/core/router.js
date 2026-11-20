/** Minimal hash router with params (:id) and query string. */
const routes = [];
let notFound = () => null;

export function route(pattern, view) {
  const keys = [];
  const rx = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '$');
  routes.push({ rx, keys, view, pattern });
}
export const setNotFound = (fn) => { notFound = fn; };

export function parse() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs = ''] = raw.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  for (const r of routes) {
    const m = path.match(r.rx);
    if (m) return { path, query, params: Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])), view: r.view };
  }
  return { path, query, params: {}, view: notFound };
}

export const go = (to) => { location.hash = '#' + to; };
export const onRoute = (fn) => { addEventListener('hashchange', fn); };
