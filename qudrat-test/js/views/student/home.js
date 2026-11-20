import { h } from '../../core/dom.js';
import { countVideos } from './ustaz-lessons.js';
import { icon } from '../../core/icons.js';
import * as eng from '../../engine/engine.js';
import { repo } from '../../store/repo.js';
import * as jr from '../../store/journey.js';
import { GROUPS } from '../../data/taxonomy.js';
import { session } from '../../core/auth.js';
import { tabbed } from '../../components/tabs.js';
import { GUIDE } from '../../data/guide.js';
import { playFiles } from '../../core/speech.js';
import { isTrial, practiceLeft } from '../../core/trial.js';
import { getPart, setPart, PARTS, topicInPart, skillInPart } from '../../store/part.js';

const AR = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const fmt = (t) => { const [h_, m] = t.split(':').map(Number); return `${AR(h_ % 12 === 0 ? 12 : h_ % 12)}:${AR(String(m).padStart(2, '0'))} ${h_ >= 12 ? 'م' : 'ص'}`; };
function journeyCard() {
  const w = jr.where(), ph = jr.PHASES[w.phase], p = Math.min(100, Math.round((w.day / w.total) * 100)), due = eng.dueCount();
  return h('section', { class: 'card stack', 'aria-label': 'رحلتك' },
    h('div', { class: 'row between' }, h('h3', { style: 'margin:0' }, `اليوم ${AR(w.day)} من ${AR(w.total)}`), h('span', { class: 'badge ok' }, ph.t)),
    h('div', { role: 'progressbar', 'aria-valuenow': String(p), 'aria-valuemin': '0', 'aria-valuemax': '100', style: 'height:8px;border-radius:99px;background:rgba(20,35,74,.12);overflow:hidden' }, h('div', { style: `height:100%;width:${p}%;background:#F0C23A` })),
    h('p', { class: 'muted small', style: 'margin:0' }, `${w.hasExam ? `تبقى ${AR(w.remaining)} يوم على اختبارك. ` : ''}${ph.b}`),
    h('div', { class: 'row-wrap' },
      due ? h('a', { class: 'btn sm ghost', href: '#/mistakes' }, `أخطاء تنتظرك (${AR(due)})`) : null,
      w.hasExam ? null : h('a', { class: 'btn sm ghost', href: '#/plan' }, 'حدّد تاريخ اختبارك')));
}
function roundsCard() {
  const rs = eng.todayRounds(), nx = eng.nextRound(), done = eng.roundsDoneToday();
  const go = (r, i) => (r.kind === 'ideas' ? `#/ideas?r=${i}` : `#/practice?mode=daily&kind=${r.kind}&r=${i}&part=${getPart()}`);
  return h('section', { class: 'card stack' },
    h('div', { class: 'row between' }, h('h3', { style: 'margin:0' }, `جولات اليوم${eng.isWeekend() ? ' — إجازة' : ''}`), h('b', null, `${AR(done)} من ${AR(rs.length)}`)),
    ...rs.map((r, i) => { const st = eng.roundState(i), k = eng.ROUND_KINDS[r.kind];
      return h('a', { class: 'row between', href: go(r, i), style: `text-decoration:none;color:inherit;padding:6px 0;${st === 'done' ? 'opacity:.55' : ''}` },
        h('span', null, h('b', null, k.t), h('small', { class: 'muted' }, ` — ${fmt(r.at)} — ${AR(r.mins)} د`)),
        h('span', { class: 'small' }, st === 'done' ? '✓' : st === 'now' ? 'الآن' : st === 'late' ? 'فاتت' : '')); }),
    nx ? h('a', { class: 'btn primary block', href: go(nx.r, nx.i) }, nx.st === 'late' ? 'ابدأ الآن' : 'ابدأ الجولة التالية') : h('p', { class: 'muted small', style: 'margin:0' }, 'أتممتَ جولات اليوم. أحسنت.'),
    nx && nx.st === 'later' ? h('small', { class: 'muted' }, 'تستطيع تقديمها متى شئت — التقديم لا يُحسب تأخيراً.') : null,
    h('select', { 'aria-label': 'عدد الجولات', onChange: (e) => { if (e.target.value === 'plan') { location.hash = '#/plan'; return; } eng.setPreset(e.target.value); location.reload(); } }, [...Object.entries(eng.ROUND_PRESETS).map(([k, v]) => h('option', { value: k, selected: eng.preset() === k || null }, `نمط ${v.name}`)), h('option', { value: 'plan', selected: eng.preset() === 'custom' || null }, eng.preset() === 'custom' ? 'جدولي (مخصّص)' : 'عدّل جدولي…')]));
}

