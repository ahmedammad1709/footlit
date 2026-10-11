import Link from 'next/link';
import { Cross, Tick } from './Icons';
import s from './Trust.module.css';

export function Trust() {
  return (
    <section id="trust" className={`ink ${s.section} band`} aria-labelledby="h-trust">
      <div className="wrap">
        <header className={s.head}>
          <p className="eyebrow">05 / Trust</p>
          <h2 id="h-trust" className={`display ${s.h2}`}>Safe by design.<br /><em>Nothing leaves your browser.</em></h2>
          <p className="lede">Footlit has no server, no account and no analytics. It cannot send your data anywhere because it never makes a network request. You do not have to take our word for it, and below is how to check.</p>
        </header>

        <dl className={s.stats}>
          <div><dt>network requests from the extension</dt><dd>0</dd></div>
          <div><dt>site it runs on: github.com</dt><dd>1</dd></div>
          <div><dt>accounts, trackers or analytics</dt><dd>0</dd></div>
        </dl>

        <div className={s.cols}>
          <div className={s.card}>
            <h3 className="display">What it looks at</h3>
            <ul className={s.yes}>
              <li><Tick /> The page address and title</li>
              <li><Tick /> A few status labels, like Open / Merged / Closed or “All checks have passed”</li>
              <li><Tick /> Whether the next page is the one you just created, forked or released</li>
            </ul>
            <p className={s.why}>Only to decide whether to play an animation, in the same tab.</p>
          </div>
          <div className={s.card}>
            <h3 className="display">What it never touches</h3>
            <ul className={s.no}>
              <li><Cross /> Your code, diffs and files</li>
              <li><Cross /> Comments, issue text and anything you type</li>
              <li><Cross /> Passwords, tokens and cookies</li>
              <li><Cross /> Any website other than github.com</li>
            </ul>
            <p className={s.why}>It has no way to send anything out, even if it wanted to.</p>
          </div>

          <div className={`${s.card} ${s.perm}`}>
            <h3 className="display">Permissions, in full</h3>
            <p className={s.permline}><b>Read and change data on github.com</b><span>To notice the moment and draw the animation on the page.</span></p>
            <p className={s.permline}><b>Storage</b><span>To remember your theme and switches, and a short local activity log.</span></p>
            <p className={s.none}>That is the whole list. No tabs, history, bookmarks, downloads or clipboard.</p>
          </div>
        </div>

        <div className={s.check}>
          <h3 className="display">Check it yourself</h3>
          <ol>
            <li><b>Look at the permissions.</b> On the extensions page, open Footlit’s Details. Site access shows github.com only.</li>
            <li><b>Watch the network.</b> Open your browser’s DevTools Network tab on a GitHub page and trigger a show. Nothing comes from Footlit.</li>
            <li><b>Read the policy.</b> It is short and written for people, not lawyers.</li>
          </ol>
          <Link prefetch={false} href="/privacy/" className="btn">Read the privacy policy</Link>
        </div>
      </div>
    </section>
  );
}
