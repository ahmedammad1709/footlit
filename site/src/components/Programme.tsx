'use client';

import { EVENT_BY_ID, GROUPS, MOODS } from '@/lib/data';
import { useFootlit } from '@/lib/footlit';
import s from './Programme.module.css';

export function Programme() {
  const { play, ready } = useFootlit();
  return (
    <section id="events" className={`ink ${s.section} band`} aria-labelledby="h-events">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">02 / The programme</p>
          <h2 id="h-events" className={`display ${s.h2}`}>Eleven moments.<br /><em>Each gets an entrance.</em></h2>
          <p className="lede">Press Try it to play any of them over this page, in whichever theme you picked above. Every event can be switched off, or given its own theme.</p>
        </header>

        <div className={s.groups}>
          {GROUPS.map((g, gi) => (
            <div key={g.id} className={s.group}>
              <h3 className={`display ${s.gh}`}><span>{String(gi + 1).padStart(2, '0')}</span>{g.label}</h3>
              <ul>
                {g.events.map((id) => {
                  const e = EVENT_BY_ID[id]!;
                  return (
                    <li key={id}>
                      <div className={s.name}>
                        <strong>{e.label}</strong>
                        <em>{e.blurb}</em>
                      </div>
                      <span className={`${s.stamp} ${s[e.mood]}`}>{MOODS[e.mood as 'applause']?.label}</span>
                      <button className="btn" onClick={() => void play(id)} disabled={!ready}>Try it</button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <p className={s.more}><a href="/events/">How Footlit detects each event →</a></p>

        <p className={s.note}>
          <b>Only what you watch happen.</b> Footlit reacts to a change it sees while the tab is open. Opening a pull request that was merged last week, or checks that are already green, plays nothing.
        </p>
      </div>
    </section>
  );
}
