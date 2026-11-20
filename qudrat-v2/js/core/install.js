/** Install prompt: bottom bar. Android/Chrome uses the native prompt; iOS Safari shows Add-to-Home-Screen steps. */
const KEY = 'qk_install_dismissed_v3';
const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
const set = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* ignore */ } };
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function bar(text, actionLabel, onAction) {
  if (document.getElementById('qk-install')) return;
  const st = document.createElement('style');
  st.textContent = `#qk-install{position:fixed;inset-inline:12px;bottom:calc(var(--nav-h,64px) + var(--badge-h,0px) + env(safe-area-inset-bottom,0px) + 10px);z-index:70;max-width:460px;margin:auto;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:#0F6B78;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25);font:600 .92rem/1.5 inherit;direction:rtl}
#qk-install span{flex:1;min-width:0}#qk-install button{font:inherit;font-weight:800;border:0;border-radius:99px;padding:8px 16px;cursor:pointer;background:#fff;color:#0F6B78}
#qk-install .x{background:transparent;color:#fff;padding:6px 10px;font-size:1.1rem}#qk-install button:focus-visible{outline:3px solid #E8851A;outline-offset:2px}`;
  const el = document.createElement('div'); el.id = 'qk-install'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'تثبيت التطبيق');
  const t = document.createElement('span'); t.textContent = text;
  const close = document.createElement('button'); close.className = 'x'; close.textContent = '✕'; close.setAttribute('aria-label', 'إغلاق');
  close.onclick = () => { set(); el.remove(); };
  el.append(t);
  if (actionLabel) { const a = document.createElement('button'); a.textContent = actionLabel; a.onclick = async () => { await onAction(el); }; el.append(a); }
  el.append(close);
  document.head.append(st); document.body.append(el);
}

export function initInstall() {
  if (standalone() || get()) return;
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferred = e;
    bar('ثبّت التطبيق على جوالك ليفتح مثل أي تطبيق', 'تثبيت', async (el) => {
      deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; el.remove(); set();
    });
  });
  window.addEventListener('appinstalled', () => { document.getElementById('qk-install')?.remove(); set(); });
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) setTimeout(() => bar('للتثبيت: اضغط زر المشاركة ⬆︎ في Safari ثم «إضافة إلى الشاشة الرئيسية»', null), 2500);
}
