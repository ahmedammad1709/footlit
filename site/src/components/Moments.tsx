import Link from 'next/link';
import { EVENT_BY_ID, GROUPS, MOODS, type Mood } from '@/lib/data';
import s from './Moments.module.css';

/** All eleven events, grouped, each with the one-line promise and the mood it plays in. */
export function Moments() {
  return (
    <section id="events" className={`ink ${s.section}`} aria-labelledby="events-heading">
      <div className="wrap">
        <header className={s.head}>
          <h2 id="events-heading" className="display">Eleven moments.<br /><em>Each gets an entrance.</em></h2>
          <p className="lede">Applause when something goes right, a farewell when something ends, an alarm when it breaks.</p>
        </header>
        <div className={s.groups}>
          {GROUPS.map((g) => (
            <div key={g.id} className={s.group}>
              <h3>{g.label}</h3>
              <ul>
                {g.events.map((id) => {
                  const e = EVENT_BY_ID[id]!;
                  const mood = e.mood as Mood;
                  return (
                    <li key={id}>
                      <span className={s.name}>{e.label}</span>
                      <span className={`${s.mood} ${s[mood]}`}>{MOODS[mood].label}</span>
                      <span className={s.blurb}>{e.blurb}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className={s.more}><Link href="/events/" prefetch={false}>See how each one is detected</Link></p>
      </div>
    </section>
  );
}
