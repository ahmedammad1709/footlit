'use client';

import { useEffect, useRef } from 'react';
import { DOWNLOADS, EVENTS, THEMES, VERSION, useFootlit } from '@/lib/footlit';
import { site } from '@/site.config';
import { TicketButton } from './TicketButton';
import { PrDemo } from './PrDemo';
import { Down } from './Icons';
import s from './Hero.module.css';

const LAMPS = 17;

export function Hero() {
  const { play, ready } = useFootlit();
  const root = useRef<HTMLElement>(null);

  // the footlight beams lean toward the pointer
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

  const dl = DOWNLOADS.chrome;
  return (
    <section id="top" ref={root} className={`ink ${s.hero}`}>
      <div className={s.beams} aria-hidden="true">
        <i className={s.b1} /><i className={s.b2} /><i className={s.b3} />
      </div>

      <div className={`wrap ${s.grid}`}>
        <div className={s.copy}>
          <p className="eyebrow">Free GitHub extension · Chrome, Firefox</p>
          <h1 className={`display ${s.h1}`}>
            GitHub, with <em>stage lighting.</em>
          </h1>
          <p className={`lede ${s.lede}`}>
            Merge a pull request, watch the checks go green, publish a release. Footlit gives the moment a proper entrance: {THEMES.length} hand-built themes, {EVENTS.length} events, and nothing ever leaves your browser.
          </p>
          <div className={s.cta}>
            {site.chromeStoreUrl ? (
              <TicketButton href={site.chromeStoreUrl} title="Add to Chrome" sub={`Free · Chrome Web Store · v${VERSION}`} stub="Free" tone="tungsten" />
            ) : (
              <TicketButton href={dl?.file ?? '/#install'} download={!!dl} title="Download for Chrome" sub={dl ? `Free · .zip · ${dl.kb} KB · v${VERSION}` : 'Free'} stub="Free" tone="tungsten" icon={<Down />} />
            )}
            <button className={`btn ${s.try}`} onClick={() => void play('pr.merged')} disabled={!ready}>
              Make this page celebrate
            </button>
          </div>
          <p className={s.skipnote}>Esc skips a show.</p>
          <dl className={s.stats}>
            <div><dt>Themes</dt><dd>{THEMES.length}</dd></div>
            <div><dt>Events</dt><dd>{EVENTS.length}</dd></div>
            <div><dt>Network requests</dt><dd>0</dd></div>
          </dl>
        </div>

        <div className={s.demo}>
          <PrDemo />
        </div>
      </div>

      <div className={s.lamps} aria-hidden="true">
        {Array.from({ length: LAMPS }, (_, i) => (
          <span key={i} style={{ ['--i' as string]: Math.abs(i - (LAMPS - 1) / 2) }} />
        ))}
      </div>
    </section>
  );
}
