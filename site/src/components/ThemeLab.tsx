'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EVENTS, MOODS, THEMES, useFootlit, type Mood } from '@/lib/footlit';
import { MockProfile } from './MockProfile';
import s from './ThemeLab.module.css';

/** Choose a theme, choose an event, and the real engine plays it. This is the same code the extension runs. */
export function ThemeLab() {
  const { play, stop, ready, themeId, setThemeId } = useFootlit();
  const stage = useRef<HTMLDivElement>(null);
  const [eventId, setEventId] = useState('pr.merged');
  const [mood, setMood] = useState<Mood>('applause');
  const autoplayed = useRef(false);

  const run = useCallback(
    (o: { theme?: string; event?: string; mood?: Mood } = {}) => void play(o.event ?? eventId, { container: stage.current, theme: o.theme ?? themeId, mood: o.mood ?? mood }),
    [play, eventId, themeId, mood],
  );

  // play once, the first time the lab scrolls into view
  useEffect(() => {
    const el = stage.current;
    if (!el || !ready) return;
    const io = new IntersectionObserver(
      ([en]) => {
        if (en?.isIntersecting && !autoplayed.current) {
          autoplayed.current = true;
          run();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready, run]);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  const event = EVENTS.find((e) => e.id === eventId) ?? EVENTS[0]!;

  return (
    <section id="themes" className={`paper ${s.section} band`} aria-labelledby="h-themes">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">01 / The theatre</p>
          <h2 id="h-themes" className={`display ${s.h2}`}>Pick a look.<br />Watch it play.</h2>
          <p className="lede">Six complete productions, not six colour swatches. This is the real engine from the extension: choose a theme and an event and it plays right here.</p>
        </header>

        <div className={s.lab}>
          <div className={s.cards} role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={s.card}
                aria-pressed={t.id === themeId}
                onClick={() => {
                  setThemeId(t.id);
                  run({ theme: t.id });
                }}
              >
                <span className={s.sw}>{t.swatch.map((c) => <i key={c} style={{ background: c }} />)}</span>
                <span className={`display ${s.nm}`}>{t.name}</span>
                <span className={s.tg}>{t.tagline}</span>
                {t.id === themeId ? <span className={s.stamp}>Now showing</span> : null}
              </button>
            ))}
          </div>

          <div className={s.dock}>
            <p className="eyebrow">Live preview</p>
            <div className={s.stagebox}>
              <MockProfile />
              <div className={s.stage} ref={stage} />
              {!ready ? <p className={s.loading}>Warming up the lights…</p> : null}
            </div>
            <p className={s.caption} aria-live="polite">{theme.name} / {event.label} / {MOODS[mood].label}</p>

            <div className={s.controls}>
              <label className={s.pick}>
                <span className="sr">Event to play</span>
                <select
                  value={eventId}
                  onChange={(e) => {
                    const ev = EVENTS.find((x) => x.id === e.target.value)!;
                    setEventId(ev.id);
                    setMood(ev.mood as Mood);
                    run({ event: ev.id, mood: ev.mood as Mood });
                  }}
                >
                  {EVENTS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </label>
              <div className={s.seg} role="group" aria-label="Mood">
                {(Object.keys(MOODS) as Mood[]).map((m) => (
                  <button
                    key={m}
                    aria-pressed={m === mood}
                    onClick={() => {
                      setMood(m);
                      run({ mood: m });
                    }}
                  >
                    {MOODS[m].label}
                  </button>
                ))}
              </div>
            </div>
            <p className={s.more}><a href="/themes/">Read about each theme and see what it does for every event →</a></p>
            <div className={s.row}>
              <button className={s.replay} onClick={() => run()} disabled={!ready}>Replay</button>
              <button className="btn" onClick={() => void play(eventId, { mood })} disabled={!ready}>Play on the whole page</button>
              <button className={s.stop} onClick={stop}>Stop</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
