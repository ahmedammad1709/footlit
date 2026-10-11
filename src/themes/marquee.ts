import css from './marquee.css';
import type { PlayContext, Theme } from '../engine/types';
import { Confetti } from '../engine/confetti';
import { EASE, SPRING, anim, h } from '../engine/util';
import type { Mood } from '../shared/events';

const LAMPS = 15;
const OFF = '#3A2E22';
const LIT = '#F2A81D';
const HI = '#FFE29A';
const COLORS = ['#F2A81D', '#FFE29A', '#F1E8D4', '#E5604C', '#B8301F', '#F1E8D4'];

const APPLAUSE: Record<string, string> = {
  'repo.created': 'Opening night', 'repo.forked': 'Encore!', 'pr.opened': 'Curtain up', 'pr.merged': 'Bravo!',
  'ci.passed': 'All green', 'deploy.live': 'Now playing', 'release.published': 'Premiere', 'issue.closed': 'Case closed',
};
const FAREWELL: Record<string, string> = { 'repo.deleted': 'Exit, stage left', 'pr.closed': 'Cut from the bill' };
const HEADLINE: Record<Mood, (id: string) => string> = {
  applause: (id) => APPLAUSE[id] ?? 'Bravo!',
  farewell: (id) => FAREWELL[id] ?? 'Exit, stage left',
  alarm: () => 'Show stopped',
};

const pad = (n: number) => String(n).padStart(4, '0');

function buildLamps(root: HTMLElement) {
  const wrap = h('div', { class: 'mq-lamps' });
  const lamps = Array.from({ length: LAMPS }, () => h('div', { class: 'mq-lamp' }, [h('i')]));
  wrap.append(...lamps);
  root.append(h('div', { class: 'mq-lip' }), wrap);
  return lamps;
}

/** footlights come on from the middle outwards */
function ignite(lamps: HTMLElement[], ctx: PlayContext, start = 0) {
  const mid = (lamps.length - 1) / 2;
  lamps.forEach((l, i) => {
    const delay = ctx.clk.d(start + Math.abs(i - mid) * 38);
    void anim(l, [{ background: OFF }, { background: LIT }, { background: '#7A5A1C' }, { background: HI }, { background: LIT }], { duration: ctx.clk.d(420), delay });
    ctx.clk.after(start + Math.abs(i - mid) * 38 + 60, () => l.classList.add('on'));
  });
}

/** …and go out from the edges inwards */
function extinguish(lamps: HTMLElement[], ctx: PlayContext, start: number) {
  const mid = (lamps.length - 1) / 2;
  lamps.forEach((l, i) => {
    const delay = ctx.clk.d(start + (mid - Math.abs(i - mid)) * 70);
    void anim(l, [{ background: LIT }, { background: '#6B4E1A' }, { background: OFF }], { duration: ctx.clk.d(260), delay });
    ctx.clk.after(start + (mid - Math.abs(i - mid)) * 70, () => l.classList.remove('on'));
  });
}

function buildBeams(root: HTMLElement) {
  const bands = (['b1', 'b2', 'b3'] as const).map((c) => h('div', { class: `mq-beam ${c}` }));
  root.append(...bands);
  return bands;
}

function riseBeams(bands: HTMLElement[], ctx: PlayContext, start: number) {
  const target = [0.14, 0.22, 0.34];
  bands.forEach((b, i) => {
    void anim(b, [{ transform: 'scaleY(0)', opacity: 0 }, { transform: 'scaleY(1)', opacity: target[i]! }], { duration: ctx.clk.d(620), delay: ctx.clk.d(start + i * 90), easing: EASE });
  });
}

