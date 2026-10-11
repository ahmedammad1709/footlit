import s from './Inside.module.css';

const POINTS = [
  ['Pick a theme once', 'Six themes, or give each event its own. The toolbar popup switches theme in a single click.'],
  ['Switch anything off', 'Eleven events, each with its own switch. Rehearse any of them on the GitHub tab you have open.'],
  ['A preview that stays put', 'The settings page keeps a live preview in view while you scroll, so every change plays where you are looking.'],
  ['Polite by default', 'Quiet mode for an hour, a gentle Quiet theme, reduced motion respected, and Esc skips any show.'],
] as const;

export function Inside() {
  return (
    <section id="inside" className={`paper ${s.section} band`} aria-labelledby="h-inside">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">04 / Inside</p>
          <h2 id="h-inside" className={`display ${s.h2}`}>A small popup.<br />A roomy settings page.</h2>
        </header>

        <div className={s.grid}>
          <ol className={s.points}>
            {POINTS.map(([t, d], i) => (
              <li key={t}>
                <span className={s.n}>{i + 1}</span>
                <div>
                  <h3 className="display">{t}</h3>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className={s.shots}>
            <figure className={s.settings}>
              <div className={s.bar}>
                <span><i /><i /><i /></span>
                <b>Footlit settings</b>
              </div>
              <img src="/mock/settings.png" width={1500} height={940} alt="Footlit's settings page: a sidebar, a list of events with switches, and a live preview of the Marquee theme" loading="lazy" />
            </figure>
            <figure className={s.popup}>
              <figcaption className={s.badge}>Toolbar popup</figcaption>
              <img src="/mock/popup.png" width={372} height={591} alt="Footlit's toolbar popup: six theme buttons and eleven events, each with a Rehearse button and an on/off switch" loading="lazy" />
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
