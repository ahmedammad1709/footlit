import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/site.config';
import { Tick } from '@/components/Icons';
import { JsonLd, breadcrumbs, pageMeta } from '@/lib/seo';
import s from './privacy.module.css';

export const metadata: Metadata = pageMeta({
  title: 'Privacy policy: Footlit collects nothing',
  description: 'Footlit makes no network requests, has no accounts or analytics, and keeps its settings in your browser. Here is exactly what it reads, stores and why.',
  path: '/privacy/',
  imageAlt: 'Footlit privacy policy',
});

export default function Privacy() {
  return (
    <article className={`paper ${s.page}`}>
      <JsonLd data={{ '@context': 'https://schema.org', '@graph': [breadcrumbs([['Footlit', '/'], ['Privacy policy', '/privacy/']])] }} />
      <header className={`ink ${s.hero}`}>
        <div className="wrap">
          <p className="eyebrow">Privacy policy</p>
          <h1 className={`display ${s.h1}`}>Safe by design.<br /><em>Nothing leaves your browser.</em></h1>
          <p className="lede">Footlit plays an animation when something happens on github.com. It was built so that it could not collect your data even by accident. Last updated {site.updated}.</p>
        </div>
      </header>

      <div className={`wrap ${s.body}`}>
        <aside className={s.short} aria-label="The short version">
          <h2 className="display">The short version</h2>
          <ul>
            <li><Tick /> The extension makes <b>no network requests</b>: no analytics, no telemetry, no crash reports, no ads, no remote code.</li>
            <li><Tick /> It runs <b>only on github.com</b>.</li>
            <li><Tick /> It does not read your code, diffs, comments, passwords, tokens or anything you type.</li>
            <li><Tick /> Your settings stay in your browser. There are no accounts.</li>
          </ul>
        </aside>

        <section>
          <h2 className="display">What Footlit looks at</h2>
          <p>To notice that you merged a pull request, published a release and so on, a script runs on the github.com pages you have open. It looks at the page address, the page title and a few status labels (for example the Open / Merged / Closed badge on a pull request, or the “All checks have passed” heading). It uses these only to decide whether to play an animation, and it plays that animation in the same tab. Nothing it sees is recorded anywhere except the short local activity log described below.</p>
        </section>

        <section>
          <h2 className="display">What Footlit stores, and where</h2>
          <div className={s.tablewrap}>
            <table>
              <thead><tr><th>Data</th><th>Where</th><th>Why</th></tr></thead>
              <tbody>
                <tr>
                  <td>Your settings: theme, which events are on, show length, appearance, quiet mode, and whether you dismissed the welcome</td>
                  <td>Your browser profile (<code>storage.sync</code>). If you turned on browser sync, your browser may sync it between your own devices under its vendor’s privacy terms.</td>
                  <td>So your choices persist</td>
                </tr>
                <tr>
                  <td>A short activity log (up to 40 entries: when an event was noticed, its type, the repository or pull request name it concerned, and whether it was shown) and a count of shows</td>
                  <td>This device only (<code>storage.local</code>)</td>
                  <td>To power the “Recent activity” list that helps you troubleshoot</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>Neither is ever transmitted. You can clear the activity log (Settings → Activity &amp; help → Clear activity) or reset every setting at any time, and removing the extension deletes all of it.</p>
        </section>

        <section>
          <h2 className="display">Permissions, in full</h2>
          <div className={s.tablewrap}>
            <table>
              <thead><tr><th>Permission</th><th>What it is for</th></tr></thead>
              <tbody>
                <tr><td><b>Access to github.com</b></td><td>To detect the moment and draw the animation on GitHub pages. It is not used on any other site.</td></tr>
                <tr><td><b>Storage</b></td><td>To save the settings and activity log above.</td></tr>
              </tbody>
            </table>
          </div>
          <p>Footlit does not ask for access to your tabs, browsing history, bookmarks, downloads, clipboard or any other website.</p>
        </section>

        <section>
          <h2 className="display">Your control</h2>
          <p>You can switch every event off, pause everything for an hour with Quiet mode, choose the small Quiet theme, and rely on the extension to respect your system’s reduced-motion setting. Pressing Esc skips a show. Uninstalling removes the extension and everything it stored.</p>
        </section>

        <section>
          <h2 className="display">About this website</h2>
          <p>This website uses <b>no cookies and no analytics</b>, and loads its fonts from itself rather than from a third party. The only thing it remembers is which theme you last picked for the demos on the page, and that stays in your browser’s local storage. Like any website, the company hosting it may keep ordinary server logs (such as the address you requested and your IP address) for security and reliability. If analytics are ever added to this website, this page will say so first.</p>
        </section>

        <section>
          <h2 className="display">Children</h2>
          <p>Footlit does not knowingly collect personal information from anyone, including children.</p>
        </section>

        <section>
          <h2 className="display">Changes</h2>
          <p>If this policy changes, the new version will be published here and the date at the top will change. Any change that affects what the extension reads or stores will also ship with a new version of the extension.</p>
        </section>

        <section>
          <h2 className="display">Contact</h2>
          <p>Footlit is built and maintained by {site.author}. Questions, bug reports or privacy concerns are welcome through the links at the bottom of any page, or <Link prefetch={false} href="/#install">get the extension</Link> and judge for yourself.</p>
        </section>

        <p className={s.disclaimer}>Footlit is an independent project and is not affiliated with, endorsed by or sponsored by GitHub, Inc. GitHub is a trademark of GitHub, Inc.</p>
      </div>
    </article>
  );
}
