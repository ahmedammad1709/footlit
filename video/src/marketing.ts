// The Footlit marketing film, 1920x1080 @ 60 fps: hook, payoff, logo + the real popup, three real moments,
// a six-theme montage, the trust line, and the end card. Voice and subtitles are timed from marketing-cues.json.
// Every show is the real engine; everything runs on one frozen clock so the renderer can capture it frame by frame.
import cues from './marketing-cues.json';
import durations from '../out/marketing-vo-durations.json';
import { buildSubs } from './marketing-subs.mjs';
import { buildGh } from './gh';
import { INK, PAPER, LIT, DISPLAY, TEXT, MONO, jobs, at, A, vis, mk, layer, makeCursor, centerOf } from './kit';

declare const Footlit: { play(o: Record<string, unknown>): Promise<void>; stop(): void; themes: { id: string; name: string }[] };
const w = window as unknown as { __ready: boolean; __start: () => void };
const q = new URLSearchParams(location.search);
const film = document.getElementById('film')!;
const VELVET = '#B8301F';

// ---------- 1. hook: a merge, and nothing happens ----------
function hook() {
  const { start, end, click } = cues.hook;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  const gh = buildGh();
  const stage = mk('div', 'position:absolute;left:50%;top:48%;width:760px;height:220px;margin:-110px 0 0 -380px;transform-origin:50% 50%', '', s);
  stage.style.transform = 'scale(2.05)';
  const box = mk('div', 'position:absolute;inset:0', '', stage);
  box.innerHTML = gh.hookBoxes();
  const open = box.querySelector<HTMLElement>('.h-open')!;
  const done = box.querySelector<HTMLElement>('.h-done')!;
  open.style.opacity = '1';
  done.style.opacity = '0';
  A(open, [{ opacity: 1 }, { opacity: 0 }], click, 0.001);
  A(done, [{ opacity: 0 }, { opacity: 1 }], click, 0.001);
  A(stage, [{ transform: 'scale(2.05)' }, { transform: 'scale(2.16)' }], start, end - start, { easing: 'linear' });
  const fade = layer(s, 'background:#000;opacity:1');
  A(fade, [{ opacity: 1 }, { opacity: 0 }], 0, 0.35, { easing: 'ease-out' });
  const cur = makeCursor(s);
  const btn = box.querySelector<HTMLElement>('.h-btn')!;
  const c = centerOf(btn);
  cur.show(start, end);
  cur.path([{ t: 0.3, x: 1480, y: 860 }, { t: click - 0.05, x: c.x + 26, y: c.y + 22 }]);
  cur.click(click, c.x + 26, c.y + 22);
}

// ---------- 2. payoff: the same merge, with the show ----------
function payoff() {
  const { start, end, scale } = cues.payoff;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  const host = layer(s);
  at(start, () => {
    Footlit.stop();
    void Footlit.play({ theme: 'marquee', event: 'pr.merged', scale, container: host, subject: 'acme/widget-shop #42', detail: 'Fix flaky login redirect on Safari' });
  });
  at(end, () => Footlit.stop());
  const flash = layer(s, `background:${PAPER};opacity:0;z-index:5`);
  A(flash, [{ opacity: 0.55 }, { opacity: 0 }], start, 0.18, { easing: 'linear', fill: 'none' });
}

