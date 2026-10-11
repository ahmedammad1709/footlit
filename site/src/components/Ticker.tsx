import { EVENTS } from '@/lib/data';
import s from './Ticker.module.css';

/** A theatre marquee: bulbs above and below, the programme scrolling through. Pure CSS; stops for reduced motion. */
export function Ticker() {
  const items = EVENTS.map((e) => e.label);
  const run = (key: string) => (
    <ul className={s.set} aria-hidden={key === 'b' ? 'true' : undefined} key={key}>
      {items.map((t) => (
        <li key={t}>
          <span>{t}</span>
          <i />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={s.band} role="presentation">
      <div className={s.bulbs} aria-hidden="true" />
      <div className={s.window}>
        <div className={s.track}>
          {run('a')}
          {run('b')}
        </div>
      </div>
      <div className={s.bulbs} aria-hidden="true" />
    </div>
  );
}
