'use client';

import { useState } from 'react';
import s from './VideoDemo.module.css';

const TRANSCRIPT = [
  "Every merge you've ever done… deserved better.",
  'Meet Footlit. GitHub, with stage lighting.',
  'Pick a theme. Create a repo, and the show begins. Break the build, and the show stops.',
  'Fix it. Merge it. Take a bow.',
  'Eleven events. Six themes. Zero data leaves your browser.',
  'Footlit. Free for Chrome and Firefox.',
];

/** The full launch film, click to play (nothing downloads until you press play). */
export function VideoDemo() {
  const [started, setStarted] = useState(false);
  return (
    <section id="watch" className={s.section} aria-labelledby="watch-heading">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">The whole show in under a minute</p>
          <h2 id="watch-heading" className="display">See what a merge<br />could feel like.</h2>
        </header>
        <figure className={s.film}>
          {started ? (
            <video controls autoPlay playsInline preload="auto" poster="/demo/poster-launch.jpg" aria-label="Footlit launch film, 56 seconds" aria-describedby="demo-description">
              <source src="/demo/footlit-launch.mp4" type="video/mp4" />
              <track kind="captions" src="/demo/footlit-launch.en.vtt" srcLang="en" label="English" default />
              <a href="/demo/footlit-launch.mp4">Download the film</a>
            </video>
          ) : (
            <button className={s.poster} onClick={() => setStarted(true)} aria-label="Play the 56-second Footlit film">
              <img src="/demo/poster-launch.jpg" width={1280} height={720} alt="Footlit's gold BRAVO marquee celebrating a merged pull request over a GitHub page" loading="lazy" />
              <span className={s.play}><span aria-hidden="true">▶</span> Watch the film <small>56 s · sound on</small></span>
            </button>
          )}
          <figcaption id="demo-description">
            Real animations from the extension, over a GitHub-style page. Captions are on.
            <details className={s.transcript}>
              <summary>Read the transcript</summary>
              {TRANSCRIPT.map((line) => <p key={line}>{line}</p>)}
            </details>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