function placeBulbs(bill: HTMLElement, bulbsEl: HTMLElement) {
  const fs = parseFloat(getComputedStyle(bill).fontSize) || 16;
  const w = bill.offsetWidth / fs;
  const hgt = bill.offsetHeight / fs;
  const gap = 3.1;
  const nx = Math.max(4, Math.round(w / gap));
  const ny = Math.max(2, Math.round(hgt / gap));
  const pts: [number, number][] = [];
  for (let i = 0; i < nx; i++) pts.push([(i / nx) * 100, 0]);
  for (let i = 0; i < ny; i++) pts.push([100, (i / ny) * 100]);
  for (let i = 0; i < nx; i++) pts.push([100 - (i / nx) * 100, 100]);
  for (let i = 0; i < ny; i++) pts.push([0, 100 - (i / ny) * 100]);
  pts.forEach(([x, y], i) => {
    const b = h('i', { class: 'mq-bulb', style: `left:${x}%;top:${y}%;--i:${i}` });
    bulbsEl.append(b);
  });
}

interface Bill {
  stack: HTMLElement;
  bill: HTMLElement;
  letters: HTMLElement[];
  bulbs: HTMLElement;
  ticketWrap: HTMLElement;
  ticket: HTMLElement;
}

function buildBill(root: HTMLElement, ctx: PlayContext, headline: string): Bill {
  const letters = [...headline].map((ch) => h('span', { text: ch }));
  const title = h('div', { class: 'mq-title' }, letters);
  const bulbs = h('div', { class: 'mq-bulbs', style: 'position:absolute;inset:-.25em' });
  const bill = h('div', { class: 'mq-bill' }, [h('div', { class: 'mq-chain l' }), h('div', { class: 'mq-chain r' }), bulbs, title]);

  const main = h('div', { class: 'mq-main' }, [h('div', { class: 'mq-kicker', text: ctx.kicker })]);
  if (ctx.subject) main.append(h('div', { class: 'mq-subject', text: ctx.subject }));
  if (ctx.detail) main.append(h('div', { class: 'mq-detail', text: ctx.detail }));
  const stub = h('div', { class: 'mq-stub' }, [h('span', { text: 'Admit one' }), h('b', { text: `No. ${pad(ctx.tally)}` })]);
  const ticket = h('div', { class: 'mq-ticket' }, [stub, main]);
  const ticketWrap = h('div', { class: 'mq-ticketwrap' }, [ticket]);

  const stack = h('div', { class: 'mq-stack' }, [bill, ticketWrap]);
  root.append(stack);
  placeBulbs(bill, bulbs);
  return { stack, bill, letters, bulbs, ticketWrap, ticket };
}

function dropBill(b: Bill, ctx: PlayContext, start: number) {
  const H = ctx.box.clientHeight;
  void anim(
    b.bill,
    [
      { transform: `translateY(${-H}px) rotate(-3.5deg)`, easing: 'cubic-bezier(.5,0,.9,.6)' },
      { transform: 'translateY(0) rotate(1.8deg)', offset: 0.6, easing: 'ease-out' },
      { transform: 'translateY(0) rotate(-0.8deg)', offset: 0.8, easing: 'ease-in-out' },
      { transform: 'translateY(0) rotate(0deg)' },
    ],
    { duration: ctx.clk.d(1000), delay: ctx.clk.d(start) },
  );
}

function slamLetters(b: Bill, ctx: PlayContext, start: number) {
  b.letters.forEach((l, i) => {
    const r = (Math.random() - 0.5) * 16;
    void anim(l, [{ transform: `translateY(-125%) rotate(${r}deg)`, opacity: 0 }, { transform: 'translateY(0) rotate(0deg)', opacity: 1 }], {
      duration: ctx.clk.d(520), delay: ctx.clk.d(start + i * 45), easing: SPRING,
    });
  });
}

function revealTicket(b: Bill, ctx: PlayContext, start: number) {
  void anim(b.ticket, [{ transform: 'translateY(-115%)' }, { transform: 'translateY(0)' }], { duration: ctx.clk.d(560), delay: ctx.clk.d(start), easing: EASE });
}

