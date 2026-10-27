import Link from 'next/link';
import { site } from '@/site.config';
import s from './Trust.module.css';

/** The one place the privacy promise is made in full (everywhere else just links here). */
export function Trust() {
  return (
    <section id="trust" className={`paper ${s.section}`} aria-labelledby="trust-heading">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">Safe by design</p>
          <h2 id="trust-heading" className="display">Your work stays yours.</h2>
        </header>
        <div className={s.facts}>
          <div>
            <b className={`display ${s.big}`}>1</b>
            <h3>One site.</h3>
            <p>Footlit runs on github.com and nowhere else. It never asks for “all websites”.</p>
          </div>
          <div>
            <b className={`display ${s.big}`}>0</b>
            <h3>Nothing leaves your browser.</h3>
            <p>No account, no analytics, no servers of ours. Footlit makes no network requests of its own.</p>
          </div>
          <div>
            <b className={`display ${s.big}`}>∞</b>
            <h3>Always your call.</h3>
            <p>Switch events off one by one, pause everything for an hour with Quiet mode, or follow your system’s reduced-motion setting.</p>
          </div>
        </div>
        <aside className={s.note} aria-labelledby="perm-heading">
          <h3 id="perm-heading">Why does Chrome say it can “read and change your data on github.com”?</h3>
          <p>That is Chrome’s standard wording for any extension that runs on a website, and it describes what is possible, not what happens. Footlit reads page labels locally to know when something happened, draws the animation, and sends nothing anywhere. <Link href="/privacy/" prefetch={false}>Read the privacy details</Link>.{site.repoUrl && <> Don’t take our word for it: the code is public, so you can <a href={site.repoUrl} target="_blank" rel="noopener noreferrer">read it on GitHub</a>.</>}</p>
        </aside>
      </div>
    </section>
  );
}
