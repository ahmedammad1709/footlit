'use client';

import { useEffect, useRef, useState } from 'react';
import { useFootlit } from '@/lib/footlit';
import s from './Story.module.css';

/**
 * "What is this?" for people who scroll instead of watching: three beats, and the three pictures play the beats
 * in a loop (while the section is on screen): click Merge, Footlit notices, the real engine plays the show.
 */
export function Story() {
  const { ready } = useFootlit();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0); // 0 idle, 1 cursor arrives, 2 clicked, 3 noticed
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!ready || !el) return;
    if (reduced) {
      setPhase(3);
      return;
    }
    let alive = true;
    let visible = false;
    let running = false;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => void timers.push(window.setTimeout(fn, ms));
    const clear = () => timers.splice(0).forEach((t) => clearTimeout(t));

    const cycle = () => {
      if (!alive || !visible) { running = false; return; }
      running = true;
      setPhase(0);
      setPlaying(false);
      later(900, () => setPhase(1));
      later(1700, () => setPhase(2));
      later(2300, () => setPhase(3));
      later(2700, async () => {
        const host = stage.current;
        if (!host || !window.Footlit) { later(4000, cycle); return; }
        setPlaying(true);
        try {
          await window.Footlit.play({ event: 'pr.merged', theme: 'marquee', container: host, subject: 'acme/widget-shop #42', detail: 'Fix flaky login redirect on Safari' });
        } finally {
          if (alive) { setPlaying(false); later(1600, cycle); }
        }
      });
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible && !running) cycle();
      if (!visible) { clear(); running = false; setPlaying(false); window.Footlit?.stop(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { alive = false; io.disconnect(); clear(); window.Footlit?.stop(); };
  }, [ready, reduced]);

  const clicked = phase >= 2;
  const noticed = phase >= 3;

  return (
    <section id="how" ref={root} className={`paper2 ${s.section}`} aria-labelledby="how-heading">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="display">You do the work.<br />Footlit brings the applause.</h2>
        </header>
        <ol className={s.steps}>
          <li>
            <span className={`display ${s.num}`} aria-hidden="true">1</span>
            <h3>You do the thing.</h3>
            <p>Merge a pull request. Publish a release. Create a repository. Nothing new to learn: you use GitHub exactly as before.</p>
            <div className={s.pic} aria-hidden="true">
              <span className={`${s.merge} ${clicked ? s.merged : ''}`}>{clicked ? '✓ Merged' : 'Merge pull request'}</span>
              <svg className={`${s.cursor} ${phase >= 1 ? s.cursorIn : ''} ${phase === 2 ? s.cursorClick : ''}`} width="26" height="32" viewBox="0 0 34 42"><path d="M3 2 L3 33 L11 26 L16.5 38.5 L22 36 L16.5 24 L27 24 Z" fill="#F1E8D4" stroke="#17120E" strokeWidth="2.5" strokeLinejoin="round" /></svg>
            </div>
          </li>
          <li>
            <span className={`display ${s.num}`} aria-hidden="true">2</span>
            <h3>Footlit notices.</h3>
            <p>A small script on github.com reads the page labels, right in your browser. It watches for the change from “open” to “merged”, nothing else.</p>
            <div className={`${s.pic} ${s.log}`} aria-hidden="true">
              <span>pull/42</span>
              <span>status: <b className={noticed ? s.dim : ''}>open</b>{noticed && <> → <b className={s.hit}>merged</b></>}</span>
              <span className={`${s.line} ${noticed ? s.lineOn : ''}`}>show: marquee ▸</span>
            </div>
          </li>
          <li>
            <span className={`display ${s.num}`} aria-hidden="true">3</span>
            <h3>The show plays.</h3>
            <p>A full-screen moment in the theme you picked, then the page is yours again. Press Esc to skip it any time.</p>
            <div className={s.pic} aria-hidden="true">
              <img className={playing ? s.hidden : ''} src="/mock/theme-marquee.png" width={1280} height={800} alt="" loading="lazy" />
              <div ref={stage} className={s.stage} />
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
