import css from './terminal.css';
import type { PlayContext, Theme } from '../engine/types';
import { EASE, anim, h, rand, sleep } from '../engine/util';
import { parseSubject, type Subject } from '../engine/subject';

const SCRAMBLE = '#%&*+=?/\\|<>~01';
const SPIN = ['|', '/', '-', '\\'];
const NS = 'http://www.w3.org/2000/svg';

function icon(kind: 'ok' | 'bad', cls: string): HTMLElement {
  const wrap = h('span', { class: `ico ${cls}` });
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 12 12');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', kind === 'ok' ? 'M1.6 6.6l3 3 5.8-7.2' : 'M2 2l8 8M10 2l-8 8');
  p.setAttribute('fill', 'none');
  p.setAttribute('stroke', 'currentColor');
  p.setAttribute('stroke-width', '1.9');
  p.setAttribute('stroke-linecap', 'square');
  svg.append(p);
  wrap.append(svg);
  return wrap;
}

class Runner {
  cur = h('span', { class: 'tm-cur' });
  constructor(
    readonly ctx: PlayContext,
    readonly body: HTMLElement,
    readonly sub: Subject,
  ) {}
  get alive() {
    return !this.ctx.signal.aborted;
  }
  wait(ms: number) {
    return this.ctx.reduced ? Promise.resolve() : sleep(this.ctx.clk.d(ms), this.ctx.signal);
  }
  line(cls = ''): HTMLElement {
    this.cur.remove();
    const ln = h('div', { class: `tm-line ${cls}` });
    this.body.append(ln);
    return ln;
  }
  prompt(ln: HTMLElement) {
    ln.append(h('span', { class: 'p-path', text: this.sub.path }), h('span', { class: 'p-sig', text: ' $ ' }));
  }
  async cmd(text: string) {
    const ln = this.line();
    this.prompt(ln);
    const t = h('span');
    ln.append(t, this.cur);
    if (this.ctx.reduced) {
      t.textContent = text;
      return;
    }
    for (const ch of text) {
      if (!this.alive) return;
      t.textContent += ch;
      await this.wait(rand(12, 30) * (ch === ' ' ? 1.7 : 1));
    }
    await this.wait(240);
  }
  async out(parts: (Node | string)[], cls = '', delay = 80) {
    if (!this.alive) return;
    const ln = this.line(cls);
    ln.append(...parts);
    await this.wait(delay);
  }
  async spin(text: string, ms: number) {
    const ln = this.line('dim');
    const sp = h('span', { class: 'sp', text: SPIN[0]! });
    ln.append(sp, ' ', text);
    if (this.ctx.reduced) {
      sp.textContent = '';
      return;
    }
    const frames = Math.round(ms / 85);
    for (let i = 0; i < frames && this.alive; i++) {
      sp.textContent = SPIN[i % SPIN.length]!;
      await this.wait(85);
    }
    sp.textContent = ' ';
  }
  async graph(lines: (Node | string)[][]) {
    for (const parts of lines) {
      if (!this.alive) return;
      await this.out(parts, '', 95);
    }
  }
  async promptLine() {
    const ln = this.line();
    this.prompt(ln);
    ln.append(this.cur);
  }
  async banner(text: string, code: number) {
    const hero = h('div', { class: 'tm-hero' });
    const b = h('div', { class: 'tm-banner', 'data-text': text, text: this.ctx.reduced ? text : ' '.repeat(text.length) });
    const pill = h('div', { class: 'tm-code', text: `exit ${code}` });
    hero.append(b, pill);
    this.cur.remove();
    this.body.append(hero);
    if (this.ctx.reduced) {
      pill.style.opacity = '1';
      return;
    }
    const frames = 14;
    for (let f = 0; f <= frames && this.alive; f++) {
      const cut = (f / frames) * text.length;
      b.textContent = [...text].map((c, i) => (i < cut ? c : SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]!)).join('');
      await this.wait(42);
    }
    b.textContent = text;
    void anim(pill, [{ opacity: 0 }, { opacity: 1 }], { duration: this.ctx.clk.d(220) });
    await this.wait(260);
  }
  /** characters fall apart into noise, then vanish */
  async dissolve() {
    const nodes: { n: Text; s: string }[] = [];
    const walker = document.createTreeWalker(this.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if ((n.textContent ?? '').trim()) nodes.push({ n: n as Text, s: n.textContent ?? '' });
    if (this.ctx.reduced) {
      nodes.forEach(({ n }) => (n.textContent = ''));
      return;
    }
    const frames = 16;
    for (let f = 1; f <= frames && this.alive; f++) {
      const p = f / frames;
      for (const { n, s } of nodes) {
        n.textContent = [...s].map((c) => (c === ' ' ? c : Math.random() < p * 1.15 ? ' ' : Math.random() < 0.35 ? SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)]! : c)).join('');
      }
      await this.wait(48);
    }
    nodes.forEach(({ n }) => (n.textContent = ''));
  }
}

const okLine = (text: string, name?: string): (Node | string)[] => [icon('ok', 'ok'), h('span', { class: 'ok', text }), ...(name ? [' ', h('span', { class: 'hi', text: name })] : [])];
const dim = (t: string) => h('span', { class: 'dim', text: t });

function gitGraph(s: Subject, title: string): (Node | string)[][] {
  const star = () => h('span', { class: 'warn', text: '*' });
  const edge = (t: string) => h('span', { class: 'info', text: t });
  return [
    [star(), '   ', h('span', { class: 'hi', text: `Merge pull request #${s.num || '?'}` })],
    [edge('|\\')],
    [edge('|'), ' ', star(), ' ', dim(title || '...')],
    [edge('|/')],
    [star(), '   ', dim('main')],
  ];
}

