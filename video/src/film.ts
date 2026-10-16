// The Footlit launch film, 1920x1080. Everything is scheduled against one virtual clock,
// so the renderer can capture it frame by frame. The shows themselves are the real engine.
import cues from './cues.json';
import { buildGh } from './gh';
import { INK, PAPER, LIT, ALARM, DISPLAY, TEXT, MONO, jobs, at, A, vis, mk, layer, makeCursor, centerOf } from './kit';

declare const Footlit: { play(o: Record<string, unknown>): Promise<void>; stop(): void; themes: { id: string; name: string }[] };
const w = window as unknown as { __ready: boolean; __start: () => void };
const q = new URLSearchParams(location.search);


const film = document.getElementById('film')!;

// =====================================================================
// SCENE 1: the hook. A merge, with nothing to mark it.
// =====================================================================
function hook() {
  const { start, end, click } = cues.hook;
  const s = layer(film, `background:#0c0906;overflow:hidden`);
  vis(s, start, end);
  const gh = buildGh();
  const stage = mk('div', 'position:absolute;left:50%;top:50%;width:760px;height:220px;margin:-110px 0 0 -380px;transform-origin:50% 50%', '', s);
  stage.style.transform = 'scale(1.9)';
  const box = mk('div', 'position:absolute;inset:0', '', stage);
  box.innerHTML = gh.hookBoxes();
  const open = box.querySelector<HTMLElement>('.h-open')!;
  const done = box.querySelector<HTMLElement>('.h-done')!;
  open.style.opacity = '1';
  done.style.opacity = '0';
  A(open, [{ opacity: 1 }, { opacity: 0 }], click, 0.001);
  A(done, [{ opacity: 0 }, { opacity: 1 }], click, 0.001);
  A(stage, [{ transform: 'scale(1.9)' }, { transform: 'scale(2.06)' }], start, end - start, { easing: 'linear' });
  // fade to black at the end (the cut into the montage is a hard one)
  const fadeOut = layer(s, 'background:#000;opacity:0');
  A(fadeOut, [{ opacity: 0 }, { opacity: 1 }], end - 0.35, 0.3, { easing: 'ease-in' });
  const cur = makeCursor(s);
  const btn = box.querySelector<HTMLElement>('.h-btn')!;
  const c = centerOf(btn);
  cur.show(start, end);
  cur.path([{ t: 0.15, x: 1500, y: 880 }, { t: click - 0.05, x: c.x + 24, y: c.y + 20 }]);
  cur.click(click, c.x + 24, c.y + 20);
}

// =====================================================================
// SCENE 2: montage. The real engine, cut hard, faster and faster.
// =====================================================================
function montage() {
  const { start, end, shots } = cues.montage;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  const hostEl = layer(s);
  const hud = layer(s, 'z-index:5;pointer-events:none');
  const themeName: Record<string, string> = { marquee: 'Marquee', terminal: 'Terminal', mission: 'Mission Control', pixel: 'Pixel Arcade', crawler: 'Web Crawler', quiet: 'Quiet' };
  let t = start;
  shots.forEach((sh, i) => {
    const t0 = t;
    const last = i === shots.length - 1;
    at(t0, () => {
      Footlit.stop();
      void Footlit.play({ theme: sh.theme, event: sh.event, scale: (sh.dur * 0.82) / (cues.montage.payoff as Record<string, number>)[sh.theme]!, container: hostEl, subject: 'acme/widget-shop #42', detail: 'Fix flaky login redirect on Safari' });
    });
    // label chip
    const chip = mk('div', `position:absolute;left:48px;top:44px;padding:9px 14px 8px;background:${INK};color:${PAPER};font:500 19px ${MONO};letter-spacing:.1em;text-transform:uppercase;border-left:5px solid ${LIT};opacity:0`, `${themeName[sh.theme]}  /  ${sh.event.replace('.', ' ')}`, hud);
    vis(chip, t0, t0 + sh.dur);
    const count = mk('div', `position:absolute;right:48px;bottom:40px;color:${PAPER};font:500 19px ${MONO};letter-spacing:.14em;text-shadow:0 0 6px ${INK},0 0 2px ${INK};opacity:0`, `${String(i + 1).padStart(2, '0')} / ${shots.length}`, hud);
    vis(count, t0, t0 + sh.dur);
    // impact flash on each cut
    const flash = layer(hud, `background:${PAPER};opacity:0`);
    A(flash, [{ opacity: i % 2 ? 0.28 : 0.42 }, { opacity: 0 }], t0, 0.14, { easing: 'linear', fill: 'none' });
    t += sh.dur;
    if (last) at(t, () => Footlit.stop());
  });
  void end;
}