const GICON = { num: 'calc', app: 'chart', geo: 'shapes', cnt: 'puzzle', ufq: 'star', verbal: 'pen', exam: 'clock' };
const GCOL = { num: 1, app: 2, geo: 3, cnt: 4, ufq: 5, verbal: 6, exam: 7 };
const SUN = `<svg class="sun3d" viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="sg" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".55" stop-color="#F7C93E"/><stop offset="1" stop-color="#D9921A"/></radialGradient><filter id="ss"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#5a3600" flood-opacity=".35"/></filter></defs><g stroke="#FFE08A" stroke-width="7" stroke-linecap="round" filter="url(#ss)"><path d="M60 8v14M22 24l9 10M98 24l-9 10M8 60h14M112 60h-14"/></g><path d="M26 92a34 34 0 0 1 68 0z" fill="url(#sg)" filter="url(#ss)"/><path d="M36 82a24 24 0 0 1 22-18" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="8" y="94" width="104" height="5" rx="2.5" fill="#FFE08A" opacity=".8"/></svg>`;
const dateAr = () => new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

const greet = () => { const hr = new Date().getHours(); return hr < 12 ? 'صباح الخير' : hr < 18 ? 'مرحباً' : 'مساء الخير'; };
function welcome() {
  let n = ''; try { n = String((session() || {}).name || '').trim().split(/\s+/)[0]; } catch (e) { /* ignore */ }
  return n ? `${greet()} يا ${n}` : 'مرحباً بك في أُفق';
}

function vbanner() {
  const a = h('a', { class: 'lt-vban', href: '#/ustaz-lessons', hidden: true }, h('span', { class: 'lt-vic', 'aria-hidden': 'true', html: icon('film') }),
    h('span', null, h('b', null, 'دروس الأستاذ المصوّرة'), h('small', null, 'شرح الأستاذ إبراهيم البربري بالفيديو')), h('span', { class: 'lt-go', 'aria-hidden': 'true' }, '‹'));
  countVideos().then((n) => { if (n) { a.hidden = false; a.querySelector('small').textContent = `${AR(n)} دروس — اضغط للمشاهدة`; } });
  return a;
}

export function homeView() {
  const wrap = h('div', { class: 'home-wrap' });
  const draw = () => wrap.replaceChildren(homeInner(draw));
  draw();
  return wrap;
}

