'use client';

import { useState } from 'react';
import s from './VideoDemo.module.css';

const TRANSCRIPT = [
  'You just merged your pull request. And nothing happened.',
  'What if it felt like this?',
  'Meet Footlit. A free GitHub extension that gives every moment a standing ovation.',
  'Create a repo. Opening night. Break the build. The show stops. Merge it. Take a bow.',
  'Six hand-built themes.',
  'Free. Private. Nothing leaves your browser.',
  'Footlit. Free for Chrome and Firefox.',
];

/** The final marketing film (voice, music and captions), click to play (nothing downloads until you press play). */
export function VideoDemo() {
  const [started, setStarted] = useState(false);
  return (
    <section id="watch" className={s.section} aria-labelledby="watch-heading">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">The whole show in 44 seconds</p>
          <h2 id="watch-heading" className="display">See what a merge<br />could feel like.</h2>
        </header>
        <figure className={s.film}>
          {started ? (
            <video controls autoPlay playsInline preload="auto" poster="/demo/poster-launch.jpg" aria-label="Footlit marketing film, 44 seconds" aria-describedby="demo-description">
              <source src="/demo/footlit-marketing.mp4" type="video/mp4" />
              <track kind="captions" src="/demo/footlit-marketing.en.vtt" srcLang="en" label="English" default />
              <a href="/demo/footlit-marketing.mp4">Download the film</a>
            </video>
          ) : (
            <button className={s.poster} onClick={() => setStarted(true)} aria-label="Play the 44-second Footlit film">
              <img src="/demo/poster-launch.jpg" width={1280} height={720} alt="Footlit: every GitHub event gets a show. Play the 44-second film." loading="lazy" />
              <span className={s.play}><span aria-hidden="true">▶</span> Watch the film <small>44 s · sound on</small></span>
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