// =====================================================================
// SCENE 3: black, then the logo with its footlights.
// =====================================================================
function logo() {
  const { start, end } = cues.logo;
  const s = layer(film, `background:#0c0906;overflow:hidden`);
  vis(s, start, end);
  // stepped light cone: flat bands, never a gradient
  const cx = 960;
  const bands = [
    { w: 1500, o: 0.10 }, { w: 1180, o: 0.12 }, { w: 860, o: 0.16 }, { w: 540, o: 0.22 },
  ];
  bands.forEach((b, i) => {
    const el = mk('div', `position:absolute;left:${cx - b.w / 2}px;top:0;width:${b.w}px;height:1080px;background:${LIT};opacity:0;clip-path:polygon(40% 0,60% 0,100% 100%,0 100%)`, '', s);
    A(el, [{ opacity: 0 }, { opacity: b.o }], start + 0.1 + i * 0.16, 0.12, { easing: 'linear' });
  });
  // footlights, left to right
  const row = mk('div', 'position:absolute;left:0;right:0;bottom:0;height:70px;display:flex;justify-content:space-between;padding:0 62px;align-items:flex-end', '', s);
  for (let i = 0; i < 15; i++) {
    const lamp = mk('div', `width:88px;height:44px;border-radius:44px 44px 0 0;background:#3a2c14;position:relative`, '', row);
    const on = mk('div', `position:absolute;inset:0;border-radius:44px 44px 0 0;background:${LIT};opacity:0`, '', lamp);
    mk('div', `position:absolute;left:14px;top:12px;width:20px;height:22px;border-radius:20px 20px 0 0;background:#FFE9B0;opacity:.0`, '', on);
    A(on, [{ opacity: 0 }, { opacity: 1 }], start + 0.35 + i * 0.045, 0.06, { easing: 'linear' });
    on.firstElementChild && A(on.firstElementChild, [{ opacity: 0 }, { opacity: 0.9 }], start + 0.35 + i * 0.045, 0.06, { easing: 'linear' });
  }
  mk('div', `position:absolute;left:0;right:0;bottom:0;height:8px;background:${PAPER}`, '', s);
  // wordmark
  const word = mk('div', `position:absolute;left:0;right:0;top:250px;text-align:center;font:400 400px/1 ${DISPLAY};letter-spacing:.02em;color:${PAPER};text-transform:uppercase;display:flex;justify-content:center`, '', s);
  'FOOTLIT'.split('').forEach((ch, i) => {
    const l = mk('span', 'display:inline-block;overflow:hidden;line-height:.86;padding-top:.04em', '', word);
    const inner = mk('span', 'display:inline-block', ch, l);
    A(inner, [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], start + 0.55 + i * 0.07, 0.5, { easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  const tag = mk('div', `position:absolute;left:0;right:0;top:668px;text-align:center;font:italic 400 58px ${TEXT};color:${LIT}`, 'GitHub, with stage lighting.', s);
  A(tag, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], start + 1.75, 0.5);
  tag.style.opacity = '0';
  const sub = mk('div', `position:absolute;left:0;right:0;top:770px;text-align:center;font:500 22px ${MONO};letter-spacing:.2em;color:#B5A78F;text-transform:uppercase`, 'A browser extension for Chrome and Firefox', s);
  sub.style.opacity = '0';
  A(sub, [{ opacity: 0 }, { opacity: 1 }], start + 2.4, 0.5);
  A(s, [{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }], start, end - start, { easing: 'linear', fill: 'none' });
}

// =====================================================================
// SCENE 4: the demo. Programme column on the left, the real thing on the right.
// =====================================================================
async function demo() {
  const { start, end, steps } = cues.demo;
  const s = layer(film, `background:${INK};overflow:hidden`);
  vis(s, start, end);
  const gh = buildGh();

  // ---- left: the programme ----
  const col = layer(s, 'right:auto;width:420px');
  const names = ['Pick a theme', 'Create a repo', 'Break the build', 'Fix it.\nMerge it.'];
  const labels = ['Pick a theme', 'Create a repo', 'Break the build', 'Fix it + merge'];
  const stamp = mk('div', `position:absolute;left:62px;top:84px;padding:8px 14px 6px;border:2.5px solid ${LIT};color:${LIT};font:500 19px ${MONO};letter-spacing:.16em;transform:rotate(-3deg)`, 'NOW SHOWING', col);
  void stamp;
  const numWrap = mk('div', `position:absolute;left:52px;top:150px;width:360px;height:300px;overflow:hidden`, '', col);
  const titleWrap = mk('div', `position:absolute;left:62px;top:468px;width:340px;height:170px;overflow:hidden`, '', col);
  steps.forEach((st, i) => {
    const t0 = st.t, t1 = i + 1 < steps.length ? steps[i + 1]!.t : end;
    const n = mk('div', `position:absolute;left:0;top:0;font:400 330px/1 ${DISPLAY};color:${LIT};opacity:0`, String(st.n).padStart(2, '0'), numWrap);
    const ti = mk('div', `position:absolute;left:0;top:0;font:italic 500 62px/1.02 ${TEXT};color:${PAPER};opacity:0;letter-spacing:-.01em;white-space:pre-line`, names[i], titleWrap);
    for (const [el, off] of [[n, 140], [ti, 60]] as const) {
      el.style.opacity = '0';
      A(el, [{ opacity: 0, transform: `translateY(${off}px)`, offset: 0, easing: 'cubic-bezier(.2,.8,.2,1)' }, { opacity: 1, transform: 'translateY(0)', offset: 0.06, easing: 'linear' }, { opacity: 1, transform: 'translateY(0)', offset: 0.975, easing: 'ease-in' }, { opacity: 0, transform: `translateY(-${off / 2}px)`, offset: 1 }], t0, t1 - t0, { fill: 'none', easing: 'linear' });
    }
  });
  // programme list
  const list = mk('div', `position:absolute;left:62px;bottom:84px;width:300px;font:500 17px ${MONO};letter-spacing:.1em;text-transform:uppercase`, '', col);
  names.forEach((nm, i) => {
    const row = mk('div', `display:flex;align-items:flex-end;gap:8px;padding:7px 0;color:#7a6c58`, '', list);
    const a = mk('span', '', String(i + 1).padStart(2, '0'), row);
    mk('span', 'flex:1;border-bottom:1.5px dotted #4a3f31;margin-bottom:5px', '', row);
    const b = mk('span', '', labels[i]!.toUpperCase(), row);
    const t0 = steps[i]!.t;
    for (const el of [row, a, b]) A(el, [{ color: '#7a6c58' }, { color: LIT }], t0, 0.01, { easing: 'linear' });
    if (i + 1 < steps.length) A(row, [{ color: LIT }, { color: '#7a6c58' }], steps[i + 1]!.t, 0.01, { easing: 'linear' });
    // children inherit via explicit colour: mirror on the spans
    for (const el of [a, b]) {
      A(el, [{ color: '#7a6c58' }, { color: LIT }], t0, 0.01, { easing: 'linear' });
      if (i + 1 < steps.length) A(el, [{ color: LIT }, { color: '#7a6c58' }], steps[i + 1]!.t, 0.01, { easing: 'linear' });
    }
  });

  // ---- right: everything else lives in one camera ----
  const right = layer(s, 'left:420px;overflow:visible');
  const cam = layer(right, 'transform-origin:50% 50%');
  A(cam, [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }], start, end - start, { easing: 'linear' });

  // popup (the real popup page, in an iframe)
  const popupWrap = layer(cam);
  vis(popupWrap, start, cues.demo.browserIn + 0.3);
  const PW = 372, PS = 1.68;
  const frame = document.createElement('iframe');
  frame.src = '/ext/popup/popup.html';
  frame.style.cssText = `position:absolute;left:${420 + 740 - (PW * PS) / 2 - 420}px;top:${(1080 - 600 * PS) / 2}px;width:${PW}px;height:600px;border:0;transform-origin:0 0;transform:scale(${PS});background:#F1E8D4`;
  popupWrap.append(frame);
  await new Promise<void>((res) => { frame.onload = () => res(); });
  const fd = frame.contentDocument!;
  for (let i = 0; i < 100 && !fd.querySelector('#themes .tile'); i++) await new Promise((r) => setTimeout(r, 30));
  await fd.fonts.ready;
  // a hairline "paper edge" so the popup reads as an object on the dark ground
  const fr = frame.getBoundingClientRect();
  mk('div', `position:absolute;left:${fr.left - 420 - 3}px;top:${fr.top - 3}px;width:${PW * PS + 6}px;height:${600 * PS + 6}px;border:3px solid ${PAPER};box-sizing:border-box;pointer-events:none`, '', popupWrap);
  const tiles = [...fd.querySelectorAll<HTMLElement>('#themes .tile')];
  const tileCenter = (i: number) => {
    const r = tiles[i]!.getBoundingClientRect();
    return { x: fr.left + (r.left + r.width / 2) * PS - 420 + 420, y: fr.top + (r.top + r.height / 2) * PS };
  };
  // wrapper offset: cursor lives in `right`, whose origin is at x=420
  const toRight = (p: { x: number; y: number }) => ({ x: p.x - 420, y: p.y });
  const order = [2, 3, 0]; // mission, pixel, marquee (index in THEMES order: marquee, terminal, mission, pixel, crawler, quiet)
  cues.demo.themeClicks.forEach((t, k) => at(t, () => tiles[order[k]!]!.click()));

  // browser
  const bw = 1420, bh = 940, bx = 30, by = 70;
  const browser = mk('div', `position:absolute;left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px;background:#202124;border-radius:14px;overflow:hidden;opacity:0`, '', cam);
  vis(browser, cues.demo.browserIn, end);
  A(browser, [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], cues.demo.browserIn, 0.45, { easing: 'cubic-bezier(.7,0,.2,1)', fill: 'none' });
  gh.chrome(browser, bw);
  const url = browser.querySelector<HTMLElement>('.u-text')!;
  const tabTitle = browser.querySelector<HTMLElement>('.t-title')!;
  const view = mk('div', `position:absolute;left:0;top:96px;width:${bw}px;height:${bh - 96}px;overflow:hidden;background:#0d1117`, '', browser);
  const sc = bw / 1108;
  const pages = gh.pages(view, sc);
  const swap = (t: number, page: HTMLElement, u: string, title: string) => {
    at(t, () => { url.textContent = u; tabTitle.textContent = title; });
    void page;
  };
  // pages
  const D = cues.demo;
  vis(pages.newRepo, D.browserIn, D.shows[0]!.t + 0.15);
  vis(pages.repo, D.shows[0]!.t + 0.15, steps[2]!.t);
  vis(pages.pr, steps[2]!.t, end);
  swap(D.browserIn, pages.newRepo, 'github.com/new', 'Create a New Repository');
  swap(D.shows[0]!.t + 0.15, pages.repo, 'github.com/acme/widget-shop', 'acme/widget-shop');
  swap(steps[2]!.t, pages.pr, 'github.com/acme/widget-shop/pull/42', 'Fix flaky login redirect on Safari #42');

  // typing the name
  const nameEl = pages.newRepo.querySelector<HTMLElement>('.f-name')!;
  const nameCaret = pages.newRepo.querySelector<HTMLElement>('.f-caret')!;
  const word = 'widget-shop';
  const ts = D.typeStart, te = D.typeEnd;
  at(ts - 0.05, () => { nameCaret.style.opacity = '1'; });
  [...word].forEach((_, i) => at(ts + ((te - ts) * i) / word.length, () => { nameEl.textContent = word.slice(0, i + 1); }));
  // availability tick appears once typed
  const okEl = pages.newRepo.querySelector<HTMLElement>('.f-ok')!;
  okEl.style.opacity = '0';
  A(okEl, [{ opacity: 0 }, { opacity: 1 }], te + 0.12, 0.2);

  // the checks box states
  const checkTimes = { fail: D.checksFail, pass: D.checksPass, merge: D.shows[2]!.t };
  vis(pages.boxPending, steps[2]!.t, checkTimes.fail);
  vis(pages.boxFail, checkTimes.fail, checkTimes.pass);
  vis(pages.boxPass, checkTimes.pass, checkTimes.merge);
  vis(pages.boxMerged, checkTimes.merge, end);
  vis(pages.commitFix, steps[3]!.t + 0.3, end, 0);
  A(pages.openPill, [{ opacity: 1 }, { opacity: 0 }], checkTimes.merge, 0.001);
  A(pages.mergedPill, [{ opacity: 0 }, { opacity: 1 }], checkTimes.merge, 0.001);
  pages.openPill.style.opacity = '1';
  pages.mergedPill.style.opacity = '0';

  // ---- cursor path across the whole demo ----
  const cur = makeCursor(right);
  cur.show(start + 0.4, checkTimes.merge + 0.9);
  const cMarq = toRight(tileCenter(0)), cMiss = toRight(tileCenter(2)), cPix = toRight(tileCenter(3));
  const createBtn = toRight(centerOf(pages.newRepo.querySelector('.f-create')!));
  const nameField = toRight(centerOf(pages.newRepo.querySelector('.f-input')!));
  const mergeBtn = toRight(centerOf(pages.boxPass.querySelector('.b-merge')!));
  const ct = D.themeClicks;
  cur.path([
    { t: start + 0.4, x: 900, y: 900 }, { t: ct[0]! - 0.05, x: cMiss.x, y: cMiss.y }, { t: ct[1]! - 0.05, x: cPix.x, y: cPix.y }, { t: ct[2]! - 0.05, x: cMarq.x, y: cMarq.y },
    { t: ct[2]! + 0.6, x: cMarq.x + 10, y: cMarq.y + 10 },
    { t: ts - 0.1, x: nameField.x + 120, y: nameField.y + 6 },
    { t: te + 0.3, x: nameField.x + 130, y: nameField.y + 8 },
    { t: D.shows[0]!.t - 0.06, x: createBtn.x, y: createBtn.y },
    { t: D.shows[0]!.t + 1.2, x: createBtn.x + 220, y: createBtn.y + 260 },
    { t: checkTimes.pass + 0.2, x: 700, y: 600 },
    { t: checkTimes.merge - 0.05, x: mergeBtn.x, y: mergeBtn.y },
    { t: checkTimes.merge + 0.9, x: mergeBtn.x + 120, y: mergeBtn.y + 140 },
  ]);
  ct.forEach((t, k) => { const c = [cMiss, cPix, cMarq][k]!; cur.click(t, c.x, c.y); });
  cur.click(D.shows[0]!.t - 0.02, createBtn.x, createBtn.y);
  cur.click(D.mergeClick, mergeBtn.x, mergeBtn.y);
  nameField && void 0;

  // ---- the real engine, over the page, exactly where the extension puts it ----
  const hostEl = pages.overlayHost;
  D.shows.forEach((sh) => at(sh.t, () => {
    Footlit.stop();
    void Footlit.play({ theme: 'marquee', event: sh.event, scale: sh.scale, container: hostEl, subject: sh.subject, detail: sh.detail });
  }));
  at(end - 0.0, () => Footlit.stop());
  // the engine host needs to sit inside the viewport (not the whole stage): see gh.pages()
  void bh;
}

// =====================================================================
// SCENE 5: the trust beat, as a printed programme.
// =====================================================================
function trust() {
  const { start, end, nums } = cues.trust;
  const s = layer(film, `background:${PAPER};overflow:hidden`);
  vis(s, start, end);
  A(s, [{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], start, 0.22, { easing: 'cubic-bezier(.7,0,.2,1)', fill: 'none' });
  // double rule header
  mk('div', `position:absolute;left:96px;right:96px;top:104px;height:3px;background:${INK}`, '', s);
  mk('div', `position:absolute;left:96px;right:96px;top:112px;height:1.5px;background:${INK}`, '', s);
  mk('div', `position:absolute;left:96px;top:60px;font:500 22px ${MONO};letter-spacing:.2em;color:#5C5043`, 'THE PROGRAMME', s);
  mk('div', `position:absolute;right:96px;top:60px;font:500 22px ${MONO};letter-spacing:.2em;color:#5C5043`, 'FOOTLIT / V1', s);
  const cols = [
    { n: '11', l: 'events', sub: 'repo, pull request, checks, deploy, release, issue' },
    { n: '6', l: 'themes', sub: 'marquee, terminal, mission control, pixel, crawler, quiet' },
    { n: '0', l: 'bytes leave your browser', sub: 'no account, no analytics, no servers' },
  ];
  cols.forEach((c, i) => {
    const x = 96 + i * 600;
    const box = mk('div', `position:absolute;left:${x}px;top:170px;width:560px;height:760px`, '', s);
    const n = mk('div', `position:absolute;left:-6px;top:0;font:400 640px/0.92 ${DISPLAY};color:${i === 2 ? '#B8301F' : INK};letter-spacing:-.01em`, c.n, box);
    const l = mk('div', `position:absolute;left:0;top:590px;font:italic 500 64px/1.05 ${TEXT};color:${INK};width:540px`, c.l, box);
    const sub = mk('div', `position:absolute;left:0;top:760px;font:500 20px/1.45 ${MONO};letter-spacing:.06em;color:#5C5043;text-transform:uppercase;width:520px`, c.sub, box);
    if (i < 2) mk('div', `position:absolute;right:-20px;top:20px;width:1.5px;height:700px;background:${INK};opacity:.5`, '', box);
    for (const [el, dy] of [[n, 120], [l, 40], [sub, 20]] as const) { el.style.opacity = '0'; A(el, [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }], nums[i]! + (el === n ? 0 : 0.12), el === n ? 0.35 : 0.4); }
  });
}

// =====================================================================
// SCENE 6: end card.
// =====================================================================
function endCard() {
  const { start, end } = cues.end;
  const s = layer(film, `background:${INK};overflow:hidden`);
  vis(s, start, end);
  // cone
  [{ w: 1100, o: 0.08 }, { w: 780, o: 0.1 }, { w: 460, o: 0.14 }].forEach((b, i) => {
    const el = mk('div', `position:absolute;left:${960 - b.w / 2}px;top:0;width:${b.w}px;height:1080px;background:${LIT};opacity:0;clip-path:polygon(40% 0,60% 0,100% 100%,0 100%)`, '', s);
    A(el, [{ opacity: 0 }, { opacity: b.o }], start + i * 0.1, 0.1, { easing: 'linear' });
  });
  const icon = mk('img', `position:absolute;left:${960 - 96}px;top:170px;width:192px;height:192px;image-rendering:auto`, '', s) as HTMLImageElement;
  icon.src = '/ext/icons/icon-128.png';
  A(icon, [{ opacity: 0, transform: 'translateY(30px) scale(.9)' }, { opacity: 1, transform: 'none' }], start + 0.1, 0.45);
  const word = mk('div', `position:absolute;left:0;right:0;top:380px;text-align:center;font:400 250px/1 ${DISPLAY};letter-spacing:.03em;color:${PAPER};text-transform:uppercase`, 'Footlit', s);
  A(word, [{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], start + 0.2, 0.45);
  const free = mk('div', `position:absolute;left:0;right:0;top:660px;text-align:center;font:italic 400 66px ${TEXT};color:${LIT}`, 'Free for Chrome and Firefox.', s);
  free.style.opacity = '0';
  A(free, [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], start + 0.95, 0.45);
  const urlEl = mk('div', `position:absolute;left:0;right:0;top:790px;text-align:center;font:500 34px ${MONO};letter-spacing:.16em;color:${PAPER}`, 'footlit-app.vercel.app', s);
  urlEl.style.opacity = '0';
  A(urlEl, [{ opacity: 0 }, { opacity: 1 }], start + 1.6, 0.45);
  mk('div', `position:absolute;left:0;right:0;top:860px;height:2px;width:520px;margin:0 auto;background:${PAPER};opacity:.35`, '', s);
  const by = mk('div', `position:absolute;left:0;right:0;top:884px;text-align:center;font:500 20px ${MONO};letter-spacing:.2em;color:#B5A78F;text-transform:uppercase`, 'Built by Ammad Ahmed  /  Codeveil Studio', s);
  by.style.opacity = '0';
  A(by, [{ opacity: 0 }, { opacity: 1 }], start + 2.3, 0.45);
  // footlights along the bottom
  const row = mk('div', 'position:absolute;left:0;right:0;bottom:0;height:60px;display:flex;justify-content:space-between;padding:0 62px;align-items:flex-end', '', s);
  for (let i = 0; i < 15; i++) {
    const l = mk('div', `width:88px;height:38px;border-radius:38px 38px 0 0;background:${LIT}`, '', row);
    A(l, [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], start + 2.6 + i * 0.1, 1.0, { easing: 'linear', fill: 'none' });
  }
  mk('div', `position:absolute;left:0;right:0;bottom:0;height:8px;background:${PAPER}`, '', s);
  const fade = layer(s, 'background:#000;opacity:0');
  A(fade, [{ opacity: 0 }, { opacity: 1 }], end - 0.6, 0.55, { easing: 'ease-in' });
}

// ---------- boot ----------
async function boot() {
  const st = (s: string) => ((window as unknown as { __stage: string }).__stage = s);
  st('fonts');
  await Promise.all([
    document.fonts.load('40px "League Gothic"'), document.fonts.load('40px "Newsreader"'), document.fonts.load('italic 40px "Newsreader"'),
    document.fonts.load('20px "DM Mono"'), document.fonts.load('500 20px "DM Mono"'),
  ]);
  st('warm');
  // warm every theme's fonts in real time, so nothing is fetched while the clock is frozen
  const warm = layer(film, 'opacity:0');
  // (no frames are produced until the renderer asks for one, so just let the font fetch finish, then abort)
  for (const t of Footlit.themes) { void Footlit.play({ theme: t.id, event: 'pr.merged', container: warm }); await new Promise((r) => setTimeout(r, 450)); Footlit.stop(); }
  warm.remove();

  if (q.get('lab')) { w.__ready = true; return; }
  const only = q.get('only');
  st('scenes'); hook(); montage(); logo(); st('demo'); await demo(); st('rest'); trust(); endCard();
  if (only) {
    // preview helper: ?only=hook shows only that scene by hiding the others at all times is not needed, the renderer picks times.
  }
  w.__ready = true;
}

w.__start = () => {
  const lab = q.get('lab');
  if (lab === 'all') {
    void (async () => {
      for (const theme of Footlit.themes.map((t) => t.id)) for (const event of ['repo.created', 'pr.merged', 'ci.failed', 'release.published', 'repo.deleted']) {
        const t0 = performance.now();
        await Footlit.play({ theme, event });
        console.log('[film]', theme, event, ((performance.now() - t0) / 1000).toFixed(2) + 's');
      }
    })();
    return;
  }
  if (lab) {
    const [theme, event, scale] = lab.split(':');
    void Footlit.play({ theme, event, scale: Number(scale ?? 1) });
    return;
  }
  jobs.forEach((j) => j());
};
void boot().catch((e) => console.log('[film] boot failed', e?.stack ?? e));
void INK; void ALARM;