let GIDX = null;
const guideIdx = () => (GIDX ? Promise.resolve(GIDX) : fetch('audio/guide/index.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((m) => (GIDX = m)));
let gctl = null;
function guideBtn(id) {
  const b = h('button', { class: 'btn sm ghost listen later', type: 'button', disabled: true, title: 'الصوت لم يُدشَّن بعد' }, 'استمع');
  guideIdx().then((m) => {
    if (!m[id]) return;
    b.disabled = false; b.classList.remove('later'); b.title = ''; b.textContent = 'استمع';
    b.onclick = () => {
      if (gctl) { gctl.stop(); gctl = null; b.textContent = 'استمع'; return; }
      b.textContent = 'إيقاف';
      const end = () => { gctl = null; b.textContent = 'استمع'; };
      gctl = playFiles([`audio/guide/${id}.mp3`], { onEnd: end, onFail: end });
    };
  });
  return b;
}
/** المرشد: يبني خطة الطالب، ويحفّزه على الاستمرار، ويعرض أسبوعه. */
function mentorCard(nx, done, total) {
  const w = jr.where(), sk = jr.streakDays(), strip = jr.weekStrip();
  const DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
  const allDone = !nx && total > 0 && done >= total;
  const hr = new Date().getHours(), doy = Math.floor(Date.now() / 864e5);
  const pick = (ids) => ids[doy % ids.length];
  let id;
  if (w.hasExam && w.remaining <= 3 && !allDone) id = 'g_final_days';
  else if (w.hasExam && w.remaining <= 14 && !allDone) id = 'g_exam_near';
  else if (!sk.ever) id = !w.hasExam ? 'g_plan_exam' : 'g_first_session';
  else if (allDone) id = pick(['g_all_done', 'g_mastery', 'g_round_done']);
  else if (sk.n >= 7) id = 'g_streak_7';
  else if (sk.n >= 3) id = 'g_streak_3';
  else if (!sk.today && sk.n === 0) id = pick(['g_missed', 'g_comeback']);
  else if (hr < 11) id = 'g_morning';
  else if (hr >= 21) id = 'g_night';
  else id = pick(['g_today_start', 'g_small_steps', getPart() === 'verbal' ? 'g_verbal' : 'g_quant', 'g_mastery']);
  const msg = GUIDE[id];
  const steps = [
    ['حدّد موعد اختبارك', w.hasExam, '#/plan'],
    ['اختر جلساتك اليومية', jr.streakDays().ever || w.hasExam, '#/plan'],
    ['أتمّ أول جلسة تدريب', sk.ever, nx ? `#/practice?mode=daily&kind=${nx.r.kind}&r=${nx.i}&part=${getPart()}` : '#/practice?mode=quick'],
  ];
  const planned = w.hasExam && sk.ever;
  const SPECIAL = ['g_final_days', 'g_exam_near', 'g_missed', 'g_comeback', 'g_streak_3', 'g_streak_7', 'g_all_done'];
  const today = new Date().toDateString();
  let hidden = false; try { hidden = localStorage.getItem('qk_mentor_x') === today; } catch (e) { /* */ }
  const need = !hidden && (!planned || SPECIAL.includes(id));
  const week = h('div', { class: 'wk-strip', role: 'img', 'aria-label': 'نشاطك في آخر سبعة أيام' }, strip.map((d) => h('span', { class: `wk-d${d.on ? ' on' : ''}${d.today ? ' today' : ''}` }, h('i', null), h('small', null, DAYS[d.dow]))));
  if (!need) return { slim: null, week, streak: sk.n };
  const MOOD = ['g_streak_3', 'g_streak_7', 'g_all_done', 'g_round_done', 'g_mastery'].includes(id) ? 'cheer' : ['g_missed', 'g_comeback', 'g_exam_near', 'g_final_days', 'g_mistake', 'g_rush'].includes(id) ? 'push' : 'cheerful';
  const more = h('div', { class: 'mentor-more', hidden: true },
    planned ? null : h('ol', { class: 'mentor-steps' }, steps.map(([t, ok, to]) => h('li', { class: ok ? 'ok' : '' }, ok ? h('span', null, t) : h('a', { href: to }, t)))),
    nx ? h('small', { class: 'muted' }, `جلستك القادمة: ${fmt(nx.r.at)}`) : null);
  const slim = h('section', { class: 'mentor-slim', 'aria-label': 'المرشد' },
    h('div', { class: 'ms-row' },
      h('img', { class: `ms-av ${MOOD}`, src: 'icons/mentor.png?v=1', alt: '', width: 50, height: 63, 'aria-hidden': 'true' }),
      h('button', { class: 'ms-txt', type: 'button', 'aria-expanded': 'false', onClick: (e) => { const o = more.hidden; more.hidden = !o; e.currentTarget.setAttribute('aria-expanded', String(o)); slim.classList.toggle('open', o); } }, h('b', null, 'مرشدك'), h('span', null, msg)),
      guideBtn(id),
      h('button', { class: 'ms-x', type: 'button', 'aria-label': 'إخفاء اليوم', onClick: () => { try { localStorage.setItem('qk_mentor_x', today); } catch (e) { /* */ } slim.remove(); } }, '×')),
    more);
  return { slim, week, streak: sk.n };
}

function homeInner(redraw) {
  const M = mentorCard(eng.nextRound(), eng.roundsDoneToday(), eng.todayRounds().length);
  const mistakes = repo.mistakes();
  const rs = eng.todayRounds(), nx = eng.nextRound(), done = eng.roundsDoneToday();
  const go = (r, i) => (r.kind === 'ideas' ? `#/ideas?r=${i}` : `#/practice?mode=daily&kind=${r.kind}&r=${i}&part=${getPart()}`);
  const allDone = !nx;
  const st = repo.topicStats(); let n = 0, ok = 0;
  Object.entries(st).forEach(([k, t]) => { if (topicInPart(k)) { n += t.n; ok += t.ok; } });
  const acc = n ? Math.round((ok / n) * 100) : 0;
  const streak = (eng.engineState().streak) || 0;
  let mnote = 'المعيار إتقان المهارة لا عدد الدقائق';
  try { const ov = eng.overview().filter((x) => skillInPart(x)); if (ov.length) mnote = `${AR(ov.filter((x) => x.status === 'mastered').length)} من ${AR(ov.length)} مهارة متقنة`; } catch (e) { /* ignore */ }
  const pct = rs.length ? Math.round((done / rs.length) * 100) : 0;

  const ico = (name) => { const s = h('span', { class: 'ic' }); s.innerHTML = icon(name); return s; };
  const stat = (name, val, label, cls) => h('div', { class: `stat ${cls}` }, ico(name), h('b', null, val), h('small', null, label));
  const tile = (to, name, label, sub, c, badge) => h('a', { class: `qt c${c}`, href: to }, ico(name), h('b', null, label), sub ? h('small', null, sub) : null, badge ? h('i', { class: 'bdg' }, badge) : null);

  const part = getPart();
  const pswitch = h('div', { class: 'part-switch', role: 'tablist', 'aria-label': 'القسم' }, Object.entries(PARTS).map(([k, v]) =>
    h('button', { role: 'tab', class: k === part ? 'on' : '', 'aria-selected': String(k === part), onClick: () => { if (k !== part) { setPart(k); redraw(); } } }, h('span', { class: 'ps-ic', html: icon(k === 'verbal' ? 'pen' : 'calc') }), v)));
  const heroN = h('section', { class: 'hero' }, (() => { const w = h('span'); w.innerHTML = SUN; return w.firstChild; })(),
      h('div', { class: 'hero-top' }, h('div', null, h('small', null, dateAr()), h('h2', null, welcome())),
        h('div', { class: 'ring', style: `--p:${pct}`, role: 'img', 'aria-label': `أتممتَ ${AR(done)} من ${AR(rs.length)} جولات` }, h('b', null, `${AR(done)}/${AR(rs.length)}`))),
      h('p', { class: 'focus-kicker' }, allDone ? 'أحسنت — أتممتَ جولات اليوم' : 'جولة اليوم'),
      h('a', { class: 'btn accent focus-btn', href: nx ? go(nx.r, nx.i) : '#/practice?mode=quick' }, allDone ? 'تدريب سريع' : 'ابدأ الجولة'),
      h('div', { class: 'hero-stats' }, n
        ? [['flame', AR(streak), 'يوم متتالٍ'], ['check', AR(n), 'محاولة'], ['target', AR(acc) + '٪', 'دقة']].map(([ic, v, l]) => h('span', null, h('b', null, v), ' ', l))
        : h('span', { class: 'hero-note' }, mnote)));
  const trialN = isTrial() ? h('div', { class: 'trial-banner', role: 'note' }, h('span', null, h('b', null, 'النسخة التجريبية'), h('small', { style: 'display:block;color:#5b6478' }, `متبقٍ لك اليوم ${AR(practiceLeft())} من ٣ جلسات تدريب`)), h('a', { class: 'small', href: '#/courses' }, 'الدورة الكاملة ‹')) : null;
  const gridN = h('div', { class: 'qgrid' },
      tile('#/progress', 'trend', 'تقدّمي', null, 3),
      tile('#/map', 'nodes', 'خريطة مهاراتي', null, 4),
      tile('#/mistakes', 'xcircle', 'أخطائي', null, 2),
      tile('#/solve', 'stairs', 'مسألة محلولة', null, 5));
  return h('div', { class: 'stack focus-home rich' },
    pswitch,
    tabbed({ key: 'home', tabs: [
      { id: 'today', label: 'اليوم', render: () => h('div', { class: 'stack' }, heroN, M.slim) },
      { id: 'journey', label: 'رحلتي', render: () => h('div', { class: 'stack' }, h('section', { class: 'card stack wk-card' }, h('div', { class: 'row between' }, h('h3', { style: 'margin:0' }, 'نشاطك هذا الأسبوع'), M.streak ? h('span', { class: 'badge ok' }, `${AR(M.streak)} أيام متتالية`) : null), M.week), journeyCard(), trialN) },
      { id: 'tools', label: 'أدواتي', render: () => h('div', { class: 'stack' }, vbanner(), gridN) }] }));
}
