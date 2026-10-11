// The Footlit teaser, 1080x1920 for Reels / Shorts / Stories: hook, montage, silence, logo, "coming soon".
// Text stays inside the platform safe zone (clear of the top 14% and bottom 22%).
import cues from './teaser-cues.json';
import { buildGh } from './gh';
import { INK, PAPER, LIT, DISPLAY, TEXT, MONO, jobs, at, A, vis, mk, layer, makeCursor, centerOf } from './kit';

declare const Footlit: { play(o: Record<string, unknown>): Promise<void>; stop(): void; themes: { id: string; name: string }[] };
const w = window as unknown as { __ready: boolean; __start: () => void };
const q = new URLSearchParams(location.search);
const film = document.getElementById('film')!;

// ---- 1. the hook: a merge with nothing to mark it ----
function hook() {
  const { start, end, click } = cues.hook;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  const gh = buildGh();
  const stage = mk('div', 'position:absolute;left:50%;top:960px;width:760px;height:220px;margin:-110px 0 0 -380px;transform-origin:50% 50%', '', s);
  stage.style.transform = 'scale(1.3)';
  const box = mk('div', 'position:absolute;inset:0', '', stage);
  box.innerHTML = gh.hookBoxes();
  const open = box.querySelector<HTMLElement>('.h-open')!;
  const done = box.querySelector<HTMLElement>('.h-done')!;
  open.style.opacity = '1';
  done.style.opacity = '0';
  A(open, [{ opacity: 1 }, { opacity: 0 }], click, 0.001);
  A(done, [{ opacity: 0 }, { opacity: 1 }], click, 0.001);
  A(stage, [{ transform: 'scale(1.3)' }, { transform: 'scale(1.4)' }], start, end - start, { easing: 'linear' });
  // captions for viewers with the sound off
  const l1 = mk('div', `position:absolute;left:60px;right:60px;top:430px;text-align:center;font:italic 400 66px/1.1 ${TEXT};color:${PAPER}`, "Every merge you've ever done…", s);
  const l2 = mk('div', `position:absolute;left:60px;right:60px;top:1330px;text-align:center;font:italic 400 76px/1.1 ${TEXT};color:${LIT}`, '…deserved better.', s);
  for (const [el, t0] of [[l1, 0.2], [l2, 1.55]] as const) {
    el.style.opacity = '0';
    A(el, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], t0, 0.4);
  }
  const fadeOut = layer(s, 'background:#000;opacity:0');
  A(fadeOut, [{ opacity: 0 }, { opacity: 1 }], end - 0.22, 0.2, { easing: 'ease-in' });
  const cur = makeCursor(s);
  const c = centerOf(box.querySelector('.h-btn')!);
  cur.show(start, end);
  cur.path([{ t: 0.1, x: 900, y: 1280 }, { t: click - 0.05, x: c.x + 24, y: c.y + 20 }]);
  cur.click(click, c.x + 24, c.y + 20);
}

// ---- 2. the montage: the real engine, cut on the beat ----
function montage() {
  const { start, end, shots, payoff } = cues.montage;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  const host = layer(s);
  const hud = layer(s, 'z-index:5;pointer-events:none');
  const names: Record<string, string> = { marquee: 'Marquee', terminal: 'Terminal', mission: 'Mission Control', pixel: 'Pixel Arcade', crawler: 'Web Crawler' };
  let t = start;
  shots.forEach((sh, i) => {
    const t0 = t;
    const scale = (sh.dur * 0.82) / (payoff as Record<string, number>)[sh.theme]!;
    at(t0, () => {
      Footlit.stop();
      void Footlit.play({ theme: sh.theme, event: sh.event, scale, container: host, subject: 'acme/widget-shop #42', detail: 'Fix flaky login redirect on Safari' });
    });
    const chip = mk('div', `position:absolute;left:54px;top:300px;padding:11px 18px 9px;background:${INK};color:${PAPER};font:500 27px ${MONO};letter-spacing:.1em;text-transform:uppercase;border-left:7px solid ${LIT};opacity:0`, `${names[sh.theme]}  /  ${sh.event.replace('.', ' ')}`, hud);
    vis(chip, t0, t0 + sh.dur);
    // a plain-language line for every shot, so it is obvious what is happening and why
    const bar = mk('div', `position:absolute;left:0;right:0;top:1350px;height:118px;background:${INK};border-top:4px solid ${LIT};display:flex;align-items:center;justify-content:center;font:italic 400 54px ${TEXT};color:${PAPER};opacity:0`, sh.caption, hud);
    vis(bar, t0, t0 + sh.dur);
    const flash = layer(hud, `background:${PAPER};opacity:0`);
    A(flash, [{ opacity: i % 2 ? 0.28 : 0.42 }, { opacity: 0 }], t0, 0.14, { easing: 'linear', fill: 'none' });
    t += sh.dur;
    if (i === shots.length - 1) at(t, () => Footlit.stop());
  });
  void end;
}

