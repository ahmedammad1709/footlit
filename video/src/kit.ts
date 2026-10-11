// Shared helpers for the film pages: a tiny scheduler on the frozen clock, plus a cursor.
export const INK = '#17120E', PAPER = '#F1E8D4', LIT = '#F6B63B', ALARM = '#E5604C';
export const DISPLAY = "'League Gothic', 'Impact', sans-serif", TEXT = "'Newsreader', Georgia, serif", MONO = "'DM Mono', monospace";

// ---------- tiny scheduling kit ----------
type Job = () => void;
export const jobs: Job[] = [];
export const later = (fn: Job) => void jobs.push(fn);
/** run fn at film time t (seconds) */
export const at = (t: number, fn: () => void) => later(() => void setTimeout(fn, t * 1000));
/** animate el starting at film time t */
export const A = (el: Element, kf: Keyframe[], t: number, dur: number, o: KeyframeAnimationOptions = {}) =>
  later(() => void el.animate(kf, { delay: t * 1000, duration: Math.max(1, dur * 1000), fill: 'both', easing: 'cubic-bezier(.2,.7,.2,1)', ...o }));
/** make el visible only between t0 and t1 (el must start at opacity 0) */
export const vis = (el: HTMLElement, t0: number, t1: number, fade = 0) => {
  el.style.opacity = '0';
  const f = fade > 0 ? Math.min(0.5, fade / (t1 - t0)) : 0;
  const kf: Keyframe[] = fade > 0
    ? [{ opacity: 0, offset: 0 }, { opacity: 1, offset: f }, { opacity: 1, offset: 1 - f }, { opacity: 0, offset: 1 }]
    : [{ opacity: 1 }, { opacity: 1 }];
  later(() => void el.animate(kf, { delay: t0 * 1000, duration: (t1 - t0) * 1000, fill: 'none', easing: 'linear' }));
};
export const mk = <K extends keyof HTMLElementTagNameMap>(tag: K, css = '', text = '', parent?: Element): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (text) e.textContent = text;
  parent?.append(e);
  return e;
};
export const layer = (parent: Element, css = '') => mk('div', `position:absolute;inset:0;${css}`, '', parent);
export const EASE_IO = 'cubic-bezier(.45,0,.2,1)';



// ---------- cursor ----------
export function makeCursor(parent: HTMLElement) {
  const el = mk('div', 'position:absolute;left:0;top:0;width:34px;height:42px;opacity:0;z-index:50;pointer-events:none;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35))', '', parent);
  el.innerHTML = `<svg width="34" height="42" viewBox="0 0 34 42"><path d="M3 2 L3 33 L11 26 L16.5 38.5 L22 36 L16.5 24 L27 24 Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
  return {
    show: (t0: number, t1: number) => vis(el, t0, t1),
    path(pts: { t: number; x: number; y: number }[]) {
      const t0 = pts[0]!.t, t1 = pts[pts.length - 1]!.t;
      const kf = pts.map((p) => ({ transform: `translate(${p.x}px,${p.y}px)`, offset: (p.t - t0) / (t1 - t0), easing: EASE_IO }));
      A(el, kf, t0, t1 - t0, { easing: 'linear' });
    },
    click(t: number, x: number, y: number) {
      const ring = mk('div', `position:absolute;left:${x - 36}px;top:${y - 36}px;width:72px;height:72px;border-radius:50%;border:5px solid ${LIT};opacity:0;z-index:49;pointer-events:none`, '', parent);
      A(ring, [{ opacity: 0.95, transform: 'scale(.25)' }, { opacity: 0, transform: 'scale(1.25)' }], t, 0.5, { easing: 'cubic-bezier(.1,.6,.3,1)', fill: 'none' });
      A(el, [{ scale: '1' }, { scale: '.86' }, { scale: '1' }], t - 0.04, 0.18, { fill: 'none', easing: 'ease-out' });
    },
  };
}
export const centerOf = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

