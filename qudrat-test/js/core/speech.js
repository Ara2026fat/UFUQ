/**
 * Voice layer. Two sources, same API:
 *  1) lesson.audio  -> a recording by the Ustaz (preferred, plug in later)
 *  2) Web Speech API -> Arabic text-to-speech on the device (works now, no files)
 */
export const ttsSupported = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export function arabicVoice() {
  if (!ttsSupported()) return null;
  const vs = speechSynthesis.getVoices();
  return vs.find((v) => /^ar[-_]SA/i.test(v.lang)) || vs.find((v) => /^ar/i.test(v.lang)) || null;
}

/**
 * Play pre-recorded files strictly one after another:
 * a clip starts only after the previous one has fully ended, then a short silent gap
 * (default 450 ms, scaled by speed) before the next. The next file is preloaded so there is no stutter.
 */
export function playFiles(urls, { rate = 1, from = 0, gapMs = 450, onSegment, onEnd, onFail } = {}) {
  let i = from, stopped = false, a = null, timer = null;
  const make = (u) => { const el = new Audio(u); el.preload = 'auto'; el.playbackRate = rate; el.preservesPitch = true; return el; };
  let upcoming = urls[i] ? make(urls[i]) : null;
  const next = () => {
    if (stopped) return;
    if (i >= urls.length) { onEnd && onEnd(); return; }
    onSegment && onSegment(i);
    a = upcoming || make(urls[i]);
    const cur = a;
    upcoming = urls[i + 1] ? make(urls[i + 1]) : null;
    cur.onended = () => { if (stopped) return; i++; timer = setTimeout(next, Math.round(gapMs / rate)); };
    cur.onerror = () => { stopped = true; onFail && onFail(); };
    cur.play().catch(() => { stopped = true; onFail && onFail(); });
  };
  next();
  return {
    stop() { stopped = true; clearTimeout(timer); a && a.pause(); upcoming = null; },
    pause() { a && a.pause(); },
    resume() { a && a.play(); },
  };
}

/** Speak segments one after another. Returns controller {stop, pause, resume}. */
export function speakSequence(segments, { rate = 0.95, from = 0, gapMs = 600, onSegment, onEnd } = {}) {
  let i = from; let stopped = false;
  const next = () => {
    if (stopped) return;
    if (i >= segments.length) { onEnd && onEnd(); return; }
    onSegment && onSegment(i);
    const u = new SpeechSynthesisUtterance(segments[i]);
    const v = arabicVoice(); if (v) u.voice = v;
    u.lang = v?.lang || 'ar-SA'; u.rate = rate;
    u.onend = () => { i++; setTimeout(next, gapMs); };
    u.onerror = () => { if (!stopped) { i++; next(); } };
    speechSynthesis.speak(u);
  };
  speechSynthesis.cancel(); next();
  return {
    stop() { stopped = true; speechSynthesis.cancel(); },
    pause() { speechSynthesis.pause(); },
    resume() { speechSynthesis.resume(); },
  };
}
