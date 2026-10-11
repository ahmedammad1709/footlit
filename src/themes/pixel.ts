import css from './pixel.css';
import type { PlayContext, Theme } from '../engine/types';
import { anim, h, pick, rand } from '../engine/util';
import { parseSubject } from '../engine/subject';

const C = {
  navy: '#1D2B53', plum: '#7E2553', green: '#008751', brown: '#AB5236', gray: '#5F574F', silver: '#C2C3C7', white: '#FFF1E8',
  red: '#FF004D', orange: '#FFA300', yellow: '#FFEC27', lime: '#00E436', blue: '#29ADFF', lav: '#83769C', pink: '#FF77A8', black: '#000000',
};
const SPARK = [C.yellow, C.orange, C.red, C.pink, C.blue, C.lime, C.white];
const KEY: Record<string, string> = { K: C.black, B: C.blue, W: C.white, O: C.orange, R: C.red };

// An original 12x12 hero: a little visor-faced robot.
const HEAD = ['....KKKK....', '...KBBBBK...', '..KBBBBBBK..', '..KBWWWWBK..', '..KBWKWKBK..', '..KBWWWWBK..', '..KBBBBBBK..', '...KOOOOK...', '...KBBBBK...'];
const HEAD_DEAD = ['....KKKK....', '...KBBBBK...', '..KBBBBBBK..', '..KBRWWRBK..', '..KBWRRWBK..', '..KBWWWWBK..', '..KBBBBBBK..', '...KOOOOK...', '...KBBBBK...'];
const LEGS = {
  stand: ['...KB..BK...', '...KK..KK...'],
  runA: ['..KB....BK..', '..KK....KK..'],
  runB: ['....KBBK....', '....KKKK....'],
};
type Frame = 'stand' | 'runA' | 'runB' | 'dead';
const sprite = (f: Frame): string[] => (f === 'dead' ? [...HEAD_DEAD, ...LEGS.runB] : [...HEAD, ...LEGS[f]]);

interface P { x: number; y: number; vx: number; vy: number; c: string; life: number; ttl: number; s: number }

const pad = (n: number, len = 6) => String(Math.max(0, Math.floor(n))).padStart(len, '0');

const TITLE: Record<string, string> = { 'repo.created': 'New game!', 'pr.merged': 'Stage clear!', 'ci.passed': 'All clear!' };
const KICK: Record<string, string> = { 'repo.created': 'World unlocked', 'pr.merged': 'Bonus stage', 'ci.passed': 'Tests passed' };

