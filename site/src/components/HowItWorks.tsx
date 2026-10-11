import s from './HowItWorks.module.css';

export function HowItWorks() {
  return (
    <section id="how" className={`paper2 ${s.section} band`} aria-labelledby="h-how">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">03 / Backstage</p>
          <h2 id="h-how" className={`display ${s.h2}`}>Three beats.<br />No magic.</h2>
        </header>

        <ol className={s.steps}>
          <li>
            <span className={`display ${s.num}`}>1</span>
            <h3 className="display">You do the thing</h3>
            <p>Merge the pull request. Publish the release. Push the deploy. Nothing to configure and nothing to remember.</p>
            <div className={s.art} aria-hidden="true">
              <span className={s.pill}>Merge pull request</span>
              <svg className={s.cursor} viewBox="0 0 24 24" width="34" height="34"><path d="M5 3l14 8-6.2 1.6L9.6 19z" fill="currentColor" stroke="var(--paper-2)" strokeWidth="1.4" strokeLinejoin="round" /></svg>
            </div>
          </li>
          <li>
            <span className={`display ${s.num}`}>2</span>
            <h3 className="display">Footlit notices</h3>
            <p>It watches the page you have open for a change: a badge flipping from Open to Merged, checks finishing. It ignores anything that was already true when the page loaded.</p>
            <div className={`${s.art} ${s.code}`} aria-hidden="true">
              <div><span>page loads</span><b>Open</b></div>
              <div><span>you click merge</span><b className={s.flip}>Open → Merged</b></div>
              <div><span>transition seen</span><b className={s.ok}>fire pr.merged</b></div>
            </div>
          </li>
          <li>
            <span className={`display ${s.num}`}>3</span>
            <h3 className="display">The show plays</h3>
            <p>A full-screen overlay in your theme, about four seconds, with no clicks captured. Press Esc to skip it. Reduced motion gets a calm still card instead.</p>
            <div className={`${s.art} ${s.mini}`} aria-hidden="true">
              <div className={s.bulbrow}>{Array.from({ length: 11 }, (_, i) => <i key={i} style={{ animationDelay: `${i * 90}ms` }} />)}</div>
              <div className={`display ${s.bravo}`}>Bravo!</div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