// ---------- 3. logo + the real popup ----------
async function logo() {
  const { start, end, popupAt } = cues.logo;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  const cx = 640;
  [{ w: 1500, o: 0.10 }, { w: 1180, o: 0.12 }, { w: 860, o: 0.16 }, { w: 540, o: 0.22 }].forEach((b, i) => {
    const el = mk('div', `position:absolute;left:${cx - b.w / 2}px;top:0;width:${b.w}px;height:1080px;background:${LIT};opacity:0;clip-path:polygon(40% 0,60% 0,100% 100%,0 100%)`, '', s);
    A(el, [{ opacity: 0 }, { opacity: b.o }], start + 0.05 + i * 0.1, 0.1, { easing: 'linear' });
  });
  const row = mk('div', 'position:absolute;left:0;right:0;bottom:0;height:70px;display:flex;justify-content:space-between;padding:0 62px;align-items:flex-end', '', s);
  for (let i = 0; i < 15; i++) {
    const lamp = mk('div', 'width:88px;height:44px;border-radius:44px 44px 0 0;background:#3a2c14;position:relative', '', row);
    const on = mk('div', `position:absolute;inset:0;border-radius:44px 44px 0 0;background:${LIT};opacity:0`, '', lamp);
    A(on, [{ opacity: 0 }, { opacity: 1 }], start + 0.2 + i * 0.045, 0.05, { easing: 'linear' });
  }
  mk('div', `position:absolute;left:0;right:0;bottom:0;height:8px;background:${PAPER}`, '', s);
  const word = mk('div', `position:absolute;left:0;width:1280px;top:210px;text-align:center;font:400 330px/1 ${DISPLAY};letter-spacing:.02em;color:${PAPER};text-transform:uppercase;display:flex;justify-content:center`, '', s);
  'FOOTLIT'.split('').forEach((ch, i) => {
    const l = mk('span', 'display:inline-block;overflow:hidden;line-height:.86;padding-top:.04em', '', word);
    A(mk('span', 'display:inline-block', ch, l), [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], start + 0.3 + i * 0.06, 0.45, { easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  const tag = mk('div', `position:absolute;left:0;width:1280px;top:560px;text-align:center;font:italic 400 58px ${TEXT};color:${LIT};opacity:0`, 'Every GitHub event gets a show.', s);
  A(tag, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], start + 1.5, 0.5);
  const what = mk('div', `position:absolute;left:0;width:1280px;top:652px;text-align:center;font:500 24px ${MONO};letter-spacing:.22em;color:#B5A78F;text-transform:uppercase;opacity:0`, 'A free extension for GitHub', s);
  A(what, [{ opacity: 0 }, { opacity: 1 }], start + 2.0, 0.5);

  // the real popup, cropped to its top, sliding in on the right
  const PS = 1.5, PW = 372, CH = 360;
  const holder = mk('div', `position:absolute;left:1180px;top:${(1080 - CH * PS) / 2 - 40}px;width:${PW * PS}px;height:${CH * PS}px;overflow:hidden;border:4px solid ${PAPER};box-sizing:content-box;opacity:0`, '', s);
  const frame = document.createElement('iframe');
  frame.src = '/ext/popup/popup.html?theme=marquee';
  frame.style.cssText = `position:absolute;left:0;top:0;width:${PW}px;height:760px;border:0;transform-origin:0 0;transform:scale(${PS});background:#F1E8D4`;
  holder.append(frame);
  await new Promise<void>((res) => { frame.onload = () => res(); });
  const fd = frame.contentDocument!;
  for (let i = 0; i < 100 && !fd.querySelector('#themes .tile'); i++) await new Promise((r) => setTimeout(r, 30));
  await fd.fonts.ready;
  A(holder, [{ opacity: 0, transform: 'translateX(120px)' }, { opacity: 1, transform: 'none' }], popupAt, 0.55, { easing: 'cubic-bezier(.2,.8,.2,1)' });
}

// ---------- 4. three real moments ----------
function demo() {
  const D = cues.demo;
  const { start, end, steps } = D;
  const s = layer(film, `background:${INK};overflow:hidden`);
  vis(s, start, end);
  const gh = buildGh();

  // the programme (left)
  const col = layer(s, 'right:auto;width:420px');
  mk('div', `position:absolute;left:62px;top:84px;padding:8px 14px 6px;border:2.5px solid ${LIT};color:${LIT};font:500 19px ${MONO};letter-spacing:.16em;transform:rotate(-3deg)`, 'NOW SHOWING', col);
  const numWrap = mk('div', 'position:absolute;left:52px;top:150px;width:360px;height:300px;overflow:hidden', '', col);
  const titleWrap = mk('div', 'position:absolute;left:62px;top:468px;width:350px;height:150px;overflow:hidden', '', col);
  steps.forEach((st, i) => {
    const t0 = st.t, t1 = i + 1 < steps.length ? steps[i + 1]!.t : end;
    const n = mk('div', `position:absolute;left:0;top:0;font:400 330px/1 ${DISPLAY};color:${LIT};opacity:0`, String(st.n).padStart(2, '0'), numWrap);
    const ti = mk('div', `position:absolute;left:0;top:0;font:italic 500 62px/1.02 ${TEXT};color:${PAPER};opacity:0;letter-spacing:-.01em`, st.title, titleWrap);
    for (const [el, off] of [[n, 140], [ti, 60]] as const) {
      A(el, [
        { opacity: 0, transform: `translateY(${off}px)`, offset: 0, easing: 'cubic-bezier(.2,.8,.2,1)' },
        { opacity: 1, transform: 'translateY(0)', offset: 0.06, easing: 'linear' },
        { opacity: 1, transform: 'translateY(0)', offset: 0.975, easing: 'ease-in' },
        { opacity: 0, transform: `translateY(-${off / 2}px)`, offset: 1 },
      ], t0, t1 - t0, { fill: 'none', easing: 'linear' });
    }
  });
  const list = mk('div', `position:absolute;left:62px;bottom:150px;width:300px;font:500 17px ${MONO};letter-spacing:.1em;text-transform:uppercase`, '', col);
  steps.forEach((st, i) => {
    const row = mk('div', 'display:flex;align-items:flex-end;gap:8px;padding:7px 0', '', list);
    const a = mk('span', '', String(st.n).padStart(2, '0'), row);
    mk('span', 'flex:1;border-bottom:1.5px dotted #4a3f31;margin-bottom:5px', '', row);
    const b = mk('span', '', st.label.toUpperCase(), row);
    for (const el of [a, b]) {
      el.style.color = '#7a6c58';
      A(el, [{ color: '#7a6c58' }, { color: LIT }], st.t, 0.01, { easing: 'linear' });
      if (i + 1 < steps.length) A(el, [{ color: LIT }, { color: '#7a6c58' }], steps[i + 1]!.t, 0.01, { easing: 'linear' });
    }
  });

  // the browser (right)
  const right = layer(s, 'left:420px;overflow:visible');
  const cam = layer(right, 'transform-origin:50% 50%');
  A(cam, [{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }], start, end - start, { easing: 'linear' });
  const bw = 1420, bh = 900, bx = 30, by = 40;
  const browser = mk('div', `position:absolute;left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;background:#202124;border-radius:14px;overflow:hidden;opacity:0`, '', cam);
  vis(browser, start, end);
  A(browser, [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], start, 0.45, { easing: 'cubic-bezier(.7,0,.2,1)', fill: 'none' });
  gh.chrome(browser, bw);
  const url = browser.querySelector<HTMLElement>('.u-text')!;
  const tabTitle = browser.querySelector<HTMLElement>('.t-title')!;
  const view = mk('div', `position:absolute;left:0;top:96px;width:${bw}px;height:${bh - 96}px;overflow:hidden;background:#0d1117`, '', browser);
  const pages = gh.pages(view, bw / 1108);
  const swap = (t: number, u: string, title: string) => at(t, () => { url.textContent = u; tabTitle.textContent = title; });
  const afterCreate = D.shows[0]!.t + 0.15;
  vis(pages.newRepo, start, afterCreate);
  vis(pages.repo, afterCreate, steps[1]!.t);
  vis(pages.pr, steps[1]!.t, end);
  swap(start, 'github.com/new', 'Create a New Repository');
  swap(afterCreate, 'github.com/acme/widget-shop', 'acme/widget-shop');
  swap(steps[1]!.t, 'github.com/acme/widget-shop/pull/42', 'Fix flaky login redirect on Safari #42');

  // typing the repository name
  const nameEl = pages.newRepo.querySelector<HTMLElement>('.f-name')!;
  const caret = pages.newRepo.querySelector<HTMLElement>('.f-caret')!;
  const name = 'widget-shop';
  at(D.typeStart - 0.05, () => { caret.style.opacity = '1'; });
  [...name].forEach((_, i) => at(D.typeStart + ((D.typeEnd - D.typeStart) * i) / name.length, () => { nameEl.textContent = name.slice(0, i + 1); }));
  const ok = pages.newRepo.querySelector<HTMLElement>('.f-ok')!;
  ok.style.opacity = '0';
  A(ok, [{ opacity: 0 }, { opacity: 1 }], D.typeEnd + 0.12, 0.2);

  // the checks box: pending, failed, passed, merged
  const merge = D.shows[2]!.t;
  vis(pages.boxPending, steps[1]!.t, D.checksFail);
  vis(pages.boxFail, D.checksFail, D.checksPass);
  vis(pages.boxPass, D.checksPass, merge);
  vis(pages.boxMerged, merge, end);
  vis(pages.commitFix, steps[2]!.t + 0.1, end, 0);
  pages.openPill.style.opacity = '1';
  pages.mergedPill.style.opacity = '0';
  A(pages.openPill, [{ opacity: 1 }, { opacity: 0 }], merge, 0.001);
  A(pages.mergedPill, [{ opacity: 0 }, { opacity: 1 }], merge, 0.001);

  // the pointer
  const toRight = (p: { x: number; y: number }) => ({ x: p.x - 420, y: p.y });
  const cur = makeCursor(right);
  cur.show(start + 0.2, merge + 1.0);
  const createBtn = toRight(centerOf(pages.newRepo.querySelector('.f-create')!));
  const nameField = toRight(centerOf(pages.newRepo.querySelector('.f-input')!));
  const mergeBtn = toRight(centerOf(pages.boxPass.querySelector('.b-merge')!));
  cur.path([
    { t: start + 0.2, x: 1100, y: 760 },
    { t: D.typeStart - 0.1, x: nameField.x + 120, y: nameField.y + 6 },
    { t: D.typeEnd + 0.3, x: nameField.x + 130, y: nameField.y + 8 },
    { t: D.createClick - 0.06, x: createBtn.x, y: createBtn.y },
    { t: D.shows[0]!.t + 1.2, x: createBtn.x + 220, y: createBtn.y + 220 },
    { t: D.checksPass + 0.2, x: 760, y: 560 },
    { t: D.mergeClick - 0.05, x: mergeBtn.x, y: mergeBtn.y },
    { t: merge + 1.0, x: mergeBtn.x + 120, y: mergeBtn.y + 140 },
  ]);
  cur.click(D.createClick, createBtn.x, createBtn.y);
  cur.click(D.mergeClick, mergeBtn.x, mergeBtn.y);

  // the real engine, over the page exactly where the extension draws it
  D.shows.forEach((sh) => at(sh.t, () => {
    Footlit.stop();
    void Footlit.play({ theme: 'marquee', event: sh.event, scale: sh.scale, container: pages.overlayHost, subject: sh.subject, detail: sh.detail });
  }));
  at(end, () => Footlit.stop());
}

// ---------- 5. six themes, cut on the beat ----------
function montage() {
  const { start, end, shots, payoff } = cues.montage;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  const host = layer(s);
  const hud = layer(s, 'z-index:5;pointer-events:none');
  let t = start;
  shots.forEach((sh, i) => {
    const t0 = t;
    // each theme's payoff lands at ~60% of its shot, so every cut gets a held beat on the big moment
    const scale = (sh.dur * 0.6) / (payoff as Record<string, number>)[sh.theme]!;
    at(t0, () => {
      Footlit.stop();
      void Footlit.play({ theme: sh.theme, event: sh.event, scale, container: host, subject: 'acme/widget-shop #42', detail: 'Fix flaky login redirect on Safari' });
    });
    const chip = mk('div', `position:absolute;left:54px;top:44px;padding:10px 16px 8px;background:${INK};color:${PAPER};font:500 22px ${MONO};letter-spacing:.1em;text-transform:uppercase;border-left:6px solid ${LIT};opacity:0`, `${String(i + 1).padStart(2, '0')} / 06   ${sh.name}`, hud);
    vis(chip, t0, t0 + sh.dur);
    const flash = layer(hud, `background:${PAPER};opacity:0`);
    A(flash, [{ opacity: i % 2 ? 0.26 : 0.4 }, { opacity: 0 }], t0, 0.14, { easing: 'linear', fill: 'none' });
    t += sh.dur;
  });
  at(end, () => Footlit.stop());
}

// ---------- 6. the trust line, as a printed programme ----------
function trust() {
  const { start, end, words } = cues.trust;
  const s = layer(film, `background:${PAPER};overflow:hidden`);
  vis(s, start, end);
  A(s, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], start, 0.22, { easing: 'cubic-bezier(.7,0,.2,1)', fill: 'none' });
  mk('div', `position:absolute;left:96px;right:96px;top:104px;height:3px;background:${INK}`, '', s);
  mk('div', `position:absolute;left:96px;right:96px;top:112px;height:1.5px;background:${INK}`, '', s);
  mk('div', `position:absolute;left:96px;top:60px;font:500 22px ${MONO};letter-spacing:.2em;color:#5C5043`, 'THE FINE PRINT', s);
  mk('div', `position:absolute;right:96px;top:60px;font:500 22px ${MONO};letter-spacing:.2em;color:#5C5043`, 'FOOTLIT / V1', s);
  const rows = [
    { text: 'Free.', note: 'No account. No ads. No subscription.' },
    { text: 'Private.', note: 'github.com only. No analytics.' },
    { text: 'Nothing leaves your browser.', note: 'No servers of ours. Ever.' },
  ];
  const voAt = cues.vo['10'];
  rows.forEach((r, i) => {
    const y = 150 + i * 255;
    const size = i === 2 ? 168 : 250;
    const t0 = voAt + words[i]!;
    const row = mk('div', `position:absolute;left:96px;right:96px;top:${y}px;height:240px;opacity:0`, '', s);
    if (i === 2) {
      const [a, ...rest] = r.text.split(' ');
      mk('div', `position:absolute;left:0;top:${i === 2 ? 36 : 0}px;font:400 ${size}px/1 ${DISPLAY};letter-spacing:.01em;text-transform:uppercase;white-space:nowrap;color:${INK}`, '', row).innerHTML = `<span style="color:${VELVET}">${a}</span> ${rest.join(' ')}`;
    } else {
      mk('div', `position:absolute;left:0;top:0;font:400 ${size}px/1 ${DISPLAY};letter-spacing:.01em;text-transform:uppercase;color:${INK}`, r.text, row);
    }
    const note = mk('div', `position:absolute;right:0;bottom:${i === 2 ? 4 : 30}px;font:500 21px ${MONO};letter-spacing:.08em;text-transform:uppercase;color:#5C5043;text-align:right;max-width:560px;opacity:0`, r.note, row);
    A(row, [{ opacity: 0, transform: 'translateY(60px)' }, { opacity: 1, transform: 'none' }], t0, 0.36);
    A(note, [{ opacity: 0 }, { opacity: 1 }], t0 + 0.3, 0.3);
    if (i < 2) {
      // the rule under a row appears with the next row, so nothing is drawn ahead of the voice
      const rule = mk('div', `position:absolute;left:96px;right:96px;top:${y + 245}px;height:1.5px;background:${INK};opacity:0`, '', s);
      A(rule, [{ opacity: 0 }, { opacity: 0.35 }], voAt + words[i + 1]!, 0.2);
    }
  });
}

// ---------- 7. end card ----------
function endCard() {
  const { start, end } = cues.end;
  const s = layer(film, `background:${INK};overflow:hidden`);
  vis(s, start, end);
  [{ w: 1100, o: 0.08 }, { w: 780, o: 0.1 }, { w: 460, o: 0.14 }].forEach((b, i) => {
    const el = mk('div', `position:absolute;left:${960 - b.w / 2}px;top:0;width:${b.w}px;height:1080px;background:${LIT};opacity:0;clip-path:polygon(40% 0,60% 0,100% 100%,0 100%)`, '', s);
    A(el, [{ opacity: 0 }, { opacity: b.o }], start + i * 0.1, 0.1, { easing: 'linear' });
  });
  const icon = mk('img', `position:absolute;left:${960 - 96}px;top:170px;width:192px;height:192px`, '', s) as HTMLImageElement;
  icon.src = '/ext/icons/icon-128.png';
  A(icon, [{ opacity: 0, transform: 'translateY(30px) scale(.9)' }, { opacity: 1, transform: 'none' }], start + 0.1, 0.45);
  const word = mk('div', `position:absolute;left:0;right:0;top:380px;text-align:center;font:400 250px/1 ${DISPLAY};letter-spacing:.03em;color:${PAPER};text-transform:uppercase`, 'Footlit', s);
  A(word, [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], start + 0.2, 0.45);
  const free = mk('div', `position:absolute;left:0;right:0;top:650px;text-align:center;font:italic 400 66px ${TEXT};color:${LIT};opacity:0`, 'Free for Chrome and Firefox.', s);
  A(free, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], start + 0.95, 0.45);
  const urlEl = mk('div', `position:absolute;left:0;right:0;top:770px;text-align:center;font:500 36px ${MONO};letter-spacing:.16em;color:${PAPER};opacity:0`, 'footlit-app.vercel.app', s);
  A(urlEl, [{ opacity: 0 }, { opacity: 1 }], start + 1.7, 0.45);
  mk('div', `position:absolute;left:0;right:0;top:842px;height:2px;width:520px;margin:0 auto;background:${PAPER};opacity:.35`, '', s);
  const by = mk('div', `position:absolute;left:0;right:0;top:864px;text-align:center;font:500 20px ${MONO};letter-spacing:.2em;color:#B5A78F;text-transform:uppercase;opacity:0`, 'Built by Ammad Ahmed  /  Codeveil Studio', s);
  A(by, [{ opacity: 0 }, { opacity: 1 }], start + 2.3, 0.45);
  const row = mk('div', 'position:absolute;left:0;right:0;bottom:0;height:60px;display:flex;justify-content:space-between;padding:0 62px;align-items:flex-end', '', s);
  for (let i = 0; i < 15; i++) {
    const l = mk('div', `width:88px;height:38px;border-radius:38px 38px 0 0;background:${LIT}`, '', row);
    A(l, [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], start + 2.6 + i * 0.1, 1.0, { easing: 'linear', fill: 'none' });
  }
  mk('div', `position:absolute;left:0;right:0;bottom:0;height:8px;background:${PAPER}`, '', s);
  const fade = layer(s, 'background:#000;opacity:0');
  A(fade, [{ opacity: 0 }, { opacity: 1 }], end - 0.6, 0.55, { easing: 'ease-in' });
}

// ---------- subtitles: burned in, on top of everything ----------
function subtitles() {
  const top = layer(film, 'z-index:100;pointer-events:none');
  for (const sub of buildSubs(cues, durations)) {
    const wrap = mk('div', 'position:absolute;left:0;right:0;top:944px;display:flex;justify-content:center;opacity:0', '', top);
    const pill = mk('div', `max-width:1500px;padding:12px 30px 15px;background:rgba(23,18,14,.95);border-left:6px solid ${LIT};color:${PAPER};font:500 46px/1.15 ${TEXT};letter-spacing:.005em;white-space:nowrap`, '', wrap);
    let html = sub.text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    for (const em of sub.em) html = html.replace(em, `<span style="color:${LIT};font-weight:650">${em}</span>`);
    pill.innerHTML = html;
    vis(wrap, sub.t0, sub.t1, 0.1);
  }
}

// ---------- boot ----------
async function boot() {
  await Promise.all([
    document.fonts.load('40px "League Gothic"'), document.fonts.load('40px "Newsreader"'), document.fonts.load('600 40px "Newsreader"'), document.fonts.load('italic 40px "Newsreader"'),
    document.fonts.load('20px "DM Mono"'), document.fonts.load('500 20px "DM Mono"'),
  ]);
  // warm every theme's fonts in real time (no frames are produced until the renderer asks)
  const warm = layer(film, 'opacity:0');
  for (const t of Footlit.themes) {
    void Footlit.play({ theme: t.id, event: 'pr.merged', container: warm });
    await new Promise((r) => setTimeout(r, 450));
    Footlit.stop();
  }
  warm.remove();
  if (!q.get('lab')) {
    hook(); payoff(); await logo(); demo(); montage(); trust(); endCard(); subtitles();
  }
  w.__ready = true;
}
w.__start = () => {
  const lab = q.get('lab');
  if (lab) { const [theme, event, scale] = lab.split(':'); void Footlit.play({ theme, event, scale: Number(scale ?? 1), container: film }); return; }
  jobs.forEach((j) => j());
};
void boot().catch((e) => console.log('[film] boot failed', e?.stack ?? e));
