import { pick, rand } from './util';

export type Shape = 'strip' | 'dot' | 'square';

export interface BurstOpts {
  /** origin in 0..1 of the box */
  x: number;
  y: number;
  /** degrees, 0 = right, 90 = up */
  angle: number;
  spread: number;
  /** initial speed as a fraction of box height per second */
  power: number;
  count: number;
}

export interface ConfettiOpts {
  colors: string[];
  shapes?: Shape[];
  /** box heights per second squared */
  gravity?: number;
  drag?: number;
  /** snap positions/sizes to this pixel grid (pixel theme) */
  snap?: number;
  /** particle size in box-height fractions */
  size?: [number, number];
  life?: [number, number];
}

interface P {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; flip: number; vf: number;
  w: number; h: number; color: string; shape: Shape;
  age: number; life: number;
}

/**
 * Small 2D particle system. Positions are in CSS pixels, speeds scale with the box height so a
 * burst looks the same in the full-screen overlay and in the options preview.
 */
export class Confetti {
  private ctx: CanvasRenderingContext2D;
  private ps: P[] = [];
  private raf = 0;
  private last = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;

  constructor(
    private box: HTMLElement,
    private signal: AbortSignal,
    private opts: ConfettiOpts,
  ) {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    box.append(canvas);
    this.ctx = canvas.getContext('2d')!;
    const resize = () => {
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = box.clientWidth;
      this.h = box.clientHeight;
      canvas.width = Math.max(1, Math.round(this.w * this.dpr));
      canvas.height = Math.max(1, Math.round(this.h * this.dpr));
    };
    resize();
    new ResizeObserver(resize).observe(box);
    signal.addEventListener('abort', () => cancelAnimationFrame(this.raf), { once: true });
  }

  burst(o: BurstOpts): void {
    const { colors, shapes = ['strip'], size = [0.012, 0.026], life = [1.6, 3.2] } = this.opts;
    for (let i = 0; i < o.count; i++) {
      const a = ((o.angle + rand(-o.spread / 2, o.spread / 2)) * Math.PI) / 180;
      const speed = o.power * this.h * rand(0.55, 1.1);
      const s = this.h * rand(size[0], size[1]);
      const shape = pick(shapes);
      this.ps.push({
        x: o.x * this.w, y: o.y * this.h,
        vx: Math.cos(a) * speed, vy: -Math.sin(a) * speed,
        rot: rand(0, Math.PI * 2), vr: rand(-9, 9),
        flip: rand(0, Math.PI * 2), vf: rand(6, 14),
        w: shape === 'strip' ? s * 1.9 : s, h: s,
        color: pick(colors), shape,
        age: 0, life: rand(life[0], life[1]),
      });
    }
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = (now: number) => {
    if (this.signal.aborted) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { gravity = 2.1, drag = 0.9, snap } = this.opts;
    const g = gravity * this.h;
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    this.ps = this.ps.filter((p) => p.age < p.life && p.y < this.h + 60);
    for (const p of this.ps) {
      p.age += dt;
      const k = Math.pow(drag, dt * 60 * 0.1);
      p.vx *= k;
      p.vy = p.vy * k + g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      const fade = p.age > p.life - 0.5 ? Math.max(0, (p.life - p.age) / 0.5) : 1;
      c.globalAlpha = fade;
      c.fillStyle = p.color;
      if (snap) {
        const s = Math.max(snap, Math.round(p.h / snap) * snap);
        c.fillRect(Math.round(p.x / snap) * snap, Math.round(p.y / snap) * snap, s, s);
      } else {
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.scale(1, Math.cos(p.flip));
        if (p.shape === 'dot') {
          c.beginPath();
          c.arc(0, 0, p.h / 2, 0, Math.PI * 2);
          c.fill();
        } else {
          c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        c.restore();
      }
    }
    c.globalAlpha = 1;
    this.raf = this.ps.length ? requestAnimationFrame(this.tick) : 0;
    if (!this.ps.length) c.clearRect(0, 0, this.w, this.h);
  };
}
