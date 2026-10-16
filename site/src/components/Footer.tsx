import Link from 'next/link';
import { isDev, site } from '@/site.config';
import { TicketButton } from './TicketButton';
import { Down, Facebook, Instagram, WhatsApp } from './Icons';
import s from './Footer.module.css';

const SOCIAL = [
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'whatsapp', label: 'WhatsApp', Icon: WhatsApp },
] as const;

export function Footer() {
  const links = SOCIAL.map((x) => ({ ...x, href: site.social[x.key] })).filter((x) => x.href || isDev);
  return (
    <footer className={`ink ${s.footer}`}>
      <div className={`wrap ${s.top}`}>
        <div className={s.brand}>
          <p className={`display ${s.word}`} aria-hidden="true">Footlit</p>
          <p className={s.tag}>{site.tagline}</p>
          <TicketButton href="/#install" title="Get Footlit" stub="Free" tone="tungsten" size="sm" icon={<Down />} />
        </div>

        <nav className={s.cols} aria-label="Footer">
          <div>
            <p className="eyebrow">Explore</p>
            <ul>
              <li><Link prefetch={false} href="/themes/">Themes</Link></li>
              <li><Link prefetch={false} href="/events/">Events</Link></li>
              <li><Link prefetch={false} href="/#watch">Watch the demo</Link></li>
              <li><Link prefetch={false} href="/#install">Install</Link></li>
              <li><Link prefetch={false} href="/#faq">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Trust</p>
            <ul>
              <li><Link prefetch={false} href="/privacy/">Privacy policy</Link></li>
              <li><Link prefetch={false} href="/#trust">How it stays private</Link></li>
              <li><Link prefetch={false} href="/changelog/">Changelog</Link></li>
            </ul>
          </div>
        </nav>

        <div className={s.by}>
          <p className="eyebrow">Built by</p>
          <p className={`display ${s.name}`}>{site.author}</p>
          <p className={s.studio}>
            at <a href={site.agency.url} target="_blank" rel="noopener">{site.agency.name}</a>
          </p>
          <p className={s.say}>Say hello, report a bug, or tell me which theme you want next.</p>
          <ul className={s.social}>
            {links.map(({ key, label, Icon, href }) => (
              <li key={key}>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label}: ${site.author}`}>
                    <Icon /> <span>{label}</span>
                  </a>
                ) : (
                  <span className={s.placeholder} title={`Add your ${label} link in src/site.config.ts`}>
                    <Icon /> <span>{label}</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={`wrap ${s.legal}`}>
        <p>© {new Date().getFullYear()} Footlit. Built by {site.author} at <a href={site.agency.url} target="_blank" rel="noopener">{site.agency.name}</a>.</p>
        <p>Footlit is an independent project and is not affiliated with, endorsed by or sponsored by GitHub, Inc. GitHub is a trademark of GitHub, Inc.</p>
      </div>
    </footer>
  );
}
