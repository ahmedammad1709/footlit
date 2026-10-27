'use client';

import Link from 'next/link';
import { site } from '@/site.config';
import { TicketButton } from './TicketButton';
import { GitHub } from './Icons';
import s from './Nav.module.css';

const LINKS = [
  ['Watch', '/#watch'],
  ['How it works', '/#how'],
  ['Themes', '/#themes'],
  ['Events', '/#events'],
  ['Privacy', '/privacy/'],
] as const;

export function Nav() {
  return (
    <header className={s.nav}>
      <div className={`wrap ${s.row}`}>
        <Link prefetch={false} href="/" className={s.brand} aria-label="Footlit home">
          <img src="/logo.svg" width={36} height={36} alt="" />
          <span className="display">Footlit</span>
        </Link>
        <nav className={s.links} aria-label="Primary">
          {LINKS.map(([label, href]) => (
            <Link prefetch={false} key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        {site.repoUrl && (
          <a className={s.repo} href={site.repoUrl} target="_blank" rel="noopener noreferrer" aria-label="Footlit source code on GitHub (opens in a new tab)">
            <GitHub width={18} height={18} /> <span>GitHub</span>
          </a>
        )}
        <details className={s.mobile} onKeyDown={(e) => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}><summary>Menu</summary><nav aria-label="Mobile navigation">{LINKS.map(([label, href]) => <Link key={href} href={href} prefetch={false} onClick={(e) => e.currentTarget.closest('details')?.removeAttribute('open')}>{label}</Link>)}{site.repoUrl && <a href={site.repoUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}</nav></details>
        {site.chromeUsers && (
          <a className={s.proof} href={site.chromeStoreUrl || '/#install'} aria-label={`${site.chromeUsers} installs on Chrome`}>
            <i className={s.lamp} aria-hidden="true" />
            <b>{site.chromeUsers}</b> installs
          </a>
        )}
        <TicketButton href="/#install" title="Get Footlit" stub="Free" tone="ink" size="sm" />
      </div>
    </header>
  );
}