// ---- 3. the logo, the real extension, and the promise ----
async function logo() {
  const { start, end, popupAt, stampAt } = cues.logo;
  const s = layer(film, 'background:#0c0906;overflow:hidden');
  vis(s, start, end);
  [{ w: 1300, o: 0.1 }, { w: 1020, o: 0.12 }, { w: 740, o: 0.16 }, { w: 470, o: 0.22 }].forEach((b, i) => {
    const el = mk('div', `position:absolute;left:${540 - b.w / 2}px;top:0;width:${b.w}px;height:1920px;background:${LIT};opacity:0;clip-path:polygon(40% 0,60% 0,100% 100%,0 100%)`, '', s);
    A(el, [{ opacity: 0 }, { opacity: b.o }], start + 0.05 + i * 0.1, 0.1, { easing: 'linear' });
  });
  const row = mk('div', 'position:absolute;left:0;right:0;bottom:0;height:70px;display:flex;justify-content:space-between;padding:0 30px;align-items:flex-end', '', s);
  for (let i = 0; i < 9; i++) {
    const lamp = mk('div', 'width:100px;height:50px;border-radius:50px 50px 0 0;background:#3a2c14;position:relative', '', row);
    const on = mk('div', `position:absolute;inset:0;border-radius:50px 50px 0 0;background:${LIT};opacity:0`, '', lamp);
    A(on, [{ opacity: 0 }, { opacity: 1 }], start + 0.2 + i * 0.05, 0.05, { easing: 'linear' });
  }
  mk('div', `position:absolute;left:0;right:0;bottom:0;height:8px;background:${PAPER}`, '', s);
  const word = mk('div', `position:absolute;left:0;right:0;top:262px;text-align:center;font:400 250px/1 ${DISPLAY};letter-spacing:.02em;color:${PAPER};text-transform:uppercase;display:flex;justify-content:center`, '', s);
  'FOOTLIT'.split('').forEach((ch, i) => {
    const l = mk('span', 'display:inline-block;overflow:hidden;line-height:.86;padding-top:.04em', '', word);
    A(mk('span', 'display:inline-block', ch, l), [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], start + 0.3 + i * 0.06, 0.4, { easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  const tag = mk('div', `position:absolute;left:60px;right:60px;top:520px;text-align:center;font:italic 400 52px/1.15 ${TEXT};color:${LIT};opacity:0`, 'Every GitHub event gets a show.', s);
  A(tag, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], start + 0.95, 0.4);
  const what = mk('div', `position:absolute;left:60px;right:60px;top:600px;text-align:center;font:500 26px/1.4 ${MONO};letter-spacing:.14em;color:#B5A78F;text-transform:uppercase;opacity:0`, 'A free browser extension for GitHub', s);
  A(what, [{ opacity: 0 }, { opacity: 1 }], start + 1.25, 0.4);

  // the real popup, cropped to its top (theme tiles and first events), sliding up into frame
  const PS = 2.0, PW = 372, CH = 335;
  const holder = mk('div', `position:absolute;left:${(1080 - PW * PS) / 2}px;top:700px;width:${PW * PS}px;height:${CH * PS}px;overflow:hidden;border:5px solid ${PAPER};margin-left:-5px;box-sizing:content-box;opacity:0`, '', s);
  const frame = document.createElement('iframe');
  frame.src = '/ext/popup/popup.html?theme=marquee';
  frame.style.cssText = `position:absolute;left:0;top:0;width:${PW}px;height:700px;border:0;transform-origin:0 0;transform:scale(${PS});background:#F1E8D4`;
  holder.append(frame);
  await new Promise<void>((res) => { frame.onload = () => res(); });
  const fd = frame.contentDocument!;
  for (let i = 0; i < 100 && !fd.querySelector('#themes .tile'); i++) await new Promise((r) => setTimeout(r, 30));
  await fd.fonts.ready;
  A(holder, [{ opacity: 0, transform: 'translateY(90px)' }, { opacity: 1, transform: 'none' }], start + popupAt, 0.5, { easing: 'cubic-bezier(.2,.8,.2,1)' });

  // the stamp slams down on the corner of the popup
  const stampBox = mk('div', 'position:absolute;left:0;right:0;top:1330px;display:flex;justify-content:center', '', s);
  const stamp = mk('div', `background:${INK};border:5px solid ${LIT};color:${LIT};padding:16px 34px 12px;font:500 56px ${MONO};letter-spacing:.22em;transform:rotate(-3deg);opacity:0`, 'COMING SOON', stampBox);
  const rot = 'rotate(-3deg)';
  A(stamp, [
    { opacity: 0, transform: `${rot} scale(1.7)`, offset: 0 },
    { opacity: 1, transform: `${rot} scale(1)`, offset: 0.55 },
    { opacity: 1, transform: `${rot} scale(1.04)`, offset: 0.75 },
    { opacity: 1, transform: `${rot} scale(1)`, offset: 1 },
  ], start + stampAt, 0.3, { easing: 'cubic-bezier(.3,.9,.3,1)' });
  const sub = mk('div', `position:absolute;left:60px;right:60px;top:1452px;text-align:center;font:500 24px/1.5 ${MONO};letter-spacing:.16em;color:#B5A78F;text-transform:uppercase;opacity:0`, 'Chrome, Edge and Firefox, on desktop', s);
  A(sub, [{ opacity: 0 }, { opacity: 1 }], start + stampAt + 0.4, 0.4);
  const fade = layer(s, 'background:#000;opacity:0');
  A(fade, [{ opacity: 0 }, { opacity: 1 }], end - 0.3, 0.27, { easing: 'ease-in' });
}

async function boot() {
  await Promise.all([
    document.fonts.load('40px "League Gothic"'), document.fonts.load('40px "Newsreader"'), document.fonts.load('italic 40px "Newsreader"'),
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
  if (q.get('cover') === 'bravo') {
    // still for the Reel cover / profile grid: the BRAVO! sign with the wordmark above and the promise below (kept inside the 4:5 grid crop)
    const hud = layer(film, 'z-index:9;pointer-events:none');
    mk('div', `position:absolute;left:0;right:0;top:300px;text-align:center;font:400 250px/1 ${DISPLAY};letter-spacing:.03em;color:${PAPER};text-transform:uppercase;text-shadow:0 6px 0 ${INK}`, 'Footlit', hud);
    const sb = mk('div', 'position:absolute;left:0;right:0;top:1390px;display:flex;justify-content:center', '', hud);
    mk('div', `background:${INK};border:5px solid ${LIT};color:${LIT};padding:16px 34px 12px;font:500 54px ${MONO};letter-spacing:.22em;transform:rotate(-3deg)`, 'COMING SOON', sb);
    mk('div', `position:absolute;left:0;right:0;top:1290px;text-align:center;font:500 27px ${MONO};letter-spacing:.16em;color:${PAPER};text-transform:uppercase;text-shadow:0 0 8px ${INK},0 0 3px ${INK}`, 'A browser extension for GitHub', hud);
  } else if (!q.get('lab')) { hook(); montage(); await logo(); }
  w.__ready = true;
}
w.__start = () => {
  const lab = q.get('lab') ?? (q.get('cover') === 'bravo' ? 'marquee:pr.merged:1' : null);
  if (lab) {
    const [theme, event, scale] = lab.split(':');
    void Footlit.play({ theme, event, scale: Number(scale ?? 1), container: film });
    return;
  }
  jobs.forEach((j) => j());
};
void boot().catch((e) => console.log('[film] boot failed', e?.stack ?? e));
