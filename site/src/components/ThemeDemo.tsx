'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EVENTS, MOODS } from '@/lib/data';
import { useFootlit, type Mood } from '@/lib/footlit';
import { MockProfile } from './MockProfile';
import s from './ThemeDemo.module.css';

/** A live demo locked to one theme, for the theme pages. Runs the same engine as the extension. */
export function ThemeDemo({ themeId, themeName }: { themeId: string; themeName: string }) {
  const { play, stop, ready } = useFootlit();
  const stage = useRef<HTMLDivElement>(null);
  const [eventId, setEventId] = useState('pr.merged');
  const [mood, setMood] = useState<Mood>('applause');
  const autoplayed = useRef(false);

  const run = useCallback(
    (o: { event?: string; mood?: Mood } = {}) => void play(o.event ?? eventId, { container: stage.current, theme: themeId, mood: o.mood ?? mood }),
    [play, eventId, themeId, mood],
  );

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
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready, run]);

  const event = EVENTS.find((e) => e.id === eventId) ?? EVENTS[0]!;
  return (
    <div className={s.demo}>
      <div className={s.stagebox}>
        <MockProfile />
        <div className={s.stage} ref={stage} />
        {!ready ? <p className={s.loading}>Warming up the lights…</p> : null}
      </div>
      <p className={s.caption} aria-live="polite">{themeName} / {event.label} / {MOODS[mood].label}</p>
      <div className={s.controls}>
        <label>
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
            <button key={m} aria-pressed={m === mood} onClick={() => { setMood(m); run({ mood: m }); }}>{MOODS[m].label}</button>
          ))}
        </div>
        <button className={s.replay} onClick={() => run()} disabled={!ready}>Replay</button>
        <button className={s.stop} onClick={stop}>Stop</button>
      </div>
    </div>
  );
}
