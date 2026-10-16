import s from './Story.module.css';

/** "What is this?" for people who scroll instead of watching: three beats, one picture each. */
export function Story() {
  return (
    <section id="how" className={`paper2 ${s.section}`} aria-labelledby="how-heading">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="display">You do the work.<br />Footlit brings the applause.</h2>
        </header>
        <ol className={s.steps}>
          <li>
            <span className={`display ${s.num}`} aria-hidden="true">1</span>
            <h3>You do the thing.</h3>
            <p>Merge a pull request. Publish a release. Create a repository. Nothing new to learn: you use GitHub exactly as before.</p>
            <div className={s.pic} aria-hidden="true">
              <span className={s.merge}>Merge pull request</span>
            </div>
          </li>
          <li>
            <span className={`display ${s.num}`} aria-hidden="true">2</span>
            <h3>Footlit notices.</h3>
            <p>A small script on github.com reads the page labels, right in your browser. It watches for the change from “open” to “merged”, nothing else.</p>
            <div className={`${s.pic} ${s.log}`} aria-hidden="true">
              <span>pull/42</span>
              <span><b>open</b> → <b className={s.hit}>merged</b></span>
              <span>show: marquee</span>
            </div>
          </li>
          <li>
            <span className={`display ${s.num}`} aria-hidden="true">3</span>
            <h3>The show plays.</h3>
            <p>A full-screen moment in the theme you picked, then the page is yours again. Press Esc to skip it any time.</p>
            <div className={s.pic}>
              <img src="/mock/theme-marquee.png" width={1280} height={800} alt="The Marquee theme: a gold BRAVO sign with confetti" loading="lazy" />
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
