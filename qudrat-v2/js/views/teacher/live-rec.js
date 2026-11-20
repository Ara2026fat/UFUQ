/**
 * تسجيل الحصة فيديو: لوحة مركّبة (صفحة/سؤال + خط اليد) تُرسم ~30 إطارًا/ث ويُسجَّل معها صوت الميكروفون (اختياري).
 * المقاطع تُحفظ تباعًا في IndexedDB (لا نحمل ملفًا ضخمًا في الذاكرة)، وتُجمَّع عند الإنهاء.
 * ARAFAT ALRAJHI © 2026
 */
import { idbSet, idbGet, idbDel, idbKeys } from './live-store.js';

const MIMES = [
  ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'], ['video/mp4;codecs=avc1', 'mp4'], ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9,opus', 'webm'], ['video/webm;codecs=vp8,opus', 'webm'], ['video/webm', 'webm'],
];
export function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const [m, ext] of MIMES) { try { if (MediaRecorder.isTypeSupported(m)) return { mime: m, ext }; } catch (e) { /* التالي */ } }
  return { mime: '', ext: 'webm' };
}
export const recSupported = () => typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;

const FW = 900, FH = 1272; // إطار الفيديو (ورقة A4 عمودية)، أبعاد زوجية لـ H.264

/**
 * @param {{ sources: () => HTMLCanvasElement[], onTick?: (ms:number, paused:boolean)=>void, onEnded?: (res)=>void }} opt
 */
export function createRecorder(opt) {
  const frame = document.createElement('canvas'); frame.width = FW; frame.height = FH;
  const fx = frame.getContext('2d');
  const id = String(Date.now());
  const fmt = pickMime();
  let rec = null, stream = null, mic = null, drawT = null, tickT = null, wake = null;
  let mem = [], n = 0, persisted = true, bytes = 0;
  let t0 = 0, acc = 0, paused = false, state = 'idle', stopping = false, stopRes = null;

  const draw = () => {
    fx.fillStyle = '#fff'; fx.fillRect(0, 0, FW, FH);
    const cs = opt.sources();
    const b = cs[0]; if (!b || !b.width) return;
    const s = Math.min(FW / b.width, FH / b.height), w = b.width * s, h = b.height * s, x = (FW - w) / 2, y = (FH - h) / 2;
    for (const c of cs) fx.drawImage(c, x, y, w, h);
  };
  const elapsed = () => acc + (paused || !t0 ? 0 : Date.now() - t0);

  async function keepChunk(blob) {
    bytes += blob.size;
    if (persisted) { try { await idbSet(`rec:${id}:${String(n).padStart(6, '0')}`, blob); n++; return; } catch (e) { persisted = false; } }
    mem.push(blob); n++;
  }
  async function readAll() {
    const out = [];
    if (persisted) { const keys = (await idbKeys(`rec:${id}:`)).sort(); for (const k of keys) { const b = await idbGet(k); if (b) out.push(b); } }
    return out.concat(mem);
  }
  const cleanup = async () => {
    clearInterval(drawT); clearInterval(tickT); drawT = tickT = null;
    try { stream && stream.getTracks().forEach((t) => t.stop()); mic && mic.getTracks().forEach((t) => t.stop()); } catch (e) { /* */ }
    try { wake && wake.release(); } catch (e) { /* */ } wake = null;
    document.removeEventListener('visibilitychange', onVis);
  };
  async function getWake() { try { if (navigator.wakeLock && document.visibilityState === 'visible') wake = await navigator.wakeLock.request('screen'); } catch (e) { /* غير مدعوم */ } }
  function onVis() { if (document.visibilityState === 'visible' && state === 'recording') getWake(); }

  const api = {
    get state() { return state; }, get ext() { return fmt.ext; }, get mime() { return fmt.mime; }, get bytes() { return bytes; }, get micOn() { return !!mic; },
    elapsed,
    async start({ wantMic }) {
      stream = frame.captureStream(30);
      let micErr = null;
      if (wantMic && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); mic.getAudioTracks().forEach((t) => stream.addTrack(t)); }
        catch (e) { micErr = e; mic = null; }
      } else if (wantMic) micErr = new Error('no-mic-api');
      const o = { videoBitsPerSecond: 2500000, audioBitsPerSecond: 96000 }; if (fmt.mime) o.mimeType = fmt.mime;
      rec = new MediaRecorder(stream, o);
      const chain = []; // يضمن ترتيب حفظ المقاطع
      rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chain.push(keepChunk(ev.data)); };
      rec.onstop = async () => {
        await Promise.all(chain);
        const unexpected = !stopping; state = 'idle'; if (!paused && t0) acc += Date.now() - t0; t0 = 0;
        await cleanup();
        let res;
        try { const parts = await readAll(); res = { blob: new Blob(parts, { type: (rec.mimeType || fmt.mime || 'video/webm').split(';')[0] }), ext: fmt.ext, ms: acc, unexpected }; }
        catch (e) { res = { error: e, unexpected }; }
        if (persisted) { for (const k of await idbKeys(`rec:${id}:`)) await idbDel(k); await idbDel('rec:meta'); }
        if (stopRes) stopRes(res); else if (opt.onEnded) opt.onEnded(res);
      };
      rec.onerror = () => { /* onstop يتبعه عادةً */ };
      draw(); drawT = setInterval(draw, 33);
      try { await idbSet('rec:meta', { id, ext: fmt.ext, at: Date.now() }); } catch (e) { persisted = false; }
      rec.start(2000); state = 'recording'; t0 = Date.now(); paused = false;
      tickT = setInterval(() => opt.onTick && opt.onTick(elapsed(), paused), 500); opt.onTick && opt.onTick(0, false);
      document.addEventListener('visibilitychange', onVis); getWake();
      return { micErr };
    },
    pause() { if (state !== 'recording' || paused) return; try { rec.pause(); acc += Date.now() - t0; paused = true; t0 = 0; } catch (e) { /* */ } },
    resume() { if (state !== 'recording' || !paused) return; try { rec.resume(); paused = false; t0 = Date.now(); } catch (e) { /* */ } },
    get paused() { return paused; },
    stop() { return new Promise((res) => { if (state === 'idle' || !rec) return res(null); stopRes = res; stopping = true; try { rec.state !== 'inactive' ? rec.stop() : rec.onstop(); } catch (e) { rec.onstop(); } }); },
  };
  return api;
}

/** تسجيل غير مكتمل (أُغلقت الصفحة أثناء التسجيل): يجمع المقاطع المحفوظة. */
export async function recoverRecording() {
  try {
    const meta = await idbGet('rec:meta'); if (!meta) return null;
    const keys = (await idbKeys(`rec:${meta.id}:`)).sort(); if (!keys.length) { await idbDel('rec:meta'); return null; }
    const parts = []; for (const k of keys) { const b = await idbGet(k); if (b) parts.push(b); }
    const mime = meta.ext === 'mp4' ? 'video/mp4' : 'video/webm';
    return { blob: new Blob(parts, { type: mime }), ext: meta.ext, at: meta.at, discard: async () => { for (const k of keys) await idbDel(k); await idbDel('rec:meta'); } };
  } catch (e) { return null; }
}
