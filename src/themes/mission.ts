import css from './mission.css';
import type { PlayContext, Theme } from '../engine/types';
import { Confetti } from '../engine/confetti';
import { EASE, SPRING, anim, h, sleep } from '../engine/util';
import { parseSubject } from '../engine/subject';

const NS = 'http://www.w3.org/2000/svg';
const STATIONS = ['FLIGHT', 'CAPCOM', 'GUIDANCE', 'BOOSTER', 'RETRO', 'FIDO'];

const HEAD: Record<string, string> = {
  'repo.created': 'Liftoff',
  'pr.merged': 'Docking confirmed',
  'ci.passed': 'All stations go',
};

const KICKER: Record<string, string> = {
  'repo.created': 'New vehicle',
  'pr.merged': 'Pull request',
  'ci.passed': 'Checks',
};

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function cell(kind: 'mc-stn' | 'mc-t', k: string, v: string, cls = 'wait'): { el: HTMLElement; v: HTMLElement } {
  const val = h('span', { class: `v ${cls}`, text: v });
  const el = h('div', { class: kind }, [h('span', { class: 'k', text: k }), val]);
  return { el, v: val };
}

const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');

async function play(ctx: PlayContext) {
  const { box, clk, signal } = ctx;
  const sub = parseSubject(ctx.subject);
  const mood = ctx.mood;
  const alarm = mood === 'alarm';
  const farewell = mood === 'farewell';
  const root = h('div', { class: `mc ${mood}` });
  box.append(root);

  // ---- structure ----
  const dim = h('div', { class: 'mc-dim' });
  const corners = (['tl', 'tr', 'bl', 'br'] as const).map((c) => h('div', { class: `mc-corner ${c}` }));
  const met = h('b', { text: 'T+00:00:00' });
  const status = h('b', { text: farewell ? 'SIGNAL NOMINAL' : 'GO FOR LAUNCH' });
  const top = h('div', { class: 'mc-top' }, [h('span', { text: 'Footlit mission control' }), met, status]);
  const bar = h('div', { class: 'mc-bar' });

  const stationRows = STATIONS.map((n) => cell('mc-stn', n, '....'));
  const left = h('div', { class: 'mc-stns' }, stationRows.map((r) => r.el));
  const alt = cell('mc-t', 'ALTITUDE', '0 km');
  const vel = cell('mc-t', 'VELOCITY', '0 m/s');
  const sig = cell('mc-t', 'SIGNAL', farewell ? '100 %' : 'NOMINAL');
  const right = h('div', { class: 'mc-tele' }, [alt.el, vel.el, sig.el]);

  const ring = svg('svg', { class: 'mc-ring', viewBox: '0 0 100 100' });
  ring.append(svg('circle', { class: 'track', cx: '50', cy: '50', r: '44' }), svg('circle', { class: 'sweep', cx: '50', cy: '50', r: '44' }));
  const num = h('div', { class: 'mc-num', text: '3' });
  const cap = h('div', { class: 'mc-cap', text: 'T minus' });
  const core = h('div', { class: 'mc-core' }, [ring as unknown as Node, num, cap]);

  const kicker = KICKER[ctx.eventId] ?? 'Mission';
  const title = alarm ? 'Anomaly' : farewell ? 'Loss of signal' : (HEAD[ctx.eventId] ?? 'Nominal');
  const subParts = [kicker, sub.nwo ? `${sub.nwo}${sub.num ? ` #${sub.num}` : ''}` : ctx.subject];
  const head = h('div', { class: 'mc-head' }, [
    h('h1', { text: title }),
    h('div', { class: 'sub' }, [h('b', { text: subParts[0]! }), ' / ', subParts[1] ?? '']),
  ]);

  const arc = svg('svg', { class: 'mc-arc', viewBox: '0 0 160 90', preserveAspectRatio: 'none' });
  const d = farewell ? 'M12 16 C 58 18, 104 50, 150 80' : 'M10 80 C 52 78, 100 60, 150 14';
  const ghost = svg('path', { class: 'ghost', d });
  const path = svg('path', { d });
  arc.append(ghost, path);
  const dot = h('div', { class: 'mc-dot' });
  const flash = h('div', { class: 'mc-flash' });
  root.append(dim, arc as unknown as Node, dot, ...corners, top, bar, left, right, core, head, flash);
  const L = path.getTotalLength();
  path.style.strokeDasharray = `0 ${L}`;

  const setGo = (i: number, verdict: 'GO' | 'NO-GO' | 'LOS') => {
    const r = stationRows[i]!;
    r.v.textContent = verdict;
    r.v.className = `v ${verdict === 'GO' ? 'go' : verdict === 'NO-GO' ? 'nogo flash' : 'lost'}`;
  };
  const showRow = (r: { el: HTMLElement }, delay: number) => void anim(r.el, [{ opacity: 0, transform: 'translateY(.8em)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(200), delay: clk.d(delay), easing: EASE });

  // arc + dot driven by one loop so they stay in sync; `until` is the fraction of the path to draw
  const drawArc = (ms: number, until = 1) =>
    new Promise<void>((resolve) => {
      const t0 = performance.now();
      dot.style.opacity = '1';
      const tick = (now: number) => {
        if (signal.aborted) return resolve();
        const p = Math.min(1, (now - t0) / clk.d(ms));
        const e = 1 - Math.pow(1 - p, 2.2);
        const len = e * L * until;
        path.style.strokeDasharray = `${len} ${L}`;
        const pt = path.getPointAtLength(len);
        dot.style.left = `${(pt.x / 160) * 100}%`;
        dot.style.top = `${(pt.y / 90) * 100}%`;
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

  const countTo = (el: HTMLElement, from: number, to: number, ms: number, fmt: (n: number) => string) => {
    const t0 = performance.now();
    const tick = (now: number) => {
      if (signal.aborted) return;
      const p = Math.min(1, (now - t0) / clk.d(ms));
      el.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const sweep = (secs: number) => ring.querySelector<SVGCircleElement>('.sweep')!.animate([{ strokeDashoffset: 276.5 }, { strokeDashoffset: 0 }], { duration: clk.d(secs), easing: 'linear', fill: 'both' });
  const tickNum = (n: string, color?: string) => {
    num.textContent = n;
    if (color) num.style.color = color;
    void anim(num, [{ transform: 'scale(1.25)', opacity: 0.2 }, { transform: 'scale(1)', opacity: 1 }], { duration: clk.d(220), easing: SPRING });
  };

  // ---- reduced motion: the final frame, faded ----
  if (ctx.reduced) {
    dim.style.opacity = '0.82';
    corners.forEach((c) => (c.style.opacity = '1'));
    top.style.opacity = '1';
    bar.style.transform = 'none';
    core.style.display = 'none';
    stationRows.forEach((r, i) => {
      r.el.style.opacity = '1';
      setGo(i, farewell ? 'LOS' : alarm && i === 3 ? 'NO-GO' : 'GO');
    });
    [alt, vel, sig].forEach((r) => (r.el.style.opacity = '1'));
    left.style.opacity = '1';
    head.style.opacity = '1';
    path.style.strokeDasharray = `${L} ${L}`;
    void anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    await clk.at(2300);
    void anim(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    await clk.at(2650);
    return;
  }

  // ---- 0: frame draws in ----
  void anim(dim, [{ opacity: 0 }, { opacity: 0.84 }], { duration: clk.d(320) });
  corners.forEach((c, i) => void anim(c, [{ opacity: 0, transform: 'scale(1.6)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(300), delay: clk.d(i * 60), easing: EASE }));
  void anim(top, [{ opacity: 0 }, { opacity: 1 }], { duration: clk.d(300), delay: clk.d(200) });
  void anim(bar, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: clk.d(520), delay: clk.d(150), easing: EASE, fill: 'both' });
  [alt, vel, sig].forEach((r, i) => showRow(r, 300 + i * 90));

  // MET clock
  const t0 = performance.now();
  const clock = window.setInterval(() => {
    const s = Math.max(0, (performance.now() - t0) / clk.d(1000) - 1.6);
    met.textContent = `T+${pad2(s / 3600)}:${pad2((s / 60) % 60)}:${pad2(s % 60)}`;
  }, 80);
  signal.addEventListener('abort', () => clearInterval(clock), { once: true });

  if (farewell) {
    // signal degrades; no countdown
    core.style.display = 'none';
    stationRows.forEach((r, i) => {
      showRow(r, 350 + i * 80);
      clk.after(520 + i * 80, () => setGo(i, 'GO'));
    });
    clk.after(1100, () => {
      status.textContent = 'SIGNAL DEGRADED';
      sig.v.className = 'v wait';
      countTo(sig.v, 100, 0, 1100, (n) => `${Math.round(n)} %`);
      countTo(alt.v, 128, 0, 1100, (n) => `${Math.round(n)} km`);
      countTo(vel.v, 7800, 0, 1100, (n) => `${Math.round(n).toLocaleString('en-US')} m/s`);
      stationRows.forEach((_, i) => clk.after(i * 130, () => setGo(i, 'LOS')));
    });
    clk.after(1200, () => void drawArc(1500));
    clk.after(2300, () => {
      status.textContent = 'NO SIGNAL';
      void anim(head, [{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(380), easing: EASE });
      void anim(dot, [{ opacity: 1 }, { opacity: 0 }], { duration: clk.d(500), delay: clk.d(300) });
    });
    if (!(await clk.at(4000))) return;
  } else {
    // ---- stations poll while the count runs ----
    stationRows.forEach((r, i) => {
      showRow(r, 400 + i * 150);
      clk.after(560 + i * 150, () => setGo(i, alarm && i === 3 ? 'NO-GO' : 'GO'));
    });
    // 3, 2, 1 (an anomaly interrupts the count at 2)
    const steps = alarm ? [3, 2] : [3, 2, 1];
    for (const [k, n] of steps.entries()) {
      if (!(await clk.at(450 + k * 430))) return;
      tickNum(String(n));
      void sweep(0.43);
    }
    if (alarm) {
      // hold: the booster says no
      if (!(await clk.at(450 + steps.length * 430 + 120))) return;
      status.textContent = 'MASTER ALARM';
      num.style.color = 'var(--nogo)';
      tickNum('HOLD');
      num.style.fontSize = '11em';
      void anim(flash, [{ opacity: 0 }, { opacity: 0.35 }, { opacity: 0 }, { opacity: 0.2 }, { opacity: 0 }], { duration: clk.d(800) });
      void anim(root, [{ transform: 'translateX(0)' }, { transform: 'translateX(-.8em)' }, { transform: 'translateX(.8em)' }, { transform: 'translateX(-.4em)' }, { transform: 'none' }], { duration: clk.d(360) });
      if (!(await clk.at(450 + steps.length * 430 + 900))) return;
      core.style.display = 'none';
      sig.v.className = 'v nogo flash';
      sig.v.textContent = 'LOST';
      void anim(head, [{ opacity: 0, transform: 'scale(1.2)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(300), easing: SPRING });
      void drawArc(1000, 0.46).then(() => {
        dot.style.opacity = '0';
        const pt = path.getPointAtLength(L * 0.46);
        const conf = new Confetti(box, signal, { colors: ['#FF4D4D', '#FF7A2B', '#E8EEF3'], shapes: ['square', 'strip'], gravity: 1.1, drag: 0.94, size: [0.008, 0.016] });
        conf.burst({ x: pt.x / 160, y: pt.y / 90, angle: 90, spread: 360, power: 0.7, count: 46 });
        void anim(path, [{ opacity: 1 }, { opacity: 0.1 }, { opacity: 0.6 }, { opacity: 0 }], { duration: clk.d(600) });
      });
      if (!(await clk.at(450 + steps.length * 430 + 2900))) return;
    } else {
      // ---- T-0 ----
      if (!(await clk.at(450 + 3 * 430 + 80))) return;
      tickNum('0', 'var(--go)');
      void anim(flash, [{ opacity: 0 }, { opacity: 0.4 }, { opacity: 0 }], { duration: clk.d(420) });
      status.textContent = 'ALL STATIONS GO';
      core.style.display = 'none';
      void anim(head, [{ opacity: 0, transform: 'scale(.94)', letterSpacing: '.5em' }, { opacity: 1, transform: 'none', letterSpacing: '0.02em' }], { duration: clk.d(560), easing: EASE });
      countTo(alt.v, 0, 128, 1700, (n) => `${Math.round(n)} km`);
      countTo(vel.v, 0, 7800, 1700, (n) => `${Math.round(n).toLocaleString('en-US')} m/s`);
      void drawArc(1700);
      if (!(await clk.at(450 + 3 * 430 + 2400))) return;
    }
  }

  // ---- exit: the frame retracts ----
  const out = [dim, top, bar, left, right, head, arc as unknown as Element, dot, ...corners];
  out.forEach((el) => void anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: clk.d(380), easing: EASE }));
  await clk.at(farewell ? 4400 : alarm ? 4300 : 4000);
  await sleep(0, signal);
}

export const mission: Theme = {
  id: 'mission',
  name: 'Mission Control',
  tagline: 'T-minus, a GO/NO-GO poll and a trajectory. For launches and for aborts.',
  swatch: ['#06090D', '#FF7A2B', '#E8EEF3', '#3FD68F'],
  fonts: ['display', 'term', 'term-bold'],
  css,
  runtime: 4600,
  play,
};
