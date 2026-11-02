'use client';

import { useEffect, useRef, useState } from 'react';
import { site } from '@/site.config';
import { TicketButton } from './TicketButton';
import { GitHub } from './Icons';
import s from './FullHouse.module.css';

/** A seat map: one lit seat per install, filling in as the section scrolls into view. */
export function FullHouse() {
  const root = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false); // client only: seats start dark, then light up
  const [on, setOn] = useState(false);

  const total = parseInt(String(site.chromeUsers), 10);
  const seats = Number.isFinite(total) && total > 0 ? Math.min(total, 300) : 0;

  useEffect(() => {
    const el = root.current;
    if (!el || !seats) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof IntersectionObserver === 'undefined') return;
    setArmed(true);
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [seats]);

  if (!seats) return null;

  // a scattered, but fixed, order: seats fill like a house arriving, not like a progress bar
  const step = [37, 41, 43, 47].find((p) => seats % p !== 0) ?? 1;
  const cols = seats % 20 === 0 ? 20 : seats % 10 === 0 ? 10 : 20;
  const colsSm = seats % 10 === 0 ? 10 : seats % 5 === 0 ? 5 : 8;

  return (
    <section id="house" ref={root} className={`ink ${s.section} ${armed ? s.armed : ''} ${on ? s.on : ''}`} aria-labelledby="h-house">
      <div className={`wrap ${s.grid}`}>
        <div className={s.copy}>
          <p className="eyebrow">House count</p>
          <b className={`display ${s.num}`}>{site.chromeUsers}</b>
          <p className={s.unit}>installs on the Chrome Web Store</p>
          <h2 id="h-house" className={`display ${s.h2}`}>The house is filling up.</h2>
          <p className={s.body}>Footlit passed {seats} installs. Thank you to everyone who took a seat, and to the ones who told a friend. Every one of them means a lot to a small project.</p>
          <div className={s.cta}>
            <TicketButton href={site.chromeStoreUrl || '/#install'} title={site.chromeStoreUrl ? 'Add to Chrome' : 'Get Footlit'} sub="Free. Take a seat." stub="Free" tone="tungsten" />
            {site.repoUrl && (
              <a className={s.star} href={site.repoUrl} target="_blank" rel="noopener noreferrer"><GitHub width={18} height={18} /> Star the source on GitHub</a>
            )}
          </div>
        </div>
        <div className={s.map} style={{ ['--cols' as string]: cols, ['--cols-sm' as string]: colsSm }}>
          <p className={s.stage}><span>Stage</span></p>
          <div className={s.seats} aria-hidden="true">
            {Array.from({ length: seats }, (_, i) => <i key={i} className={s.seat} style={{ ['--d' as string]: ((i * step) % seats) * 26 }} />)}
          </div>
          <p className={s.cap}>One seat per install. Chrome Web Store only; Firefox is not counted here.</p>
        </div>
      </div>
    </section>
  );
}