async function script(r: Runner) {
  const { ctx, sub } = r;
  const title = ctx.detail;
  const watch = sub.num ? `gh pr checks ${sub.num} --watch` : 'gh run watch';

  if (ctx.mood === 'farewell') {
    await r.cmd(`gh repo delete ${sub.nwo || 'owner/repo'} --yes`);
    await r.out(okLine('Deleted repository', sub.nwo || 'owner/repo'));
    await r.wait(500);
    await r.cmd(`rm -rf ./${sub.repo || 'repo'}`);
    await r.wait(120);
    await r.dissolve();
    await r.promptLine();
    await r.wait(500);
    await r.banner('GONE', 0);
    return;
  }

  if (ctx.mood === 'alarm') {
    await r.cmd(watch);
    await r.spin('Refreshing checks status every 10 seconds', 750);
    await r.out([icon('bad', 'bad'), h('span', { class: 'bad', text: 'Some checks were not successful' })]);
    await r.out([h('span', { class: 'bad dim', text: 'error: process completed with exit code 1' })]);
    if (title) await r.out([dim(title)]);
    await r.banner('FAILED', 1);
    return;
  }

  switch (ctx.eventId) {
    case 'repo.created':
      await r.cmd(`gh repo create ${sub.nwo || 'owner/repo'}`);
      await r.out(okLine('Created repository', sub.nwo || 'owner/repo'));
      await r.out([h('span', { class: 'link', text: `https://github.com/${sub.nwo || 'owner/repo'}` })]);
      await r.banner('CREATED', 0);
      return;
    case 'pr.merged':
      await r.cmd(`git merge --no-ff pull/${sub.num || '0'}`);
      await r.graph(gitGraph(sub, title));
      await r.out(okLine('Merged', `${sub.nwo} #${sub.num}`.trim()), '', 120);
      await r.banner('MERGED', 0);
      return;
    case 'ci.passed':
      await r.cmd(watch);
      await r.spin('Refreshing checks status every 10 seconds', 750);
      await r.out(okLine('All checks were successful'));
      if (title) await r.out([dim(title)]);
      await r.banner('PASSED', 0);
      return;
    default:
      await r.cmd(`gh api repos/${sub.nwo || 'owner/repo'}`);
      await r.out(okLine('Done'));
      await r.banner('DONE', 0);
  }
}

async function play(ctx: PlayContext) {
  const { box, clk } = ctx;
  const sub = parseSubject(ctx.subject);
  const root = h('div', { class: `tm ${ctx.mood}` });
  const dimEl = h('div', { class: 'tm-dim' });
  const flash = h('div', { class: 'tm-flash' });
  const body = h('div', { class: 'tm-body' });
  const bar = h('div', { class: 'tm-bar' }, [
    h('span', { class: 'sq' }, [h('i'), h('i'), h('i')]),
    h('span', { class: 'tm-title', text: `zsh - ${sub.nwo || 'footlit'}` }),
    h('span', { class: 'tm-size', text: '80x24' }),
  ]);
  const win = h('div', { class: 'tm-win' }, [bar, body]);
  root.append(dimEl, win, flash);
  box.append(root);

  const r = new Runner(ctx, body, sub);

  if (ctx.reduced) {
    void anim(root, [{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
    dimEl.style.opacity = '0.7';
    await script(r);
    await r.promptLine();
    await clk.at(2300);
    void anim(root, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    await clk.at(2650);
    return;
  }

  // CRT power-on: a line, then the window
  void anim(dimEl, [{ opacity: 0 }, { opacity: 0.72 }], { duration: clk.d(320) });
  await anim(win, [{ transform: 'scale(.2,.006)', opacity: 0 }, { transform: 'scale(1,.006)', opacity: 1, offset: 0.45 }, { transform: 'scale(1,1)', opacity: 1 }], { duration: clk.d(380), easing: EASE });
  if (!r.alive) return;

  if (ctx.mood === 'alarm') {
    clk.after(1250, () => {
      void anim(flash, [{ opacity: 0 }, { opacity: 0.32 }, { opacity: 0 }, { opacity: 0.2 }, { opacity: 0 }], { duration: clk.d(700) });
      void anim(win, [{ transform: 'translateX(0)' }, { transform: 'translateX(-.9em)' }, { transform: 'translateX(.9em)' }, { transform: 'translateX(-.5em)' }, { transform: 'translateX(0)' }], { duration: clk.d(380) });
    });
  }

  await script(r);
  if (!r.alive) return;
  if (ctx.mood !== 'farewell') await r.promptLine();
  await r.wait(1000);
  if (!r.alive) return;

  // power off
  void anim(dimEl, [{ opacity: 0.72 }, { opacity: 0 }], { duration: clk.d(380), delay: clk.d(120) });
  await anim(win, [{ transform: 'scale(1,1)', opacity: 1 }, { transform: 'scale(1,.006)', opacity: 1, offset: 0.6 }, { transform: 'scale(.1,.006)', opacity: 0 }], { duration: clk.d(340), easing: EASE });
}

export const terminal: Theme = {
  id: 'terminal',
  name: 'Terminal',
  tagline: 'A shell, a merge graph, an exit code. Developers will get it.',
  swatch: ['#0A0D0C', '#5CF29A', '#6FD3E0', '#FF6B5E'],
  fonts: ['term', 'term-bold'],
  css,
  runtime: 4500,
  play,
};
