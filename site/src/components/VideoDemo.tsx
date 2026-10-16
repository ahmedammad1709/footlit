'use client';

import { useState } from 'react';
import s from './VideoDemo.module.css';

export function VideoDemo() {
  const [started, setStarted] = useState(false);
  return (
    <section id="watch" className={s.section} aria-labelledby="watch-heading">
      <div className={`wrap ${s.grid}`}>
        <div className={s.copy}>
          <h2 id="watch-heading" className="display">A small moment.<br />A proper entrance.</h2>
          <p>Watch Footlit turn everyday GitHub updates into curtain calls, terminal sequences, and arcade victories.</p>
          <p className={s.duration}>17 seconds. Sound off by design.</p>
        </div>
        <figure className={s.film}>
          {started ? (
            <video controls autoPlay playsInline preload="none" poster="/demo/poster.jpg" aria-label="Footlit animation demonstration" aria-describedby="demo-description">
              <source src="/demo/footlit-demo.mp4" type="video/mp4" />
              <a href="/demo/footlit-demo.mp4">Download the demo video</a>
            </video>
          ) : (
            <button className={s.poster} onClick={() => setStarted(true)} aria-label="Play the 17-second Footlit demo">
              <img src="/demo/poster.jpg" width={1280} height={720} alt="Footlit's gold marquee animation over a GitHub page" loading="lazy" />
              <span className={s.play}><span aria-hidden="true">▶</span> Watch Footlit</span>
            </button>
          )}
          <figcaption id="demo-description">A GitHub action triggers a themed animation, then returns you to your work. This silent tour previews several looks.</figcaption>
        </figure>
      </div>
    </section>
  );
}
