import Link from 'next/link';
import type { ReactNode } from 'react';
import { site } from '@/site.config';
import s from './Faq.module.css';

export interface FaqItem {
  q: string;
  /** what visitors read */
  a: ReactNode;
  /** the same answer as plain text, published to search engines as structured data */
  text: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'What is Footlit?',
    a: <>Footlit is a free browser extension for GitHub. It plays a themed full-screen animation when you merge a pull request, finish checks, publish a release, put a Pages site live and more. There are six hand-built themes, and it works in Chrome and Firefox.</>,
    text: 'Footlit is a free browser extension for GitHub. It plays a themed full-screen animation when you merge a pull request, finish checks, publish a release, put a Pages site live and more. There are six hand-built themes, and it works in Chrome and Firefox.',
  },
  {
    q: 'Is it safe? What can it see?',
    a: <>It looks at the page address, the title and a few status labels on github.com, only to decide whether to play an animation. It makes no network requests, has no server and keeps its settings in your browser. The full list is on the <Link prefetch={false} href="/privacy/">privacy page</Link>.</>,
    text: 'Footlit looks at the page address, the title and a few status labels on github.com, only to decide whether to play an animation. It makes no network requests, has no server and keeps its settings in your browser.',
  },
  {
    q: 'Is Footlit free?',
    a: <>Yes. It is free, with no account, no ads and no sign-up.</>,
    text: 'Yes. Footlit is free, with no account, no ads and no sign-up.',
  },
  {
    q: 'Which browsers does it work in?',
    a: <>Chrome 111 or later and other Chromium browsers such as Brave. A Firefox build (version 140 or later) is available as a preview.</>,
    text: 'Chrome 111 or later and other Chromium browsers such as Brave. A Firefox build for version 140 or later is available as a preview.',
  },
  {
    q: 'Will it slow GitHub down?',
    a: <>No. It is one small script that glances at the page every second or so, and an overlay that exists for about four seconds when something happens. The overlay never captures clicks, and Esc dismisses it.</>,
    text: 'No. Footlit is one small script that glances at the page every second or so, and an overlay that exists for about four seconds when something happens. The overlay never captures clicks, and Esc dismisses it.',
  },
  {
    q: 'What if I open a pull request that was merged last week?',
    a: <>Nothing plays. Footlit only reacts to a change it sees happen while the tab is open: Open turning into Merged, checks finishing, a repo appearing after you create it.</>,
    text: 'Nothing plays. Footlit only reacts to a change it sees happen while the tab is open, such as Open turning into Merged, checks finishing, or a repository appearing after you create it.',
  },
  {
    q: 'Can I switch things off?',
    a: <>Yes, everything. Each of the eleven events has its own switch, there is a Quiet mode that pauses all shows for an hour, a Quiet theme that is just a small corner toast, and your system’s reduced-motion setting is respected.</>,
    text: 'Yes. Each of the eleven events has its own switch, there is a Quiet mode that pauses all shows for an hour, a Quiet theme that is just a small corner toast, and your system reduced-motion setting is respected.',
  },
  {
    q: 'Does it make noise?',
    a: <>No. Footlit is visual on purpose, so it is safe in an open office.</>,
    text: 'No. Footlit is visual only, so it is safe in an open office.',
  },
  {
    q: 'Does it work on GitHub Enterprise?',
    a: <>Not yet. It runs on github.com only.</>,
    text: 'Not yet. Footlit runs on github.com only.',
  },
  {
    q: 'How do updates work?',
    a: <>Installed from the Chrome Web Store, Footlit updates itself in the background. If you installed from the direct zip download, Chrome does not update it: download the latest zip, replace the files in your folder, and press reload on the extension. See the <Link prefetch={false} href="/changelog/">changelog</Link> for what is new.</>,
    text: 'Installed from the Chrome Web Store, Footlit updates itself in the background. If you installed from the direct zip download, Chrome does not update it: download the latest zip, replace the files in your folder, and press reload on the extension.',
  },
  site.chromeStoreUrl
    ? {
        q: 'Why does Chrome say it can “read and change your data on github.com”?',
        a: <>That is Chrome’s standard wording for any extension that runs a script on a website, and it describes what is possible, not what happens. Footlit asks for github.com only (never “all websites”), reads page labels locally to know when something happened, draws the animation, and sends nothing anywhere. The <Link prefetch={false} href="/privacy/">privacy page</Link> has the details.</>,
        text: 'That is Chrome’s standard wording for any extension that runs a script on a website, and it describes what is possible, not what happens. Footlit asks for github.com only, never all websites, reads page labels locally to know when something happened, draws the animation, and sends nothing anywhere.',
      }
    : {
        q: 'Why is it not on the Chrome Web Store yet?',
        a: <>The listing is coming. Until it is approved, you can install the exact same package from the direct download above in about a minute.</>,
        text: 'The store listing is coming. Until it is approved, you can install the exact same package from the direct download on this site in about a minute.',
      },
  {
    q: 'Something did not play. Why?',
    a: <>GitHub changes its pages from time to time. The settings page has an activity log showing what Footlit noticed, and a short help section. If it still misbehaves, tell me on any of the links in the footer and I will fix the detector.</>,
    text: 'GitHub changes its pages from time to time. The extension settings page has an activity log showing what Footlit noticed, and a short help section. If it still misbehaves, contact the developer through the links in the website footer.',
  },
  {
    q: 'Is it open source?',
    a: <>Not at the moment. Footlit is built and maintained by one person, and the source is not published yet.</>,
    text: 'Not at the moment. Footlit is built and maintained by one person, and the source is not published yet.',
  },
];

export function Faq() {
  return (
    <section id="faq" className={`paper2 ${s.section} band`} aria-labelledby="h-faq">
      <div className={`wrap ${s.grid}`}>
        <header>
          <p className="eyebrow">07 / Questions</p>
          <h2 id="h-faq" className={`display ${s.h2}`}>Fair<br />questions.</h2>
        </header>
        <div className={s.list}>
          {FAQ_ITEMS.map(({ q, a }) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
