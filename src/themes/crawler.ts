import css from './crawler.css';
import type { PlayContext, Theme } from '../engine/types';
import { Confetti } from '../engine/confetti';
import { EASE, SPRING, anim, h, rand, sleep } from '../engine/util';
import { parseSubject } from '../engine/subject';

const NS = 'http://www.w3.org/2000/svg';
const VW = 160;
const VH = 90;

const HEAD: Record<string, string> = {
  'repo.created': 'New web spun', 'repo.forked': 'Web split', 'pr.opened': 'New strand', 'pr.merged': 'Strands woven',
  'ci.passed': 'Build compiled', 'deploy.live': 'Web is live', 'release.published': 'Web complete', 'issue.closed': 'Bug squashed',
};
const KICK: Record<string, string> = {
  'repo.created': 'New nest', 'repo.forked': 'Fork', 'pr.opened': 'Strand attached', 'pr.merged': 'Strands joined',
  'ci.passed': '200 OK', 'deploy.live': 'Crawlable', 'release.published': 'Tagged', 'issue.closed': 'Resolved',
};

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** One side's four legs: [attach, knee, foot]. Mirrored for the other side. */
const LEGS: [number, number][][] = [
  [[1.6, -1.8], [5.5, -5.6], [8.6, -4.6]],
  [[1.8, -0.6], [6.2, -2.7], [9.2, -1.2]],
  [[1.8, 0.8], [6.2, 1.6], [9, 3.4]],
  [[1.6, 2.2], [5.2, 5.2], [7.4, 8.4]],
];

function spider(lit = false): HTMLElement {
  const wrap = h('div', { class: `wc-spider${lit ? ' lit' : ''}` });
  const s = svg('svg', { viewBox: '-10 -10 20 20' });
  const legs = svg('g', { class: 'legs' });
  for (const sign of [-1, 1]) for (const leg of LEGS) legs.append(svg('polyline', { class: 'leg', points: leg.map(([x, y]) => `${x * sign},${y}`).join(' ') }));
  s.append(
    legs,
    svg('ellipse', { class: 'body', cx: 0, cy: 1.4, rx: 2.5, ry: 3.5 }),
    svg('circle', { class: 'body', cx: 0, cy: -2.6, r: 1.6 }),
    svg('path', { class: 'mark', d: 'M-.8 .2 L.8 .2 L0 1.5 L.8 2.9 L-.8 2.9 L0 1.5 Z' }),
    svg('circle', { class: 'eye', cx: -0.6, cy: -3.2, r: 0.38 }),
    svg('circle', { class: 'eye', cx: 0.6, cy: -3.2, r: 0.38 }),
  );
  wrap.append(s);
  return wrap;
}

interface WebGeo {
  spokes: string[];
  rings: string[];
}