async function applause(ctx: PlayContext, variant: 'applause' | 'alarm') {
  const { box, clk } = ctx;
  const alarm = variant === 'alarm';
  const root = h('div', { class: `mq${alarm ? ' alarm' : ''}` });
  box.append(root);

  const dim = h('div', { class: 'mq-dim' });
  root.append(dim);
  const bands = buildBeams(root);
  const lamps = buildLamps(root);
  const b = buildBill(root, ctx, HEADLINE[variant](ctx.eventId));
  const flash = h('div', { class: 'mq-flash' });
  root.append(flash);

  const out = (el: Element, delay: number, dur = 420) => anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: clk.d(dur), delay: clk.d(delay), easing: EASE });

  // ---- reduced motion: one still card, fading in and out ----
  if (ctx.reduced) {
    void anim(dim, [{ opacity: 0 }, { opacity: 0.6 }], { duration: 250 });
    b.bulbs.classList.add('still');
    lamps.forEach((l) => l.classList.add('on'));
    void anim(b.stack, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    await clk.at(2200);
    void anim(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    await clk.at(2550);
    return;
  }

  const conf = new Confetti(box, ctx.signal, { colors: alarm ? ['#E5604C', '#B8301F', '#F1E8D4'] : COLORS, shapes: ['strip', 'strip', 'dot'], gravity: 2.2, drag: 0.92 });

  // lamp row, beams, bill
  void anim(dim, [{ opacity: 0 }, { opacity: alarm ? 0.72 : 0.66 }], { duration: clk.d(380) });
  ignite(lamps, ctx, 40);
  riseBeams(bands, ctx, 220);
  dropBill(b, ctx, 380);
  slamLetters(b, ctx, 780);
  clk.after(1050, () => b.bulbs.classList.add('go'));
  revealTicket(b, ctx, 1180);

  if (alarm) {
    // two red pulses and a shudder
    void anim(flash, [{ opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }, { opacity: 0.35 }, { opacity: 0 }], { duration: clk.d(900), delay: clk.d(1000) });
    void anim(b.stack, [{ translate: '-50% -50%' }, { translate: 'calc(-50% - .8em) -50%' }, { translate: 'calc(-50% + .8em) -50%' }, { translate: 'calc(-50% - .5em) -50%' }, { translate: '-50% -50%' }], { duration: clk.d(420), delay: clk.d(1000) });
    const tape = ['t', 'b'].map((c) => h('div', { class: `mq-tape ${c}` }));
    root.append(...tape);
    tape.forEach((t, i) => void anim(t, [{ transform: `translateX(${i ? '' : '-'}110%)` }, { transform: 'translateX(0)' }], { duration: clk.d(520), delay: clk.d(300 + i * 120), easing: EASE }));
  } else {
    clk.after(1000, () => {
      conf.burst({ x: 0.03, y: 1.02, angle: 68, spread: 36, power: 1.6, count: 70 });
      conf.burst({ x: 0.97, y: 1.02, angle: 112, spread: 36, power: 1.6, count: 70 });
    });
    clk.after(1650, () => conf.burst({ x: 0.5, y: 1.0, angle: 90, spread: 80, power: 1.75, count: 90 }));
    clk.after(2250, () => {
      conf.burst({ x: 0.2, y: 1.02, angle: 78, spread: 30, power: 1.5, count: 36 });
      conf.burst({ x: 0.8, y: 1.02, angle: 102, spread: 30, power: 1.5, count: 36 });
    });
  }

  const END = 3500;
  if (!(await clk.at(END))) return;
  void anim(b.stack, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4%)' }], { duration: clk.d(420), easing: EASE });
  for (const el of [bands[0]!, bands[1]!, bands[2]!, dim, ...lamps]) void out(el, 0, 460);
  void out(root.querySelector('.mq-lip')!, 0, 460);
  await clk.at(END + 520);
  await clk.at(END + 1500); // let the last confetti land
}

async function farewell(ctx: PlayContext) {
  const { box, clk } = ctx;
  const root = h('div', { class: 'mq' });
  box.append(root);
  const dim = h('div', { class: 'mq-dim' });
  const lamps = buildLamps(root);
  const L = h('div', { class: 'mq-curtain l' });
  const R = h('div', { class: 'mq-curtain r' });
  const valance = h('div', { class: 'mq-valance' });
  const strike = h('div', { class: 'strike' });
  const who = h('div', { class: 'who' }, [h('s', { text: ctx.subject || 'this repository' }), strike]);
  const fare = h('div', { class: 'mq-fare' }, [h('h1', { text: HEADLINE.farewell(ctx.eventId) }), who, h('span', { class: 'tag', text: 'Struck from the programme' })]);
  root.append(dim, L, R, valance, fare);
  lamps.forEach((l) => l.classList.add('on'));

  if (ctx.reduced) {
    void anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    L.style.transform = 'none';
    strike.style.transform = 'scaleX(1)';
    await clk.at(2200);
    void anim(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    await clk.at(2550);
    return;
  }

  const conf = new Confetti(box, ctx.signal, { colors: ['#F1E8D4', '#B9AD97', '#8A7F6C', '#5C5043'], shapes: ['strip'], gravity: 0.38, drag: 0.95, size: [0.01, 0.02], life: [3, 4.5] });

  void anim(dim, [{ opacity: 0 }, { opacity: 0.8 }], { duration: clk.d(420) });
  void anim(valance, [{ transform: 'translateY(-100%)' }, { transform: 'none' }], { duration: clk.d(500), delay: clk.d(300), easing: EASE });
  void anim(L, [{ transform: 'translateX(-102%)' }, { transform: 'none' }], { duration: clk.d(900), delay: clk.d(520), easing: 'cubic-bezier(.55,0,.25,1)' });
  void anim(R, [{ transform: 'translateX(102%)' }, { transform: 'none' }], { duration: clk.d(900), delay: clk.d(520), easing: 'cubic-bezier(.55,0,.25,1)' });
  const h1 = fare.querySelector('h1')!;
  void anim(fare, [{ opacity: 0 }, { opacity: 1 }], { duration: clk.d(1), delay: clk.d(1250) });
  void anim(h1, [{ opacity: 0, transform: 'scale(1.08)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(420), delay: clk.d(1250), easing: EASE });
  void anim(who, [{ opacity: 0, transform: 'translateY(.6em)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(380), delay: clk.d(1550), easing: EASE });
  void anim(strike, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: clk.d(420), delay: clk.d(2050), easing: 'cubic-bezier(.7,0,.2,1)' });
  void anim(fare.querySelector('.tag')!, [{ opacity: 0 }, { opacity: 1 }], { duration: clk.d(400), delay: clk.d(2300) });
  extinguish(lamps, ctx, 600);
  clk.after(700, () => conf.burst({ x: 0.5, y: -0.05, angle: 270, spread: 170, power: 0.12, count: 70 }));
  clk.after(1500, () => conf.burst({ x: 0.5, y: -0.05, angle: 270, spread: 170, power: 0.1, count: 40 }));

  const END = 3500;
  if (!(await clk.at(END))) return;
  void anim(fare, [{ opacity: 1 }, { opacity: 0 }], { duration: clk.d(300) });
  void anim(L, [{ transform: 'none' }, { transform: 'translateX(-102%)' }], { duration: clk.d(700), easing: 'cubic-bezier(.5,0,.8,.4)' });
  void anim(R, [{ transform: 'none' }, { transform: 'translateX(102%)' }], { duration: clk.d(700), easing: 'cubic-bezier(.5,0,.8,.4)' });
  void anim(valance, [{ transform: 'none' }, { transform: 'translateY(-100%)' }], { duration: clk.d(600), delay: clk.d(100), easing: EASE });
  void anim(dim, [{ opacity: 0.8 }, { opacity: 0 }], { duration: clk.d(600), delay: clk.d(200) });
  await clk.at(END + 900);
}

export const marquee: Theme = {
  id: 'marquee',
  name: 'Marquee',
  tagline: 'Footlights, a hanging bill, a ticket stub and a lot of paper.',
  swatch: ['#1B1612', '#F2A81D', '#F1E8D4', '#B8301F'],
  fonts: ['display', 'mono', 'mono-medium'],
  css,
  runtime: 5000,
  async play(ctx) {
    if (ctx.mood === 'farewell') return farewell(ctx);
    return applause(ctx, ctx.mood === 'alarm' ? 'alarm' : 'applause');
  },
};
