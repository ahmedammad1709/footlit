import css from './quiet.css';
import type { PlayContext, Theme } from '../engine/types';
import { EASE, anim, h } from '../engine/util';
import { parseSubject } from '../engine/subject';

const NS = 'http://www.w3.org/2000/svg';

const TITLE: Record<string, string> = {
  'repo.created': 'Repository created',
  'pr.merged': 'Pull request merged',
  'repo.deleted': 'Repository deleted',
  'ci.passed': 'Checks passed',
  'ci.failed': 'Checks failed',
  'repo.forked': 'Repository forked',
  'pr.opened': 'Pull request opened',
  'pr.closed': 'Pull request closed',
  'deploy.live': 'Site is live',
  'release.published': 'Release published',
  'issue.closed': 'Issue closed',
};

/** Follow GitHub's colour mode (or the extension page's) so the toast never clashes with its surroundings. */
function isDark(): boolean {
  const root = document.documentElement;
  const mode = root.getAttribute('data-color-mode') ?? root.getAttribute('data-theme');
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  // "auto" mode, or no attribute at all: judge by the page's real background so the toast matches what you see
  const m = getComputedStyle(document.body ?? root).backgroundColor.match(/[\d.]+/g);
  if (m && m.length >= 3 && (m[3] === undefined || Number(m[3]) > 0.5)) {
    const [r, g, b] = m.map(Number) as [number, number, number];
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function mark(kind: 'check' | 'cross' | 'minus'): SVGSVGElement {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', '0 0 32 32');
  const ring = document.createElementNS(NS, 'circle');
  ring.setAttribute('cx', '16');
  ring.setAttribute('cy', '16');
  ring.setAttribute('r', '14');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('class', 'draw');
  p.setAttribute('d', kind === 'check' ? 'M9.5 16.8 L14 21 L22.5 11.5' : kind === 'cross' ? 'M11 11 L21 21 M21 11 L11 21' : 'M10.5 16 L21.5 16');
  s.append(ring, p);
  return s;
}

async function play(ctx: PlayContext) {
  const { box, clk, mood } = ctx;
  const sub = parseSubject(ctx.subject);
  const dark = isDark();
  const root = h('div', { class: `qt ${mood}${dark ? ' dark' : ''}` });
  const icon = mark(mood === 'alarm' ? 'cross' : mood === 'farewell' ? 'minus' : 'check');
  const who = sub.nwo ? `${sub.nwo}${sub.num ? ` #${sub.num}` : ''}` : ctx.subject;
  const toast = h('div', { class: 'qt-toast', role: 'presentation' }, [
    h('div', { class: 'qt-icon' }, [icon as unknown as Node]),
    h('div', { class: 'qt-text' }, [h('div', { class: 'qt-title', text: TITLE[ctx.eventId] ?? ctx.kicker }), h('div', { class: 'qt-sub', text: ctx.detail ? `${who} / ${ctx.detail}` : who })]),
    h('div', { class: 'qt-timer' }),
  ]);
  root.append(toast);
  box.append(root);

  const draw = icon.querySelector<SVGPathElement>('.draw')!;
  const len = draw.getTotalLength();
  draw.style.strokeDasharray = String(len);
  const timer = toast.querySelector<HTMLElement>('.qt-timer')!;
  const HOLD = 2600;

  if (ctx.reduced) {
    void anim(toast, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    await clk.at(HOLD);
    void anim(toast, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 });
    await clk.at(HOLD + 260);
    return;
  }

  void anim(toast, [{ opacity: 0, transform: 'translateY(.9em)' }, { opacity: 1, transform: 'none' }], { duration: clk.d(280), easing: EASE });
  void anim(draw, [{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: clk.d(420), delay: clk.d(200), easing: EASE });
  void anim(timer, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: clk.d(HOLD - 300), delay: clk.d(300), easing: 'linear' });
  if (mood === 'alarm') void anim(toast, [{ transform: 'translateX(0)' }, { transform: 'translateX(-.4em)' }, { transform: 'translateX(.4em)' }, { transform: 'none' }], { duration: clk.d(260), delay: clk.d(420) });

  if (!(await clk.at(HOLD))) return;
  void anim(toast, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(.6em)' }], { duration: clk.d(260), easing: EASE });
  await clk.at(HOLD + 300);
}

export const quiet: Theme = {
  id: 'quiet',
  name: 'Quiet',
  tagline: 'One small toast in the corner. For the office, for focus, for people who dislike fireworks.',
  swatch: ['#FFFFFF', '#1A7F37', '#CF222E', '#59636E'],
  fonts: [],
  css,
  runtime: 3000,
  play,
};