function web(cx: number, cy: number, R: number, a0: number, a1: number, spokes: number, rings: number): WebGeo {
  const pt = (a: number, r: number) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  const angles = Array.from({ length: spokes }, (_, i) => a0 + ((a1 - a0) * i) / (spokes - 1));
  const sp = angles.map((a) => `M${cx} ${cy} L${pt(a, R)[0].toFixed(2)} ${pt(a, R)[1].toFixed(2)}`);
  const rg: string[] = [];
  for (let j = 1; j <= rings; j++) {
    const r = R * Math.pow(j / rings, 0.95);
    let d = '';
    angles.forEach((a, i) => {
      const [x, y] = pt(a, r);
      if (i === 0) d += `M${x.toFixed(2)} ${y.toFixed(2)}`;
      else {
        const mid = (angles[i - 1]! + a) / 2;
        const [qx, qy] = pt(mid, r * 0.94);
        d += ` Q${qx.toFixed(2)} ${qy.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }
    });
    rg.push(d);
  }
  return { spokes: sp, rings: rg };
}

async function play(ctx: PlayContext) {
  const { box, clk, signal, mood } = ctx;
  const alarm = mood === 'alarm';
  const farewell = mood === 'farewell';
  const sub = parseSubject(ctx.subject);
  const root = h('div', { class: `wc ${mood}` });
  const dim = h('div', { class: 'wc-dim' });
  const flash = h('div', { class: 'wc-flash' });
  const webSvg = svg('svg', { class: 'wc-web', viewBox: `0 0 ${VW} ${VH}`, preserveAspectRatio: 'none' });
  const dense = farewell ? 1.35 : 1;
  const webs = [
    web(0, 0, 80, 0.02, Math.PI / 2 - 0.02, 9, Math.round(9 * dense)),
    web(VW, VH, 66, Math.PI + 0.02, Math.PI * 1.5 - 0.02, 8, Math.round(8 * dense)),
    web(VW, 0, 44, Math.PI / 2 + 0.02, Math.PI - 0.02, 7, Math.round(6 * dense)),
  ];
  const strands: { el: SVGPathElement; len: number; ring: boolean }[] = [];
  const g = svg('g');
  for (const w of webs) {
    for (const d of w.spokes) {
      const el = svg('path', { class: 'spoke', d });
      g.append(el);
      strands.push({ el, len: 0, ring: false });
    }
    for (const d of w.rings) {
      const el = svg('path', { d });
      g.append(el);
      strands.push({ el, len: 0, ring: true });
    }
  }
  webSvg.append(g);
  // invisible rails the spiders crawl along
  const rail = (d: string) => {
    const p = svg('path', { d, fill: 'none', stroke: 'none' });
    webSvg.append(p);
    return p;
  };

  const who = sub.nwo ? `${sub.nwo}${sub.num ? ` #${sub.num}` : ''}` : ctx.subject;
  const headline = alarm ? 'Broken build' : farewell ? (ctx.eventId === 'pr.closed' ? 'Strand cut' : 'Web abandoned') : (HEAD[ctx.eventId] ?? 'Build compiled');
  const kicker = alarm ? 'Checks failed' : farewell ? 'Nothing left to crawl' : (KICK[ctx.eventId] ?? '200 OK');
  const head = h('div', { class: 'wc-head' }, [h('h1', { text: headline }), h('div', { class: 'sub' }, [h('b', { text: kicker }), farewell ? '' : ' / ', farewell ? ` ${who}` : who])]);

  const spiders = [spider(true), spider(true), spider(true)];
  root.append(dim, webSvg as unknown as Node, ...spiders, head, flash);
  box.append(root);
  const bw = () => box.clientWidth;
  const bh = () => box.clientHeight;

  // measure strands now that they are in the DOM
  for (const s of strands) {
    s.len = s.el.getTotalLength();
    s.el.style.strokeDasharray = String(s.len);
    s.el.style.strokeDashoffset = String(s.len);
  }

  const drawWeb = (ms: number, startDelay = 0) =>
    strands.forEach((s, i) => {
      const d = (s.ring ? 140 + (i % 12) * 55 : (i % 9) * 38) + startDelay;
      void anim(s.el, [{ strokeDashoffset: s.len }, { strokeDashoffset: 0 }], { duration: clk.d(ms), delay: clk.d(d), easing: EASE });
    });
  const retractWeb = (ms: number) =>
    strands.forEach((s) => void anim(s.el, [{ strokeDashoffset: 0 }, { strokeDashoffset: s.len }], { duration: clk.d(ms), easing: EASE }));

  /** move a spider along an SVG path, facing the direction of travel */
  const crawl = (el: HTMLElement, path: SVGPathElement, ms: number, delay = 0, keep = false) =>
    new Promise<void>((resolve) => {
      const len = path.getTotalLength();
      let t0 = 0;
      const place = (p: number) => {
        const a = path.getPointAtLength(p * len);
        const b = path.getPointAtLength(Math.min(len, p * len + 0.8));
        const ang = (Math.atan2(((b.y - a.y) / VH) * bh(), ((b.x - a.x) / VW) * bw()) * 180) / Math.PI + 90;
        el.style.transform = `translate(${(a.x / VW) * bw()}px, ${(a.y / VH) * bh()}px) rotate(${ang}deg)`;
      };
      const tick = (now: number) => {
        if (signal.aborted) return resolve();
        const p = Math.min(1, (now - t0) / clk.d(ms));
        place(p);
        if (p < 1) requestAnimationFrame(tick);
        else {
          if (!keep) el.style.opacity = '0';
          resolve();
        }
      };
      void sleep(clk.d(delay), signal).then(() => {
        if (signal.aborted) return resolve();
        el.style.opacity = '1';
        t0 = performance.now();
        place(0);
        requestAnimationFrame(tick);
      });
    });

  const stamp = () =>
    void anim(head, [{ opacity: 0, transform: 'scale(1.7) rotate(-5deg)' }, { opacity: 1, transform: 'scale(1) rotate(-2deg)' }], { duration: clk.d(300), easing: SPRING });

  const railA = rail(webs[0]!.rings[Math.min(4, webs[0]!.rings.length - 1)]!);
  const railC = rail(webs[1]!.spokes[3]!);
  const railOut = (i: number) => rail(`M${rand(30, 130)} ${rand(20, 70)} L${i === 0 ? -14 : i === 1 ? 174 : rand(40, 120)} ${i === 2 ? 106 : rand(-14, 100)}`);

  if (ctx.reduced) {
    dim.style.opacity = '0.84';
    strands.forEach((s) => (s.el.style.strokeDashoffset = '0'));
    head.style.opacity = '1';
    head.style.transform = 'rotate(-2deg)';
    void anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    await clk.at(2300);
    void anim(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    await clk.at(2650);
    return;
  }

  void anim(dim, [{ opacity: 0 }, { opacity: farewell ? 0.88 : 0.82 }], { duration: clk.d(320) });
  drawWeb(alarm ? 520 : 700);

  if (alarm) {
    const conf = new Confetti(box, signal, { colors: ['#E5322D', '#C9CED6', '#F2F4F7'], shapes: ['strip', 'square'], gravity: 1.6, drag: 0.93, size: [0.006, 0.014] });
    void crawl(spiders[0]!, railA, 900, 250, true);
    void crawl(spiders[2]!, railC, 900, 300, true);
    clk.after(1000, () => {
      // the crack: a jagged red tear across the screen
      const crack = svg('path', { d: 'M52 0 L58 14 L50 24 L63 38 L55 50 L70 64 L64 76 L76 90', fill: 'none', stroke: '#E5322D', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'miter' });
      webSvg.append(crack);
      const cl = crack.getTotalLength();
      crack.style.strokeDasharray = String(cl);
      void anim(crack, [{ strokeDashoffset: cl }, { strokeDashoffset: 0 }], { duration: clk.d(220), easing: 'ease-in' });
      void anim(flash, [{ opacity: 0 }, { opacity: 0.4 }, { opacity: 0 }, { opacity: 0.25 }, { opacity: 0 }], { duration: clk.d(700) });
      void anim(root, [{ transform: 'translateX(0)' }, { transform: 'translateX(-.9em)' }, { transform: 'translateX(.9em)' }, { transform: 'translateX(-.5em)' }, { transform: 'none' }], { duration: clk.d(380) });
      void anim(g, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(32px)', opacity: 0 }], { duration: clk.d(900), delay: clk.d(160), easing: 'ease-in' });
      conf.burst({ x: 0.58, y: 0.4, angle: 270, spread: 340, power: 0.5, count: 60 });
      // scatter
      spiders.forEach((s, i) => void crawl(s, railOut(i), 520, i * 60));
      stamp();
    });
  } else if (farewell) {
    const dust = new Confetti(box, signal, { colors: ['#6E757F', '#8D949E', '#C9CED6'], shapes: ['dot', 'strip'], gravity: 0.3, drag: 0.96, size: [0.004, 0.009], life: [3, 4.4] });
    clk.after(300, () => dust.burst({ x: 0.5, y: -0.05, angle: 270, spread: 170, power: 0.1, count: 70 }));
    void crawl(spiders[0]!, railOut(0), 1500, 500);
    void crawl(spiders[1]!, railOut(1), 1700, 700);
    void crawl(spiders[2]!, railOut(2), 1400, 900);
    clk.after(1000, () => void anim(head, [{ opacity: 0, transform: 'translateY(.8em) rotate(-2deg)' }, { opacity: 1, transform: 'rotate(-2deg)' }], { duration: clk.d(600), easing: EASE }));
  } else {
    void crawl(spiders[0]!, railA, 1900, 350);
    void crawl(spiders[2]!, railC, 1500, 500);
    // one spider rappels down a thread and hangs above the headline
    const thread = h('div', { class: 'wc-thread' });
    root.append(thread);
    const hang = spiders[1]!;
    clk.after(800, () => {
      const x = bw() * 0.7;
      const y1 = bh() * 0.2;
      thread.style.left = `${x}px`;
      thread.style.height = '0px';
      hang.style.opacity = '1';
      const t0 = performance.now();
      const drop = (now: number) => {
        if (signal.aborted) return;
        const p = Math.min(1, (now - t0) / clk.d(700));
        const e = 1 - Math.pow(1 - p, 3);
        const y = y1 * e + Math.sin(p * Math.PI * 3) * 4 * (1 - p) * (p > 0.5 ? 1 : 0);
        thread.style.height = `${y}px`;
        hang.style.transform = `translate(${x}px, ${y}px) rotate(180deg)`;
        if (p < 1) requestAnimationFrame(drop);
      };
      requestAnimationFrame(drop);
    });
    clk.after(1150, stamp);
  }

  const END = alarm ? 3500 : farewell ? 3500 : 3500;
  if (!(await clk.at(END))) return;
  if (!alarm) retractWeb(500);
  for (const el of [dim, head, ...spiders]) void anim(el, [{ opacity: Number(getComputedStyle(el).opacity) || 1 }, { opacity: 0 }], { duration: clk.d(420), easing: EASE });
  await clk.at(END + 560);
}

export const crawler: Theme = {
  id: 'crawler',
  name: 'Web Crawler',
  tagline: 'Webs spin out from the corners and spiders do the commit work. Tears if the build breaks.',
  swatch: ['#050506', '#C9CED6', '#E5322D', '#6E757F'],
  fonts: ['display', 'mono'],
  css,
  runtime: 4000,
  play,
};