async function play(ctx: PlayContext) {
  const { box, clk, signal, mood } = ctx;
  const sub = parseSubject(ctx.subject);
  const alarm = mood === 'alarm';
  const farewell = mood === 'farewell';
  const root = h('div', { class: `px ${mood}` });
  const dim = h('div', { class: 'px-dim' });
  const cv = h('canvas', { class: 'px-cv' });
  const scan = h('div', { class: 'px-scan' });
  const flash = h('div', { class: 'px-flash' });
  const score = h('b', { text: '000000' });
  const hud = h('div', { class: 'px-hud' }, [h('span', {}, ['1UP ', score]), h('span', {}, ['HI ', h('b', { text: '099999' })]), h('span', { text: `x${pad(Math.min(ctx.tally, 99), 2)}` })]);
  const title = h('h1', { class: 'px-title', text: alarm ? 'Game over' : farewell ? 'Save deleted' : (TITLE[ctx.eventId] ?? 'Stage clear!') });
  const who = sub.nwo ? `${sub.nwo}${sub.num ? ` #${sub.num}` : ''}` : ctx.subject;
  const bonus = 1000 + (ctx.tally % 9) * 500;
  const sub1 = h('p', { class: 'px-sub' }, alarm ? [h('span', { class: 'r', text: 'Checks failed' })] : farewell ? [h('span', { class: 'c', text: 'Player 1 has left the game' })] : [h('span', { class: 'c', text: `${KICK[ctx.eventId] ?? 'Bonus'} ` }), h('span', { class: 'y', text: `+${bonus}` })]);
  const sub2 = h('p', { class: 'px-sub', text: who });
  sub2.style.marginTop = '.8em';
  const foot = h('div', { class: 'px-foot blink', text: alarm ? 'Continue? 9' : farewell ? 'Insert coin to start over' : 'Press start' });
  root.append(dim, cv, scan, hud, h('div', { class: 'px-stack' }, [title, sub1, sub2]), foot, flash);
  box.append(root);

  const reveal = (el: HTMLElement, delay: number, stepped = true) =>
    void anim(el, [{ opacity: 0, transform: 'translateY(-3.2em)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(380), delay: clk.d(delay), easing: stepped ? 'steps(5, end)' : 'ease-out' });

  // ---- canvas at a chunky logical resolution ----
  const k = Math.max(2, Math.round(box.clientHeight / 130));
  const W = Math.ceil(box.clientWidth / k);
  const H = Math.ceil(box.clientHeight / k);
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  const groundY = H - 18;
  const stars = Array.from({ length: 46 }, () => ({ x: Math.floor(rand(0, W)), y: Math.floor(rand(4, groundY - 30)), t: rand(0, 6) }));
  const parts: P[] = [];

  const rect = (x: number, y: number, w: number, hh: number, c: string) => {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), w, hh);
  };
  const drawSprite = (f: Frame, x: number, y: number, flipY = false) => {
    const rows = sprite(f);
    rows.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const ch = row[rx]!;
        if (ch === '.') continue;
        rect(x + rx, y + (flipY ? rows.length - 1 - ry : ry), 1, 1, KEY[ch]!);
      }
    });
  };
  const spawnFromSprite = (f: Frame, x: number, y: number) => {
    sprite(f).forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        const ch = row[rx]!;
        if (ch !== '.') parts.push({ x: x + rx, y: y + ry, vx: rand(-6, 6), vy: rand(-26, -8), c: KEY[ch]!, life: 0, ttl: rand(0.9, 1.6), s: 1 });
      }
    });
  };
  const burst = (x: number, y: number, n = 44) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(14, 46);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: pick(SPARK), life: 0, ttl: rand(0.7, 1.4), s: Math.random() < 0.3 ? 2 : 1 });
    }
  };

  // hero state, driven by the elapsed show time
  let frame: Frame = 'stand';
  let hx = -16;
  let hy = groundY + 1;
  let hFlip = false;
  let hHidden = false;
  let spikes = false;
  const spikeX = Math.round(W * 0.56);

  const scene = (t: number) => {
    // t is in unscaled milliseconds
    const run = (a: number, b: number, x0: number, x1: number) => x0 + (x1 - x0) * (1 - Math.pow(1 - Math.min(1, Math.max(0, (t - a) / (b - a))), 2));
    const stride = (Math.floor(t / 90) % 2 === 0 ? 'runA' : 'runB') as Frame;
    if (alarm) {
      spikes = true;
      if (t < 1050) {
        hx = run(0, 1050, -16, spikeX - 14);
        hy = groundY + 1;
        frame = stride;
      } else {
        const u = (t - 1050) / 1000;
        frame = 'dead';
        hFlip = true;
        hx = spikeX - 14 + u * 14;
        hy = groundY + 1 + (-50 * u + 70 * u * u);
      }
    } else if (farewell) {
      hx = Math.round(W * 0.5 - 6);
      hy = groundY + 1 - (t > 700 && t < 1500 && Math.floor(t / 250) % 2 === 1 ? 5 : 0);
      frame = 'stand';
      if (t > 1650) hHidden = true;
    } else {
      if (t < 1250) {
        hx = run(0, 1250, -16, W * 0.42);
        hy = groundY + 1;
        frame = stride;
      } else {
        const u = Math.min(1, (t - 1250) / 650);
        hx = W * 0.42 + u * 10;
        hy = groundY + 1 - (u < 1 ? Math.sin(u * Math.PI) * 28 : 0);
        frame = u < 1 ? 'runB' : 'stand';
      }
    }
  };

  const drawBackground = (t: number) => {
    g.clearRect(0, 0, W, H);
    for (const s of stars) {
      const on = Math.floor(t / 400 + s.t) % 5 !== 0;
      if (on) rect(s.x, s.y, 1, 1, s.t > 3 ? C.white : C.lav);
    }
    // ground: grass cap over brick rows
    rect(0, groundY + 12, W, 6, C.brown);
    rect(0, groundY + 12, W, 2, C.green);
    for (let x = 0; x < W; x += 8) {
      rect(x, groundY + 14, 1, 4, C.plum);
      rect(x + (Math.floor(x / 8) % 2) * 4, groundY + 16, 4, 1, C.plum);
    }
    if (spikes) {
      for (let i = 0; i < 4; i++) {
        const sx = spikeX + i * 6;
        for (let r = 0; r < 6; r++) rect(sx + Math.floor(r / 2), groundY + 12 - 1 - r, 6 - r - Math.floor(r / 2) * 1, 1, C.silver);
      }
    }
  };

  let ended = false;
  const t0 = performance.now();
  let last = t0;
  const loop = (now: number) => {
    if (signal.aborted || ended) return;
    const t = (now - t0) / clk.d(1);
    const dt = Math.min(0.05, (now - last) / 1000 / (clk.d(1) || 1));
    last = now;
    scene(t);
    drawBackground(t);
    if (!hHidden) drawSprite(frame, hx, hy, hFlip);
    for (const p of parts) {
      p.life += dt;
      p.vy += 62 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i]!.life > parts[i]!.ttl) parts.splice(i, 1);
    for (const p of parts) rect(p.x, p.y, p.s, p.s, p.c);
    requestAnimationFrame(loop);
  };

  // ---- reduced motion: a still frame ----
  if (ctx.reduced) {
    dim.style.opacity = '0.86';
    scan.style.opacity = '1';
    hud.style.opacity = '1';
    [title, sub1, sub2, foot].forEach((e) => (e.style.opacity = '1'));
    foot.classList.remove('blink');
    scene(alarm ? 1300 : farewell ? 500 : 1900);
    drawBackground(0);
    drawSprite(frame, hx, hy, hFlip);
    void anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    await clk.at(2300);
    void anim(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    await clk.at(2650);
    return;
  }

  void anim(dim, [{ opacity: 0 }, { opacity: 0.86 }], { duration: clk.d(300) });
  void anim(scan, [{ opacity: 0 }, { opacity: 1 }], { duration: clk.d(300) });
  void anim(hud, [{ opacity: 0 }, { opacity: 1 }], { duration: clk.d(300), delay: clk.d(150) });
  requestAnimationFrame(loop);

  // score counts up whenever points are awarded
  const countScore = (from: number, to: number, ms: number) => {
    const s0 = performance.now();
    const tick = (now: number) => {
      if (signal.aborted) return;
      const p = Math.min(1, (now - s0) / clk.d(ms));
      score.textContent = pad(from + (to - from) * p);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (alarm) {
    clk.after(1050, () => {
      void anim(flash, [{ opacity: 0 }, { opacity: 0.55 }, { opacity: 0 }], { duration: clk.d(380) });
      void anim(root, [{ transform: 'translate(0,0)' }, { transform: 'translate(-.8em,.4em)' }, { transform: 'translate(.8em,-.4em)' }, { transform: 'translate(-.4em,0)' }, { transform: 'none' }], { duration: clk.d(320) });
      for (let i = 0; i < 18; i++) parts.push({ x: spikeX - 4, y: groundY + 6, vx: rand(-30, 30), vy: rand(-40, -10), c: pick([C.red, C.orange, C.white]), life: 0, ttl: rand(0.5, 1), s: 1 });
    });
    clk.after(1300, () => reveal(title, 0));
    clk.after(1750, () => reveal(sub1, 0, false));
    clk.after(1900, () => reveal(sub2, 0, false));
    clk.after(2100, () => void anim(foot, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, fill: 'both' }));
    for (const [i, n] of [8, 7, 6].entries()) clk.after(2500 + i * 420, () => (foot.textContent = `Continue? ${n}`));
  } else if (farewell) {
    clk.after(900, () => reveal(title, 0));
    clk.after(1350, () => reveal(sub1, 0, false));
    clk.after(1500, () => reveal(sub2, 0, false));
    clk.after(1650, () => spawnFromSprite('stand', hx, groundY + 1));
    clk.after(2300, () => void anim(foot, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, fill: 'both' }));
  } else {
    clk.after(1250, () => {
      reveal(title, 0);
      countScore(0, bonus, 1500);
    });
    clk.after(1550, () => burst(hx + 6, groundY - 44));
    clk.after(1700, () => void reveal(sub1, 0, false));
    clk.after(1830, () => burst(W * 0.25, groundY - 70, 34));
    clk.after(1850, () => void reveal(sub2, 0, false));
    clk.after(2000, () => burst(W * 0.78, groundY - 64, 38));
    clk.after(2300, () => void anim(foot, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, fill: 'both' }));
  }

  const END = alarm ? 3900 : farewell ? 3600 : 3500;
  if (!(await clk.at(END))) {
    ended = true;
    return;
  }
  for (const el of [dim, cv, scan, hud, root.querySelector('.px-stack')!, foot]) void anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: clk.d(380), easing: 'steps(4, end)' });
  await clk.at(END + 420);
  ended = true;
}

export const pixel: Theme = {
  id: 'pixel',
  name: 'Pixel Arcade',
  tagline: 'Stage clear, game over, and a very small robot. Sixteen colours, no smoothing.',
  swatch: ['#1D2B53', '#FFEC27', '#29ADFF', '#FF004D'],
  fonts: ['pixel'],
  css,
  runtime: 4000,
  play,
};
