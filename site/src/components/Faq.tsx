import Link from 'next/link';
import s from './Faq.module.css';

export const FAQ_ITEMS = [
  { q: 'Is it really free?', text: 'Yes. Footlit is free, with no account, ads, or subscription.' },
  { q: 'Will it interrupt my work?', text: 'Shows are brief and never capture clicks. Escape dismisses them. You can switch off individual events, pause all shows for an hour, or choose the small Quiet theme. System reduced-motion preferences are respected by default.' },
  { q: 'What happens to my data?', text: 'Footlit has no telemetry or analytics. It reads GitHub page labels to detect events and keeps a short activity log on your device. Your browser may sync your preferences between devices if browser sync is enabled.' },
  { q: 'Which browsers and sites are supported?', text: 'Chrome 111+ and Firefox 140+, on github.com. Install from the Chrome Web Store or Firefox Add-ons. GitHub Enterprise domains are not supported yet.' },
  { q: 'What if an animation does not play?', text: 'Reload your GitHub tab after installing. Check that Footlit and the event are enabled, then try Rehearse from the extension menu. Settings has an activity log for troubleshooting. GitHub page changes can affect detection; you can report a problem through the contact links below.' },
];

export function Faq() {
  return <section id="faq" className="paper band" aria-labelledby="h-faq"><div className={`wrap ${s.grid}`}><header><h2 id="h-faq" className={`display ${s.h2}`}>A few<br />good questions.</h2></header><div className={s.list}>{FAQ_ITEMS.map(({ q, text }) => <details key={q}><summary>{q}</summary><p>{text}{q === 'What happens to my data?' && <> <Link prefetch={false} href="/privacy/">Full privacy details.</Link></>}</p></details>)}</div></div></section>;
}
