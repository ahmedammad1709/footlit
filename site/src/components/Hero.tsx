'use client';

import { useEffect, useRef } from 'react';
import { site } from '@/site.config';
import { TicketButton } from './TicketButton';
import { PrDemo } from './PrDemo';
import s from './Hero.module.css';

export function Hero() {
  const root = useRef<HTMLElement>(null);

  // the stage light leans toward the pointer
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let target = 0.5;
    let x = 0.5;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    };
    const tick = () => {
      x += (target - x) * 0.07;
      el.style.setProperty('--bx', x.toFixed(4));
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="top" ref={root} className={`ink ${s.hero}`}>
      <div className={s.beams} aria-hidden="true">
        <i className={s.b1} /><i className={s.b2} /><i className={s.b3} />
      </div>
      <div className={`wrap ${s.grid}`}>
        <div className={s.copy}>
          <p className={s.intro}>A little theatre for your GitHub tab.</p>
          <h1 className={`display ${s.h1}`}>You shipped it.<br />Take a bow.</h1>
          <p className={s.lede}>Turn a merged pull request, green checks, or a new release into a moment worth watching.</p>
          <div className={s.cta}>
            <TicketButton href={site.chromeStoreUrl || '/#install'} title={site.chromeStoreUrl ? 'Add to Chrome' : 'Get Footlit'} sub="Free. No account needed." stub="Free" tone="tungsten" />
            <a href="#watch" className={s.watch}><span aria-hidden="true">▷</span> Watch the demo</a>
          </div>
          <p className={s.note}>Six themes. No sound. Always your call.{site.firefoxStoreUrl && <> <a href={site.firefoxStoreUrl}>Also on Firefox.</a></>}</p>
        </div>
        <div className={s.demo}>
          <div className={s.demoLabel}><span className={s.liveDot} /> Try it here <span>No installation needed</span></div>
          <PrDemo />
        </div>
      </div>
      <div className={s.lamps} aria-hidden="true">{Array.from({ length: 13 }, (_, i) => <span key={i} style={{ ['--i' as string]: i }} />)}</div>
    </section>
  );
}
