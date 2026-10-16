'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { THEMES, useFootlit } from '@/lib/footlit';
import s from './Showcase.module.css';

export function Showcase() {
  const { themeId, setThemeId, play, stop, ready } = useFootlit();
  const stage = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const generation = useRef(0);
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  async function preview(id = themeId) {
    if (!ready) return;
    const run = ++generation.current;
    setPlaying(true);
    try { await play('pr.merged', { theme: id, container: stage.current }); }
    finally { if (generation.current === run) setPlaying(false); }
  }
  return (
    <section id="themes" className={s.section} aria-labelledby="themes-heading">
      <div className={`wrap ${s.grid}`}>
        <div className={s.copy}>
          <h2 id="themes-heading" className="display">Your kind<br />of celebration.</h2>
          <p>A curtain call. An arcade victory. A quiet nod in the corner. Pick what feels like you.</p>
          <div className={s.choices} role="group" aria-label="Choose a theme">
            {THEMES.map((t) => <button key={t.id} aria-pressed={t.id === themeId} disabled={!ready} onClick={() => { setThemeId(t.id); void preview(t.id); }}><i style={{ background: t.swatch[0] }} aria-hidden="true" />{t.name}</button>)}
          </div>
          <Link href="/themes/" prefetch={false} className={s.link}>Explore all six themes</Link>
        </div>
        <div>
          <div className={s.screen}>
            <div className={s.rest}><span aria-hidden="true">✓</span><p>Pull request merged.</p><small>Nice work. Give it a little Footlit.</small></div>
            {!playing && <img className={s.still} src={`/mock/theme-${theme.id}.png`} alt={`${theme.name} animation preview`} width={1280} height={800} loading="lazy" />}
            <div ref={stage} className={s.stage} />
          </div>
          <div className={s.caption}><span aria-live="polite">{theme.name}</span><button disabled={!ready} onClick={() => playing ? stop() : void preview()}>{playing ? 'Stop preview' : 'Play preview'} <span aria-hidden="true">{playing ? '■' : '▷'}</span></button></div>
        </div>
      </div>
    </section>
  );
}
