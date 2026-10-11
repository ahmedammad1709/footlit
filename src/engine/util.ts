import type { Clock } from './types';

/** For things that land: a little overshoot. */
export const SPRING = 'cubic-bezier(.34,1.56,.64,1)';
/** For everything else. */
export const EASE = 'cubic-bezier(.2,.7,.2,1)';

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)] as T;

type Attrs = { class?: string; style?: string; text?: string; [k: string]: string | undefined };

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, children: (Node | string)[] = []): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v);
  }
  for (const c of children) el.append(c);
  return el;
}

/** Web Animations helper that never throws and resolves when finished or cancelled. */
export function anim(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): Promise<void> {
  const a = el.animate(keyframes, { fill: 'both', ...options });
  return a.finished.then(
    () => undefined,
    () => undefined,
  );
}

export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const t = setTimeout(done, ms);
    function done() {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }
    function onAbort() {
      clearTimeout(t);
      done();
    }
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

export function makeClock(signal: AbortSignal, scale: number): Clock {
  const t0 = performance.now();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  signal.addEventListener('abort', () => timers.forEach(clearTimeout), { once: true });
  return {
    d: (ms) => ms * scale,
    after(ms, fn) {
      if (signal.aborted) return;
      const t = setTimeout(() => {
        timers.delete(t);
        if (!signal.aborted) fn();
      }, ms * scale);
      timers.add(t);
    },
    async at(ms) {
      const wait = ms * scale - (performance.now() - t0);
      if (wait > 0) await sleep(wait, signal);
      return !signal.aborted;
    },
  };
}
