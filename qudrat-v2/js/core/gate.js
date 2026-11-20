/**
 * Soft access gate for the review build: asks for a PIN before anything loads.
 * Only a salted SHA-256 of the PIN is stored here. This keeps casual visitors out;
 * it is not real security (files stay reachable by direct URL).
 */
const HASH = '09e78ff5f725250cbda3561366a492ad069dd3eeb00d7ac75913038101f63a0c';
const KEY = 'qk_access';
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const ls = (v) => { try { return v === undefined ? localStorage.getItem(KEY) : localStorage.setItem(KEY, v); } catch (e) { return null; } };

export async function ensureAccess() {
  if (ls() === HASH) return;
  await new Promise((done) => {
    const st = document.createElement('style');
    st.textContent = `
    .gate{position:fixed;inset:0;z-index:99999;background:#EEF4F4;display:grid;place-items:center;padding:20px;font-family:'IBM Plex Sans Arabic','Segoe UI',Tahoma,sans-serif;color:#0C3640;direction:rtl}
    @media (prefers-color-scheme:dark){.gate{background:#0E1D20;color:#E7F1F2}.gate form{background:#15292E!important;border-color:#27434A!important}.gate input{background:#0E1D20!important;color:#E7F1F2!important;border-color:#27434A!important}.gate small{color:#A5BFC3!important}}
    .gate form{background:#fff;border:1px solid #D3E0E1;border-radius:20px;padding:24px;max-width:360px;width:100%;display:flex;flex-direction:column;gap:12px;text-align:center}
    .gate h1{margin:0;font-size:1.3rem;line-height:1.5}
    .gate input{font:inherit;font-size:1.4rem;letter-spacing:.4em;text-align:center;padding:10px;border-radius:12px;border:1px solid #D3E0E1;direction:ltr;width:100%}
    .gate input:focus-visible,.gate button:focus-visible{outline:3px solid #E8851A;outline-offset:2px}
    .gate button{font:inherit;font-weight:700;border:0;border-radius:99px;background:#0F6B78;color:#fff;padding:10px;cursor:pointer}
    .gate .err{color:#BE412B;min-height:1.5em;font-size:.9rem}
    .gate small{color:#456268}`;
    document.head.append(st);
    const box = document.createElement('div'); box.className = 'gate';
    box.innerHTML = '<form><h1>أفق قدرات كمي ولفظي</h1><small>نسخة للمراجعة. أدخل الرقم السري الذي وصلك مع الرابط.</small><input id="qk_pin" inputmode="numeric" autocomplete="off" maxlength="12" aria-label="الرقم السري"><div class="err" role="alert"></div><button type="submit">دخول</button><small>© 2026 أفق قدرات كمي ولفظي — بإشراف الأستاذ إبراهيم البربري</small></form>';
    document.body.append(box);
    const input = box.querySelector('input'), err = box.querySelector('.err');
    input.focus();
    box.querySelector('form').onsubmit = async (e) => {
      e.preventDefault();
      if ((await sha('qudrat-kammi:' + input.value.trim())) === HASH) { ls(HASH); box.remove(); done(); }
      else { err.textContent = 'الرقم غير صحيح'; input.select(); }
    };
  });
}
